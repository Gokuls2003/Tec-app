import { useCollection } from '../hooks/useCollection.js'

export default function Fixtures() {
  const { data: matches, loading } = useCollection('matches')

  const byTournament = matches.reduce((acc, m) => {
    const key = m.tournamentName || 'Friendly Matches'
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <section className="section">
      <div className="section-head">
        <h2>Fixtures</h2>
        <span className="num">{matches.length} total</span>
      </div>

      {loading && <p className="empty-state">Loading fixtures…</p>}
      {!loading && matches.length === 0 && (
        <p className="empty-state">No fixtures yet. Create matches from the Admin page.</p>
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
              <div className="status">
                {m.completed ? 'Full time' : 'Upcoming'}{m.round ? ` · ${m.round}` : ''}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
