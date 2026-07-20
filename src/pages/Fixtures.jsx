import { useState } from 'react'
import { useCollection } from '../hooks/useCollection.js'
import { formatSlug } from './Home.jsx'
import { TOURNAMENT_TYPES } from '../utils/bdr.js'

const FORMATS = ['All', ...TOURNAMENT_TYPES]

export default function Fixtures() {
  const { data: matches, loading } = useCollection('matches')
  const [activeFormat, setActiveFormat] = useState('All')

  const filtered = activeFormat === 'All'
    ? matches
    : matches.filter((m) => (m.format || 'Other') === activeFormat)

  const byTournament = filtered.reduce((acc, m) => {
    const key = m.tournamentName || 'Friendly Matches'
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <section className="section">
      <div className="section-head">
        <h2>Fixtures</h2>
        <span className="num">{filtered.length} total</span>
      </div>

      <div className="format-tabs">
        {FORMATS.map((f) => (
          <button
            key={f}
            className={`format-tab ${activeFormat === f ? 'active' : ''}`}
            onClick={() => setActiveFormat(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="empty-state">Loading fixtures…</p>}
      {!loading && filtered.length === 0 && (
        <p className="empty-state">No fixtures in this format yet.</p>
      )}

      {Object.entries(byTournament).map(([tournament, list]) => (
        <div key={tournament} style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, marginBottom: 10 }}>
            {tournament}
          </h3>
          {list.map((m) => (
            <div className="fixture-card" key={m.id}>
              <div className="players">
                <span>{m.player1Name}</span>
                <span className="score">
                  {m.completed ? `${m.score1} – ${m.score2}` : 'vs'}
                </span>
                <span>{m.player2Name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {m.format && (
                  <span className={`format-badge format-${formatSlug(m.format)}`}>{m.format}</span>
                )}
                <div className="status">
                  {m.completed ? 'Full time' : 'Upcoming'}{m.round ? ` · ${m.round}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
