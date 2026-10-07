"""
Simulation entities and state tracking for Carlo's Bacolod Chicken House Express (CHE) Makati.
Defines Customers, Couriers, Orders, Grill Batches, Tables, and simulation event records.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any


class ChannelType(str, Enum):
    DINE_IN = "dine_in"
    TAKEOUT = "takeout"
    DELIVERY_COURIER = "delivery_courier"


class CustomerStatus(str, Enum):
    ARRIVED = "ARRIVED"
    QUEUING_ORDER = "QUEUING_ORDER"
    ORDERING = "ORDERING"
    WAITING_FOOD = "WAITING_FOOD"
    SEATED_EATING = "SEATED_EATING"
    COMPLETED = "COMPLETED"
    BALKED = "BALKED"


@dataclass
class Customer:
    id: str
    channel: ChannelType
    arrival_time: float
    items_count: int = 1
    party_size: int = 1
    courier_brand: Optional[str] = None  # "GrabFood" or "Foodpanda"
    order_slip_prepped: bool = False  # By floating expediter in Scenario B

    # Event timestamps (minutes)
    t_queue_enter: float = 0.0
    t_order_start: float = 0.0
    t_order_end: float = 0.0
    t_grill_start: float = 0.0
    t_grill_end: float = 0.0
    t_assembly_start: float = 0.0
    t_assembly_end: float = 0.0
    t_seated: float = 0.0
    t_departure: float = 0.0

    # Operational outcomes
    status: CustomerStatus = CustomerStatus.ARRIVED
    balked: bool = False
    assigned_table_id: Optional[int] = None
    cashier_id: int = 1

    @property
    def queue_wait_time(self) -> float:
        """Waiting time in the order queue (Wq)."""
        if self.balked:
            return 0.0
        return max(0.0, self.t_order_start - self.t_queue_enter)

    @property
    def cashier_duration(self) -> float:
        """Duration spent paying and finalizing order at register."""
        if self.balked or self.t_order_end <= 0:
            return 0.0
        return max(0.0, self.t_order_end - self.t_order_start)

    @property
    def kitchen_wait_time(self) -> float:
        """Time waiting for food after ordering until handover."""
        if self.balked or self.t_assembly_end <= 0:
            return 0.0
        return max(0.0, self.t_assembly_end - self.t_order_end)

    @property
    def total_system_time(self) -> float:
        """Total time in system (W)."""
        if self.balked:
            return 0.0
        return max(0.0, self.t_departure - self.arrival_time)

    @property
    def courier_dwell_time(self) -> float:
        """Total turnaround time for delivery riders (arrival to package dispatch)."""
        if self.channel != ChannelType.DELIVERY_COURIER or self.balked:
            return 0.0
        return max(0.0, self.t_assembly_end - self.arrival_time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "channel": self.channel.value,
            "courier_brand": self.courier_brand,
            "items_count": self.items_count,
            "party_size": self.party_size,
            "arrival_time": round(self.arrival_time, 2),
            "queue_wait_time": round(self.queue_wait_time, 2),
            "cashier_duration": round(self.cashier_duration, 2),
            "kitchen_wait_time": round(self.kitchen_wait_time, 2),
            "total_system_time": round(self.total_system_time, 2),
            "courier_dwell_time": round(self.courier_dwell_time, 2),
            "balked": self.balked,
            "status": self.status.value,
        }


@dataclass
class GrillBatch:
    batch_id: int
    pieces_count: int
    t_start: float
    t_end: float
    serviced_order_ids: List[str] = field(default_factory=list)


@dataclass
class DiningTable:
    table_id: int
    seats: int
    is_occupied: bool = False
    current_occupant_id: Optional[str] = None
    t_occupied_at: float = 0.0


@dataclass
class SimulationEvent:
    timestamp: float
    event_type: str
    entity_id: str
    channel: str
    queue_length: int
    active_grill_pieces: int
    courier_brand: Optional[str] = None
    table_id: Optional[int] = None
    details: str = ""
