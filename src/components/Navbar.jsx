import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Joga<span>Bonito</span>
        </NavLink>
        <ul className="nav-links" style={{ position: 'static', display: 'flex' }}>
          <li><NavLink to="/" end>Fixtures</NavLink></li>
          <li><NavLink to="/bracket">Bracket</NavLink></li>
          <li><NavLink to="/history">History</NavLink></li>
          <li><NavLink to="/admin">Admin</NavLink></li>
        </ul>
      </div>
    </header>
  )
}
