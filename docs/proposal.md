# Project Proposal: Modeling & Simulation

## 1. Title
**Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo’s Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach**

## 2. Introduction
Carlo’s Bacolod Chicken House Express (CHE), located at Savana Market along Chino Roces Avenue in Makati, is a renowned, high-volume dining spot famous for authentic Bacolod-style chicken inasal. During peak lunch (11:30 AM – 1:30 PM) and dinner hours (6:00 PM – 8:30 PM), the establishment experiences severe customer volume surges fueled by a simultaneous mix of dine-in patrons, walk-in takeout customers, and third-party delivery riders (e.g., GrabFood, Foodpanda).

Unlike a standard school cafeteria counter, CHE operates a coupled multi-stage system: order-taking/cashiering, charcoal grilling batch production, and order assembly/table dispatch. When peak arrivals spike, bottlenecks cascade across the floor—causing extended queue lines at the entrance/counter, aisle and sidewalk congestion at Savana Market, table turnover delays, and customer balking (walkaways) due to visible crowd density.

To evaluate solutions without disrupting live business operations, this project applies Discrete-Event Simulation (DES) using Python (SimPy). By treating multi-channel arrivals and grilling cycle times as stochastic processes, the simulation acts as an experimental testbed to test staffing allocations, order-staging configurations, and dispatch prioritization to minimize customer wait times and elevate restaurant throughput.

## 3. Problem Statement
How can Carlo’s Bacolod Chicken House Express (CHE) systematically reduce customer waiting times ($W_q$), mitigate physical queue lengths ($L_q$), and minimize order fulfillment delays during peak stochastic lunch and dinner rushes through optimized cashier/order staging, line segmentation, and staff resource allocation, without incurring high staff or grilling station idle time?

## 4. Objectives
### General Objective
To model, analyze, and optimize the queue dynamics, service flow, and multi-channel fulfillment efficiency of Carlo’s Bacolod Chicken House Express (CHE) in Makati during peak hours using a discrete-event simulation approach.

### Specific Objectives
1. **Quantify Input Distributions:** Collect empirical field data during peak operating windows to establish statistical distributions for customer inter-arrival rates (dine-in, takeout, and delivery couriers), ordering/cashiering durations, and order pickup/assembly lead times.
2. **Build and Validate Baseline Model:** Construct a discrete-event simulation model accurately reflecting CHE’s current operational workflow, including the shared order queue, food assembly handoff, and customer departures.
3. **Execute Optimization Experiments:** Test targeted "what-if" operational scenarios, such as:
   - Decoupling delivery/takeout orders from dine-in customer queues (Scenario A).
   - Introducing a dedicated expediter/order-taker during arrival surges (Scenario B).
   - Dynamic peak staffing reallocation to assembly/dispatch (Scenario C).
4. **Determine Optimal Operating Policy:** Recommend a resource configuration and queue management layout that minimizes customer and courier wait times while keeping staff utilization at balanced, sustainable levels.

## 5. Scope and Limitations
### Scope
- **Location:** Carlo’s Bacolod Chicken House Express (CHE), Savana Commercial Center, 114 K Savana Market, Metropolitan Ave. cor. Chino Roces Ave., Brgy. Sta. Cruz, Makati City.
- **Customer Channels Covered:** Walk-in dine-in customers, walk-in takeout customers, and third-party delivery couriers arriving at the order/counter area.
- **Time Windows:** Peak lunch rush (11:30 AM – 1:30 PM) and peak dinner rush (6:00 PM – 8:00 PM).
- **Modeling Tool:** Discrete-Event Simulation developed in Python (SimPy) with data analysis in pandas, scipy.stats, and 3D WebGL (Three.js).

### Limitations
- **Kitchen Internal Prep:** Charcoal grilling batch cycles are treated as service delay distributions (stochastic process durations) rather than microscopic internal thermodynamics of the grill itself.
- **Seating Dynamics:** The model primarily focuses on queue formation, order placement, and dispatch handoff; table holding times are factored as bounded service delays rather than full floor plan pathfinding.
- **Non-Invasive Observation:** Field timing is strictly observational (stopwatch timestamps and tallies) gathered from public customer spaces without interfering with restaurant staff.
