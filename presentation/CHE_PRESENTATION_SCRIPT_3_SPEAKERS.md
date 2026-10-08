# CHE Makati Simulation Presentation: 3-Person Academic Defense Script

**Research Project Title:**  
*Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach*

**Course & Institution:** CSS142P Modeling and Simulation | AY 2025–2026  
**Total Target Presentation Duration:** 12 to 15 Minutes  
**Research Team & Assigned Roles:**
- **Person 1 — Sean Earl Y. Bornilla:** Introduction, Establishment Context, Problem Formulation, Objectives & Scope (Slides 1–5 | ~4.5 mins)
- **Person 2 — Joven Terence O. Cantalejo:** Field Data Collection, Dataset Profile, Input Modeling & SimPy Architecture (Slides 6–10 | ~5.0 mins)
- **Person 3 — Adyson M. Reales:** Baseline Diagnostics, Scenario Evaluations, Trade-Offs, Validation & Policy Roadmap (Slides 11–16 | ~5.0 mins)
- **All Presenters:** Concluding Remarks & Panel Q&A Defense (Slide 17 | ~1.5 mins)

---

## SLIDE 1 (Person 1 — Bornilla): Title & Research Introduction
**Slide Title:** Title & Research Team  
**Estimated Time:** 0:45 min

"Good day, distinguished members of the panel, our professor, and fellow colleagues. We are Group [Number], and today we are presenting our Modeling and Simulation research entitled: *Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach*.

My name is **Sean Earl Y. Bornilla**, and together with my co-researchers, **Joven Terence O. Cantalejo** and **Adyson M. Reales**, we conducted an empirical field investigation and computational discrete-event simulation of one of Makati's most popular casual dining spots. Over the next fifteen minutes, we will walk you through our on-site stopwatch observations, the statistical calibration of stochastic service variables, our SimPy simulation architecture, and the quantitative operational interventions we evaluated to resolve long-standing customer queueing and courier delays."

---

## SLIDE 2 (Person 1 — Bornilla): Restaurant Profile & Operational Context
**Slide Title:** Establishment Profile & Operational Environment  
**Estimated Time:** 1:00 min

"To provide operational context, Carlo's Bacolod Chicken House Express—frequently referred to as CHE—is a high-volume quick-casual restaurant situated inside the Savana Commercial Center along Chino Roces Avenue in Makati City. The restaurant is renowned for authentic Bacolod-style charcoal-grilled chicken inasal, specialty items like pecho, paa, and isol, accompanied by unlimited garlic rice.

As shown in the photographs on the right side of the slide, CHE operates within a compact commercial unit featuring twelve dining tables with a total seating capacity of approximately forty patrons, split between a left dining room and a right dining hall. 

Unlike a simple fast-food counter, CHE's production environment is tightly coupled: order-taking at the front register directly triggers charcoal grilling batches in the rear kitchen, which then feeds manual tray assembly and packaging. During the peak lunch window between 11:30 AM and 1:30 PM, as well as the dinner rush from 6:00 PM to 8:30 PM, this tightly coupled system experiences severe arrival surges that overwhelm front-of-house operations."

---

## SLIDE 3 (Person 1 — Bornilla): Problem Formulation: The Triple-Channel Bottleneck
**Slide Title:** The Multi-Channel Queueing Dilemma  
**Estimated Time:** 1:00 min

"The primary operational dilemma at CHE stems from a simultaneous collision of three distinct customer channels competing for a single shared cashier register:

First, **Dine-In Patrons**, representing approximately 42% of arrivals, who need time to review menu cuts, order meals for table parties, and occupy dining tables once their food is assembled.

Second, **Walk-In Takeout Customers**, representing roughly 31%, who wait in the same physical line, place their orders, and then crowd the narrow waiting corridor while packaging takes place.

Third, **Third-Party Delivery Couriers** from GrabFood and Foodpanda, comprising 28% of total traffic. These couriers arrive on strict delivery SLAs, often carrying large insulated thermal backpacks, and cluster around the counter to collect multiple orders.

Because all three channels funnel into a single Point-of-Sale terminal, cashier service times become highly variable. When the line stretches past eight people into the Savana Market corridor, arriving patrons experience severe visual discouragement and simply walk away without ordering—a phenomenon known in queueing theory as *balking*."

---

## SLIDE 4 (Person 1 — Bornilla): Research Objectives & Key Performance Measures
**Slide Title:** Research Objectives & Key Performance Measures (KPIs)  
**Estimated Time:** 0:50 min

