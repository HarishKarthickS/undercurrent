import { useEffect, useState } from 'react';
import { createProfile, listProfiles } from '#web/features/onboarding/index.js';
import { acceptDemoTerms, completePasswordReset, getParentSession, loginParent, logoutParent, requestPasswordReset, resendParentVerification, signUpParent, verifyParentEmail } from '#web/features/identity/index.js';
import { completeMorningRipple as saveMorningRipple, endSession, getCuriosityTrail, saveParentRitualSettings, sendTurn, startSession } from '#web/features/child-session/index.js';
import { createIdempotencyKey } from '#web/shared/api/index.js';
import { useAsyncTask } from '#web/shared/hooks/useAsyncTask.js';

const studentUnlockKey = 'undercurrent.student-unlock';
const studentUnlockDuration = 12 * 60 * 60 * 1000;
const readStudentUnlock = () => { try { const saved = JSON.parse(globalThis.localStorage?.getItem(studentUnlockKey) ?? 'null'); return saved?.expiresAt > Date.now() && saved?.student?.id ? saved.student : null; } catch { return null; } };
const writeStudentUnlock = (student) => { try { globalThis.localStorage?.setItem(studentUnlockKey, JSON.stringify({ student, expiresAt: Date.now() + studentUnlockDuration })); } catch { /* Storage can be unavailable in private browsing. */ } };

export function useAppController() {
  const [view, setView] = useState('landing');
  const [form, setForm] = useState({ name: '', grade: '', routineMorning: '', routineEvening: '', experienceBandOverride: '', demoTermsAcknowledged: false });
  const [student, setStudent] = useState(readStudentUnlock);
  const [session, setSession] = useState(null);
  const [completedTrail, setCompletedTrail] = useState(null);
  const [notice, setNotice] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [parentToken, setParentToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const { busy, run } = useAsyncTask();

  useEffect(() => { let mounted = true; getParentSession().then((session) => { if (mounted && session?.parent) setParentToken(session.parent); }).catch(() => undefined).finally(() => { if (mounted) setAuthReady(true); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (!parentToken) { setProfiles([]); return; } listProfiles().then((result) => setProfiles(result.students)).catch(() => setProfiles([])); }, [parentToken]);

  const runWithNotice = async (task) => { setNotice(''); try { return await run(task); } catch (error) { setNotice(error.message); return null; } };
  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submitProfile = async (event) => { event.preventDefault(); const result = await runWithNotice(async () => { await acceptDemoTerms(); return createProfile({ name: form.name, grade: form.grade, routineMorning: form.routineMorning || null, routineEvening: form.routineEvening || null, demoTermsAcknowledged: form.demoTermsAcknowledged }, parentToken); }); if (result) { await runWithNotice(() => saveParentRitualSettings(result.student.id, { experienceBandOverride: form.experienceBandOverride || null })); setStudent(result.student); setProfiles((current) => [result.student, ...current]); setView('child'); setNotice(`Profile ready for ${result.student.name}. Send a device invitation whenever you are ready.`); return result; } return null; };
  const chooseProfile = (profile) => { writeStudentUnlock(profile); setStudent(profile); setSession(null); setCompletedTrail(null); setView('child'); setNotice(`Approved profile ready for ${profile.name}.`); };
  const beginSession = async (type = 'evening', mode = 'quest', questId = null) => { const result = await runWithNotice(() => startSession(student.id, type, mode, questId)); if (result) { setCompletedTrail(null); setSession(result); setNotice(result.openingPrompt); } };
  const loadCompletedTrail = async () => { const trail = await getCuriosityTrail(student.id); setCompletedTrail(trail.days); };
  const submitTurn = (input, inputMode) => runWithNotice(async () => { const result = await sendTurn({ sessionId: session.sessionId, input, inputMode, idempotencyKey: createIdempotencyKey() }); setNotice(result.message); if (result.terminal && !result.parentNotification) { await loadCompletedTrail(); setSession(null); } return result; });
  const finishSession = (reason = 'child_exit') => runWithNotice(async () => { await endSession(session.sessionId, reason); await loadCompletedTrail(); setSession(null); setNotice('Session closed. You can return whenever the routine feels right.'); });
  const completeMorningRipple = (entry) => runWithNotice(() => saveMorningRipple(entry));
  const exitTerminalSession = () => { setSession(null); setNotice('Check-in closed. You can return whenever the routine feels right.'); };
  const registerParent = (credentials) => run(() => signUpParent(credentials));
  const signInParent = async (credentials) => run(async () => {
    const result = await loginParent(credentials);
    setParentToken(result.parent);
    return result;
  });
  const resetParentPassword = (email) => run(() => requestPasswordReset({ email }));
  const resendVerification = (email) => run(() => resendParentVerification({ email }));
  const confirmParentEmail = async (payload) => run(async () => { const result = await verifyParentEmail(payload); setParentToken(result.parent); return result; });
  const changeParentPassword = (payload) => run(() => completePasswordReset(payload));
  const signOutParent = async () => { await run(() => logoutParent()); setParentToken(null); setStudent(null); setSession(null); };
  return { view, setView, form, student, session, completedTrail, notice, setNotice, profiles, parentReady: Boolean(parentToken), authReady, busy, changeForm, submitProfile, chooseProfile, beginSession, submitTurn, finishSession, completeMorningRipple, exitTerminalSession, parentToken, registerParent, signInParent, resetParentPassword, resendVerification, confirmParentEmail, changeParentPassword, signOutParent };
}
