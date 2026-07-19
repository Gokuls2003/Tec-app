import { useState } from 'react'

export default function Contact() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const contactEmail = 'your-email@example.com'

  const submit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`TEC contact from ${name || 'a visitor'}`)
    const body = encodeURIComponent(message)
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Contact</h2>
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 480, marginBottom: 20 }}>
        Questions about a tournament, a fixture, or want your team added? Send a message.
      </p>
      <form className="form-grid" onSubmit={submit}>
        <div>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Message</label>
          <input value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        <button className="btn" type="submit">Send</button>
      </form>
    </section>
  )
}
