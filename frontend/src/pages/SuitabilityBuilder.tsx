import { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import type { DynamicRankingRequest, DynamicRankingResponse } from '../api/types'
import { SuitabilityPill } from '../components/SuitabilityPill'
import { formatCpue } from '../utils/format'
import { Sliders, RotateCcw, Zap, Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

const DEFAULT_WEIGHTS: DynamicRankingRequest = {
  weight_do: 0.35,
  weight_temp: 0.25,
  weight_sal: 0.15,
  weight_turb: 0.10,
  weight_chla: 0.15,
  weight_port: 0.65,
  weight_depth: 0.35,
  habitat_operational_balance: 0.75,
  s1_pct: 0.15,
  s2_pct: 0.30,
}

export default function SuitabilityBuilder() {
  const [weights, setWeights] = useState<DynamicRankingRequest>(DEFAULT_WEIGHTS)
  const [result, setResult] = useState<DynamicRankingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.rank(weights)
        setResult(res)
      } catch (err) {
        console.error('Failed to compute dynamic ranking', err)
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [weights])

  function updateWeight(key: keyof DynamicRankingRequest, val: number) {
    setWeights((prev) => ({ ...prev, [key]: val }))
  }

  function applyPreset(name: string) {
    if (name === 'balanced') {
      setWeights(DEFAULT_WEIGHTS)
    } else if (name === 'purity') {
      setWeights({
        ...DEFAULT_WEIGHTS,
        weight_do: 0.55,
        weight_temp: 0.30,
        weight_turb: 0.15,
        weight_chla: 0.25,
        weight_port: 0.20,
        habitat_operational_balance: 0.90,
      })
    } else if (name === 'fuel') {
      setWeights({
        ...DEFAULT_WEIGHTS,
        weight_port: 1.0,
        weight_depth: 0.50,
        habitat_operational_balance: 0.50,
      })
    } else if (name === 'pelagic') {
      setWeights({
        ...DEFAULT_WEIGHTS,
        weight_do: 0.60,
        weight_chla: 0.35,
        weight_turb: 0.10,
        weight_temp: 0.30,
        habitat_operational_balance: 0.85,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dynamic Multi-Criteria Suitability Builder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Interactively modulate oceanographic parameter weights and port distance constraints to re-triage fishing zones in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="btn-secondary text-xs">
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 flex items-center gap-1">
          <Sparkles size={13} className="text-amber-500" />
          <span>Operational Presets:</span>
        </span>
        <button
          onClick={() => applyPreset('balanced')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Balanced Standard
        </button>
        <button
          onClick={() => applyPreset('pelagic')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Pelagic School Aggregation (High DO + Chl-a)
        </button>
        <button
          onClick={() => applyPreset('fuel')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Near-Port Fuel Economy (Max Port Weight)
        </button>
        <button
          onClick={() => applyPreset('purity')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Strict Oceanographic Purity (90% Habitat)
        </button>
      </div>

      {/* Main Grid: Control Sliders (Left) + Live Re-ranked Zones Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
              <Sliders size={16} className="text-sky-600" />
              <span>Weight Configurations</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                <Loader2 size={11} className="animate-spin" />
                <span>Re-ranking...</span>
              </div>
            ) : result && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                <Zap size={11} />
                <span>{result.elapsed_ms} ms</span>
              </div>
            )}
          </div>

          {/* Habitat vs Operational Balance */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-sky-900">
              <span>Habitat vs. Operational Balance (α)</span>
              <span>{(weights.habitat_operational_balance * 100).toFixed(0)}% Habitat</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={weights.habitat_operational_balance}
              onChange={(e) => updateWeight('habitat_operational_balance', parseFloat(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-sky-700">
              <span>Port Logistics First</span>
              <span>Pure Water Quality First</span>
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="space-y-3.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Oceanographic Parameters (Q)
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Dissolved Oxygen Weight</span>
                <span className="font-bold">{weights.weight_do.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_do}
                onChange={(e) => updateWeight('weight_do', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Sea Surface Temperature Weight</span>
                <span className="font-bold">{weights.weight_temp.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_temp}
                onChange={(e) => updateWeight('weight_temp', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Salinity Stability Weight</span>
                <span className="font-bold">{weights.weight_sal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_sal}
                onChange={(e) => updateWeight('weight_sal', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Chlorophyll-a Biomass Weight</span>
                <span className="font-bold">{weights.weight_chla.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_chla}
                onChange={(e) => updateWeight('weight_chla', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Turbidity Optimum Weight</span>
                <span className="font-bold">{weights.weight_turb.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_turb}
                onChange={(e) => updateWeight('weight_turb', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Operational Access (F)
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Distance to Nearest Port Weight</span>
                <span className="font-bold">{weights.weight_port.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_port}
                onChange={(e) => updateWeight('weight_port', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Shelf Depth Accessibility Weight</span>
                <span className="font-bold">{weights.weight_depth.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.weight_depth}
                onChange={(e) => updateWeight('weight_depth', parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Re-ranked Zones Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Top 50 Dynamic Candidate Zones</h2>
              <p className="text-xs text-slate-500">Live priority recalculation based on modified objective weights</p>
            </div>
            {result && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  S1: {result.tier_counts['S1 Prime PFZ'] || 0}
                </span>
                <span className="text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">
                  S2: {result.tier_counts['S2 Favorable'] || 0}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[620px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Rank Change</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3 text-right">Hab / Op</th>
                  <th className="py-2.5 px-3 text-right">Mean CPUE</th>
                  <th className="py-2.5 px-3">Primary Species</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!result ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Calculating dynamic priority ranking...
                    </td>
                  </tr>
                ) : (
                  result.zones.map((z, idx) => (
                    <tr key={z.zone_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-semibold">
                          <span className="text-slate-400 w-4 text-right">#{idx + 1}</span>
                          {z.rank_change > 0 ? (
                            <span className="inline-flex items-center text-emerald-600 text-[10px]">
                              <TrendingUp size={11} className="mr-0.5" />+{z.rank_change}
                            </span>
                          ) : z.rank_change < 0 ? (
                            <span className="inline-flex items-center text-rose-500 text-[10px]">
                              <TrendingDown size={11} className="mr-0.5" />
                              {z.rank_change}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-slate-400 text-[10px]">
                              <Minus size={11} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-sky-700">{z.zone_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {z.suitability_score.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3">
                        <SuitabilityPill tier={z.suitability_tier} short />
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {z.habitat_index.toFixed(2)} / {z.operational_index.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {formatCpue(z.cpue_mean_kg_hr)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">{z.primary_species}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
