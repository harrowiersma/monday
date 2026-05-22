import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { TOOL_GROUPS, tools } from './tools/registry'
import Home from './pages/Home'
import Reference from './pages/Reference'
import HeatMap from './tools/HeatMap'
import ContextAudit from './tools/ContextAudit'
import Maturity from './tools/Maturity'
import Scorecard from './tools/Scorecard'
import TemplateTool from './tools/TemplateTool'
import PhaseTracker from './tools/PhaseTracker'
import Worksheet from './tools/Worksheet'
import Splash from './components/Splash'
import { applyTheme, type Theme } from './lib/theme'

/** Resets scroll to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false)
  const close = () => setNavOpen(false)
  // Only Diagnostics is expanded by default; the rest start folded.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOOL_GROUPS.map((g) => [g, g === 'Diagnostics'])),
  )
  const toggleGroup = (g: string) =>
    setOpenGroups((s) => ({ ...s, [g]: !s[g] }))

  const [theme, setTheme] = useState<Theme>(
    () =>
      (document.documentElement.getAttribute('data-theme') as Theme) ||
      'dark',
  )
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  // When a tool route is open, auto-expand the group it belongs to.
  const { pathname } = useLocation()
  useEffect(() => {
    const tool = tools.find((t) => t.path === pathname)
    if (tool) {
      setOpenGroups((s) =>
        s[tool.group] ? s : { ...s, [tool.group]: true },
      )
    }
  }, [pathname])

  return (
    <div className="app">
      <Splash />
      <ScrollToTop />
      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <div className="brand">
          <div className="brand-title">Monday Morning Companion</div>
          <div className="brand-sub">
            Don't Screw Up Your Data Governance
          </div>
        </div>
        <nav className="nav" onClick={close}>
          <NavLink to="/" end className="nav-link">
            <span className="nav-ico">⌂</span> Home
          </NavLink>
          <NavLink to="/framework" className="nav-link">
            <span className="nav-ico">❖</span> Framework reference
          </NavLink>
          {TOOL_GROUPS.map((group) => (
            <div key={group}>
              <button
                className="nav-group-label"
                aria-expanded={openGroups[group]}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleGroup(group)
                }}
              >
                <span>{group}</span>
                <span className="nav-group-chevron">
                  {openGroups[group] ? '▾' : '▸'}
                </span>
              </button>
              {openGroups[group] &&
                tools
                  .filter((t) => t.group === group)
                  .map((t) => (
                    <NavLink key={t.id} to={t.path} className="nav-link">
                      <span className="nav-ico">{t.icon}</span>
                      {t.name}
                    </NavLink>
                  ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title="Switch colour theme"
          >
            {theme === 'dark' ? '☀  Light mode' : '☾  Dark mode'}
          </button>
          <div style={{ marginTop: 12 }}>
            Works offline · data stays on this device
            <br />© 2026{' '}
            <a
              className="foot-link"
              href="https://harro.ch"
              target="_blank"
              rel="noopener noreferrer"
            >
              Harro M. Wiersma
            </a>
          </div>
        </div>
      </aside>

      <div
        className={'scrim' + (navOpen ? ' open' : '')}
        onClick={close}
      />

      <div className="main">
        <header className="topbar">
          <button aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
            ☰
          </button>
          <strong>Monday Morning Companion</strong>
          <span className="spacer" />
          <button
            aria-label="Switch colour theme"
            title="Switch colour theme"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/framework" element={<Reference />} />
          <Route path="/tools/heat-map" element={<HeatMap />} />
          <Route path="/tools/context-audit" element={<ContextAudit />} />
          <Route path="/tools/maturity" element={<Maturity />} />
          <Route path="/tools/scorecard/:id" element={<Scorecard />} />
          <Route path="/tools/template/:id" element={<TemplateTool />} />
          <Route path="/tools/phases" element={<PhaseTracker />} />
          <Route path="/tools/worksheet/:id" element={<Worksheet />} />
          <Route
            path="*"
            element={
              <div className="content">
                <h1>Not found</h1>
                <NavLink to="/">Back to home</NavLink>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  )
}
