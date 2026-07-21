const sizes = { xs: 16, sm: 20, md: 24, lg: 32, xl: 44 };

function Stroke({ d, ...props }) { return <path d={d} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props} />; }

function Glyph({ name }) {
  switch (name) {
    case 'arrow-right': return <><Stroke d="M5 12h13" /><Stroke d="m13 7 5 5-5 5" /></>;
    case 'arrow-left': return <><Stroke d="M19 12H6" /><Stroke d="m11 7-5 5 5 5" /></>;
    case 'arrow-down': return <><Stroke d="M12 4v15" /><Stroke d="m6 13 6 6 6-6" /></>;
    case 'chevron-down': return <Stroke d="m6 9 6 6 6-6" />;
    case 'chevron-right': return <Stroke d="m9 6 6 6-6 6" />;
    case 'check': return <Stroke d="m5 12 4.2 4.2L19 6.5" />;
    case 'circle-check': return <><circle cx="12" cy="12" r="8.5" fill="currentColor" opacity=".14" /><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="m8.2 12 2.5 2.6 5.2-5.4" /></>;
    case 'circle': return <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />;
    case 'sun': return <><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".18" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />{[[12,2,12,4],[12,20,12,22],[2,12,4,12],[20,12,22,12],[4.9,4.9,6.4,6.4],[17.6,17.6,19.1,19.1],[17.6,6.4,19.1,4.9],[4.9,19.1,6.4,17.6]].map((line, index) => <Stroke d={`M${line[0]} ${line[1]} ${line[2]} ${line[3]}`} key={index} />)}</>;
    case 'sparkles': return <><path d="m12 2 1.8 5.1L19 9l-5.2 1.9L12 16l-1.8-5.1L5 9l5.2-1.9L12 2Z" fill="currentColor" opacity=".2" /><Stroke d="m12 2 1.8 5.1L19 9l-5.2 1.9L12 16l-1.8-5.1L5 9l5.2-1.9L12 2Z" /><Stroke d="m19.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>;
    case 'cloud': return <><path d="M7.2 18h9.2a3.6 3.6 0 0 0 .4-7.2A5.3 5.3 0 0 0 6.6 9.4 4.3 4.3 0 0 0 7.2 18Z" fill="currentColor" opacity=".14" /><Stroke d="M7.2 18h9.2a3.6 3.6 0 0 0 .4-7.2A5.3 5.3 0 0 0 6.6 9.4 4.3 4.3 0 0 0 7.2 18Z" /></>;
    case 'bolt': return <path d="m13.2 2.8-7 10h5l-.4 8.4 7-11h-5.1l.5-7.4Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />;
    case 'leaf': return <><path d="M19.3 4.5C12.8 4 6.1 6.7 5 14.1c-.4 3 2 5.5 5 5 7.4-1.1 10.1-7.8 9.3-14.6Z" fill="currentColor" opacity=".16" /><Stroke d="M19.3 4.5C12.8 4 6.1 6.7 5 14.1c-.4 3 2 5.5 5 5 7.4-1.1 10.1-7.8 9.3-14.6Z" /><Stroke d="M6.6 17.5c2.7-3.3 5.7-5.8 9.5-8" /></>;
    case 'compass': return <><circle cx="12" cy="12" r="8.5" fill="currentColor" opacity=".1" /><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>;
    case 'home': return <><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" fill="currentColor" opacity=".12" /><Stroke d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" /><Stroke d="M9 20v-6h6v6" /></>;
    case 'chart': return <><Stroke d="M5 19V5" /><Stroke d="M5 19h15" /><path d="m8 15 3-4 3 2 4-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" /><circle cx="18" cy="7" r="1.5" fill="currentColor" /></>;
    case 'calendar-clock': return <><rect x="4" y="5" width="16" height="15" rx="3" fill="currentColor" opacity=".12" /><rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M8 3v4M16 3v4M4 10h16" /><circle cx="15.5" cy="15" r="3" fill="var(--icon-surface, white)" stroke="currentColor" strokeWidth="1.8" /><Stroke d="M15.5 13.4v1.9l1.3.7" /></>;
    case 'family': return <><circle cx="9" cy="8" r="3" fill="currentColor" opacity=".15" /><circle cx="16.5" cy="9.5" r="2.2" fill="currentColor" opacity=".15" /><Stroke d="M4.5 19c.4-3.4 2.1-5.1 4.5-5.1s4.1 1.7 4.5 5.1M13.5 18.5c.2-2.5 1.4-3.9 3.3-3.9 1.7 0 2.8 1.2 3.1 3.3M9 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM16.5 7.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" /></>;
    case 'refresh': return <><Stroke d="M19 8V4l2.4 2.4" /><Stroke d="M20.6 6.4A8 8 0 1 0 20 17" /></>;
    case 'settings': return <><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".14" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /></>;
    case 'lock': return <><rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" opacity=".14" /><rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2" /></>;
    case 'shield': return <><path d="M12 3.5 19 6v5.1c0 4.3-2.9 7.4-7 9.4-4.1-2-7-5.1-7-9.4V6l7-2.5Z" fill="currentColor" opacity=".14" /><Stroke d="M12 3.5 19 6v5.1c0 4.3-2.9 7.4-7 9.4-4.1-2-7-5.1-7-9.4V6l7-2.5Z" /><Stroke d="m8.8 12 2.1 2.2 4.4-4.5" /></>;
    case 'device': return <><rect x="7" y="3" width="10" height="18" rx="2.5" fill="currentColor" opacity=".12" /><rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M10.5 18h3" /></>;
    case 'key': return <><circle cx="8" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="m10.5 14.5 7-7M15 9l2 2m-4-4 2 2" /></>;
    case 'mic': return <><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" opacity=".14" /><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" /></>;
    case 'volume': return <><path d="M5 10h3l4-3v10l-4-3H5v-4Z" fill="currentColor" opacity=".15" /><Stroke d="M5 10h3l4-3v10l-4-3H5v-4Z" /><Stroke d="M16 9c1 .8 1.5 1.8 1.5 3S17 14.2 16 15M18.5 6.5c1.7 1.5 2.5 3.3 2.5 5.5s-.8 4-2.5 5.5" /></>;
    case 'play': return <path d="m9 6 9 6-9 6V6Z" fill="currentColor" />;
    case 'pause': return <><rect x="7" y="6" width="3.5" height="12" rx="1.2" fill="currentColor" /><rect x="13.5" y="6" width="3.5" height="12" rx="1.2" fill="currentColor" /></>;
    case 'alert': return <><path d="M12 4 21 20H3L12 4Z" fill="currentColor" opacity=".14" /><Stroke d="M12 4 21 20H3L12 4Z" /><Stroke d="M12 9v4M12 17h.01" /></>;
    case 'info': return <><circle cx="12" cy="12" r="8.5" fill="currentColor" opacity=".12" /><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><Stroke d="M12 11v5M12 8h.01" /></>;
    case 'menu': return <><Stroke d="M4 7h16M4 12h16M4 17h16" /></>;
    case 'close': return <><Stroke d="m6 6 12 12M18 6 6 18" /></>;
    case 'eye': return <><path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" fill="currentColor" opacity=".1" /><Stroke d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" /><circle cx="12" cy="12" r="2" fill="currentColor" /></>;
    case 'book': return <><path d="M4 5.5c3.2-1.3 5.8-.9 8 1.2 2.2-2.1 4.8-2.5 8-1.2v13c-3.2-1.3-5.8-.9-8 1.2-2.2-2.1-4.8-2.5-8-1.2v-13Z" fill="currentColor" opacity=".12" /><Stroke d="M4 5.5c3.2-1.3 5.8-.9 8 1.2 2.2-2.1 4.8-2.5 8-1.2v13c-3.2-1.3-5.8-.9-8 1.2-2.2-2.1-4.8-2.5-8-1.2v-13ZM12 6.7v13" /></>;
    case 'message': return <><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="currentColor" opacity=".12" /><Stroke d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /><Stroke d="M8 11h8" /></>;
    case 'wand': return <><Stroke d="m5 19 11-11" /><path d="m17 3 .8 2.2L20 6l-2.2.8L17 9l-.8-2.2L14 6l2.2-.8L17 3Z" fill="currentColor" /><path d="m6 13 .5 1.3 1.3.5-1.3.5L6 16.5l-.5-1.2-1.3-.5 1.3-.5L6 13Z" fill="currentColor" /></>;
    case 'trail': return <><Stroke d="M6 4c4 2 8 0 12 2M6 20c4-2 8 0 12-2M8 7c-3 2-3 6 0 8M16 9c3 2 3 4 0 6" /><circle cx="8" cy="7" r="1.4" fill="currentColor" /><circle cx="16" cy="17" r="1.4" fill="currentColor" /></>;
    case 'logo': return <><path d="M5 13.5c0-5.4 3.1-8.8 7-8.8s7 3.4 7 8.8c0 3.6-2 5.8-4.7 5.8-1.2 0-2.1-.5-2.3-1.5-.4 1-1.5 1.5-2.6 1.5C6.8 19.3 5 17.1 5 13.5Z" fill="currentColor" opacity=".15" /><Stroke d="M5 13.5c0-5.4 3.1-8.8 7-8.8s7 3.4 7 8.8c0 3.6-2 5.8-4.7 5.8-1.2 0-2.1-.5-2.3-1.5-.4 1-1.5 1.5-2.6 1.5C6.8 19.3 5 17.1 5 13.5Z" /><path d="M10 5.5C8.5 3 6.5 2.8 6.2 4.2c-.2 1.2 1.3 2.4 3.2 2.2M14 5.5c1.5-2.5 3.5-2.7 3.8-1.3.2 1.2-1.3 2.4-3.2 2.2" fill="currentColor" opacity=".55" /></>;
    default: return <circle cx="12" cy="12" r="7" fill="currentColor" opacity=".2" />;
  }
}

export function AppIcon({ name, size = 'md', label, decorative = !label, className = '' }) {
  const dimension = typeof size === 'number' ? size : sizes[size] ?? sizes.md;
  return <svg className={`app-icon app-icon-${name} ${className}`.trim()} width={dimension} height={dimension} viewBox="0 0 24 24" fill="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={decorative || undefined} focusable="false"><Glyph name={name} /></svg>;
}
