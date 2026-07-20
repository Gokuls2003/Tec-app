export function getPlayerMatches(playerId, matches) {
  return matches
    .filter((m) => m.completed && (m.player1Id === playerId || m.player2Id === playerId))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export function computePlayerStats(playerId, matches) {
  const pm = getPlayerMatches(playerId, matches)
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0
  const form = []

  pm.forEach((m) => {
    const isP1 = m.player1Id === playerId
    const gf = Number(isP1 ? m.score1 : m.score2)
    const ga = Number(isP1 ? m.score2 : m.score1)
    goalsFor += gf
    goalsAgainst += ga
    if (ga === 0) cleanSheets += 1
    if (gf > ga) { wins += 1; form.push('W') }
    else if (gf < ga) { losses += 1; form.push('L') }
    else { draws += 1; form.push('D') }
  })

  const played = pm.length
  const winRate = played ? Math.round((wins / played) * 100) : 0

  let streak = 0
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i] === 'W') streak += 1
    else break
  }

  return {
    played, wins, draws, losses, goalsFor, goalsAgainst, winRate, cleanSheets, streak,
    recentForm: form.slice(-5),
    matches: pm,
  }
}

export function motmCount(playerId, matches) {
  return matches.filter((m) => m.motm === playerId).length
}
