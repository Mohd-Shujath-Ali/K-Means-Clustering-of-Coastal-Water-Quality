import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  Compass,
  Layers,
  Sliders,
  CheckSquare,
  Ship,
  Bell,
  FileText,
  Search,
  Waves,
  Loader2,
  Map,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { SuitabilityPill } from './SuitabilityPill'
import type { ZoneRow } from '../api/types'

const NAV_SECTIONS = [
  {
    label: 'ANALYSIS',
    items: [
      { to: '/', icon: <BarChart2 size={16} />, label: 'Overview' },
      { to: '/explorer', icon: <Map size={16} />, label: 'Map Explorer' },
      { to: '/regimes', icon: <Layers size={16} />, label: 'Regimes (k-Means)' },
    ],
  },
  {
    label: 'DECISION TOOLS',
    items: [
      { to: '/builder', icon: <Sliders size={16} />, label: 'Suitability Builder' },
      { to: '/validation', icon: <CheckSquare size={16} />, label: 'Fisheries Validation' },
      { to: '/planner', icon: <Ship size={16} />, label: 'Voyage Planner' },
    ],
  },
  {
    label: 'REFERENCE',
    items: [
      { to: '/alerts', icon: <Bell size={16} />, label: 'Advisory Thresholds' },
      { to: '/method', icon: <FileText size={16} />, label: 'Data & Method' },
    ],
  },
]

interface Props {
  children: React.ReactNode
}

export default function AppShell({ children }: Props) {
  const [searchVal, setSearchVal] = useState('')
  const [suggestions, setSuggestions] = useState<ZoneRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearchChange(val: string) {
    setSearchVal(val)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (!val.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.zones({ search: val, page_size: 6 })
        setSuggestions(res.zones)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 200)
  }

  function handleSelectZone(zoneId: number) {
    setIsOpen(false)
    setSearchVal('')
    navigate(`/explorer?zone=${zoneId}`)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Waves size={20} />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              AquaZone <span className="text-[10px] bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.2 rounded">PFZ</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Coastal Triage Platform</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider px-3 mb-1.5">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">FastAPI ML Engine Online</span>
          </div>
          <div className="text-[11px] text-slate-400">850 Coastal Zones • k-Means++</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Compass size={16} className="text-sky-600" />
            <span className="font-semibold text-slate-800">Arabian Sea / Continental Shelf</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Multivariate Water-Quality Sensor Grid</span>
          </div>

          {/* Quick Search */}
          <div ref={searchContainerRef} className="relative w-80">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchVal && setIsOpen(true)}
                placeholder="Search zone (e.g. AZ-0042, Sardine)..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 transition-colors"
              />
              {isLoading && (
                <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isOpen && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-white rounded-lg border border-slate-200 shadow-xl z-50 overflow-hidden text-xs">
                {suggestions.length === 0 ? (
                  <div className="p-3 text-center text-slate-400">
                    {isLoading ? 'Searching marine zones...' : 'No matching candidate zones found.'}
                  </div>
                ) : (
                  <div className="py-1">
                    {suggestions.map((z) => (
                      <button
                        key={z.zone_id}
                        onClick={() => handleSelectZone(z.zone_id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-none cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{z.zone_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {z.primary_species} • DO {z.dissolved_oxygen} mg/L
                          </div>
                        </div>
                        <SuitabilityPill tier={z.suitability_tier} short />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
