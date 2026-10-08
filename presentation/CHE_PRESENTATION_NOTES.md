# CHE Makati Simulation: Academic Defense Notes & Technical Reference

**Project Title:** Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach  
**Course & Institution:** CSS142P Modeling and Simulation | AY 2025–2026  
**Authors:** Sean Earl Y. Bornilla, Joven Terence O. Cantalejo, Adyson M. Reales  

---

## 1. Graph Explanations & Key Data Points

### Figure 1: Arrival Frequency by 15-Minute Interval & Channel Breakdown
* **File:** `presentation/figures/fig1_arrival_frequency_and_channels.png`
* **Subplot 1 (Left - Arrival Histogram):** 
  * Shows non-homogeneous Poisson arrival surges across the 120-minute lunch session (11:30 AM – 1:30 PM).
  * 11:30–12:00: Moderate arrival rate ($\approx 0.53\text{ pax/min}$).
  * 12:15–12:45 (Peak surge): Sharp spike peaking at **26 arrivals per 15-minute interval** ($\approx 1.73\text{ arrivals/min}$, or 1 arrival every 34.6 seconds).
  * 1:00–1:30: Tapering down to 8–10 arrivals per 15-minute bin.
* **Subplot 2 (Right - Channel Donut):**
  * **Dine-In Patrons:** 41.7% ($n=50$). Larger parties (1–4 pax), longer ordering times, requires table seating.
  * **Walk-In Takeout:** 30.8% ($n=37$). Individual/family packaging, no table seating, waits in lobby.
  * **Delivery Couriers:** 27.5% ($n=33$). GrabFood / Foodpanda, fast transactions, strict delivery app SLAs.
  * **Key Takeaway:** Over 58% of incoming volume is off-premise, yet competes for the same cashier register as dine-in.

---

### Figure 2: Statistical Input Distributions & Goodness-of-Fit
* **File:** `presentation/figures/fig2_input_distribution_fits.png`
* **Subplot 1 (Cashier Ordering Time $S_{order}$):**
  * **Dine-In:** Triangular($a=0.8, c=1.6, b=3.2$ min), Mean = 1.87 min, KS $p = 0.22$.
  * **Takeout:** Triangular($a=0.6, c=1.2, b=2.4$ min), Mean = 1.40 min, KS $p = 0.43$.
  * **Delivery Couriers:** Triangular($a=0.35, c=0.7, b=1.3$ min), Mean = 0.78 min, KS $p = 0.81$.
* **Subplot 2 (Interarrival Time $\Delta t$):**
  * Fitted to Gamma distribution: $\text{Gamma}(\alpha = 0.779, \beta = 1.027)$, location offset $= 0.017$ min.
  * Mean empirical interarrival $= 0.914$ min ($\lambda = 1.094\text{ arrivals/min}$).
  * KS test statistic $= 0.0825$, KS $p$-value $= 0.865$ (Fail to reject $H_0$; highly statistically valid fit).

---

### Figure 3: Coupled Discrete-Event Simulation Flow Architecture
* **File:** `presentation/figures/fig3_des_queue_network_diagram.png`
* **Flow Stages:**
  1. **Arrival Generator:** Non-homogeneous Poisson Process with Gamma interarrivals $\Delta t$.
  2. **Balking Evaluator:** If $L_q > 8$, $P(balk) = \min(0.85, (L_q - 8) \times 0.12)$.
  3. **Stage 1 (Cashier POS):** `simpy.Resource(capacity=1)` (or 2 in Decoupled Scenario A).
  4. **Stage 2A (Charcoal Grill):** `simpy.Container(capacity=100)`. Continuous batching: 14 pieces per 8.5–9.5 min.
  5. **Stage 2B (Assembly / Packaging):** `simpy.Resource(capacity=1)` (speedup factor $0.65\times$ under Dynamic Staffing).
  6. **Stage 3A (Dine-In Table Seating):** `simpy.Resource(capacity=12)`. Occupancy duration $\approx 10.0 + U(0, 8.0)$ min.
  7. **Stage 3B (Takeout / Courier Dispatch):** Direct street exit; courier dwell time logged.

---

### Figure 6: Comparative Scenario Waiting Time & Balking Rate
* **File:** `presentation/figures/fig6_scenario_waiting_and_queue_comparison.png`
* **Summary Results Table (30 Monte Carlo Replications with 95% Confidence Intervals):**

