import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ActionPlanResponse } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { SuitabilityPill } from '../components/SuitabilityPill'
import { formatDepth, formatDist } from '../utils/format'
import { Download, Fuel, ArrowUpRight, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VoyagePlanner() {
  const [plan, setPlan] = useState<ActionPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.plan()
        setPlan(res)
      } catch (err) {
        console.error('Failed to load action plan', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleDownloadCSV() {
    window.location.href = '/api/plan/export'
  }

  if (loading || !plan) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Commercial Fleet Dispatch & Voyage Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational triage for fishing harbor authorities and vessel captains to maximize fuel efficiency and biomass yield.
          </p>
        </div>

        <button onClick={handleDownloadCSV} className="btn-primary text-xs">
          <Download size={14} />
          <span>Export Top 50 Dispatch CSV</span>
        </button>
      </div>

      {/* Fleet Resource Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plan.summary.map((s) => (
          <div key={s.tier} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <SuitabilityPill tier={s.tier} short />
                <span className="text-xs font-semibold text-slate-500">{s.n_zones} zones</span>
              </div>
              <div className="text-xl font-bold text-slate-900">
                {s.recommended_vessels} <span className="text-xs font-normal text-slate-500">vessels</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Target Harvest: <strong>{s.expected_yield_tons} tons</strong>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Fuel size={12} />
                <span>Fuel Optimization:</span>
              </span>
              <span className={`font-bold ${s.fuel_saving_pct > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                {s.fuel_saving_pct > 0 ? `+${s.fuel_saving_pct}%` : `${s.fuel_saving_pct}%`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Dispatch Zones Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Priority Candidate Zones (Immediate Dispatch)</h2>
            <p className="text-xs text-slate-500">Ranked by composite oceanographic suitability score and harbor proximity</p>
          </div>
          <span className="text-xs text-slate-400">Displaying top 20 verified grounds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Zone ID</th>
                <th className="py-2.5 px-4">Suitability Tier</th>
                <th className="py-2.5 px-4 text-right">Distance to Port</th>
                <th className="py-2.5 px-4 text-right">Bathymetry</th>
                <th className="py-2.5 px-4 text-right">Dissolved Oxygen</th>
                <th className="py-2.5 px-4 text-right">SST</th>
                <th className="py-2.5 px-4">Target Species</th>
                <th className="py-2.5 px-4">Recommended Gear</th>
                <th className="py-2.5 px-4">Operational Action</th>
                <th className="py-2.5 px-3 text-center">Inspect</th>
                <th className="py-2.5 px-3 text-center">Compare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.top_dispatch_zones.map((z, idx) => (
                <tr key={z.zone_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-700">{z.zone_name}</td>
                  <td className="py-2.5 px-4">
                    <SuitabilityPill tier={z.suitability_tier} short />
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                    {formatDist(z.dist_port_km)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{formatDepth(z.depth_m)}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">
                    {z.dissolved_oxygen} mg/L
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700">{z.temperature} °C</td>
                  <td className="py-2.5 px-4 text-slate-800 font-medium">{z.primary_species}</td>
                  <td className="py-2.5 px-4 text-slate-600">{z.recommended_gear}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{z.action}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Link
                      to={`/explorer?zone=${z.zone_id}`}
                      className="inline-flex items-center text-sky-600 hover:text-sky-800 font-semibold p-1 hover:bg-sky-50 rounded"
                      title="Inspect zone on map"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Link
                      to={`/explorer?zone=${z.zone_id}&compare=${z.zone_id}`}
                      className="inline-flex items-center text-amber-600 hover:text-amber-800 font-semibold p-1 hover:bg-amber-50 rounded"
                      title="Add to spot comparison"
                    >
                      <Scale size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
