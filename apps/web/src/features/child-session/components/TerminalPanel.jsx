import { CompanionMascot } from '#web/shared/components/index.js';

export function TerminalPanel({ safety = false, onReturn = () => undefined }) {
  return <section className="terminal-panel" aria-live="polite" aria-label="Check-in complete">
    <CompanionMascot mood={safety ? 'paused' : 'resting'} size="regular" decorative />
    <p className="eyebrow">{safety ? 'Pause here' : 'Check-in complete'}</p>
    <h2 className="font-display">{safety ? 'This session is paused.' : 'You can come back whenever you want.'}</h2>
    <p>{safety ? 'Please tell a trusted grown-up near you right now.' : 'You do not need to finish anything else today.'}</p>
    <button type="button" className="secondary-button" onClick={onReturn}>Return to child space</button>
  </section>;
}
