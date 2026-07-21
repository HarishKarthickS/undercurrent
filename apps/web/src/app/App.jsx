import { useEffect, useState } from 'react';
import { AppShell } from './AppShell.jsx';
import { useAppController } from './useAppController.js';
import { ChildSession, StudentRitual } from '#web/features/child-session/index.js';
import { OnboardingFlow } from '#web/features/onboarding/index.js';
import { ParentDashboard, useParentDashboard } from '#web/features/parent-dashboard/index.js';
import { AppIcon } from '#web/shared/components/index.js';
import { LandingPage } from '#web/features/landing/index.js';
import { AuthPage, listLocalStudentProfiles, StudentInvitationPage, StudentPicker, StudentPinPage } from '#web/features/identity/index.js';
import { useRoute } from './useRoute.js';

const parentSections = new Set(['today', 'rituals', 'learning', 'insights', 'advisor', 'plan', 'family', 'customize', 'inbox', 'privacy']);
const query = (search) => new URLSearchParams(search);

function ChildHome({ controller }) {
  const { student, session, busy, beginSession, notice } = controller;
  if (session) return <ChildSession key={session.sessionId} session={session} busy={busy} notice={notice} onSubmitTurn={controller.submitTurn} onEnd={controller.finishSession} onExitTerminal={controller.exitTerminalSession} onCompleteMorning={controller.completeMorningRipple} />;
  return <StudentRitual student={student} busy={busy} notice={notice} onBegin={beginSession} />;
}

function StudentEntry({ controller, onOpen, onLanding }) {
  const [profiles, setProfiles] = useState(null);
  useEffect(() => { listLocalStudentProfiles().then((result) => setProfiles(result.students)).catch(() => setProfiles([])); }, []);
  if (profiles === null) return <section className="access-panel"><p role="status">Opening your student space…</p></section>;
  if (!profiles.length) return <LandingPage onGetStarted={() => onLanding('/parent/signup')} onSignIn={() => onLanding('/parent/login')} />;
  return <StudentPicker onOpen={onOpen} />;
}

function AccountAction({ kind, token, parentId, onConfirm, onNavigate }) {
  const [status, setStatus] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  async function act(event) { event.preventDefault(); setBusy(true); setStatus(''); try { if (kind === 'verify') { await onConfirm({ parentId, token }); onNavigate('/parent/children'); } else { await onConfirm({ token, password }); setStatus('Your password was updated. You can sign in now.'); } } catch (error) { setStatus(error.message); } finally { setBusy(false); } }
  const verify = kind === 'verify';
  return <section className="auth-page"><form className="auth-card" onSubmit={act}><p className="eyebrow">Parent account</p><h1 className="font-display">{verify ? 'Verify your email.' : 'Choose a new password.'}</h1><p>{verify ? 'Confirming this link opens your protected parent control center.' : 'Use at least 12 characters. This link can be used only once.'}</p>{!verify && <label className="field-label">New password<input type="password" value={password} minLength="12" onChange={(event) => setPassword(event.target.value)} required /></label>}{status && <p className="auth-status error" role="status">{status}</p>}<button className="primary-button full-button" disabled={busy || (!verify && password.length < 12)}>{busy ? 'One moment…' : verify ? 'Verify and continue' : 'Save new password'} <AppIcon name="arrow-right" size="xs" decorative /></button></form></section>;
}

