export const TOURNAMENT_TYPES = ['Team League', 'Invictus UCL', 'Quick Combat', 'Co-op Tour']

export const BDR_POINTS = {
  'Team League': { winner: 12, runnerUp: 9, third: 7, fourth: 5 },
  'Invictus UCL': { winner: 15, runnerUp: 12, thirdFourth: 8, quarterfinal: 4, goldenBoot: 6, groupTopBonus: 2 },
  'Quick Combat': { winner: 10, runnerUp: 8, thirdFourth: 5, quarterfinal: 3, goldenBoot: 4 },
  'Co-op Tour': { winner: 10, runnerUp: 7, thirdFourth: 5, quarterfinal: 3, goldenBoot: 4 },
}

export function aggregateBdr(bdrPoints) {
  const totals = {}
  bdrPoints.forEach((entry) => {
    if (!totals[entry.playerId]) {
      totals[entry.playerId] = {
        playerId: entry.playerId,
        playerName: entry.playerName,
        points: 0,
        trophies: 0,
        entries: [],
      }
    }
    totals[entry.playerId].points += Number(entry.points) || 0
    if (entry.reason && entry.reason.toLowerCase().includes('winner')) {
      totals[entry.playerId].trophies += 1
    }
    totals[entry.playerId].entries.push(entry)
  })
  return Object.values(totals)
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}
