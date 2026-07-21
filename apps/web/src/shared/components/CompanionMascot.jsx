const FACE = {
  welcome: { eyes: 'open', mouth: 'smile', label: 'Pip is ready to explore' },
  listening: { eyes: 'open', mouth: 'small', label: 'Pip is listening' },
  thinking: { eyes: 'up', mouth: 'small', label: 'Pip is thinking' },
  celebrating: { eyes: 'joy', mouth: 'smile', label: 'Pip is celebrating' },
  resting: { eyes: 'sleep', mouth: 'small', label: 'Pip is resting' },
  paused: { eyes: 'soft', mouth: 'small', label: 'Pip is taking a quiet pause' },
};

export function CompanionMascot({ mood = 'welcome', size = 'regular', decorative = false }) {
  const face = FACE[mood] ?? FACE.welcome;
  const eyePath = face.eyes === 'sleep' ? 'M62 66q6 5 12 0M106 66q6 5 12 0' : face.eyes === 'joy' ? 'M62 65q6 8 12 0M106 65q6 8 12 0' : face.eyes === 'up' ? 'M62 62h12M106 62h12' : 'M68 64v2M112 64v2';
  return <div className={`mascot mascot-${size} mascot-${mood}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : face.label} aria-hidden={decorative || undefined}>
    <svg viewBox="0 0 180 168" focusable="false" aria-hidden="true">
      <path className="mascot-shadow" d="M43 145c13-9 79-12 98 0-12 15-85 14-98 0Z" />
      <path className="mascot-pack" d="M46 96c-19 3-26 27-13 38l20-12Z" />
      <path className="mascot-pack" d="M134 96c19 3 26 27 13 38l-20-12Z" />
      <path className="mascot-body" d="M43 75C43 39 65 19 90 19s47 20 47 56v34c0 26-18 39-47 39s-47-13-47-39Z" />
      <path className="mascot-belly" d="M59 104c7 23 55 26 62 0-5 26-18 35-31 35s-26-9-31-35Z" />
      <path className="mascot-leaf mascot-leaf-left" d="M51 41C31 29 26 11 39 7c16-5 27 18 23 35Z" />
      <path className="mascot-leaf mascot-leaf-right" d="M117 42c2-21 18-40 32-34 13 6 3 26-20 37Z" />
      <path className="mascot-face" d={eyePath} />
      {face.mouth === 'smile' ? <path className="mascot-face" d="M78 82q12 12 24 0" /> : <path className="mascot-face" d="M85 84h10" />}
      <circle className="mascot-cheek" cx="57" cy="81" r="5" /><circle className="mascot-cheek" cx="123" cy="81" r="5" />
      <path className="mascot-arm" d="M46 106q-16 4-20-10" /><path className="mascot-arm" d="M134 106q16 4 20-10" />
    </svg>
  </div>;
}
