"""FastAPI application for AquaZone: Coastal Water-Quality Fishing-Zone Platform."""

from __future__ import annotations

import logging
from pathlib import Path
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.data_loader import get_store
from app.routers import (
    alerts,
    events,
    method,
    plan,
    rank,
    summary,
    validate,
    zones,
)
from app.services.ranking import verify_reproduction

logger = logging.getLogger("uvicorn.error")


def create_app() -> FastAPI:
    store = get_store()
    store.load()

    logger.info("Running reproduction test...")
    if not verify_reproduction(store):
        logger.error(
            "REPRODUCTION TEST FAILED: recomputed suitability score or tier "
            "does not match zone_features.csv."
        )
        sys.exit(1)
    logger.info("Reproduction test passed successfully.")

    application = FastAPI(
        title="AquaZone: Coastal Fishing-Zone Suitability Platform",
        description="Machine Learning & Water Quality Decision Support for Marine Fisheries",
        version="1.0.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(summary.router)
    application.include_router(zones.router)
    application.include_router(rank.router)
    application.include_router(validate.router)
    application.include_router(plan.router)
    application.include_router(alerts.router)
    application.include_router(events.router)
    application.include_router(method.router)

    @application.get("/api/health")
    def health_check() -> dict[str, str]:
        return {"status": "healthy", "service": "aquazone-backend"}

    @application.get("/api/geojson")
    def get_geojson() -> Response:
        return Response(
            content=store.geojson_bytes,
            media_type="application/json",
            headers={
                "Content-Encoding": "gzip",
                "Cache-Control": "public, max-age=3600",
            },
        )

    # Static assets and SPA fallback for React UI
    frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
    if frontend_dist.exists():
        from fastapi.responses import FileResponse, JSONResponse

        @application.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            if full_path.startswith("api"):
                return JSONResponse(status_code=404, content={"detail": "Not Found"})
            file_path = frontend_dist / full_path
            if full_path and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(frontend_dist / "index.html")

    return application


app = create_app()
