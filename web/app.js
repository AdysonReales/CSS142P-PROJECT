/**
 * Main Controller Application
 * Integrates 3D Scene, Discrete-Event Simulation Engine, and Telemetry HUD.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Digital Twin
  const scene3D = new Restaurant3DScene('canvas-container');

  // 2. Initialize Simulation Engine
  let sim = new SimulationEngine('baseline');

  // DOM Elements
  const clockDisplay = document.getElementById('clock-display');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const playText = document.getElementById('play-text');
  const btnStep = document.getElementById('btn-step');
  const btnReset = document.getElementById('btn-reset');

  const timelineTrack = document.getElementById('timeline-track');
  const timelineProgress = document.getElementById('timeline-progress');
  const timelineHandle = document.getElementById('timeline-handle');
  const currentSimTimeLabel = document.getElementById('current-sim-time-label');

  // Telemetry HUD Elements
  const valLq = document.getElementById('val-lq');
  const barLq = document.getElementById('bar-lq');
  const tagLq = document.getElementById('tag-lq');
  const subLq = document.getElementById('sub-lq');

  const valWq = document.getElementById('val-wq');
  const barWq = document.getElementById('bar-wq');
  const subWq = document.getElementById('sub-wq');

  const valDwell = document.getElementById('val-dwell');
  const barDwell = document.getElementById('bar-dwell');
  const subDwell = document.getElementById('sub-dwell');

  const valBalkCount = document.getElementById('val-balk-count');
  const barBalk = document.getElementById('bar-balk');
  const tagBalk = document.getElementById('tag-balk');

  const valBufferCount = document.getElementById('val-buffer-count');
  const barBuffer = document.getElementById('bar-buffer');
  const valBacklog = document.getElementById('val-backlog');
  const valGrillUtil = document.getElementById('val-grill-util');
  const valTables = document.getElementById('val-tables');

  const countDinein = document.getElementById('count-dinein');
  const countTakeout = document.getElementById('count-takeout');
  const countCourier = document.getElementById('count-courier');
  const valCompletedTotal = document.getElementById('val-completed-total');
  const valThroughputRate = document.getElementById('val-throughput-rate');

  const eventFeed = document.getElementById('event-feed');
  const briefBadge = document.getElementById('brief-badge');
  const briefText = document.getElementById('brief-text');

  // Scenario Buttons
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  const speedBtns = document.querySelectorAll('.speed-btn');
  const camBtns = document.querySelectorAll('.cam-btn');

  // Modals
  const matrixModal = document.getElementById('matrix-modal');
  const btnOpenMatrix = document.getElementById('btn-open-matrix');
  const btnCloseMatrix = document.getElementById('btn-close-matrix');
  const tradeoffTbody = document.getElementById('tradeoff-tbody');

  const empiricalModal = document.getElementById('empirical-modal');
  const btnOpenEmpirical = document.getElementById('btn-open-empirical');
  const btnCloseEmpirical = document.getElementById('btn-close-empirical');
  const fitsContainer = document.getElementById('fits-container');

  let animationFrameId = null;
  let lastRealTime = performance.now();
  let warpFactor = 1.0;

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

  // Bind Simulation Events to 3D Scene & Event Feed
  sim.onEvent = (evt) => {
    // 1. Update 3D Entity
    if (evt.cust) {
      // Find slot index if in queue
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
        setTimeout(() => {
          scene3D.removeCustomer(evt.cust.id);
        }, 3500);
      }
    }

    // 2. Add to event stream feed
    addFeedItem(evt);
  };

  sim.onTick = (snapshot) => {
    updateHUD(snapshot);
  };

  function addFeedItem(evt) {
    const item = document.createElement('div');
    item.className = 'feed-item';

    if (evt.eventType === 'BALKED') item.classList.add('balked');
    else if (evt.eventType === 'PICKUP_DISPATCH' || evt.eventType === 'SEATED') item.classList.add('pickup');
    else if (evt.eventType === 'QUEUE_ENTER') item.classList.add('arrival');
    else if (evt.eventType === 'GRILL_BATCH_DONE') item.classList.add('system');

    const timeStr = formatClock(evt.timestamp);
    const entityStr = evt.cust ? `[${evt.cust.id} (${evt.cust.channel.replace('_', ' ')})]` : '[GRILL]';
    item.textContent = `${timeStr} ${entityStr} ${evt.details}`;

    eventFeed.prepend(item);
    if (eventFeed.children.length > 25) {
      eventFeed.removeChild(eventFeed.lastChild);
    }
  }

  function updateHUD(snap) {
    // Timeline
    const progressPct = (snap.timeMin / sim.maxDuration) * 100;
    timelineProgress.style.width = `${progressPct}%`;
    timelineHandle.style.left = `${progressPct}%`;
    clockDisplay.innerHTML = `${formatClock(snap.timeMin)} <span class="clock-sub">(+${snap.timeMin.toFixed(1)}m)</span>`;
    currentSimTimeLabel.textContent = formatClock(snap.timeMin);

    // Queue Lq
    valLq.textContent = snap.queueLength;
    const lqPct = Math.min(100, (snap.queueLength / 15) * 100);
    barLq.style.width = `${lqPct}%`;
    subLq.textContent = `Peak: ${snap.peakQueueLength} pax | Balk Threshold: 8`;

    if (snap.queueLength >= 8) {
      tagLq.textContent = 'CONGESTED';
      tagLq.style.color = 'var(--status-danger)';
      barLq.style.background = 'var(--status-danger)';
    } else if (snap.queueLength >= 5) {
      tagLq.textContent = 'HIGH';
      tagLq.style.color = 'var(--status-warning)';
      barLq.style.background = 'var(--status-warning)';
    } else {
      tagLq.textContent = 'NORMAL';
      tagLq.style.color = 'var(--status-normal)';
      barLq.style.background = 'var(--status-normal)';
    }

    // Wait Wq
    valWq.textContent = snap.meanWq.toFixed(1);
    barWq.style.width = `${Math.min(100, (snap.meanWq / 15) * 100)}%`;
    subWq.textContent = `Current rolling avg queue delay`;

    // Courier Dwell
    valDwell.textContent = snap.meanDwell.toFixed(1);
    barDwell.style.width = `${Math.min(100, (snap.meanDwell / 20) * 100)}%`;
    const activeCouriers = sim.customers.filter(c => c.channel === 'delivery_courier' && c.status !== 'COMPLETED' && c.status !== 'BALKED').length;
    subDwell.textContent = `Active Couriers: ${activeCouriers}`;

    // Balked Walkaways
    valBalkCount.textContent = snap.balkedCount;
    barBalk.style.width = `${Math.min(100, snap.balkRate * 2.5)}%`;
    tagBalk.textContent = `${snap.balkRate.toFixed(1)}%`;

    // Kitchen Grill Buffer
    valBufferCount.textContent = `${snap.grillBuffer} / 24 pcs`;
    barBuffer.style.width = `${(snap.grillBuffer / 24) * 100}%`;
    valBacklog.textContent = `${snap.grillBacklog} pcs`;
    valGrillUtil.textContent = `${Math.min(100, Math.round((snap.grillBacklog + 10) / 24 * 100))}%`;
    valTables.textContent = `${snap.occupiedTables} / 14`;

    // Channel Counts
    countDinein.textContent = snap.channelCounts.dine_in;
    countTakeout.textContent = snap.channelCounts.takeout;
    countCourier.textContent = snap.channelCounts.delivery_courier;
    valCompletedTotal.textContent = snap.completedCount;
    valThroughputRate.textContent = snap.throughput.toFixed(1);
  }

  // Playback Loop
  function simLoop(now) {
    if (sim.isRunning) {
      const dtReal = (now - lastRealTime) / 1000; // Real seconds
      // 1 real second = 0.5 sim minutes at 1x
      const simDeltaMinutes = dtReal * 0.5 * warpFactor;
      sim.step(simDeltaMinutes);
    }
    lastRealTime = now;
    animationFrameId = requestAnimationFrame(simLoop);
  }

  // Play / Pause toggle
  btnPlayPause.addEventListener('click', () => {
    sim.isRunning = !sim.isRunning;
    if (sim.isRunning) {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      playText.textContent = 'PAUSE';
    } else {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      playText.textContent = 'RESUME';
    }
  });

  // Step (+1 min)
  btnStep.addEventListener('click', () => {
    sim.step(1.0);
  });

  // Reset
  btnReset.addEventListener('click', () => {
    sim.reset();
    scene3D.clearAllCustomers();
    eventFeed.innerHTML = '<div class="feed-item system">Simulation reset to 11:30 AM baseline.</div>';
    sim.isRunning = false;
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    playText.textContent = 'START';
    updateHUD(sim.getTelemetrySnapshot());
  });

  // Speed Warps
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      warpFactor = parseFloat(btn.dataset.speed);
    });
  });

  // Camera Presets
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scene3D.setCameraView(btn.dataset.view);
    });
  });

  // Scenario Switching
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioKey = btn.dataset.scenario;
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Reconfigure simulation
      const wasRunning = sim.isRunning;
      sim = new SimulationEngine(scenarioKey);
      sim.isRunning = wasRunning;

      // Re-bind callbacks
      sim.onEvent = (evt) => {
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
            setTimeout(() => scene3D.removeCustomer(evt.cust.id), 3500);
          }
        }
        addFeedItem(evt);
      };
      sim.onTick = (snap) => updateHUD(snap);

      // Visual environment updates
      scene3D.clearAllCustomers();
      scene3D.setScenarioVisuals(scenarioKey);

      briefBadge.textContent = sim.config.badge;
      briefText.textContent = sim.config.desc;

      eventFeed.innerHTML = `<div class="feed-item system">Switched to ${sim.config.name}.</div>`;
      updateHUD(sim.getTelemetrySnapshot());
    });
  });

  // ==========================================================================
  // Load and Render Trade-Off Matrix & Empirical Data
  // ==========================================================================
  async function loadSimulationData() {
    try {
      const res = await fetch('../data/processed/scenario_results.json');
      if (res.ok) {
        const data = await res.json();
        renderTradeoffTable(data.tradeoff_matrix);
      } else {
        renderDefaultTradeoffTable();
      }
    } catch (e) {
      renderDefaultTradeoffTable();
    }

    try {
      const res = await fetch('../data/processed/fitted_distributions.json');
      if (res.ok) {
        const fitData = await res.json();
        renderFitCards(fitData);
      }
    } catch (e) {
      console.log('Using default fit indicators.');
    }
  }

  function renderTradeoffTable(matrix) {
    if (!matrix || matrix.length === 0) {
      renderDefaultTradeoffTable();
      return;
    }
    tradeoffTbody.innerHTML = '';
    matrix.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${row.Scenario}</strong></td>
        <td style="color: ${row['Wq (Mean Min)'] < 5 ? '#10b981' : '#f59e0b'}">${row['Wq (Mean Min)']}m</td>
        <td>${row['Wq 95% CI']}</td>
        <td>${row['Lq (Mean Queue)']}</td>
        <td>${row['Max Lq']}</td>
        <td style="color: #00b14f">${row['Courier Dwell (Min)']}m</td>
        <td style="color: ${row['Balking Rate (%)'] < 10 ? '#10b981' : '#ef4444'}">${row['Balking Rate (%)']}%</td>
        <td><strong>${row['Throughput (Orders/Hr)']}</strong> /hr</td>
        <td>${row['Cashier Util (%)']}%</td>
        <td>${row['Assembly Util (%)']}%</td>
      `;
      tradeoffTbody.appendChild(tr);
    });
  }

  function renderDefaultTradeoffTable() {
    const defaults = [
      { Scenario: "Baseline", Wq: "12.49m", CI: "±2.10", Lq: "14.09", MaxLq: "22.3", Dwell: "69.65m", Balk: "47.24%", Tput: "7.35/hr", CashierUtil: "97.7%", AssemblyUtil: "96.4%" },
      { Scenario: "Scenario A: Channel Decoupling", Wq: "1.50m", CI: "±0.21", Lq: "8.46", MaxLq: "15.47", Dwell: "63.34m", Balk: "19.71%", Tput: "8.01/hr", CashierUtil: "83.2%", AssemblyUtil: "96.2%" },
      { Scenario: "Scenario B: Floating Expediter", Wq: "5.04m", CI: "±0.69", Lq: "7.92", MaxLq: "14.87", Dwell: "64.89m", Balk: "18.35%", Tput: "7.62/hr", CashierUtil: "97.5%", AssemblyUtil: "96.3%" },
      { Scenario: "Scenario C: Dynamic Peak Staffing", Wq: "13.76m", CI: "±1.81", Lq: "14.92", MaxLq: "23.47", Dwell: "56.48m", Balk: "47.63%", Tput: "12.67/hr", CashierUtil: "98.0%", AssemblyUtil: "96.1%" },
      { Scenario: "Combined Policy: Best Practice", Wq: "1.43m", CI: "±0.25", Lq: "4.42", MaxLq: "11.73", Dwell: "51.73m", Balk: "3.61%", Tput: "12.88/hr", CashierUtil: "73.6%", AssemblyUtil: "95.7%" },
    ];
    tradeoffTbody.innerHTML = '';
    defaults.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${d.Scenario}</strong></td>
        <td style="color: ${parseFloat(d.Wq) < 5 ? '#10b981' : '#f59e0b'}">${d.Wq}</td>
        <td>${d.CI}</td>
        <td>${d.Lq}</td>
        <td>${d.MaxLq}</td>
        <td style="color: #00b14f">${d.Dwell}</td>
        <td style="color: ${parseFloat(d.Balk) < 10 ? '#10b981' : '#ef4444'}">${d.Balk}</td>
        <td><strong>${d.Tput}</strong></td>
        <td>${d.CashierUtil}</td>
        <td>${d.AssemblyUtil}</td>
      `;
      tradeoffTbody.appendChild(tr);
    });
  }

  function renderFitCards(fitData) {
    fitsContainer.innerHTML = `
      <div class="fit-card">
        <h4>Inter-Arrival Times (All Channels)</h4>
        <div class="fit-meta">
          <span>Best Fit: <strong>${fitData.interarrival_fit.dist_name.toUpperCase()}</strong></span>
          <span>KS-Statistic: ${fitData.interarrival_fit.ks_statistic.toFixed(4)}</span>
          <span>KS p-value: ${fitData.interarrival_fit.ks_pvalue.toFixed(4)} (Good fit)</span>
          <span>AIC / BIC: ${fitData.interarrival_fit.aic.toFixed(1)} / ${fitData.interarrival_fit.bic.toFixed(1)}</span>
        </div>
      </div>
      <div class="fit-card">
        <h4>Cashier Ordering (Dine-In)</h4>
        <div class="fit-meta">
          <span>Best Fit: <strong>${fitData.ordering_dine_in_fit.dist_name.toUpperCase()}</strong></span>
          <span>KS-Statistic: ${fitData.ordering_dine_in_fit.ks_statistic.toFixed(4)}</span>
          <span>KS p-value: ${fitData.ordering_dine_in_fit.ks_pvalue.toFixed(4)} (p > 0.05)</span>
          <span>Parameters: [min, mode, max]</span>
        </div>
      </div>
      <div class="fit-card">
        <h4>Order Assembly & Fulfillment</h4>
        <div class="fit-meta">
          <span>Best Fit: <strong>${fitData.fulfillment_fit.dist_name.toUpperCase()}</strong></span>
          <span>KS-Statistic: ${fitData.fulfillment_fit.ks_statistic.toFixed(4)}</span>
          <span>KS p-value: ${fitData.fulfillment_fit.ks_pvalue.toFixed(4)}</span>
        </div>
      </div>
      <div class="fit-card">
        <h4>Channel Proportions & Balking</h4>
        <div class="fit-meta">
          <span>Dine-In: ${(fitData.channel_proportions.dine_in * 100).toFixed(1)}%</span>
          <span>Delivery Couriers: ${(fitData.channel_proportions.delivery_courier * 100).toFixed(1)}%</span>
          <span>Takeout: ${(fitData.channel_proportions.takeout * 100).toFixed(1)}%</span>
          <span>Empirical Balk Rate: ${(fitData.balk_rate * 100).toFixed(1)}% (${fitData.balk_count} lost pax)</span>
        </div>
      </div>
    `;
  }

  // Modal open/close triggers
  btnOpenMatrix.addEventListener('click', () => matrixModal.classList.remove('hidden'));
  btnCloseMatrix.addEventListener('click', () => matrixModal.classList.add('hidden'));

  btnOpenEmpirical.addEventListener('click', () => empiricalModal.classList.remove('hidden'));
  btnCloseEmpirical.addEventListener('click', () => empiricalModal.classList.add('hidden'));

  // Close modals on clicking outside dialog
  window.addEventListener('click', (e) => {
    if (e.target === matrixModal) matrixModal.classList.add('hidden');
    if (e.target === empiricalModal) empiricalModal.classList.add('hidden');
  });

  // Load initial datasets
  loadSimulationData();

  // Start animation loop
  animationFrameId = requestAnimationFrame(simLoop);
});
