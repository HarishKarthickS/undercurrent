export function reconcileAssessments(first, second) {
  const average = (key) => Math.round((Number(first[key] ?? 0) + Number(second[key] ?? 0)) / 2);
  const understanding = average('understanding');
  const confidence = average('confidence');
  const difference = confidence - understanding;
  return {
    understanding, confidence,
    gapLabel: difference >= 2 ? 'may_overestimate' : difference <= -2 ? 'may_underestimate' : 'aligned',
    topic: first.topic || second.topic || 'Today\'s idea',
    disengaged: Boolean(first.disengaged || second.disengaged)
  };
}
