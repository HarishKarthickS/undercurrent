const catalog = [
  {
    id: 'pattern-picnic',
    title: 'Pattern picnic',
    topic: 'patterns',
    theme: 'meadow',
    collectible: 'leaf',
    opening: 'Let\'s spot a pattern hiding in your day. Where did you notice something repeating?',
    choices: ['A sound', 'Something I saw', 'A game or rule']
  },
  {
    id: 'why-window',
    title: 'Why window',
    topic: 'how things work',
    theme: 'sky',
    collectible: 'compass',
    opening: 'Open a tiny why-window with me. What is something you wonder happens for a reason?',
    choices: ['Something outside', 'Something in my body', 'Something I use']
  },
  {
    id: 'change-maker',
    title: 'Change maker',
    topic: 'cause and effect',
    theme: 'citrus',
    collectible: 'spark',
    opening: 'Imagine changing just one small thing. What do you think would happen next?',
    choices: ['Change the weather', 'Change a rule', 'Change an object']
  }
];

const steps = [
  { id: 'spark', label: 'Pick a spark', prompt: 'Choose a tiny place to begin.' },
  { id: 'explain', label: 'Teach Pip', prompt: 'Tell Pip what you notice or already know.' },
  { id: 'try', label: 'Try it another way', prompt: 'Use Pip\'s little challenge to grow the idea.' },
  { id: 'reflect', label: 'Keep the idea', prompt: 'Give your discovery a short name.' }
];

export function questFor({ questId, mode = 'quest', studentId = '' }) {
  if (mode === 'chat') return {
    id: 'talk-to-pip', title: 'Talk to Pip', topic: 'your curiosity', theme: 'mist', collectible: 'cloud',
    opening: 'Pip is ready to wonder with you. What would you like to explore?', choices: ['A question I have', 'Something from school', 'Something I noticed']
  };
  if (questId?.startsWith('review:')) {
    const topic = questId.slice('review:'.length).slice(0, 120) || 'an earlier idea';
    return { id: questId, title: 'Remember & remix', topic, theme: 'sunrise', collectible: 'sunbeam', opening: `Pip remembers you explored ${topic}. Can you show Pip one part in a new way?`, choices: ['Give an example', 'Draw it with words', 'Tell what changed'] };
  }
  const seed = [...studentId].reduce((total, character) => total + character.charCodeAt(0), new Date().getDate());
  return catalog.find((quest) => quest.id === questId) ?? catalog[seed % catalog.length];
}

export function questState({ quest, turnCount = 0, scaffoldStage = 'ask' }) {
  const step = steps[Math.min(Math.max(turnCount, 0), steps.length - 1)];
  const nextAction = turnCount >= 3 ? 'finish' : step.id;
  return {
    title: quest.title,
    topic: quest.topic,
    theme: quest.theme,
    collectible: quest.collectible,
    step: nextAction,
    stepLabel: turnCount >= 3 ? 'Make your keepsake' : step.label,
    prompt: turnCount >= 3 ? 'Your idea has a lovely shape now. Give it a tiny name or keep it for later.' : step.prompt,
    choices: turnCount === 0 ? quest.choices : turnCount === 1 ? ['Show an example', 'What would change?', 'Say it another way'] : turnCount === 2 ? ['I want to name it', 'One more thought', 'Keep it for later'] : [],
    inputModes: ['tap', 'typed', 'voice'],
    progressMoment: turnCount >= 3 ? 'You made a discovery worth keeping.' : turnCount > 0 ? 'Pip is following your idea.' : 'A small spark is plenty.',
    scaffoldStage
  };
}

export function questStarters() {
  return catalog.map(({ id, title, topic, theme, collectible, choices }) => ({ id, title, topic, theme, collectible, choices }));
}
