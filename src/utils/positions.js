// Maps a finishing position (0-indexed: 0=winner, 1=runner-up, 2&3=3rd/4th, 4-7=R8/quarterfinal)
// to the correct BDR points, and auto-detects the Golden Boot winner from goals entered.

export const POSITION_LABELS = [
  '1st — Winner',
  '2nd — Runner-up',
  '3rd Place',
  '4th Place',
  '5th Place (R8)',
  '6th Place (R8)',
  '7th Place (R8)',
  '8th Place (R8)',
]

export function pointsForPosition(index, table) {
  if (index === 0) return table.winner
  if (index === 1) return table.runnerUp
  if (index === 2 || index === 3) return table.thirdFourth
  return table.quarterfinal
}

export function positionReason(index) {
  return POSITION_LABELS[index]
}

// rows: [{ playerId, playerName, goals }] for the 8 positions.
// Returns the row(s) with the highest goals > 0 (ties all win Golden Boot).
export function detectGoldenBoot(rows) {
  const withGoals = rows.filter((r) => r.playerId && Number(r.goals) > 0)
  if (withGoals.length === 0) return []
  const max = Math.max(...withGoals.map((r) => Number(r.goals)))
  return withGoals.filter((r) => Number(r.goals) === max)
}
