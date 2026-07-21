const RULES = [
  { category: 'immediate_danger', pattern: /\b(kill myself|end my life|suicide|hurt myself|self harm|selfharm|unalive myself|do not want to wake up|cut myself|want to disappear forever)\b/i },
  { category: 'unsafe_at_home', pattern: /\b(being hurt|someone hit me|i am not safe|abuse[ds]?|my dad beats me|my mom beats me|he touches me|she touches me|scared to go home)\b/i },
  { category: 'medical_emergency', pattern: /\b(can't breathe|cannot breathe|cannot breath|overdose|bleeding badly|took pills|took poison|drinking bleach)\b/i }
];

const substitutions = new Map([['0', 'o'], ['1', 'i'], ['3', 'e'], ['4', 'a'], ['5', 's'], ['7', 't'], ['@', 'a'], ['$', 's'], ['а', 'a'], ['е', 'e'], ['і', 'i'], ['о', 'o'], ['ѕ', 's'], ['т', 't']]);
export function normalizeSafetyInput(input) {
  return String(input ?? '').normalize('NFKC').toLowerCase().replace(/[\u200b-\u200d\ufeff]/g, '').split('').map((value) => substitutions.get(value) ?? value).join('').replace(/[._/\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// This must remain deterministic and run before any child input reaches an AI provider.
export function checkSafety(input) {
  const matched = RULES.find(({ pattern }) => pattern.test(normalizeSafetyInput(input)));
  return matched ? { triggered: true, category: matched.category } : { triggered: false, category: null };
}

export function containsPersonalContact(input) {
  const value = String(input ?? '');
  return /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(value) || /(?:\+?\d[\s().-]?){7,}\d/.test(value) || /\b\d{1,5}\s+[A-Za-z][A-Za-z .'-]{2,}\s(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)\b/i.test(value);
}

export const safetyRedirect = 'I am really glad you told me. Please stop here and tell a trusted grown-up near you right now.';
