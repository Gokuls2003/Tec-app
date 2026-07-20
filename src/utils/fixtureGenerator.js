function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function roundLabel(playerCount) {
  if (playerCount <= 2) return 'Final'
  if (playerCount <= 4) return 'Semifinal'
  if (playerCount <= 8) return 'Quarterfinal'
  return `Round of ${playerCount}`
}

// Randomly pairs players for a knockout round. Odd count -> one bye.
export function pairKnockoutRound(players) {
  const shuffled = shuffle(players)
  let byePlayer = null
  if (shuffled.length % 2 === 1) {
    byePlayer = shuffled.pop()
  }
  const pairs = []
  for (let i = 0; i < shuffled.length; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]])
  }
  return { pairs, byePlayer }
}

// Every player plays every other player once.
export function roundRobinPairs(players) {
  const pairs = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }
  return pairs
}

// Randomly splits players into groups of the given size.
export function makeGroups(players, groupSize = 4) {
  const shuffled = shuffle(players)
  const groups = []
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize))
  }
  return groups
}