"To address these challenges scientifically, our study established four primary research objectives:
1. First, gather empirical stopwatch observations during peak lunch sessions to record timestamped arrivals, cashier transaction times, food assembly durations, queue lengths, and balking counts.
2. Second, fit parametric probability distributions to operational service variables using goodness-of-fit statistical tests.
3. Third, construct an event-driven discrete-event simulation in Python using SimPy to replicate CHE's existing workflow under stochastic arrival conditions.
4. Fourth, design and test targeted operational scenarios to evaluate how queue decoupling, order expediting, and dynamic kitchen staffing can optimize system performance.

We evaluate these scenarios against standard queueing performance metrics: mean waiting time in queue ($W_q$), time-weighted and peak queue length ($L_q$ and $L_{max}$), delivery courier dwell time ($D_{dwell}$), customer balking percentage ($P_{balk}$), resource utilization ($\rho$), and total order throughput per hour."

---

## SLIDE 5 (Person 1 — Bornilla): Scope, Delimitations & System Assumptions
**Slide Title:** Study Scope, Delimitations & Modeling Assumptions  
**Estimated Time:** 0:45 min

"To maintain academic rigor and clarity, we established specific boundaries for this study:
* Our observation and simulation scope is centered on the two-hour peak lunch rush from 11:30 AM to 1:30 PM, utilizing a fifteen-minute warmup period to establish steady-state queue conditions.
* We model the complete customer lifecycle across three channels: arrival, queuing, cashier ordering, batch grilling, assembly packaging, and either table seating or street departure.
* Data collection was conducted non-intrusively from public customer areas without interfering with kitchen staff or handling private point-of-sale data.
* As an abstraction, charcoal grilling is modeled as stochastic batch production delays rather than thermodynamic heat transfer, and customer table occupancy is bounded by calibrated dining duration distributions. Financial balance sheets and supply chain procurement are outside the scope of this simulation.

Now that we have established the problem context, objectives, and scope, I will turn the presentation over to **Joven Terence O. Cantalejo**, who will discuss our empirical data collection, input modeling, and simulation architecture."

---

## SLIDE 6 (Person 2 — Cantalejo): Empirical Field Data Collection Protocol
**Slide Title:** Field Data Collection Protocol & Observation Bins  
**Estimated Time:** 0:50 min

"Thank you, Bornilla. For our data collection protocol, our research team conducted on-site stopwatch measurements during peak lunch operations at CHE Makati. 

To account for time-varying arrival intensity, observations were structured into fifteen-minute bins across the 120-minute window from 11:30 AM to 1:30 PM. Each customer arrival was categorized by channel—Dine-In, Takeout, or Delivery Courier, with GrabFood and Foodpanda courier brands logged individually. 

For each entity, we recorded precise milestone timestamps: arrival time at the corridor, queue entry, start and completion of cashier ordering, food assembly completion, table seating for dine-in, and final exit. Over the observation period, we logged 120 distinct arrival attempts. Among these, exactly thirty-five customers successfully completed ordering and service at the cashier counter, while eighty-five patrons balked upon observing an overwhelming queue of fifteen to twenty-two people. We also logged transaction sizes, which averaged 2.1 pieces for dine-in, 2.3 pieces for takeout, and 2.8 pieces for delivery couriers."

---

## SLIDE 7 (Person 2 — Cantalejo): Dataset Characteristics & Arrival Surge
**Slide Title:** Arrival Surge Intensity & Customer Channel Breakdown  
**Estimated Time:** 1:00 min

"Turning to Slide 7, the two charts illustrate the empirical characteristics of our collected dataset.

On the left, the bar chart shows arrival counts aggregated in 15-minute intervals. You will observe a distinct bell-shaped surge curve: arrivals start moderately at 11:30 AM with 6 to 8 arrivals per bin, escalate sharply to a peak of 26 arrivals between 12:15 PM and 12:45 PM, and gradually subside after 1:00 PM. This non-homogeneous Poisson behavior creates acute stress on front-of-house servers during the middle hour.

On the right, the donut chart displays our empirical channel distribution: Dine-In patrons make up 41.7% of total volume, Walk-In Takeout accounts for 30.8%, and Delivery Couriers represent 27.5%. This balance demonstrates that over 58% of incoming volume consists of off-premise orders (takeout and delivery) that do not require dining room tables, yet they are forced to compete in the exact same physical queue as dine-in patrons."

---

