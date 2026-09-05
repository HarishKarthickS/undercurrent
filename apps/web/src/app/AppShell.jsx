import { AppIcon } from '#web/shared/components/index.js';

export function AppShell({ routeType, showPublicAction = true, hideHeader = false, onNavigate, onSignOut, children }) {
  const publicHeader = <div className="route-actions"><button className="topbar-start" onClick={() => onNavigate('/parent/login')}>Parent sign in <AppIcon name="arrow-right" size="xs" decorative /></button></div>;
  const parentHeader = <div className="route-actions"><span className="route-label">Evening summary</span><button className="topbar-start" onClick={() => onNavigate('/parent/children')}>My children</button><button className="header-signout" onClick={onSignOut}>Sign out</button></div>;
  const studentHeader = <div className="route-actions"><button className="topbar-start" onClick={() => onNavigate('/student')}>Change profile</button></div>;
  const skin = routeType === 'parent' ? 'app-shell-parent' : routeType === 'student' ? 'app-shell-student' : routeType === 'public' ? 'app-shell-landing' : '';
  return <main className={`app-shell ${skin}`} data-skin={routeType || 'public'}><section className="app-frame">{!hideHeader && <header className="topbar"><button className="brand" onClick={() => onNavigate('/')} aria-label="Undercurrent home"><span className="brand-mark"><AppIcon name="logo" size="sm" decorative /></span><span>undercurrent</span></button>{routeType === 'parent' ? parentHeader : routeType === 'student' ? studentHeader : showPublicAction ? publicHeader : null}</header>}{children}</section></main>;
}
