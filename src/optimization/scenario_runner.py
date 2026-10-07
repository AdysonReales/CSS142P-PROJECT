"""
Multi-Scenario Replication Runner and Optimization Trade-off Analysis
for Carlo's Bacolod Chicken House Express (CHE) Makati.
Executes Monte Carlo replications across Baseline, Scenario A, B, C, and Combined configurations.
"""

from dataclasses import asdict
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

from src.simulation.queue_model import ChickenHouseSimulation, ScenarioConfig


def get_standard_scenarios() -> List[ScenarioConfig]:
    """Returns the predefined scenario configurations as outlined in the project proposal."""
    return [
        ScenarioConfig(
            name="Baseline",
            description="Current single shared-counter queue for dine-in, takeout, and delivery couriers.",
            cashier_count=1,
            decoupled_channels=False,
            floating_expediter_enabled=False,
            dynamic_peak_staffing=False,
        ),
        ScenarioConfig(
            name="Scenario A: Channel Decoupling",
            description="Dedicated Dine-In counter + dedicated Takeout/Courier Express pickup counter.",
            cashier_count=1,
            decoupled_channels=True,
            takeout_courier_cashiers=1,
            floating_expediter_enabled=False,
            dynamic_peak_staffing=False,
        ),
        ScenarioConfig(
            name="Scenario B: Floating Expediter",
            description="Roving staff with mobile/paper slip taking orders ahead when queue >= 4.",
            cashier_count=1,
            decoupled_channels=False,
            floating_expediter_enabled=True,
            expediter_queue_trigger=4,
            dynamic_peak_staffing=False,
        ),
        ScenarioConfig(
            name="Scenario C: Dynamic Peak Staffing",
            description="Dynamic reallocation of 1 kitchen prep worker to order assembly/dispatch during rush.",
            cashier_count=1,
            decoupled_channels=False,
            floating_expediter_enabled=False,
            dynamic_peak_staffing=True,
            dynamic_staff_start_min=30.0,
            dynamic_staff_end_min=90.0,
        ),
        ScenarioConfig(
            name="Combined Policy: Best Practice",
            description="Channel Decoupling + Floating Expediter + Dynamic Peak Assembly Support.",
            cashier_count=1,
            decoupled_channels=True,
            takeout_courier_cashiers=1,
            floating_expediter_enabled=True,
            expediter_queue_trigger=4,
            dynamic_peak_staffing=True,
            dynamic_staff_start_min=30.0,
            dynamic_staff_end_min=90.0,
        ),
    ]


class ScenarioRunner:
    """Executes multi-replication Monte Carlo simulation experiments."""

    def __init__(self, scenarios: Optional[List[ScenarioConfig]] = None, replications: int = 20, base_seed: int = 100):
        self.scenarios = scenarios or get_standard_scenarios()
        self.replications = replications
        self.base_seed = base_seed

    def run_all(self) -> Dict[str, Any]:
        """Runs all scenarios across all replications and aggregates statistics."""
        all_results = {}
        tradeoff_records = []

        for scenario in self.scenarios:
            rep_metrics: List[Dict[str, Any]] = []

            for rep in range(self.replications):
                seed = self.base_seed + rep * 17
                sim = ChickenHouseSimulation(config=scenario, seed=seed)
                metrics = sim.run()
                rep_metrics.append(metrics)

            # Aggregate stats across replications
            agg = self._aggregate_metrics(scenario.name, scenario.description, rep_metrics)
            all_results[scenario.name] = {
                "config": asdict(scenario),
                "summary": agg,
                "raw_replications": rep_metrics,
            }

            tradeoff_records.append({
                "Scenario": scenario.name,
                "Wq (Mean Min)": agg["mean_wait_time_wq_min"]["mean"],
                "Wq 95% CI": f"±{agg['mean_wait_time_wq_min']['ci95']:.2f}",
                "Lq (Mean Queue)": agg["mean_queue_length_lq"]["mean"],
                "Max Lq": agg["max_queue_length_lq"]["mean"],
                "Courier Dwell (Min)": agg["mean_courier_dwell_time_min"]["mean"],
                "Balking Rate (%)": agg["balk_rate_pct"]["mean"],
                "Throughput (Orders/Hr)": agg["throughput_orders_per_hour"]["mean"],
                "Cashier Util (%)": agg["cashier_utilization_pct"]["mean"],
                "Assembly Util (%)": agg["assembly_utilization_pct"]["mean"],
            })

        tradeoff_df = pd.DataFrame(tradeoff_records)
        try:
            markdown_table = tradeoff_df.to_markdown(index=False)
        except Exception:
            markdown_table = tradeoff_df.to_string(index=False)

        return {
            "scenarios": all_results,
            "tradeoff_matrix": tradeoff_df.to_dict(orient="records"),
            "tradeoff_markdown": markdown_table,
        }

    def _aggregate_metrics(self, name: str, desc: str, reps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates mean, standard deviation, and 95% confidence intervals for each metric."""
        keys = [
            "mean_wait_time_wq_min",
            "p95_wait_time_wq_min",
            "dine_in_wq_min",
            "takeout_wq_min",
            "courier_wq_min",
            "mean_courier_dwell_time_min",
            "mean_kitchen_wait_min",
            "mean_queue_length_lq",
            "max_queue_length_lq",
            "balk_rate_pct",
            "total_balked",
            "throughput_orders_per_hour",
            "cashier_utilization_pct",
            "grill_utilization_pct",
            "assembly_utilization_pct",
            "table_occupancy_pct",
        ]

        summary = {"name": name, "description": desc, "replications": len(reps)}

        for k in keys:
            vals = [float(r[k]) for r in reps if k in r]
            if not vals:
                continue
            mean_val = float(np.mean(vals))
            std_val = float(np.std(vals, ddof=1)) if len(vals) > 1 else 0.0
            # 95% CI margin of error: 1.96 * (std / sqrt(N))
            ci_margin = 1.96 * (std_val / np.sqrt(len(vals))) if len(vals) > 1 else 0.0

            summary[k] = {
                "mean": round(mean_val, 2),
                "std": round(std_val, 2),
                "ci95": round(ci_margin, 2),
            }

        return summary


def run_and_save_experiment(
    output_json_path: str = "d:/A CODE FILES/CSS142P-PROJECT/data/processed/scenario_results.json",
    replications: int = 15,
) -> Dict[str, Any]:
    runner = ScenarioRunner(replications=replications)
    results = runner.run_all()

    out_p = Path(output_json_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("Experiment completed. Scenario Trade-Off Matrix:")
    print(results["tradeoff_markdown"])
    return results


if __name__ == "__main__":
    run_and_save_experiment()
