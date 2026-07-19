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
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await addDoc(collection(db, 'players'), { name, team, createdAt: Date.now() })
    setName('')
    setTeam('')
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
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add player'}
        </button>
      </form>
    </div>
  )
}

function AddFixture({ players }) {
  const [tournamentName, setTournamentName] = useState('')
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
      tournamentName,
      round,
      player1Id,
      player1Name: p1?.name || '',
      player2Id,
      player2Name: p2?.name || '',
      date,
      completed: false,
      score1: null,
      score2: null,
      createdAt: Date.now(),
    })
    setRound('')
    setSaving(false)
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3>Add fixture</h3>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Tournament name</label>
          <input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="e.g. TEC Summer Cup" />
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

function FixtureResultRow({ match }) {
  const [score1, setScore1] = useState(match.score1 ?? '')
  const [score2, setScore2] = useState(match.score2 ?? '')

  const saveResult = async () => {
    if (score1 === '' || score2 === '') return
    await updateDoc(doc(db, 'matches', match.id), {
      score1: Number(score1),
      score2: Number(score2),
      completed: true,
    })
  }

  const removeFixture = async () => {
    await deleteDoc(doc(db, 'matches', match.id))
  }

  return (
    <div className="fixture-card">
      <div className="players">
        <span>{match.player1Name}</span>
        <input
          type="number"
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          style={{ width: 56 }}
        />
        <span>–</span>
        <input
          type="number"
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          style={{ width: 56 }}
        />
        <span>{match.player2Name}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={saveResult}>Save result</button>
        <button className="btn secondary" onClick={removeFixture}>Delete</button>
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
      <AddFixture players={players} />

      <div className="card">
        <h3>Enter results</h3>
        {matches.length === 0 && <p className="empty-state">No fixtures yet — add one above.</p>}
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
