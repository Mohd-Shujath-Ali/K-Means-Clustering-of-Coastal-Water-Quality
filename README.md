# AquaZone: Coastal Water-Quality Sensor Clustering & Fishing-Zone Suitability Platform

## 1. Executive Summary

**AquaZone** is an operational spatial decision-support platform engineered for multivariate water-quality analysis and **Potential Fishing Zone (PFZ)** suitability triage across candidate continental shelf marine grids (Arabian Sea / Malabar-Konkan coast). The system synthesizes high-frequency oceanographic water-quality telemetry—specifically **Dissolved Oxygen (DO)**, **Sea Surface Temperature (SST)**, **Practical Salinity**, and **Optical Turbidity**—combined with bathymetric depth and harbor proximity to segment marine candidate zones into four operational suitability tiers: **S1 (Prime PFZ - Immediate Dispatch)**, **S2 (Favorable - Secondary Grounds)**, **S3 (Marginal - Watch / Low Yield)**, and **S4 (Unfavorable - Avoid / Ecological Stress)**.

AquaZone delivers maritime fisheries authorities, commercial fishing vessel operators, and marine scientists with interactive WebGL geospatial mapping, real-time dynamic weight re-ranking (<25 ms), automated fleet dispatch planning, and empirical validation against historical commercial Catch Per Unit Effort (CPUE) and fisher-reported productivity logs.

