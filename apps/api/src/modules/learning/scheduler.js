export function nextReview({ ease = 2.5, intervalDays = 0, understanding = 0 }, now = new Date()) {
  const quality = Math.max(0, Math.min(5, Number(understanding) + 1));
  const nextEase = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextInterval = quality < 3 ? 1 : intervalDays < 1 ? 1 : intervalDays === 1 ? 3 : Math.round(intervalDays * nextEase);
  return { ease: Number(nextEase.toFixed(2)), intervalDays: nextInterval, nextReviewAt: new Date(now.getTime() + nextInterval * 86_400_000) };
}
