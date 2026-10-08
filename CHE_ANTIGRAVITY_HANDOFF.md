# CHE Makati — Discrete-Event Simulation: Agentic Project Context & Implementation Handoff

> **Purpose:** A factual reference, design correction brief, data-integration specification, and engineering acceptance checklist for an agent continuing an **already implemented** restaurant simulation. This is **not** a request to generate a fresh demo, replace the codebase, or fabricate field results.
>
> **Target:** Carlo's Bacolod Chicken House Express (CHE), Savana Market / Savana Commercial Center, Makati City, Philippines.
>
> **Research basis:** *Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati: A Discrete-Event Simulation Approach* (Bornilla, Cantalejo, Reales; Modeling and Simulation project proposal).

## 0. What the agent must read first

**Read the existing repository before changing anything.** Find the actual frontend stack, 3D scene implementation, animation/event system, data models, scenario engine, charts, styling, tests, and build commands. Do not guess that the screenshot's underlying source uses any particular framework.

If provided, examine these reference assets alongside this file:

| Reference file | Meaning | Priority |
|---|---|---|
| `references/current-dashboard.png` | Screenshot of existing dark 3D simulation UI | Diagnosis of *current implementation*, **not** preferred final style |
| `references/che-floorplan.png` | Hand-drawn/assembled top-down floor plan | **Authority for zoning, layout, walls/partitions, and rough furniture arrangement** |
| `references/che-interior-photo.jpg` | Real CHE dining-room photograph | **Authority for atmosphere, wall finishes, furniture/chair language, color treatment** |
| `references/project-proposal.pdf` | Complete 8-page group proposal | **Authority for research question, DES stages, scenario definitions, validation, and study scope** |
| User's observational spreadsheet (`.xlsx`/`.csv`) | Real field observations; may be attached separately or already in repo | **Authority for measured numerical inputs, distributions, and calibration** |

If only this `.md` is available, follow its detailed descriptions and **request the missing visual/data assets instead of inventing numerical observations**. The spreadsheet has **not** been supplied with the screenshots in this handoff; only its column names are known.

### Source priority / non-negotiable rules

1. **Empirical spreadsheet** governs measured arrivals and durations when valid.
2. **Proposal** governs modeled process, scenarios, metric definitions, and research methodology.
3. **Floor plan** governs relative spatial arrangement; **interior photo** governs physical look.
4. **Existing repository** governs actual implementation constraints and reusable architecture.
5. **Existing dashboard screenshot** only describes the current state of the app; do not preserve its appearance merely because it exists.
6. When references conflict, document the discrepancy and decide based on the above authority; never silently overwrite or invent facts.

## 1. Scientific goal and scope

CHE simultaneously serves three channels:

- **Dine-in:** people entering, waiting/ordering at a counter, food preparation, food handoff, dining/table occupancy, eventual departure.
- **Walk-in takeout:** people arriving, ordering/paying, waiting for preparation, receiving a takeout order, exiting.
- **Delivery riders:** GrabFood/Foodpanda-type pickups; rider arrival, pickup/handoff, and exit. Do not assume rider must place an order or pay at the cashier; distinguish *pre-placed online orders* from the baseline's shared physical-queue representation and expose the assumption.

Main DES stages: arrivals and queueing → ordering/payment/counter → charcoal grill batch production and assembly → dispatch/handoff, with channel-dependent exits. Operational congestion propagates across these dependent stations.

**Default study window:** 11:30 AM–1:30 PM (120 min) peak lunch. The introduction also mentions 6:00–8:30 PM dinner and one methodology paragraph proposes observing dinner; however, the formal **Scope** of the proposal specifies peak lunch. Keep lunch as the supported default; implement dinner only as a separate configuration when appropriately sampled/authorized rather than mixing the datasets.

The original proposal specifies non-intrusive observations over 3–5 peak sessions, 15-minute demand bins, distribution fitting, 30 independent replications per scenario, paired/common-random-number comparisons, and ±20% arrival-rate sensitivity. Follow these when the input data and implementation support them. Never claim these were performed before execution.

### Research question

How do changes in queue organization, channel separation, and staff allocation affect queue waiting time **Wq**, physical queue length **Lq**, order-fulfillment delays, rider dwell, balking, throughput, and resource utilization **ρ** during busy CHE lunch hours?

### In-scope versus out-of-scope

