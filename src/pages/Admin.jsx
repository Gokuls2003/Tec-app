import { useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { useCollection } from '../hooks/useCollection.js'
import { computeStandings } from '../utils/rankings.js'
import { pairKnockoutRound, roundRobinPairs, makeGroups, roundLabel } from '../utils/fixtureGenerator.js'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Login failed — check your email and password.')
    }
  }

  return (
    <section className="section">
      <div className="section-head"><h2>Admin login</h2></div>
      <form className="form-grid" onSubmit={submit}>
        <div><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit">Log in</button>
      </form>
    </section>
  )
}

function BulkAddPlayers() {
  const [namesText, setNamesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    const names = namesText.split(/[\n,]+/).map((n) => n.trim()).filter(Boolean)
    if (names.length === 0) { setMessage('Paste at least one name.'); return }
    setSaving(true)
    for (const name of names) {
      await addDoc(collection(db, 'players'), { name, createdAt: Date.now() })
    }
    setMessage(`Added ${names.length} players.`)
    setNamesText('')
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Add players</h3>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Names (one per line, or comma separated)</label>
          <textarea rows="6" value={namesText} onChange={(e) => setNamesText(e.target.value)} placeholder={'Player One\nPlayer Two\nPlayer Three'} />
        </div>
        {message && <p className="error-text" style={{ color: 'var(--league)' }}>{message}</p>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add players'}</button>
      </form>
    </div>
  )
}

function AutoFixtureGenerator({ players }) {
  const [tournamentName, setTournamentName] = useState('')
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
          tournamentName, round: 'Round Robin', structure: 'league',
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      }
      setMessage(`Generated ${pairs.length} round-robin fixtures.`)
    }

    if (structure === 'knockout') {
      const { pairs, byePlayer } = pairKnockoutRound(selected)
      const label = roundLabel(selected.length)
      for (const [p1, p2] of pairs) {
        await addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      }
      if (byePlayer) {
        await addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
          date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
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
            tournamentName, round: `Group ${String.fromCharCode(65 + gi)}`,
            structure: 'group', groupIndex: gi, qualifiersPerGroup: Number(qualifiersPerGroup),
            player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
            date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
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
        <div><label>Tournament name</label><input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required /></div>
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
            <div><label>Players per group</label><input type="number" min="2" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} /></div>
            <div><label>Qualifiers per group</label><input type="number" min="1" value={qualifiersPerGroup} onChange={(e) => setQualifiersPerGroup(e.target.value)} /></div>
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
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Generating…' : 'Generate fixtures'}</button>
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
    if (!currentRound.every((m) => m.completed)) { alert('Not all matches in the current round are scored yet.'); return }
    const winners = currentRound.map((m) => {
      if (m.isBye) return { id: m.player1Id, name: m.player1Name }
      if (Number(m.score1) > Number(m.score2)) return { id: m.player1Id, name: m.player1Name }
      if (Number(m.score2) > Number(m.score1)) return { id: m.player2Id, name: m.player2Name }
      return null
    }).filter(Boolean)

    if (winners.length <= 1) { alert(`🏆 Tournament complete! Champion: ${winners[0]?.name}`); return }

    const { pairs, byePlayer } = pairKnockoutRound(winners)
    const label = roundLabel(winners.length)
    const nextStage = maxStage + 1

    for (const [p1, p2] of pairs) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, round: label, structure: 'knockout', stageOrder: nextStage,
        player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
        date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
      })
    }
    if (byePlayer) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, round: label, structure: 'knockout', stageOrder: nextStage,
        player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
        date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
      })
    }
  }

  const generateKnockoutFromGroups = async (tournamentName) => {
    const groupMatches = matches.filter((m) => m.tournamentName === tournamentName && m.structure === 'group')
    if (!groupMatches.every((m) => m.completed)) { alert('Not all group matches are scored yet.'); return }
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

    for (const [p1, p2] of pairs) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, round: label, structure: 'knockout', stageOrder: 1,
        player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
        date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
      })
    }
    if (byePlayer) {
      await addDoc(collection(db, 'matches'), {
        tournamentName, round: label, structure: 'knockout', stageOrder: 1,
        player1Id: byePlayer.id, player1Name: byePlayer.name, player2Id: null, player2Name: 'BYE',
        date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
      })
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Tournament progress</h3>
      {tournaments.map((t) => {
        const hasGroups = matches.some((m) => m.tournamentName === t && m.structure === 'group')
        const hasKnockout = matches.some((m) => m.tournamentName === t && m.structure === 'knockout')
        const groupsDone = hasGroups && matches.filter((m) => m.tournamentName === t && m.structure === 'group').every((m) => m.completed)
        return (
          <div key={t} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{t}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasGroups && !hasKnockout && (
                <button className="btn secondary" disabled={!groupsDone} onClick={() => generateKnockoutFromGroups(t)}>
                  {groupsDone ? 'Generate knockout stage' : 'Group matches still in progress'}
                </button>
              )}
              {hasKnockout && <button className="btn secondary" onClick={() => generateNextRound(t)}>Generate next round</button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FixtureResultRow({ match }) {
  const [score1, setScore1] = useState(match.score1 ?? '')
  const [score2, setScore2] = useState(match.score2 ?? '')

  const saveResult = async () => {
    if (score1 === '' || score2 === '') return
    await updateDoc(doc(db, 'matches', match.id), { score1: Number(score1), score2: Number(score2), completed: true })
  }
  const removeFixture = async () => { await deleteDoc(doc(db, 'matches', match.id)) }

  if (match.isBye) {
    return (
      <div className="fixture-card">
        <div className="players"><span>{match.player1Name}</span><span className="score">BYE</span></div>
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
      <BulkAddPlayers />
      <AutoFixtureGenerator players={players} />
      <TournamentProgress players={players} matches={matches} />
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

  if (user === undefined) return <p className="empty-state">Checking session…</p>
  return user ? <AdminDashboard /> : <LoginForm />
                       }
