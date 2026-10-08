"""
Robust Data Ingestion & Validation Pipeline for CHE Makati Observation Workbooks.
Supports both .xlsx (Excel) and .csv with rigorous time parsing, channel normalization,
missing-value validation, and provenance auditing.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
import re
import numpy as np
import pandas as pd


CANONICAL_COLUMNS = [
    "Observation_ID",
    "Channel",
    "Arrival_Time",
    "Queue_Length_Lq",
    "Balked",
    "Cashier_Service_Min",
    "Grill_Assembly_Min",
    "Dining_Duration_Min",
    "Exit_Time",
    "Total_System_Min",
]

CHANNEL_SYNONYMS = {
    "dine_in": ["dine-in", "dine in", "dining", "dine_in", "dinein"],
    "takeout": ["takeout", "take out", "take-out", "takeaway", "take away", "walk-in takeout", "walk-in-takeout"],
    "delivery": ["delivery", "delivery courier", "delivery_courier", "courier", "grabfood", "foodpanda", "grab", "panda", "rider", "riders"],
}


@dataclass
class ValidationReport:
    source_file: str
    file_type: str
    sheet_name: Optional[str]
    total_raw_rows: int
    valid_rows: int
    invalid_rows: int
    channel_counts: Dict[str, int] = field(default_factory=dict)
    balked_counts: Dict[str, int] = field(default_factory=dict)
    missing_rates: Dict[str, float] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    time_window: Dict[str, str] = field(default_factory=dict)
    session_duration_minutes: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ObservationDataImporter:
    """Imports, cleans, normalizes, and validates CHE Makati field observations."""

    def __init__(self, session_start_str: str = "11:30:00 AM"):
        self.session_start_str = session_start_str
        self.session_start_time = self._parse_clock_str(session_start_str)

    def _parse_clock_str(self, val: str) -> time:
        val = str(val).strip()
        for fmt in ("%I:%M:%S %p", "%I:%M %p", "%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(val, fmt).time()
            except ValueError:
                pass
        return time(11, 30, 0)

    def time_to_session_minutes(self, val: Any) -> Optional[float]:
        """Converts diverse time formats into relative simulation minutes from session start."""
        if pd.isna(val) or val is None or str(val).strip() == "":
            return None

        # 1. Handle datetime object
        if isinstance(val, (datetime, pd.Timestamp)):
            t = val.time()
            diff_sec = (t.hour * 3600 + t.minute * 60 + t.second) - (
                self.session_start_time.hour * 3600 + self.session_start_time.minute * 60 + self.session_start_time.second
            )
            return round(diff_sec / 60.0, 3)

        # 2. Handle Python time object
        if isinstance(val, time):
            diff_sec = (val.hour * 3600 + val.minute * 60 + val.second) - (
                self.session_start_time.hour * 3600 + self.session_start_time.minute * 60 + self.session_start_time.second
            )
            return round(diff_sec / 60.0, 3)

        # 3. Handle Excel serial float (e.g. 0.47942 = 11:30:22)
        if isinstance(val, (float, int)) and 0.0 <= float(val) <= 1.0:
            total_seconds = float(val) * 86400.0
            start_seconds = self.session_start_time.hour * 3600 + self.session_start_time.minute * 60 + self.session_start_time.second
            return round((total_seconds - start_seconds) / 60.0, 3)

        # 4. Handle String time representation
        val_str = str(val).strip()
        for fmt in ("%I:%M:%S %p", "%I:%M %p", "%H:%M:%S", "%H:%M", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(val_str, fmt)
                t = dt.time()
                diff_sec = (t.hour * 3600 + t.minute * 60 + t.second) - (
                    self.session_start_time.hour * 3600 + self.session_start_time.minute * 60 + self.session_start_time.second
                )
                return round(diff_sec / 60.0, 3)
            except ValueError:
                pass

        # Try regex search for H:M:S AM/PM
        match = re.search(r"(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?", val_str)
        if match:
            h = int(match.group(1))
            m = int(match.group(2))
            s = int(match.group(3) or 0)
            ampm = (match.group(4) or "").upper()
            if ampm == "PM" and h < 12:
                h += 12
            elif ampm == "AM" and h == 12:
                h = 0
            diff_sec = (h * 3600 + m * 60 + s) - (
                self.session_start_time.hour * 3600 + self.session_start_time.minute * 60 + self.session_start_time.second
            )
            return round(diff_sec / 60.0, 3)

        return None

    def normalize_channel(self, raw_val: Any) -> Tuple[str, str]:
        """Maps raw channel variations to canonical 'dine_in', 'takeout', 'delivery'."""
        if pd.isna(raw_val) or raw_val is None:
            return "unknown", "Unknown"

        raw_str = str(raw_val).strip()
        lower = raw_str.lower()

        for canonical, aliases in CHANNEL_SYNONYMS.items():
            if lower in aliases:
                return canonical, raw_str

        # Substring heuristics
        if "dine" in lower:
            return "dine_in", raw_str
        if "take" in lower or "away" in lower:
            return "takeout", raw_str
        if "deliver" in lower or "grab" in lower or "panda" in lower or "courier" in lower:
            return "delivery", raw_str

        return "unknown", raw_str

    def parse_balked(self, val: Any) -> Optional[bool]:
        """Parses Balked column into boolean."""
        if pd.isna(val) or val is None or str(val).strip() == "":
            return None
        s = str(val).strip().lower()
        if s in ("yes", "y", "true", "t", "1", "1.0", "balked"):
            return True
        if s in ("no", "n", "false", "f", "0", "0.0", "stayed"):
            return False
        return None

    def load_file(self, filepath: Union[str, Path], sheet_name: Optional[str] = None) -> Tuple[pd.DataFrame, ValidationReport]:
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Observation file not found: {path}")

        ext = path.suffix.lower()
        if ext in (".xlsx", ".xls"):
            file_type = "excel"
            excel_file = pd.ExcelFile(path)
            sheet = sheet_name or excel_file.sheet_names[0]
            df = pd.read_excel(path, sheet_name=sheet)
        elif ext in (".csv", ".txt"):
            file_type = "csv"
            sheet = None
            # Robust CSV reading with multiple delimiter checks and UTF-8-BOM support
            try:
                df = pd.read_csv(path, encoding="utf-8-sig")
            except Exception:
                df = pd.read_csv(path, sep=None, engine="python", encoding="latin1")
        else:
            raise ValueError(f"Unsupported file format: {ext}. Only .xlsx, .xls, and .csv are supported.")

        return self.process_dataframe(df, source_file=str(path), file_type=file_type, sheet_name=sheet)

    def process_dataframe(
        self,
        raw_df: pd.DataFrame,
        source_file: str = "in_memory",
        file_type: str = "dataframe",
        sheet_name: Optional[str] = None
    ) -> Tuple[pd.DataFrame, ValidationReport]:
        """Validates and standardizes dataframe schema."""
        warnings: List[str] = []

        # Header normalization with flexible aliases
        col_aliases = {
            "arrival_time": "Arrival_Time",
            "arrival_clock": "Arrival_Time",
            "arrival": "Arrival_Time",
            "exit_time": "Exit_Time",
            "exit_clock": "Exit_Time",
            "exit": "Exit_Time",
            "observation_id": "Observation_ID",
            "obs_id": "Observation_ID",
            "queue_length_lq": "Queue_Length_Lq",
            "queue_length": "Queue_Length_Lq",
            "cashier_service_min": "Cashier_Service_Min",
            "grill_assembly_min": "Grill_Assembly_Min",
            "dining_duration_min": "Dining_Duration_Min",
            "total_system_min": "Total_System_Min",
            "balked": "Balked",
            "channel": "Channel",
        }

        col_mapping = {}
        for col in raw_df.columns:
            cleaned = str(col).strip()
            norm = cleaned.lower().replace(" ", "_").replace("-", "_")
            if norm in col_aliases:
                col_mapping[col] = col_aliases[norm]
            else:
                for canonical in CANONICAL_COLUMNS:
                    can_norm = canonical.lower().replace(" ", "_").replace("-", "_")
                    if norm == can_norm:
                        col_mapping[col] = canonical
                        break

        df = raw_df.rename(columns=col_mapping).copy()

        # Check required columns
        missing_cols = [c for c in CANONICAL_COLUMNS if c not in df.columns]
        if missing_cols:
            warnings.append(f"Missing canonical columns: {missing_cols}. Missing fields will default to null.")
            for c in missing_cols:
                df[c] = np.nan

        # Processing columns
        processed_records = []
        valid_rows = 0
        invalid_rows = 0

        channel_counts: Dict[str, int] = {"dine_in": 0, "takeout": 0, "delivery": 0, "unknown": 0}
        balked_counts: Dict[str, int] = {"balked": 0, "stayed": 0, "unspecified": 0}

        min_sim_time = float("inf")
        max_sim_time = float("-inf")

        for idx, row in df.iterrows():
            obs_id = str(row["Observation_ID"]).strip() if pd.notna(row["Observation_ID"]) else f"ROW-{idx+1:03d}"

            # Channel
            canonical_ch, raw_ch = self.normalize_channel(row["Channel"])
            channel_counts[canonical_ch] = channel_counts.get(canonical_ch, 0) + 1
            if canonical_ch == "unknown":
                warnings.append(f"Row {idx+1}: Unrecognized channel '{row['Channel']}'. Preserving as unknown.")

            # Timestamps
            raw_arr = row["Arrival_Time"]
            arr_min = self.time_to_session_minutes(raw_arr)

            raw_exit = row["Exit_Time"]
            exit_min = self.time_to_session_minutes(raw_exit)

            # Balked
            balked = self.parse_balked(row["Balked"])
            if balked is True:
                balked_counts["balked"] += 1
            elif balked is False:
                balked_counts["stayed"] += 1
            else:
                balked_counts["unspecified"] += 1

            # Durations
            cashier_min = pd.to_numeric(row["Cashier_Service_Min"], errors="coerce")
            grill_min = pd.to_numeric(row["Grill_Assembly_Min"], errors="coerce")
            dining_min = pd.to_numeric(row["Dining_Duration_Min"], errors="coerce")
            total_sys = pd.to_numeric(row["Total_System_Min"], errors="coerce")
            q_len = pd.to_numeric(row["Queue_Length_Lq"], errors="coerce")

            # Numeric validity checks
            is_valid = True
            if arr_min is None:
                is_valid = False
                warnings.append(f"Row {idx+1} ({obs_id}): Invalid or unparseable Arrival_Time '{raw_arr}'.")
            else:
                min_sim_time = min(min_sim_time, arr_min)
                max_sim_time = max(max_sim_time, arr_min)

            if cashier_min is not None and not np.isnan(cashier_min) and cashier_min < 0:
                is_valid = False
                warnings.append(f"Row {idx+1}: Negative cashier service time ({cashier_min}).")

            if is_valid:
                valid_rows += 1
            else:
                invalid_rows += 1

            processed_records.append({
                "Observation_ID": obs_id,
                "Channel": canonical_ch,
                "Raw_Channel": raw_ch,
                "Arrival_Clock": str(raw_arr) if pd.notna(raw_arr) else "",
                "Arrival_Min": arr_min,
                "Queue_Length_Lq": int(q_len) if pd.notna(q_len) and q_len >= 0 else 0,
                "Balked": bool(balked) if balked is not None else False,
                "Cashier_Service_Min": float(cashier_min) if pd.notna(cashier_min) and cashier_min >= 0 else np.nan,
                "Grill_Assembly_Min": float(grill_min) if pd.notna(grill_min) and grill_min >= 0 else np.nan,
                "Dining_Duration_Min": float(dining_min) if pd.notna(dining_min) and dining_min >= 0 else np.nan,
                "Exit_Clock": str(raw_exit) if pd.notna(raw_exit) else "",
                "Exit_Min": exit_min,
                "Total_System_Min": float(total_sys) if pd.notna(total_sys) and total_sys >= 0 else np.nan,
            })

        out_df = pd.DataFrame(processed_records)

        # Calculate empirical interarrival gaps (within session sorted by arrival time)
        if not out_df.empty and out_df["Arrival_Min"].notna().sum() > 1:
            out_df = out_df.sort_values(by="Arrival_Min").reset_index(drop=True)
            out_df["Interarrival_Min"] = out_df["Arrival_Min"].diff().fillna(0.0)
            out_df.loc[out_df["Interarrival_Min"] < 0, "Interarrival_Min"] = 0.0

            # Per-channel interarrivals
            out_df["Channel_Interarrival_Min"] = np.nan
            for ch in ["dine_in", "takeout", "delivery"]:
                mask = out_df["Channel"] == ch
                out_df.loc[mask, "Channel_Interarrival_Min"] = out_df.loc[mask, "Arrival_Min"].diff().fillna(0.0)

        # Missing rates
        total = len(out_df)
        missing_rates = {
            col: round(float(out_df[col].isna().sum() / total * 100.0), 1) if total > 0 else 0.0
            for col in out_df.columns
        }

        duration = max(0.0, max_sim_time - min_sim_time) if min_sim_time != float("inf") else 0.0

        report = ValidationReport(
            source_file=source_file,
            file_type=file_type,
            sheet_name=sheet_name,
            total_raw_rows=len(raw_df),
            valid_rows=valid_rows,
            invalid_rows=invalid_rows,
            channel_counts=channel_counts,
            balked_counts=balked_counts,
            missing_rates=missing_rates,
            warnings=warnings[:30],  # Cap warning log length
            time_window={
                "min_sim_min": str(round(min_sim_time, 2)) if min_sim_time != float("inf") else "N/A",
                "max_sim_min": str(round(max_sim_time, 2)) if max_sim_time != float("-inf") else "N/A",
            },
            session_duration_minutes=round(duration, 2),
        )

        return out_df, report


def import_observation_file(filepath: Union[str, Path], sheet_name: Optional[str] = None) -> Tuple[pd.DataFrame, ValidationReport]:
    importer = ObservationDataImporter()
    return importer.load_file(filepath, sheet_name=sheet_name)


def import_and_validate(filepath: Union[str, Path], sheet_name: Optional[str] = None) -> Tuple[pd.DataFrame, ValidationReport]:
    return import_observation_file(filepath, sheet_name=sheet_name)


def parse_time_to_minutes(time_val: Any, session_start_str: str = "11:30:00 AM") -> float:
    """Parses arbitrary clock string or object to absolute minutes of the day (0 = midnight)."""
    importer = ObservationDataImporter(session_start_str=session_start_str)
    if isinstance(time_val, str):
        val_str = time_val.strip()
        for fmt in ("%I:%M:%S %p", "%I:%M %p", "%H:%M:%S", "%H:%M", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(val_str, fmt)
                return dt.hour * 60.0 + dt.minute + dt.second / 60.0
            except ValueError:
                pass
    return 0.0


def normalize_channel(channel_str: Any) -> str:
    """Normalizes channel string into 'dine_in', 'takeout', or 'delivery'."""
    importer = ObservationDataImporter()
    canonical, _ = importer.normalize_channel(channel_str)
    return canonical


if __name__ == "__main__":
    # Test importing references/che_peak_lunch_data.csv
    ref_path = Path("references/che_peak_lunch_data.csv")
    if ref_path.exists():
        df, report = import_observation_file(ref_path)
        print("Imported successfully!")
        print(f"Total rows: {report.total_raw_rows}, Valid: {report.valid_rows}")
        print("Channel breakdown:", report.channel_counts)
        print("Balked breakdown:", report.balked_counts)
        print("Time window:", report.time_window)

        # Export canonical CSV and genuine XLSX to data/raw/
        raw_dir = Path("data/raw")
        raw_dir.mkdir(parents=True, exist_ok=True)
        df.to_csv(raw_dir / "che_observations.csv", index=False)
        df.to_excel(raw_dir / "che_observations.xlsx", index=False, sheet_name="Peak_Lunch_Observations")
        print("Exported canonical data to data/raw/che_observations.csv and .xlsx")
