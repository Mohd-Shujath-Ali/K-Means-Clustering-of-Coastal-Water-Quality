import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AlertThresholdRow } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { SuitabilityPill } from '../components/SuitabilityPill'
import { AlertTriangle, ShieldCheck, Waves } from 'lucide-react'

export default function AdvisoryThresholds() {
  const [alerts, setAlerts] = useState<AlertThresholdRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.alerts().then((res) => {
      setAlerts(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Oceanographic Advisory Thresholds & Marine Risk Tiers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Physicochemical criteria and environmental boundary conditions dictating commercial fishing suitability tiers.
        </p>
      </div>

      {/* Threshold Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Water-Quality Boundary Conditions by Priority Tier</h2>
            <p className="text-xs text-slate-500">Multi-parameter requirements derived from marine fisheries biology</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
            Standard Sensor Protocol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Suitability Tier</th>
                <th className="py-3 px-4">Min Dissolved Oxygen</th>
                <th className="py-3 px-4">Optimal SST Window</th>
                <th className="py-3 px-4">Salinity Gradient</th>
                <th className="py-3 px-4">Target Turbidity</th>
                <th className="py-3 px-4">Primary Maritime Advisory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <tr key={a.tier} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <SuitabilityPill tier={a.tier} />
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {a.do_min_mg_l} mg/L
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {a.sst_optimal_min} - {a.sst_optimal_max} °C
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {a.salinity_min_psu} - {a.salinity_max_psu} PSU
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {a.turbidity_target_ntu} NTU
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {a.primary_advisory}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environmental Warning Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold mb-2">
            <AlertTriangle size={16} />
            <span>Hypoxia Distress Protocol (DO &lt; 3.0 mg/L)</span>
          </div>
          <p className="text-rose-900 leading-relaxed">
            Severe dissolved oxygen depletion suffocates active pelagic species (sardines, mackerels). Vessels must immediately bypass these zones to avoid wasted search fuel and barren hauls.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
            <Waves size={16} />
            <span>Heavy Silt Discharge Warning (&gt; 25 NTU)</span>
          </div>
          <p className="text-amber-900 leading-relaxed">
            Estuarine river plumes carry inorganic terrestrial suspended matter that clogs delicate fish gills and impairs visual feeding. Trawlers face severe net entanglement and bottom snagging risks.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
            <ShieldCheck size={16} />
            <span>Optimal Front Aggregation (25.5 - 27.5 °C)</span>
          </div>
          <p className="text-emerald-900 leading-relaxed">
            Horizontal sea surface temperature gradients marking coastal upwelling fronts trap nutrient-rich phytoplankton blooms, concentrating schooling teleosts for maximum purse-seine catch rates.
          </p>
        </div>
      </div>
    </div>
  )
}
