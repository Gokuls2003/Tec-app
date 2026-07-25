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
  writeBatch
} from "firebase/firestore";
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
  e.preventDefault();
  setMessage("");

  // Remove empty lines and duplicate names
  const names = [...new Set(
    namesText
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(Boolean)
  )];

  if (names.length === 0) {
    setMessage("Paste at least one player.");
    return;
  }

  setSaving(true);
  setMessage(`Adding ${names.length} players...`);

  try {
  const batchSize = 500;
  const promises = [];

  for (let i = 0; i < names.length; i += batchSize) {
    const batch = writeBatch(db);

    names.slice(i, i + batchSize).forEach((name) => {
      batch.set(doc(collection(db, "players")), {
        name,
        createdAt: Date.now(),
      });
    });

    promises.push(batch.commit());
  }

  await Promise.all(promises);

  setMessage(`✅ Successfully added ${names.length} players.`);
  setNamesText("");

} catch (err) {
  console.error(err);
  alert(err.message);
  setMessage(err.message);
} finally {
  setSaving(false);
  }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Add players</h3>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Names (one per line, or comma separated)</label>
          <textarea rows="8" value={namesText} onChange={(e) => setNamesText(e.target.value)} placeholder={'Player One\nPlayer Two\nPlayer Three'} />
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
  const selectAll = () => setSelectedIds(players.map((p) => p.id))
  const clearAll = () => setSelectedIds([])

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
    setMessage('Generating fixtures…')

    if (structure === 'league') {
      const pairs = roundRobinPairs(selected)
      await Promise.all(pairs.map(([p1, p2]) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: 'Round Robin', structure: 'league',
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      ))
      setMessage(`Generated ${pairs.length} round-robin fixtures.`)
    }

    if (structure === 'knockout') {
      const { pairs, byePlayers, bracketSize } = pairKnockoutRound(selected)
      const label = roundLabel(bracketSize)
      await Promise.all([
        ...pairs.map(([p1, p2]) =>
          addDoc(collection(db, 'matches'), {
            tournamentName, round: label, structure: 'knockout', stageOrder: 1,
            player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
            date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
          })
        ),
        ...byePlayers.map((p) =>
          addDoc(collection(db, 'matches'), {
            tournamentName, round: label, structure: 'knockout', stageOrder: 1,
            player1Id: p.id, player1Name: p.name, player2Id: null, player2Name: 'BYE',
            date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
          })
        ),
      ])
      setMessage(`Generated ${label} bracket (${bracketSize} slots): ${pairs.length} matches${byePlayers.length ? ` + ${byePlayers.length} byes` : ''}.`)
    }

    if (structure === 'group') {
      const groups = makeGroups(selected, Number(groupSize))
      const allPairs = []
      groups.forEach((group, gi) => {
        roundRobinPairs(group).forEach(([p1, p2]) => {
          allPairs.push({ p1, p2, gi })
        })
      })
      await Promise.all(allPairs.map(({ p1, p2, gi }) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: `Group ${String.fromCharCode(65 + gi)}`,
          structure: 'group', groupIndex: gi, qualifiersPerGroup: Number(qualifiersPerGroup),
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      ))
      setMessage(`Generated ${groups.length} groups, ${allPairs.length} fixtures total.`)
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
            <option value="knockout">Knockout (any size — 16/32/64/128/256...)</option>
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button type="button" className="btn secondary" onClick={selectAll}>Select all</button>
            <button type="button" className="btn secondary" onClick={clearAll}>Clear</button>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 4, padding: 8 }}>
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

    if (winners.length <= 1) { alert(`🏆 Tournament complete! Champion: ${winners[0]?.name}. Record it in "Record tournament result" below.`); return }

    const { pairs, byePlayers, bracketSize } = pairKnockoutRound(winners)
    const label = roundLabel(bracketSize)
    const nextStage = maxStage + 1

    await Promise.all([
      ...pairs.map(([p1, p2]) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: nextStage,
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      ),
      ...byePlayers.map((p) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: nextStage,
          player1Id: p.id, player1Name: p.name, player2Id: null, player2Name: 'BYE',
          date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
        })
      ),
    ])
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

    const { pairs, byePlayers, bracketSize } = pairKnockoutRound(qualifiers)
    const label = roundLabel(bracketSize)

    await Promise.all([
      ...pairs.map(([p1, p2]) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: p1.id, player1Name: p1.name, player2Id: p2.id, player2Name: p2.name,
          date: '', completed: false, score1: null, score2: null, createdAt: Date.now(),
        })
      ),
      ...byePlayers.map((p) =>
        addDoc(collection(db, 'matches'), {
          tournamentName, round: label, structure: 'knockout', stageOrder: 1,
          player1Id: p.id, player1Name: p.name, player2Id: null, player2Name: 'BYE',
          date: '', completed: true, isBye: true, score1: 1, score2: 0, createdAt: Date.now(),
        })
      ),
    ])
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

