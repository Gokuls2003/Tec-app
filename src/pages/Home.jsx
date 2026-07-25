import { useState } from 'react'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'

export default function Home() {
  const { data: matches, loading } = useCollection('matches')
  const [activeTournament, setActiveTournament] = useState('All')

  const tournamentNames = ['All', ...new Set(matches.map((m) => m.tournamentName).filter(Boolean))]
  const filtered = activeTournament === 'All'
    ? matches
    : matches.filter((m) => m.tournamentName === activeTournament)

  const byTournament = filtered.reduce((acc, m) => {
    const key = m.tournamentName || 'Untitled'
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <>
      <section className="hero">
        <div className="eyebrow">Tournament fixtures</div>
        <h1>Joga Bonito</h1>
        <p className="lede">Auto-generated fixtures, results, and standings.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Fixtures</h2>
        </div>

        <div className="format-tabs">
          {tournamentNames.map((t) => (
            <button
              key={t}
              className={`format-tab ${activeTournament === t ? 'active' : ''}`}
              onClick={() => setActiveTournament(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && <p className="empty-state">Loading fixtures…</p>}
        {!loading && filtered.length === 0 && (
          <p className="empty-state">No fixtures yet — generate some from the Admin page.</p>
        )}

        {Object.entries(byTournament).map(([tournament, list]) => {
          const idsInTournament = new Set()
          list.forEach((m) => { idsInTournament.add(m.player1Id); idsInTournament.add(m.player2Id) })
          const pseudoPlayers = [...idsInTournament].filter(Boolean).map((id) => {
            const m = list.find((mm) => mm.player1Id === id || mm.player2Id === id)
            const name = m.player1Id === id ? m.player1Name : m.player2Name
            return { id, name }
          })
          const standings = computeStandings(pseudoPlayers, list)

          return (
            <div key={tournament} style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 12 }}>{tournament}</h3>

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

              {standings.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table className="rank-table">
                    <thead>
                      <tr><th>#</th><th>Player</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
                    </thead>
                    <tbody>
                      {standings.map((s) => (
                        <tr key={s.id}>
                          <td className="rank-cell">{s.rank}</td>
                          <td className="player-name">{s.name}</td>
                          <td>{s.played}</td>
                          <td>{s.wins}</td>
                          <td>{s.draws}</td>
                          <td>{s.losses}</td>
                          <td>{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</td>
                          <td>{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </section>
    </>
  )
}