## SLIDE 8 (Person 2 — Cantalejo): Statistical Input Modeling & Goodness-of-Fit Tests
**Slide Title:** Statistical Distribution Fitting & Goodness-of-Fit (K-S Tests)  
**Estimated Time:** 1:10 min

"Slide 8 presents the statistical input distributions fitted to our empirical field data. To ensure that our discrete-event simulation behaves realistically, we fitted candidate continuous distributions to each operational variable and evaluated them using the Kolmogorov-Smirnov (K-S) test, Akaike Information Criterion (AIC), and Bayesian Information Criterion (BIC).

On the left graph, cashier ordering service times ($S_{order}$) were fitted to Triangular distributions segmented by channel:
* Dine-In ordering has a minimum of 0.8 minutes, a mode of 1.6 minutes, and a maximum of 3.2 minutes ($p = 0.22$).
* Walk-in Takeout has a minimum of 0.6 minutes, a mode of 1.2 minutes, and a maximum of 2.4 minutes ($p = 0.43$).
* Delivery Couriers have the fastest transaction times, with a minimum of 0.35 minutes, a mode of 0.7 minutes, and a maximum of 1.3 minutes ($p = 0.81$).

On the right graph, customer interarrival times were fitted to a Gamma distribution with shape parameter $\alpha = 0.78$ and scale parameter $\beta = 1.03$ ($p = 0.86$), reflecting a mean interarrival time of approximately 0.91 minutes. In all cases, the K-S test $p$-values comfortably exceed the 0.05 critical alpha threshold, confirming that our fitted distributions are statistically valid representations of CHE's operational inputs."

---

## SLIDE 9 (Person 2 — Cantalejo): Discrete-Event Simulation Architecture (SimPy)
**Slide Title:** Multi-Stage Discrete-Event Simulation Architecture (SimPy)  
**Estimated Time:** 1:00 min

"On Slide 9, we illustrate the overall computational architecture of our discrete-event simulation model developed in Python using the SimPy framework.

The model is structured as a coupled queue network:
1. **Arrival Generator:** Ingests the non-homogeneous Gamma interarrival process and generates individual customer entities tagged with channel, item count, and arrival timestamps.
2. **Stage 1 (Cashier POS Resource):** Modeled as a `simpy.Resource(capacity=1)` in baseline. Arriving entities enter a shared FIFO queue. If the queue length exceeds the balking threshold ($L_q > 8$), entities evaluate a queue-dependent balking probability and either enter line or exit the system.
3. **Stage 2A (Charcoal Grill Container):** Operates as a continuous batch production process where the grill master replenishes a `simpy.Container` buffer in batches of 14 pieces every 8.5 to 9.5 minutes.
4. **Stage 2B (Assembly Resource):** Orders that have paid and secured chicken pieces from the buffer request the `simpy.Resource(capacity=1)` assembly station for rice scooping, saucing, and packaging.
5. **Stage 3 (Dining Tables / Sidewalk Dispatch):** Takeout and couriers dispatch immediately to the sidewalk, while dine-in customers acquire one of twelve dining table resources, occupy it for a calibrated meal duration, and vacate the system.

Continuous time-weighted $L_q$ accumulators and granular event callbacks ensure full telemetry tracking."

---

## SLIDE 10 (Person 2 — Cantalejo): Restaurant Layout & Digital Twin Verification
**Slide Title:** Restaurant Floor Plan & 3D Digital Twin Verification  
**Estimated Time:** 1:00 min

"To complement our SimPy analytical engine, we developed an interactive 3D digital twin of CHE Makati using Three.js and WebGL, as detailed on Slide 10.

The 3D environment precisely reproduces the architectural floor plan of the Savana Commercial Center unit:
* The **Left Dining Room** contains six 2-seat square tables arranged in a 2-by-3 grid, accessed through a private interior doorway.
* The **Central Hallway** houses the cashier counter, pass-through service window, and four waiting chairs.
* The **Central Kitchen Core** includes the rear charcoal grilling station with exhaust hood, stainless assembly prep table, and staging counter.
* The **Right Dining Hall** contains six large tables combining four-seat wood rectangular tables and square tables for groups.

Entities navigate around interior architectural walls following realistic waypoint paths, sit down on individual chairs when seated, eat, and vacate smoothly upon meal completion. We also implemented synchronized queue advancement with realistic one-meter human spacing so that customers step forward continuously without gaps.

