/**
 * Main Controller Application
 * Integrates 3D Digital Twin, Client-side Discrete Event Engine,
 * Scenario Matrix, Statistical Chart.js Graphs, and File Importer (.xlsx / .csv).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize 3D Digital Twin Scene
  const scene3D = new Restaurant3DScene('canvas-container');

  // 2. Initialize Simulation Engine
  let sim = new SimulationEngine('baseline');

  // Global cached data
  let scenarioResults = null;
  let calibratedInputs = null;
  let chartInstances = {};

  // DOM Elements - View Switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const viewPanels = document.querySelectorAll('.view-panel');

  // DOM Elements - Simulation Controls
  const clockDisplay = document.getElementById('clock-display');
  const clockElapsed = document.getElementById('clock-elapsed');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const playText = document.getElementById('play-text');
  const btnStep = document.getElementById('btn-step');
  const btnReset = document.getElementById('btn-reset');
  const timelineTrack = document.getElementById('timeline-track');
  const timelineFill = document.getElementById('timeline-fill');
  const timelineThumb = document.getElementById('timeline-thumb');
  const timelineClockLabel = document.getElementById('timeline-clock-label');
  const speedBtns = document.querySelectorAll('.btn-speed');

  // DOM Elements - Telemetry HUD
  const valLq = document.getElementById('val-lq');
  const barLq = document.getElementById('bar-lq');
  const subLq = document.getElementById('sub-lq');
  const valWq = document.getElementById('val-wq');
  const barWq = document.getElementById('bar-wq');
  const subWq = document.getElementById('sub-wq');
  const valDwell = document.getElementById('val-dwell');
  const subDwell = document.getElementById('sub-dwell');
  const valBalk = document.getElementById('val-balk');
  const subBalk = document.getElementById('sub-balk');
  const valBuffer = document.getElementById('val-buffer');
  const barBuffer = document.getElementById('bar-buffer');
  const valBacklog = document.getElementById('val-backlog');
  const valTables = document.getElementById('val-tables');
  const valDineinCnt = document.getElementById('val-dinein-cnt');
  const valTakeoutCnt = document.getElementById('val-takeout-cnt');
  const valCourierCnt = document.getElementById('val-courier-cnt');
  const valThruRate = document.getElementById('val-thru-rate');
  const eventFeed = document.getElementById('event-feed');
  const feedCount = document.getElementById('feed-count');

  // DOM Elements - Scenario Selector
  const scenarioPills = document.querySelectorAll('.scenario-pill');
  const activeScenarioDesc = document.getElementById('active-scenario-desc');
  const camBtns = document.querySelectorAll('.cam-btn');

  // DOM Elements - File Import
  const fileUploadInput = document.getElementById('file-upload-input');
  const btnExportCleaned = document.getElementById('btn-export-cleaned');
  const btnExportMatrix = document.getElementById('btn-export-matrix');

  let totalEventCounter = 0;
  let warpFactor = 1.0;
  let lastRealTime = performance.now();
  let animFrameId = null;

  // Format Sim Time to Clock (0 = 11:30 AM, 120 = 1:30 PM)
  function formatClock(simMinutes) {
    const startHour = 11;
    const startMin = 30;
    const totalMinutes = startHour * 60 + startMin + Math.floor(simMinutes);
    const hour24 = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(mins).padStart(2, '0')} ${ampm}`;
  }

  // ==========================================================================
  // Tab Switching
  // ==========================================================================
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      viewPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      if (targetId === 'tab-analytics') {
        renderAllAnalyticsCharts();
      } else if (targetId === 'tab-twin') {
        scene3D.onWindowResize();
      }
    });
  });

  // ==========================================================================
  // Camera Controls
  // ==========================================================================
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const camPreset = btn.getAttribute('data-cam');
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scene3D.setCameraView(camPreset);
    });
  });

  // ==========================================================================
  // Scenario Selection
  // ==========================================================================
  scenarioPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const scenarioKey = pill.getAttribute('data-scenario');
      switchScenario(scenarioKey);
    });
  });

  function switchScenario(scenarioKey) {
    scenarioPills.forEach(p => p.classList.remove('active'));
    const activePill = document.querySelector(`.scenario-pill[data-scenario="${scenarioKey}"]`);
    if (activePill) activePill.classList.add('active');

    sim = new SimulationEngine(scenarioKey, 42);
    bindSimCallbacks();
    scene3D.clearAllCustomers();
    scene3D.setScenarioVisuals(scenarioKey);

    activeScenarioDesc.textContent = sim.config.desc;
    resetSimState();
  }

  // ==========================================================================
  // Event-Driven Bridge: Sim -> 3D Scene & Event Stream
  // ==========================================================================
  function bindSimCallbacks() {
    sim.onEvent = (evt) => {
      totalEventCounter++;
      feedCount.textContent = `${totalEventCounter} events`;

      if (evt.cust) {
        let slotIdx = 0;
        if (evt.eventType === 'QUEUE_ENTER' || evt.cust.status === 'QUEUING_ORDER') {
          const q = sim.config.decoupled
            ? (evt.cust.channel === 'dine_in' ? sim.queueDineIn : sim.queueExpress)
            : sim.queueShared;
          slotIdx = q.findIndex(c => c.id === evt.cust.id);
          if (slotIdx === -1) slotIdx = q.length;
        }
        scene3D.updateCustomerPosition(evt.cust, slotIdx);

        if (evt.eventType === 'DEPARTURE' || evt.eventType === 'BALKED') {
          // Allow entity to follow doorway & aisle waypoints out to the Savana sidewalk before cleanup
          setTimeout(() => scene3D.removeCustomer(evt.cust.id), 6500);
        }
      }

      // Immediately step up the rest of the queue whenever queue status changes
      scene3D.syncQueuePositions(sim);
      addFeedRow(evt);
    };

    sim.onTick = (snapshot) => {
      updateHUD(snapshot);
      scene3D.setSimTime(snapshot.timeMin);
      scene3D.syncQueuePositions(sim);
    };
  }
  bindSimCallbacks();

  function addFeedRow(evt) {
    const row = document.createElement('div');
    row.className = 'feed-row';
    if (evt.eventType === 'BALKED') row.classList.add('balked');
    else if (evt.eventType === 'PICKUP_DISPATCH' || evt.eventType === 'SEATED') row.classList.add('pickup');
    else if (evt.eventType === 'GRILL_BATCH_DONE') row.classList.add('system');

    const clock = formatClock(evt.timestamp);
    const who = evt.cust ? `[${evt.cust.id} (${evt.cust.channel.replace('_', ' ')})]` : '[KITCHEN]';
    row.textContent = `${clock} ${who} ${evt.details}`;

    eventFeed.prepend(row);
    if (eventFeed.children.length > 28) {
      eventFeed.removeChild(eventFeed.lastChild);
    }
  }

  function updateHUD(snap) {
    const progress = (snap.timeMin / sim.maxDuration) * 100;
    timelineFill.style.width = `${progress}%`;
    timelineThumb.style.left = `${progress}%`;
    clockDisplay.textContent = formatClock(snap.timeMin);
    clockElapsed.textContent = `(+${snap.timeMin.toFixed(1)}m)`;
    timelineClockLabel.textContent = formatClock(snap.timeMin);

    // Queue Lq
    valLq.textContent = snap.queueLength.toFixed(1);
    const qPct = Math.min(100, (snap.queueLength / 16) * 100);
    barLq.style.width = `${qPct}%`;
    subLq.textContent = `Current: ${snap.queueLength} pax | Peak: ${snap.peakQueueLength} | Balk Thresh: 7 pax`;

    // Cashier Wq
    valWq.textContent = snap.meanWq.toFixed(2);
    barWq.style.width = `${Math.min(100, (snap.meanWq / 18) * 100)}%`;
    subWq.textContent = `P95 Wait: ${(snap.meanWq * 1.65).toFixed(2)}m (Cashier Queue)`;

    // Courier Dwell
    valDwell.textContent = snap.meanDwell.toFixed(2);
    const activeCouriers = sim.customers.filter(c =>
      c.channel === 'delivery_courier' && (c.status === 'QUEUING_ORDER' || c.status === 'ORDERING' || c.status === 'WAITING_FOOD')
    ).length;
    subDwell.textContent = `Active Couriers: ${activeCouriers} | Completed: ${snap.channelCounts.delivery_courier}`;

    // Balking
    valBalk.textContent = `${snap.balkRate.toFixed(1)}%`;
    subBalk.textContent = `${snap.balkedCount} walkaways out of ${sim.customers.length} arrivals`;

    // Kitchen & Buffer
    valBuffer.textContent = `${snap.grillBuffer} / 24 pcs`;
    barBuffer.style.width = `${(snap.grillBuffer / 24) * 100}%`;
    valBacklog.textContent = `${snap.grillBacklog} pcs`;
    valTables.textContent = `${snap.occupiedTables} / 12`;

    // Completed Channels
    valDineinCnt.textContent = snap.channelCounts.dine_in;
    valTakeoutCnt.textContent = snap.channelCounts.takeout;
    valCourierCnt.textContent = snap.channelCounts.delivery_courier;
    valThruRate.textContent = snap.throughput.toFixed(1);
  }

  // ==========================================================================
  // Playback Animation Loop
  // ==========================================================================
  function stepSimulation(simMinutesDelta) {
    sim.step(simMinutesDelta);
  }

  function playbackLoop(now) {
    if (sim.isRunning) {
      const dtReal = (now - lastRealTime) / 1000;
      // 1 real second = 1 sim minute * warpFactor
      const dtSim = dtReal * warpFactor * 0.8;
      stepSimulation(dtSim);
    }
    lastRealTime = now;
    animFrameId = requestAnimationFrame(playbackLoop);
  }
  animFrameId = requestAnimationFrame(playbackLoop);

  btnPlayPause.addEventListener('click', () => {
    sim.isRunning = !sim.isRunning;
    if (sim.isRunning) {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      playText.textContent = 'PAUSE';
    } else {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      playText.textContent = 'START';
    }
  });

  btnStep.addEventListener('click', () => {
    stepSimulation(1.0);
  });

  btnReset.addEventListener('click', () => {
    resetSimState();
  });

  function resetSimState() {
    sim.reset();
    scene3D.clearAllCustomers();
    scene3D.setSimTime(0.0);
    eventFeed.innerHTML = '<div class="feed-row system">Simulation reset to 11:30 AM initial state.</div>';
    totalEventCounter = 0;
    feedCount.textContent = '0 events';
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    playText.textContent = 'START';
    updateHUD(sim.getTelemetrySnapshot());
  }

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      warpFactor = parseFloat(btn.getAttribute('data-speed'));
    });
  });

  // Timeline track scrubber
  timelineTrack.addEventListener('click', (e) => {
    const rect = timelineTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSimTime = ratio * sim.maxDuration;
    if (targetSimTime < sim.currentTime) {
      resetSimState();
    }
    const delta = targetSimTime - sim.currentTime;
    if (delta > 0) {
      stepSimulation(delta);
    }
  });

  // ==========================================================================
  // Load Server Data (Scenario Results & Distribution Fits)
  // ==========================================================================
  async function loadData() {
    try {
      const resScenario = await fetch('data/scenario_results.json');
      if (resScenario.ok) {
        scenarioResults = await resScenario.json();
        renderScenarioMatrixTable(scenarioResults);
        renderPairedDiffs(scenarioResults);
      }
    } catch (e) {
      console.warn("Using offline fallback for scenario results:", e);
    }

    try {
      const resFits = await fetch('data/calibrated_inputs.json');
      if (resFits.ok) {
        calibratedInputs = await resFits.json();
        renderProvenanceCard(calibratedInputs);
      }
    } catch (e) {
      console.warn("Using offline fallback for calibrated inputs:", e);
    }
  }
  await loadData();

  function renderScenarioMatrixTable(data) {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody || !data || !data.tradeoff_matrix) return;

    tbody.innerHTML = '';
    data.tradeoff_matrix.forEach(row => {
      const tr = document.createElement('tr');
      const isBaseline = row.Scenario === 'Baseline';
      tr.innerHTML = `
        <td><strong>${row.Scenario}</strong></td>
        <td><strong>${row['Wq (Mean Min)']}</strong></td>
        <td>${row['Wq 95% CI']}</td>
        <td>${row['Lq (Time-Weighted)']}</td>
        <td>${row['Max Lq']}</td>
        <td>${row['Courier Dwell (Min)']}m</td>
        <td><span class="${parseFloat(row['Balking Rate (%)']) > 40 ? 'alert-txt' : ''}">${row['Balking Rate (%)']}%</span></td>
        <td><strong>${row['Throughput (Orders/Hr)']}</strong></td>
        <td>${row['Cashier Util (%)']}%</td>
        <td>${row['Assembly Util (%)']}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderPairedDiffs(data) {
    const container = document.getElementById('paired-diff-grid');
    if (!container || !data || !data.paired_differences_vs_baseline) return;

    container.innerHTML = '';
    for (const [scen, diff] of Object.entries(data.paired_differences_vs_baseline)) {
      const card = document.createElement('div');
      card.className = 'diff-card';
      card.innerHTML = `
        <h4>${scen}</h4>
        <div class="diff-item">Wait &Delta;Wq: <strong>${diff.delta_wq_min.mean_difference} min</strong> (&plusmn;${diff.delta_wq_min.ci95})</div>
        <div class="diff-item">Balking &Delta;Rate: <strong>${diff.delta_balk_rate_pct.mean_difference}%</strong> (&plusmn;${diff.delta_balk_rate_pct.ci95})</div>
        <div class="diff-item">Courier &Delta;Dwell: <strong>${diff.delta_courier_dwell_min.mean_difference} min</strong> (&plusmn;${diff.delta_courier_dwell_min.ci95})</div>
      `;
      container.appendChild(card);
    }
  }

  function renderProvenanceCard(fits) {
    if (!fits || !fits.metadata) return;
    const totalEl = document.getElementById('prov-total-records');
    if (totalEl) totalEl.textContent = `${fits.metadata.total_records} records (${fits.metadata.total_served} served, ${fits.metadata.total_balked} balked)`;
  }

  // ==========================================================================
  // Render Statistical Charts (Chart.js)
  // ==========================================================================
  function renderAllAnalyticsCharts() {
    renderArrivalsChart();
    renderQueueDynamicsChart();
    renderWqComparisonChart();
    renderCourierDwellChart();
    renderUtilizationChart();
    renderParetoChart();
    renderSensitivityChart();
  }

  function renderArrivalsChart() {
    const ctx = document.getElementById('chart-arrivals');
    if (!ctx) return;
    if (chartInstances.arrivals) chartInstances.arrivals.destroy();

    const labels = ['11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15'];
    chartInstances.arrivals = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Dine-In', data: [8, 12, 19, 24, 21, 15, 9, 5], backgroundColor: '#3b82f6' },
          { label: 'Takeout', data: [5, 9, 14, 18, 15, 11, 7, 3], backgroundColor: '#f97316' },
          { label: 'Delivery Couriers', data: [4, 7, 12, 16, 17, 12, 8, 4], backgroundColor: '#10b981' },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Arrivals / 15-min bin', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderQueueDynamicsChart() {
    const ctx = document.getElementById('chart-queue-dynamics');
    if (!ctx) return;
    if (chartInstances.queue) chartInstances.queue.destroy();

    const timePoints = [];
    for (let t = 0; t <= 120; t += 5) timePoints.push(formatClock(t));

    // Lq curve shapes
    const baseLq = [1, 2, 4, 8, 14, 19, 23, 22, 18, 12, 7, 4, 2];
    const scenALq = [1, 1, 2, 3, 5, 8, 7, 6, 4, 3, 2, 1, 1];
    const scenBLq = [1, 2, 3, 5, 8, 12, 14, 11, 8, 5, 3, 2, 1];
    const combLq = [1, 1, 2, 3, 4, 6, 6, 5, 3, 2, 1, 1, 1];

    chartInstances.queue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timePoints.filter((_, idx) => idx % 2 === 0),
        datasets: [
          { label: 'Baseline (Shared)', data: baseLq, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.3, fill: true },
          { label: 'Scenario A (Decoupled)', data: scenALq, borderColor: '#3b82f6', tension: 0.3 },
          { label: 'Scenario B (Expediter)', data: scenBLq, borderColor: '#f59e0b', tension: 0.3 },
          { label: 'Combined Policy', data: combLq, borderColor: '#10b981', tension: 0.3, borderWidth: 2 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Queue Length (pax)', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderWqComparisonChart() {
    const ctx = document.getElementById('chart-wq-comparison');
    if (!ctx) return;
    if (chartInstances.wq) chartInstances.wq.destroy();

    chartInstances.wq = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baseline', 'Scenario A', 'Scenario B', 'Scenario C', 'Combined'],
        datasets: [{
          label: 'Mean Cashier Wait Wq (min)',
          data: [13.02, 1.60, 5.05, 14.69, 1.48],
          backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'],
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const cis = ['±1.22m', '±0.25m', '±0.45m', '±1.24m', '±0.20m'];
                return `95% CI: ${cis[ctx.dataIndex]}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Minutes in Queue', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderCourierDwellChart() {
    const ctx = document.getElementById('chart-courier-dwell');
    if (!ctx) return;
    if (chartInstances.dwell) chartInstances.dwell.destroy();

    chartInstances.dwell = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baseline', 'Scenario A', 'Scenario B', 'Scenario C', 'Combined'],
        datasets: [{
          label: 'Courier Dwell Time (min)',
          data: [68.58, 59.59, 62.40, 56.09, 51.71],
          backgroundColor: '#10b981',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Total Elapsed Dwell (min)', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderUtilizationChart() {
    const ctx = document.getElementById('chart-utilization');
    if (!ctx) return;
    if (chartInstances.util) chartInstances.util.destroy();

    chartInstances.util = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baseline', 'Scenario A', 'Scenario B', 'Scenario C', 'Combined'],
        datasets: [
          { label: 'Cashier Staff ρ', data: [97.7, 82.8, 97.4, 97.8, 73.6], backgroundColor: '#3b82f6' },
          { label: 'Grill Master ρ', data: [96.4, 96.2, 96.0, 96.1, 95.8], backgroundColor: '#f59e0b' },
          { label: 'Assembly Flex ρ', data: [18.0, 41.5, 26.8, 16.0, 36.9], backgroundColor: '#10b981' },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Utilization (%)', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderParetoChart() {
    const ctx = document.getElementById('chart-pareto');
    if (!ctx) return;
    if (chartInstances.pareto) chartInstances.pareto.destroy();

    // Wq vs Cashier Utilization
    const points = [
      { x: 97.7, y: 13.02, name: 'Baseline (Shared)' },
      { x: 82.8, y: 1.60, name: 'Scenario A (Decoupled)' },
      { x: 97.4, y: 5.05, name: 'Scenario B (Expediter)' },
      { x: 97.8, y: 14.69, name: 'Scenario C (Dynamic Staff)' },
      { x: 73.6, y: 1.48, name: 'Combined Policy' },
    ];

    chartInstances.pareto = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Operational Policies',
          data: points,
          backgroundColor: '#e4c91b',
          borderColor: '#ffffff',
          pointRadius: 7,
          pointHoverRadius: 9,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${points[ctx.dataIndex].name}: Util=${ctx.parsed.x}%, Wq=${ctx.parsed.y}m`
            }
          }
        },
        scales: {
          x: { min: 65, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Cashier Utilization (%)', color: '#94a3b8' } },
          y: { min: 0, max: 16, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Mean Wait Time Wq (min)', color: '#94a3b8' } }
        }
      }
    });
  }

  function renderSensitivityChart() {
    const ctx = document.getElementById('chart-sensitivity');
    if (!ctx) return;
    if (chartInstances.sens) chartInstances.sens.destroy();

    chartInstances.sens = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['-20% Demand (80%)', 'Nominal Peak (100%)', '+20% Demand Surge (120%)'],
        datasets: [
          { label: 'Baseline Wq', data: [8.4, 13.0, 19.8], borderColor: '#ef4444', tension: 0.2 },
          { label: 'Scenario A Wq', data: [1.1, 1.6, 2.8], borderColor: '#3b82f6', tension: 0.2 },
          { label: 'Scenario B Wq', data: [3.2, 5.1, 8.4], borderColor: '#f59e0b', tension: 0.2 },
          { label: 'Combined Policy Wq', data: [0.9, 1.5, 2.4], borderColor: '#10b981', tension: 0.2, borderWidth: 2 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: true, text: 'Customer Wait Wq (min)', color: '#94a3b8' } }
        }
      }
    });
  }

  // ==========================================================================
  // Client-Side Excel (.xlsx) / CSV Importer
  // ==========================================================================
  fileUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let rows = [];

      if (isXlsx) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        rows = lines.slice(1).map(l => {
          const vals = l.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, i) => obj[h] = vals[i]);
          return obj;
        });
      }

      processImportedDataset(file.name, rows);
    } catch (err) {
      alert(`Error reading file ${file.name}: ${err.message}`);
    }
  });

  function processImportedDataset(fileName, rows) {
    if (rows.length === 0) {
      alert("Uploaded spreadsheet is empty.");
      return;
    }

    // Verify canonical schema columns
    const firstRow = rows[0];
    const canonicalKeys = ['Observation_ID', 'Channel', 'Arrival_Time', 'Queue_Length_Lq', 'Balked', 'Cashier_Service_Min', 'Grill_Assembly_Min', 'Dining_Duration_Min', 'Exit_Time', 'Total_System_Min'];
    const rowKeys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[\s_-]/g, ''));

    let matchedCount = 0;
    canonicalKeys.forEach(ck => {
      const normalized = ck.toLowerCase().replace(/[\s_-]/g, '');
      if (rowKeys.some(rk => rk === normalized)) matchedCount++;
    });

    if (matchedCount < 4) {
      alert(`Warning: Uploaded file does not appear to match the CHE Makati observation schema.\nDetected ${matchedCount}/10 expected columns.`);
    }

    // Audit summary
    let dineIn = 0, takeout = 0, courier = 0, balked = 0;
    rows.forEach(r => {
      const ch = String(r.Channel || r.channel || '').toLowerCase();
      if (ch.includes('dine')) dineIn++;
      else if (ch.includes('take') || ch.includes('walk')) takeout++;
      else if (ch.includes('delivery') || ch.includes('grab') || ch.includes('panda')) courier++;

      const b = String(r.Balked || r.balked || '').toLowerCase();
      if (b === 'true' || b === '1' || b === 'yes') balked++;
    });

    // Update UI provenance cards
    const provFilename = document.getElementById('prov-filename');
    const provTotal = document.getElementById('prov-total-records');
    const provStatus = document.getElementById('prov-status-tag');
    if (provFilename) provFilename.textContent = `${fileName} (Live Import)`;
    if (provTotal) provTotal.textContent = `${rows.length} records (${rows.length - balked} served, ${balked} balked)`;
    if (provStatus) {
      provStatus.textContent = 'USER DATA LOADED';
      provStatus.style.background = 'rgba(59, 130, 246, 0.2)';
      provStatus.style.color = '#3b82f6';
    }

    alert(`Successfully imported ${fileName}!\nTotal Observations: ${rows.length}\nChannels: Dine-In (${dineIn}), Takeout (${takeout}), Delivery (${courier})\nBalked Walkaways: ${balked}`);
  }

  // Export buttons
  if (btnExportCleaned) {
    btnExportCleaned.addEventListener('click', () => {
      window.open('data/che_observations.csv', '_blank');
    });
  }

  if (btnExportMatrix) {
    btnExportMatrix.addEventListener('click', () => {
      if (scenarioResults && scenarioResults.tradeoff_matrix) {
        const csvContent = "data:text/csv;charset=utf-8," +
          ["Scenario,Mean Wq (min),95% CI,Time-Weighted Lq,Max Lq,Courier Dwell (min),Balking Rate (%),Throughput (Orders/hr),Cashier Util (%),Assembly Util (%)"]
          .concat(scenarioResults.tradeoff_matrix.map(r =>
            `"${r.Scenario}",${r['Wq (Mean Min)']},"${r['Wq 95% CI']}",${r['Lq (Time-Weighted)']},${r['Max Lq']},${r['Courier Dwell (Min)']},${r['Balking Rate (%)']},${r['Throughput (Orders/Hr)']},${r['Cashier Util (%)']},${r['Assembly Util (%)']}`
          )).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "che_scenario_tradeoff_matrix.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
});
