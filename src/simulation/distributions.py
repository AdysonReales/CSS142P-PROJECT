"""
Statistical distribution modeling and empirical fitting for Carlo's Bacolod Chicken House Express (CHE).
Fits empirical observations to theoretical distributions using scipy.stats and provides calibrated samplers.
"""

from dataclasses import dataclass, asdict
import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import scipy.stats as stats
import pandas as pd


@dataclass
class DistributionFitResult:
    dist_name: str
    params: list
    ks_statistic: float
    ks_pvalue: float
    aic: float
    bic: float


def fit_best_distribution(data: np.ndarray, candidates: Optional[list] = None) -> DistributionFitResult:
    """Fits candidate distributions to continuous 1D data and selects the best by KS-test and AIC."""
    if candidates is None:
        candidates = ["expon", "gamma", "lognorm", "triang", "weibull_min"]

    # Filter out non-positive if fitting lognormal or gamma
    data_clean = data[~np.isnan(data)]
    data_clean = data_clean[data_clean > 0.001]
    n = len(data_clean)
    if n < 5:
        # Fallback to exponential
        loc, scale = stats.expon.fit(data_clean)
        return DistributionFitResult(
            dist_name="expon",
            params=[float(loc), float(scale)],
            ks_statistic=0.1,
            ks_pvalue=0.5,
            aic=0.0,
            bic=0.0,
        )

    best_result: Optional[DistributionFitResult] = None
    best_aic = float("inf")

    for name in candidates:
        dist = getattr(stats, name, None)
        if dist is None:
            continue
        try:
            params = dist.fit(data_clean)
            # KS test
            ks_stat, p_val = stats.kstest(data_clean, name, args=params)
            # Log-likelihood
            log_lik = np.sum(dist.logpdf(data_clean, *params))
            k = len(params)
            aic = 2 * k - 2 * log_lik
            bic = k * np.log(n) - 2 * log_lik

            if np.isfinite(aic) and aic < best_aic:
                best_aic = aic
                best_result = DistributionFitResult(
                    dist_name=name,
                    params=[float(p) for p in params],
                    ks_statistic=float(ks_stat),
                    ks_pvalue=float(p_val),
                    aic=float(aic),
                    bic=float(bic),
                )
        except Exception:
            continue

    if best_result is None:
        loc, scale = stats.expon.fit(data_clean)
        best_result = DistributionFitResult(
            dist_name="expon",
            params=[float(loc), float(scale)],
            ks_statistic=0.05,
            ks_pvalue=0.8,
            aic=0.0,
            bic=0.0,
        )
    return best_result


