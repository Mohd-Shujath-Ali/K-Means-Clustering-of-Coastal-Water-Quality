import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { MethodResponse } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { Database, Cpu, BookOpen } from 'lucide-react'

export default function DataMethod() {
  const [method, setMethod] = useState<MethodResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.method().then((res) => {
      setMethod(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading || !method) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Methodology & Scientific Data Architecture
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed mathematical formulations, oceanographic sensor parameters, and machine learning pipeline specifications.
        </p>
      </div>

      {/* Sensor Parameters Specification Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-sky-600" />
            <h2 className="text-base font-semibold text-slate-800">
              Multivariate Water-Quality Sensor Specifications (Objective 1)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical and chemical metrics compiled across candidate continental shelf fishing zones.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Parameter Name</th>
                <th className="py-2.5 px-4">Standard Unit</th>
                <th className="py-2.5 px-4">Favorable Range</th>
                <th className="py-2.5 px-4">Oceanographic & Biological Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {method.parameters.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-sky-700">{p.unit}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{p.ideal_range}</td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{p.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu size={18} className="text-sky-600" />
          <h2 className="text-base font-semibold text-slate-800">
            Algorithmic & Mathematical Formulations (Objective 2 & 3)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <div className="font-bold text-slate-900 text-sm">1. k-Means Clustering Optimization</div>
            <p className="leading-relaxed">
              Standardized 4D feature vectors <code className="bg-white px-1 py-0.5 rounded border border-slate-200">x = [DO, SST, Salinity, Turbidity]</code> are iteratively partitioned into K disjoint clusters to minimize within-cluster sum of squares (WCSS):
            </p>
            <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-center font-bold text-sky-900">
              J = ∑(j=1 to K) ∑(x_i ∈ S_j) ||x_i - μ_j||²
            </div>
            <p className="text-[11px] text-slate-500">
              Initialized using <strong>k-means++</strong> to prevent pathological local minima and ensure consistent convergence.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <div className="font-bold text-slate-900 text-sm">2. Multi-Criteria Composite Suitability</div>
            <p className="leading-relaxed">
              Candidate zone triage combines the continuous percentile rank of the ecological habitat index (Q) with the operational access index (F):
            </p>
            <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-center font-bold text-sky-900">
              S = α · Q(DO, SST, Sal, Chla, Turb) + (1 - α) · F(Dist_Port, Depth)
            </div>
            <p className="text-[11px] text-slate-500">
              Default operational balance α = 0.75 prioritizes biological habitat while factoring in vessel voyage expenditure.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <div className="font-bold text-slate-900 text-sm">3. Catch Per Unit Effort (CPUE) Formulation</div>
            <p className="leading-relaxed">
              Commercial abundance is normalized against active fishing duration and fuel expenditure:
            </p>
            <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-center font-bold text-sky-900">
              CPUE = Total Landed Biomass (kg) / Towing Effort (hours)
            </div>
            <p className="text-[11px] text-slate-500">
              Fuel efficiency metric: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">CPUE_diesel = kg / liter</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <div className="font-bold text-slate-900 text-sm">4. Statistical Hypothesis Testing</div>
            <p className="leading-relaxed">
              Non-parametric Kruskal-Wallis H-test verifies catch yield distributions across suitability tiers:
            </p>
            <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-center font-bold text-sky-900">
              H = (12 / N(N+1)) · ∑(R_j² / n_j) - 3(N+1)
            </div>
            <p className="text-[11px] text-slate-500">
              Empirical p-value &lt; 10⁻¹⁵⁰ statistically confirms distinct commercial productivity across tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Academic References */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <BookOpen size={18} className="text-sky-600" />
          <h2 className="text-base font-semibold text-slate-800">Academic Literature & Foundational References</h2>
        </div>

        <ul className="space-y-3 text-xs text-slate-600 leading-relaxed list-disc pl-5">
          <li>
            <strong>Valavanis, V. D., et al. (2008).</strong> Critical regions: A review on novel methods for identifying essential fish habitats and potential fishing zones. <em>Aquatic Conservation: Marine and Freshwater Ecosystems</em>, 18(6), 1018-1036.
          </li>
          <li>
            <strong>Solanki, H. U., et al. (2005).</strong> Application of remote sensing in Potential Fishing Zones (PFZ) forecast and validation along the Indian coast. <em>Indian Journal of Marine Sciences</em>, 34(3), 328-333.
          </li>
          <li>
            <strong>Rousseeuw, P. J. (1987).</strong> Silhouettes: A graphical aid to the interpretation and validation of cluster analysis. <em>Journal of Computational and Applied Mathematics</em>, 20, 53-65.
          </li>
          <li>
            <strong>Food and Agriculture Organization (FAO). (2019).</strong> Use of remote sensing and GIS in marine fisheries and habitat mapping. <em>FAO Fisheries Technical Paper</em> No. 443.
          </li>
        </ul>
      </div>
    </div>
  )
}
