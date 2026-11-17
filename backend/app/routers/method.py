"""Methodology metadata and model selection router."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import ArchetypeProfileRow, MethodResponse, ModelSelectionRow

router = APIRouter(prefix="/api", tags=["method"])


@router.get("/method", response_model=MethodResponse)
def get_methodology() -> MethodResponse:
    store = get_store()
    
    parameters = [
        {"name": "Dissolved Oxygen (DO)", "unit": "mg/L", "ideal_range": "5.5 - 8.5 mg/L", "role": "Aerobic respiration index. Fish actively avoid hypoxic pockets < 3.5 mg/L."},
        {"name": "Sea Surface Temperature (SST)", "unit": "°C", "ideal_range": "25.0 - 28.0 °C", "role": "Metabolic and thermal front marker. Front boundaries trap nutrients and schools."},
        {"name": "Practical Salinity", "unit": "PSU", "ideal_range": "33.5 - 35.5 PSU", "role": "Osmoregulatory stability. Heavy river discharge plumes (< 25 PSU) repel stenohaline fish."},
        {"name": "Turbidity", "unit": "NTU", "ideal_range": "4.0 - 14.0 NTU", "role": "Optical clarity proxy. Moderate turbidity indicates phytoplankton foraging; > 30 NTU indicates gill-clogging silt."},
        {"name": "Chlorophyll-a", "unit": "mg/m³", "ideal_range": "2.5 - 6.5 mg/m³", "role": "Primary phytoplankton biomass proxy indicating bottom-up trophic abundance."},
        {"name": "Bathymetric Depth", "unit": "m", "ideal_range": "25.0 - 90.0 m", "role": "Continental shelf pelagic and demersal habitat depth boundary."},
    ]

    model_sel_rows = [ModelSelectionRow(**r) for r in store.model_selection.to_dict(orient="records")]
    archetype_rows = [ArchetypeProfileRow(**r) for r in store.archetypes.to_dict(orient="records")]

    return MethodResponse(
        parameters=parameters,
        model_selection=model_sel_rows,
        archetypes=archetype_rows,
        optimal_k=4,
        evaluation_summary="k-Means with k=4 yields highest cluster stability (0.949) and balanced ecological archetypes without fragmentation.",
    )