export function App() {
  const controller = useAppController();
  const route = useRoute();
  const [studentProfile, setStudentProfile] = useState(null);
  const pieces = route.path.split('/').filter(Boolean);
  const isParent = pieces[0] === 'parent'; const isStudent = pieces[0] === 'student';
  const childId = pieces[1] === 'children' ? pieces[2] : null;
  const rawSection = parentSections.has(pieces[3]) ? pieces[3] : 'today';
  const section = ['customize', 'inbox', 'privacy'].includes(rawSection) ? 'family' : rawSection;
  const selectedParentStudent = controller.profiles.find((profile) => profile.id === childId) ?? (controller.student?.id === childId ? controller.student : null);
  const parentDashboard = useParentDashboard({ student: selectedParentStudent, parentToken: controller.parentToken, onError: (error) => controller.setNotice(error.message) });
  const parentAuthenticated = Boolean(controller.parentToken);
  const authProps = { invitationToken: query(route.search).get('invite'), onLogin: controller.signInParent, onSignup: controller.registerParent, onPasswordReset: controller.resetParentPassword, onResendVerification: controller.resendVerification };
  const studentId = isStudent && !['invite'].includes(pieces[1]) ? pieces[1] : null;
  async function navigate(to) { route.go(to); }
  const openStudent = (profile) => { setStudentProfile(profile); navigate(`/student/${profile.id}/${profile.pinSet ? 'unlock' : 'setup'}`); };
  const content = route.path === '/' ? (controller.student ? <ChildHome controller={controller} /> : <StudentEntry controller={controller} onOpen={openStudent} onLanding={navigate} />)
    : route.path === '/parent/verify' ? <AccountAction kind="verify" parentId={query(route.search).get('parent')} token={query(route.search).get('token')} onConfirm={controller.confirmParentEmail} onNavigate={navigate} />
    : route.path === '/parent/reset-password' ? <AccountAction kind="reset" token={query(route.search).get('token')} onConfirm={controller.changeParentPassword} onNavigate={navigate} />
    : route.path === '/parent/login' ? <AuthPage mode="login" onNavigate={navigate} {...authProps} />
    : route.path === '/parent/signup' ? <AuthPage mode="signup" onNavigate={navigate} {...authProps} />
    : route.path === '/parent/forgot-password' ? <AuthPage mode="forgot" onNavigate={navigate} {...authProps} />
    : isParent && !controller.authReady ? <section className="auth-page"><p role="status">Checking your secure parent session…</p></section>
    : isParent && !parentAuthenticated ? <AuthPage mode="login" onNavigate={navigate} {...authProps} />
    : route.path === '/parent' ? <section className="auth-page"><div className="auth-card"><h1 className="font-display">Your family control center.</h1><button className="primary-button" onClick={() => navigate('/parent/children')}>Manage children</button></div></section>
    : route.path === '/parent/children' ? <OnboardingFlow {...controller.form} parentReady={controller.parentReady} busy={controller.busy} notice={controller.notice} localProfiles={controller.profiles} onChange={controller.changeForm} onSubmit={async (event) => { const result = await controller.submitProfile(event); if (result) navigate(`/parent/children/${result.student.id}/today`); }} onChooseLocalProfile={(profile) => navigate(`/parent/children/${profile.id}/today`)} />
    : childId ? <ParentDashboard dashboard={parentDashboard.dashboard} loading={parentDashboard.loading} onReload={parentDashboard.reload} student={selectedParentStudent} parentToken={controller.parentToken} profiles={controller.profiles} section={section} onProfileChange={(id) => navigate(`/parent/children/${id}/today`)} onSectionChange={(next) => navigate(`/parent/children/${childId}/${next}`)} />
    : route.path.startsWith('/student/invite/') ? <StudentInvitationPage token={pieces[2]} onReady={() => navigate('/student')} />
    : route.path === '/student' ? <StudentPicker onOpen={openStudent} />
    : studentId && pieces[2] === 'setup' ? <StudentPinPage setup profile={studentProfile ?? { id: studentId, name: 'your profile' }} onComplete={(profile) => { setStudentProfile(profile); controller.chooseProfile(profile); navigate(`/student/${studentId}`); }} onBack={() => navigate('/student')} />
    : studentId && (!controller.student || controller.student.id !== studentId) ? <StudentPinPage profile={studentProfile ?? { id: studentId, name: 'your profile' }} onComplete={(profile) => { setStudentProfile(profile); controller.chooseProfile(profile); navigate(`/student/${studentId}`); }} onBack={() => navigate('/student')} />
    : studentId ? <ChildHome controller={controller} />
    : <section className="auth-page"><div className="auth-card"><h1 className="font-display">That page wandered off the trail.</h1><button className="primary-button" onClick={() => navigate('/')}>Return home</button></div></section>;
  return <AppShell routeType={isParent && parentAuthenticated ? 'parent' : (isStudent || controller.student) ? 'student' : 'public'} showPublicAction={!isParent && !controller.student} hideHeader={route.path === '/' && !controller.student} onNavigate={navigate} onSignOut={controller.signOutParent}>{content}</AppShell>;
}
