"""
Unit tests for data importation, schema validation, time parsing,
and channel normalization for Carlo's Bacolod Chicken House Express (CHE).
"""

import unittest
from pathlib import Path
import pandas as pd
from src.data_processing.importer import parse_time_to_minutes, normalize_channel, import_and_validate


class TestDataImporter(unittest.TestCase):

    def test_parse_time_formats(self):
        # 12-hour AM/PM formats
        self.assertAlmostEqual(parse_time_to_minutes("11:30:00 AM"), 11 * 60 + 30)
        self.assertAlmostEqual(parse_time_to_minutes("12:15:30 PM"), 12 * 60 + 15.5)
        self.assertAlmostEqual(parse_time_to_minutes("1:00:00 PM"), 13 * 60)

        # 24-hour formats
        self.assertAlmostEqual(parse_time_to_minutes("11:30:00"), 11 * 60 + 30)
        self.assertAlmostEqual(parse_time_to_minutes("13:15:00"), 13 * 60 + 15)

    def test_normalize_channel(self):
        self.assertEqual(normalize_channel("Dine-In"), "dine_in")
        self.assertEqual(normalize_channel("dine in"), "dine_in")
        self.assertEqual(normalize_channel("dining"), "dine_in")
        self.assertEqual(normalize_channel("Takeout"), "takeout")
        self.assertEqual(normalize_channel("walk-in takeout"), "takeout")
        self.assertEqual(normalize_channel("GrabFood"), "delivery")
        self.assertEqual(normalize_channel("foodpanda"), "delivery")
        self.assertEqual(normalize_channel("courier"), "delivery")
        self.assertEqual(normalize_channel("delivery"), "delivery")

    def test_import_and_validate_csv(self):
        csv_path = Path("data/raw/che_observations.csv")
        if csv_path.exists():
            df, report = import_and_validate(str(csv_path))
            self.assertGreaterEqual(report.total_raw_rows, 100)
            self.assertEqual(report.invalid_rows, 0)
            self.assertIn("dine_in", report.channel_counts)
            self.assertIn("takeout", report.channel_counts)
            self.assertIn("delivery", report.channel_counts)
            self.assertGreater(report.balked_counts["balked"], 0)


if __name__ == "__main__":
    unittest.main()
