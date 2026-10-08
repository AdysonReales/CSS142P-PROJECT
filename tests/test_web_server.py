"""
Integration test for the web server and web assets.
Verifies that all required files and API datasets are correctly served.
"""

import unittest
import urllib.request
import json


class TestWebServer(unittest.TestCase):
    BASE_URL = "http://localhost:8080"

    def test_endpoints(self):
        assets = [
            ("index.html", 200),
            ("styles.css", 200),
            ("scene_3d.js", 200),
            ("simulation_engine.js", 200),
            ("app.js", 200),
            ("data/scenario_results.json", 200),
            ("data/calibrated_inputs.json", 200),
        ]

        for path, expected_status in assets:
            with self.subTest(path=path):
                url = f"{self.BASE_URL}/{path}"
                req = urllib.request.urlopen(url)
                self.assertEqual(req.getcode(), expected_status)
                content = req.read()
                self.assertGreater(len(content), 0)

    def test_json_payloads(self):
        scenario_url = f"{self.BASE_URL}/data/scenario_results.json"
        with urllib.request.urlopen(scenario_url) as res:
            data = json.loads(res.read().decode("utf-8"))
            self.assertIn("tradeoff_matrix", data)
            self.assertIn("paired_differences_vs_baseline", data)
            self.assertIn("sensitivity_analysis", data)
            self.assertEqual(data["replications"], 30)

        calibrated_url = f"{self.BASE_URL}/data/calibrated_inputs.json"
        with urllib.request.urlopen(calibrated_url) as res:
            data = json.loads(res.read().decode("utf-8"))
            self.assertIn("metadata", data)
            self.assertIn("fitted_distributions", data)
            self.assertIn("empirical_balking_curve", data)
            self.assertEqual(data["metadata"]["total_records"], 120)


if __name__ == "__main__":
    unittest.main()
