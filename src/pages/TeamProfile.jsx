import { useParams, Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'
import { colorFromName, initials } from '../utils/avatar.js'

export default function TeamProfile() {
  const { name } = useParams()
  const teamName = decodeURIComponent(name)
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')

  const squad = players.filter((p) => p.team === teamName)
  const standings = computeStandings(players, matches).filter((s) =>
    squad.some((p) => p.id === s.id)
  )
  const totalPoints = standings.reduce((sum, s) => sum + s.points, 0)
  const totalGoals = standings.reduce((sum, s) => sum + s.goalsFor, 0)

  if (pLoad || mLoad) return <p className="empty-state">Loading team…</p>

  return (
    <section className="section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="avatar avatar-lg" style={{ background: colorFromName(teamName) }}>
          {initials(teamName)}
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 40, margin: 0 }}>{teamName}</h2>
          <div className="meta">{squad.length} player{squad.length !== 1 ? 's' : ''} · {totalPoints} combined points · {totalGoals} goals</div>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 12 }}>Squad</h3>
      {squad.length === 0 && <p className="empty-state">No players found for this team.</p>}
      <div className="grid">
        {squad.map((p) => (
          <Link to={`/players/${p.id}`} key={p.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ background: colorFromName(p.name) }}>{initials(p.name)}</div>
              <div>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <div className="meta">{p.position || 'Player'}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
