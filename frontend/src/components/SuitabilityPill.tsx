import { tierColor, tierPillClass } from '../utils/format'

interface Props {
  tier: string
  short?: boolean
}

export function SuitabilityPill({ tier, short = false }: Props) {
  const label = short ? tier.split(' ')[0] : tier
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${tierPillClass(tier)}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: tierColor(tier) }}
    >
      {label}
    </span>
  )
}

interface DotProps {
  tier: string
  size?: number
}

export function SuitabilityDot({ tier, size = 8 }: DotProps) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: tierColor(tier),
      }}
      aria-label={tier}
    />
  )
}
