import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { aggregateBdr } from '../utils/bdr.js'
import { colorFromName, initials } from '../utils/avatar.js'

export default function BallonDor() {
  const { data: bdrPoints, loading } = useCollection('bdrPoints')
  const leaderboard = aggregateBdr(bdrPoints)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Ballon d'Or Rankings</h2>
        <span className="num">BDR points · updates live</span>
      </div>

      {loading && <p className="empty-state">Loading rankings…</p>}
      {!loading && leaderboard.length === 0 && (
        <p className="empty-state">No BDR points recorded yet — record a tournament result from Admin.</p>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="table-wrap">
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
    </section>
  )
}
