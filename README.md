# Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo’s Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach

**Course:** CSS142P – Modeling & Simulation  
**Location Under Study:** Carlo’s Bacolod Chicken House Express (CHE), Savana Commercial Center, 114 K Savana Market, Metropolitan Ave. cor. Chino Roces Ave., Brgy. Sta. Cruz, Makati City.  
**Tech Stack:** Python (SimPy, SciPy, NumPy, Pandas), WebGL / Three.js 3D Digital Twin, Custom CSS Design System.

---

## 1. Project Introduction & Problem Statement

**Carlo’s Bacolod Chicken House Express (CHE)** at Savana Market in Makati is a high-volume dining establishment celebrated for authentic Bacolod chicken inasal. During peak lunch (**11:30 AM – 1:30 PM**) and peak dinner (**6:00 PM – 8:30 PM**) rushes, the restaurant experiences severe congestion driven by a concurrent influx of three channels:
1. **Walk-in Dine-In Customers** (~46%)
2. **Walk-in Takeout Customers** (~26%)
3. **Third-Party Delivery Couriers** (GrabFood & Foodpanda) (~27%)

### The Operational Bottleneck
Unlike a standard cafeteria counter, CHE operates a coupled multi-stage system: **Order-Taking / Cashiering $\rightarrow$ Charcoal Grilling Batch Production $\rightarrow$ Food Assembly & Tray/Takeout Packaging $\rightarrow$ Table Seating / Counter Handover**. When peak arrivals surge, a single shared register causes queues to spill into the Savana Market pedestrian arcade, triggering high customer balking (walkaways), aisle congestion, and delivery rider delays.

This project delivers a **Discrete-Event Simulation (DES)** digital sandbox in Python (`SimPy`) coupled with an **interactive 3D Digital Twin** built with Three.js to evaluate queue management, line segmentation, and dynamic staffing without disrupting live restaurant operations.

---

## 2. System Flow & Queuing Network

```
                                [ Arrival Stream: Non-Homogeneous Poisson ]
                                              │
                      ┌───────────────────────┼────────────────────────┐
                      ▼                       ▼                        ▼
               Dine-In Patrons          Takeout Patrons        Delivery Couriers
                   (~46%)                  (~26%)            (GrabFood / Foodpanda)
                      │                       │                        │
                      ├───────────────────────┴────────────────────────┤
                      │  Balking Check: Visible Queue Lq > 8 pax?      │
                      │  (Couriers do not balk; Walk-ins walk away)   │
                      └───────────────────────┬────────────────────────┘
                                              │
                                              ▼
                             [ STAGE 1: Order-Taking & Cashier ]
                              • Baseline: Single Shared Register
                              • Scen A: Decoupled Express Counter
                              • Scen B: Roving Pre-Order Expediter
                                              │
                                              ▼
                      [ STAGE 2: Charcoal Grilling Batch Production ]
                        • Continuous Inasal Grill Pit (24-pc capacity)
                        • Charcoal heat, smoke, warming buffer bin
                                              │
                                              ▼
                        [ STAGE 3: Food Assembly & Packaging ]
                        • Plating, saucing, calamansi, paper bagging
                        • Scen C: Dynamic Peak Flex Staffing
                                              │
                      ┌───────────────────────┴────────────────────────┐
                      ▼                                                ▼
              [ Dine-In Seating ]                             [ Direct Dispatch ]
         • 14 Dining Tables (~44 seats)                    • Takeout customer pickup
         • Consumption duration: ~31 mins                  • Courier quick departure
                      │                                                │
                      └───────────────────────┬────────────────────────┘
                                              ▼
                                         [ Departures ]
```

---

## 3. Scenario Optimization & Trade-Off Matrix

Monte Carlo replications ($N=20$ per scenario) evaluated under peak lunch rush conditions (120 minutes):

| Scenario | Mean $W_q$ (min) | 95% CI | Mean $L_q$ | Max $L_q$ | Courier Dwell | Balking Rate | Throughput | Cashier Util | Assembly Util |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Shared Register)** | **12.49m** | $\pm 2.10$ | 14.09 | 22.3 pax | 69.65m | **47.24%** | 7.35 /hr | 97.7% | 96.4% |
| **Scenario A: Channel Decoupling** | **1.50m** | $\pm 0.21$ | 8.46 | 15.47 pax | 63.34m | **19.71%** | 8.01 /hr | 83.2% | 96.2% |
| **Scenario B: Floating Expediter** | **5.04m** | $\pm 0.69$ | 7.92 | 14.87 pax | 64.89m | **18.35%** | 7.62 /hr | 97.5% | 96.3% |
| **Scenario C: Dynamic Peak Staffing** | **13.76m** | $\pm 1.81$ | 14.92 | 23.47 pax | 56.48m | 47.63% | **12.67 /hr** | 98.0% | 96.1% |
| **Combined Policy: Best Practice** | **1.43m** | $\pm 0.25$ | **4.42** | **11.73 pax** | **51.73m** | **3.61%** | **12.88 /hr** | 73.6% | 95.7% |