- In scope: arrival processes, queues, cashier, grill/assembly/dispatch delays, resource conflicts, channel flows, balking, visible table/waiting occupancy, scenario testing, statistical analysis, reproducible event traces, and illustrative 3D movement.
- Out of scope unless the project is explicitly expanded: detailed grill thermodynamics, physics-accurate indoor navigation, full staff scheduling, verified business financials, inventory, menu optimization, off-peak operations, a production restaurant booking app.
- 3D **presentation** can have simple pathfinding/waypoints but must never quietly change DES timing outputs. Visual movement is representational, and route capacity assumptions must be exposed separately if they affect service times.

## 2. Current application screenshot: what exists and what is wrong

Screenshot observations (**NOT measured performance data**):

| Existing feature | Observed state | Direction |
|---|---|---|
| Header/top navigation | Brand/site, peak rush start, scenario tabs, Trade-Off Matrix, Field Data & Fits | Retain the useful navigation model, simplify visual chrome and information hierarchy |
| Scenarios | BASE shared counter; A channel decoupling; B floating expediter; C dynamic staffing; BEST combined policy | Keep the proposal's four primary scenarios (Baseline/A/B/C); treat **BEST** as an additional, explicitly labeled exploratory combined policy, not an empirically proven optimum |
| Scene | Mostly charcoal/black isometric floor; isolated grill near back; counter and many tiny, orange/brown tables in open clusters | Rebuild faithfully from floor plan; resolve geometry, walls, restaurant subdivisions, furniture/materials, and movement paths |
| Camera menu | Isometric Twin, Counter & Queue, Grill Station, Dining Hall, Savana Corridor | Preserve camera presets if functional; recalibrate target positions to new building geometry |
| Right telemetry | Queue, mean wait, courier dwell, balked/walkaways, grill buffer, backlog, grill utilization, tables, channel throughput | Keep important KPIs but clarify measurement, units, sample size/denominator, active versus historical values, and accessible typography |
| Live event stream | Plain text event list, currently shows simulation initialization | Keep an inspectable event log tied to DES; offer filtering and channel identifiers |
| Bottom controls | Start, step (+1m), Reset, timeline, speeds 1×/2×/5×/10×/20× | Preserve, but guarantee deterministic replay and consistency between simulation clock, traces, and charts |
| Existing displayed values | 0 queue / 0 wait / 0 throughput at initialization; grill buffer 12/24; `Dining Tables 0 / 14` | These are **UI initial values, not field results**. Check why scene counts and configured table capacity differ from floor plan |

**Crucial graph audit:** No completed statistical plots are visible in the supplied application screenshot. The right-side colored strips are KPI progress bars/sparklines-at-most, not evidence of distribution fitting, 95% confidence intervals, or a validated Pareto tradeoff. Trade-Off Matrix and Field Data & Fits appear as navigation controls, but their contents are not visible and must be inspected in the actual repo/app before claiming they already work.

### Why it looks generic / synthetic

- Almost everything uses flat black/gray surfaces with bright orange as an indiscriminate accent; the colors ignore the actual restaurant.
- Tiny condensed text, overly dense metric tiles, equal-weight boxes/borders, and numerous labels create a stock “sci-fi dashboard” look rather than a clear research workstation.
- Furniture appears as repeated low-detail props arbitrarily filling open space; the scene doesn't reflect the supplied small restaurant's separate rooms and corridor.
- Overuse of uppercase, status chips, colored outlines, microcopy, glow/neon, and decorative labels makes critical numbers hard to scan.
- The live simulation view gets most of the space but its spatial layout fails to communicate queues and service stages.

**Design outcome:** a convincing, small, locally grounded CHE digital twin inside a polished, restrained **operations research dashboard**. Not a futuristic control room; not an e-commerce storefront; not a generic admin template.

## 3. Build the actual floor plan (most important visual correction)

### Read the reference image spatially

The reference top-down diagram is schematic, not a measured CAD drawing. Viewed with its text upright, from **left to right**:

1. **LEFT DINING**: enclosed/partitioned seating zone on the left; approximately **six small square tables arranged in two columns by three rows**. The reference illustrates two seats per table, but exact capacity must be confirmed from image/field notes.
2. **WAITING AREA**: narrow vertical zone immediately right of left dining; a row of approximately **four waiting chairs** facing into the central circulation space. Label is placed here. This is **not** another dining block.
3. **KITCHEN**: a more enclosed central block immediately right of waiting, marked `KITCHEN`; visually separated by heavy wall sections, NOT a floating island with an exposed grill placed behind the dining room.
4. **RIGHT DINING**: larger dining area to the right of kitchen, with a mix of larger rectangular wood tables and smaller tables. Approx. **six table groups** in this part, arranged with aisles, NOT many identical small square tables scattered randomly.
5. **Perimeter/partitions**: distinct black wall outlines, openings, and partition segments divide these areas. Match the picture's relative relationships and opening locations rather than treating the entire restaurant as one uninterrupted rectangle.

