import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'

export default function Search() {
  const { data: players } = useCollection('players')
  const { data: matches } = useCollection('matches')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  const matchedPlayers = q ? players.filter((p) => p.name.toLowerCase().includes(q)) : []

  const teamNames = [...new Set(players.map((p) => p.team).filter(Boolean))]
  const matchedTeams = q ? teamNames.filter((t) => t.toLowerCase().includes(q)) : []

  const tournamentNames = [...new Set(matches.map((m) => m.tournamentName).filter(Boolean))]
  const matchedTournaments = q ? tournamentNames.filter((t) => t.toLowerCase().includes(q)) : []

  return (
    <section className="section">
      <div className="section-head">
        <h2>Search</h2>
      </div>
      <div className="form-grid" style={{ marginBottom: 28 }}>
        <input
          placeholder="Search players, teams, tournaments..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {!q && <p className="empty-state">Start typing to search.</p>}

      {q && (
        <>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 8 }}>Players</h3>
          {matchedPlayers.length === 0 && <p className="empty-state">No players found.</p>}
          <div className="grid" style={{ marginBottom: 24 }}>
            {matchedPlayers.map((p) => (
              <Link to={`/players/${p.id}`} key={p.id} className="card">
                <h3>{p.name}</h3>
                <div className="meta">{p.team || 'No team'}</div>
              </Link>
            ))}
          </div>

          <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 8 }}>Teams</h3>
          {matchedTeams.length === 0 && <p className="empty-state">No teams found.</p>}
          <div className="grid" style={{ marginBottom: 24 }}>
            {matchedTeams.map((t) => (
              <Link to={`/teams/${encodeURIComponent(t)}`} key={t} className="card">
                <h3>{t}</h3>
              </Link>
            ))}
          </div>

          <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 8 }}>Tournaments</h3>
          {matchedTournaments.length === 0 && <p className="empty-state">No tournaments found.</p>}
          <div className="grid">
            {matchedTournaments.map((t) => (
              <Link to="/fixtures" key={t} className="card">
                <h3>{t}</h3>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
