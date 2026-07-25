function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nextPowerOfTwo(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function roundLabel(bracketSize) {
  if (bracketSize <= 2) return 'Final'
  if (bracketSize <= 4) return 'Semifinal'
  if (bracketSize <= 8) return 'Quarterfinal'
  return `Round of ${bracketSize}`
}

// Pairs up any number of players into a knockout round, padding to the next
// bracket size (16/32/64/128/256...) with byes as needed so every round
// stays a clean power-of-two bracket.
export function pairKnockoutRound(players) {
  const shuffled = shuffle(players)
  const size = shuffled.length
  const bracketSize = nextPowerOfTwo(size)
  const byeCount = bracketSize - size

  const byePlayers = shuffled.slice(0, byeCount)
  const toPair = shuffled.slice(byeCount)

  const pairs = []
  for (let i = 0; i < toPair.length; i += 2) {
    pairs.push([toPair[i], toPair[i + 1]])
  }

  return { pairs, byePlayers, bracketSize }
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
