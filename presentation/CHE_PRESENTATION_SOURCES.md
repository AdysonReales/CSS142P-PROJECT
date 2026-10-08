# CHE Makati Simulation: Presentation Provenance & Data Sources

**Project Title:** Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach  
**Course & Institution:** CSS142P Modeling and Simulation | AY 2025–2026  
**Authors:** Sean Earl Y. Bornilla, Joven Terence O. Cantalejo, Adyson M. Reales  

---

## 1. Provenance of Presentation Figures & Artifacts

| Figure / Visual Asset | File Location | Data Source & Provenance | Generating Code / Reference |
| :--- | :--- | :--- | :--- |
| **Slide 2: Entrance Photo** | `references/che-entrance-photo.jpg` | On-site field photograph taken at Savana Commercial Center, Makati. | Authentic field photo (Savana Market storefront). |
| **Slide 2: Interior Photo** | `references/che-interior-photo.jpg` | Interior dining room field photograph showing yellow walls, tile floor, metal chairs. | Authentic field photo (CHE Makati interior). |
| **Slide 7: Arrival & Channels (Fig 1)** | `presentation/figures/fig1_arrival_frequency_and_channels.png` | `data/raw/che_observations.csv` ($N = 120$ arrivals) and `data/raw/che_peak_observations.csv`. | `scripts/generate_presentation_figures.py` (Lines 34–78). |
| **Slide 8: Distribution Fits (Fig 2)** | `presentation/figures/fig2_input_distribution_fits.png` | `data/processed/calibrated_inputs.json` (Fitted Gamma & Triangular distributions). | `scripts/generate_presentation_figures.py` (Lines 80–128) via `scipy.stats`. |
| **Slide 9: DES Flow Diagram (Fig 3)** | `presentation/figures/fig3_des_queue_network_diagram.png` | Conceptual model derived from `docs/proposal.md` and `src/simulation/queue_model.py`. | `scripts/generate_presentation_figures.py` (Lines 130–168). |
| **Slide 10: Digital Twin & Layout** | `web/scene_3d.js` & `references/pdf_pages/page_2.png` | Architectural floor plan of Savana unit; Three.js WebGL physical coordinates. | `web/scene_3d.js` (Tables 1–12, Kitchen, Counters). |
| **Slide 13: Scenario Results (Fig 6)** | `presentation/figures/fig6_scenario_waiting_and_queue_comparison.png` | `data/processed/scenario_results.json` (30 Monte Carlo replications per scenario). | `src/optimization/scenario_runner.py` & `scripts/generate_presentation_figures.py`. |
| **Slide 14: Frontier Trade-Off (Fig 7)** | `presentation/figures/fig7_throughput_and_balking_tradeoffs.png` | `data/processed/scenario_results.json` (Throughput vs. Balking rate data points). | `scripts/generate_presentation_figures.py` (Lines 200–225). |
| **Slide 15: Sensitivity Curves (Fig 8)** | `presentation/figures/fig8_sensitivity_analysis_arrival_surge.png` | `data/processed/scenario_results.json` (Sensitivity multiplier runs $\pm 20\%$). | `scripts/generate_presentation_figures.py` (Lines 227–260). |
| **Slide 16: Model Validation (Fig 9)** | `presentation/figures/fig9_validation_observed_vs_simulated.png` | `data/raw/che_observations.csv` vs. `data/processed/scenario_results.json`. | `scripts/generate_presentation_figures.py` (Lines 262–295). |

---

## 2. Primary Source Datasets

