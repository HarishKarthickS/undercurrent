import { useEffect, useState } from 'react';
import { AppIcon, CompanionMascot } from '#web/shared/components/index.js';
import { consumeStudentInvitation, listLocalStudentProfiles, setStudentPin, unlockStudent } from '../api/studentAccessApi.js';

const pinValid = (pin) => /^\d{4,8}$/.test(pin);

export function StudentPicker({ onOpen }) {
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { listLocalStudentProfiles().then((result) => setProfiles(result.students)).catch((reason) => { setProfiles([]); setError(reason.message); }); }, []);
  if (profiles === null) return <section className="access-panel"><p className="eyebrow">Student access</p><p role="status">Finding approved profiles…</p></section>;
  if (!profiles.length) return <section className="access-panel empty-access"><CompanionMascot mood="resting" size="regular" decorative /><p className="eyebrow">Student access</p><h1 className="font-display">Open your invitation link.</h1><p>This device does not have an approved student profile yet. Ask a parent to send an invitation link.</p>{error && <p className="auth-status error">{error}</p>}</section>;
  return <section className="access-panel"><p className="eyebrow">Choose your trail</p><h1 className="font-display">Who’s learning today?</h1><div className="student-picker-grid">{profiles.map((profile) => <button key={profile.id} className="student-pick" onClick={() => onOpen(profile)}><span>{profile.name.slice(0, 1)}</span><strong>{profile.name}</strong><small>{profile.pinSet ? 'Enter PIN' : 'Set up PIN'}</small></button>)}</div></section>;
}

export function StudentPinPage({ profile, setup = false, onComplete, onBack }) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); if (!pinValid(pin)) { setError('Use a 4 to 8 digit PIN.'); return; } setBusy(true); setError(''); try { const result = setup ? await setStudentPin(profile.id, pin) : await unlockStudent(profile.id, pin); onComplete(result.student ?? profile); } catch (reason) { setError(reason.message); } finally { setBusy(false); } }
  return <section className="access-panel pin-panel"><CompanionMascot mood={setup ? 'thinking' : 'welcome'} size="small" decorative /><p className="eyebrow">{setup ? 'Set up this device' : 'Welcome back'}</p><h1 className="font-display">{setup ? `Choose a PIN for ${profile.name}.` : `Hi, ${profile.name}.`}</h1><p>{setup ? 'This PIN opens only this student space on this approved device.' : 'Enter your PIN to open your learning trail.'}</p><form onSubmit={submit} noValidate><label className="field-label">{setup ? 'New PIN' : 'Your PIN'}<input inputMode="numeric" autoComplete="one-time-code" maxLength="8" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(error)} placeholder="••••" /></label>{error && <p className="field-error" role="alert">{error}</p>}<button className="primary-button full-button" disabled={busy}>{busy ? 'Opening…' : setup ? 'Save PIN' : 'Open my trail'} <AppIcon name="arrow-right" size="xs" decorative /></button></form><button className="text-button" onClick={onBack}>Choose another profile</button></section>;
}

export function StudentInvitationPage({ token, onReady }) {
  const [status, setStatus] = useState('Preparing this device…'); const [error, setError] = useState('');
  useEffect(() => { consumeStudentInvitation(token, 'This device').then((result) => onReady(result.studentId)).catch((reason) => { setStatus('This invitation could not be used.'); setError(reason.message); }); }, [onReady, token]);
  return <section className="access-panel"><CompanionMascot mood={error ? 'paused' : 'thinking'} size="regular" decorative /><p className="eyebrow">Parent-approved device</p><h1 className="font-display">{status}</h1>{error ? <p className="auth-status error">{error}</p> : <p>One small moment while we securely set up this device.</p>}</section>;
}
