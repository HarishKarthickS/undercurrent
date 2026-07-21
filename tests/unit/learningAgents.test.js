import { describe, expect, it, vi } from 'vitest';

const { responsesCreate } = vi.hoisted(() => ({ responsesCreate: vi.fn() }));
vi.mock('openai', () => ({ default: class OpenAI { constructor() { this.responses = { create: responsesCreate }; } } }));

import { buildCompanionInstructions, createLearningAgents } from '#api/modules/ai/learningAgents.js';

describe('Pip companion instructions', () => {
  it('keeps the persona and safety boundaries in its constrained reply prompt', () => {
    const instructions = buildCompanionInstructions({ scaffoldStage: 'ask', turnCount: 1 });
    expect(instructions).toContain('You are Pip');
    expect(instructions).toContain('child is teaching you');
    expect(instructions).toContain('Never use grades, scores, correctness language');
    expect(instructions).toContain('neediness, friendship, secrecy, or therapeutic authority');
    expect(instructions).not.toContain('Include this disclosure naturally');
  });

  it('filters a mocked correctness or grade reply through the existing safe fallback', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ message: 'That is correct. You deserve a grade!' }) });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.compose({ input: 'I used halves.', scaffoldStage: 'ask', turnCount: 1 })).resolves.toBe('Thank you for showing me how you are thinking. What small part would you teach me next?');
  });

  it('reads OpenRouter Responses output when output_text is omitted', async () => {
    responsesCreate.mockResolvedValueOnce({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ message: 'What did you notice next?' }) }] }] });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.compose({ input: 'I watched clouds.', scaffoldStage: 'ask', turnCount: 1 })).resolves.toBe('What did you notice next?');
  });

  it('keeps private assessments on the structured assessment contract', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ topic: 'fractions', understanding: 2, confidence: 3, disengaged: false }) });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.assess('I used halves.', 'Focus on ideas.')).resolves.toMatchObject({ topic: 'fractions' });
  });

  it('filters a mocked dependency reply through the existing safe fallback', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ message: 'I miss you when you are away.' }) });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.compose({ input: 'I learned about planets.', scaffoldStage: 'ask', turnCount: 1 })).resolves.toBe('Thank you for showing me how you are thinking. What small part would you teach me next?');
  });

  it('requires the helper disclosure on the third and sixth replies only', () => {
    expect(buildCompanionInstructions({ scaffoldStage: 'hint', turnCount: 3 })).toContain('Include this disclosure naturally');
    expect(buildCompanionInstructions({ scaffoldStage: 'hint', turnCount: 6 })).toContain('Include this disclosure naturally');
    expect(buildCompanionInstructions({ scaffoldStage: 'hint', turnCount: 2 })).not.toContain('Include this disclosure naturally');
  });

  it('falls back when assessment output is prose instead of schema JSON', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: 'That is correct! The moon reflects sunlight.' });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.assess('The moon reflects sunlight.', 'Focus on ideas.')).resolves.toMatchObject({ topic: 'The moon reflects sunlight.', understanding: 2, confidence: 2, disengaged: false });
  });

  it('falls back when companion output is not JSON', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: 'Plain prose without JSON.' });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.compose({ input: 'I watched clouds.', scaffoldStage: 'ask', turnCount: 1 })).resolves.toBe('Thank you for showing me how you are thinking. What small part would you teach me next?');
  });

  it('keeps parent-advisor replies inside the same no-grades safety boundary', async () => {
    responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ message: 'Your child is brilliant and deserves an A+.' }) });
    const agents = createLearningAgents({ apiKey: 'test-key', model: 'test-model' });
    await expect(agents.advise({ question: 'What should I do?', summary: '{}' })).resolves.toContain('optional, low-pressure idea');
  });
});
