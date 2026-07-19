import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'

export default function Home() {
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')

  const standings = computeStandings(players, matches)
  const top3 = standings.slice(0, 3)

  const recent = [...matches]
    .filter((m) => m.completed)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5)

  return (
    <>
      <section className="hero">
        <div className="eyebrow">Live standings</div>
        <h1>Tamil eFootballers Ranking</h1>
        <p className="lede">
          Every fixture, every result, one automated table. Track players, tournaments and who's
          really on top this season.
        </p>

        {!pLoad && !mLoad && top3.length > 0 && (
          <div className="scoreboard">
            {top3.map((p) => (
              <div className="scoreboard-cell" key={p.id}>
                <div className="rank-flip">{String(p.rank).padStart(2, '0')}</div>
                <div className="name">{p.name}</div>
                <div className="pts">{p.points} PTS · {p.played} PLD</div>
              </div>
            ))}
          </div>
        )}
        {!pLoad && players.length === 0 && (
          <p className="empty-state">No players yet — add players from the Admin page to get started.</p>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Recent results</h2>
          <Link to="/fixtures" className="eyebrow">All fixtures →</Link>
        </div>
        {recent.length === 0 && <p className="empty-state">No results recorded yet.</p>}
        {recent.map((m) => (
          <div className="fixture-card" key={m.id}>
            <div className="players">
              <span>{m.player1Name}</span>
              <span className="score">{m.score1} – {m.score2}</span>
              <span>{m.player2Name}</span>
            </div>
            <div className="status">{m.tournamentName || 'Friendly'}</div>
          </div>
        ))}
      </section>
    </>
  )
}
