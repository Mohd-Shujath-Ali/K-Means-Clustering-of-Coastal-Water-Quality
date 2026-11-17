import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CatchEventRow, ZoneDetailResponse } from '../api/types'
import { MapLegend } from '../components/MapLegend'
import { Skeleton } from '../components/Skeleton'
import { SuitabilityPill } from '../components/SuitabilityPill'
import { ZoneMap, type MapLayer } from '../components/ZoneMap'
import { formatCpue, formatDepth, formatDist } from '../utils/format'
import {
  X,
  Layers,
  Ship,
  ChevronRight,
  Fish,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

export default function MapExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [layer, setLayer] = useState<MapLayer>('suitability_tier')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [zoneDetail, setZoneDetail] = useState<ZoneDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [events, setEvents] = useState<CatchEventRow[]>([])
  const [showEvents, setShowEvents] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; zoom?: number } | undefined>(undefined)

  // Sync with URL query parameter
  useEffect(() => {
    const zidParam = searchParams.get('zone')
    if (zidParam !== null && !isNaN(Number(zidParam))) {
      const id = Number(zidParam)
      setSelectedId(id)
    }
  }, [searchParams])

  // Load Zone Detail on select
  useEffect(() => {
    if (selectedId === null) {
      setZoneDetail(null)
      return
    }

    async function fetchDetail() {
      setLoadingDetail(true)
      try {
        const res = await api.zone(selectedId!)
        setZoneDetail(res)
        setFlyTo({ lng: res.zone.lon, lat: res.zone.lat, zoom: 9 })
      } catch (err) {
        console.error('Failed to load zone detail', err)
      } finally {
        setLoadingDetail(false)
      }
    }
    fetchDetail()
  }, [selectedId])

  // Load catch events for overlay
  useEffect(() => {
    api.events({ validated_only: true, limit: 150 }).then((res) => {
      setEvents(res.events)
    }).catch(() => {})
  }, [])

  function handleZoneSelect(id: number) {
    setSelectedId(id)
    setSearchParams({ zone: String(id) })
  }

  function handleCloseDrawer() {
    setSelectedId(null)
    setSearchParams({})
  }

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Top Map Toolbar */}
      <div className="h-12 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Layers size={14} className="text-sky-600" />
            <span>Map Layer:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            {(
              [
                ['suitability_tier', 'Suitability Tiers'],
                ['regime', 'k-Means Regimes'],
                ['dissolved_oxygen', 'Dissolved Oxygen'],
                ['temperature', 'Sea Surface Temp'],
                ['turbidity', 'Turbidity'],
                ['cpue_mean_kg_hr', 'Catch Yield (CPUE)'],
              ] as [MapLayer, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setLayer(key)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  layer === key ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Show Validated Catch Trips</span>
          </label>
        </div>
      </div>

      {/* Main Map + Inspector Drawer Container */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 h-full relative">
          <ZoneMap
            layer={layer}
            onZoneClick={handleZoneSelect}
            selectedId={selectedId}
            events={events}
            showEvents={showEvents}
            flyTo={flyTo}
          />

          {/* Floating Legend */}
          <div className="absolute bottom-5 left-5 z-20">
            <MapLegend layer={layer} />
          </div>
        </div>

        {/* Zone Detail Slide-out Drawer */}
        {selectedId !== null && (
          <aside className="w-96 border-l border-slate-200 bg-white flex flex-col h-full shadow-2xl z-30 shrink-0 overflow-y-auto">
            {loadingDetail || !zoneDetail ? (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{zoneDetail.zone.zone_name}</h2>
                      <SuitabilityPill tier={zoneDetail.zone.suitability_tier} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Lat {zoneDetail.zone.lat.toFixed(4)}°N, Lon {zoneDetail.zone.lon.toFixed(4)}°E
                    </div>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Key Metrics Quick Ribbon */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Mean CPUE</div>
                    <div className="text-sm font-bold text-slate-900">{formatCpue(zoneDetail.zone.cpue_mean_kg_hr)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Depth</div>
                    <div className="text-sm font-bold text-slate-900">{formatDepth(zoneDetail.zone.depth_m)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">To Port</div>
                    <div className="text-sm font-bold text-slate-900">{formatDist(zoneDetail.zone.dist_port_km)}</div>
                  </div>
                </div>

                {/* Operational Action Banner */}
                <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 mb-1">
                    <Ship size={14} />
                    <span>Advisory & Dispatch Action</span>
                  </div>
                  <div className="text-xs text-sky-950 leading-relaxed">{zoneDetail.zone.action}</div>
                  <div className="mt-2 text-[11px] text-sky-700 flex items-center gap-1">
                    <Fish size={12} />
                    <span>Primary Target: <strong>{zoneDetail.zone.primary_species}</strong></span>
                  </div>
                </div>

                {/* Radar Chart: Habitat vs Optimum */}
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Oceanographic Habitat Radar</span>
                    <span className="text-[10px] text-slate-400">Score vs. Optimum</span>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={zoneDetail.radar_data}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748B' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Zone Score" dataKey="value" stroke="#0284C7" fill="#0284C7" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Percentile Breakdown */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Multivariate Parameter Breakdown</span>
                    <span className="text-[10px] text-slate-400">Percentile Rank</span>
                  </div>

                  <div className="space-y-2">
                    {zoneDetail.percentiles.map((p) => (
                      <div key={p.feature} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-700">{p.feature}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {p.raw_value} {p.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">({p.percentile}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.percentile >= 75 ? 'bg-emerald-500' : p.percentile >= 35 ? 'bg-sky-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, p.percentile)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Candidate Zones */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Nearest Hydrographic Neighbors</div>
                  <div className="space-y-1.5">
                    {zoneDetail.similar_zones.map((sim) => (
                      <button
                        key={sim.zone_id}
                        onClick={() => handleZoneSelect(sim.zone_id)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{sim.zone_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {formatCpue(sim.cpue_mean_kg_hr)} • Match: {(sim.similarity_score * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <SuitabilityPill tier={sim.suitability_tier} short />
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
