import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CatchEventRow, ZoneDetailResponse, ZoneRow } from '../api/types'
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
  Scale,
  Download,
  Trash2,
  Compass,
  Check,
  Award,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const MAX_COMPARE = 4
const COMPARE_COLORS = ['#0284C7', '#0D9488', '#D97706', '#7C3AED']

export default function MapExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [layer, setLayer] = useState<MapLayer>('suitability_tier')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [zoneDetail, setZoneDetail] = useState<ZoneDetailResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [events, setEvents] = useState<CatchEventRow[]>([])
  const [showEvents, setShowEvents] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; zoom?: number } | undefined>(undefined)

  // Spot comparison state
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [compareDetails, setCompareDetails] = useState<Record<number, ZoneDetailResponse>>({})
  const [compareOpen, setCompareOpen] = useState(false)

  // Sync with URL query parameter
  useEffect(() => {
    const zidParam = searchParams.get('zone')
    if (zidParam !== null && !isNaN(Number(zidParam))) {
      const id = Number(zidParam)
      setSelectedId(id)
    }

    const compParam = searchParams.get('compare')
    if (compParam) {
      const ids = compParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
        .slice(0, MAX_COMPARE)
      if (ids.length > 0) {
        setCompareIds(ids)
      }
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
        setCompareDetails((prev) => ({ ...prev, [selectedId!]: res }))
        setFlyTo({ lng: res.zone.lon, lat: res.zone.lat, zoom: 9 })
      } catch (err) {
        console.error('Failed to load zone detail', err)
      } finally {
        setLoadingDetail(false)
      }
    }
    fetchDetail()
  }, [selectedId])

  // Fetch missing details for any zones in compareIds
  useEffect(() => {
    compareIds.forEach(async (id) => {
      if (!compareDetails[id]) {
        try {
          const res = await api.zone(id)
          setCompareDetails((prev) => ({ ...prev, [id]: res }))
        } catch (err) {
          console.error(`Failed to load comparison zone #${id}`, err)
        }
      }
    })
  }, [compareIds, compareDetails])

  // Load catch events for overlay
  useEffect(() => {
    api.events({ validated_only: true, limit: 150 })
      .then((res) => {
        setEvents(res.events)
      })
      .catch(() => {})
  }, [])

  function handleZoneSelect(id: number) {
    setSelectedId(id)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('zone', String(id))
      return next
    })
  }

  function handleCloseDrawer() {
    setSelectedId(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('zone')
      return next
    })
  }

  function addToCompare(id: number) {
    if (compareIds.includes(id) || compareIds.length >= MAX_COMPARE) return
    const nextIds = [...compareIds, id]
    setCompareIds(nextIds)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('compare', nextIds.join(','))
      return next
    })
  }

  function removeFromCompare(id: number) {
    const nextIds = compareIds.filter((i) => i !== id)
    setCompareIds(nextIds)
    if (nextIds.length === 0) setCompareOpen(false)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextIds.length > 0) next.set('compare', nextIds.join(','))
      else next.delete('compare')
      return next
    })
  }

  function clearCompare() {
    setCompareIds([])
    setCompareOpen(false)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('compare')
      return next
    })
  }

  function handleFlyToZone(zone: ZoneRow) {
    setFlyTo({ lng: zone.lon, lat: zone.lat, zoom: 10 })
    setSelectedId(zone.zone_id)
    setCompareOpen(false)
  }

  function exportCompareCSV() {
    const activeZones = compareIds.map((id) => compareDetails[id]?.zone).filter(Boolean) as ZoneRow[]
    if (activeZones.length === 0) return

    const rows = [
      ['Attribute', ...activeZones.map((z) => z.zone_name)],
      ['Zone ID', ...activeZones.map((z) => String(z.zone_id))],
      ['Suitability Tier', ...activeZones.map((z) => z.suitability_tier)],
      ['Regime Archetype', ...activeZones.map((z) => z.regime)],
      ['Suitability Score', ...activeZones.map((z) => z.suitability_score.toFixed(4))],
      ['Model Confidence', ...activeZones.map((z) => `${(z.conf * 100).toFixed(0)}%`)],
      ['Expected CPUE (kg/hr)', ...activeZones.map((z) => String(z.cpue_mean_kg_hr))],
      ['Dissolved Oxygen (mg/L)', ...activeZones.map((z) => String(z.dissolved_oxygen))],
      ['Sea Surface Temp (°C)', ...activeZones.map((z) => String(z.temperature))],
      ['Salinity (PSU)', ...activeZones.map((z) => String(z.salinity))],
      ['Turbidity (NTU)', ...activeZones.map((z) => String(z.turbidity))],
      ['Chlorophyll-a (mg/m³)', ...activeZones.map((z) => String(z.chlorophyll_a))],
      ['Bathymetry Depth (m)', ...activeZones.map((z) => String(z.depth_m))],
      ['Distance to Port (km)', ...activeZones.map((z) => String(z.dist_port_km))],
      ['Primary Species', ...activeZones.map((z) => `"${z.primary_species}"`)],
      ['Recommended Gear', ...activeZones.map((z) => `"${z.recommended_gear}"`)],
      ['Operational Action', ...activeZones.map((z) => `"${z.action}"`)],
    ]

    const csvContent = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aquazone_spot_comparison_${activeZones.map((z) => z.zone_name).join('_vs_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Multi-zone comparative radar dataset
  const comparativeRadarData = useMemo(() => {
    const activeZones = compareIds.map((id) => compareDetails[id]?.zone).filter(Boolean) as ZoneRow[]
    if (activeZones.length === 0) return []

    const subjects = [
      { key: 'do', label: 'Dissolved Oxygen' },
      { key: 'sst', label: 'Optimal SST' },
      { key: 'sal', label: 'Salinity Stability' },
      { key: 'turb', label: 'Optical Clarity' },
      { key: 'chla', label: 'Phytoplankton' },
      { key: 'port', label: 'Port Proximity' },
    ]

    return subjects.map(({ key, label }) => {
      const entry: Record<string, any> = { subject: label }
      activeZones.forEach((z) => {
        let val = 50
        if (key === 'do') val = Math.min(100, Math.round((z.dissolved_oxygen / 8.0) * 100))
        else if (key === 'sst') val = Math.max(0, Math.round((1 - Math.abs(z.temperature - 26.5) / 6.0) * 100))
        else if (key === 'sal') val = Math.max(0, Math.round((1 - Math.abs(z.salinity - 34.5) / 10.0) * 100))
        else if (key === 'turb') val = Math.max(0, Math.round((1 - Math.abs(z.turbidity - 6.0) / 40.0) * 100))
        else if (key === 'chla') val = Math.min(100, Math.round((z.chlorophyll_a / 6.0) * 100))
        else if (key === 'port') val = Math.max(0, Math.round((1 - z.dist_port_km / 80.0) * 100))
        entry[z.zone_name] = val
      })
      return entry
    })
  }, [compareIds, compareDetails])

  // Compute best spot highlights
  const comparisonWinners = useMemo(() => {
    const activeZones = compareIds.map((id) => compareDetails[id]?.zone).filter(Boolean) as ZoneRow[]
    if (activeZones.length < 2) return null

    const bestScore = [...activeZones].sort((a, b) => b.suitability_score - a.suitability_score)[0]
    const bestCpue = [...activeZones].sort((a, b) => b.cpue_mean_kg_hr - a.cpue_mean_kg_hr)[0]
    const bestDo = [...activeZones].sort((a, b) => b.dissolved_oxygen - a.dissolved_oxygen)[0]
    const closestPort = [...activeZones].sort((a, b) => a.dist_port_km - b.dist_port_km)[0]

    return { bestScore, bestCpue, bestDo, closestPort }
  }, [compareIds, compareDetails])

  return (
    <div className="h-full flex flex-col -m-6 relative">
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

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Show Validated Catch Trips</span>
          </label>

          {/* Compare Spots Button */}
          <button
            onClick={() => {
              if (compareIds.length === 0 && selectedId !== null) {
                addToCompare(selectedId)
              }
              setCompareOpen(true)
            }}
            disabled={compareIds.length === 0 && selectedId === null}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              compareIds.length > 0
                ? 'bg-sky-600 text-white shadow-xs hover:bg-sky-700'
                : 'bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale size={14} />
            <span>Compare Spots</span>
            {compareIds.length > 0 && (
              <span className="bg-sky-800 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {compareIds.length}
              </span>
            )}
          </button>
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
            compareIds={compareIds}
            events={events}
            showEvents={showEvents}
            flyTo={flyTo}
          />

          {/* Floating Compare Dock on Map */}
          {compareIds.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-sky-800">
                <Scale size={14} className="text-sky-600" />
                <span>Comparing:</span>
              </div>

              <div className="flex items-center gap-1.5">
                {compareIds.map((id) => {
                  const z = compareDetails[id]?.zone
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs px-2 py-0.5 rounded-md font-medium"
                    >
                      {z?.zone_name || `Zone #${id}`}
                      <button
                        onClick={() => removeFromCompare(id)}
                        className="text-sky-500 hover:text-sky-900 cursor-pointer"
                        title="Remove spot"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
              </div>

              <button
                onClick={() => setCompareOpen(true)}
                className="btn-primary text-xs py-1 px-2.5 rounded-md ml-1"
              >
                Compare ({compareIds.length})
              </button>

              <button
                onClick={clearCompare}
                className="text-xs text-slate-400 hover:text-rose-600 px-1 cursor-pointer"
                title="Clear all comparison spots"
              >
                Clear
              </button>
            </div>
          )}

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

                {/* Compare Spot Button */}
                <button
                  onClick={() => {
                    if (compareIds.includes(zoneDetail.zone.zone_id)) {
                      removeFromCompare(zoneDetail.zone.zone_id)
                    } else {
                      addToCompare(zoneDetail.zone.zone_id)
                    }
                  }}
                  disabled={!compareIds.includes(zoneDetail.zone.zone_id) && compareIds.length >= MAX_COMPARE}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    compareIds.includes(zoneDetail.zone.zone_id)
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
                  }`}
                >
                  <Scale size={14} />
                  <span>
                    {compareIds.includes(zoneDetail.zone.zone_id)
                      ? 'In Comparison (Click to Remove)'
                      : `Add to Spot Comparison (${compareIds.length}/${MAX_COMPARE})`}
                  </span>
                </button>

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
                      <div
                        key={sim.zone_id}
                        className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between text-xs transition-colors"
                      >
                        <button
                          onClick={() => handleZoneSelect(sim.zone_id)}
                          className="text-left flex-1 cursor-pointer"
                        >
                          <div className="font-semibold text-slate-800">{sim.zone_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {formatCpue(sim.cpue_mean_kg_hr)} • Match: {(sim.similarity_score * 100).toFixed(0)}%
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <SuitabilityPill tier={sim.suitability_tier} short />
                          <button
                            onClick={() => addToCompare(sim.zone_id)}
                            disabled={compareIds.includes(sim.zone_id) || compareIds.length >= MAX_COMPARE}
                            className={`text-[11px] px-1.5 py-0.5 rounded font-medium cursor-pointer ${
                              compareIds.includes(sim.zone_id)
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                            }`}
                            title="Add to comparison"
                          >
                            {compareIds.includes(sim.zone_id) ? <Check size={12} /> : '+ Compare'}
                          </button>
                          <ChevronRight size={14} className="text-slate-400 cursor-pointer" onClick={() => handleZoneSelect(sim.zone_id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Spot Comparison Modal */}
      {compareOpen && compareIds.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Candidate Fishing-Zone Spot Comparison
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {compareIds.length} Spots Selected
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Head-to-head evaluation of oceanographic parameters, suitability tiers, and predicted harvest yield
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportCompareCSV}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Export comparison matrix as CSV"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={clearCompare}
                  className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1.5 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
                <button
                  onClick={() => setCompareOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Competitive Highlights Banner */}
              {comparisonWinners && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 p-4 rounded-xl border border-sky-100">
                  <div className="flex items-center gap-2.5">
                    <Award size={18} className="text-sky-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Highest Suitability</div>
                      <div className="text-xs font-bold text-slate-900">{comparisonWinners.bestScore.zone_name} ({comparisonWinners.bestScore.suitability_score.toFixed(3)})</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Fish size={18} className="text-teal-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Top Biomass (CPUE)</div>
                      <div className="text-xs font-bold text-slate-900">{comparisonWinners.bestCpue.zone_name} ({comparisonWinners.bestCpue.cpue_mean_kg_hr} kg/hr)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Ship size={18} className="text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Closest Harbor Access</div>
                      <div className="text-xs font-bold text-slate-900">{comparisonWinners.closestPort.zone_name} ({comparisonWinners.closestPort.dist_port_km} km)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Compass size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Optimal Dissolved O₂</div>
                      <div className="text-xs font-bold text-slate-900">{comparisonWinners.bestDo.zone_name} ({comparisonWinners.bestDo.dissolved_oxygen} mg/L)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Spot Cards */}
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${compareIds.length}, minmax(0, 1fr))` }}
              >
                {compareIds.map((id, idx) => {
                  const d = compareDetails[id]
                  const z = d?.zone
                  const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]

                  if (!z) {
                    return (
                      <div key={id} className="p-4 border border-slate-200 rounded-xl space-y-3">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-44 w-full" />
                      </div>
                    )
                  }

                  return (
                    <div
                      key={id}
                      className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-xs hover:border-slate-300 transition-all relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: color }}
                      />

                      <div className="space-y-4 pt-1">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{z.zone_name}</h3>
                              <SuitabilityPill tier={z.suitability_tier} short />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Lat {z.lat.toFixed(3)}°N, Lon {z.lon.toFixed(3)}°E
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCompare(id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove from comparison"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Fly to Map Button */}
                        <button
                          onClick={() => handleFlyToZone(z)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Compass size={14} className="text-sky-600" />
                          <span>Focus Spot on Map</span>
                        </button>

                        {/* Key Scores */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Suitability Score</div>
                            <div className="text-sm font-bold text-slate-900">{z.suitability_score.toFixed(3)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Mean Catch Yield</div>
                            <div className="text-sm font-bold text-emerald-600">{formatCpue(z.cpue_mean_kg_hr)}</div>
                          </div>
                        </div>

                        {/* Parameter Rows */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Dissolved Oxygen</span>
                            <span className={`font-semibold ${z.dissolved_oxygen >= 6.0 ? 'text-emerald-600' : z.dissolved_oxygen <= 3.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {z.dissolved_oxygen} mg/L
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Sea Surface Temp</span>
                            <span className="font-semibold text-slate-800">{z.temperature} °C</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Practical Salinity</span>
                            <span className="font-semibold text-slate-800">{z.salinity} PSU</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Optical Turbidity</span>
                            <span className={`font-semibold ${z.turbidity > 30 ? 'text-amber-600' : 'text-slate-800'}`}>
                              {z.turbidity} NTU
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Chlorophyll-a</span>
                            <span className="font-semibold text-slate-800">{z.chlorophyll_a} mg/m³</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Bathymetry Depth</span>
                            <span className="font-semibold text-slate-800">{formatDepth(z.depth_m)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Distance to Port</span>
                            <span className="font-semibold text-slate-800">{formatDist(z.dist_port_km)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Target Species</span>
                            <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate" title={z.primary_species}>
                              {z.primary_species}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Recommended Gear</span>
                            <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate" title={z.recommended_gear}>
                              {z.recommended_gear}
                            </span>
                          </div>
                        </div>

                        {/* Operational Action */}
                        <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-100 text-[11px] text-sky-950">
                          <span className="font-semibold text-sky-800 block mb-0.5">Advisory:</span>
                          {z.action}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Comparative Multi-Radar Chart */}
              {comparativeRadarData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Multivariate Oceanographic Profile Overlay
                      </h4>
                      <p className="text-xs text-slate-500">
                        Normalized comparison of physical parameters and operational accessibility
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {compareIds.map((id, idx) => {
                        const z = compareDetails[id]?.zone
                        if (!z) return null
                        return (
                          <div key={id} className="flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COMPARE_COLORS[idx % COMPARE_COLORS.length] }}
                            />
                            <span className="text-slate-700">{z.zone_name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparativeRadarData}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        {compareIds.map((id, idx) => {
                          const z = compareDetails[id]?.zone
                          if (!z) return null
                          const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]
                          return (
                            <Radar
                              key={id}
                              name={z.zone_name}
                              dataKey={z.zone_name}
                              stroke={color}
                              fill={color}
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          )
                        })}
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
