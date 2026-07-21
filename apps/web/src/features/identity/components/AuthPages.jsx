import { useState } from 'react';
import { AppIcon, CompanionMascot } from '#web/shared/components/index.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ mode, invitationToken = null, onNavigate, onLogin, onSignup, onPasswordReset, onResendVerification }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const signup = mode === 'signup';
  const forgot = mode === 'forgot';
  const title = signup ? 'Create your parent account' : forgot ? 'Reset your password' : 'Welcome back.';
  const copy = signup ? 'Use an email you can verify. Your password protects your family control center.' : forgot ? 'We’ll send a secure reset link to your verified email.' : 'Sign in to manage your family’s learning space.';

  function validate() {
    const next = {};
    if (signup && displayName.trim().length < 2) next.displayName = 'Enter your name using at least 2 characters.';
    if (signup && !invitationToken) next.invitation = 'Account creation is available only from an operator-issued closed-demo invitation.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!emailPattern.test(email.trim())) next.email = 'Enter a valid email address, like name@example.com.';
    if (!forgot && !password) next.password = 'Enter your password.';
    else if (signup && password.length < 12) next.password = 'Use at least 12 characters for your password.';
    return next;
  }

  function update(setter, field) { return (event) => { setter(event.target.value); setErrors((current) => ({ ...current, [field]: undefined })); setStatus(null); }; }
  async function resend() { setSubmitting(true); setStatus(null); try { await onResendVerification(email.trim()); setStatus({ kind: 'success', message: 'A fresh verification email is on its way.' }); } catch (error) { setStatus({ kind: 'error', message: error.message || 'We could not resend that email. Please try again.' }); } finally { setSubmitting(false); } }
  async function submit(event) { event.preventDefault(); const nextErrors = validate(); setErrors(nextErrors); setStatus(null); if (Object.keys(nextErrors).length) { if (nextErrors.invitation) setStatus({ kind: 'error', message: nextErrors.invitation }); return; } setSubmitting(true); try { if (signup) { await onSignup({ displayName: displayName.trim(), email: email.trim(), password, invitationToken }); setVerificationSent(true); } else if (forgot) { await onPasswordReset(email.trim()); setStatus({ kind: 'success', message: 'If this is a verified account, we’ll send a secure reset link shortly.' }); } else { await onLogin({ email: email.trim(), password }); onNavigate('/parent/children'); } } catch (error) { setStatus({ kind: 'error', message: error.message || 'We could not complete that request. Please try again.' }); } finally { setSubmitting(false); } }

  return <section className="auth-page auth-page-rich"><aside className="auth-story"><p className="eyebrow">A small shared ritual</p><h2 className="font-display">A place for every “wait, how does that work?”</h2><p>Undercurrent helps children explain ideas in their own words, while parents stay gently informed.</p><CompanionMascot mood={verificationSent ? 'celebrating' : 'welcome'} size="hero" decorative /></aside>{verificationSent ? <section className="auth-card verification-success" aria-live="polite"><span className="verification-mark"><AppIcon name="circle-check" size="lg" label="Account created" /></span><p className="eyebrow">Account created</p><h1 className="font-display">Verify your email to continue.</h1><p>We sent a verification link to <strong>{email}</strong>. Open that email on this device, then return here.</p><ol><li>Open the message from Undercurrent.</li><li>Select <strong>Verify your parent account</strong>.</li><li>You’ll enter your family control center automatically.</li></ol>{status && <p className={`auth-status ${status.kind}`} role="status">{status.message}</p>}<button type="button" className="primary-button full-button" onClick={resend} disabled={submitting}>{submitting ? 'Sending…' : 'Resend verification email'} <AppIcon name="arrow-right" size="xs" decorative /></button><button type="button" className="text-button" onClick={() => onNavigate('/parent/login')}>I’ve verified my email — sign in</button><small>For your security, the verification link is sent only by email and is never shown in this page.</small></section> : <form className="auth-card" onSubmit={submit} noValidate><p className="eyebrow">Parent-only space</p><h1 className="font-display">{title}</h1><p>{copy}</p>{signup && <label className="field-label">Your name<input type="text" autoComplete="name" value={displayName} onChange={update(setDisplayName, 'displayName')} aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName ? 'display-name-error' : undefined} placeholder="Your name" />{errors.displayName && <span className="field-error" id="display-name-error">{errors.displayName}</span>}</label>}<label className="field-label">Email<input type="email" autoComplete="email" value={email} onChange={update(setEmail, 'email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="you@example.com" />{errors.email && <span className="field-error" id="email-error">{errors.email}</span>}</label>{!forgot && <label className="field-label">Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={update(setPassword, 'password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} placeholder={signup ? 'At least 12 characters' : 'Enter your password'} />{errors.password && <span className="field-error" id="password-error">{errors.password}</span>}</label>}{status && <p className={`auth-status ${status.kind}`} role="status">{status.message}</p>}<button type="submit" className="primary-button full-button" disabled={submitting}>{submitting ? 'One moment…' : signup ? 'Create account' : forgot ? 'Send reset link' : 'Continue'} <AppIcon name="arrow-right" size="xs" decorative /></button><div className="auth-links">{mode === 'login' && <button type="button" onClick={() => onNavigate('/parent/forgot-password')}>Forgot password?</button>}{mode !== 'login' && <button type="button" onClick={() => onNavigate('/parent/login')}>Back to sign in</button>}{mode === 'login' && <button type="button" onClick={() => onNavigate('/parent/signup')}>Create account</button>}</div><small>Parent credentials are sent only to the secure account API. Verification and reset delivery are handled by the server.</small></form>}</section>;
}
