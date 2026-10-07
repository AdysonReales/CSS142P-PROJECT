"""
3D Visualizer helper and trajectory exporter for Carlo's Bacolod Chicken House Express.
Exports discrete-event histories to JSON for 3D playback and launches the WebGL twin.
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from src.simulation.queue_model import ChickenHouseSimulation, ScenarioConfig


def export_trajectory_for_3d_playback(
    scenario_config: ScenarioConfig,
    output_json_path: str,
    seed: int = 42,
) -> Dict[str, Any]:
    """Runs a single simulation run and serializes granular events and trajectories for 3D replay."""
    sim = ChickenHouseSimulation(config=scenario_config, seed=seed)
    metrics = sim.run()

    events_data = [
        {
            "timestamp": e.timestamp,
            "event_type": e.event_type,
            "entity_id": e.entity_id,
            "channel": e.channel,
            "queue_length": e.queue_length,
            "active_grill_pieces": e.active_grill_pieces,
            "courier_brand": e.courier_brand,
            "table_id": e.table_id,
            "details": e.details,
        }
        for e in sim.events
    ]

    payload = {
        "scenario": scenario_config.name,
        "metrics": metrics,
        "telemetry": sim.telemetry,
        "events": events_data,
        "customer_count": len(sim.customers),
    }

    out_p = Path(output_json_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Exported {len(events_data)} 3D simulation events to {out_p}")
    return payload


if __name__ == "__main__":
    out_file = "d:/A CODE FILES/CSS142P-PROJECT/data/processed/trajectory_baseline.json"
    export_trajectory_for_3d_playback(ScenarioConfig(name="Baseline"), out_file)
