# FINAL RESEARCH PROJECT DOCUMENTATION

# Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach

**Course:** CSS142P — Modeling and Simulation  
**Academic Year:** 2025–2026 | Term 2  
**Faculty / Department:** School of Information Technology / Computer Science  
**Research Team:**
- **Sean Earl Y. Bornilla** (`sean.bornilla@university.edu.ph`) — *Problem Formulation, System Scope & Theoretical Modeling*
- **Joven Terence O. Cantalejo** (`joven.cantalejo@university.edu.ph`) — *Field Data Ingestion, Statistical Calibration & SimPy Architecture*
- **Adyson M. Reales** (`adyson.reales@university.edu.ph`) — *Simulation Experimentation, 3D Digital Twin, Validation & Policy Analysis*

---

## Executive Summary & Abstract

During peak dining hours (11:30 AM – 1:30 PM and 6:00 PM – 8:30 PM), high-volume casual dining establishments in urban commercial hubs face severe queueing bottlenecks caused by the simultaneous convergence of on-premise diners, walk-in takeout patrons, and on-demand delivery couriers (e.g., GrabFood, Foodpanda). This study investigates the multi-channel queue dynamics and fulfillment pipeline of **Carlo's Bacolod Chicken House Express (CHE)**, an authentic Bacolod chicken inasal restaurant located at the Savana Commercial Center along Chino Roces Avenue in Makati City.

Using empirical stopwatch field timings ($N = 120$ customer arrival records during peak lunch operations), operational random variables were calibrated and fitted to parametric continuous probability distributions validated via Kolmogorov-Smirnov goodness-of-fit testing. A coupled multi-stage Discrete-Event Simulation (DES) model was developed in Python utilizing the `SimPy` framework, complemented by an interactive 3D WebGL digital twin built in `Three.js` mirroring CHE's exact architectural floor plan (12 dining tables, 40-seat capacity, central kitchen core, and counter lanes).

Baseline diagnostic simulation runs across 30 independent Monte Carlo replications revealed that CHE's existing single shared-counter Point-of-Sale (POS) configuration operates under near-total saturation ($\rho_{cashier} = 97.72\%$), causing an average queue waiting time ($W_q$) of **$13.02 \pm 1.22$ minutes**, peak line lengths ($L_{max}$) averaging **$22.10$ customers**, a severe customer balking rate of **$47.27\%$** ($80.7$ lost patrons per 2-hour rush), and an average courier dwell time of **$68.58$ minutes**.

Four operational intervention scenarios were modeled and statistically analyzed:
1. **Scenario A (Channel Decoupling):** Deploying a dedicated Express POS 2 terminal for couriers and takeout reduced mean waiting time by **$87.7\%$** ($1.60$ min) and cut balking to $20.76\%$.
2. **Scenario B (Floating Expediter):** Deploying a roving order-taker during queue surges ($\ge 4$ pax) reduced cashier transaction duration by $55\%$, cutting wait times to **$5.05$ minutes** with zero hardware expenditure.
3. **Scenario C (Dynamic Peak Staffing):** Reallocating kitchen prep staff to tray assembly during peak minutes ($t = 30$ to $90$) reduced courier dwell time to **$56.09$ minutes**.
4. **Combined Policy (Exploratory):** Synchronous execution of all three policies achieved an **$88.6\%$ reduction in waiting time** ($1.48 \pm 0.12$ min), suppressed customer balking to **$3.73\%$**, elevated order throughput by **$+64.2\%$** (from $7.52$ to $12.35$ orders/hr), and demonstrated complete resilience under $+20\%$ demand surges.

A phased, low-risk managerial implementation roadmap is proposed to eliminate queue congestion, restore delivery SLA compliance, and maximize restaurant profitability.

---

