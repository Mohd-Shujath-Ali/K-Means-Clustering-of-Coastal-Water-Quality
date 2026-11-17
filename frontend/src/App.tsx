import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Overview from './pages/Overview'
import MapExplorer from './pages/MapExplorer'
import Regimes from './pages/Regimes'
import SuitabilityBuilder from './pages/SuitabilityBuilder'
import Validation from './pages/Validation'
import VoyagePlanner from './pages/VoyagePlanner'
import AdvisoryThresholds from './pages/AdvisoryThresholds'
import DataMethod from './pages/DataMethod'
import { preloadGeoJson } from './api/geojson'

// Eagerly prefetch coastal fishing zone polygon boundaries
preloadGeoJson().catch(() => {})

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/explorer" element={<MapExplorer />} />
        <Route path="/regimes" element={<Regimes />} />
        <Route path="/builder" element={<SuitabilityBuilder />} />
        <Route path="/validation" element={<Validation />} />
        <Route path="/planner" element={<VoyagePlanner />} />
        <Route path="/alerts" element={<AdvisoryThresholds />} />
        <Route path="/method" element={<DataMethod />} />
      </Routes>
    </AppShell>
  )
}
