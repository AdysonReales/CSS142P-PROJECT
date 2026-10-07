"""
Unit tests for the discrete-event simulation model of Carlo's Bacolod Chicken House Express.
"""

import unittest
from src.simulation.queue_model import ChickenHouseSimulation, ScenarioConfig
from src.simulation.entities import Customer, ChannelType, CustomerStatus


class TestSimulation(unittest.TestCase):
    def test_baseline_simulation_runs(self):
        config = ScenarioConfig(name="TestBaseline", simulation_duration=30.0, warmup_duration=5.0)
        sim = ChickenHouseSimulation(config=config, seed=42)
        metrics = sim.run()

        self.assertIsNotNone(metrics)
        self.assertIn("mean_wait_time_wq_min", metrics)
        self.assertIn("mean_queue_length_lq", metrics)
        self.assertGreater(metrics["total_arrivals"], 0)
        self.assertGreater(len(sim.events), 0)

    def test_scenario_a_channel_decoupling(self):
        config = ScenarioConfig(
            name="TestScenarioA",
            simulation_duration=45.0,
            warmup_duration=5.0,
            decoupled_channels=True,
            takeout_courier_cashiers=1,
        )
        sim = ChickenHouseSimulation(config=config, seed=123)
        metrics = sim.run()

        self.assertIsNotNone(metrics)
        self.assertGreaterEqual(metrics["cashier_utilization_pct"], 0.0)

    def test_scenario_b_floating_expediter(self):
        config = ScenarioConfig(
            name="TestScenarioB",
            simulation_duration=45.0,
            warmup_duration=5.0,
            floating_expediter_enabled=True,
            expediter_queue_trigger=3,
        )
        sim = ChickenHouseSimulation(config=config, seed=456)
        metrics = sim.run()

        self.assertIsNotNone(metrics)
        self.assertGreater(sim.customer_id_counter, 0)

    def test_scenario_c_dynamic_staffing(self):
        config = ScenarioConfig(
            name="TestScenarioC",
            simulation_duration=45.0,
            warmup_duration=5.0,
            dynamic_peak_staffing=True,
            dynamic_staff_start_min=10.0,
            dynamic_staff_end_min=35.0,
        )
        sim = ChickenHouseSimulation(config=config, seed=789)
        metrics = sim.run()

        self.assertIsNotNone(metrics)
        self.assertGreaterEqual(metrics["throughput_orders_per_hour"], 0.0)

    def test_customer_entity_metrics(self):
        cust = Customer(
            id="C001",
            channel=ChannelType.DELIVERY_COURIER,
            arrival_time=10.0,
            courier_brand="GrabFood",
            t_queue_enter=10.0,
            t_order_start=12.5,
            t_order_end=13.2,
            t_assembly_start=13.5,
            t_assembly_end=17.0,
            t_departure=17.0,
            status=CustomerStatus.COMPLETED,
        )

        self.assertEqual(cust.queue_wait_time, 2.5)
        self.assertAlmostEqual(cust.cashier_duration, 0.7, places=2)
        self.assertEqual(cust.courier_dwell_time, 7.0)
        self.assertEqual(cust.total_system_time, 7.0)
        self.assertFalse(cust.balked)


if __name__ == "__main__":
    unittest.main()