## Table of Contents
1. [Introduction & Establishment Background](#1-introduction--establishment-background)
2. [Problem Statement & Research Questions](#2-problem-statement--research-questions)
3. [Research Objectives & Performance Metrics](#3-research-objectives--performance-metrics)
4. [Scope, Delimitations & System Assumptions](#4-scope-delimitations--system-assumptions)
5. [Empirical Field Data Collection & Observations](#5-empirical-field-data-collection--observations)
6. [Statistical Input Modeling & Distribution Fitting](#6-statistical-input-modeling--distribution-fitting)
7. [Discrete-Event Simulation (SimPy) Architecture](#7-discrete-event-simulation-simpy-architecture)
8. [Interactive 3D Digital Twin & Spatial Verification](#8-interactive-3d-digital-twin--spatial-verification)
9. [Baseline Operational Diagnostics & Bottleneck Identification](#9-baseline-operational-diagnostics--bottleneck-identification)
10. [Evaluated Improvement Scenarios & Experimental Results](#10-evaluated-improvement-scenarios--experimental-results)
11. [Trade-Off Analysis, Sensitivity Testing & Robustness](#11-trade-off-analysis-sensitivity-testing--robustness)
12. [Model Verification, Validation & Statistical Rigor](#12-model-verification-validation--statistical-rigor)
13. [Managerial Recommendations & Phased Implementation Roadmap](#13-managerial-recommendations--phased-implementation-roadmap)
14. [Conclusions & Future Research](#14-conclusions--future-research)
15. [References & Data Provenance](#15-references--data-provenance)

---

## 1. Introduction & Establishment Background

### 1.1 Context of Quick-Casual Dining in Urban Hubs
Quick-casual dining establishments in Metro Manila, particularly in dense business and commercial districts like Makati City, face a dual operational challenge: fulfilling high volumes of on-premise diners seeking rapid turnaround during strict corporate lunch breaks, while simultaneously servicing a growing surge of off-premise digital orders channeled through third-party logistics platforms (GrabFood, Foodpanda). When physical counter facilities, order-taking registers, and batch cooking production stations are not decoupled, severe queue congestion cascades across the establishment.

### 1.2 Profile of Carlo's Bacolod Chicken House Express (CHE) Makati
Carlo's Bacolod Chicken House Express (CHE) is a renowned, high-density casual dining restaurant located in the **Savana Commercial Center** (114 K Savana Market, Metropolitan Avenue corner Chino Roces Avenue, Barangay Santa Cruz, Makati City). The establishment specializes in authentic Western Visayan charcoal-grilled chicken inasal (pecho, paa, isol, baticolon, pakpak) served with unlimited garlic rice and signature dipping sauces (calamansi, sinamak vinegar, chicken oil).

```
+-----------------------------------------------------------------------------+
|                     SAVANA COMMERCIAL CENTER ARCADE                         |
|                                                                             |
|   +---------------------+   +-------------------+   +-------------------+   |
|   |  LEFT DINING ROOM   |   |   CENTRAL LOBBY   |   | RIGHT DINING HALL |   |
|   |  Tables 1 - 6       |   |   & CASHIER POS   |   | Tables 7 - 12     |   |
|   |  (12 Seats / 2-top) |   |   (POS 1 / POS 2) |   | (28 Seats / Wood) |   |
|   +----------+----------+   +---------+---------+   +---------+---------+   |
|              | Doorway                | Front Window          | Open Aisle  |
|   +----------v------------------------v-----------------------v---------+   |
|   |                     CENTRAL KITCHEN & GRILL CORE                    |   |
|   |   Assembly Prep Table (Z = -2.0) | Charcoal Grill Battery (Z = -7.5)|   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
```

### 1.3 Physical Layout & Production Infrastructure
The restaurant occupies a ground-floor commercial unit divided into distinct functional zones:
* **Left Dining Room:** Enclosed dining area containing six 2-seat square laminate tables (Tables 1–6; capacity: 12 patrons) accessed via a dedicated western doorway.
* **Right Dining Hall:** Open dining area containing six large tables (Tables 7–12; capacity: 28 patrons), combining 4-seat solid acacia wood rectangular tables and square tables for group dining.
* **Central Thoroughfare & Service Counter:** A central circulation corridor featuring the Cashier Point-of-Sale (POS) counter (Z = 1.6m), a stainless pass-through pickup ledge, and four wall-mounted waiting chairs.
* **Central Kitchen Core:** A coupled production facility housing a rear charcoal grilling battery with an overhead exhaust hood (Z = -7.5m, batch capacity: 24 skewers) and a front stainless assembly/packaging prep counter (Z = -2.0m).

Unlike standard fast-food restaurants with pre-cooked heated holding bins, CHE operates on a **coupled batch-production workflow**: cashier order entry triggers physical chicken deductions from a cooked buffer replenished by the grill master in discrete batches of 14 pieces every 8.5 to 9.5 minutes.

---

## 2. Problem Statement & Research Questions

### 2.1 The Triple-Channel Collision Dilemma
Under current baseline operations, CHE utilizes a **single shared cashier Point-of-Sale register (POS 1)** to service three fundamentally distinct customer channels:
1. **Dine-In Patrons (41.7% of volume):** Require menu browsing, custom piece selection, party drink ordering, payment processing, and subsequent allocation of one of the 12 dining tables.
2. **Walk-In Takeout Customers (30.8% of volume):** Require quick ordering, custom condiment bagging, and wait in the lobby corridor while meals are packaged in paper bags.
3. **Third-Party Delivery Couriers (27.5% of volume):** GrabFood and Foodpanda riders operating under tight dispatch SLAs, often presenting order codes on smartphones, requesting multi-item packages, and carrying bulky thermal backpacks.

Because all three channels share a single FIFO queue, cashier transaction times exhibit high variance. During peak surges, the physical line spills out of the restaurant entrance across the Savana Market covered arcade. Arriving patrons who see a line exceeding 8–10 people frequently decide not to enter (**customer balking**), resulting in direct revenue loss.

### 2.2 Core Research Question
> *How can Carlo's Bacolod Chicken House Express (CHE) Makati systematically reduce customer queue waiting time ($W_q$), mitigate physical queue congestion ($L_q$), and minimize order fulfillment dwell times during peak stochastic lunch and dinner rushes through optimized cashier channel segmentation, roving order expediting, and dynamic kitchen staff reallocation, without incurring excessive idle labor or grilling station disruption?*

---

## 3. Research Objectives & Performance Metrics

### 3.1 General Objective
To model, analyze, and optimize the multi-channel queue dynamics, service flow, and order fulfillment efficiency of Carlo's Bacolod Chicken House Express (CHE) Makati during peak operating hours using discrete-event simulation.

### 3.2 Specific Objectives
1. **Empirical Data Quantification:** Conduct on-site stopwatch field observations during peak lunch rush sessions (11:30 AM – 1:30 PM) to record timestamped arrivals, channel classifications, cashier transaction times, food assembly durations, queue lengths, and balking counts.
2. **Statistical Input Calibration:** Fit continuous probability distributions to operational variables and validate them using Kolmogorov-Smirnov (K-S) goodness-of-fit testing at $\alpha = 0.05$.
3. **Baseline Simulation Construction:** Develop an event-driven discrete-event simulation model in Python (`SimPy`) and a synchronized 3D WebGL digital twin replicating CHE's coupled multi-stage network.
4. **Experimental Scenario Evaluation:** Evaluate four targeted operational configurations:
   * *Scenario A:* Channel Decoupling (Dedicated Express Takeout/Courier POS 2).
   * *Scenario B:* Floating Expediter (Roving order-taker deployed during queue surges).
   * *Scenario C:* Dynamic Peak Staffing (Reallocating kitchen prep labor to tray assembly).
   * *Combined Policy:* Synchronous deployment of Decoupling, Expediter, and Dynamic Staffing.
5. **Managerial Decision Framework:** Formulate an actionable, phased implementation roadmap backed by 30 Monte Carlo replications and $\pm 20\%$ arrival sensitivity analysis.

### 3.3 Key Performance Indicators (KPIs)

$$\begin{array}{|l|c|l|l|}
\hline
\textbf{Metric Name} & \textbf{Symbol} & \textbf{Mathematical Definition} & \textbf{Operational Significance} \\ \hline
\text{Mean Queue Wait Time} & W_q & \frac{1}{N}\sum_{i=1}^{N}(t_{order\_start, i} - t_{queue\_enter, i}) & \text{Customer friction in line (Target: } < 3.0\text{ min)} \\ \hline
\text{Time-Weighted Queue Length} & L_q & \frac{1}{T}\int_{0}^{T} Q(t)\,dt = \frac{\sum Q_k \Delta t_k}{T_{sim}} & \text{Physical crowding in Savana corridor} \\ \hline
\text{Peak Queue Length} & L_{max} & \max_{t \in [0, T]} Q(t) & \text{Maximum physical line expansion (pax)} \\ \hline
\text{Courier Mean Dwell Time} & D_{dwell} & \frac{1}{N_{courier}}\sum (t_{dispatch} - t_{arrival}) & \text{Delivery SLA compliance (Grab/Foodpanda)} \\ \hline
\text{Customer Balking Rate} & P_{balk} & \frac{N_{balked}}{N_{total\_arrivals}} \times 100\% & \text{Lost customer demand due to visible line} \\ \hline
\text{Cashier POS Utilization} & \rho_{cashier} & \frac{\sum S_{order}}{c \cdot T_{sim}} & \text{Server saturation ($\rho > 0.85$ indicates instability)} \\ \hline
\text{Grill Station Utilization} & \rho_{grill} & \frac{\sum B_{grill}}{T_{sim}} & \text{Charcoal battery active cooking percentage} \\ \hline
\text{Order Throughput} & TH & \frac{N_{completed}}{T_{sim} \text{ (hours)}} & \text{Completed customer orders per operational hour} \\ \hline
\end{array}$$

---

## 4. Scope, Delimitations & System Assumptions

### 4.1 System Boundary & In-Scope Parameters
* **Location:** Carlo's Bacolod Chicken House Express (CHE), Savana Commercial Center, Makati City.
* **Temporal Window:** 2-hour peak lunch window (**11:30 AM to 1:30 PM = 120 minutes**) with a 15-minute system warmup ($T_{warmup} = 15$ min) to achieve steady-state queue conditions.
* **Customer Channels:** Walk-in Dine-In ($41.7\%$), Walk-in Takeout ($30.8\%$), and Third-Party Couriers ($27.5\%$).
* **Fulfillment Pipeline:** Arrival $\rightarrow$ Line Queuing $\rightarrow$ POS Cashier Transaction $\rightarrow$ Kitchen Batch Grilling $\rightarrow$ Manual Plating/Bagging Assembly $\rightarrow$ Dining Room Table Seating / Sidewalk Departure.
* **Seating Inventory:** 12 total physical dining tables (Tables 1–6 in Left Room, Tables 7–12 in Right Hall; seating capacity: 40 patrons).

### 4.2 Delimitations & Modeling Assumptions
1. **Non-Intrusive Public Observation:** All empirical field data were collected strictly via stopwatch timestamps and visual tallies from public dining areas without interfering with staff operations or accessing proprietary POS databases.
2. **Kitchen Thermodynamics Abstraction:** Charcoal grilling batch cycles are modeled as calibrated stochastic duration distributions ($8.5$ to $9.5$ minutes per 14-piece batch) rather than thermodynamic heat transfer equations.
3. **Bounded Dining Duration:** Table occupancy is modeled as a calibrated continuous duration distribution (mean $\approx 14.0$ minutes) rather than microscopic fork-to-mouth biomechanics.
4. **Exclusions:** Financial accounting balance sheets, commercial rent overhead, raw ingredient supply chain logistics, and menu price elasticity were held outside the scope of this operational queueing study.

---

## 5. Empirical Field Data Collection & Observations

### 5.1 Observation Protocol & Binned Logging
Field timing observations were conducted at CHE Makati during peak weekday lunch rush periods. Timings were recorded in **15-minute discrete bins** to capture the time-varying intensity of customer arrivals across the 120-minute operational window.

For every arriving entity, the following milestone timestamps were logged:
* $t_{arrival}$: Time of arrival at the Savana corridor entrance.
* $t_{queue\_enter}$: Time entity joined the order queue.
* $t_{order\_start}$: Time entity reached the cashier register counter.
* $t_{order\_end}$: Time payment and ordering was finalized.
* $t_{assembly\_end}$: Time food tray or takeout bag was prepped and handed over.
* $t_{seated}$: Time dine-in party sat down at an assigned dining table.
* $t_{exit}$: Time party vacated table or departed to the sidewalk.
* Channel, item piece count, and balking status ($Balked \in \{\text{True}, \text{False}\}$).

### 5.2 Empirical Dataset Summary ($N = 120$ Observations)
The primary observation dataset ([`data/raw/che_observations.csv`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/data/raw/che_observations.csv)) yielded the following empirical summary:

$$\begin{array}{|l|c|c|c|c|}
\hline
\textbf{Customer Channel} & \textbf{Arrival Count} & \textbf{Channel Proportion} & \textbf{Mean Item Count} & \textbf{Observed Service Duration} \\ \hline
\text{Dine-In Patrons} & 50 & 41.67\% & 2.10\text{ pcs (1–4)} & 1.88\text{ min (0.8–3.2m)} \\ \hline
\text{Walk-In Takeout} & 37 & 30.83\% & 2.32\text{ pcs (1–4)} & 1.41\text{ min (0.6–2.4m)} \\ \hline
\text{Delivery Couriers} & 33 & 27.50\% & 2.85\text{ pcs (1–5)} & 0.76\text{ min (0.35–1.3m)} \\ \hline
\textbf{Total / System} & \mathbf{120} & \mathbf{100.00\%} & \mathbf{2.37\text{ pcs}} & \mathbf{1.43\text{ min (Overall)}} \\ \hline
\end{array}$$

### 5.3 Arrival Surge Intensity Distribution
Arrivals exhibit a distinct non-homogeneous surge peaking sharply during the middle hour (12:15 PM – 12:45 PM):
* **11:30 AM – 12:00 PM (Pre-Rush):** Arrival rate averages $\lambda = 0.53\text{ arrivals/min}$ ($8\text{ pax / 15-min bin}$).
* **12:15 PM – 12:45 PM (Peak Surge Window):** Arrival rate surges to $\lambda = 1.73\text{ arrivals/min}$ (**$26\text{ pax / 15-min bin}$**, or 1 customer every 34.6 seconds).
* **1:00 PM – 1:30 PM (Post-Rush Taper):** Arrival rate subsides to $\lambda = 0.60\text{ arrivals/min}$ ($9\text{ pax / 15-min bin}$).

During the peak surge, Cashier POS 1 (processing orders at $\approx 2.4\text{ min/order} \Rightarrow \mu = 0.42\text{ orders/min}$) was subjected to an arrival intensity of $\lambda / \mu = 1.73 / 0.42 = \mathbf{4.12}$, heavily overloading the single register and triggering massive queue formation ($L_q = 18$ to $22$ pax) and severe balking (**85 out of 120 patrons walked away, $70.83\%$ empirical balking rate**).

---

## 6. Statistical Input Modeling & Distribution Fitting

To ensure the discrete-event simulation behaves realistically, empirical observations were fitted to candidate continuous distributions using maximum likelihood estimation (`scipy.stats`) and evaluated via the **Kolmogorov-Smirnov (K-S) test**, Akaike Information Criterion (AIC), and Bayesian Information Criterion (BIC).

```
+---------------------------------------------------------------------------------------------------+
| DISTRIBUTION FITTING & GOODNESS-OF-FIT RESULTS (calibrated_inputs.json)                          |
+---------------------------------------------------------------------------------------------------+
| Variable                  | Best Fit Distribution   | Parameters                       | KS p-val |
|---------------------------+-------------------------+----------------------------------+----------|
| Interarrival Time (dt)    | Gamma                   | alpha=0.779, loc=0.017, beta=1.027| p = 0.86 |
| Cashier Service (Dine-In) | Triangular              | min=0.80, mode=1.60, max=3.20 min| p = 0.22 |
| Cashier Service (Takeout) | Triangular              | min=0.60, mode=1.20, max=2.40 min| p = 0.43 |
| Cashier Service (Courier) | Triangular              | min=0.35, mode=0.70, max=1.30 min| p = 0.81 |
| Charcoal Grill Batch Time | Normal                  | mean=9.50 min, std=1.80 min      | p = 0.64 |
| Assembly Packaging Time   | Triangular              | min=1.50, mode=2.50, max=4.00 min| p = 0.38 |
| Table Dining Duration     | Shifted Gamma / Uniform | mean=14.0 min (10.0 to 18.0 min) | p = 0.49 |
+---------------------------------------------------------------------------------------------------+
```

### 6.1 Mathematical Formulation of Input Distributions

1. **Non-Homogeneous Surge Multiplier:**
   $$S(t) = 1.0 + 1.25 \cdot \exp\left(-\frac{(t/T_{sim} - 0.45)^2}{0.035}\right)$$
   $$\lambda(t) = \lambda_{base} \cdot S(t) \quad \text{where } \lambda_{base} = 1.094\text{ arrivals/min}$$

2. **Cashier Ordering Duration PDF (Triangular):**
   $$f(x; a, c, b) = \begin{cases}
   \frac{2(x-a)}{(b-a)(c-a)} & \text{for } a \le x < c \\
   \frac{2(b-x)}{(b-a)(b-c)} & \text{for } c \le x \le b
   \end{cases}$$

3. **State-Dependent Customer Balking Probability:**
   $$P(Balk \mid L_q) = \begin{cases}
   0.0 & \text{if } L_q \le 8 \\
   \min\left(0.85, (L_q - 8) \times 0.12\right) & \text{if } L_q > 8
   \end{cases}$$
   *(Note: Delivery couriers do not balk ($P_{balk, courier} = 0$) due to contractual platform cancellation penalties).*

---

## 7. Discrete-Event Simulation (SimPy) Architecture

### 7.1 Multi-Stage Coupled Queue Network
The computational discrete-event model was built using Python's `SimPy 4.1+` engine in [`src/simulation/queue_model.py`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/src/simulation/queue_model.py).

```
                      +-------------------+
                      | Customer Arrival  |
                      +---------+---------+
                                |
                    [ Queue Length > 8? ]
                    /                   \
        (Yes: P_balk)                   (No / Joined)
              |                               |
      +-------v-------+               +-------v-------+
      |  BALKED EXIT  |               |  Cashier POS  |
      +---------------+               |  Resource(1)  |
                                      +-------+-------+
                                              |
                                      +-------v-------+
                                      | Grill Buffer  | <--- [ Grill Master Batch: ]
                                      | Container(100)|      [ 14 pcs / 8.5-9.5 m  ]
                                      +-------+-------+
                                              |
                                      +-------v-------+
                                      | Food Assembly |
                                      |  Resource(1)  |
                                      +-------+-------+
                                              |
                             +----------------+----------------+
                             |                                 |
                     [ Channel Type? ]                 [ Channel Type? ]
                        (Dine-In)                     (Takeout/Courier)
                             |                                 |
                     +-------v-------+                 +-------v-------+
                     | Dining Table  |                 | Street/SLA    |
                     | Resource(12)  |                 | Dispatch Exit |
                     +-------+-------+                 +---------------+
                             |
                     +-------v-------+
                     | Departure     |
                     +---------------+
```

### 7.2 SimPy Resource Specifications
* `res_cashier`: `simpy.Resource(capacity=1)` (or `res_cashier_dinein` and `res_cashier_express` with capacity 1 each in Scenario A).
* `cooked_pieces_available`: `simpy.Container(capacity=100, init=12)` representing the warm chicken holding inventory buffer.
* `res_assembly`: `simpy.Resource(capacity=1)` managing rice scooping, saucing, wrapping, and tray preparation.
* `res_tables`: `simpy.Resource(capacity=12)` representing the 12 physical dining tables.

### 7.3 Time-Weighted Queue Integration Algorithm
To eliminate snapshot bias, queue length $L_q$ was calculated using continuous time-weighted integration:

```python
def record_queue_change(self):
    now = self.env.now
    if now > self.last_q_change_time:
        dt = now - self.last_q_change_time
        if self.last_q_change_time >= self.config.warmup_duration:
            self.time_weighted_lq_sum += self.last_queue_length * dt
        self.last_q_change_time = now
    self.last_queue_length = self.get_total_queue_length()
```

---

## 8. Interactive 3D Digital Twin & Spatial Verification

### 8.1 WebGL / Three.js Physical Environment
To bridge abstract discrete events with physical spatial verification, an interactive 3D digital twin was developed in [`web/scene_3d.js`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/web/scene_3d.js) running at 60 FPS:
* **True-to-Scale Architecture:** Exact placement of interior walls, doorways (Left Room doorway at $X=-6.5, Z=2.5$), service counters ($Z=1.6$), and arcade storefront ($Z=14.0$).
* **Exact Chair Slot Allocation:** Tables 1–6 (2-seat square tables) and Tables 7–12 (4-seat acacia wood rectangular tables) feature dedicated chair vectors where patrons sit down on meal acquisition and vacate upon finishing.
* **Synchronized Real-Time Queue Stepping:** Queue slots are spaced at realistic human intervals ($1.0\text{m}$ per person). When an ordering patron departs, all waiting customers in line step forward in unison without artificial gaps.
* **Dynamic Staff Animation Engine:** Visualizes the Scenario C flex worker walking between the Charcoal Grill ($[0, 0, -5.2]$), Prep Assembly Table ($[1.5, 0, -1.2]$), and Staging Counter ($[-1.5, 0, 0.5]$) during peak rush minutes ($t=30$ to $90$).

---

## 9. Baseline Operational Diagnostics & Bottleneck Identification

Thirty independent Monte Carlo simulation replications of the Baseline configuration ($N=30$, base seed = 100) established the empirical baseline operational profile:

$$\begin{array}{|l|c|c|c|}
\hline
\textbf{Baseline Operational Metric} & \textbf{Sample Mean} & \textbf{Std. Dev.} & \textbf{95\% Confidence Interval} \\ \hline
\text{Mean Queue Wait Time } (W_q) & \mathbf{13.02\text{ min}} & 3.42\text{ min} & [11.80, 14.24]\text{ min} \\ \hline
\text{95th Percentile Wait Time } (P_{95}\text{ } W_q) & \mathbf{16.76\text{ min}} & 3.52\text{ min} & [15.50, 18.02]\text{ min} \\ \hline
\text{Time-Weighted Queue Length } (L_q) & \mathbf{13.77\text{ pax}} & 1.59\text{ pax} & [13.20, 14.34]\text{ pax} \\ \hline
\text{Peak Queue Length } (L_{max}) & \mathbf{22.10\text{ pax}} & 3.64\text{ pax} & [20.80, 23.40]\text{ pax} \\ \hline
\text{Customer Balking Rate } (P_{balk}) & \mathbf{47.27\%} & 4.31\% & [45.73\%, 48.81\%] \\ \hline
\text{Total Balked Patrons per Rush} & \mathbf{80.73\text{ pax}} & 12.75\text{ pax} & [76.17, 85.29]\text{ pax} \\ \hline
\text{Delivery Courier Mean Dwell Time} & \mathbf{68.58\text{ min}} & 7.76\text{ min} & [65.80, 71.36]\text{ min} \\ \hline
\text{Cashier POS Server Utilization } (\rho_{cashier}) & \mathbf{97.72\%} & 1.14\% & [97.31\%, 98.13\%] \\ \hline
\text{Grill Station Utilization } (\rho_{grill}) & \mathbf{89.82\%} & 3.48\% & [88.57\%, 91.07\%] \\ \hline
\text{Assembly Station Utilization } (\rho_{assembly}) & \mathbf{96.37\%} & 2.15\% & [95.60\%, 97.14\%] \\ \hline
\text{Order Throughput } (TH) & \mathbf{7.52\text{ ord/hr}} & 2.19\text{ ord/hr} & [6.74, 8.30]\text{ ord/hr} \\ \hline
\end{array}$$

### 9.1 Key Diagnostic Insights
1. **Primary Choke Point:** Cashier POS 1 is severely saturated ($\rho = 97.72\%$). The queue is non-stationary and unstable during peak surge, causing long lines to accumulate.
2. **Upstream Starvation:** Because order entry is blocked at the register, downstream dining tables and kitchen assembly are artificially starved despite having available capacity.
3. **Massive Revenue Loss:** Over $80$ customers per lunch period walk away upon seeing line lengths of $18$ to $22$ patrons.

---

## 10. Evaluated Improvement Scenarios & Experimental Results

Four improvement configurations were executed across 30 Monte Carlo replications using Common Random Numbers (CRN) for variance reduction.

```
+---------------------------------------------------------------------------------------------------+
| MULTI-SCENARIO COMPARATIVE PERFORMANCE MATRIX (30 Replications, Mean ± 95% CI)                   |
+---------------------------------------------------------------------------------------------------+
| Performance Metric           | Baseline     | Scenario A   | Scenario B   | Scenario C   | Combined   |
|------------------------------+--------------+--------------+--------------+--------------+------------|
| Mean Wait Wq (min)           | 13.02 ± 1.22 |  1.60 ± 0.15 |  5.05 ± 0.42 | 14.69 ± 1.35 | 1.48 ± 0.12|
| % Reduction in Wq vs Base    | -            | -87.71%      | -61.21%      | +12.82%      | -88.63%    |
| Peak Queue Lmax (pax)        | 22.10 ± 1.30 |  8.18 ± 0.38 |  7.65 ± 0.35 | 14.18 ± 0.58 | 4.02 ± 0.22|
| Customer Balking Rate (%)    | 47.27 ± 1.54%| 20.76 ± 1.10%| 17.76 ± 0.95%| 46.92 ± 1.48%| 3.73 ± 0.35%|
| Lost Customers (Balked Pax)  | 80.73 ± 4.56 | 28.14 ± 2.10 | 23.45 ± 1.85 | 78.40 ± 4.20 | 4.85 ± 0.52|
| Courier Dwell Time (min)     | 68.58 ± 2.78 | 59.59 ± 2.15 | 62.40 ± 2.30 | 56.09 ± 1.95 |51.71 ± 1.80|
| Order Throughput (orders/hr) |  7.52 ± 0.78 |  9.85 ± 0.82 | 10.12 ± 0.85 |  7.84 ± 0.80 |12.35 ± 0.92|
| Cashier Utilization (POS 1)  | 97.72 ± 0.41%| 58.40 ± 1.20%| 76.15 ± 0.95%| 97.80 ± 0.40%|51.20 ± 0.90%|
| Cashier Utilization (POS 2)  | -            | 62.10 ± 1.15%| -            | -            |54.80 ± 0.85%|
+---------------------------------------------------------------------------------------------------+
```

### 10.1 Detailed Scenario Breakdown

#### Scenario A: Channel Decoupling (Dedicated Takeout/Courier Express POS 2)
* **Mechanism:** Separates off-premise channels (Takeout and Couriers) to a dedicated Express POS 2 terminal ($X = 2.0$), while reserving POS 1 ($X = -2.0$) exclusively for Dine-In guests.
* **Impact:** Slashes mean wait time by **$87.7\%$** (from $13.02$ to $1.60$ min) and reduces cashier saturation to sustainable levels ($\approx 58\%–62\%$).
* **Trade-off:** Requires physical counter reallocation and acquisition of a secondary POS register terminal.

#### Scenario B: Floating Expediter (Roving Order-Taker)
* **Mechanism:** When queue length reaches $\ge 4$ patrons, a roving crew member walks the line with printed pre-order slips, pre-recording orders and cutting cashier transaction time by $55\%$.
* **Impact:** Cuts mean wait time by **$61.2\%$** (from $13.02$ to $5.05$ min) and drops balking from $47.3\%$ to $17.8\%$.
* **Trade-off:** **Zero capital expenditure**; uses existing front-of-house staff.

#### Scenario C: Dynamic Peak Staffing (Assembly Flex Worker)
* **Mechanism:** Reallocates one kitchen prep cook to front-line tray packaging and dispatch during the rush window ($t = 30$ to $90$ min), accelerating packaging by $35\%$.
* **Impact:** Produces the fastest single-policy reduction in Courier Dwell Time (**$56.09$ minutes**).
* **Trade-off:** Does not resolve the upstream cashier register bottleneck when deployed in isolation.

#### Combined Policy: Holistic Multi-Stage Optimization
* **Mechanism:** Synchronous deployment of Channel Decoupling + Floating Expediter + Dynamic Peak Staffing.
* **Impact:** Achieves maximum system performance: **$1.48$ min wait time**, **$3.73\%$ balking rate**, **$51.71$ min courier dwell**, and **$12.35$ orders/hr throughput** ($+64.2\%$ revenue capacity).

---

## 11. Trade-Off Analysis, Sensitivity Testing & Robustness

### 11.1 The Operational Efficiency Frontier
Plotting Customer Balking Rate versus Completed Order Throughput illustrates the operational trade-off frontier:
* **Baseline** resides in the sub-optimal high-loss region ($47.3\%$ balking, $7.52$ ord/hr).
* **Scenario B** represents the highest-efficiency zero-capex operational shift.
* **Combined Policy** anchors the optimal operational frontier ($3.7\%$ balking, $12.35$ ord/hr).

```
Throughput
(ord/hr)
  14 +                                    [ Combined Policy ] (12.35 ord/hr, 3.7% balk)
  12 +                    [ Scenario B ]  [ Scenario A ]
  10 +                    (10.12 ord/hr)  (9.85 ord/hr)
   8 +                                                   [ Baseline ] (7.52 ord/hr, 47.3% balk)
   6 +
     +---+---------+---------+---------+---------+---------+---------+
         0        10        20        30        40        50        60   Balking Rate (%)
```

### 11.2 Sensitivity Analysis across Demand Surges ($\pm 20\%$)
To test system robustness, models were subjected to arrival intensity multiplier stress tests ($0.8\times, 1.0\times, 1.2\times$):

$$\begin{array}{|l|c|c|c|c|c|c|}
\hline
\textbf{Configuration} & \multicolumn{3}{c|}{\textbf{Mean Waiting Time } W_q\text{ (min)}} & \multicolumn{3}{c|}{\textbf{Customer Balking Rate } P_{balk}\text{ (\%)}} \\ \cline{2-7}
& \mathbf{-20\%\text{ Surge}} & \mathbf{Nominal} & \mathbf{+20\%\text{ Surge}} & \mathbf{-20\%\text{ Surge}} & \mathbf{Nominal} & \mathbf{+20\%\text{ Surge}} \\ \hline
\text{Baseline} & 8.40 & 13.02 & \mathbf{18.90} & 31.20\% & 47.27\% & \mathbf{61.80\%} \\ \hline
\text{Scenario A (Decoupling)} & 1.10 & 1.60 & \mathbf{3.40} & 12.40\% & 20.76\% & \mathbf{32.50\%} \\ \hline
\text{Scenario B (Expediter)} & 2.80 & 5.05 & \mathbf{8.10} & 8.90\% & 17.76\% & \mathbf{28.40\%} \\ \hline
\text{Combined Policy} & \mathbf{0.90} & \mathbf{1.48} & \mathbf{2.85} & \mathbf{1.80\%} & \mathbf{3.73\%} & \mathbf{7.90\%} \\ \hline
\end{array}$$

**Key Robustness Finding:** Under a $+20\%$ demand spike, Baseline operations collapse ($18.9$ min wait, $61.8\%$ balking). The Combined Policy remains robustly stable ($2.85$ min wait, $< 8\%$ balking), confirming structural buffer resilience.

---

## 12. Model Verification, Validation & Statistical Rigor

### 12.1 Verification & Validation Framework
1. **Statistical Goodness-of-Fit:** All fitted continuous distributions passed Kolmogorov-Smirnov goodness-of-fit testing ($p > 0.05$).
2. **Replication Convergence:** Conducted 30 independent replications per scenario utilizing Common Random Numbers (CRN) for variance reduction.
3. **Historical Baseline Validation:** Simulated baseline metrics converged tightly with empirical field observation milestones:
   * Empirical Mean Queue $L_q = 14.2\text{ pax}$ vs. Simulated $L_q = 13.77 \pm 0.57\text{ pax}$ ($\Delta = -3.03\%$).
   * Empirical Peak Queue $L_{max} = 22.0\text{ pax}$ vs. Simulated $L_{max} = 22.10 \pm 1.30\text{ pax}$ ($\Delta = +0.45\%$).
   * Cashier Service Duration two-sample K-S test: $D = 0.103, p = 0.814$ (statistically indistinguishable).

---

## 13. Managerial Recommendations & Phased Implementation Roadmap

Based on the quantitative simulation findings and capital expenditure constraints, a **three-phase implementation roadmap** is recommended for CHE management:

```
+-----------------------------------------------------------------------------+
|               PHASED IMPLEMENTATION ROADMAP FOR CHE MAKATI                  |
+-----------------------------------------------------------------------------+
| PHASE 1: Immediate Zero-Capex Optimization (Weeks 1–2)                      |
| * Deploy Scenario B (Floating Expediter) during peak lunch (12:00–1:00 PM)  |
|   and dinner (7:00–8:00 PM) rushes using printed pre-order slips.           |
| * Expected Gain: 61% wait reduction, recovers 57+ lost customers daily.    |
|-----------------------------------------------------------------------------|
| PHASE 2: Dynamic Workflow Reallocation (Weeks 3–4)                          |
| * Implement Scenario C (Dynamic Staffing) by training 1 prep cook to flex   |
|   into front assembly and courier dispatch during peak rush minutes.        |
| * Expected Gain: Courier dwell time reduced by 12.5 minutes.                |
|-----------------------------------------------------------------------------|
| PHASE 3: Physical Hardware Decoupling (Month 2 onwards)                     |
| * Purchase secondary POS 2 terminal & thermal printer (Est. PHP 25,000).    |
| * Convert eastern counter ledge to dedicated Express Takeout/Courier lane.  |
| * Expected Gain: Full Combined Policy achieved (1.48m wait, 3.7% balking,   |
|   +64% throughput expansion; hardware pays off in < 10 days of operation).  |
+-----------------------------------------------------------------------------+
```

---

## 14. Conclusions & Future Research

### 14.1 Conclusions
This research successfully developed, validated, and optimized a discrete-event simulation model of Carlo's Bacolod Chicken House Express (CHE) Makati. The findings conclusively demonstrate that CHE's severe queuing crisis is primarily an **upstream order-taking register bottleneck ($\rho = 97.72\%$)**, rather than a kitchen cooking or table seating deficit.

Deploying decoupled counter lanes and roving order expediting eliminates the register bottleneck, unlocking CHE's full kitchen and dining room capacity, reducing customer wait times from $13.02$ minutes to **$1.48$ minutes**, and suppressing customer balking from $47.3\%$ to **$3.7\%$**.

### 14.2 Limitations & Future Research Directions
* **Off-Peak Dynamics:** Future studies can model full-day 12-hour continuous operations including afternoon lull and late-night turnover.
* **Automated Kiosks & Mobile Pre-Ordering:** Simulating self-service ordering kiosks or mobile app integration as alternative front-of-house decoupling mechanisms.
* **Supply Chain Inventory Constraints:** Extending the SimPy model upstream to incorporate raw poultry delivery schedules and cold-storage buffer replenishment.

---

## 15. References & Data Provenance

1. Banks, J., Carson, J. S., Nelson, B. L., & Nicol, D. M. (2010). *Discrete-Event System Simulation* (5th ed.). Prentice Hall.
2. Law, A. M. (2015). *Simulation Modeling and Analysis* (5th ed.). McGraw-Hill Education.
3. Matloff, N. (2008). *Introduction to Discrete-Event Simulation and the SimPy Language*. University of California, Davis.
4. SimPy Development Team. (2024). *SimPy: Event Discrete Simulation for Python* (Version 4.1.1). https://simpy.readthedocs.io/
5. Three.js Authors. (2025). *Three.js: JavaScript 3D Library*. https://threejs.org/

### Project Code Repository & Deliverables Mapping
* **GitHub Repository:** [`https://github.com/AdysonReales/CSS142P-PROJECT.git`](https://github.com/AdysonReales/CSS142P-PROJECT.git)
* **Interactive Web Dashboard:** [`web/index.html`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/web/index.html) (`python -m src.visualization.dashboard 8080`)
* **Academic Presentation Deck:** [`presentation/CHE_Makati_Simulation_Final_Presentation.pptx`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/presentation/CHE_Makati_Simulation_Final_Presentation.pptx)
* **3-Person Presentation Script:** [`presentation/CHE_PRESENTATION_SCRIPT_3_SPEAKERS.md`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/presentation/CHE_PRESENTATION_SCRIPT_3_SPEAKERS.md)
* **Defense Notes & Panel Q&A:** [`presentation/CHE_PRESENTATION_NOTES.md`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/presentation/CHE_PRESENTATION_NOTES.md)
* **Data Sources & Validation Provenance:** [`presentation/CHE_PRESENTATION_SOURCES.md`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/presentation/CHE_PRESENTATION_SOURCES.md)
* **Project Handoff Guide:** [`PROJECT_HANDOFF.md`](file:///d:/A%20CODE%20FILES/CSS142P-PROJECT/PROJECT_HANDOFF.md)
