const stages = ['ask', 'hint', 'reframe', 'subquestion', 'offer_pause'];

const stageInstructions = Object.freeze({
  ask: 'Ask Pip\'s open, curious question about what the child just said and what they could teach Pip next.',
  hint: 'Offer Pip\'s tiny, tentative guess (for example, "Is it maybe because...?") and invite the child to show Pip another way.',
  reframe: 'Ask the same idea with one smaller, concrete example, such as "What if it was just one apple instead — what would happen?"',
  subquestion: 'Ask for the smallest possible next piece Pip can learn, using one simple question.',
  offer_pause: 'Remove pressure: say it is okay and the child can show Pip next time, then gently move on without asking them to keep working.'
});

export function scaffoldInstruction(stage = 'ask') {
  return stageInstructions[stage] ?? stageInstructions.ask;
}

export function nextScaffoldStage(current = 'ask', { disengaged = false, understanding = 0 } = {}) {
  if (disengaged || current === 'offer_pause') return 'offer_pause';
  if (understanding >= 3) return 'ask';
  return stages[Math.min(stages.indexOf(current) + 1, stages.length - 1)];
}
