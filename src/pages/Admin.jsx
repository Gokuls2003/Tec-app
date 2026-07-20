import { useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'
import { pairKnockoutRound, roundRobinPairs, makeGroups, roundLabel } from '../utils/fixtureGenerator.js'
import { TOURNAMENT_TYPES, BDR_POINTS } from '../utils/bdr.js'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Login failed — check your email and password.')
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Admin login</h2>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit">Log in</button>
      </form>
    </section>
  )
}

function AddPlayer() {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [position, setPosition] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await addDoc(collection(db, 'players'), { name, team, position, createdAt: Date.now() })
    setName('')
    setTeam('')
    setPosition('')
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Add player</h3>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Player name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Team (optional)</label>
          <input value={team} onChange={(e) => setTeam(e.target.value)} />
        </div>
        <div>
          <label>Position (optional)</label>
          <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Forward, GK" />
        </div>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add player'}
        </button>
      </form>
    </div>
  )
}

function AddFixture({ players }) {
  const [tournamentName, setTournamentName] = useState('')
  const [format, setFormat] = useState(TOURNAMENT_TYPES[0])
  const [round, setRound] = useState('')
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (player1Id === player2Id) return
    setSaving(true)
    const p1 = players.find((p) => p.id === player1Id)
    const p2 = players.find((p) => p.id === player2Id)
    await addDoc(collection(db, 'matches'), {
      tournamentName, format, round,
      player1Id, player1Name: p1?.name || '',
      player2Id, player2Name: p2?.name || '',
      date, completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
    })
    setRound('')
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Add single fixture (manual)</h3>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Tournament name</label>
          <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="e.g. Joga Bonito Summer Cup" />
        </div>
        <div>
          <label>Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {TOURNAMENT_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label>Round (optional)</label>
          <input value={round} onChange={(e) => setRound(e.target.value)} placeholder="e.g. Semi-final" />
        </div>
        <div>
          <label>Player 1</label>
          <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)} required>
            <option value="">Select player</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label>Player 2</label>
          <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)} required>
            <option value="">Select player</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add fixture'}
        </button>
      </form>
    </div>
  )
}

function AutoFixtureGenerator({ players }) {
  const [tournamentName, setTournamentName] = useState('')
  const [format, setFormat] = useState(TOURNAMENT_TYPES[0])
  const [structure, setStructure] = useState('knockout')
  const [groupSize, setGroupSize] = useState(4)
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2)
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const toggle = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    const selected = players.filter((p) => selectedIds.includes(p.id))

    if (selected.length < 2) { setMessage('Select at least 2 players.'); return }
    if (structure === 'group' && selected.length < groupSize * 2) {
      setMessage(`Select at least ${groupSize * 2} players for at least 2 groups.`); return
    }
    if (!tournamentName.trim()) { setMessage('Enter a tournament name.'); return }

    setSaving(true)

    if (structure === 'league') {
      const pairs = roundRobinPairs(selected)
      for (const [p1, p2] of pairs) {
        await addDoc(collection(db, 'matches'), {
          tournamentName, format, round: 'Round Robin', structure: 'league',
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
        })
      }
      setMessage(`Generated ${pairs.length} round-robin fixtures.`)
    }

    if (structure === 'knockout') {
      const { pairs, byePlayer } = pairKnockoutRound(selected)
      const label = roundLabel(selected.length)
      for (const [p1, p2] of pairs) {
        await addDoc(collection(db, 'matches'), {
          tournamentName, format, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
        })
      }
      if (byePlayer) {
        await addDoc(collection(db, 'matches'), {
          tournamentName, format, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
          date: '', completed: true, isBye: true, score1: 1, score2: 0, motm: null, createdAt: Date.now(),
        })
      }
      setMessage(`Generated ${label} bracket with ${pairs.length} matches${byePlayer ? ' + 1 bye' : ''}.`)
    }

    if (structure === 'group') {
      const groups = makeGroups(selected, Number(groupSize))
      let count = 0
      for (let gi = 0; gi < groups.length; gi++) {
        const pairs = roundRobinPairs(groups[gi])
        for (const [p1, p2] of pairs) {
          await addDoc(collection(db, 'matches'), {
            tournamentName, format, round: `Group ${String.fromCharCode(65 + gi)}`,
            structure: 'group', groupIndex: gi, qualifiersPerGroup: Number(qualifiersPerGroup),
            player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
            date: '', completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
          })
          count += 1
        }
      }
      setMessage(`Generated ${groups.length} groups, ${count} fixtures total.`)
    }

    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Auto fixture generator 🎲</h3>
      <form className="form-grid" onSubmit={submit} style={{ maxWidth: 480 }}>
        <div>
          <label>Tournament name</label>
          <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required />
        </div>
        <div>
          <label>Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {TOURNAMENT_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label>Structure</label>
          <select value={structure} onChange={(e) => setStructure(e.target.value)}>
            <option value="knockout">Knockout</option>
            <option value="group">Group Stage + Knockout</option>
            <option value="league">League (Round Robin)</option>
          </select>
        </div>
        {structure === 'group' && (
          <>
            <div>
              <label>Players per group</label>
              <input type="number" min="2" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} />
            </div>
            <div>
              <label>Qualifiers per group (advance to knockout)</label>
              <input type="number" min="1" value={qualifiersPerGroup} onChange={(e) => setQualifiersPerGroup(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <label>Select players ({selectedIds.length} selected)</label>
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 4, padding: 8 }}>
            {players.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 14, color: 'var(--text)', padding: '4px 0' }}>
                <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} style={{ width: 'auto' }} />
                {p.name}
              </label>
            ))}
            {players.length === 0 && <p className="empty-state">Add players first.</p>}
          </div>
        </div>
        {message && <p className="error-text" style={{ color: 'var(--league)' }}>{message}</p>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Generating…' : 'Generate fixtures'}
        </button>
      </form>
    </div>
  )
}

