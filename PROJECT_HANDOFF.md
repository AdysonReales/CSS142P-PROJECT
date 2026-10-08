# Carlo's Bacolod Chicken House Express (CHE) Makati — Project & Presentation Handoff Guide

**Project Title:** Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach  
**Course & Institution:** CSS142P Modeling and Simulation | AY 2025–2026  
**Research Team:**
- **Sean Earl Y. Bornilla** (Presenter 1)
- **Joven Terence O. Cantalejo** (Presenter 2)
- **Adyson M. Reales** (Presenter 3)

---

## 1. Executive Summary

This repository contains the complete empirical data, discrete-event simulation model, interactive 3D digital twin, and academic defense presentation package for our university research study on **Carlo's Bacolod Chicken House Express (CHE)** at Savana Commercial Center, Makati City.

The study investigates CHE's severe peak lunch and dinner queue bottlenecks caused by a single shared cashier Point-of-Sale (POS) counter handling **Dine-In (41.7%)**, **Walk-In Takeout (30.8%)**, and **Third-Party Delivery Couriers (27.5%)**. Using empirical stopwatch observations ($N = 120$ arrivals) and an event-driven SimPy simulation ($30$ Monte Carlo replications), we evaluated targeted operational interventions that reduce customer waiting times by up to **88.6%** and suppress customer balking from **47.3% down to 3.7%**.

---

## 2. Quick Start Guide (How to Run Everything)

### Step 1: Clone or Download Repository
```bash
git clone https://github.com/AdysonReales/CSS142P-PROJECT.git
cd CSS142P-PROJECT
```

### Step 2: Set Up Virtual Environment & Install Dependencies
```bash
# Optional: Create virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install all simulation and presentation dependencies
pip install -r requirements.txt
```

### Step 3: Run the Interactive Web Dashboard & 3D Twin
```bash
python -m src.visualization.dashboard 8080
```
* Open your browser and navigate to: **`http://localhost:8080`**
* Click **`START`** to run the simulation in real time.
* Switch between **Baseline**, **Decoupling (A)**, **Expediter (B)**, **Dynamic Staffing (C)**, and **Combined Policy**.
* Use the **Analytics** tab to inspect live telemetry charts and distribution histograms.

### Step 4: Run Automated Unit Tests
```bash
python -m unittest discover tests
```

---

## 3. Repository Architecture & Key Files

```
CSS142P-PROJECT/
├── presentation/                                 # Academic Defense Presentation Package
│   ├── CHE_Makati_Simulation_Final_Presentation.pptx # 17-Slide Editable Widescreen PowerPoint
│   ├── CHE_PRESENTATION_SCRIPT_3_SPEAKERS.md     # Word-for-Word 3-Person Defense Script
│   ├── CHE_PRESENTATION_NOTES.md                 # Graph Analysis, Formulas & Panel Q&A
│   ├── CHE_PRESENTATION_SOURCES.md               # Data Provenance & Validation Audit
│   └── figures/                                  # High-Resolution Research Charts (PNG)
│
├── data/
│   ├── raw/
│   │   ├── che_observations.csv                  # 120 Primary Stopwatch Field Records
│   │   ├── che_observations.xlsx                 # Excel Source Workbook
│   │   └── che_peak_observations.csv             # 603 Multi-Session Observations
│   └── processed/
│       ├── calibrated_inputs.json                # Statistical Distribution Fits & KS-Tests
│       └── scenario_results.json                 # 30-Replication Monte Carlo Results
│
├── src/                                          # Python Core Simulation & Analytics
│   ├── simulation/
│   │   ├── queue_model.py                        # Multi-Stage SimPy Discrete-Event Engine
│   │   ├── distributions.py                      # Calibrated Stochastic Random Variables
│   │   └── entities.py                           # Customer, Channel & Table Data Classes
│   ├── optimization/
│   │   └── scenario_runner.py                    # Multi-Scenario Replication Runner
│   ├── data_processing/
│   │   └── importer.py                           # Data Ingestion & Validation Pipeline
│   └── visualization/
│       ├── dashboard.py                          # Local Web Server Backend
│       └── renderer_3d.py                        # Spatial Visualizer Utilities
│
├── web/                                          # Frontend Interactive Digital Twin
│   ├── index.html                                # Academic Web Dashboard Layout
│   ├── styles.css                                # Design System & Telemetry Styling
│   ├── scene_3d.js                               # Three.js 3D Twin & Waypoint Navigation
│   ├── simulation_engine.js                      # Client-Side Discrete-Event Engine
│   └── app.js                                    # UI Event Bridge & Telemetry HUD
│
├── scripts/
│   ├── build_academic_presentation.py            # Automated PPTX Deck Generator
│   └── generate_presentation_figures.py          # Academic Matplotlib/Seaborn Chart Generator
│
├── references/                                   # Authentic Field Photos & Proposal PDF
│   ├── che-entrance-photo.jpg                    # Savana Market Exterior Storefront
│   ├── che-interior-photo.jpg                    # Interior Dining Room Photo
│   └── project-proposal.pdf                      # Original Research Proposal
│
└── tests/                                        # Automated Test Suite
    ├── test_simulation.py                        # SimPy Engine Logic Tests
    ├── test_distributions.py                     # Statistical Fitting Tests
    ├── test_importer.py                          # Data Ingestion Tests
    └── test_web_server.py                        # Dashboard Server Tests
```

