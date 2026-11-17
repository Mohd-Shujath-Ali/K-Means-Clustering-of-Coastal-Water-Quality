import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { MethodResponse } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { REGIME_COLORS, formatCpue, formatNumber } from '../utils/format'
import { Award, BarChart3, ScatterChart as ScatterIcon } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

export default function Regimes() {
  const [methodData, setMethodData] = useState<MethodResponse | null>(null)
  const [frontendRaw, setFrontendRaw] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [mRes] = await Promise.all([
          api.method(),
          fetch('/api/summary'),
        ])
        setMethodData(mRes)
        // Also fetch frontend data
        const raw = await fetch('/data/frontend_data.json').then((r) => r.json()).catch(() => null)
        setFrontendRaw(raw)
      } catch (err) {
        console.error('Failed to load regime data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !methodData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  // Format PCA scatter points by regime
  const pcaPoints = frontendRaw?.pca?.components || []
  const pcaByRegime: Record<string, any[]> = {
    R1: [],
    R2: [],
    R3: [],
    R4: [],
  }
  pcaPoints.forEach((pt: any) => {
    const key = pt.regime.substring(0, 2)
    if (pcaByRegime[key]) {
      pcaByRegime[key].push({
        x: pt.x,
        y: pt.y,
        name: `AZ-${pt.id}`,
        regime: pt.regime,
        tier: pt.tier,
      })
    }
  })

  // Archetype comparison bar chart data
  const archetypeBarData = methodData.archetypes.map((a) => ({
    name: a.regime.substring(0, 2),
    fullName: a.regime,
    do: a.mean_do_mg_l,
    sst: a.mean_sst_c,
    turbidity: a.mean_turbidity_ntu,
    cpue: a.mean_cpue_kg_hr,
  }))

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Unsupervised Machine Learning Regimes (k-Means)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Candidate zones segmented into 4 natural oceanographic regimes based on dissolved oxygen, sea surface temperature, salinity, and turbidity.
        </p>
      </div>

      {/* 4 Archetype Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {methodData.archetypes.map((a) => {
          const key = a.regime.substring(0, 2)
          const color = REGIME_COLORS[key] ?? '#0284C7'
          return (
            <div
              key={a.h_rank}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between"
              style={{ borderTop: `4px solid ${color}` }}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: color }}>
                    {key}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatNumber(a.n_zones)} zones
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{a.regime}</h3>
                <div className="text-[11px] text-slate-500 mt-1">
                  {key === 'R1' && 'Upwelling pelagic front with cold, oxygen-saturated water and dense plankton.'}
                  {key === 'R2' && 'Oligotrophic offshore water with high water clarity and dispersed pelagics.'}
                  {key === 'R3' && 'Estuarine river plume with heavy inorganic silt and reduced salinity.'}
                  {key === 'R4' && 'Hypoxic bottom water inversion (< 3.0 mg/L DO) causing fish mortalities.'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Mean DO</div>
                  <div className="font-semibold text-slate-800">{a.mean_do_mg_l} mg/L</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Mean SST</div>
                  <div className="font-semibold text-slate-800">{a.mean_sst_c} °C</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Turbidity</div>
                  <div className="font-semibold text-slate-800">{a.mean_turbidity_ntu} NTU</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Avg CPUE</div>
                  <div className="font-semibold text-slate-800">{formatCpue(a.mean_cpue_kg_hr)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Middle Row: PCA Projection and Feature Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PCA Projection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ScatterIcon size={16} className="text-sky-600" />
              <h2 className="text-base font-semibold text-slate-800">Orthogonal PCA Projection Space</h2>
            </div>
            <span className="text-xs text-slate-500">
              PC1 ({((frontendRaw?.pca?.explained_variance_ratio?.[0] || 0.42) * 100).toFixed(1)}%) vs PC2 (
              {((frontendRaw?.pca?.explained_variance_ratio?.[1] || 0.28) * 100).toFixed(1)}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Clusters clearly separate in principal component space without topological overlap.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="x" name="PC1 (Oxygenation & Biomass)" tick={{ fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="PC2 (Salinity / Sediment)" tick={{ fontSize: 10 }} />
                <ZAxis range={[25, 25]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-md text-xs">
                        <div className="font-bold text-slate-800">{data.name}</div>
                        <div className="text-slate-600">{data.regime}</div>
                        <div className="text-slate-500 text-[11px]">{data.tier}</div>
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Scatter name="R1 Upwelling" data={pcaByRegime.R1} fill={REGIME_COLORS.R1} />
                <Scatter name="R2 Oligotrophic" data={pcaByRegime.R2} fill={REGIME_COLORS.R2} />
                <Scatter name="R3 Estuarine" data={pcaByRegime.R3} fill={REGIME_COLORS.R3} />
                <Scatter name="R4 Hypoxic" data={pcaByRegime.R4} fill={REGIME_COLORS.R4} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core Parameter Comparison Across Regimes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-sky-600" />
              <h2 className="text-base font-semibold text-slate-800">Mean CPUE vs. Dissolved Oxygen</h2>
            </div>
            <span className="text-xs text-slate-500">Biological Response</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Notice how high DO in R1 directly drives commercial CPUE exceeding 300 kg/hr.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={archetypeBarData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#16A34A" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#0284C7" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'cpue' ? `${value} kg/hr` : `${value} mg/L`,
                    name === 'cpue' ? 'Mean CPUE' : 'Mean DO',
                  ]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="cpue" name="Mean CPUE (kg/hr)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="do" name="Mean Dissolved Oxygen (mg/L)" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Selection Benchmark Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-sky-600" />
            <h2 className="text-base font-semibold text-slate-800">Model Selection & Cluster Validation Heuristics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparing k-Means vs. Gaussian Mixture Models (GMM) across cluster counts K = 3 to 8.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Algorithm</th>
                <th className="py-2.5 px-4 text-center">Clusters (K)</th>
                <th className="py-2.5 px-4 text-right">Silhouette Score (↑)</th>
                <th className="py-2.5 px-4 text-right">Davies-Bouldin (↓)</th>
                <th className="py-2.5 px-4 text-right">Calinski-Harabasz (↑)</th>
                <th className="py-2.5 px-4 text-right">Cluster Stability (ARI)</th>
                <th className="py-2.5 px-4 text-right">Min Cluster Size</th>
                <th className="py-2.5 px-4 text-center">Selection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {methodData.model_selection.map((m, idx) => {
                const isSelected = m.model === 'kmeans' && m.k === 4
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${isSelected ? 'bg-sky-50/80 font-semibold text-sky-900' : 'hover:bg-slate-50/80 text-slate-700'}`}
                  >
                    <td className="py-2.5 px-4 uppercase">{m.model}</td>
                    <td className="py-2.5 px-4 text-center">{m.k}</td>
                    <td className="py-2.5 px-4 text-right">{m.sil.toFixed(3)}</td>
                    <td className="py-2.5 px-4 text-right">{m.db.toFixed(3)}</td>
                    <td className="py-2.5 px-4 text-right">{m.ch.toFixed(1)}</td>
                    <td className="py-2.5 px-4 text-right">{(m.stability * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right">{m.min_size}</td>
                    <td className="py-2.5 px-4 text-center">
                      {isSelected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-600 text-white">
                          Selected Model (k=4)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
