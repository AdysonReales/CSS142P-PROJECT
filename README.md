# Campus Cafeteria Queue Optimization & 3D Simulation

A **Discrete-Event Simulation (DES)** and **3D visualization** project for analyzing, modeling, and optimizing customer queue dynamics, service capacity, and bottleneck reduction at a campus food stall under stochastic demand.

---

## 📌 Project Overview

During peak lunch hours (**11:30 AM – 1:30 PM**), irregular academic schedules across different student cohorts create unpredictable, high-intensity arrival surges at campus food stalls. These non-fixed schedules can lead to:

* Prolonged customer wait times
* Counter bottlenecks
* Aisle congestion
* Queue abandonment (balking)
* Uneven server utilization

This project applies **Discrete-Event Simulation (DES)** coupled with **3D Visualization** to model stochastic customer demand, evaluate counter service workflows, and run experimental scenario analyses.

The primary goal is to optimize the trade-off between **customer waiting time ($W_q$)** and **server utilization ($\rho$)** without requiring full structural overhauls or excessive staffing costs.

---

## 🎯 Objectives

### 1. Empirical Data Fitting

Collect field observation data on:

* Customer arrival times
* Inter-arrival times
* Service durations
* Queue lengths
* Server utilization
* Customer abandonment

The collected data will be fitted to appropriate theoretical probability distributions.

### 2. Baseline Simulation

Develop and validate a **Discrete-Event Simulation model** representing the existing food-stall workflow.

The baseline model will reproduce the observed:

* Arrival patterns
* Service processes
* Queue behavior
* Server capacity
* Waiting times

### 3. Scenario Testing

Run experimental scenarios under **time-varying arrival rates ($\lambda(t)$)**.

Potential scenarios include:

* Staff/server reallocation
* Separate ordering and payment queues
* Express service lines
* Additional temporary servers during peak periods
* Surge-based staffing thresholds
* Alternative queue configurations

### 4. 3D Visualization

Develop an interactive 3D environment that visually represents:

* Customer arrivals
* Queue formation
* Customer movement
* Service counters
* Server activity
* Bottleneck formation
* Queue abandonment

The visualization will allow different operational scenarios to be observed spatially.

---

# 🛠️ Tech Stack & Tools

## Simulation & Analytics

| Technology                | Purpose                          |
| ------------------------- | -------------------------------- |
| **Python 3.x**            | Core programming language        |
| **SimPy**                 | Discrete-event simulation        |
| **pandas**                | Data processing and analysis     |
| **NumPy**                 | Numerical computation            |
| **SciPy (`scipy.stats`)** | Probability distribution fitting |
| **Matplotlib**            | Statistical and simulation plots |
| **Seaborn**               | Data visualization               |

## 3D Visualization

| Technology   | Purpose                            |
| ------------ | ---------------------------------- |
| **Blender**  | 3D modeling and asset creation     |
| **Three.js** | Browser-based 3D rendering         |
| **WebGL**    | Hardware-accelerated graphics      |
| **PyOpenGL** | Optional Python-based 3D rendering |

## Web Interface / Dashboard

Depending on the final implementation, one of the following can be used:

* **Streamlit**
* **Flask**
* **FastAPI**

---

# 📁 Repository Structure

```text
campus-queue-3d-simulation/
│
├── .gitignore
├── README.md
├── requirements.txt
├── LICENSE
│
├── docs/
│   ├── proposal.md
│   ├── methodology.md
│   └── screenshots/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── assets/
│   ├── 3d_models/
│   └── textures/
│
├── src/
│   ├── simulation/
│   │   ├── entities.py
│   │   ├── queue_model.py
│   │   └── distributions.py
│   │
│   ├── optimization/
│   │   └── scenario_runner.py
│   │
│   └── visualization/
│       ├── renderer_3d.py
│       └── dashboard.py
│
├── tests/
│   ├── test_simulation.py
│   └── test_distributions.py
│
└── notebooks/
    ├── 01_data_cleaning.ipynb
    ├── 02_distribution_fitting.ipynb
    └── 03_scenario_analysis.ipynb
```

---

# 🚀 Getting Started

## Prerequisites

Ensure that **Python 3.9 or later** is installed.

Check your Python version:

```bash
python --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/campus-queue-3d-simulation.git
cd campus-queue-3d-simulation
```

### 2. Create a Virtual Environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 📊 Key Performance Indicators

The simulation tracks several key performance indicators (KPIs) for evaluating queue performance and operational scenarios.

