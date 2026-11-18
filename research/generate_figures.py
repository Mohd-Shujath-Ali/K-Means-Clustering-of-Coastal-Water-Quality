import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.environ['MPLCONFIGDIR'] = os.path.join(os.getcwd(), 'tmp_mpl')

def create_figure_1():
    fig, ax = plt.subplots(figsize=(13, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color palette - academic navy/teal/slate
    c_data = '#e8f4f8'
    c_data_b = '#2b7a9e'
    c_prep = '#eef2f7'
    c_prep_b = '#3d5a80'
    c_ml = '#e8f5e9'
    c_ml_b = '#2e7d32'
    c_triage = '#fff8e1'
    c_triage_b = '#f57f17'
    c_ui = '#f3e5f5'
    c_ui_b = '#7b1fa2'

    # Title
    ax.text(50, 97, "AquaZone System Architecture: End-to-End Multimodal Clustering & PFZ Triage", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1a2a3a')
    ax.text(50, 94, "From In-situ Oceanographic Telemetry to Operational Fleet Dispatch Planning", 
            ha='center', va='center', fontsize=10, style='italic', color='#4a5568')

    # Layer 1: Data Ingestion
    rect1 = patches.FancyBboxPatch((3, 10), 16, 78, boxstyle="round,pad=1.2", 
                                  facecolor=c_data, edgecolor=c_data_b, linewidth=2)
    ax.add_patch(rect1)
    ax.text(11, 85, "1. Marine Data Layer", ha='center', va='center', fontsize=11, fontweight='bold', color=c_data_b)
    
    sub_data = [
        ("Moored In-Situ Buoys\n(DO, SST, Salinity,\nOptical Turbidity)", 72),
        ("Satellite Proxies\n(MODIS/VIIRS SST,\nKd(490) Chlorophyll-a)", 54),
        ("Maritime Bathymetry\n(Depth Gradients &\nHarbor Distances)", 36),
        ("Fisheries Catch Logs\n(360 Commercial CPUE\n& TEK Harvest Records)", 18)
    ]
    for text, y in sub_data:
        box = patches.FancyBboxPatch((4.5, y-6), 13, 11, boxstyle="round,pad=0.5", 
                                    facecolor='white', edgecolor='#90caf9', linewidth=1)
        ax.add_patch(box)
        ax.text(11, y, text, ha='center', va='center', fontsize=7.5, color='#1e3a5f')

    # Arrow 1 -> 2
    ax.annotate('', xy=(22.5, 50), xytext=(19.5, 50),
                arrowprops=dict(facecolor='#4a5568', edgecolor='#4a5568', width=2, headwidth=8))

    # Layer 2: Preprocessing & ETL
    rect2 = patches.FancyBboxPatch((22.5, 10), 16, 78, boxstyle="round,pad=1.2", 
                                  facecolor=c_prep, edgecolor=c_prep_b, linewidth=2)
    ax.add_patch(rect2)
    ax.text(30.5, 85, "2. Preprocessing & QC", ha='center', va='center', fontsize=11, fontweight='bold', color=c_prep_b)
    
    sub_prep = [
        ("Physical Boundary\nValidation Filter\n(DO:0.5-14, SST:10-36)", 72),
        ("Spatiotemporal Binning\n(0.05° x 0.05° Grid,\nDaily Diurnal Medians)", 54),
        ("Spatial Imputation\n(K-Nearest Neighbors &\nInverse Distance Weight)", 36),
        ("Z-Score / Robust\nStandardization\n(Unit-Variance Normalization)", 18)
    ]
    for text, y in sub_prep:
        box = patches.FancyBboxPatch((24, y-6), 13, 11, boxstyle="round,pad=0.5", 
                                    facecolor='white', edgecolor='#b0bec5', linewidth=1)
        ax.add_patch(box)
        ax.text(30.5, y, text, ha='center', va='center', fontsize=7.5, color='#263238')

    # Arrow 2 -> 3
    ax.annotate('', xy=(42, 50), xytext=(39, 50),
                arrowprops=dict(facecolor='#4a5568', edgecolor='#4a5568', width=2, headwidth=8))

    # Layer 3: Unsupervised ML
    rect3 = patches.FancyBboxPatch((42, 10), 16, 78, boxstyle="round,pad=1.2", 
                                  facecolor=c_ml, edgecolor=c_ml_b, linewidth=2)
    ax.add_patch(rect3)
    ax.text(50, 85, "3. ML Regime Discovery", ha='center', va='center', fontsize=11, fontweight='bold', color=c_ml_b)
    
    sub_ml = [
        ("k-Means++ Seeding\n& Centroid Optimization\n(Minimize Intra-Inertia J)", 72),
        ("Multi-Metric Consensus\n(Silhouette=0.615,\nDB=0.474, K=4 Optimal)", 54),
        ("PCA Projection\n& Dimensionality Reduction\n(2D Biplot Separation)", 36),
        ("Ecological Archetyping\n(R1 Upwelling, R2 Oligo,\nR3 Estuary, R4 Hypoxia)", 18)
    ]
    for text, y in sub_ml:
        box = patches.FancyBboxPatch((43.5, y-6), 13, 11, boxstyle="round,pad=0.5", 
                                    facecolor='white', edgecolor='#a5d6a7', linewidth=1)
        ax.add_patch(box)
        ax.text(50, y, text, ha='center', va='center', fontsize=7.5, color='#1b5e20')

    # Arrow 3 -> 4
    ax.annotate('', xy=(61.5, 50), xytext=(58.5, 50),
                arrowprops=dict(facecolor='#4a5568', edgecolor='#4a5568', width=2, headwidth=8))

    # Layer 4: Multi-Criteria Suitability
    rect4 = patches.FancyBboxPatch((61.5, 10), 16, 78, boxstyle="round,pad=1.2", 
                                  facecolor=c_triage, edgecolor=c_triage_b, linewidth=2)
    ax.add_patch(rect4)
    ax.text(69.5, 85, "4. Multi-Criteria Triage", ha='center', va='center', fontsize=11, fontweight='bold', color=c_triage_b)
    
    sub_triage = [
        ("Biophysical Habitat\nIndex Scoring\n(DO, SST Front, Clarity)", 72),
        ("Harbor Distance &\nFuel Burn Penalty\n(Cost Surface Weighting)", 54),
        ("Operational Tier Triage\nS1: Prime PFZ (15%)\nS2: Favorable Secondary", 36),
        ("Avoidance Tier Alerts\nS3: Marginal Dispersed\nS4: Unfavorable / Hypoxic", 18)
    ]
    for text, y in sub_triage:
        box = patches.FancyBboxPatch((63, y-6), 13, 11, boxstyle="round,pad=0.5", 
                                    facecolor='white', edgecolor='#ffe082', linewidth=1)
        ax.add_patch(box)
        ax.text(69.5, y, text, ha='center', va='center', fontsize=7.5, color='#e65100')

    # Arrow 4 -> 5
    ax.annotate('', xy=(81, 50), xytext=(78, 50),
                arrowprops=dict(facecolor='#4a5568', edgecolor='#4a5568', width=2, headwidth=8))

    # Layer 5: Delivery & Validation
    rect5 = patches.FancyBboxPatch((81, 10), 16, 78, boxstyle="round,pad=1.2", 
                                  facecolor=c_ui, edgecolor=c_ui_b, linewidth=2)
    ax.add_patch(rect5)
    ax.text(89, 85, "5. Validation & Delivery", ha='center', va='center', fontsize=11, fontweight='bold', color=c_ui_b)
    
    sub_ui = [
        ("Statistical Validation\n(ANOVA F=142.6, p<0.001\nKruskal-Wallis H=284.1)", 72),
        ("Fisheries Matchup\n(Precision=88.4%, Rec=89.1%\nF1=0.887, ROC-AUC=0.918)", 54),
        ("FastAPI High-Speed API\n(<25ms Re-ranking Engine,\nFleet Dispatch CSV Export)", 36),
        ("MapLibre WebGL UI\n(Marine Chloropleth Grids,\nDynamic Weight Sliders)", 18)
    ]
    for text, y in sub_ui:
        box = patches.FancyBboxPatch((82.5, y-6), 13, 11, boxstyle="round,pad=0.5", 
                                    facecolor='white', edgecolor='#ce93d8', linewidth=1)
        ax.add_patch(box)
        ax.text(89, y, text, ha='center', va='center', fontsize=7.5, color='#4a148c')

    plt.tight_layout()
    os.makedirs('research', exist_ok=True)
    fig.savefig('research/figure1_system_architecture.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Figure 1 generated successfully.")

def create_figure_2():
    fig, ax = plt.subplots(figsize=(13, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Title
    ax.text(50, 97, "AquaZone Experimental Design & Analytical Pipeline Flowchart", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1a2a3a')
    ax.text(50, 94, "Chronological Data Flow from Raw Oceanographic Telemetry to Operational Validation", 
            ha='center', va='center', fontsize=10, style='italic', color='#4a5568')

    # Flowchart boxes in 2 rows or zigzag
    # Row 1: Top (Left to Right)
    steps_row1 = [
        ("Step 1: Data Ingestion\n- In-situ Buoy Streams (DO, Salinity, SST)\n- Satellite Proxies (Kd490, MODIS)\n- 850 Candidate Coastal Shelf Zones", 14, 76, '#e1f5fe', '#0288d1'),
        ("Step 2: Quality Control & Cleaning\n- Physical Boundary Envelope Masking\n- Rolling IQR Spike Rejection\n- Spatial KNN Missing Value Imputation", 38, 76, '#e8eaf6', '#3f51b5'),
        ("Step 3: Standardization & Scaling\n- Z-score Standard Scaling: z=(x-μ)/σ\n- Robust Scaling across Extremes\n- Feature Matrix X ∈ R^(850 x 4)", 62, 76, '#e0f2f1', '#00897b'),
        ("Step 4: Cluster Optimization\n- k-Means++ Distance-based Seeding\n- Elbow Inertia & Silhouette Evaluation\n- Optimal Model Selection (K=4, Sil=0.615)", 86, 76, '#e8f5e9', '#43a047')
    ]

    for title, x, y, bg, border in steps_row1:
        box = patches.FancyBboxPatch((x-10.5, y-8), 21, 16, boxstyle="round,pad=0.8", 
                                    facecolor=bg, edgecolor=border, linewidth=1.8)
        ax.add_patch(box)
        ax.text(x, y, title, ha='center', va='center', fontsize=8, color='#1a2a3a')

    # Horizontal Arrows Row 1
    ax.annotate('', xy=(26, 76), xytext=(24.5, 76),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))
    ax.annotate('', xy=(50, 76), xytext=(48.5, 76),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))
    ax.annotate('', xy=(74, 76), xytext=(72.5, 76),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))

    # Downward turn from Step 4 to Step 5
    ax.annotate('', xy=(86, 52), xytext=(86, 67),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))

    # Row 2: Bottom (Right to Left)
    steps_row2 = [
        ("Step 5: Centroid Profiling\n- Inverse-transform cluster centers μ_j\n- R1: Upwelling Pelagic (High DO, Optimal SST)\n- R2: Oligotrophic, R3: Estuary, R4: Hypoxia", 86, 42, '#fffde7', '#fbc02d'),
        ("Step 6: Suitability Formulation\n- Multi-Criteria Scoring: S_i = w·Bio - w·Dist\n- Operational Tier Partitioning:\n  S1 (Prime PFZ), S2, S3, S4 (Avoidance)", 62, 42, '#fff3e0', '#fb8c00'),
        ("Step 7: Catch Matchup & ANOVA\n- Spatiotemporal join with 360 CPUE logs\n- One-Way ANOVA (F=142.6, p < 0.001)\n- Kruskal-Wallis Non-Parametric H=284.1", 38, 42, '#fbe9e7', '#e64a19'),
        ("Step 8: Operational Deployment\n- Binary PFZ Metrics: F1=0.887, AUC=0.918\n- FastAPI REST API (<25ms Re-ranking)\n- MapLibre WebGL UI & Fleet Dispatch CSV", 14, 42, '#f3e5f5', '#8e24aa')
    ]

    for title, x, y, bg, border in steps_row2:
        box = patches.FancyBboxPatch((x-10.5, y-8), 21, 16, boxstyle="round,pad=0.8", 
                                    facecolor=bg, edgecolor=border, linewidth=1.8)
        ax.add_patch(box)
        ax.text(x, y, title, ha='center', va='center', fontsize=8, color='#1a2a3a')

    # Horizontal Arrows Row 2 (Right to Left)
    ax.annotate('', xy=(74, 42), xytext=(75.5, 42),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))
    ax.annotate('', xy=(50, 42), xytext=(51.5, 42),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))
    ax.annotate('', xy=(26, 42), xytext=(27.5, 42),
                arrowprops=dict(facecolor='#546e7a', edgecolor='#546e7a', width=1.5, headwidth=6))

    # Summary box at bottom
    sum_box = patches.FancyBboxPatch((10, 10), 80, 18, boxstyle="round,pad=1.0",
                                    facecolor='#eceff1', edgecolor='#607d8b', linewidth=1.5)
    ax.add_patch(sum_box)
    ax.text(50, 22, "Key Experimental Pipeline Outputs & Validation Benchmarks", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#263238')
    ax.text(50, 15, "• K-Means (K=4, k-means++) achieved optimal Silhouette (0.615) & Davies-Bouldin (0.474), outperforming GMM (Sil 0.444) and DBSCAN.\n"
                    "• ANOVA confirmed statistically distinct CPUE yields (p < 0.001) across S1 (333.9 kg/hr) vs S2 (109.0 kg/hr) vs S4 (15.7 kg/hr).\n"
                    "• Commercial validation verified 28.5% diesel fuel savings and 88.7% F1-score for automated S1 Prime PFZ vessel dispatch.",
            ha='center', va='center', fontsize=8.5, color='#37474f')

    plt.tight_layout()
    fig.savefig('research/figure2_experimental_flowchart.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Figure 2 generated successfully.")

if __name__ == '__main__':
    create_figure_1()
    create_figure_2()