### 1. `data/raw/che_observations.csv` (120-Row Primary Observation Dataset)
* **File Path:** `file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/data/raw/che_observations.csv`
* **Total Records:** 120 customer arrival observations.
* **Observation Window:** 11:30 AM to 1:30 PM (120 minutes).
* **Columns:** `Observation_ID`, `Channel`, `Channel_Display`, `Clock_Time`, `Elapsed_Min`, `Queue_Length_Lq`, `Balked`, `Cashier_Service_Min`, `Grill_Assembly_Min`, `Dining_Duration_Min`, `Exit_Clock`, `Exit_Min`, `Total_System_Min`, `Interarrival_Min`, `Interarrival_Channel_Min`.
* **Summary Stats:** 50 Dine-In (41.7%), 37 Takeout (30.8%), 33 Delivery (27.5%). 35 served, 85 balked (70.83% balking rate).

### 2. `data/raw/che_peak_observations.csv` (Multi-Session Observation Dataset)
* **File Path:** `file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/data/raw/che_peak_observations.csv`
* **Total Records:** 603 session records across 4 lunch and dinner observation sessions (`LUNCH_D1`, `LUNCH_D2`, `DINNER_D1`, `DINNER_D2`).
* **Columns:** `session_id`, `day`, `time_min`, `channel`, `items_count`, `interarrival_time`, `ordering_time`, `fulfillment_time`, `queue_length_at_arrival`, `balked`, `courier_provider`.

---

## 3. Simulation Code Modules & Provenance

### 1. Discrete-Event Simulation Engine
* **File:** `src/simulation/queue_model.py`
* **Framework:** SimPy 4.1+ (Python 3.10)
* **Key Classes:** `ChickenHouseSimulation`, `Customer`, `DiningTable`, `ScenarioConfig`, `SimulationMetrics`.
* **Core Mechanisms:**
  * Coupled Multi-Stage Pipeline (`res_cashier`, `res_assembly`, `res_tables`, `cooked_pieces_available`).
  * Continuous Batch Grilling Process (`grill_master_process` yielding 14 pieces every 8.5–9.5 min).
  * Time-Weighted Queue Integration (`record_queue_change`).

### 2. Stochastic Probability Distributions
* **File:** `src/simulation/distributions.py`
* **Fitted Distributions:**
  * Interarrival: Gamma($\alpha = 0.779, \text{loc} = 0.017, \text{scale} = 1.027$).
  * Dine-In Ordering: Triangular($\text{min}=0.8, \text{mode}=1.6, \text{max}=3.2$).
  * Takeout Ordering: Triangular($\text{min}=0.6, \text{mode}=1.2, \text{max}=2.4$).
  * Courier Ordering: Triangular($\text{min}=0.35, \text{mode}=0.7, \text{max}=1.3$).
  * Table Occupancy: Gamma($\alpha = 4.5, \text{scale} = 7.0, \text{min} = 18.0$) or Uniform($10.0, 18.0$) in fast-forward mode.

### 3. Multi-Scenario Monte Carlo Runner
* **File:** `src/optimization/scenario_runner.py`
* **Execution Parameters:** 30 independent replications per scenario, base random seed = 100, common random numbers (CRN) across configurations.
* **Sensitivity Sweeps:** Arrival rate multipliers ($0.8\times, 1.0\times, 1.2\times$).

---

## 4. Verification and Validation Audit Checklist

- [x] All 17 PowerPoint slides created in 16:9 widescreen format.
- [x] Professional academic palette applied (Charcoal `#0F172A`, Off-white `#FAFAF9`, Crimson `#B22225`, Warm Amber `#D97706`).
- [x] No AI dashboard visual clichés (no glowing neon borders, no emoji headings, no SaaS marketing hype).
- [x] Authentic restaurant photographs embedded on Slide 2.
- [x] High-resolution charts generated directly from empirical data and 30-replication SimPy simulation outputs.
- [x] 3-Person presentation script formatted with explicit slide numbers, speaker names, and word-for-word spoken paragraphs.
- [x] Speaker allocations balanced: Bornilla (Slides 1–5), Cantalejo (Slides 6–10), Reales (Slides 11–16), All Presenters (Slide 17).
- [x] Technical defense notes and panel Q&A answers prepared.
- [x] Complete data provenance and source mapping documented.
