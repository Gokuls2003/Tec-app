import { useCollection } from '../hooks/useCollection.js'

export default function History() {
  const { data: results, loading } = useCollection('tournamentResults')
  const sorted = [...results].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <section className="section">
      <div className="section-head">
        <h2>Tournament History</h2>
        <span className="num">{sorted.length} recorded</span>
      </div>

      {loading && <p className="empty-state">Loading history…</p>}
      {!loading && sorted.length === 0 && (
        <p className="empty-state">No tournament results recorded yet.</p>
      )}

      {sorted.map((t) => {
        const maxGoals = Math.max(0, ...t.positions.map((p) => p.goals || 0))
        return (
          <div key={t.id} style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 26, marginBottom: 4 }}>{t.tournamentName}</h3>
            <div className="meta" style={{ marginBottom: 10 }}>{t.date}</div>
            <div className="table-wrap">
              <table className="rank-table">
                <thead>
                  <tr><th>#</th><th>Player</th><th>Goals</th><th></th></tr>
                </thead>
                <tbody>
                  {t.positions.map((p) => (
                    <tr key={p.position}>
                      <td className="rank-cell">{p.position}</td>
                      <td className="player-name">{p.playerName}</td>
                      <td>{p.goals}</td>
                      <td>
                        {p.goals === maxGoals && maxGoals > 0 && (
                          <span className="format-badge format-invictus-ucl">Golden Boot</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </section>
  )
}