With our simulation methodology and digital twin established, I will now turn the discussion over to **Adyson M. Reales**, who will present our baseline findings, scenario evaluations, validation results, and managerial recommendations."

---

## SLIDE 11 (Person 3 — Reales): Baseline System Diagnostics (Current Reality)
**Slide Title:** Baseline System Diagnostics: The Operational Reality  
**Estimated Time:** 1:00 min

"Thank you, Cantalejo. Looking at Slide 11, we present the baseline diagnostic results of CHE Makati's current operations, evaluated across thirty independent Monte Carlo simulation replications.

The data reveals severe operational distress under the existing shared-counter setup:
* The **Mean Queue Waiting Time ($W_q$)** is **13.02 minutes** (with a 95% confidence interval of $\pm 1.22$ min), while 95th percentile waiting times reach **16.76 minutes** just to reach the cashier register.
* The **Peak Queue Length ($L_{max}$)** reaches an average of **22.10 customers**, creating severe physical crowding that spills out of the restaurant into the Savana Market corridor.
* Most critically, the **Customer Balking Rate ($P_{balk}$)** averages **47.27%**, meaning that over eighty prospective customers per lunch rush walk away without ordering due to visible line congestion.
* Delivery couriers experience a staggering **Mean Dwell Time of 68.58 minutes** from arrival to dispatch.
* The single Cashier POS register operates at **97.72% resource utilization**, confirming that order-taking is the catastrophic primary bottleneck starving the rest of the restaurant. Dining tables and kitchen capacity are effectively underutilized because patrons cannot place their orders fast enough."

---

## SLIDE 12 (Person 3 — Reales): Proposed Improvement Scenarios (A, B, C & Combined)
**Slide Title:** Evaluated Operational Scenarios (A, B, C & Combined)  
**Estimated Time:** 1:00 min

"To eliminate this bottleneck, we formulated and tested four distinct operational improvement scenarios:

1. **Scenario A (Channel Decoupling):** Implements a dedicated Express POS 2 terminal specifically for Walk-In Takeout and Delivery Couriers, while reserving POS 1 exclusively for Dine-In patrons.
2. **Scenario B (Floating Expediter):** Deploys a roving front-of-house staff member equipped with paper or mobile order slips who pre-takes customer orders whenever the queue reaches four or more people, reducing cashier POS transaction times by 55%.
3. **Scenario C (Dynamic Peak Staffing):** Reallocates one existing kitchen prep worker to assist with order packaging, tray preparation, and dispatch during the middle rush hour between minutes 30 and 90, speeding up assembly by 35%.
4. **Combined Policy (Exploratory):** Simultaneously deploys Channel Decoupling, the Floating Expediter, and Dynamic Peak Staffing to achieve holistic end-to-end optimization across the entire fulfillment pipeline."

---

## SLIDE 13 (Person 3 — Reales): Comparative Simulation Results & Graphs
**Slide Title:** Comparative Simulation Results: Waiting Time & Balking  
**Estimated Time:** 1:10 min

"Slide 13 illustrates the quantitative results across all evaluated scenarios based on thirty independent replications with 95% confidence intervals.

On the left chart, examine the dramatic impact on **Mean Cashier Waiting Time ($W_q$)**:
* In Baseline, customers wait **13.02 minutes**.
* **Scenario A (Channel Decoupling)** slashes mean wait time by **87.7% down to 1.60 minutes** by separating delivery riders from dine-in queues.
* **Scenario B (Floating Expediter)** reduces wait time by **61.2% down to 5.05 minutes** with zero hardware changes.
* **Scenario C (Dynamic Staffing)** alone yields 14.69 minutes at the register because it focuses downstream on packaging rather than order-taking.
* The **Combined Policy** achieves the lowest waiting time of all at **1.48 minutes**—an **88.6% overall reduction**.

On the right chart, observe the **Customer Balking Rate ($P_{balk}$)**:
* Baseline loses **47.3%** of all customer arrivals.
* Scenario A cuts balking to **20.8%**, Scenario B cuts balking to **17.8%**, and the Combined Policy virtually eliminates lost sales, dropping balking down to just **3.73%**."

---

## SLIDE 14 (Person 3 — Reales): Trade-Off Analysis & Staffing Economics
**Slide Title:** Operational Trade-Offs, Courier Dwell & Staffing Economics  
**Estimated Time:** 1:00 min

"Turning to Slide 14, we examine the operational trade-offs, order throughput, and courier dwell times.

