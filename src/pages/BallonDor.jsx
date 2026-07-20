import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { aggregateBdr } from '../utils/bdr.js'
import { colorFromName, initials } from '../utils/avatar.js'

export default function BallonDor() {
  const { data: bdrPoints, loading } = useCollection('bdrPoints')
  const { data: winners, loading: wLoad } = useCollection('ballonDorWinners')

  const currentSeasonPoints = bdrPoints.filter((p) => !p.seasonClosed)
  const leaderboard = aggregateBdr(currentSeasonPoints)
  const sortedWinners = [...winners].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <section className="section">
      <div className="section-head">
        <h2>Ballon d'Or</h2>
        <span className="num">Current season BDR · updates live</span>
      </div>

      {loading && <p className="empty-state">Loading rankings…</p>}
      {!loading && leaderboard.length === 0 && (
        <p className="empty-state">No BDR points recorded yet this season.</p>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="table-wrap" style={{ marginBottom: 36 }}>
          <table className="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Trophies</th>
                <th>BDR Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.playerId}>
                  <td className="rank-cell">{row.rank}</td>
                  <td className="player-name">
                    <Link to={`/players/${row.playerId}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: colorFromName(row.playerName), width: 28, height: 28, fontSize: 12 }}>
                        {initials(row.playerName)}
                      </div>
                      {row.playerName}
                    </Link>
                  </td>
                  <td>{row.trophies}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-head">
        <h2>Hall of Fame 🏆</h2>
        <span className="num">Past Ballon d'Or winners</span>
      </div>
      {wLoad && <p className="empty-state">Loading…</p>}
      {!wLoad && sortedWinners.length === 0 && (
        <p className="empty-state">No season has been completed yet.</p>
      )}
      {sortedWinners.map((w) => (
        <div className="champion-card" key={w.id}>
          <div className="champion-trophy">🥇</div>
          <div className="champion-info">
            <h3>{w.playerName}</h3>
            <div className="meta">{w.seasonName} · {w.points} BDR points{w.date && ` · ${w.date}`}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
