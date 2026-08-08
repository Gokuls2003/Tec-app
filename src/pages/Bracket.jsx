export default function Bracket() {
  return (
    <section className="section">
      <div className="section-head">
        <h2>Tournament Bracket</h2>
      </div>
      <div className="clubsystem-bracket">
        <iframe
          src="https://www.clubsystem.app/tournaments/fg9K7iVq7bZF/embed"
          width="100%"
          height="600"
          style={{ border: 0 }}
          loading="lazy"
          title="Tournament bracket – ClubSystem"
        />
        <p style={{ margin: '4px 0 0', fontSize: '0.8em', color: 'var(--muted)' }}>
          Bracket by{' '}
          <a href="https://www.clubsystem.app/tournament-bracket-generator/" target="_blank" rel="noopener noreferrer">
            ClubSystem – free tournament bracket generator
          </a>
        </p>
      </div>
    </section>
  )
}