The scatter plot on the left maps the **Operational Efficiency Frontier**, plotting Customer Balking Rate on the horizontal axis versus Order Throughput per Hour on the vertical axis. The optimal operating region is the top-left green quadrant—maximizing throughput while minimizing customer loss.

You will see that the **Combined Policy** anchors the optimal frontier, elevating completed throughput from **7.52 orders/hr in Baseline up to 12.35 orders/hr**—a **64.2% increase in revenue-generating capacity**.

Furthermore, courier dwell times show marked improvements:
* Baseline courier dwell time of **68.58 minutes** drops to **59.59 minutes** in Scenario A, **56.09 minutes** in Scenario C, and **51.71 minutes** under the Combined Policy.
* From a staffing economics standpoint, **Scenario B (Floating Expediter)** delivers the highest immediate ROI because it requires zero capital expenditure on new POS terminals—simply reallocating an existing crew member with a clipboard during peak surges recovers more than 60% of lost customer volume."

---

## SLIDE 15 (Person 3 — Reales): Sensitivity Analysis across Demand Surges
**Slide Title:** Sensitivity Analysis across Arrival Volume Surges (±20%)  
**Estimated Time:** 0:50 min

"On Slide 15, we tested the resilience of our findings by conducting a sensitivity stress test across $\pm 20\%$ arrival volume variations ($0.8\times, 1.0\times, 1.2\times$).

On the left graph, you can see that if customer arrival volume increases by 20% during an exceptionally busy day, the **Baseline system collapses**: queue wait times spike to **18.9 minutes**, and customer balking escalates to **61.8%** (more than 6 out of 10 arriving customers leave).

In sharp contrast, **Scenario A (Decoupling)** and the **Combined Policy** demonstrate remarkable structural stability: even under a +20% surge, mean waiting times remain tightly controlled below **3.4 minutes**, and customer balking remains under **8%**. This proves that decoupled order channels provide the system with vital buffering capacity against extreme demand volatility."

---

## SLIDE 16 (Person 3 — Reales): Model Validation, Statistical Rigor & Limitations
**Slide Title:** Model Validation, Statistical Confidence & Research Limitations  
**Estimated Time:** 0:50 min

"Slide 16 confirms the statistical validity of our simulation model against real-world observations.

On the left chart, comparing our simulated Baseline against actual stopwatch field observations shows strong convergence within 95% confidence intervals:
* Observed mean queue length was **14.2 pax** versus Simulated **13.77 pax** (error < 3.1%).
* Observed peak queue length was **22.0 pax** versus Simulated **22.10 pax** (error < 0.5%).
* On the right chart, the probability density distribution of simulated cashier service times closely overlays the kernel density estimate of empirical field timings.

All scenario experiments were conducted using **thirty independent Monte Carlo replications** with Common Random Numbers (CRN) to ensure rigorous variance reduction and fair comparative baselines. 

Regarding limitations, our findings reflect peak lunch operating conditions; off-peak periods, formal menu redesigns, and ingredient procurement were held constant."

---

## SLIDE 17 (All Presenters): Conclusions, Recommendations & Q&A
**Slide Title:** Conclusions, Phased Implementation Roadmap & Q&A  
**Estimated Time:** 1:10 min

**(Adyson M. Reales):**  
"In conclusion, our research demonstrates that CHE Makati's severe queuing crisis is primarily an **order-taking register bottleneck (97.7% utilization)** rather than a kitchen or seating deficit. 

To resolve this sustainably, we propose a **three-phase managerial implementation roadmap**:
* **Phase 1 (Immediate, Zero-Cost):** Implement **Scenario B (Floating Expediter)** during peak lunch (12:00–1:00 PM) and dinner (7:00–8:00 PM) rushes using pre-order paper slips to immediately cut balking by 62%.
* **Phase 2 (Workflow Reallocation):** Implement **Scenario C (Dynamic Staffing)** by shifting one kitchen prep staff to tray assembly during rush hours to reduce courier dwell time.
* **Phase 3 (Infrastructure Investment):** Install a dedicated **Express POS 2 Terminal (Scenario A)** to permanently decouple delivery couriers and walk-in takeout from dine-in patrons."

**(Sean Earl Y. Bornilla):**  
"On behalf of Joven Terence Cantalejo, Adyson Reales, and myself, we would like to express our gratitude to the panel for your time and attention."

**(Joven Terence O. Cantalejo):**  
"We are now ready and welcome any questions, clarifications, or feedback regarding our methodology, data, or simulation findings. Thank you very much!"