The drawing seems to show **~12 total table groups (6 left, ~6 right)**, while the current screenshot says **14 dining tables**. These are not confirmed surveyed capacities: count the tables in the provided image more carefully and check existing app config/field observations before changing capacity. Keep `table_count` in one explicit config source shared by model/UI/3D.

The drawing does **not** clearly label the cashier, exact entrance and exit directions, counter location, grill dimensions, or precise measurements. Do NOT manufacture those details as if verified. For provisional 3D staging, locate the order counter adjacent to an observable waiting/service boundary and mark it as an assumption pending confirmation.

### Floor plan reconstruction requirements

- Trace an approximate top-down geometry from the reference; use consistent local/world axes and document the conversion. It's fine to start with normalized reference-image coordinates, then scale into scene units.
- Create individually addressable zones: `left_dining`, `waiting`, `kitchen`, `right_dining`, `cashier`, `pickup_dispatch`, `entrance`, `corridor`; the last four require explicit **provisional** positioning unless separately documented.
- Add solid interior and perimeter walls with openings; do not place patrons through partitions.
- Place left-dining table grid as drawn, the narrow waiting chairs as drawn, and right-dining tables in size/position groups matching the plan.
- Make kitchen equipment and charcoal grill physically live **inside the kitchen zone**, appropriately blocked from the public dining room.
- Ensure ordered movement: entrance → queue/ordering → kitchen/order pickup or dining; rider pickup must be visibly distinct from seated diner flow.
- Model queue visualization in the appropriate waiting/counter zone; staff only in work zones; avoid walking through furniture.
- Provide a clean orthographic top-down `Floor Plan` camera so evaluators can immediately compare to the uploaded reference, plus optional isometric view.
- Use efficient instanced/reusable chairs, tables, and walls, while allowing material variation; preserve good FPS and reasonable draw calls.
- Make geometry configurable/data-driven rather than hardcoding simulation capacity in multiple components.
- If true CAD-level precision is impossible with the supplied schematic, **state that it is an approximate visual reconstruction**.

### Real photograph: materials, furniture, lighting

Actual photographed restaurant features:

- **Vibrant warm yellow walls**: dominant environmental identity, especially upper walls and a large yellow column/partition near the viewer.
- **Dark near-black ceiling** with conspicuous hanging black industrial pendant lights and fluorescent/linear lighting.
- **Red and black metal dining chairs**; thin chrome/steel legs/frames, red slatted backrests on some chairs, black backrests on others, with some pale tan cushioned seat pads. Avoid generic thick orange wooden chairs.
- **Mix of wood/laminate, light neutral/white, and darker tabletops**, with narrow dark metal legs rather than all identical furniture.
- **Light gray mottled tile floor**, NOT a vast featureless matte-black floor.
- Grill/service fixtures in stainless/dark metal; wall shelving; practical small-restaurant character (without needing photorealism).
- Warm yet functional lighting, with coherent shadows and readable geometry.

Suggested artistic color family **(approximate cues, not sampled official brand standards)**:

| Role | Suggested cue | Example starting swatch |
|---|---|---|
| Restaurant wall yellow | saturated marigold/yellow | `#E4C91B` |
| Frame / ceiling charcoal | matte near-black | `#1B1B1D` |
| Chair / supporting red | vermilion/dark red | `#B22225` |
| Floor neutral | warm light concrete gray | `#BBB7AE` |
| Wood table surfaces | muted natural wood | `#B38B65` |
| Brushed/chrome metal | cool medium gray | `#90969B` |

Do **not** simply change the entire web app to screaming yellow/red. The 3D scene can use these physical colors, while the surrounding dashboard can use quiet off-white/charcoal surfaces with sparing yellow/red indicators. Contrast and legibility beat visual flair.

## 4. Rework the UI without deleting functional systems

### Desired interaction and information architecture

Desktop: prioritize the 3D scene but give data charts **real space and readable scales**. A useful structure:

- **Top, compact navigation:** CHE identity, active scenario, simulation status, simulated clock, view switch: `Live Simulation` / `Results & Charts` / `Data & Fits` / `Scenario Comparison` / `Methodology`.
- **Main 3D panel:** actual floor plan + camera switch; minimal corner overlay with current occupancy or route legend if truly useful.
- **Metric region:** queue size, estimated *observed-in-run* mean queue wait, active dining tables, orders completed, courier dwell, balking, and staff/grill utilization (some of these can move to secondary tabs).
- **Timeline controls:** Play/Pause, Step 1 simulated minute, speed, Reset; keep event log accessible but not always using an enormous empty column.
- **Results view:** honest time-series charts with axes/units, tables with scenario confidence intervals, export outputs.
- **Data view:** dataset provenance, import controls, validation warnings, sample sizes, fitted input distributions, observed vs simulated comparison.

