export default function About() {
  return (
    <section className="section">
      <div className="section-head">
        <h2>About TEC</h2>
      </div>
      <p style={{ maxWidth: 640, color: 'var(--muted)', lineHeight: 1.7 }}>
        TEC is a home for the Tamil eFootball community — tracking every player, every fixture,
        and every result. The moment a match is entered, the ranking table recalculates itself:
        no spreadsheets, no manual point-counting, no arguments about who's really number one.
      </p>
      <p style={{ maxWidth: 640, color: 'var(--muted)', lineHeight: 1.7 }}>
        Points work like a standard league table — 3 for a win, 1 for a draw, 0 for a loss —
        with goal difference as the tiebreaker. Tournament organisers can add fixtures and enter
        results from the Admin page; everyone else can follow along here in real time.
      </p>
    </section>
  )
}
