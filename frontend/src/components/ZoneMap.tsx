import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { preloadGeoJson, type GeoJsonFeatureCollection } from '../api/geojson'
import { REGIME_COLORS, TIER_COLORS } from '../utils/format'
import type { CatchEventRow } from '../api/types'

// Set worker url from public
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs')

export type MapLayer =
  | 'suitability_tier'
  | 'regime'
  | 'dissolved_oxygen'
  | 'temperature'
  | 'turbidity'
  | 'cpue_mean_kg_hr'

interface Props {
  layer: MapLayer
  onZoneClick?: (id: number) => void
  selectedId?: number | null
  compareIds?: number[]
  matchingIds?: Set<number> | null
  events?: CatchEventRow[]
  showEvents?: boolean
  flyTo?: { lng: number; lat: number; zoom?: number }
  className?: string
}

function buildTierColor(): maplibregl.ExpressionSpecification {
  return [
    'match',
    ['get', 'suitability_tier'],
    'S1 Prime PFZ',
    TIER_COLORS['S1 Prime PFZ'],
    'S2 Favorable',
    TIER_COLORS['S2 Favorable'],
    'S3 Marginal',
    TIER_COLORS['S3 Marginal'],
    'S4 Unfavorable',
    TIER_COLORS['S4 Unfavorable'],
    '#64748B',
  ] as maplibregl.ExpressionSpecification
}

function buildRegimeColor(): maplibregl.ExpressionSpecification {
  return [
    'match',
    ['get', 'h_rank'],
    0,
    REGIME_COLORS.R1,
    1,
    REGIME_COLORS.R2,
    2,
    REGIME_COLORS.R3,
    3,
    REGIME_COLORS.R4,
    '#64748B',
  ] as maplibregl.ExpressionSpecification
}

export function ZoneMap({
  layer,
  onZoneClick,
  selectedId,
  compareIds,
  flyTo,
  className = 'h-full w-full',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    setLoading(true)

    // Base map style (Carto Light or OSM style)
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [74.5, 12.0], // Arabian Sea / Malabar Coast
      zoom: 6.5,
    })

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      try {
        const geojson: GeoJsonFeatureCollection = await preloadGeoJson()
        if (cancelled) return

        map.addSource('zones-source', {
          type: 'geojson',
          data: geojson as any,
          promoteId: 'id',
        })

        // Fill layer
        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones-source',
          paint: {
            'fill-color': buildTierColor(),
            'fill-opacity': 0.72,
          },
        })

        // Border layer
        map.addLayer({
          id: 'zones-line',
          type: 'line',
          source: 'zones-source',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#0284C7',
              ['boolean', ['feature-state', 'compared'], false],
              '#D97706',
              '#0F172A',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3.0,
              ['boolean', ['feature-state', 'compared'], false],
              2.5,
              0.6,
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              1.0,
              ['boolean', ['feature-state', 'compared'], false],
              0.95,
              0.35,
            ],
          },
        })

        // Hover tooltip
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
        popupRef.current = popup

        map.on('mousemove', 'zones-fill', (e) => {
          if (!e.features || e.features.length === 0) return
          map.getCanvas().style.cursor = 'pointer'
          const props = e.features[0].properties as any
          const content = `
            <div style="font-size:12px; font-family:sans-serif; line-height:1.4;">
              <strong style="color:#0284C7;">${props.zone_name}</strong> (${props.suitability_tier})<br/>
              <strong>DO:</strong> ${props.dissolved_oxygen} mg/L | <strong>SST:</strong> ${props.temperature} °C<br/>
              <strong>Salinity:</strong> ${props.salinity} PSU | <strong>Turb:</strong> ${props.turbidity} NTU<br/>
              <strong>Mean CPUE:</strong> ${props.cpue_mean_kg_hr} kg/hr<br/>
              <span style="font-size:11px; color:#64748B;">Target: ${props.primary_species}</span>
            </div>
          `
          popup.setLngLat(e.lngLat).setHTML(content).addTo(map)
        })

        map.on('mouseleave', 'zones-fill', () => {
          map.getCanvas().style.cursor = ''
          popup.remove()
        })

        map.on('click', 'zones-fill', (e) => {
          if (!e.features || e.features.length === 0) return
          const id = Number(e.features[0].properties?.zone_id)
          if (!isNaN(id) && onZoneClick) {
            onZoneClick(id)
          }
        })

        setLoading(false)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to initialize coastal zones map.')
          setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update layer coloring
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !map.getLayer('zones-fill')) return

    let colorExpr: any
    if (layer === 'suitability_tier') {
      colorExpr = buildTierColor()
    } else if (layer === 'regime') {
      colorExpr = buildRegimeColor()
    } else if (layer === 'dissolved_oxygen') {
      colorExpr = [
        'interpolate',
        ['linear'],
        ['get', 'dissolved_oxygen'],
        2.0,
        '#DC2626',
        4.0,
        '#D97706',
        6.0,
        '#0284C7',
        8.5,
        '#16A34A',
      ]
    } else if (layer === 'temperature') {
      colorExpr = [
        'interpolate',
        ['linear'],
        ['get', 'temperature'],
        24.0,
        '#0284C7',
        26.5,
        '#16A34A',
        29.5,
        '#D97706',
        32.5,
        '#DC2626',
      ]
    } else if (layer === 'turbidity') {
      colorExpr = [
        'interpolate',
        ['linear'],
        ['get', 'turbidity'],
        2.0,
        '#0284C7',
        8.0,
        '#16A34A',
        25.0,
        '#D97706',
        50.0,
        '#78350F',
      ]
    } else {
      // cpue_mean_kg_hr
      colorExpr = [
        'interpolate',
        ['linear'],
        ['get', 'cpue_mean_kg_hr'],
        20.0,
        '#64748B',
        90.0,
        '#D97706',
        200.0,
        '#0284C7',
        350.0,
        '#16A34A',
      ]
    }

    map.setPaintProperty('zones-fill', 'fill-color', colorExpr)
  }, [layer])

  // Update selection highlight
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !map.getSource('zones-source')) return

    if (selectedId !== undefined && selectedId !== null) {
      map.setFeatureState({ source: 'zones-source', id: selectedId }, { selected: true })
    }
  }, [selectedId])

  // Update comparison highlights
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !map.getSource('zones-source')) return

    if (compareIds && compareIds.length > 0) {
      compareIds.forEach((id) => {
        map.setFeatureState({ source: 'zones-source', id }, { compared: true })
      })
    }
  }, [compareIds])

  // FlyTo effect
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 8.5,
      essential: true,
    })
  }, [flyTo])

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden" />
      {loading && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm text-slate-700">
            <RefreshCw className="animate-spin text-sky-600" size={16} />
            <span>Rendering Coastal Marine Zones...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-4">
          <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