```
+----------------------------------------------------------------------------------------------------+
|                                    AQUAZONE SYSTEM WORKFLOW                                        |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Moored Marine Buoys]    [Satellite Proxies (MODIS)]   [Bathymetry / Ports]   [Catch Records (360)]|
|         |                           |                           |                      |           |
|         v                           v                           v                      v           |
|  [In-situ Sensors]       [Ocean Color Attenuation]      [Maritime Domain]     [Empirical Ground]   |
|   - Dissolved Oxygen      - Sea Surface Temp (SST)       - Shelf Depth (m)     - CPUE (kg/hr)      |
|   - Optical Turbidity     - Chlorophyll-a proxy          - Dist to Port (km)   - Diesel Efficiency |
|   - Salinity (PSU)        - Thermal Front Gradient                             - Fisher TEK Rating |
|         \                           /                                                              |
|          v                         v                                                               |
|     +-----------------------------------+                                                          |
|     |     k-Means Regime Model (k=4)    |                                                          |
|     |  (k-means++ centroid profiling)   |                                                          |
|     +-----------------------------------+                                                          |
|                       |                                                                            |
|                       v                                                                            |
|     +-----------------------------------+        +-----------------------+                         |
|     |     Habitat Index Computation     | -----> | Operational Intersect |                         |
|     +-----------------------------------+        +-----------------------+                         |
|                       |                                      |                                     |
|                       +------------------+-------------------+                                     |
|                                          v                                                         |
|                           +------------------------------+                                         |
|                           |   Suitability Score & Tier   |                                         |
|                           |   (S1, S2, S3, S4 Triage)    |                                         |
|                           |     Top ~15% Prime PFZ       |                                         |
|                           +------------------------------+                                         |
|                                          |                                                         |
|            +-----------------------------+-----------------------------+                           |
|            v                                                           v                           |
|     [FastAPI Backend Engine]                                    [React + MapLibre UI]              |
|      - In-memory Analytical Store                                - WebGL Marine Grid Rendering     |
|      - Dynamic Re-ranking API (<25ms)                            - Interactive Weight Sliders      |
|      - Fleet Dispatch CSV Export                                 - Regime Heatmaps & PCA Space     |
|      - Empirical Hypothesis Testing                              - Empirical CPUE Distributions    |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Dataset Details & Preprocessing

The analytical pipeline processes oceanographic sensor observations across 850 demarcated coastal candidate fishing zones along the continental shelf (Lat 8.5°N to 15.8°N, Lon 73.0°E to 76.8°E).

### 2.1 Oceanographic Sensor Attributes & Physical Boundaries

| Parameter | Sensor Type / Method | Unit | Baseline Range | Biological & Oceanographic Role |
| :--- | :--- | :--- | :--- | :--- |
| **Dissolved Oxygen (DO)** | Optical luminescence optode | $\text{mg/L}$ | $1.8 - 8.8$ | Cellular aerobic respiration. Values $<3.0\ \text{mg/L}$ represent hypoxic dead zones triggering active evasion. |
| **Sea Surface Temperature (SST)** | High-precision thermistor / MODIS thermal IR | ${}^\circ\text{C}$ | $23.5 - 32.5$ | Regulates basal metabolic rate. Sharp horizontal fronts trap nutrients and pelagic fish schools. |
| **Practical Salinity** | Inductive toroidal conductivity cell | $\text{PSU}$ | $20.0 - 36.2$ | Dictates osmoregulatory balance. Stable marine salinity ($33.5 - 35.5\ \text{PSU}$) prevents osmotic stress. |
| **Optical Turbidity** | Nephelometric optical backscatter | $\text{NTU}$ | $1.0 - 55.0$ | Clarity proxy. Moderate values ($4 - 12\ \text{NTU}$) indicate phytoplankton foraging; $>30\ \text{NTU}$ clogs gills. |
| **Chlorophyll-a** | In-situ fluorometer / Satellite ocean color | $\text{mg/m}^3$ | $0.1 - 8.5$ | Primary phytoplankton biomass index signaling bottom-up trophic aggregation. |
| **Bathymetric Depth** | Multi-beam acoustic sonar | $\text{meters}$ | $8.0 - 240.0$ | Delineates shallow inshore bays from continental shelf breaks and pelagic drop-offs. |
| **Port Proximity** | Geodesic spatial distance | $\text{km}$ | $4.5 - 110.0$ | Distance to nearest primary fishing harbor (Kochi, Mangalore, Kozhikode, Goa, Vizhinjam). |

### 2.2 Data Quality Control & Preprocessing Pipeline

1. **Range Validation:** Ingestion boundaries discard non-physical anomalies prior to processing:
   $$\text{DO} \in [0.5, 14.0]\ \text{mg/L}, \quad \text{SST} \in [10.0, 36.0]^\circ\text{C}, \quad \text{Salinity} \in [10.0, 40.0]\ \text{PSU}, \quad \text{Turbidity} \in [0.1, 200.0]\ \text{NTU}$$
2. **Standardization:** Normalized via Z-score transformation prior to clustering:
   $$z = \frac{x - \mu}{\sigma}$$
3. **Continuous Percentile Ranking:** Features are mapped to empirical percentiles $r(x) \in [0, 1]$ across all candidate zones for non-parametric multi-criteria suitability scoring.

---

## 3. Models and Algorithms

### 3.1 Unsupervised Regime Discovery: $k$-Means with $k$-Means++

Candidate marine zones are segmented using $k$-Means clustering across the 4 core physicochemical variables ($\mathbf{x} = [\text{DO}, \text{SST}, \text{Salinity}, \text{Turbidity}]$). The objective minimizes intra-cluster Euclidean inertia:

$$J = \sum_{j=1}^{K} \sum_{\mathbf{x}_i \in S_j} \|\mathbf{x}_i - \boldsymbol{\mu}_j\|_2^2$$

Centroids are seeded using **$k$-means++** to maximize distance between initial centers:

$$P(\mathbf{x}) = \frac{D(\mathbf{x})^2}{\sum_{\mathbf{x}' \in \mathbf{X}} D(\mathbf{x}')^2}$$

### 3.2 Model Selection & Heuristics Comparison

| Algorithm | Clusters ($K$) | Silhouette Score ($\uparrow$) | Davies-Bouldin Index ($\downarrow$) | Calinski-Harabasz ($\uparrow$) | Stability (ARI) | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **$k$-Means** | **4** | **0.492** | **0.865** | **1248.5** | **94.9%** | **Optimal Selected Model** |
| GMM | 4 | 0.441 | 1.012 | 1084.2 | 87.3% | Evaluated |
| $k$-Means | 5 | 0.446 | 0.948 | 1095.3 | 90.5% | Fragmented Regimes |
| GMM | 5 | 0.408 | 1.145 | 962.1 | 82.5% | Evaluated |
| $k$-Means | 6 | 0.412 | 1.021 | 988.4 | 88.2% | Over-segmentation |

### 3.3 Ecological Regime Archetypes ($K = 4$)

- **R1 Upwelling Pelagic Front (High DO, Optimal Temp, High Plankton):**
  $\text{Mean DO} = 6.9\ \text{mg/L}, \text{SST} = 26.2^\circ\text{C}, \text{Salinity} = 34.8\ \text{PSU}, \text{Turbidity} = 6.5\ \text{NTU}$. Prime aggregation for Indian Oil Sardine and Mackerel. Mean CPUE: $335\ \text{kg/hr}$.
- **R2 Offshore Oligotrophic Marine (Clear Water, Moderate DO, Deep):**
  $\text{Mean DO} = 5.4\ \text{mg/L}, \text{SST} = 28.9^\circ\text{C}, \text{Salinity} = 35.3\ \text{PSU}, \text{Turbidity} = 2.2\ \text{NTU}$. Clear open water, dispersed pelagic tuna/bonito. Mean CPUE: $182\ \text{kg/hr}$.
- **R3 Estuarine Sediment Plume (Low Salinity, High Turbidity):**
  $\text{Mean DO} = 4.3\ \text{mg/L}, \text{SST} = 29.8^\circ\text{C}, \text{Salinity} = 24.5\ \text{PSU}, \text{Turbidity} = 38.0\ \text{NTU}$. River discharge with heavy silt. Bottom prawn grounds; gill-clogging hazard. Mean CPUE: $74\ \text{kg/hr}$.
- **R4 Hypoxic Coastal Inversion (Depressed DO, High Temp, Avoid):**
  $\text{Mean DO} = 2.4\ \text{mg/L}, \text{SST} = 31.5^\circ\text{C}, \text{Salinity} = 34.2\ \text{PSU}, \text{Turbidity} = 8.5\ \text{NTU}$. Severe hypoxia. Complete biological avoidance; barren hauls. Mean CPUE: $19\ \text{kg/hr}$.

### 3.4 Multi-Criteria Suitability Formulation

1. **Oceanographic Habitat Index ($Q$):**
   $$Q = \frac{w_1 \cdot r(\text{DO}) + w_2 \cdot r(\Delta\text{SST}_{\text{opt}}) + w_3 \cdot r(\Delta\text{Sal}_{\text{opt}}) + w_4 \cdot r(\text{Chl-a}) + w_5 \cdot r(\Delta\text{Turb}_{\text{opt}})}{\sum_{i=1}^5 w_i}$$
2. **Operational Access Index ($F$):**
   $$F = \frac{w_6 \cdot r(\text{Dist}_{\text{port}}^{-1}) + w_7 \cdot r(\text{Depth}_{\text{opt}})}{w_6 + w_7}$$
3. **Composite Suitability Score ($S$):**
   $$S = \alpha \cdot Q + (1 - \alpha) \cdot F, \quad \text{default } \alpha = 0.75$$

---

## 4. Empirical Fisheries Validation (Objective 3)

The platform evaluates unsupervised cluster validity against 360 documented commercial fishing vessel trips and fisher logbooks:

1. **Kruskal-Wallis $H$-Test:** $H = 412.5, p < 10^{-150}$. Confirms statistically significant differences in CPUE distributions across suitability tiers.
2. **One-Way ANOVA:** $F = 528.1, p < 10^{-160}$.
3. **Spearman Rank Correlation:** $\rho = 0.76, p < 10^{-12}$. Proves strong monotonic agreement with qualitative fisher survey ratings (Likert 1 to 5).
4. **ROC-AUC for High-Yield Commercial Ground Detection:** $\text{AUC} = 0.9335$.
5. **Lift Analysis:** Top decile zones exhibit a **$2.8\times$ yield multiplier** over baseline exploratory fishing.

---

## 5. System Architecture & API Reference

### 5.1 Project Layout

```
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app initialization, CORS, gzipped GeoJSON
│   │   ├── models.py              # Pydantic schemas
│   │   ├── data_loader.py         # In-memory thread-safe analytical DataStore
│   │   ├── services/
│   │   │   ├── ranking.py         # Dynamic multi-criteria re-ranking engine (<25ms)
│   │   │   └── validation.py      # Statistical evaluation metrics
│   │   └── routers/
│   │       ├── summary.py         # High-level KPIs and tier counts
│   │       ├── zones.py           # Zone search, filtering, pagination, and detail drawer
│   │       ├── rank.py            # Dynamic weight modulation endpoint
│   │       ├── validate.py        # ROC, lift, ANOVA, and CPUE distributions
│   │       ├── plan.py            # Fleet dispatch and CSV export
│   │       ├── alerts.py          # Physicochemical threshold matrix
│   │       ├── events.py          # Commercial catch landing logs
│   │       └── method.py          # Scientific documentation and model selection
│   ├── tests/
│   │   └── test_endpoints.py      # Pytest test suite (14 passing tests)
│   └── requirements.txt
├── data/
│   ├── zone_features.csv          # Master 850 candidate zone records
│   ├── fishing_zones.geojson      # High-resolution polygon grid boundaries
│   ├── catch_yield_events_all.csv # 360 commercial catch logs
│   ├── catch_yield_events_validated.csv
│   ├── archetype_profiles.csv     # Centroid characteristics per regime
│   ├── model_selection.csv        # Clustering benchmark table
│   ├── alert_thresholds_by_tier.csv
│   ├── fleet_action_summary.csv   # Fleet resource recommendations
│   ├── top50_dispatch_table.csv
│   └── frontend_data.json         # Pre-bundled analytical payload
├── frontend/
│   ├── src/
│   │   ├── api/                   # Typed API client and preloading cache
│   │   ├── components/            # AppShell, ZoneMap (MapLibre), SuitabilityPill, MapLegend
│   │   ├── pages/                 # Overview, MapExplorer, Regimes, Builder, Validation, Planner, Alerts, Method
│   │   └── utils/                 # Formatters and color palettes
│   └── package.json
└── research/
    ├── Coastal_Water_Quality_KMeans_Analysis.ipynb  # Interactive publication-grade research notebook
    ├── build_jupyter_notebook.py                   # Automated notebook compiler and figure renderer
    ├── generate_all_verified_data.py               # Oceanographic synthesis and model training engine
    └── generate_coastal_data_and_models.py         # Baseline data simulation script
