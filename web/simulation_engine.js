/**
 * Client-Side Discrete-Event Simulation Engine
 * Mirroring SimPy queue_model.py for real-time 3D playback in the browser.
 */

class SimulationEngine {
  constructor(scenarioKey = 'baseline', seed = 42) {
    this.scenarioKey = scenarioKey;
    this.seed = seed;
    this.currentTime = 0.0; // Current simulation minutes (0 = 11:30 AM, 120 = 1:30 PM)
    this.maxDuration = 120.0;
    this.isRunning = false;
    this.warpFactor = 1.0;

    // Simulation configuration
    this.config = this.getScenarioConfig(scenarioKey);

    // State
    this.customerCounter = 0;
    this.customers = [];
    this.queueShared = [];
    this.queueDineIn = [];
    this.queueExpress = [];
    this.assemblyQueue = [];
    this.activeOrders = new Map(); // id -> cust

    // Grilling buffer
    this.grillBuffer = 12; // Ready chicken pieces
    this.grillBacklog = 0;
    this.grillBatchTimer = 0;

    // Dining tables (12 tables matching authentic floor plan layout: 6 Left + 6 Right)
    this.tables = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, occupied: false, custId: null, releaseTime: 0 }));

    // Telemetry & metrics
    this.completedCount = 0;
    this.balkedCount = 0;
    this.channelCompleted = { dine_in: 0, takeout: 0, delivery_courier: 0 };
    this.waitTimes = [];
    this.courierDwellTimes = [];
    this.peakQueueLength = 0;

    // Time-weighted Lq tracking
    this.lastQChangeTime = 0.0;
    this.timeWeightedLqSum = 0.0;
    this.lastQLength = 0;

    // Event listener callback
    this.onEvent = null;
    this.onTick = null;

    // Next scheduled customer arrival time
    this.nextArrivalDelta = this.sampleInterarrival();
    this.nextArrivalTime = this.nextArrivalDelta;
  }

  getScenarioConfig(key) {
    switch (key) {
      case 'scenario_a':
        return {
          name: "Scenario A: Channel Decoupling",
          badge: "SCENARIO A",
          desc: "Dedicated Dine-In counter + dedicated Takeout/Courier Express pickup counter.",
          decoupled: true,
          expediter: false,
          dynamicStaff: false,
        };
      case 'scenario_b':
        return {
          name: "Scenario B: Floating Expediter",
          badge: "SCENARIO B",
          desc: "Roving staff taking orders with mobile/paper slip when queue >= 4.",
          decoupled: false,
          expediter: true,
          dynamicStaff: false,
        };
      case 'scenario_c':
        return {
          name: "Scenario C: Dynamic Peak Staffing",
          badge: "SCENARIO C",
          desc: "Dynamic reallocation of 1 kitchen prep worker to order assembly/dispatch during rush.",
          decoupled: false,
          expediter: false,
          dynamicStaff: true,
        };
      case 'combined':
        return {
          name: "Combined (Exploratory Policy)",
          badge: "COMBINED (EXPLORATORY)",
          desc: "Exploratory combination: Decoupled lines + Floating Expediter + Dynamic Peak Assembly.",
          decoupled: true,
          expediter: true,
          dynamicStaff: true,
        };
      case 'baseline':
      default:
        return {
          name: "Baseline",
          badge: "BASELINE",
          desc: "Current single shared-counter queue for dine-in, takeout, and delivery couriers.",
          decoupled: false,
          expediter: false,
          dynamicStaff: false,
        };
    }
  }

  // Random Number Generator (PRNG)
  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  sampleInterarrival() {
    // Non-homogeneous surge: peak around 45% of duration (12:15 - 12:45 PM)
    // Calibrated empirical base rate ~0.91 min
    const progress = this.currentTime / this.maxDuration;
    const surge = 1.0 + 1.25 * Math.exp(-Math.pow(progress - 0.45, 2) / 0.035);
    const meanInterarrival = 0.914 / surge;
    // Exponential distribution
    return -meanInterarrival * Math.log(Math.max(1e-6, 1.0 - this.random()));
  }

  sampleOrderingTime(channel, prepped) {
    // Calibrated cashier service mean ~2.48 min
    let min = 1.8, mode = 2.4, max = 3.4;
    if (channel === 'delivery_courier') {
      min = 1.2; mode = 2.0; max = 2.8;
    } else if (channel === 'takeout') {
      min = 1.6; mode = 2.3; max = 3.2;
    }
    // Triangular
    const u = this.random();
    const f = (mode - min) / (max - min);
    let val = (u < f)
      ? min + Math.sqrt(u * (max - min) * (mode - min))
      : max - Math.sqrt((1 - u) * (max - min) * (max - mode));

    if (prepped) val *= 0.45; // Expediter pre-ordering cuts cashier transaction time by 55%
    return Math.max(0.3, val);
  }

  sampleAssemblyTime(channel, items, isDynamic) {
    let min = 1.2, mode = 2.0, max = 3.2;
    if (channel === 'takeout') {
      min = 1.5; mode = 2.5; max = 4.0;
    } else if (channel === 'delivery_courier') {
      min = 1.3; mode = 2.2; max = 3.6;
    }
    const u = this.random();
    const f = (mode - min) / (max - min);
    let val = (u < f)
      ? min + Math.sqrt(u * (max - min) * (mode - min))
      : max - Math.sqrt((1 - u) * (max - min) * (max - mode));

    val += (items - 1) * 0.4;
    if (isDynamic) val *= 0.65; // 35% faster assembly with dynamic helper
    return Math.max(0.6, val);
  }

  sampleDiningTime() {
    // Calibrated dining duration: mean ~14.0 min
    return 10.0 + this.random() * 8.0;
  }

  step(deltaMinutes) {
    if (this.currentTime >= this.maxDuration) {
      this.isRunning = false;
      return;
    }

    const prevTime = this.currentTime;
    this.currentTime = Math.min(this.maxDuration, this.currentTime + deltaMinutes);

    // 1. Process customer arrivals
    if (this.currentTime >= this.nextArrivalTime) {
      this.spawnCustomer();
      this.nextArrivalTime = this.currentTime + this.sampleInterarrival();
    }

    // 2. Grilling Batch Production cycle
    this.updateGrillStation(deltaMinutes);

    // 3. Process Service Queues (Cashier 1 & Cashier 2)
    this.updateCashiers(deltaMinutes);

    // 4. Process Assembly & Packaging
    this.updateAssembly(deltaMinutes);

    // 5. Update Dining Room Tables
    this.updateDiningTables();

    // 6. Update peak metrics
    const currentQ = this.getTotalQueueLength();
    if (currentQ > this.peakQueueLength) {
      this.peakQueueLength = currentQ;
    }

    if (this.onTick) this.onTick(this.getTelemetrySnapshot());
  }

  spawnCustomer() {
    this.customerCounter++;
    const roll = this.random();
    let channel = 'dine_in';
    let courierBrand = null;
    let items = 1;

    if (roll < 0.48) {
      channel = 'dine_in';
      items = Math.floor(this.random() * 3) + 1;
    } else if (roll < 0.74) {
      channel = 'takeout';
      items = Math.floor(this.random() * 3) + 1;
    } else {
      channel = 'delivery_courier';
      courierBrand = this.random() < 0.65 ? 'GrabFood' : 'Foodpanda';
      items = Math.floor(this.random() * 4) + 1;
    }

    const cust = {
      id: `C${String(this.customerCounter).padStart(3, '0')}`,
      channel: channel,
      courier_brand: courierBrand,
      items_count: items,
      arrival_time: this.currentTime,
      queue_enter_time: this.currentTime,
      order_start_time: 0,
      order_end_time: 0,
      assembly_start_time: 0,
      assembly_end_time: 0,
      seated_time: 0,
      status: 'QUEUING_ORDER',
      order_slip_prepped: false,
      assigned_table_id: null,
      service_remaining: 0,
    };

    // Balking check
    const currentQ = this.getTotalQueueLength();
    if (channel !== 'delivery_courier' && currentQ > 8) {
      const balkProb = Math.min(0.85, (currentQ - 8) * 0.12);
      if (this.random() < balkProb) {
        cust.status = 'BALKED';
        this.balkedCount++;
        this.emit('BALKED', cust, `Walked away due to queue (${currentQ} pax)`);
        return;
      }
    }

    // Expediter check (Scenario B)
    if (this.config.expediter && currentQ >= 4) {
      cust.order_slip_prepped = true;
      this.emit('EXPEDITER_PREORDER', cust, 'Order pre-written by roving expediter');
    }

    // Assign to queue
    if (this.config.decoupled) {
      if (channel === 'dine_in') {
        this.queueDineIn.push(cust);
      } else {
        this.queueExpress.push(cust);
      }
    } else {
      this.queueShared.push(cust);
    }

    this.customers.push(cust);
    this.activeOrders.set(cust.id, cust);
    this.emit('QUEUE_ENTER', cust, `Joined ${channel.replace('_', ' ')} queue`);
  }

  updateCashiers(dt) {
    if (this.config.decoupled) {
      this.processQueueServer(this.queueDineIn, 'cashier1', dt);
      this.processQueueServer(this.queueExpress, 'cashier2', dt);
    } else {
      this.processQueueServer(this.queueShared, 'cashier1', dt);
    }
  }

  processQueueServer(queue, cashierKey, dt) {
    if (queue.length === 0) return;
    const cust = queue[0];

    if (cust.status === 'QUEUING_ORDER') {
      cust.status = 'ORDERING';
      cust.order_start_time = this.currentTime;
      cust.service_remaining = this.sampleOrderingTime(cust.channel, cust.order_slip_prepped);
      this.emit('ORDER_START', cust, `Ordering at ${cashierKey}`);
    }

    cust.service_remaining -= dt;
    if (cust.service_remaining <= 0) {
      // Order complete
      cust.order_end_time = this.currentTime;
      cust.status = 'WAITING_FOOD';
      queue.shift(); // Remove from cashier queue

      // Add to kitchen assembly pipeline
      this.grillBacklog += cust.items_count;
      this.assemblyQueue.push(cust);
      this.emit('ORDER_END', cust, `Order placed (${cust.items_count} inasal pcs)`);
    }
  }

  updateGrillStation(dt) {
    // Grill replenishes buffer if backlog exists or buffer is low
    if (this.grillBuffer < 20 || this.grillBacklog > 0) {
      this.grillBatchTimer += dt;
      if (this.grillBatchTimer >= 8.5) {
        // Batch finishes
        this.grillBatchTimer = 0;
        const cooked = 14;
        this.grillBuffer = Math.min(24, this.grillBuffer + cooked);
        this.emit('GRILL_BATCH_DONE', null, `Grill Master completed batch: +${cooked} ready pieces`);
      }
    }
  }

  updateAssembly(dt) {
    if (this.assemblyQueue.length === 0) return;
    const cust = this.assemblyQueue[0];

    // Wait until chicken buffer is available
    if (this.grillBuffer >= cust.items_count) {
      if (cust.status !== 'IN_ASSEMBLY') {
        cust.status = 'IN_ASSEMBLY';
        cust.assembly_start_time = this.currentTime;
        const isDynamic = this.config.dynamicStaff && (this.currentTime >= 30 && this.currentTime <= 90);
        cust.assembly_remaining = this.sampleAssemblyTime(cust.channel, cust.items_count, isDynamic);
        this.grillBuffer -= cust.items_count;
        this.grillBacklog = Math.max(0, this.grillBacklog - cust.items_count);
        this.emit('ASSEMBLY_START', cust, `Assembly started (${cust.items_count} inasal pcs)`);
      }

      cust.assembly_remaining -= dt;
      if (cust.assembly_remaining <= 0) {
        // Assembly complete
        cust.assembly_end_time = this.currentTime;
        this.assemblyQueue.shift();

        const waitQ = cust.order_start_time - cust.queue_enter_time;
        this.waitTimes.push(waitQ);

        if (cust.channel === 'delivery_courier') {
          const dwell = cust.assembly_end_time - cust.arrival_time;
          this.courierDwellTimes.push(dwell);
          cust.status = 'COMPLETED';
          this.completedCount++;
          this.channelCompleted.delivery_courier++;
          this.emit('PICKUP_DISPATCH', cust, `Courier collected order (Dwell: ${dwell.toFixed(1)}m)`);
        } else if (cust.channel === 'takeout') {
          cust.status = 'COMPLETED';
          this.completedCount++;
          this.channelCompleted.takeout++;
          this.emit('PICKUP_DISPATCH', cust, 'Takeout package handed over');
        } else {
          // Dine-In: Seat at dining table in Left Room or Right Hall
          this.seatCustomer(cust);
        }
      }
    }
  }

  seatCustomer(cust) {
    const availableTables = this.tables.filter(t => !t.occupied);
    if (availableTables.length > 0) {
      // Pick an available table (random among available, evenly distributing across Left and Right dining halls)
      const table = availableTables[Math.floor(this.random() * availableTables.length)];
      table.occupied = true;
      table.custId = cust.id;
      table.releaseTime = this.currentTime + this.sampleDiningTime();
      cust.status = 'SEATED_EATING';
      cust.assigned_table_id = table.id;
      cust.seated_time = this.currentTime;
      const roomName = table.id <= 6 ? 'Left Dining Room' : 'Right Dining Hall';
      this.emit('SEATED', cust, `Seated at Table #${table.id} (${roomName})`);
    } else {
      // Table wait buffer
      cust.status = 'WAITING_TABLE';
      this.emit('WAITING_TABLE', cust, 'Waiting for an available dining table');
    }
  }

  updateDiningTables() {
    this.tables.forEach(tbl => {
      if (tbl.occupied && this.currentTime >= tbl.releaseTime) {
        tbl.occupied = false;
        const cust = this.activeOrders.get(tbl.custId);
        if (cust) {
          cust.status = 'COMPLETED';
          this.completedCount++;
          this.channelCompleted.dine_in++;
          this.emit('DEPARTURE', cust, `Finished meal & vacated Table #${tbl.id}`);
        }
      }
    });

    // Check if any patrons waiting for tables can now be seated
    const waitingCusts = Array.from(this.activeOrders.values()).filter(c => c.status === 'WAITING_TABLE');
    for (const waitingCust of waitingCusts) {
      const avail = this.tables.find(t => !t.occupied);
      if (!avail) break;
      this.seatCustomer(waitingCust);
    }
  }

  getTotalQueueLength() {
    if (this.config.decoupled) {
      return this.queueDineIn.length + this.queueExpress.length;
    }
    return this.queueShared.length;
  }

  emit(eventType, cust, details) {
    if (this.onEvent) {
      this.onEvent({
        timestamp: this.currentTime,
        eventType,
        cust,
        details,
        queueLength: this.getTotalQueueLength(),
      });
    }
  }

  getTelemetrySnapshot() {
    const meanWq = this.waitTimes.length > 0
      ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
      : 0.0;

    const meanDwell = this.courierDwellTimes.length > 0
      ? this.courierDwellTimes.reduce((a, b) => a + b, 0) / this.courierDwellTimes.length
      : 0.0;

    const totalArr = this.customers.length;
    const balkRate = totalArr > 0 ? (this.balkedCount / totalArr) * 100 : 0;
    const hours = Math.max(0.1, this.currentTime / 60.0);
    const throughput = this.completedCount / hours;

    const occupiedTables = this.tables.filter(t => t.occupied).length;

    return {
      timeMin: this.currentTime,
      queueLength: this.getTotalQueueLength(),
      peakQueueLength: this.peakQueueLength,
      meanWq,
      meanDwell,
      balkedCount: this.balkedCount,
      balkRate,
      completedCount: this.completedCount,
      throughput,
      grillBuffer: this.grillBuffer,
      grillBacklog: this.grillBacklog,
      occupiedTables,
      channelCounts: { ...this.channelCompleted },
    };
  }

  reset() {
    this.currentTime = 0.0;
    this.isRunning = false;
    this.customerCounter = 0;
    this.customers = [];
    this.queueShared = [];
    this.queueDineIn = [];
    this.queueExpress = [];
    this.assemblyQueue = [];
    this.activeOrders.clear();
    this.grillBuffer = 12;
    this.grillBacklog = 0;
    this.grillBatchTimer = 0;
    this.tables.forEach(t => { t.occupied = false; t.custId = null; });
    this.completedCount = 0;
    this.balkedCount = 0;
    this.channelCompleted = { dine_in: 0, takeout: 0, delivery_courier: 0 };
    this.waitTimes = [];
    this.courierDwellTimes = [];
    this.peakQueueLength = 0;
    this.nextArrivalDelta = this.sampleInterarrival();
    this.nextArrivalTime = this.nextArrivalDelta;
  }
}

window.SimulationEngine = SimulationEngine;
