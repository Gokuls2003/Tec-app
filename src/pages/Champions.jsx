import { useCollection } from '../hooks/useCollection.js'
import { formatSlug } from './Home.jsx'

export default function Champions() {
  const { data: champions, loading } = useCollection('champions')

  const sorted = [...champions].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <section className="section">
      <div className="section-head">
        <h2>Champions</h2>
        <span className="num">Hall of fame</span>
      </div>

      {loading && <p className="empty-state">Loading champions…</p>}
      {!loading && sorted.length === 0 && (
        <p className="empty-state">No champions recorded yet — mark a tournament as won from the Admin page.</p>
      )}

      {sorted.map((c) => (
        <div className="champion-card" key={c.id}>
          <div className="champion-trophy">🏆</div>
          <div className="champion-info">
            <h3>{c.championName}</h3>
            <div className="meta">
              {c.tournamentName}
              {c.format && (
                <span className={`format-badge format-${formatSlug(c.format)}`} style={{ marginLeft: 8 }}>
                  {c.format}
                </span>
              )}
              {c.date && ` · ${c.date}`}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