### Design constraints

- Typography: a legible, contemporary UI sans-serif for prose/numbers, tabular numerals for metrics, clear sizes; avoid 9px micro-typography.
- Spacing: consistent scale, few card styles, fewer nested outlines; strong grouping rather than colored borders around everything.
- Contrast: accessible labels, chart legends, and states in both desktop and responsive views.
- Status: use color **only** when semantically useful (e.g. excessive wait, congestion) and supplement with text or shape; do not rely on color alone.
- Charts should use a consistent, restrained channel color mapping; distinguish background scene material colors from graph category colors.
- No pointless “AI aesthetic” decorations: glow strips, gratuitous glassmorphism, huge floating panels, useless pulse lights, gradient-heavy hero sections, auto-generated jargon, decorative fake analytics.
- Preserve real functionality and analytics even if rearranged.
- Responsive layout: desktop side-by-side, tablet stacked/chart tabs, mobile readable controls and charts; 3D controls usable on touch.
- Accessible tooltips must explain denominators/metric definitions and whether the value is **observed**, **simulated**, or **assumed**.

## 5. Field-data import: support real `.xlsx` and `.csv`

**Known spreadsheet schema** (exact header names from the user):

```csv
Observation_ID,Channel,Arrival_Time,Queue_Length_Lq,Balked,Cashier_Service_Min,Grill_Assembly_Min,Dining_Duration_Min,Exit_Time,Total_System_Min
```

No data rows have been supplied for this handoff. Do **not** show fabricated analysis as field-derived results. The parser must support both CSV and Excel, multiple Excel sheets where relevant, and an explicit sheet selector if necessary.

### Column semantics and intended uses

| Field | Intended meaning / how to use it | Integrity warning |
|---|---|---|
| `Observation_ID` | Traceable observation identifier | Check null/duplicate IDs, preserve raw IDs |
| `Channel` | Dine-in, takeout, delivery | Normalize spelling/case/aliases and report unknown categories, don't silently drop |
| `Arrival_Time` | Timestamp/clock time of arrival | Normalize Excel dates/serial times and CSV time strings; do not mix days/sessions blindly |
| `Queue_Length_Lq` | Observed queue-length head count | Usually a snapshot; NOT automatically a time-weighted Lq average |
| `Balked` | Person/rider left without proceeding | Parse explicit boolean/0/1/Yes/No; missing ≠ false |
| `Cashier_Service_Min` | Cashier counter service duration in minutes | Missing for channels that skip cashier may be legitimate; don't replace with 0 by default |
| `Grill_Assembly_Min` | Food production/assembly duration in minutes | Clarify whether grill and assembly are combined, per order or batch; don't double count with total duration |
| `Dining_Duration_Min` | Dine-in table-holding duration | N/A for takeout/delivery; do not treat absence as invalid for them |
| `Exit_Time` | Recorded departure time | Verify local time/time zone and relation to arrival; may represent seated diner exit rather than food handover |
| `Total_System_Min` | Observed arrival-to-exit total elapsed time | **Not the same** as cashier queue wait or payment-to-handover time; for dine-in it may include dining |

**Important limitations of these 10 columns:**

- Direct `Wq` (arrival-to-start-of-service) is **not present**. It cannot be calculated exactly from `Arrival_Time` and `Cashier_Service_Min` alone without cashier start timestamps or sufficiently justified reconstruction. Display simulation Wq; label any data-based approximations clearly, never present them as measured queue wait.
- Dedicated **courier dwell** requires rider-arrival and order-pickup/departure semantics. `Total_System_Min` might proxy dwell **only for correctly identified rider records where `Exit_Time` is pickup departure**; make this assumption explicit.
- **Fulfillment time (payment-to-handover)** likewise cannot always be directly observed if columns lack payment and handover timestamps; the kitchen duration is not universally equivalent.
- If data cover multiple sessions but no date/session identifier exists, request one or handle each separate file/sheet as a distinct session. **Never compute interarrival gaps across different, untagged days.**
- No personnel schedules, grill capacity, batching inventory, exact seating capacity, or arrival-date metadata are guaranteed by this schema. These must be configurable and visibly marked `assumed` if not observed.

### Import/validation pipeline

