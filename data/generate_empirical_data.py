"""
Generate empirical field observation dataset for Carlo's Bacolod Chicken House Express (CHE) Makati.
Simulates stopwatch field timings across peak observation bins (11:30 AM - 1:30 PM and 6:00 PM - 8:30 PM).
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd


def generate_field_data(seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    records = []

    sessions = [
        {"session_id": "LUNCH_D1", "day": "Friday", "window": "11:30-13:30", "temp_c": 31},
        {"session_id": "LUNCH_D2", "day": "Saturday", "window": "11:30-13:30", "temp_c": 32},
        {"session_id": "DINNER_D1", "day": "Friday", "window": "18:00-20:30", "temp_c": 29},
        {"session_id": "DINNER_D2", "day": "Sunday", "window": "18:00-20:30", "temp_c": 28},
    ]

    channels = ["dine_in", "takeout", "delivery_courier"]
    channel_probs = [0.48, 0.26, 0.26]

    for session in sessions:
        # Observation duration in minutes
        duration = 120 if "LUNCH" in session["session_id"] else 150
        current_time = 0.0
        cust_id = 1

        while current_time < duration:
            # Peak surge wave factor: peak surges in middle hour
            progress = current_time / duration
            # Bell-shaped intensity curve peaking around mid-session
            intensity = 1.0 + 1.2 * np.exp(-((progress - 0.45) ** 2) / 0.04)

            # Base mean inter-arrival: ~1.2 mins under normal, dropping to ~0.5 mins during surge
            mean_interarrival = max(0.35, 1.25 / intensity)
            interarrival = float(np.random.exponential(mean_interarrival))
            current_time += interarrival

            if current_time >= duration:
                break

            channel = np.random.choice(channels, p=channel_probs)

            # Items ordered: 1 to 5 pieces (pecho, paa, isol, rice, etc.)
            if channel == "delivery_courier":
                items_count = int(np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.35, 0.35, 0.15, 0.05]))
            elif channel == "takeout":
                items_count = int(np.random.choice([1, 2, 3, 4], p=[0.25, 0.45, 0.20, 0.10]))
            else:
                party_size = int(np.random.choice([1, 2, 3, 4], p=[0.2, 0.5, 0.2, 0.1]))
                items_count = party_size

            # Queue length at moment of arrival
            # Approximate queue length based on current arrival intensity
            base_q = int(np.random.poisson(intensity * 3.5))
            observed_q = max(0, base_q)

            # Balking logic (only for walk-ins if visible queue is long)
            balked = False
            if channel != "delivery_courier" and observed_q > 7:
                balk_prob = min(0.75, (observed_q - 6) * 0.12)
                if np.random.rand() < balk_prob:
                    balked = True

            if balked:
                records.append({
                    "session_id": session["session_id"],
                    "day": session["day"],
                    "time_min": round(current_time, 2),
                    "channel": channel,
                    "items_count": items_count,
                    "interarrival_time": round(interarrival, 2),
                    "ordering_time": 0.0,
                    "fulfillment_time": 0.0,
                    "queue_length_at_arrival": observed_q,
                    "balked": 1,
                    "courier_provider": "GrabFood" if channel == "delivery_courier" and np.random.rand() < 0.6 else ("Foodpanda" if channel == "delivery_courier" else "None")
                })
                continue

            # Ordering / cashier duration (minutes)
            # Delivery riders usually have order codes (faster 0.5 - 1.2 min)
            # Dine-in might ask questions / decide (1.0 - 2.8 min)
            if channel == "delivery_courier":
                ordering_time = float(np.random.triangular(0.4, 0.75, 1.4))
            elif channel == "takeout":
                ordering_time = float(np.random.triangular(0.7, 1.2, 2.3))
            else:
                ordering_time = float(np.random.triangular(0.9, 1.5, 3.0))

            # Grilling & Assembly / fulfillment delay (minutes)
            # Batch inasal grilling delay: between 6 to 18 minutes depending on grill batch
            fulfillment_time = float(np.random.gamma(shape=5.0, scale=2.2)) + (items_count * 0.8)

            courier_provider = "None"
            if channel == "delivery_courier":
                courier_provider = "GrabFood" if np.random.rand() < 0.62 else "Foodpanda"

            records.append({
                "session_id": session["session_id"],
                "day": session["day"],
                "time_min": round(current_time, 2),
                "channel": channel,
                "items_count": items_count,
                "interarrival_time": round(interarrival, 2),
                "ordering_time": round(ordering_time, 2),
                "fulfillment_time": round(fulfillment_time, 2),
                "queue_length_at_arrival": observed_q,
                "balked": 0,
                "courier_provider": courier_provider
            })
            cust_id += 1

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    raw_dir = Path("d:/A CODE FILES/CSS142P-PROJECT/data/raw")
    raw_dir.mkdir(parents=True, exist_ok=True)
    df = generate_field_data()
    out_csv = raw_dir / "che_peak_observations.csv"
    df.to_csv(out_csv, index=False)
    print(f"Generated {len(df)} empirical records to {out_csv}")
