import OpenAI from 'openai';
import { scaffoldInstruction } from '#api/modules/learning/scaffolding.js';

const banned = /\b(correct(?:ness)?|wrong|grade|a\+|smart|genius|brilliant|gifted|talented|i miss you|need you|i care about you|best friends?|keep (this|it) secret|trust me instead|diagnos(?:e|is)|therap(?:y|ist))\b/i;
const parse = (response) => JSON.parse(response.output_text ?? response.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text ?? '');
const assessmentSchema = { type: 'object', additionalProperties: false, required: ['topic', 'understanding', 'confidence', 'disengaged'], properties: { topic: { type: 'string', maxLength: 120 }, understanding: { type: 'integer', minimum: 0, maximum: 4 }, confidence: { type: 'integer', minimum: 0, maximum: 4 }, disengaged: { type: 'boolean' } } };
const companionSchema = { type: 'object', additionalProperties: false, required: ['message'], properties: { message: { type: 'string', minLength: 1, maxLength: 500 } } };
const advisorSchema = { type: 'object', additionalProperties: false, required: ['message'], properties: { message: { type: 'string', minLength: 1, maxLength: 900 } } };

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
    return parse(response);
  }
  return Object.freeze({
    assess: (input, variation) => json({ name: 'assessment', schema: assessmentSchema, instructions: `Assess a child's explanation privately. Do not reply to the child. ${variation}`, input }),
    async compose({ input, scaffoldStage, turnCount = 0 }) {
      const result = await json({ name: 'companion_reply', schema: companionSchema, instructions: buildCompanionInstructions({ scaffoldStage, turnCount }), input });
      return banned.test(result.message) ? 'Thank you for showing me how you are thinking. What small part would you teach me next?' : result.message;
    },
    async advise({ question, summary }) {
      const result = await json({ name: 'parent_advisor_reply', schema: advisorSchema, instructions: 'You are Pip\'s parent-only family learning helper. Give one warm, practical suggestion based only on the supplied safe dashboard summary. Never diagnose, grade, label ability, claim certainty about a child, or encourage surveillance. Do not repeat private child words. Do not give medical, legal, or safety-crisis advice; direct the parent to an appropriate trusted professional or emergency service when needed. Keep the answer under 140 words, use supportive language, and say suggestions are optional.', input: `SAFE SUMMARY:\n${summary}\n\nPARENT QUESTION:\n${question}` });
      return banned.test(result.message) ? 'Here is one optional, low-pressure idea: ask what part of the day they would like to show you, then follow their lead.' : result.message;
    }
  });
}
