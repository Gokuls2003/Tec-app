
import { useParams, Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection.js'
import { computePlayerStats, motmCount } from '../utils/playerStats.js'
import { initials, colorFromName } from '../utils/avatar.js'
import { formatSlug } from './Home.jsx'

export default function PlayerProfile() {
  const { id } = useParams()
  const { data: players, loading: pLoad } = useCollection('players')
  const { data: matches, loading: mLoad } = useCollection('matches')
  const { data: champions } = useCollection('champions')
  const { data: manualGoals } = useCollection('manualGoals')

  const player = players.find((p) => p.id === id)

  if (pLoad || mLoad) return <p className="empty-state">Loading player…</p>
  if (!player) return <p className="empty-state">Player not found.</p>

  const stats = computePlayerStats(id, matches)
  const motms = motmCount(id, matches)
  const trophies = champions.filter((c) => c.championName === player.name)
  const manualGoalsTotal = manualGoals
    .filter((g) => g.playerId === id)
    .reduce((sum, g) => sum + (Number(g.goals) || 0), 0)
  const totalGoals = stats.goalsFor + manualGoalsTotal

  return (
    <section className="section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        <div className="avatar avatar-lg" style={{ background: colorFromName(player.name) }}>
          {initials(player.name)}
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 40, margin: 0 }}>{player.name}</h2>
          <div className="meta">
            {player.team || 'No team'} {player.position && `· ${player.position}`}
          </div>
          {stats.recentForm.length > 0 && (
            <div className="form-pips" style={{ marginTop: 8 }}>
              {stats.recentForm.map((r, i) => (
                <span key={i} className={`form-pip ${r.toLowerCase()}`}>{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginBottom: 32 }}>
        {[
          ['Played', stats.played],
          ['Wins', stats.wins],
          ['Draws', stats.draws],
          ['Losses', stats.losses],
          ['Win rate', `${stats.winRate}%`],
          ['Total goals', totalGoals],
          ['Goals against', stats.goalsAgainst],
          ['Clean sheets', stats.cleanSheets],
          ['Win streak', stats.streak],
          ['MOTM awards', motms],
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <div className="meta">{label}</div>
            <h3>{value}</h3>
          </div>
        ))}
      </div>

      {trophies.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 26, marginBottom: 12 }}>Trophies 🏆</h3>
          {trophies.map((t) => (
            <div className="champion-card" key={t.id}>
              <div className="champion-trophy">🏆</div>
              <div className="champion-info">
                <h3>{t.tournamentName}</h3>
                <div className="meta">
                  {t.format && (
                    <span className={`format-badge format-${formatSlug(t.format)}`} style={{ marginRight: 8 }}>
                      {t.format}
                    </span>
                  )}
                  {t.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 26, marginBottom: 12 }}>Match history</h3>
        {stats.matches.length === 0 && <p className="empty-state">No matches played yet.</p>}
        {[...stats.matches].reverse().map((m) => {
          const isP1 = m.player1Id === id
          const opponent = isP1 ? m.player2Name : m.player1Name
          const gf = isP1 ? m.score1 : m.score2
          const ga = isP1 ? m.score2 : m.score1
          return (
            <div className="fixture-card" key={m.id}>
              <div className="players">
                <span>vs {opponent}</span>
                <span className="score">{gf} – {ga}</span>
              </div>
              <div className="status">{m.tournamentName || 'Friendly'}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
