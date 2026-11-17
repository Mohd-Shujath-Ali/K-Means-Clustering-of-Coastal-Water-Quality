// Shared formatting, tier color definitions, and utility helpers for AquaZone

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n)
}

export function formatCpue(cpue: number): string {
  return `${formatNumber(cpue, 1)} kg/hr`
}

export function formatDepth(m: number): string {
  return `${formatNumber(m, 1)} m`
}

export function formatDist(km: number): string {
  return `${formatNumber(km, 1)} km`
}

export const TIER_COLORS: Record<string, string> = {
  'S1 Prime PFZ': '#16A34A',
  'S2 Favorable': '#0284C7',
  'S3 Marginal': '#D97706',
  'S4 Unfavorable': '#DC2626',
}

export const TIER_SHORT: Record<string, string> = {
  'S1 Prime PFZ': 'S1',
  'S2 Favorable': 'S2',
  'S3 Marginal': 'S3',
  'S4 Unfavorable': 'S4',
}

export const REGIME_COLORS: Record<string, string> = {
  R1: '#059669',
  R2: '#0284C7',
  R3: '#D97706',
  R4: '#DC2626',
}

export function tierKey(tier: string): string {
  return tier.split(' ')[0]
}

export function tierColor(tier: string): string {
  for (const [k, c] of Object.entries(TIER_COLORS)) {
    if (tier.startsWith(k.split(' ')[0])) return c
  }
  return '#64748B'
}

export function tierPillClass(tier: string): string {
  if (tier.startsWith('S1')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (tier.startsWith('S2')) return 'bg-sky-50 text-sky-700 border-sky-200'
  if (tier.startsWith('S3')) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

export function regimeKey(regime: string): string {
  return regime.split(' ')[0]
}

export function regimeColor(regime: string): string {
  return REGIME_COLORS[regimeKey(regime)] ?? '#0284C7'
}
