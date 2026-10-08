"""
Discrete-Event Simulation (DES) Model for Carlo's Bacolod Chicken House Express (CHE) Makati.
Built with SimPy. Models multi-channel arrivals, order-taking, charcoal grilling batching,
order assembly/dispatch, dining room seating, and balking dynamics across operational scenarios.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import numpy as np
import simpy

from src.simulation.entities import (
    Customer,
    ChannelType,
    CustomerStatus,
    DiningTable,
    GrillBatch,
    SimulationEvent,
)
from src.simulation.distributions import OperationalDistributions


@dataclass
class ScenarioConfig:
    name: str = "Baseline"
    description: str = "Current shared single queue for dine-in, takeout, and delivery riders."
    simulation_duration: float = 120.0  # 120 minutes (peak lunch 11:30 - 13:30)
    warmup_duration: float = 15.0       # Warmup period (minutes)

    # Cashier / Order counter configuration
    cashier_count: int = 1
    decoupled_channels: bool = False    # Scenario A: separate dine-in vs takeout/courier lines
    takeout_courier_cashiers: int = 1   # Express cashier if decoupled

    # Floating expediter configuration (Scenario B)
    floating_expediter_enabled: bool = False
    expediter_queue_trigger: int = 4   # Line length to trigger pre-ordering

    # Assembly & Dispatch configuration (Scenario C)
    assembly_staff_count: int = 1
    dynamic_peak_staffing: bool = False # Flex prep worker to assembly during surge
    dynamic_staff_start_min: float = 30.0
    dynamic_staff_end_min: float = 90.0

    # Charcoal Grill configuration
    grill_capacity_pieces: int = 24    # Max chicken pieces on inasal charcoal grill
    grill_target_batch_size: int = 12  # Batch launch threshold

    # Dining tables configuration
    table_count: int = 12              # 12 tables (6 left dining room + 6 right dining hall)

    # Arrival surge settings
    arrival_multiplier: float = 1.0    # Sensitivity scaling factor


class ChickenHouseSimulation:
    """Simulation engine modeling Carlo's Bacolod Chicken House Express Makati."""

    def __init__(self, config: Optional[ScenarioConfig] = None, seed: int = 42):
        self.config = config or ScenarioConfig()
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        self.dist = OperationalDistributions(rng=self.rng)

        # SimPy Environment
        self.env = simpy.Environment()

        # Shared Resources
        if self.config.decoupled_channels:
            self.res_cashier_dinein = simpy.Resource(self.env, capacity=self.config.cashier_count)
            self.res_cashier_express = simpy.Resource(self.env, capacity=self.config.takeout_courier_cashiers)
        else:
            self.res_cashier_shared = simpy.Resource(self.env, capacity=self.config.cashier_count)

        self.res_grill_master = simpy.Resource(self.env, capacity=1)
        self.res_assembly = simpy.Resource(self.env, capacity=self.config.assembly_staff_count)

        # Dining tables (12 tables matching authentic layout)
        self.tables: List[DiningTable] = [
            DiningTable(table_id=i + 1, seats=4 if (i % 3 != 0) else 2)
            for i in range(self.config.table_count)
        ]
        self.res_tables = simpy.Resource(self.env, capacity=self.config.table_count)

        # Grilling batch queue (Store of pieces needed)
        self.grill_backlog_pieces = 0
        self.cooked_pieces_available = simpy.Container(self.env, capacity=100, init=12) # Pre-warmed buffer

        # Customer tracking
        self.customers: List[Customer] = []
        self.events: List[SimulationEvent] = []
        self.customer_id_counter = 0

        # Operational telemetry time-series
        self.telemetry: List[Dict[str, Any]] = []

        # Time-weighted Lq accumulators
        self.last_q_change_time = 0.0
        self.last_queue_length = 0
        self.time_weighted_lq_sum = 0.0

        # Busy time accumulators for utilization calculation
        self.cashier_busy_time = 0.0
        self.grill_busy_time = 0.0
        self.assembly_busy_time = 0.0
        self.expediter_active_time = 0.0

    def record_queue_change(self):
        """Integrates queue length over elapsed time for rigorous time-weighted Lq."""
        now = self.env.now
        if now > self.last_q_change_time:
            dt = now - self.last_q_change_time
            # Only accumulate post-warmup
            if self.last_q_change_time >= self.config.warmup_duration:
                self.time_weighted_lq_sum += self.last_queue_length * dt
            elif now > self.config.warmup_duration:
                effective_dt = now - self.config.warmup_duration
                self.time_weighted_lq_sum += self.last_queue_length * effective_dt

            self.last_q_change_time = now
        self.last_queue_length = self.get_total_queue_length()

    def log_event(self, event_type: str, cust: Optional[Customer] = None, details: str = "", table_id: Optional[int] = None):
        """Records granular event for live 3D visualizer and state inspection."""
        q_len = self.get_total_queue_length()
        event = SimulationEvent(
            timestamp=round(self.env.now, 3),
            event_type=event_type,
            entity_id=cust.id if cust else "SYSTEM",
            channel=cust.channel.value if cust else "SYSTEM",
            queue_length=q_len,
            active_grill_pieces=self.grill_backlog_pieces,
            courier_brand=cust.courier_brand if cust else None,
            table_id=table_id,
            details=details,
        )
        self.events.append(event)

    def get_total_queue_length(self) -> int:
        """Returns total waiting customers in order queues."""
        if self.config.decoupled_channels:
            dine_q = len(self.res_cashier_dinein.queue)
            exp_q = len(self.res_cashier_express.queue)
            return dine_q + exp_q
        else:
            return len(self.res_cashier_shared.queue)

    def is_dynamic_staffing_active(self) -> bool:
        """Checks if dynamic flex staff is reallocated to assembly."""
        if not self.config.dynamic_peak_staffing:
            return False
        return self.config.dynamic_staff_start_min <= self.env.now <= self.config.dynamic_staff_end_min

    def customer_arrival_generator(self):
        """Generates continuous customer arrivals across lunch/dinner peak rush."""
        while True:
            # Non-homogeneous Poisson Process intensity curve
            # Lunch rush: 11:30 - 13:30 (peak around 12:15 - 12:45)
            progress = self.env.now / self.config.simulation_duration
            surge_factor = 1.0 + 1.25 * np.exp(-((progress - 0.45) ** 2) / 0.035)
            effective_surge = surge_factor * self.config.arrival_multiplier

            interarrival = self.dist.sample_interarrival(peak_factor=effective_surge)
            yield self.env.timeout(interarrival)

            self.customer_id_counter += 1
            channel_str = self.dist.sample_channel()
            channel = ChannelType(channel_str)

            courier_brand = None
            if channel == ChannelType.DELIVERY_COURIER:
                courier_brand = "GrabFood" if self.rng.random() < 0.65 else "Foodpanda"
                items = int(self.rng.choice([1, 2, 3, 4], p=[0.15, 0.45, 0.30, 0.10]))
                party = 1
            elif channel == ChannelType.TAKEOUT:
                items = int(self.rng.choice([1, 2, 3], p=[0.35, 0.45, 0.20]))
                party = 1
            else:
                party = int(self.rng.choice([1, 2, 3, 4], p=[0.20, 0.50, 0.20, 0.10]))
                items = party

            cust = Customer(
                id=f"C{self.customer_id_counter:03d}",
                channel=channel,
                arrival_time=self.env.now,
                items_count=items,
                party_size=party,
                courier_brand=courier_brand,
            )
            self.customers.append(cust)
            self.log_event("ARRIVAL", cust, f"Arrived with {items} inasal items")

            # Check balking based on visible queue length at Savana Market corridor
            current_q = self.get_total_queue_length()
            if self.dist.should_balk(cust.channel.value, current_q):
                cust.balked = True
                cust.status = CustomerStatus.BALKED
                cust.t_departure = self.env.now
                self.log_event("BALKED", cust, f"Walked away due to queue ({current_q} people)")
                continue

            # Spawn customer service process
            self.env.process(self.customer_lifecycle(cust))

    def customer_lifecycle(self, cust: Customer):
        """Orchestrates customer journey through order, grilling, assembly, and table/departure."""
        cust.status = CustomerStatus.QUEUING_ORDER
        cust.t_queue_enter = self.env.now
        self.log_event("QUEUE_ENTER", cust, "Joined cashier queue")

        # Floating Expediter check (Scenario B)
        # If expediter is active and queue exceeds trigger, order slip is prepped in line
        expediter_helped = False
        if self.config.floating_expediter_enabled and self.get_total_queue_length() >= self.config.expediter_queue_trigger:
            expediter_helped = True
            cust.order_slip_prepped = True
            self.expediter_active_time += 0.5
            self.log_event("EXPEDITER_PREORDER", cust, "Order slip prepared by roaming expediter")

        # Select cashier resource
        if self.config.decoupled_channels:
            if cust.channel == ChannelType.DINE_IN:
                cashier_res = self.res_cashier_dinein
                cust.cashier_id = 1
            else:
                cashier_res = self.res_cashier_express
                cust.cashier_id = 2
        else:
            cashier_res = self.res_cashier_shared
            cust.cashier_id = 1

        self.record_queue_change()
        with cashier_res.request() as req:
            yield req

            self.record_queue_change()
            cust.status = CustomerStatus.ORDERING
            cust.t_order_start = self.env.now
            self.log_event("ORDER_START", cust, f"Ordering at Cashier #{cust.cashier_id}")

            ordering_duration = self.dist.sample_ordering_time(
                cust.channel.value,
                expediter_active=cust.order_slip_prepped
            )
            yield self.env.timeout(ordering_duration)

            cust.t_order_end = self.env.now
            self.cashier_busy_time += ordering_duration
            self.log_event("ORDER_END", cust, f"Order finalized in {ordering_duration:.2f} mins")

        # Demand chicken inasal pieces from grill / kitchen buffer
        self.grill_backlog_pieces += cust.items_count
        cust.status = CustomerStatus.WAITING_FOOD
        self.log_event("WAITING_FOOD", cust, f"Waiting for {cust.items_count} inasal pieces")

        # Withdraw cooked pieces from buffer or wait for grill master
        for _ in range(cust.items_count):
            yield self.cooked_pieces_available.get(1)
        self.grill_backlog_pieces = max(0, self.grill_backlog_pieces - cust.items_count)

        # Order Assembly & Packaging / Tray Preparation
        with self.res_assembly.request() as req:
            yield req

            cust.t_assembly_start = self.env.now
            self.log_event("ASSEMBLY_START", cust, "Order packaging & saucing started")

            is_dynamic = self.is_dynamic_staffing_active()
            assembly_time = self.dist.sample_assembly_time(
                cust.channel.value,
                items_count=cust.items_count,
                dynamic_staff_active=is_dynamic
            )
            yield self.env.timeout(assembly_time)

            cust.t_assembly_end = self.env.now
            self.assembly_busy_time += assembly_time
            self.log_event("READY_FOR_PICKUP", cust, f"Order ready at counter ({assembly_time:.2f} mins)")

        # Fulfillment based on channel
        if cust.channel in [ChannelType.TAKEOUT, ChannelType.DELIVERY_COURIER]:
            # Handover complete, depart immediately
            cust.status = CustomerStatus.COMPLETED
            cust.t_departure = self.env.now
            dwell_str = f" (Dwell: {cust.courier_dwell_time:.2f} min)" if cust.channel == ChannelType.DELIVERY_COURIER else ""
            self.log_event("DEPARTURE", cust, f"Departed with takeout/delivery package{dwell_str}")
        else:
            # Dine-in: Request dining table in Savana Market dining area
            self.log_event("SEATING_REQUEST", cust, "Looking for available dining table")
            with self.res_tables.request() as req:
                yield req

                # Find available table
                assigned_tbl = next((t for t in self.tables if not t.is_occupied), None)
                tbl_id = assigned_tbl.table_id if assigned_tbl else 1
                if assigned_tbl:
                    assigned_tbl.is_occupied = True
                    assigned_tbl.current_occupant_id = cust.id

                cust.status = CustomerStatus.SEATED_EATING
                cust.t_seated = self.env.now
                cust.assigned_table_id = tbl_id
                self.log_event("SEATED", cust, f"Seated at Table #{tbl_id}", table_id=tbl_id)

                dining_duration = self.dist.sample_dining_time()
                yield self.env.timeout(dining_duration)

                if assigned_tbl:
                    assigned_tbl.is_occupied = False
                    assigned_tbl.current_occupant_id = None

                cust.status = CustomerStatus.COMPLETED
                cust.t_departure = self.env.now
                self.log_event("DEPARTURE", cust, f"Finished meal and vacated Table #{tbl_id}", table_id=tbl_id)

    def grill_master_process(self):
        """Continuous charcoal grill batch cooking process."""
        batch_id = 1
        while True:
            # Replenish buffer when cooked pieces drop below target or backlog is high
            needed_buffer = max(10, self.grill_backlog_pieces + 6)
            if self.cooked_pieces_available.level < needed_buffer:
                with self.res_grill_master.request() as req:
                    yield req

                    batch_size = min(
                        self.config.grill_capacity_pieces,
                        max(8, needed_buffer - self.cooked_pieces_available.level)
                    )
                    batch_time = self.dist.sample_grill_batch_time(batch_size)

                    self.log_event(
                        "GRILL_BATCH_START",
                        details=f"Grilling Batch #{batch_id}: {batch_size} chicken inasal skewers ({batch_time:.1f} mins)"
                    )
                    yield self.env.timeout(batch_time)

                    self.grill_busy_time += batch_time
                    space_left = self.cooked_pieces_available.capacity - self.cooked_pieces_available.level
                    pieces_to_add = min(batch_size, space_left)
                    yield self.cooked_pieces_available.put(pieces_to_add)

                    self.log_event(
                        "GRILL_BATCH_DONE",
                        details=f"Batch #{batch_id} ready. Buffer now at {self.cooked_pieces_available.level} pieces."
                    )
                    batch_id += 1
            else:
                yield self.env.timeout(1.5)

    def telemetry_recorder_process(self):
        """Logs periodic telemetry snapshots every 1 minute for dashboard curves."""
        while True:
            q_len = self.get_total_queue_length()
            active_couriers = sum(
                1 for c in self.customers
                if c.channel == ChannelType.DELIVERY_COURIER and c.status in [CustomerStatus.QUEUING_ORDER, CustomerStatus.ORDERING, CustomerStatus.WAITING_FOOD]
            )
            tables_occupied = sum(1 for t in self.tables if t.is_occupied)

            self.telemetry.append({
                "time_min": round(self.env.now, 2),
                "queue_length": q_len,
                "grill_backlog": self.grill_backlog_pieces,
                "cooked_buffer": self.cooked_pieces_available.level,
                "active_couriers": active_couriers,
                "tables_occupied": tables_occupied,
                "total_served": sum(1 for c in self.customers if c.status == CustomerStatus.COMPLETED),
                "total_balked": sum(1 for c in self.customers if c.balked),
            })
            yield self.env.timeout(1.0)

    def run(self) -> Dict[str, Any]:
        """Executes the simulation run and aggregates performance metrics."""
        self.env.process(self.customer_arrival_generator())
        self.env.process(self.grill_master_process())
        self.env.process(self.telemetry_recorder_process())
        self.env.run(until=self.config.simulation_duration)

        return self.compute_metrics()

    def compute_metrics(self) -> Dict[str, Any]:
        """Computes comprehensive KPIs (Wq, Lq, Courier Dwell, Utilization, Balking)."""
        valid_customers = [c for c in self.customers if c.arrival_time >= self.config.warmup_duration]
        completed = [c for c in valid_customers if c.status == CustomerStatus.COMPLETED]
        balked = [c for c in valid_customers if c.balked]

        # Waiting times
        wait_times_all = [c.queue_wait_time for c in completed]
        mean_wq = float(np.mean(wait_times_all)) if wait_times_all else 0.0
        p95_wq = float(np.percentile(wait_times_all, 95)) if wait_times_all else 0.0

        # Channel breakdowns
        dine_in_cust = [c for c in completed if c.channel == ChannelType.DINE_IN]
        takeout_cust = [c for c in completed if c.channel == ChannelType.TAKEOUT]
        courier_cust = [c for c in completed if c.channel == ChannelType.DELIVERY_COURIER]

        dine_in_wq = float(np.mean([c.queue_wait_time for c in dine_in_cust])) if dine_in_cust else 0.0
        takeout_wq = float(np.mean([c.queue_wait_time for c in takeout_cust])) if takeout_cust else 0.0
        courier_wq = float(np.mean([c.queue_wait_time for c in courier_cust])) if courier_cust else 0.0

        courier_dwell_times = [c.courier_dwell_time for c in courier_cust]
        mean_courier_dwell = float(np.mean(courier_dwell_times)) if courier_dwell_times else 0.0
        p95_courier_dwell = float(np.percentile(courier_dwell_times, 95)) if courier_dwell_times else 0.0

        # Kitchen fulfillment wait (from payment to food pickup)
        kitchen_wait_times = [c.kitchen_wait_time for c in completed]
        mean_kitchen_wait = float(np.mean(kitchen_wait_times)) if kitchen_wait_times else 0.0

        # Queue length stats: exact time-weighted Lq
        self.record_queue_change()
        obs_window = max(0.001, self.config.simulation_duration - self.config.warmup_duration)
        time_weighted_lq = float(self.time_weighted_lq_sum / obs_window)

        # Snapshot-based Lq from telemetry (for methodological comparison)
        q_lengths = [t["queue_length"] for t in self.telemetry if t["time_min"] >= self.config.warmup_duration]
        mean_lq = float(np.mean(q_lengths)) if q_lengths else 0.0
        max_lq = int(np.max(q_lengths)) if q_lengths else 0

        # Balking stats
        total_arrivals = len(valid_customers)
        balk_count = len(balked)
        balk_rate = float(balk_count / total_arrivals * 100.0) if total_arrivals > 0 else 0.0

        # Throughput
        effective_duration_hours = obs_window / 60.0
        throughput_per_hour = len(completed) / effective_duration_hours if effective_duration_hours > 0 else 0.0

        # Resource Utilization (%)
        duration = self.config.simulation_duration
        cashier_total_cap = (
            self.config.cashier_count + self.config.takeout_courier_cashiers
            if self.config.decoupled_channels
            else self.config.cashier_count
        )
        cashier_util = min(100.0, (self.cashier_busy_time / (duration * cashier_total_cap)) * 100.0)
        grill_util = min(100.0, (self.grill_busy_time / duration) * 100.0)
        assembly_util = min(100.0, (self.assembly_busy_time / (duration * self.config.assembly_staff_count)) * 100.0)

        table_occupancies = [t["tables_occupied"] for t in self.telemetry if t["time_min"] >= self.config.warmup_duration]
        mean_table_util = float(np.mean(table_occupancies) / self.config.table_count * 100.0) if table_occupancies else 0.0

        return {
            "scenario": self.config.name,
            "description": self.config.description,
            "total_arrivals": total_arrivals,
            "total_completed": len(completed),
            "total_balked": balk_count,
            "balk_rate_pct": round(balk_rate, 2),
            "throughput_orders_per_hour": round(throughput_per_hour, 1),
            "mean_wait_time_wq_min": round(mean_wq, 2),
            "p95_wait_time_wq_min": round(p95_wq, 2),
            "dine_in_wq_min": round(dine_in_wq, 2),
            "takeout_wq_min": round(takeout_wq, 2),
            "courier_wq_min": round(courier_wq, 2),
            "mean_courier_dwell_time_min": round(mean_courier_dwell, 2),
            "p95_courier_dwell_time_min": round(p95_courier_dwell, 2),
            "mean_queue_length_lq": round(time_weighted_lq, 2),
            "time_weighted_lq": round(time_weighted_lq, 2),
            "snapshot_lq_mean": round(mean_lq, 2),
            "max_queue_length_lq": max_lq,
            "cashier_utilization_pct": round(cashier_util, 1),
            "grill_utilization_pct": round(grill_util, 1),
            "assembly_utilization_pct": round(assembly_util, 1),
            "table_occupancy_pct": round(mean_table_util, 1),
        }
