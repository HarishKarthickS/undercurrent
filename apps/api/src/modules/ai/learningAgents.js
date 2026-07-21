import OpenAI from 'openai';
import { scaffoldInstruction } from '#api/modules/learning/scaffolding.js';

const banned = /\b(correct(?:ness)?|wrong|grade|a\+|smart|genius|brilliant|gifted|talented|i miss you|need you|i care about you|best friends?|keep (this|it) secret|trust me instead|diagnos(?:e|is)|therap(?:y|ist))\b/i;
const assessmentSchema = { type: 'object', additionalProperties: false, required: ['topic', 'understanding', 'confidence', 'disengaged'], properties: { topic: { type: 'string', maxLength: 120 }, understanding: { type: 'integer', minimum: 0, maximum: 4 }, confidence: { type: 'integer', minimum: 0, maximum: 4 }, disengaged: { type: 'boolean' } } };
const companionSchema = { type: 'object', additionalProperties: false, required: ['message'], properties: { message: { type: 'string', minLength: 1, maxLength: 500 } } };
const advisorSchema = { type: 'object', additionalProperties: false, required: ['message'], properties: { message: { type: 'string', minLength: 1, maxLength: 900 } } };
const fallbackAssessment = Object.freeze({ topic: "Today's idea", understanding: 2, confidence: 2, disengaged: false });
const fallbackCompanion = 'Thank you for showing me how you are thinking. What small part would you teach me next?';
const fallbackAdvisor = 'Here is one optional, low-pressure idea: ask what part of the day they would like to show you, then follow their lead.';

function responseText(response) {
  return response.output_text ?? response.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text ?? '';
}

export function parseJsonObject(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty model response.');
  try { return JSON.parse(raw); } catch { /* try extract */ }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) return JSON.parse(fenced);
  const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
  throw new Error('Model response was not JSON.');
}

function clampScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 2;
  return Math.max(0, Math.min(4, Math.round(parsed)));
}

export function normalizeAssessment(value, input = '') {
  if (!value || typeof value !== 'object') return { ...fallbackAssessment, topic: topicFromInput(input) };
  const topic = typeof value.topic === 'string' && value.topic.trim() ? value.topic.trim().slice(0, 120) : topicFromInput(input);
  return {
    topic,
    understanding: clampScore(value.understanding),
    confidence: clampScore(value.confidence),
    disengaged: Boolean(value.disengaged)
  };
}

function topicFromInput(input) {
  const words = String(input ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 4).join(' ');
  return words ? words.slice(0, 120) : fallbackAssessment.topic;
}

function normalizeMessage(value, fallback, maxLength = 500) {
  const message = typeof value?.message === 'string' ? value.message.trim() : '';
  if (!message) return fallback;
  return banned.test(message) ? fallback : message.slice(0, maxLength);
}

export function buildCompanionInstructions({ scaffoldStage, turnCount = 0 }) {
  const disclosure = turnCount === 3 || turnCount === 6 ? ' Include this disclosure naturally in this reply: "Just so you know — I\'m not a real person, I\'m a helper that loves learning from you."' : '';
  return `You are Pip, a small, endlessly curious learning helper. You are not a robot, human, or animal — you are simply a Pip. You never went to school, so the child is teaching you. Speak simply, be genuinely curious, and be delightfully confused rather than frustrated. Treat honest uncertainty warmly. Use light, specific humor only when it responds to what the child actually said.

Every reply must be one short, age-appropriate follow-up at scaffold stage ${scaffoldStage}, from Pip's point of view as a learner. ${scaffoldInstruction(scaffoldStage)} Ask about what Pip wants the child to teach next; never check, judge, or evaluate the child's understanding. Praise process rather than ability.

Voice examples:
- Curious follow-up: "Wait, really? Hmm, I thought maybe... no wait, you explain it — I bet you know better than me."
- Honest uncertainty: "Ooh, that's honest! I like when we figure things out together instead of just guessing."
- Clear explanation: "Ohhh, that makes sense now! Thanks for teaching me that."

Never use grades, scores, correctness language, or ability labels. Never claim feelings about being away from the child, neediness, friendship, secrecy, or therapeutic authority. State that Pip is a learning helper, not a person, when asked and whenever the disclosure instruction below requires it.${disclosure}`;
}

export function createLearningAgents({ apiKey, model, baseURL = undefined, timeout = 8_000 }) {
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey, timeout, maxRetries: 0, ...(baseURL ? { baseURL } : {}) });
  async function json({ instructions, input, schema, name }) {
    const response = await client.responses.create({ model, instructions, input, text: { format: { type: 'json_schema', name, strict: true, schema } } });
    return parseJsonObject(responseText(response));
  }
  return Object.freeze({
    async assess(input, variation) {
      try {
        const result = await json({ name: 'assessment', schema: assessmentSchema, instructions: `Assess a child's explanation privately. Do not reply to the child. Return ONLY JSON with keys topic (string), understanding (integer 0-4), confidence (integer 0-4), disengaged (boolean). ${variation}`, input });
        return normalizeAssessment(result, input);
      } catch {
        return normalizeAssessment(null, input);
      }
    },
    async compose({ input, scaffoldStage, turnCount = 0 }) {
      try {
        const result = await json({ name: 'companion_reply', schema: companionSchema, instructions: `${buildCompanionInstructions({ scaffoldStage, turnCount })}\n\nReturn ONLY JSON: {"message":"..."}`, input });
        return normalizeMessage(result, fallbackCompanion);
      } catch {
        return fallbackCompanion;
      }
    },
    async advise({ question, summary }) {
      try {
        const result = await json({ name: 'parent_advisor_reply', schema: advisorSchema, instructions: 'You are Pip\'s parent-only family learning helper. Give one warm, practical suggestion based only on the supplied safe dashboard summary. Never diagnose, grade, label ability, claim certainty about a child, or encourage surveillance. Do not repeat private child words. Do not give medical, legal, or safety-crisis advice; direct the parent to an appropriate trusted professional or emergency service when needed. Keep the answer under 140 words, use supportive language, and say suggestions are optional. Return ONLY JSON: {"message":"..."}.', input: `SAFE SUMMARY:\n${summary}\n\nPARENT QUESTION:\n${question}` });
        return normalizeMessage(result, fallbackAdvisor, 900);
      } catch {
        return fallbackAdvisor;
      }
    }
  });
}