const POSITION_LABELS = ['1st (Winner)', '2nd (Runner-up)', '3rd', '4th', '5th', '6th', '7th', '8th']

function RecordTournamentResult({ players }) {
  const [tournamentName, setTournamentName] = useState('')
  const [date, setDate] = useState('')
  const [rows, setRows] = useState(POSITION_LABELS.map(() => ({ playerId: '', goals: '' })))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const updateRow = (i, field, value) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!tournamentName.trim()) { setMessage('Enter a tournament name.'); return }

    const byId = (id) => players.find((p) => p.id === id)
    const positions = rows
      .map((r, i) => ({
        position: i + 1,
        label: POSITION_LABELS[i],
        playerId: r.playerId,
        playerName: byId(r.playerId)?.name || '',
        goals: Number(r.goals) || 0,
      }))
      .filter((r) => r.playerId)

    if (positions.length === 0) { setMessage('Fill in at least the winner.'); return }

    setSaving(true)
    await addDoc(collection(db, 'tournamentResults'), {
      tournamentName, date, positions, createdAt: Date.now(),
    })
    setMessage(`Saved result for ${tournamentName} — ${positions.length} positions recorded.`)
    setTournamentName(''); setDate('')
    setRows(POSITION_LABELS.map(() => ({ playerId: '', goals: '' })))
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Record tournament result 🏆</h3>
      <p className="meta" style={{ marginBottom: 12 }}>
        Enter final placings and goals scored. The highest goal count is automatically marked Golden Boot for this tournament.
      </p>
      <form className="form-grid" onSubmit={submit} style={{ maxWidth: 520 }}>
        <div><label>Tournament name</label><input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required /></div>
        <div><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>

        {POSITION_LABELS.map((label, i) => (
          <div key={label} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 2 }}>
              <label>{label}</label>
              <select value={rows[i].playerId} onChange={(e) => updateRow(i, 'playerId', e.target.value)}>
                <option value="">Select player</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Goals</label>
              <input type="number" value={rows[i].goals} onChange={(e) => updateRow(i, 'goals', e.target.value)} />
            </div>
          </div>
        ))}

        {message && <p className="error-text" style={{ color: 'var(--league)' }}>{message}</p>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save tournament result'}</button>
      </form>
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

<div className="card" style={{ marginBottom: 20 }}>
  <h3>Players</h3>

  {players.map((player) => (
    <div
      key={player.id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <span>{player.name}</span>

      <button
        className="btn secondary"
        onClick={async () => {
          if (window.confirm(`Delete ${player.name}?`)) {
            await deleteDoc(doc(db, "players", player.id));
          }
        }}
      >
        Delete
      </button>
    </div>
  ))}
</div>

<AutoFixtureGenerator players={players} />
      <TournamentProgress players={players} matches={matches} />
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

  if (user === undefined) return <p className="empty-state">Checking session…</p>
  return user ? <AdminDashboard /> : <LoginForm />
}