| Scenario Configuration | Mean $W_q$ (min) | 95% CI ($W_q$) | Peak $L_q$ (pax) | Balking Rate (%) | Courier Dwell (min) | Cashier Util. ($\rho$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Current)** | **13.02** | $\pm 1.22$ | **22.10** | **47.27%** | **68.58** | 97.72% |
| **Scenario A (Decoupled POS 2)** | **1.60** | $\pm 0.15$ | **8.18** | **20.76%** | **59.59** | 58.40% / 62.10% |
| **Scenario B (Floating Expediter)** | **5.05** | $\pm 0.42$ | **7.65** | **17.76%** | **62.40** | 76.15% |
| **Scenario C (Dynamic Peak Staff)** | **14.69** | $\pm 1.35$ | **14.18** | **46.92%** | **56.09** | 97.80% |
| **Combined Policy (A + B + C)** | **1.48** | $\pm 0.12$ | **4.02** | **3.73%** | **51.71** | 51.20% / 54.80% |

---

### Figure 7: Operational Frontier: Throughput vs. Balking Rate
* **File:** `presentation/figures/fig7_throughput_and_balking_tradeoffs.png`
* **Trade-Off Analysis:**
  * Baseline is trapped in the bottom-right sub-optimal zone (High balking 47.3%, Low throughput 7.52 orders/hr).
  * Scenario B provides the best zero-capex shift (recovers 62% of lost volume).
  * Combined Policy reaches the top-left optimal frontier (12.35 orders/hr throughput, 3.73% balking rate).

---

### Figure 8: Sensitivity Analysis across Arrival Multipliers ($\pm 20\%$)
* **File:** `presentation/figures/fig8_sensitivity_analysis_arrival_surge.png`
* **Stress Test Findings:**
  * **Baseline:** Highly fragile to surges. A $+20\%$ increase in arrivals ($1.2\times$) escalates mean wait time from 13.02m to **18.90m** and balking from 47.3% to **61.8%**.
  * **Scenario A (Decoupling):** High surge resilience. Under $+20\%$ surge, wait time remains low at **3.40m** and balking at **32.5%**.
  * **Combined Policy:** Maximum operational robustness. Under $+20\%$ surge, wait time stays under **2.85m** and balking under **7.9%**.

---

### Figure 9: Model Validation: Observed vs. Simulated Baseline
* **File:** `presentation/figures/fig9_validation_observed_vs_simulated.png`
* **Validation Convergence:**
  * Observed Mean $L_q = 14.2$ vs. Simulated Mean $L_q = 13.77$ ($\Delta = -3.03\%$, well within 95% CI $[12.18, 15.36]$).
  * Observed Peak $L_q = 22.0$ vs. Simulated Peak $L_{max} = 22.10$ ($\Delta = +0.45\%$).
  * Two-sample Kolmogorov-Smirnov test on service duration: $D = 0.103, p = 0.814$ (distributions statistically indistinguishable).

---

## 2. Core Queueing Theory Formulas & Mathematical Models

1. **Little's Law:**
   $$L = \lambda W \quad \text{and} \quad L_q = \lambda_{eff} W_q$$
   Where $\lambda_{eff} = \lambda \times (1 - P_{balk})$ is the effective arrival rate entering the queue.

2. **Time-Weighted Queue Length Accumulator:**
   $$L_q = \frac{1}{T_{total} - T_{warmup}} \int_{T_{warmup}}^{T_{total}} Q(t) \, dt = \frac{\sum_{i} Q_i \cdot \Delta t_i}{T_{sim}}$$

3. **Cashier Resource Utilization:**
   $$\rho = \frac{\text{Total Server Busy Time}}{\text{Simulation Duration}} = \frac{\sum_{j=1}^{N} S_j}{c \cdot T_{sim}}$$
   In Baseline, $\rho_{cashier} = 0.9772$ (97.72%), confirming the $M/G/1$ instability condition as $\rho \to 1.0$.

4. **Triangular Distribution Probability Density Function:**
   $$f(x) = \begin{cases} 
   \frac{2(x-a)}{(b-a)(c-a)} & \text{for } a \le x < c \\
   \frac{2(b-x)}{(b-a)(b-c)} & \text{for } c \le x \le b 
   \end{cases}$$

5. **Gamma Interarrival Density Function:**
   $$f(t; \alpha, \beta) = \frac{t^{\alpha - 1} e^{-t/\beta}}{\beta^\alpha \Gamma(\alpha)} \quad \text{for } t > 0$$

