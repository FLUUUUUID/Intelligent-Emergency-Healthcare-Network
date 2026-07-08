import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DemoPage from './pages/DemoPage'
import CommandCenter from './pages/CommandCenter'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/demo', element: <DemoPage /> },
  { path: '/command', element: <CommandCenter /> },
])

// Note: React.StrictMode is intentionally omitted. Its dev-only double-mount
// invocation conflicts with Framer Motion's AnimatePresence mode="wait",
// permanently stalling the detecting → selecting transition on first load
// (and double-firing geolocation / OSRM requests). Production behaviour is
// unaffected since StrictMode never runs in production builds.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
