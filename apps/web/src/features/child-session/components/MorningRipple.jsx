import { useState } from 'react';
import { AppIcon, CompanionMascot, StudentMark } from '#web/shared/components/index.js';

const moods = [{ id: 'bright', label: 'Bright' }, { id: 'curious', label: 'Curious' }, { id: 'steady', label: 'Steady' }, { id: 'sleepy', label: 'Sleepy' }, { id: 'wiggly', label: 'Wiggly' }, { id: 'heavy', label: 'Heavy' }];
const energy = [{ id: 'low', label: 'Low glow' }, { id: 'medium', label: 'Easy energy' }, { id: 'high', label: 'Ready to zoom' }];
const intentions = ['Be kind to me', 'Ask one question', 'Try one new thing', 'Take it one step at a time'];
const pathMark = (path) => ({ energy: 'morning', calm: 'cloud', ready: 'compass', curiosity: 'discovery', reflect: 'world' }[path] ?? 'discovery');
const readAloud = (words) => globalThis.speechSynthesis?.speak(new SpeechSynthesisUtterance(words));

export function MorningRipple({ session, busy, onComplete, onExit }) {
  const [step, setStep] = useState('arrive');
  const [mood, setMood] = useState('');
  const [energyLevel, setEnergy] = useState('');
  const [result, setResult] = useState('');
  const [intention, setIntention] = useState('');
  const [extra, setExtra] = useState(false);
  const activity = session.morning;
  const choices = activity.activity?.choices ?? [];
  const finish = async () => {
    const saved = await onComplete({ sessionId: session.sessionId, mood, energy: energyLevel, path: activity.path, activityId: activity.id, activityResult: result, intention });
    if (saved) setStep('launch');
  };

  if (step === 'launch') return <section className={`morning-studio launch-${activity.theme}`}><div className="launch-card"><StudentMark name={activity.collectible} size="xl" className="launch-token" decorative /><p className="eyebrow">Today's launch card</p><h1 className="font-display">{intention}</h1><p>You collected a {activity.collectible}. Later today, notice one small thing that connects to this idea.</p><div className="launch-actions"><button className="primary-button" onClick={onExit}>Begin my day <AppIcon name="arrow-right" size="xs" decorative /></button><button className="text-button" onClick={() => readAloud(intention)}>Hear my card</button></div></div></section>;

  return <section className={`morning-studio theme-${activity.theme}`} aria-label="Morning Ripple">
    <header className="morning-topline"><span>Morning Ripple · {step === 'arrive' ? '1' : step === 'checkin' ? '2' : step === 'activity' ? '3' : '4'} of 4</span><button className="session-exit" onClick={onExit}>Save for later</button></header>
    {step === 'arrive' && <div className="morning-arrive"><div><p className="eyebrow">A different kind of hello</p><h1 className="font-display">Good morning, explorer.</h1><p>{activity.prompt}</p><div className="launch-actions"><button className="primary-button" onClick={() => setStep('checkin')}>Make my ripple <AppIcon name="arrow-right" size="xs" decorative /></button><button className="text-button" onClick={() => readAloud(activity.prompt)}>Hear Pip read it</button></div></div><CompanionMascot mood="welcome" size="hero" decorative /></div>}
    {step === 'checkin' && <div className="morning-step"><p className="eyebrow">First, notice</p><h1 className="font-display">What is your morning like?</h1><p className="tiny-note">There is no right answer. Choose what feels closest.</p><div className="mood-orbit">{moods.map((item) => <button className={mood === item.id ? 'selected' : ''} key={item.id} onClick={() => setMood(item.id)}><StudentMark name={item.id} size="md" decorative />{item.label}</button>)}</div>{mood && <><p className="control-title">How much energy is here?</p><div className="energy-row">{energy.map((item) => <button className={energyLevel === item.id ? 'selected' : ''} key={item.id} onClick={() => setEnergy(item.id)}>{item.label}</button>)}</div></>}<button className="primary-button" disabled={!mood || !energyLevel} onClick={() => setStep('activity')}>Choose my tiny path <AppIcon name="arrow-right" size="xs" decorative /></button></div>}
    {step === 'activity' && <div className="morning-step"><p className="eyebrow">Your {activity.path} path</p><h1 className="font-display">Pick one tiny thing to try.</h1><p>{activity.activity?.prompt ?? activity.prompt}</p><div className="morning-choice-grid">{choices.map((choice) => <button className={result === choice ? 'selected' : ''} key={choice} onClick={() => setResult(choice)}>{choice}</button>)}</div><label className="field-label">Or add your own tiny idea<input value={result} onChange={(event) => setResult(event.target.value)} placeholder="A word or small plan..." maxLength="280" /></label><button className="secondary-button" onClick={() => { setExtra(true); if (!result) setResult('I noticed one small thing.'); }}>Give me an extra spark</button>{extra && <div className="extra-spark"><strong>Extra spark:</strong> Look around and name one color that feels good to see.</div>}<button className="text-button" onClick={() => { setResult(result || 'I chose to keep this tiny moment simple.'); setStep('intention'); }}>Skip this part</button><button className="primary-button" disabled={busy} onClick={() => setStep('intention')}>Make my launch card <AppIcon name="arrow-right" size="xs" decorative /></button></div>}
    {step === 'intention' && <div className="morning-step"><p className="eyebrow">One small direction</p><h1 className="font-display">What would you like to carry today?</h1><div className="intention-grid">{intentions.map((item) => <button className={intention === item ? 'selected' : ''} key={item} onClick={() => setIntention(item)}>{item}</button>)}</div><label className="field-label">Or write your own<input value={intention} onChange={(event) => setIntention(event.target.value)} maxLength="140" placeholder="I will..." /></label><button className="primary-button" disabled={!intention.trim() || busy} onClick={finish}>{busy ? 'Saving your ripple...' : 'Launch my morning'} <AppIcon name="arrow-right" size="xs" decorative /></button></div>}
  </section>;
}
