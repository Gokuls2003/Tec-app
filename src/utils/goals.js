// Combines auto-calculated match goals with manually-entered historical goals
// so the Golden Boot leaderboard covers tournaments played before/after tracking began.
export function combineGoalTotals(players, matches, manualGoals) {
  const totals = {}
  players.forEach((p) => {
    totals[p.id] = { id: p.id, name: p.name, goals: 0 }
  })

  matches.forEach((m) => {
    if (!m.completed || m.isBye) return
    if (totals[m.player1Id]) totals[m.player1Id].goals += Number(m.score1) || 0
    if (totals[m.player2Id]) totals[m.player2Id].goals += Number(m.score2) || 0
  })

  manualGoals.forEach((g) => {
    if (totals[g.playerId]) totals[g.playerId].goals += Number(g.goals) || 0
  })

  return Object.values(totals)
    .filter((t) => t.goals > 0)
    .sort((a, b) => b.goals - a.goals)
}