### Key Findings & Recommendations:
1. **Scenario A (Channel Decoupling):** Splitting Dine-In from Takeout/Couriers cuts queue wait time by **88%** (12.49m $\rightarrow$ 1.50m) and cuts balking by more than half, clearing the Savana corridor choke point.
2. **Scenario B (Floating Expediter):** Pre-ordering in line achieves a **60% wait reduction** with zero physical alteration or register hardware costs.
3. **Scenario C (Dynamic Peak Staffing):** Reallocating 1 kitchen prep worker to order packaging yields a **+72% surge in peak throughput** (7.35 $\rightarrow$ 12.67 orders/hr).
4. **Combined Policy:** Slashes balking from **47.2% down to 3.6%**, keeping customer wait under 1.5 minutes and courier dwell under 52 minutes.

---

## 4. Custom 3D Digital Twin (No "AI Slop")

The visualization environment is engineered specifically to represent Carlo's Bacolod Chicken House Express at Savana Market Makati:

- **The Inasal Charcoal Grill Pit:**
  - Firebrick masonry hearth with glowing ember bed and pulsating heat light.
  - Wire grill grates with skewers of chicken inasal (pecho, paa) glazed with golden annatto oil.
  - Suspended commercial exhaust hood with rising animated BBQ smoke and ember particles.
  - 3D Grill Master entity with white apron and tongs.
- **Order Counters & POS Stations:**
  - Solid timber and stainless steel counter with dual touchscreen POS terminals.
  - Acrylic sneeze guards and staging shelves with takeout bags.
  - Scenario A indicators: Counter 1 (Dine-In) and Counter 2 (Express Courier Pickup).
  - Floating expediter character patrolling the line in Scenario B.
- **Savana Dining Hall:**
  - 14 wooden tables, 4 chairs each, with Bacolod tabletop condiment caddies (Chicken Oil, Sinamak Spiced Vinegar, Soy Sauce).
  - Rotating industrial ceiling fans and warm bistro pendant lighting.
- **Multi-Channel Avatars:**
  - Dine-in customers (casual attire), Takeout customers (holding paper bags), and Third-party couriers (GrabFood emerald green jacket & thermal cube backpack, Foodpanda magenta jacket & thermal cube backpack, with helmets and visors).
  - Interactive camera presets: *Isometric Twin, Counter & Queue, Grill Station, Dining Hall, Savana Corridor*.

---

## 5. Repository Structure

```
CSS142P-PROJECT/
├── data/
│   ├── generate_empirical_data.py       # Stopwatch field data generator
│   ├── raw/che_peak_observations.csv    # 601 empirical field observation records
│   └── processed/
│       ├── fitted_distributions.json    # Fitted SciPy distributions (Gamma, Lognorm, Triang)
│       ├── scenario_results.json        # Monte Carlo 20-run tradeoff matrix
│       └── trajectory_baseline.json     # Granular 3D event stream log
├── docs/
│   ├── proposal.md                      # Complete academic project proposal
│   └── methodology.md                   # 6-step empirical simulation methodology
├── src/
│   ├── simulation/
│   │   ├── distributions.py             # SciPy goodness-of-fit (KS-test, AIC/BIC) & samplers
│   │   ├── entities.py                  # Customer, Courier, GrillBatch, DiningTable dataclasses
│   │   └── queue_model.py               # SimPy discrete-event simulation core engine
│   ├── optimization/
│   │   └── scenario_runner.py           # Multi-scenario Monte Carlo replication runner
│   └── visualization/
│       ├── dashboard.py                 # Local HTTP server launcher for the 3D visualizer
│       └── renderer_3d.py               # 3D trajectory exporter & helpers
├── tests/
│   ├── test_distributions.py            # Unit tests for distributions and samplers
│   └── test_simulation.py               # Unit tests for simulation scenarios and entities
├── web/
│   ├── index.html                       # 3D digital twin UI with HUD gauges & modals
│   ├── styles.css                       # Bespoke dark slate & inasal ember styling
│   ├── scene_3d.js                      # Three.js custom procedural 3D restaurant world
│   ├── simulation_engine.js             # Real-time client-side SimPy-equivalent state engine
│   └── app.js                           # UI wiring, playback controls, and telemetry feed
├── main.py                              # Unified CLI entry point
└── requirements.txt                     # Dependencies: simpy, numpy, scipy, pandas, matplotlib
```

---

## 6. Getting Started & How to Run

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the 3D Digital Twin Visualizer
To launch the interactive 3D WebGL simulation in your default browser:
```bash
python main.py --ui
```
*Access in browser at:* `http://localhost:8080`

### 3. Run Monte Carlo Scenario Optimization
To run the full multi-scenario simulation across 15+ replications and print the Trade-off Matrix:
```bash
python main.py
```

### 4. Re-fit Empirical Field Distributions
To re-fit the empirical observations from `data/raw/che_peak_observations.csv`:
```bash
python main.py --fit
```

### 5. Run Unit Tests
```bash
python -m unittest discover tests
```