function TournamentProgress({ players, matches }) {
  const tournaments = [...new Set(matches.filter((m) => m.structure).map((m) => m.tournamentName))]
  if (tournaments.length === 0) return null

  const generateNextRound = async (tournamentName) => {
    const koMatches = matches.filter((m) => m.tournamentName === tournamentName && m.structure === 'knockout')
    const maxStage = Math.max(...koMatches.map((m) => m.stageOrder || 1))
    const currentRound = koMatches.filter((m) => (m.stageOrder || 1) === maxStage)
    if (!currentRound.every((m) => m.completed)) {
      alert('Not all matches in the current round are scored yet.')
      return
    }
    const winners = currentRound.map((m) => {
      if (m.isBye) return { id: m.player1Id, name: m.player1Name }
      if (Number(m.score1) > Number(m.score2)) return { id: m.player1Id, name: m.player1Name }
      if (Number(m.score2) > Number(m.score1)) return { id: m.player2Id, name: m.player2Name }
      return null
    }).filter(Boolean)

    if (winners.length <= 1) {
      alert(`🏆 Tournament complete! Champion: ${winners[0]?.name}. Record the result using "Record tournament result" above.`)
      return
    }

    const { pairs, byePlayer } = pairKnockoutRound(winners)
    const label = roundLabel(winners.length)
    const nextStage = maxStage + 1
    const sampleFormat = currentRound[0].format

    for (const [p1, p2] of pairs) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, format: sampleFormat, round: label, structure: 'knockout', stageOrder: nextStage,
        player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
        date: '', completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
      })
    }
    if (byePlayer) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, format: sampleFormat, round: label, structure: 'knockout', stageOrder: nextStage,
        player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
        date: '', completed: true, isBye: true, score1: 1, score2: 0, motm: null, createdAt: Date.now(),
      })
    }
  }

  const generateKnockoutFromGroups = async (tournamentName) => {
    const groupMatches = matches.filter((m) => m.tournamentName === tournamentName && m.structure === 'group')
    if (!groupMatches.every((m) => m.completed)) {
      alert('Not all group matches are scored yet.')
      return
    }
    const qualifiersPerGroup = groupMatches[0]?.qualifiersPerGroup || 2
    const groupIndexes = [...new Set(groupMatches.map((m) => m.groupIndex))]
    let qualifiers = []
    groupIndexes.forEach((gi) => {
      const gMatches = groupMatches.filter((m) => m.groupIndex === gi)
      const idsInGroup = new Set()
      gMatches.forEach((m) => { idsInGroup.add(m.player1Id); idsInGroup.add(m.player2Id) })
      const groupPlayers = players.filter((p) => idsInGroup.has(p.id))
      const standings = computeStandings(groupPlayers, gMatches)
      qualifiers.push(...standings.slice(0, qualifiersPerGroup).map((s) => ({ id: s.id, name: s.name })))
    })

    const { pairs, byePlayer } = pairKnockoutRound(qualifiers)
    const label = roundLabel(qualifiers.length)
    const sampleFormat = groupMatches[0].format

    for (const [p1, p2] of pairs) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, format: sampleFormat, round: label, structure: 'knockout', stageOrder: 1,
        player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
        date: '', completed: false, score1: null, score2: null, motm: null, createdAt: Date.now(),
      })
    }
    if (byePlayer) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, format: sampleFormat, round: label, structure: 'knockout', stageOrder: 1,
        player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
        date: '', completed: true, isBye: true, score1: 1, score2: 0, motm: null, createdAt: Date.now(),
      })
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Tournament progress</h3>
      {tournaments.map((t) => {
        const hasGroups = matches.some((m) => m.tournamentName === t && m.structure === 'group')
        const hasKnockout = matches.some((m) => m.tournamentName === t && m.structure === 'knockout')
        const groupsDone = hasGroups && matches
          .filter((m) => m.tournamentName === t && m.structure === 'group')
          .every((m) => m.completed)

        return (
          <div key={t} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{t}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasGroups && !hasKnockout && (
                <button className="btn secondary" disabled={!groupsDone} onClick={() => generateKnockoutFromGroups(t)}>
                  {groupsDone ? 'Generate knockout stage' : 'Group matches still in progress'}
                </button>
              )}
              {hasKnockout && (
                <button className="btn secondary" onClick={() => generateNextRound(t)}>
                  Generate next round
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PlayerChecklist({ players, selectedIds, onToggle, label }) {
  return (
    <div>
      <label>{label} ({selectedIds.length} selected)</label>
      <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 4, padding: 8 }}>
        {players.map((p) => (
          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 14, color: 'var(--text)', padding: '4px 0' }}>
            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => onToggle(p.id)} style={{ width: 'auto' }} />
            {p.name}
          </label>
        ))}
        {players.length === 0 && <p className="empty-state">No players available.</p>}
      </div>
    </div>
  )
}