1. Allow upload/selection via UI **and/or** documented repo-local input path. Choose an implementation appropriate to the repo backend; keep original data read-only.
2. For `.xlsx`, use a supported spreadsheet reader (e.g., `pandas.read_excel` with `openpyxl` in Python); for CSV, support UTF-8 BOM, common comma/tab delimiter variants, and quoted values. Do not pretend to support XLSX with CSV-only code.
3. Normalize whitespace and case in headers, but preserve canonical field keys, the raw input file, and an audit trail of transformed values.
4. Parse times rigorously: Excel serial date/time, full ISO datetime, `HH:MM[:SS]`, AM/PM strings, and locale variants when explicitly configured. Define what a time-only value means relative to session start.
5. Validate numeric fields as nonnegative durations/counts; `Balked` as true/false/unknown; flag malformed, negative, nonsensical, out-of-window, or duplicate values without silently replacing them.
6. Map channels deterministically, e.g. `dine-in`, `dine in`, `dining` → `dine_in`; `walk-in takeout`, `takeaway` → `takeout`; `grabfood`, `foodpanda`, `courier`, `delivery` → `delivery`, but preserve the original label.
7. Report total rows, rows per channel and per session, valid/invalid counts, null rates, outlier flags, observation date coverage (when available), and each cleaning decision.
8. Missing or noisy durations: exclude only as appropriate for each fitted distribution, report effective `n`, optional robust sensitivity, and never impute silently. Flag extreme data for review; do not erase valid peaks without confirmation.
9. Distinguish source classes in chart titles and labels: `Field observed`, `Distribution fit`, `Simulated baseline`, `Simulated scenario`, `Assumption/demonstration`.
10. If data are missing or invalid, preserve an explicitly labeled **demo/assumption mode** rather than crashing or pretending that defaults are real field measurements.
11. Provide download/export for cleaned data, validation report, fit summary, experiment configuration, and scenario-results CSV. Avoid embedding any personal information in logs.

### Distribution analysis

- Estimate 15-minute arrival rate per channel **per valid observation session**; consider nonhomogeneous Poisson sampling across peak time bins if supportable by data.
- Infer empirical **within-session** interarrival times from sorted arrivals by channel; compare candidate exponential/gamma if sample supports it. Zero gaps, small samples, and mixed days must be handled transparently.
- Fit plausible positive distributions (gamma, lognormal, and optionally triangular with justified bounds) to cashier, grill/assembly, and dining durations separately by stage/channel as supported.
- Include histogram/density (counts plus theoretical curve), empirical CDF versus fitted CDF, Q–Q plot, sample count, parameters, goodness-of-fit (K–S/chi-square when applicable), and fit caveats. Use appropriate estimation and tests: don't treat a K–S p-value based on same-data-estimated parameters as magically distribution-free.
- Avoid asserting the best fit solely from a p-value. Use visual checks, goodness-of-fit, process knowledge, plausibility, and out-of-sample checks if possible.
- Seed RNG streams. Export fit parameters with input-file fingerprint and cleaning report for reproducibility.

## 6. Correct DES model and one authoritative event stream

The simulation should be **event-driven**, not random characters walking around independent of the math. If the app already has a JavaScript/TypeScript discrete-event engine, inspect it; the proposal specifically expects **Python SimPy**, so either integrate the existing SimPy engine or document a validated equivalence if the present engine differs. Do not replace stable code merely to match a fashionable stack.

### Suggested logical resources

- `cashier` with configurable service capacity, FCFS queue where applicable.
- `grill`/`batch_production` with configurable parallel or batch capacity; avoid treating a `24 pcs` buffer as field-measured without evidence.
- `assembly_dispatch` with limited service staff and explicit handover logic.
- `tables` as channel-specific bounded occupancy for dine-in, using appropriate dwell times; log availability, table holds, exits.
- `floating_expediter` role if scenario B enabled; stage service before cashier only when plausible and no double counting.
- `runner_dispatch`/staff reallocation for scenario C; decrement reassigned resource capacity somewhere else if moving rather than adding staff.

### Core event trace (example contract, adapt to codebase)

```json
{
  "scenario_id": "baseline",
  "replication": 1,
  "seed": 12345,
  "time_minutes": 42.75,
  "clock_time": "12:12:45",
  "event_type": "cashier_service_start",
  "entity_id": "customer-0107",
  "channel": "dine_in",
  "zone_id": "cashier",
  "resource_id": "cashier-1",
  "queue_length_after": 3
}
```

Emit **arrival**, **join_queue**, **balk**, **service_start**, **payment_complete**, **grill_start**, **grill_finish**, **assembly_start/finish**, **handover**, **table_seated**, **departure**, and resource state changes where appropriate. Each simulated entity gets consistent identifiers across stages.

