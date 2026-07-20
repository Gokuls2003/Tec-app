import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { computePlayerStats, motmCount } from '../utils/playerStats.js'
import { colorFromName, initials } from '../utils/avatar.js'

function Leaderboard({ title, rows, valueLabel }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontFamily: 'var(--display)', fontSize: 26, marginBottom: 10 }}>{title}</h3>
      {rows.length === 0 && <p className="empty-state">No data yet.</p>}
      {rows.map((r, i) => (
        <Link to={`/players/${r.id}`} key={r.id} className="fixture-card" style={{ textDecoration: 'none' }}>
          <div className="players">
            <span className="rank-cell" style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--gold)', width: 28 }}>
              {i + 1}
            </span>
            <div className="avatar" style={{ background: colorFromName(r.name), width: 32, height: 32, fontSize: 13 }}>
              {initials(r.name)}
            </div>
            <span>{r.name}</span>
          </div>
          <div className="score">{r.value} {valueLabel}</div>
        </Link>
      ))}
    </div>
  )
}

export default function Stats() {
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')

  if (pLoad || mLoad) return <p className="empty-state">Crunching stats…</p>

  const withStats = players.map((p) => ({
    ...p,
    stats: computePlayerStats(p.id, matches),
    motms: motmCount(p.id, matches),
  }))

  const topScorers = [...withStats]
    .filter((p) => p.stats.goalsFor > 0)
    .sort((a, b) => b.stats.goalsFor - a.stats.goalsFor)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, value: p.stats.goalsFor }))

  const cleanSheetLeaders = [...withStats]
    .filter((p) => p.stats.cleanSheets > 0)
    .sort((a, b) => b.stats.cleanSheets - a.stats.cleanSheets)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, value: p.stats.cleanSheets }))

  const motmLeaders = [...withStats]
    .filter((p) => p.motms > 0)
    .sort((a, b) => b.motms - a.motms)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, value: p.motms }))

  const streakLeaders = [...withStats]
    .filter((p) => p.stats.streak > 0)
    .sort((a, b) => b.stats.streak - a.stats.streak)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, value: p.stats.streak }))

  return (
    <section className="section">
      <div className="section-head">
        <h2>Statistics</h2>
        <span className="num">Auto-calculated from results</span>
      </div>
      <Leaderboard title="Golden Boot 🥇" rows={topScorers} valueLabel="goals" />
      <Leaderboard title="Golden Glove 🧤" rows={cleanSheetLeaders} valueLabel="clean sheets" />
      <Leaderboard title="Most MOTM ⭐" rows={motmLeaders} valueLabel="awards" />
      <Leaderboard title="Highest win streak 🔥" rows={streakLeaders} valueLabel="wins" />
    </section>
  )
}
