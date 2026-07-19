import { useState } from 'react'
import { useCollection } from '../hooks/useCollection.js'

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
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <div className="meta">{p.team || 'No team set'}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
