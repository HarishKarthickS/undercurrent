export function CuriosityTrail({ days }) {
  return <section className="curiosity-trail" aria-labelledby="curiosity-trail-title">
    <p className="eyebrow">Pip's little path</p>
    <h2 id="curiosity-trail-title" className="font-display">Curiosity Trail</h2>
    <ol className="trail-path" aria-label="Your last seven days of sessions">
      {days.map((day) => <li key={day.date} className={day.completed ? 'trail-day trail-day-complete' : 'trail-day'} aria-label={`${day.date}: ${day.completed ? 'session completed' : 'no session recorded'}`}><span aria-hidden="true" /></li>)}
    </ol>
    <p>Every day you show up is one more step — missing a day doesn’t undo it.</p>
  </section>;
}