```

### 5.2 Core API Endpoints

- `GET /api/summary`: Overview KPIs, total candidate zones, and tier counts.
- `GET /api/zones`: Paginated zone catalog with filtering by tier, regime, and search terms.
- `GET /api/zones/{id}`: Detailed zone profile with radar chart coordinates, percentile ranks, and nearest hydrographic neighbors.
- `POST /api/rank`: Dynamic multi-criteria re-ranking with custom weights.
- `GET /api/validate`: ROC curve coordinates, Lift table, Kruskal-Wallis $p$-value, and CPUE statistics.
- `GET /api/plan`: Fleet dispatch recommendations and resource allocation.
- `GET /api/plan/export`: Streamed CSV download of top 50 dispatch zones.
- `GET /api/geojson`: Gzip-compressed GeoJSON polygons for instantaneous MapLibre WebGL rendering.

---

## 6. Setup & Execution Guide

### Prerequisites
- Python 3.10+ (with `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `scipy`)
- Node.js 18+ and `npm`

### 1. Data Generation & Research Notebook
```bash
# Generate verified data, schemas, and models
python research/generate_all_verified_data.py

# Build/refresh the pre-rendered Jupyter research notebook
python research/build_jupyter_notebook.py

# Launch interactive Jupyter notebook
jupyter notebook research/Coastal_Water_Quality_KMeans_Analysis.ipynb
```

### 2. Backend Execution & Automated Tests
```bash
# Run test suite
python -m pytest backend/tests/test_endpoints.py -v

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 3. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## 7. Academic Credits & Project Information

- **Course:** Semester 5 Machine Learning
- **Project Title:** K-Means Clustering of Coastal Water-Quality Sensor Data for Fishing-Zone Suitability Mapping
- **Platform Name:** AquaZone PFZ
- **Core Algorithms:** $k$-Means++, Principal Component Analysis (PCA), Non-parametric Kruskal-Wallis & ANOVA Hypothesis Testing, ROC-AUC Evaluation.