- Animation consumes an event trace/snapshot from the simulation. It may interpolate position between waypoints, but it must not invent arrivals, completions, or wait times.
- `Start`, `Pause`, `Step +1m`, `Reset`, time warp, and camera changes must not change the underlying random outcomes. Speed changes only playback rate.
- `Reset` with same scenario/config/seed reproduces event order and metrics; new seed is an explicit separate action/replication.
- Any pre-populated inasal buffer must come from a documented initial-state parameter, not a misleading randomized screen fixture.
- Use resource queues and time-stamped state transitions for metrics, not number of active 3D meshes or frame-rate-derived durations.
- Report events/riders who do not finish by the 120-min boundary (censored/incomplete) separately; do not count incomplete orders as completed throughput.

### Formula/metric contract

| Metric | Correct denominator/measurement |
|---|---|
| `Wq`, mean cashier queue waiting (min) | For **served** customers/riders in defined shared/separate queue: `cashier_start − queue_join_time`, average over a reported sample; provide by-channel split. If rider pickup is a different resource, report its queue wait separately. |
| `Lq`, queue length (pax) | **Time-weighted** average `Σ(queue_length_before_event × elapsed_time) / observation_window`; additionally maximum queue length, queue-length-over-time, and sampled snapshots |
| Utilization `ρ` (%) | Busy resource-minutes / (available resource-minutes × effective capacity), track shifts/reallocations and station class |
| Throughput (orders/hr) | Orders **handed over** during observation period / elapsed hours; report by channel and censor after window |
| Balking rate (%) | Balked eligible arrivals / eligible arrivals × 100; state rules and unknown `Balked` handling |
| Courier dwell (min) | Rider departure with order − rider arrival, only if events/record semantics support it |
| Fulfillment (min) | Order/payment completion → food handover, only if both timestamps exist/simulated |
| Table occupancy | Occupied tables / modeled available tables, sourced from actual table entities/config |
| P95 wait (min) | 95th percentile of **individual completed customer waits**, not 95% CI of a scenario mean |

Guard all zero-denominator and empty-sample cases with `N/A` or `Insufficient data` rather than silently returning a misleading `0.0`.

## 7. Scenarios & controlled experiments

These are the primary research interventions described in the proposal:

| ID | Label | Model change | Primary questions |
|---|---|---|---|
| `baseline` | Shared counter | One common line for dine-in, takeout, and courier flow (document assumptions about pre-paid delivery) | Baseline Wq/Lq, congestion, balking, resource ρ |
| `scenario_a` | Channel decoupling | Separate dine-in ordering from takeout/delivery pickup with explicitly allocated resources and queue rules | Does per-channel Wq and rider dwell improve? |
| `scenario_b` | Floating expediter | Roving order-taking support during spikes, prior to cashier, with a genuine time/resource model | Does peak Lq or balking decrease? |
| `scenario_c` | Dynamic peak staffing | Reassign a kitchen prep staffer to dispatch for peak 60 minutes; staffing transfer has tradeoff | Do handover delays fall without overheating other station utilization? |

Current app also displays `BEST — Combined Policy`. This **is not one of the proposal's listed primary scenarios**. Keep only as **exploratory combined scenario** and **never title it “best” until the model objectively selects it** after experiment results. Name it `Combined (exploratory)` until there is sound evidence.

### Experiment protocol

- Run at least **30 independent replications per configuration**, with per-replication random seeds logged.
- Use **common random numbers** across compared scenarios (same replication input/streams) so per-replication differences can be computed; be careful to align underlying stochastic arrivals and processing draws even if branching differs.
- Compute confidence intervals on **replication-level metrics**, not treating each individual order as an independent experimental replication.
- Show 95% confidence intervals, paired mean difference with CI, sample sizes, and a clearly documented selection criterion.
- Sensitivity: repeat key cases with per-channel arrival intensity ×0.8 and ×1.2 without incorrectly refitting the same data as new observations.
- Do not claim a policy is superior solely because it reduced Wq in a single seed at one timestamp; discuss tradeoffs of utilization, throughput, and queue displacement.
- If the staff count, buffer capacity, dispatch rules, or space dimensions are unobserved, show them under `Model assumptions` and allow manual adjustment.

## 8. Charts that MUST exist and what they mean

The screenshot shows **no visible completed charts to validate**, so the agent must inspect the actual existing results pages before adding missing ones. Use a consistent plotting library available in the repo, not a heavy duplicate framework by default.

