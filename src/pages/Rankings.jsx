import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'

export default function Rankings() {
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')

  const standings = computeStandings(players, matches)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Rankings</h2>
        <span className="num">Auto-calculated from results</span>
      </div>

      {(pLoad || mLoad) && <p className="empty-state">Crunching the table…</p>}

      {!pLoad && !mLoad && standings.length === 0 && (
        <p className="empty-state">Add players and results to generate the table.</p>
      )}

      {!pLoad && !mLoad && standings.length > 0 && (
        <div className="table-wrap">
          <table className="rank-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Pld</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((p) => (
                <tr key={p.id}>
                  <td className="rank-cell">{p.rank}</td>
                  <td className="player-name">{p.name}</td>
                  <td>{p.played}</td>
                  <td>{p.wins}</td>
                  <td>{p.draws}</td>
                  <td>{p.losses}</td>
                  <td>{p.goalsFor}</td>
                  <td>{p.goalsAgainst}</td>
                  <td>{p.goalDiff > 0 ? `+${p.goalDiff}` : p.goalDiff}</td>
                  <td>{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
