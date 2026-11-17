// Single typed API client for AquaZone
import type {
  ActionPlanResponse,
  AlertThresholdRow,
  CatchEventListResponse,
  DynamicRankingRequest,
  DynamicRankingResponse,
  MethodResponse,
  SummaryResponse,
  ValidationMetricsResponse,
  ZoneDetailResponse,
  ZoneListResponse,
} from './types'

const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  summary: (): Promise<SummaryResponse> => req('/summary'),

  zones: (params: Record<string, string | number | boolean | undefined>): Promise<ZoneListResponse> => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
    }
    return req(`/zones?${q}`)
  },

  zone: (id: number): Promise<ZoneDetailResponse> => req(`/zones/${id}`),

  rank: (body: DynamicRankingRequest): Promise<DynamicRankingResponse> =>
    req('/rank', { method: 'POST', body: JSON.stringify(body) }),

  validate: (): Promise<ValidationMetricsResponse> => req('/validate'),

  plan: (): Promise<ActionPlanResponse> => req('/plan'),

  alerts: (): Promise<AlertThresholdRow[]> => req('/alerts'),

  events: (params?: { validated_only?: boolean; tier?: string; limit?: number }): Promise<CatchEventListResponse> => {
    const q = new URLSearchParams()
    if (params?.validated_only) q.set('validated_only', 'true')
    if (params?.tier) q.set('tier', params.tier)
    if (params?.limit) q.set('limit', String(params.limit))
    return req(`/events?${q}`)
  },

  method: (): Promise<MethodResponse> => req('/method'),
}