function RecordTournamentResult({ players }) {
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentType, setTournamentType] = useState(TOURNAMENT_TYPES[0])
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const teamNames = [...new Set(players.map((p) => p.team).filter(Boolean))]
  const [winningTeam, setWinningTeam] = useState('')
  const [runnerUpTeam, setRunnerUpTeam] = useState('')
  const [thirdTeam, setThirdTeam] = useState('')
  const [fourthTeam, setFourthTeam] = useState('')

  const [winnerIds, setWinnerIds] = useState([])
  const [runnerUpIds, setRunnerUpIds] = useState([])
  const [thirdFourthIds, setThirdFourthIds] = useState([])
  const [quarterfinalistIds, setQuarterfinalistIds] = useState([])
  const [goldenBootIds, setGoldenBootIds] = useState([])
  const [goldenBootGoals, setGoldenBootGoals] = useState('')
  const [groupTopperId, setGroupTopperId] = useState('')

  const toggle = (setter) => (id) => {
    setter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const isTeamLeague = tournamentType === 'Team League'
  const isUCL = tournamentType === 'Invictus UCL'
  const table = BDR_POINTS[tournamentType]

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!tournamentName.trim()) { setMessage('Enter a tournament name.'); return }
    setSaving(true)

    const bdrEntries = []
    let championLabel = ''

    if (isTeamLeague) {
      if (!winningTeam) { setMessage('Select the winning team.'); setSaving(false); return }
      const addTeamPoints = (teamName, points, reason) => {
        if (!teamName) return
        players.filter((p) => p.team === teamName).forEach((p) => {
          bdrEntries.push({ playerId: p.id, playerName: p.name, points, reason })
        })
      }
      addTeamPoints(winningTeam, table.winner, `Team League Winner (${winningTeam})`)
      addTeamPoints(runnerUpTeam, table.runnerUp, `Team League Runner-up (${runnerUpTeam})`)
      addTeamPoints(thirdTeam, table.third, `Team League 3rd (${thirdTeam})`)
      addTeamPoints(fourthTeam, table.fourth, `Team League 4th (${fourthTeam})`)
      championLabel = winningTeam
    } else {
      const byId = (id) => players.find((p) => p.id === id)
      winnerIds.forEach((id) => {
        const p = byId(id)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.winner, reason: 'Winner' })
      })
      runnerUpIds.forEach((id) => {
        const p = byId(id)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.runnerUp, reason: 'Runner-up' })
      })
      thirdFourthIds.forEach((id) => {
        const p = byId(id)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.thirdFourth, reason: '3rd/4th place' })
      })
      quarterfinalistIds.forEach((id) => {
        const p = byId(id)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.quarterfinal, reason: 'Quarterfinal (R8)' })
      })
      goldenBootIds.forEach((id) => {
        const p = byId(id)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.goldenBoot, reason: `Golden Boot (${goldenBootGoals || 0} goals)` })
      })
      if (isUCL && groupTopperId) {
        const p = byId(groupTopperId)
        if (p) bdrEntries.push({ playerId: p.id, playerName: p.name, points: table.groupTopBonus, reason: 'Group stage top finisher bonus' })
      }
      championLabel = winnerIds.map((id) => byId(id)?.name).filter(Boolean).join(' & ')
    }

    if (bdrEntries.length === 0) {
      setMessage('Select at least a winner before saving.')
      setSaving(false)
      return
    }

    for (const entry of bdrEntries) {
      await addDoc(collection(db, 'bdrPoints'), {
        ...entry, tournamentName, tournamentType, date, createdAt: Date.now(),
      })
    }

    if (championLabel) {
      await addDoc(collection(db, 'champions'), {
        tournamentName, format: tournamentType, championName: championLabel, date, createdAt: Date.now(),
      })
    }

    setMessage(`Saved — ${bdrEntries.length} BDR point entries recorded.`)
    setTournamentName('')
    setWinningTeam(''); setRunnerUpTeam(''); setThirdTeam(''); setFourthTeam('')
    setWinnerIds([]); setRunnerUpIds([]); setThirdFourthIds([]); setQuarterfinalistIds([])
    setGoldenBootIds([]); setGoldenBootGoals(''); setGroupTopperId('')
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Record tournament result & BDR points 🏆</h3>
      <form className="form-grid" onSubmit={submit} style={{ maxWidth: 480 }}>
        <div>
          <label>Tournament name</label>
          <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required />
        </div>
        <div>
          <label>Tournament type</label>
          <select value={tournamentType} onChange={(e) => setTournamentType(e.target.value)}>
            {TOURNAMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {isTeamLeague ? (
          <>
            <div>
              <label>Winning team ({table.winner} pts each player)</label>
              <select value={winningTeam} onChange={(e) => setWinningTeam(e.target.value)}>
                <option value="">Select team</option>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Runner-up team ({table.runnerUp} pts each player)</label>
              <select value={runnerUpTeam} onChange={(e) => setRunnerUpTeam(e.target.value)}>
                <option value="">Select team</option>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>3rd place team ({table.third} pts each player)</label>
              <select value={thirdTeam} onChange={(e) => setThirdTeam(e.target.value)}>
                <option value="">Select team</option>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>4th place team ({table.fourth} pts each player)</label>
              <select value={fourthTeam} onChange={(e) => setFourthTeam(e.target.value)}>
                <option value="">Select team</option>
                {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <PlayerChecklist players={players} selectedIds={winnerIds} onToggle={toggle(setWinnerIds)} label={`Winner(s) (${table.winner} pts each)`} />
            <PlayerChecklist players={players} selectedIds={runnerUpIds} onToggle={toggle(setRunnerUpIds)} label={`Runner-up(s) (${table.runnerUp} pts each)`} />
            <PlayerChecklist players={players} selectedIds={thirdFourthIds} onToggle={toggle(setThirdFourthIds)} label={`3rd/4th place (${table.thirdFourth} pts each)`} />
            <PlayerChecklist players={players} selectedIds={quarterfinalistIds} onToggle={toggle(setQuarterfinalistIds)} label={`Quarterfinalists / R8 (${table.quarterfinal} pts each)`} />
            <PlayerChecklist players={players} selectedIds={goldenBootIds} onToggle={toggle(setGoldenBootIds)} label={`Golden Boot (${table.goldenBoot} pts each)`} />
            <div>
              <label>Golden Boot goals scored</label>
              <input type="number" value={goldenBootGoals} onChange={(e) => setGoldenBootGoals(e.target.value)} />
            </div>
            {isUCL && (
              <div>
                <label>Group stage top finisher (+{table.groupTopBonus} bonus pts)</label>
                <select value={groupTopperId} onChange={(e) => setGroupTopperId(e.target.value)}>
                  <option value="">None</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        {message && <p className="error-text" style={{ color: 'var(--league)' }}>{message}</p>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save result & award BDR points'}
        </button>
      </form>
    </div>
  )
}

function FixtureResultRow({ match }) {
  const [score1, setScore1] = useState(match.score1 ?? '')
  const [score2, setScore2] = useState(match.score2 ?? '')
  const [motm, setMotm] = useState(match.motm || '')

  const saveResult = async () => {
    if (score1 === '' || score2 === '') return
    await updateDoc(doc(db, 'matches', match.id), {
      score1: Number(score1), score2: Number(score2), completed: true, motm: motm || null,
    })
  }

  const removeFixture = async () => {
    await deleteDoc(doc(db, 'matches', match.id))
  }

  if (match.isBye) {
    return (
      <div className="fixture-card">
        <div className="players">
          <span>{match.player1Name}</span>
          <span className="score">BYE</span>
        </div>
        <div className="status">{match.round}</div>
      </div>
    )
  }

  return (
    <div className="fixture-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div className="players">
          <span>{match.player1Name}</span>
          <input type="number" value={score1} onChange={(e) => setScore1(e.target.value)} style={{ width: 56 }} />
          <span>–</span>
          <input type="number" value={score2} onChange={(e) => setScore2(e.target.value)} style={{ width: 56 }} />
          <span>{match.player2Name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={saveResult}>Save result</button>
          <button className="btn secondary" onClick={removeFixture}>Delete</button>
        </div>
      </div>
      <div className="meta" style={{ marginTop: 4 }}>{match.tournamentName} {match.round && `· ${match.round}`}</div>
      <div style={{ marginTop: 10, maxWidth: 240 }}>
        <label>MOTM (optional)</label>
        <select value={motm} onChange={(e) => setMotm(e.target.value)}>
          <option value="">None selected</option>
          <option value={match.player1Id}>{match.player1Name}</option>
          <option value={match.player2Id}>{match.player2Name}</option>
        </select>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { data: players } = useCollection('players')
  const { data: matches } = useCollection('matches')

  return (
    <section className="section">
      <div className="section-head">
        <h2>Admin</h2>
        <button className="btn secondary" onClick={() => signOut(auth)}>Log out</button>
      </div>

      <AddPlayer />
      <AutoFixtureGenerator players={players} />
      <TournamentProgress players={players} matches={matches} />
      <AddFixture players={players} />
      <RecordTournamentResult players={players} />

      <div className="card">
        <h3>Enter results</h3>
        {matches.length === 0 && <p className="empty-state">No fixtures yet — generate some above.</p>}
        {matches.map((m) => <FixtureResultRow key={m.id} match={m} />)}
      </div>
    </section>
  )
}

export default function Admin() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  if (user === undefined) {
    return <p className="empty-state">Checking session…</p>
  }

  return user ? <AdminDashboard /> : <LoginForm />
}