| Metric                         | Symbol | Description                                                                     |
| ------------------------------ | ------ | ------------------------------------------------------------------------------- |
| **Average Queue Waiting Time** | $W_q$  | Mean time a customer spends waiting before receiving service                    |
| **Total System Time**          | $W$    | Total time from joining the queue until the customer's transaction is completed |
| **Average Queue Length**       | $L_q$  | Mean number of customers waiting in the queue                                   |
| **Server Utilization Rate**    | $\rho$ | Percentage of operational time that servers are actively serving customers      |
| **Balking / Reneging Count**   | $N_b$  | Number of customers who leave because of excessive waiting or queue length      |

---

# 📈 Simulation Methodology

The project follows a four-stage workflow:

```text
┌──────────────────────────┐
│  1. Data Collection      │
│  Arrival & Service Data  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  2. Statistical Analysis │
│ Distribution Fitting     │
│ λ(t) + Service Times     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  3. Baseline Simulation  │
│        SimPy DES         │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  4. Scenario Analysis    │
│ Optimization Experiments │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      3D Visualization    │
│ Queue & Bottleneck Flow  │
└──────────────────────────┘
```

## Data Collection

Empirical observations are organized into **15-minute time buckets** to account for changes in student arrival patterns throughout the lunch period.

Example:

```text
11:30 – 11:45
11:45 – 12:00
12:00 – 12:15
12:15 – 12:30
12:30 – 12:45
12:45 – 1:00
1:00 – 1:15
1:15 – 1:30
```

These observations are used to estimate the time-varying arrival rate:

$$
\lambda(t)
$$

---

# 🔬 Scenario Analysis

After validating the baseline model, alternative operational configurations can be tested.

Example scenarios include:

### Baseline

Existing stall workflow and staffing configuration.

### Scenario A — Staff Reallocation

Redistribute existing staff between preparation, ordering, payment, and serving tasks.

### Scenario B — Split Order & Payment

Separate ordering and payment activities to reduce transaction bottlenecks.

### Scenario C — Express Queue

Create an express queue for customers with simple or predefined orders.

### Scenario D — Surge Staffing

Introduce additional service capacity when the estimated arrival rate exceeds a predefined threshold.

Each scenario can be evaluated using the same simulation conditions and performance indicators.

---

# 🎮 3D Simulation

The 3D component provides a visual representation of the simulated environment.

The environment may include:

```text
             CAMPUS CAFETERIA
┌──────────────────────────────────────┐
│                                      │
│   Student      Student      Student  │
│      ↓            ↓            ↓     │
│                                      │
│   ┌──────────────────────────────┐   │
│   │          QUEUE AREA          │   │
│   │  ● → ● → ● → ● → ●           │   │
│   └──────────────┬───────────────┘   │
│                  ↓                   │
│        ┌───────────────────┐         │
│        │   JAYMIN'S STALL  │         │
│        │                   │         │
│        │  Order │ Payment  │         │
│        └───────────────────┘         │
│                                      │
└──────────────────────────────────────┘
```

The 3D visualization is intended to make simulation results easier to interpret by showing how different queue configurations affect physical customer flow and congestion.

---

# 🧪 Testing

Unit and simulation tests are stored in the `tests/` directory.

Run the test suite using:

```bash
pytest
```

Example test files:

```text
tests/
├── test_simulation.py
└── test_distributions.py
```

---

# 📓 Notebooks

Jupyter notebooks are used for exploratory analysis and research experimentation.

| Notebook                        | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `01_data_cleaning.ipynb`        | Clean and prepare collected observation data |
| `02_distribution_fitting.ipynb` | Fit and evaluate probability distributions   |
| `03_scenario_analysis.ipynb`    | Analyze and compare simulation scenarios     |

---

# 📚 Documentation

Additional project documentation is available in the `docs/` directory.

```text
docs/
├── proposal.md
├── methodology.md
└── screenshots/
```

* **`proposal.md`** — Research proposal and project scope
* **`methodology.md`** — Detailed research and simulation methodology
* **`screenshots/`** — Screenshots and visual documentation

---

# 📌 Project Scope

The simulation focuses specifically on **Jaymin's food stall** rather than modeling the entire campus cafeteria.

This creates a clearly defined system boundary while allowing the study to investigate:

* Customer arrival behavior
* Queue formation
* Service capacity
* Server utilization
* Bottlenecks
* Customer abandonment
* Operational optimization

The model may use either a **single-server (`M/G/1`)** or **multi-server (`G/G/c`)** queueing configuration depending on the observed stall workflow.

---

# 📜 License

This project is distributed under the **MIT License**.

See [`LICENSE`](LICENSE) for more information.
