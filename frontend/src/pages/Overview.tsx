import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { CatchEventRow, SummaryResponse } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { SuitabilityPill } from '../components/SuitabilityPill'
import { formatCpue, formatNumber, TIER_COLORS } from '../utils/format'
import { Waves, TrendingUp, Ship, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export default function Overview() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [recentEvents, setRecentEvents] = useState<CatchEventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, evRes] = await Promise.all([
          api.summary(),
          api.events({ validated_only: true, limit: 8 }),
        ])
        setSummary(sumRes)
        setRecentEvents(evRes.events)
      } catch (err) {
        console.error('Failed to load overview data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!summary) return null

  const tierChartData = [
    { name: 'S1 Prime PFZ', count: summary.tier_counts['S1 Prime PFZ'] || 0, color: TIER_COLORS['S1 Prime PFZ'] },
    { name: 'S2 Favorable', count: summary.tier_counts['S2 Favorable'] || 0, color: TIER_COLORS['S2 Favorable'] },
    { name: 'S3 Marginal', count: summary.tier_counts['S3 Marginal'] || 0, color: TIER_COLORS['S3 Marginal'] },
    { name: 'S4 Unfavorable', count: summary.tier_counts['S4 Unfavorable'] || 0, color: TIER_COLORS['S4 Unfavorable'] },
  ]

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Coastal Water-Quality & Fishing-Zone Suitability Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multivariate sensor clustering for Potential Fishing Zone (PFZ) triage and fleet optimization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explorer" className="btn-primary">
            <Ship size={15} />
            <span>Launch Map Explorer</span>
          </Link>
          <Link to="/planner" className="btn-secondary">
            <span>Voyage Plan</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Candidate Zones</span>
            <Waves size={16} className="text-sky-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatNumber(summary.n_zones)}</div>
          <div className="text-xs text-slate-500 mt-1">Monitored marine grid units</div>
        </div>

        <div className="kpi-card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>S1 Prime PFZ</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {formatNumber(summary.tier_counts['S1 Prime PFZ'] || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Top ~15% immediate fleet dispatch
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mean CPUE (S1 / S2)</span>
            <Ship size={16} className="text-sky-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatCpue(summary.mean_cpue_p12)}</div>
          <div className="text-xs text-slate-500 mt-1">Avg commercial vessel catch yield</div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Validated Catch Trips</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {formatNumber(summary.validated_events)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {summary.total_events}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Verified landing receipts & logbooks</div>
        </div>
      </div>

      {/* Grid: Tier Distribution & Regime Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Suitability Tier Distribution</h2>
              <p className="text-xs text-slate-500">Candidate zones segmented by multi-criteria priority</p>
            </div>
            <Link to="/builder" className="text-xs text-sky-600 hover:underline font-medium">
              Re-weight Tiers →
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(value: any) => [`${value} zones`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {tierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ecological Regimes Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">k-Means Ecological Regimes</h2>
                <p className="text-xs text-slate-500">Unsupervised clusters based on DO, SST, Salinity, Turbidity</p>
              </div>
              <Link to="/regimes" className="text-xs text-sky-600 hover:underline font-medium">
                Cluster Space →
              </Link>
            </div>

            <div className="space-y-3">
              {Object.entries(summary.regime_counts).map(([regime, count]) => (
                <div key={regime} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{regime}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {regime.startsWith('R1') && 'High primary productivity • Pelagic sardine/mackerel schools'}
                      {regime.startsWith('R2') && 'Deep clear coastal water • Low fish aggregation'}
                      {regime.startsWith('R3') && 'Terrestrial silt discharge • High turbidity gill hazard'}
                      {regime.startsWith('R4') && 'Hypoxic pocket (DO < 3.0 mg/L) • Complete fish evasion'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-700 ml-4 shrink-0">
                    {count} <span className="text-xs font-normal text-slate-400">zones</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Optimal Cluster Count: <strong>K = 4</strong></span>
            <span>Davies-Bouldin: <strong>1.58</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Validated Catch Events */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Recent Validated Commercial Catch Records</h2>
            <p className="text-xs text-slate-500">Field-verified landings matched against candidate zones</p>
          </div>
          <Link to="/validation" className="btn-secondary text-xs">
            <span>Full Validation Metrics</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Trip Date</th>
                <th className="py-2.5 px-4">Zone</th>
                <th className="py-2.5 px-4">Suitability Tier</th>
                <th className="py-2.5 px-4">Target Species</th>
                <th className="py-2.5 px-4">Vessel Gear</th>
                <th className="py-2.5 px-4 text-right">Effort (hrs)</th>
                <th className="py-2.5 px-4 text-right">CPUE (kg/hr)</th>
                <th className="py-2.5 px-4 text-right">Fuel Efficiency (kg/L)</th>
                <th className="py-2.5 px-4 text-center">Fisher Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvents.map((ev) => (
                <tr key={ev.event_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500">{ev.date}</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-700">{ev.zone_name}</td>
                  <td className="py-2.5 px-4">
                    <SuitabilityPill tier={ev.suitability_tier} short />
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{ev.primary_species}</td>
                  <td className="py-2.5 px-4 text-slate-600">{ev.gear}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{ev.effort_hours}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{ev.cpue_kg_hr}</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">{ev.cpue_kg_diesel}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ★ {ev.fisher_rating} / 5
                    </span>
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
