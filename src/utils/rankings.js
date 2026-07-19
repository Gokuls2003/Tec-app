export function computeStandings(players, matches) {
  const table = {}

  players.forEach((p) => {
    table[p.id] = {
      id: p.id,
      name: p.name,
      team: p.team || '',
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }
  })

  matches.forEach((m) => {
    if (!m.completed) return
    const p1 = table[m.player1Id]
    const p2 = table[m.player2Id]
    if (!p1 || !p2) return

    const s1 = Number(m.score1)
    const s2 = Number(m.score2)

    p1.played += 1
    p2.played += 1
    p1.goalsFor += s1
    p1.goalsAgainst += s2
    p2.goalsFor += s2
    p2.goalsAgainst += s1

    if (s1 > s2) {
      p1.wins += 1
      p1.points += 3
      p2.losses += 1
    } else if (s2 > s1) {
      p2.wins += 1
      p2.points += 3
      p1.losses += 1
    } else {
      p1.draws += 1
      p2.draws += 1
      p1.points += 1
      p2.points += 1
    }
  })

  const standings = Object.values(table).map((row) => ({
    ...row,
    goalDiff: row.goalsFor - row.goalsAgainst,
  }))

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.name.localeCompare(b.name)
  })

  return standings.map((row, i) => ({ ...row, rank: i + 1 }))
}
