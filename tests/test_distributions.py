"""
Unit tests for statistical distributions and fitting functions.
"""

import unittest
import numpy as np
from src.simulation.distributions import (
    OperationalDistributions,
    fit_best_distribution,
    DistributionFitResult,
)


class TestDistributions(unittest.TestCase):
    def test_distribution_samplers(self):
        dist = OperationalDistributions(rng=np.random.default_rng(101))

        # Test interarrival
        arrivals = [dist.sample_interarrival() for _ in range(50)]
        self.assertTrue(all(a > 0 for a in arrivals))

        # Test channels
        channels = {dist.sample_channel() for _ in range(50)}
        self.assertIn("dine_in", channels)
        self.assertIn("takeout", channels)
        self.assertIn("delivery_courier", channels)

        # Test ordering time
        t_normal = dist.sample_ordering_time("dine_in", expediter_active=False)
        t_expedited = dist.sample_ordering_time("dine_in", expediter_active=True)
        self.assertGreater(t_normal, 0)
        self.assertGreater(t_expedited, 0)

        # Test grill batch time
        t_grill = dist.sample_grill_batch_time(12)
        self.assertGreaterEqual(t_grill, 6.0)

        # Test balking logic
        self.assertFalse(dist.should_balk("delivery_courier", visible_queue_len=20))
        self.assertFalse(dist.should_balk("dine_in", visible_queue_len=3))

    def test_fit_best_distribution(self):
        # Generate synthetic exponential data
        data = np.random.exponential(scale=2.5, size=200)
        result = fit_best_distribution(data, candidates=["expon", "gamma"])

        self.assertIsInstance(result, DistributionFitResult)
        self.assertIn(result.dist_name, ["expon", "gamma"])
        self.assertGreaterEqual(result.ks_statistic, 0.0)
        self.assertGreaterEqual(result.ks_pvalue, 0.0)


if __name__ == "__main__":
    unittest.main()
