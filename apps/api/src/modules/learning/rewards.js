export function effortWin({ turnCount, scaffoldStage, disengaged }) {
  if (disengaged || turnCount < 2) return null;
  if (scaffoldStage === 'reframe' || scaffoldStage === 'subquestion') return { type: 'persistence', message: 'They stayed with an idea and tried another way of explaining it.' };
  return turnCount % 3 === 0 ? { type: 'returning', message: 'They made room for another thoughtful explanation.' } : null;
}