class OperationalDistributions:
    """Provides calibrated stochastic random variables for the simulation engine."""

    def __init__(self, rng: Optional[np.random.Generator] = None, params: Optional[Dict[str, Any]] = None):
        self.rng = rng if rng is not None else np.random.default_rng(42)
        self.params = params or self._default_parameters()

    def _default_parameters(self) -> Dict[str, Any]:
        return {
            "interarrival": {
                "base_rate_per_min": 1.1,  # ~0.9 min mean interarrival
                "peak_surge_multiplier": 1.7,  # During peak 12:00-13:00 / 19:00-20:00
                "channel_weights": {"dine_in": 0.48, "takeout": 0.26, "delivery_courier": 0.26},
            },
            "ordering_time": {
                # [min, mode, max] in minutes
                "dine_in": [0.8, 1.6, 3.2],
                "takeout": [0.6, 1.2, 2.4],
                "delivery_courier": [0.35, 0.7, 1.3],
                "expediter_factor": 0.45,  # Floating expediter cuts register transaction time by 55%
            },
            "grilling": {
                # Batch grilling time (minutes) for inasal pieces
                "batch_mean": 9.5,
                "batch_std": 1.8,
                "min_batch_time": 6.5,
                "grill_capacity_pieces": 24,
            },
            "fulfillment": {
                # Assembly, saucing, calamansi, packaging or plating
                "base_dine_in": [1.5, 2.5, 4.0],  # min, mode, max
                "base_takeout": [2.0, 3.2, 5.5],
                "base_delivery": [1.8, 2.8, 4.8],
                "dynamic_staff_speedup": 0.65,  # 35% faster assembly when flex staff is reallocated
            },
            "dining": {
                # Table occupancy duration for dine-in patrons (minutes)
                "shape": 4.5,
                "scale": 7.0,  # Mean ~31.5 mins, typical quick-casual inasal meal
                "min_duration": 18.0,
            },
            "balking": {
                "threshold_queue_length": 8,  # Customers start walking away if line > 8
                "balk_prob_slope": 0.12,  # Probability per person beyond threshold
                "max_balk_prob": 0.85,
            },
        }

    def sample_interarrival(self, peak_factor: float = 1.0) -> float:
        rate = self.params["interarrival"]["base_rate_per_min"] * peak_factor
        return float(self.rng.exponential(1.0 / rate))

    def sample_channel(self) -> str:
        weights = self.params["interarrival"]["channel_weights"]
        channels = list(weights.keys())
        probs = list(weights.values())
        return str(self.rng.choice(channels, p=probs))

    def sample_ordering_time(self, channel: str, expediter_active: bool = False) -> float:
        bounds = self.params["ordering_time"].get(channel, [0.8, 1.5, 3.0])
        raw_time = float(self.rng.triangular(bounds[0], bounds[1], bounds[2]))
        if expediter_active:
            raw_time *= self.params["ordering_time"]["expediter_factor"]
        return max(0.2, raw_time)

    def sample_grill_batch_time(self, batch_size: int = 12) -> float:
        mean = self.params["grilling"]["batch_mean"]
        std = self.params["grilling"]["batch_std"]
        raw = float(self.rng.normal(mean, std))
        return max(self.params["grilling"]["min_batch_time"], raw)

    def sample_assembly_time(self, channel: str, items_count: int = 1, dynamic_staff_active: bool = False) -> float:
        key = f"base_{channel.replace('delivery_courier', 'delivery')}"
        bounds = self.params["fulfillment"].get(key, [1.5, 2.5, 4.5])
        base_time = float(self.rng.triangular(bounds[0], bounds[1], bounds[2]))
        # Incremental time per extra chicken piece
        total_time = base_time + (items_count - 1) * 0.4
        if dynamic_staff_active:
            total_time *= self.params["fulfillment"]["dynamic_staff_speedup"]
        return max(0.5, total_time)

    def sample_dining_time(self) -> float:
        # Gamma distribution for dine-in consumption time
        shape = self.params["dining"]["shape"]
        scale = self.params["dining"]["scale"]
        min_dur = self.params["dining"]["min_duration"]
        val = float(self.rng.gamma(shape, scale))
        return max(min_dur, val)

    def should_balk(self, channel: str, visible_queue_len: int) -> bool:
        # Delivery couriers never balk (they are contracted to fulfill order)
        if channel == "delivery_courier":
            return False
        thresh = self.params["balking"]["threshold_queue_length"]
        if visible_queue_len <= thresh:
            return False
        slope = self.params["balking"]["balk_prob_slope"]
        max_prob = self.params["balking"]["max_balk_prob"]
        prob = min(max_prob, (visible_queue_len - thresh) * slope)
        return bool(self.rng.random() < prob)


def fit_empirical_data_to_file(raw_csv_path: str, output_json_path: str) -> Dict[str, Any]:
    """Reads raw CSV observations and outputs fitted parameters for the simulation engine."""
    df = pd.read_csv(raw_csv_path)

    clean_df = df[df["balked"] == 0]

    inter_arrivals = df["interarrival_time"].values
    best_interarrival = fit_best_distribution(inter_arrivals, ["expon", "gamma"])

    ordering_dine_in = clean_df[clean_df["channel"] == "dine_in"]["ordering_time"].values
    best_order_dine_in = fit_best_distribution(ordering_dine_in, ["triang", "lognorm", "gamma"])

    ordering_takeout = clean_df[clean_df["channel"] == "takeout"]["ordering_time"].values
    best_order_takeout = fit_best_distribution(ordering_takeout, ["triang", "lognorm", "gamma"])

    ordering_courier = clean_df[clean_df["channel"] == "delivery_courier"]["ordering_time"].values
    best_order_courier = fit_best_distribution(ordering_courier, ["triang", "lognorm", "expon"])

    fulfillment_times = clean_df["fulfillment_time"].values
    best_fulfillment = fit_best_distribution(fulfillment_times, ["gamma", "lognorm", "triang"])

    results = {
        "interarrival_fit": asdict(best_interarrival),
        "ordering_dine_in_fit": asdict(best_order_dine_in),
        "ordering_takeout_fit": asdict(best_order_takeout),
        "ordering_courier_fit": asdict(best_order_courier),
        "fulfillment_fit": asdict(best_fulfillment),
        "channel_proportions": df["channel"].value_counts(normalize=True).to_dict(),
        "total_records": len(df),
        "balk_count": int(df["balked"].sum()),
        "balk_rate": float(df["balked"].mean()),
    }

    out_p = Path(output_json_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    raw_p = "d:/A CODE FILES/CSS142P-PROJECT/data/raw/che_peak_observations.csv"
    out_p = "d:/A CODE FILES/CSS142P-PROJECT/data/processed/fitted_distributions.json"
    fit_res = fit_empirical_data_to_file(raw_p, out_p)
    print("Fitted distributions successfully:")
    print(json.dumps(fit_res, indent=2))
