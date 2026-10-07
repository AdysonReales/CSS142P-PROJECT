# Methodology

```
[1. Flow Identification & Mapping] ──> [2. Empirical Field Timing] ──> [3. Distribution Fitting]
                                                                                │
[6. Final Recommendations] <── [5. Multi-Scenario Experiments] <── [4. Baseline DES Model Validation]
```

## 1. Flow Identification & System Mapping
Mapping CHE’s physical layout at Savana Commercial Center (Makati) into distinct service steps:
1. **Corridor Arrival:** Pedestrian flow along Savana Market commercial aisle.
2. **Queue Formation & Balking:** Line formation leading to counter; balking occurs if line length exceeds capacity ($L_q > 8$).
3. **Cashier / Ordering:** Payment, meal customization, ticket printing.
4. **Charcoal Grill Production:** Batch roasting on charcoal pit (24-piece capacity).
5. **Assembly / Staging:** Sachet condiment packing (chicken oil, sinamak, calamansi) or dine-in tray arrangement.
6. **Handover / Seating:** Immediate counter departure for couriers/takeout; table occupancy for dine-in patrons.

## 2. Empirical Field Timing
Field observation sessions logging:
- Inter-arrival times across 15-minute observation bins.
- Channel breakdown: Dine-in (~46%), Takeout (~26%), Delivery Couriers (~27%).
- Transaction durations at the register.
- Kitchen fulfillment lead times.
- Balking incidents during queue surges.

## 3. Statistical Distribution Fitting
Theoretical continuous distributions fitted using `scipy.stats`:
- **Inter-Arrivals:** Gamma & Exponential distributions.
- **Ordering Durations:** Triangular & Lognormal distributions.
- **Kitchen Fulfillment:** Lognormal & Gamma distributions.
- **Dining Duration:** Gamma distribution ($\mu \approx 31.5$ minutes).
Goodness-of-fit evaluated via the Kolmogorov-Smirnov test and AIC/BIC criteria.

## 4. Baseline DES Model Validation
SimPy simulation engine replicating current single-register shared line under peak 120-minute rush. Validated against empirical field records.

## 5. Multi-Scenario "What-If" Experiments
- **Baseline:** Shared register, single queue.
- **Scenario A (Channel Decoupling):** Separate counter for Takeout and Delivery couriers.
- **Scenario B (Floating Expediter):** Roving staff taking orders ahead of queue when $L_q \ge 4$.
- **Scenario C (Dynamic Peak Staffing):** Reallocation of 1 kitchen prep worker to order assembly during 60-minute rush.
- **Combined Policy:** Best-practice operational synthesis.

## 6. Recommendations & Trade-Off Analysis
Matrix comparing $W_q$, $L_q$, Courier Dwell Time, Balking Rate, Throughput, and Staff Utilization to deliver actionable, zero-to-low capital recommendations to CHE management.
