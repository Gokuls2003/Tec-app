import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'
import { aggregateBdr } from '../utils/bdr.js'
import { colorFromName, initials } from '../utils/avatar.js'

const VIEWS = ['Total Players', 'League Table', 'BDR Ranking', 'Trophies']

function LeagueDashboard({ players, matches, champions, bdrPoints }) {
  const [view, setView] = useState('Total Players')

  const standings = computeStandings(players, matches).slice(0, 10)
  const bdrLeaderboard = aggregateBdr(bdrPoints).slice(0, 10)
  const recentChampions = [...champions]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 10)

  return (
    <section className="section">
      <div className="section-head">
        <h2>League snapshot</h2>
      </div>
      <div className="format-tabs">
        {VIEWS.map((v) => (
          <button
            key={v}
            className={`format-tab ${view === v ? 'active' : ''}`}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'Total Players' && (
        <div className="grid">
          {players.slice(0, 12).map((p) => (
            <Link to={`/players/${p.id}`} key={p.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ background: colorFromName(p.name), width: 34, height: 34, fontSize: 14 }}>
                  {initials(p.name)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{p.name}</h3>
                  <div className="meta">{p.team || 'No team'}</div>
                </div>
              </div>
            </Link>
          ))}
          {players.length === 0 && <p className="empty-state">No players registered yet.</p>}
        </div>
      )}

      {view === 'League Table' && (
        <div className="table-wrap">
          <table className="rank-table">
            <thead><tr><th>#</th><th>Player</th><th>Pld</th><th>Pts</th></tr></thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.id}>
                  <td className="rank-cell">{s.rank}</td>
                  <td className="player-name">{s.name}</td>
                  <td>{s.played}</td>
                  <td>{s.points}</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr><td colSpan="4" className="empty-state">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'BDR Ranking' && (
        <div className="table-wrap">
          <table className="rank-table">
            <thead><tr><th>#</th><th>Player</th><th>Trophies</th><th>BDR Points</th></tr></thead>
            <tbody>
              {bdrLeaderboard.map((b) => (
                <tr key={b.playerId}>
                  <td className="rank-cell">{b.rank}</td>
                  <td className="player-name">{b.playerName}</td>
                  <td>{b.trophies}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{b.points}</td>
                </tr>
              ))}
              {bdrLeaderboard.length === 0 && (
                <tr><td colSpan="4" className="empty-state">No BDR points recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'Trophies' && (
        <>
          {recentChampions.length === 0 && <p className="empty-state">No champions recorded yet.</p>}
          {recentChampions.map((c) => (
            <div className="champion-card" key={c.id}>
              <div className="champion-trophy">🏆</div>
              <div className="champion-info">
                <h3>{c.championName}</h3>
                <div className="meta">{c.tournamentName} {c.date && `· ${c.date}`}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  )
}

export default function Home() {
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')
  const { data: champions } = useCollection('champions')
  const { data: bdrPoints } = useCollection('bdrPoints')

  const standings = computeStandings(players, matches)
  const top3 = standings.slice(0, 3)

  const recent = [...matches]
    .filter((m) => m.completed && !m.isBye)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5)

  return (
    <>
      <section className="hero">
        <div className="watermark">JOGA BONITO</div>
        <div className="eyebrow">Live standings</div>
        <h1>Joga Bonito Ranking</h1>
        <p className="lede">
          Every fixture, every result, one automated table. Track players, tournament formats and
          who's really on top this season.
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

      {!pLoad && players.length > 0 && (
        <LeagueDashboard players={players} matches={matches} champions={champions} bdrPoints={bdrPoints} />
      )}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {m.format && <span className={`format-badge format-${formatSlug(m.format)}`}>{m.format}</span>}
              <div className="status">{m.tournamentName || 'Friendly'}</div>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

export function formatSlug(format) {
  return (format || 'other').toLowerCase().replace(/\s+/g, '-')
}