6. **95% Confidence Interval for Simulation Replications ($N=30$):**
   $$CI_{95\%} = \bar{X} \pm t_{0.025, N-1} \cdot \frac{S}{\sqrt{N}} = \bar{X} \pm 2.045 \cdot \frac{S}{\sqrt{30}}$$

---

## 3. Potential Panel Defense Questions & Comprehensive Answers

### Question 1: "Why did you use Discrete-Event Simulation (SimPy) instead of analytical queueing formulas like $M/M/1$ or $M/G/c$?"
**Suggested Answer (Cantalejo / Reales):**  
"Standard analytical queueing formulas rely on steady-state equilibrium, Poisson arrivals, and single-stage processing. In reality, CHE Makati exhibits three characteristics that violate analytical assumptions:
1. **Non-homogeneous arrival surges:** Peak arrival rate spikes significantly between 12:15 PM and 12:45 PM.
2. **Coupled multi-stage production:** The cashier is coupled to an asynchronous batch grilling container (14 pieces / 9 mins) and downstream table constraints.
3. **Queue-dependent state balking:** Customers balk probabilistically based on dynamic line length.
Discrete-Event Simulation in SimPy allows us to capture time-varying entity state transitions, batch storage containers, and empirical distribution shapes without unrealistic mathematical simplifications."

---

### Question 2: "Why is Scenario C (Dynamic Peak Staffing) alone unable to reduce cashier waiting time?"
**Suggested Answer (Reales):**  
"Scenario C reallocates staff at the **downstream food assembly and tray packaging station**. In the baseline system, the primary bottleneck is located **upstream at the cashier POS register ($\rho = 97.72\%$)**. 
Speeding up tray assembly when the cashier cannot ring up customers any faster simply starves the assembly station. However, when paired with Scenario A or B (as in the Combined Policy), Scenario C becomes essential because it prevents downstream kitchen packaging from becoming the secondary bottleneck once order-taking throughput doubles."

---

### Question 3: "How did you validate that your simulation results represent the real restaurant and not random noise?"
**Suggested Answer (Cantalejo / Bornilla):**  
"We applied a three-step validation framework:
1. **Statistical Input Validation:** Evaluated all fitted distributions against raw field data using Kolmogorov-Smirnov goodness-of-fit tests, confirming $p > 0.05$.
2. **Replication Convergence:** Conducted 30 independent Monte Carlo replications per scenario using Common Random Numbers (CRN) to ensure variance reduction and tight 95% confidence intervals.
3. **Historical Baseline Comparison:** Simulated baseline queue length ($13.77 \pm 0.57$ pax) and peak queue ($22.10 \pm 1.30$ pax) converged within 3.1% of our empirical stopwatch field measurements ($14.2$ pax and $22.0$ pax)."

---

### Question 4: "What is the economic feasibility of your recommendations for a small restaurant like CHE?"
**Suggested Answer (Reales / Bornilla):**  
"We specifically structured our recommendations into a phased rollout:
* **Phase 1 (Scenario B - Floating Expediter):** Incurs **zero capital expense**. During peak lunch and dinner rushes, an existing crew member uses printed order slips to take orders from patrons in line. Our simulation shows this immediately recovers 62% of balking customers and increases completed orders from 7.52 to 10.12 orders/hr.
* **Phase 2 (Scenario C - Dynamic Staffing):** Reallocates an existing back-prep cook to assembly during rush hours, again with zero added payroll cost.
* **Phase 3 (Scenario A - Channel Decoupling):** Requires purchasing a secondary POS terminal and tablet (est. PHP 25,000–35,000). The recovered revenue from 80+ daily lost customers pays for this hardware within less than two weeks of operation."

---

### Question 5: "How does your 3D digital twin connect to the scientific simulation model?"
**Suggested Answer (Cantalejo / Reales):**  
"The 3D digital twin in Three.js/WebGL acts as a physical spatial verification interface. It maps the exact coordinates of the Savana Commercial Center floor plan (Left Room Tables 1–6, Right Hall Tables 7–12, Cashier, and Kitchen). 
The event stream generated by the discrete-event simulation engine directly drives 3D entity state transitions (queuing, ordering, dining, balking), allowing stakeholders and management to visually inspect spatial crowding, corridor blockages, and chair occupancies in real time."
