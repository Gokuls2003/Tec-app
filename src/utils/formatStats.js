// Per-format (UCL / Team League / Quick Combat / Co-op Tour) match record for a player.
// Only covers matches tracked match-by-match — historical goal-only entries aren't included
// here since they don't have individual win/loss data.
export function statsByFormat(playerId, matches) {
  const byFormat = {}

  matches.forEach((m) => {
    if (!m.completed || m.isBye) return
    if (m.player1Id !== playerId && m.player2Id !== playerId) return

    const format = m.format || 'Other'
    if (!byFormat[format]) {
      byFormat[format] = { format, played: 0, wins: 0, draws: 0, losses: 0 }
    }

    const isP1 = m.player1Id === playerId
    const gf = Number(isP1 ? m.score1 : m.score2)
    const ga = Number(isP1 ? m.score2 : m.score1)

    byFormat[format].played += 1
    if (gf > ga) byFormat[format].wins += 1
    else if (gf < ga) byFormat[format].losses += 1
    else byFormat[format].draws += 1
  })

  return Object.values(byFormat)
}
