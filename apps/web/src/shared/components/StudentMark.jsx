const markConfig = {
  morning: { kind: 'sun', tone: 'sun' }, discovery: { kind: 'spark', tone: 'coral' }, world: { kind: 'leaf', tone: 'leaf' }, moments: { kind: 'compass', tone: 'sky' },
  bright: { kind: 'sun', tone: 'sun' }, curious: { kind: 'compass', tone: 'sky' }, steady: { kind: 'stone', tone: 'leaf' }, sleepy: { kind: 'moon', tone: 'sky' }, wiggly: { kind: 'wiggle', tone: 'coral' }, heavy: { kind: 'cloud', tone: 'sky' },
  sunrise: { kind: 'sun', tone: 'sun' }, sunbeam: { kind: 'sun', tone: 'sun' }, spark: { kind: 'spark', tone: 'coral' }, compass: { kind: 'compass', tone: 'sky' }, cloud: { kind: 'cloud', tone: 'sky' }, leaf: { kind: 'leaf', tone: 'leaf' }
};

function MarkGlyph({ kind }) {
  if (kind === 'sun') return <><circle cx="12" cy="12" r="4.2" className="student-mark-fill" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>;
  if (kind === 'spark') return <path className="student-mark-fill" d="m12 2.5 2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2 2-5.5Z" />;
  if (kind === 'leaf') return <><path className="student-mark-fill" d="M19 4.5C12.6 4.1 6.3 6.7 5.2 13.6c-.5 3.1 2 5.6 5.1 5.1C17.2 17.6 19.8 11.3 19 4.5Z" /><path d="M6.8 17c2.6-3.2 5.7-5.8 9.4-8" /></>;
  if (kind === 'compass') return <><circle cx="12" cy="12" r="7.4" className="student-mark-fill faint" /><circle cx="12" cy="12" r="7.4" /><path className="student-mark-fill" d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" /></>;
  if (kind === 'cloud') return <path className="student-mark-fill" d="M7.1 18h9.3a3.6 3.6 0 0 0 .3-7.2 5.3 5.3 0 0 0-10.1-1.4A4.3 4.3 0 0 0 7.1 18Z" />;
  if (kind === 'moon') return <path className="student-mark-fill" d="M16.6 16.8A7.2 7.2 0 0 1 8 7.4 7.2 7.2 0 1 0 16.6 16.8Z" />;
  if (kind === 'wiggle') return <path d="M4.5 14c2.3-6 4.8 6 7.1 0s4.8 6 7.1 0" />;
  return <><circle cx="12" cy="12" r="6.2" className="student-mark-fill" /><circle cx="9.5" cy="10" r=".8" fill="currentColor" /><circle cx="14.5" cy="10" r=".8" fill="currentColor" /><path d="M9 14c1.9 1.6 4.1 1.6 6 0" /></>;
}

export function StudentMark({ name, size = 'md', label, decorative = !label, className = '' }) {
  const config = markConfig[name] ?? markConfig.spark;
  const dimension = { sm: 20, md: 28, lg: 40, xl: 52 }[size] ?? (typeof size === 'number' ? size : 28);
  return <svg className={`student-mark student-mark-${config.tone} ${className}`.trim()} width={dimension} height={dimension} viewBox="0 0 24 24" fill="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={decorative || undefined} focusable="false"><MarkGlyph kind={config.kind} /></svg>;
}