---

## 4. Academic Presentation & Defense Package Guide

All presentation materials are located in [`presentation/`](presentation/):

### 1. PowerPoint Slide Deck ([`CHE_Makati_Simulation_Final_Presentation.pptx`](presentation/CHE_Makati_Simulation_Final_Presentation.pptx))
* **Format:** 16:9 Widescreen (17 Slides).
* **Aesthetic:** Academic research defense theme with off-white background, deep charcoal typography, authentic restaurant photographs, and high-resolution empirical charts (no generic AI/SaaS dashboard styling).
* **Slide Sequence & Assigned Speakers:**
  * **Slides 1–5 (Sean Earl Y. Bornilla):** Title, Savana Market Context, Triple-Channel Bottleneck, Objectives & Scope.
  * **Slides 6–10 (Joven Terence O. Cantalejo):** Field Data Protocol, Empirical Arrival Surge, Input Modeling, SimPy Network Architecture, 3D Digital Twin.
  * **Slides 11–16 (Adyson M. Reales):** Baseline Diagnostics, Intervention Scenarios (A, B, C & Combined), Waiting Time & Balking Results, Trade-Off Frontier, Sensitivity Stress Tests, Model Validation.
  * **Slide 17 (All Presenters):** Phased Managerial Roadmap, Concluding Remarks & Open Q&A Defense.

### 2. Spoken Defense Script ([`CHE_PRESENTATION_SCRIPT_3_SPEAKERS.md`](presentation/CHE_PRESENTATION_SCRIPT_3_SPEAKERS.md))
* Provides the **complete word-for-word spoken dialogue** for all three team members.
* Balanced speaking allocations (~4.5 to 5.0 minutes per presenter, totaling ~14.5 minutes).
* Includes verbal transition cues between speakers.

### 3. Technical Reference & Defense Preparation ([`CHE_PRESENTATION_NOTES.md`](presentation/CHE_PRESENTATION_NOTES.md))
* Detailed numerical commentary and graph explanations.
* Exact mathematical formulations (Little's Law, Time-Weighted $L_q$, Server Utilization $\rho$, Gamma/Triangular PDFs, 95% Confidence Intervals).
* Model answers for anticipated panel defense questions.

---

## 5. Summary of Empirical Findings & Experimental Results

### Empirical Baseline Reality (Single Shared Counter, 120-Min Peak Lunch)
* **Total Customer Arrivals:** 120 patrons (~1 arrival/min, surging to 1 arrival/35s during 12:15–12:45 PM).
* **Cashier Utilization ($\rho$):** **97.72%** (Severe bottleneck saturation).
* **Mean Waiting Time ($W_q$):** **13.02 minutes** (Peak queue $L_{max} = 22.1$ pax).
* **Customer Balking Rate ($P_{balk}$):** **47.27%** (Over 80 customers walk away per rush).
* **Courier Mean Dwell Time:** **68.58 minutes**.

### Evaluated Interventions (30 Monte Carlo Replications with 95% CI)

| Metric | Baseline | Scenario A (Decoupling) | Scenario B (Expediter) | Scenario C (Dynamic Staff) | Combined Policy (A + B + C) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mean Wait $W_q$ (min)** | 13.02 | **1.60** (-87.7%) | **5.05** (-61.2%) | 14.69 | **1.48** (-88.6%) |
| **Balking Rate (%)** | 47.27% | **20.76%** | **17.76%** | 46.92% | **3.73%** (-92.1%) |
| **Peak Queue $L_{max}$ (pax)**| 22.10 | **8.18** | **7.65** | 14.18 | **4.02** |
| **Courier Dwell Time (min)** | 68.58 | **59.59** | **62.40** | **56.09** | **51.71** (-24.6%) |
| **Order Throughput (ord/hr)**| 7.52 | **9.85** | **10.12** | 7.84 | **12.35** (+64.2%) |

### Phased Managerial Recommendations for CHE Management
1. **Phase 1 (Immediate, Zero-Cost):** Deploy **Scenario B (Floating Expediter)** using paper pre-order slips during peak lunch (12:00–1:00 PM) to recover 60%+ of lost sales immediately.
2. **Phase 2 (Workflow Reallocation):** Deploy **Scenario C (Dynamic Staffing)** by shifting 1 prep staff to front assembly during peak rush to cut courier dwell time.
3. **Phase 3 (Infrastructure Investment):** Install a secondary **Express POS 2 Terminal (Scenario A)** to permanently decouple delivery couriers and walk-in takeout from dine-in guests.

---

## 6. Git Repository & Remote Sync

* **GitHub Repository URL:** `https://github.com/AdysonReales/CSS142P-PROJECT.git`
* **Default Branch:** `main`
* All presentation files, empirical data, and simulation code are committed and up to date.
