import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { colorFromName, initials } from '../utils/avatar.js'

export default function Teams() {
  const { data: players, loading } = useCollection('players')

  const teamMap = {}
  players.forEach((p) => {
    const team = p.team?.trim()
    if (!team) return
    teamMap[team] = teamMap[team] || []
    teamMap[team].push(p)
  })
  const teams = Object.entries(teamMap)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Teams</h2>
        <span className="num">{teams.length} teams</span>
      </div>

      {loading && <p className="empty-state">Loading teams…</p>}
      {!loading && teams.length === 0 && (
        <p className="empty-state">No teams yet — set a team when adding players in Admin.</p>
      )}

      <div className="grid">
        {teams.map(([team, squad]) => (
          <Link to={`/teams/${encodeURIComponent(team)}`} key={team} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="avatar" style={{ background: colorFromName(team) }}>{initials(team)}</div>
              <h3 style={{ margin: 0 }}>{team}</h3>
            </div>
            <div className="meta">{squad.length} player{squad.length !== 1 ? 's' : ''}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
