import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/players', label: 'Players' },
    { to: '/teams', label: 'Teams' },
    { to: '/fixtures', label: 'Fixtures' },
    { to: '/rankings', label: 'Rankings' },
    { to: '/stats', label: 'Stats' },
    { to: '/champions', label: 'Champions' },
    { to: '/search', label: 'Search' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Joga<span>Bonito</span>
        </NavLink>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          ☰
        </button>
        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