| Chart | X / Y axes | Data source | Correct reading |
|---|---|---|---|
| Arrival profile | Clock-time 15-min bins / arrivals or arrivals per hour, split by channel | Field observations | Identifies actual demand peaks; report sessions, not fake rush shape |
| Input distribution fits | Measured duration (min) / count or density; QQ, CDF | Field observations + fitted models | Evidence/caveats about sampling inputs, not KPI outcome |
| Queue length through rush | 11:30–13:30 / active queue count (pax), lines per channel/total | DES time-stamped state | Where congestion builds; time-weighted Lq reported separately |
| Average queue wait by scenario/channel | Scenario / mean Wq (min) + 95% CI | 30-replication DES | Compare policy impact and uncertainty; chart labels specify cashier/other queue |
| Courier dwell comparisons | Scenario / mean and P95 dwell (min), CIs for means | DES; observed proxy only with valid semantics | Impact on delivery channel |
| Throughput over time | 15-min interval / completed orders, by channel | DES events | Difference between arrivals and handovers, avoid cumulative-versus-rate confusion |
| Balking/congestion | Scenario / balking share (%) with denominator and queue peak | DES events; observed flags for baseline checks | Customer loss only when defined from valid eligibility |
| Resource utilization | Scenario × resource / ρ (%), show reassignment period | DES busy-time tracking | Locate bottlenecks without presenting >100% or ignoring varying staff supply |
| Scenario trade-off matrix | Baseline/A/B/C (optional combined) × KPIs | Experiment summary | Distinguish improvements from costs; reveal scenario assumptions |
| Pareto plot | Mean queue wait (min) / staff or grill utilization (%) | 30-replication experiment summaries | Show alternatives and non-dominated tradeoffs; a single point is not a frontier |
| Sensitivity chart | Arrival multiplier 0.8/1.0/1.2 / Wq, throughput, balking etc. | Repeated DES experiments | What changes when demand is lower/higher |
| Observed vs simulated validation | Metric / observed vs baseline mean and 95% CI | Field data and baseline DES, comparable definitions only | Supports/limits validation claims |

### Graphing & analysis quality rules

- Axes, readable tick labels, correct units, channel/scenario legend, n, observation window, source badge, and a compact methodological tooltip.
- Never graph `Total_System_Min` as measured cashier `Wq`. Never treat observed queue-at-arrival snapshots as exact time-weighted `Lq`.
- Distinguish **95% confidence intervals of mean metrics** from **P95 customer wait**.
- When validating, compare same-channel, same-stage, same-time-window metrics; mark incomparable metrics as unavailable, not passed.
- Proposal suggests baseline acceptable when simulated averages fall within ~10% of observed values **or observed metrics fall within simulated 95% CIs**. Implement clearly and report deviations and insufficient-data cases; avoid 10%-of-zero numerical traps.
- Provide raw table beneath important plots; export as CSV/PNG where feasible.
- Empty dataset: meaningful empty state, not fake bars/points.
- Charts should update when scenario/seed/data/config changes and stay synchronized with the simulation snapshot.

## 9. Actual development tasks, in dependency order

### Phase 1 — Audit before editing

1. Enumerate repo structure, start/build/test commands, and current application entry point.
2. Map where UI, 3D scene, stage resources, arrival generators, random seeds, metrics, charts, upload/parser, and scenarios live.
3. Verify present functionality versus navigation labels; report broken or mocked sections.
4. Inspect current plotted graphs (if they exist) and document source equations/axes; screenshot alone cannot verify charts.
5. Identify reusable components and regression risks. Save a short implementation plan and file-specific edit list.

### Phase 2 — Data reliability & DES correctness

6. Create/use typed canonical input schema, CSV/XLSX import, validation summary, cleaned-data cache/metadata, and data-origin indicators.
7. Fit stage/channel distributions only when supporting observations exist, otherwise allow clearly marked assumptions.
8. Ensure the DES owns event generation, queues, resource utilization, and clock; connect display, animation, and charts to **one trace**.
9. Implement tests for event ordering, conservation, queue arithmetic, balking, resource boundaries, replay, incomplete orders, and inconsistent imported files.

### Phase 3 — Floor plan and restaurant authenticity

10. Replace arbitrary furniture placement with a reference-aligned layout config and named zones.
11. Rebuild walls/partitions/door openings and kitchen placement; visually match table groups, waiting chairs, pedestrian paths.
12. Apply real CHE photo cues (yellow walls, light tile, red/black chrome-frame chairs, mixed realistic tables, dark ceiling/industrial lights).
13. Update camera presets; add top-down comparison mode; avoid clipping through walls/furniture and entities teleporting across partitions.
14. Validate scene table count/capacity against diagram and config. Record unresolved physical assumptions.

### Phase 4 — UI/UX and analytics

