import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { colorFromName, initials } from '../utils/avatar.js'

export default function Players() {
  const { data: players, loading } = useCollection('players')
  const [search, setSearch] = useState('')

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="section">
      <div className="section-head">
        <h2>Players</h2>
        <span className="num">{players.length} registered</span>
      </div>

      <div className="form-grid" style={{ marginBottom: 24 }}>
        <input
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="empty-state">Loading players…</p>}
      {!loading && filtered.length === 0 && (
        <p className="empty-state">No players found. Add players from the Admin page.</p>
      )}

      <div className="grid">
        {filtered.map((p) => (
          <Link to={`/players/${p.id}`} key={p.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ background: colorFromName(p.name) }}>
                {initials(p.name)}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <div className="meta">{p.team || 'No team'} {p.position && `· ${p.position}`}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
