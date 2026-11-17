import { REGIME_COLORS, TIER_COLORS } from '../utils/format'

interface Props {
  layer: string
}

export function MapLegend({ layer }: Props) {
  if (layer === 'suitability_tier') {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
        <div className="font-semibold text-slate-800 mb-1">Suitability Tiers (PFZ)</div>
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-slate-600">{tier}</span>
          </div>
        ))}
      </div>
    )
  }

  if (layer === 'regime') {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 max-w-xs">
        <div className="font-semibold text-slate-800 mb-1">k-Means Ecological Regimes</div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: REGIME_COLORS.R1 }} />
          <span className="text-slate-600">R1 Upwelling Pelagic Front</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: REGIME_COLORS.R2 }} />
          <span className="text-slate-600">R2 Offshore Oligotrophic</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: REGIME_COLORS.R3 }} />
          <span className="text-slate-600">R3 Estuarine Sediment Plume</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: REGIME_COLORS.R4 }} />
          <span className="text-slate-600">R4 Hypoxic Inversion (Avoid)</span>
        </div>
      </div>
    )
  }

  // Continuous layers (DO, Temp, Turbidity, CPUE)
  const layerLabels: Record<string, { title: string; min: string; max: string; gradient: string }> = {
    dissolved_oxygen: {
      title: 'Dissolved Oxygen (mg/L)',
      min: '1.5 (Hypoxic)',
      max: '8.5 (Rich)',
      gradient: 'linear-gradient(to right, #DC2626, #D97706, #0284C7, #16A34A)',
    },
    temperature: {
      title: 'Sea Surface Temp (°C)',
      min: '23.0°C (Upwelled)',
      max: '33.0°C (Warm)',
      gradient: 'linear-gradient(to right, #0284C7, #16A34A, #D97706, #DC2626)',
    },
    turbidity: {
      title: 'Turbidity (NTU)',
      min: '0.5 (Clear)',
      max: '50.0 (Silt)',
      gradient: 'linear-gradient(to right, #0284C7, #16A34A, #D97706, #78350F)',
    },
    cpue_mean_kg_hr: {
      title: 'Historical CPUE (kg/hr)',
      min: '10 kg/hr',
      max: '450 kg/hr',
      gradient: 'linear-gradient(to right, #64748B, #D97706, #0284C7, #16A34A)',
    },
  }

  const info = layerLabels[layer] ?? {
    title: layer,
    min: 'Low',
    max: 'High',
    gradient: 'linear-gradient(to right, #64748B, #0284C7, #16A34A)',
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 w-56">
      <div className="font-semibold text-slate-800">{info.title}</div>
      <div className="h-2.5 rounded-full" style={{ background: info.gradient }} />
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{info.min}</span>
        <span>{info.max}</span>
      </div>
    </div>
  )
}