15. Refactor presentational hierarchy and style to look like a purposeful, human-designed research tool; keep existing working controls.
16. Improve clarity and arrangement of metrics, log, simulation controls, and scenario tabs without inventing new unrelated product features.
17. Implement/repair meaningful analytic charts and scenario trade-off matrix; add data provenance, CIs, raw values, and zero-state behavior.
18. Ensure responsive layout, keyboard controls, readable text, contrast, touch usability, chart legibility, and performance.

### Phase 5 — Verification, experiments, handoff

19. Run existing tests, static checks, and production build; repair introduced failures, report environment constraints honestly.
20. If validated field data is present, run scenario replications and ±20% sensitivity; generate outputs and explain anomalies. Without data, generate only **explicitly labeled assumed/demo** results.
21. Document relevant file changes, parser usage, model assumptions, metric formulas, operating instructions, findings, shortcomings, and follow-up clarifications.
22. Supply before/after screenshots for floor plan top-down, 3D isometric, desktop/dashboard, charts, tablet/mobile when tooling allows.

## 10. Acceptance checks (definition of done)

- [ ] Existing project runs; no broad destructive rewrite or removed simulation functionality.
- [ ] The agent inspected current source, not just screenshot, before code changes.
- [ ] Left dining + 4-chair waiting strip + middle kitchen + right dining + real partitions are recognizable from the top-down reference.
- [ ] Yellow walls, tile floor, realistic red/black thin-frame chairs, mixed tables, and warm industrial interior resemble the actual restaurant photo.
- [ ] 3D world represents DES stages; all moving entities obey zones and never create data independently from model events.
- [ ] Camera presets, play/pause, step, reset, and time warp still work with deterministic results.
- [ ] Physical tables in scene and table-availability KPI use the same model configuration.
- [ ] CSV and **genuine XLSX** imports work; bad rows and missing headers yield clear errors.
- [ ] Channel breakdown, timestamps, units, sample sizes, and data provenance are consistent across parser and dashboard.
- [ ] No fabricated field measurements or empirical-validation claims in demo mode.
- [ ] Wq, Lq, courier dwell, throughput, utilization, balking, dining occupancy, and fulfillment are measured with documented formulas.
- [ ] Scenario logic matches proposal, exploratory combined scenario properly labeled, controlled replications supported.
- [ ] Graph axes, source labels, n, CI versus percentile distinction, readable plot layout, and export/underlying table available.
- [ ] Validation is only claimed for comparable metrics with enough data.
- [ ] All regression/unit/integration tests and actual build checks run or blocking conditions explicitly documented.
- [ ] Final engineering summary provides files changed, visual deltas, inputs used, outputs generated, and unresolved assumptions.

## 11. Specific cautions about the user's evidence

1. No `.xlsx` or `.csv` workbook was provided with this handoff. The **schema alone cannot support numerical trend analysis, actual distribution parameters, service-time statistics, or calibrated scenario benefits**.
2. The visible dashboard shows **initial-state numbers** (e.g., 0 wait, 0 orders) and performance bars. Those are not graphs of field observations and must not be interpreted as a result of a completed run.
3. The proposed floor plan is a rough reference, **not** a survey drawing with walls measured in meters. Build visually accurate relationships first, then request dimensions for precision.
4. Photo shows the actual dining atmosphere; it doesn't verify the exact entire building footprint, cashier location, or dining-table count.
5. The proposal uses *SimPy (Python)* as intended DES engine. If repository implementation differs, confirm compatibility and explain rather than automatically migrating entire app.
6. The proposal's combined/BEST scenario isn't a formally listed primary case and requires independent evaluation; no policy may be called optimal without completed experiments.
7. Real-person photos are for architectural/furniture color reference only; avoid recreating identifiable patrons in the 3D scene.

## 12. Deliverable expectation from coding agent

At completion, report:

```text
AUDIT
- Detected stack/engine:
- Existing features kept:
- Mocked/missing parts found:

CHANGED FILES
- path: purpose

LAYOUT & STYLE
- Differences versus floor plan/photo:
- Assumptions requiring owner confirmation:

DATA & MODEL
- Imported file/sheet/row counts (or 'no actual dataset provided'):
- Distributions fit and sample sizes (or assumed-mode explanation):
- Formula/metric corrections:
- Scenario and seed/replication approach:

EXPERIMENTS & GRAPHS
- Results/CI only if actually computed:
- Charts added or corrected:
- Validation status (passed/failed/not possible):

VERIFICATION
- Commands/tests/build executed and results:
- Before/after screenshots or how to inspect:
- Remaining blockers and recommended next steps:
```

**Guiding principle:** Preserve the working simulation, fix the science and data provenance, visually reconstruct the real CHE restaurant, and elevate UI craft without aesthetic gimmicks or unsupported results.
