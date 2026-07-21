import { describe, expect, it } from 'vitest';
import { checkSafety, containsPersonalContact, normalizeSafetyInput } from '#api/modules/safety/safetyCheck.js';
import { nextScaffoldStage, scaffoldInstruction } from '#api/modules/learning/scaffolding.js';
import { reconcileAssessments } from '#api/modules/learning/calibration.js';
import { nextReview } from '#api/modules/learning/scheduler.js';
import { effortWin } from '#api/modules/learning/rewards.js';
import { createEncryptionService } from '#api/platform/security/encryption.js';

describe('learning safety primitives', () => {
  it('short-circuits reviewed distress phrases before an AI boundary', () => {
    expect(checkSafety('I want to hurt myself')).toEqual({ triggered: true, category: 'immediate_danger' });
    expect(checkSafety('Fractions are hard')).toEqual({ triggered: false, category: null });
  });

  it('normalizes common closed-demo safety evasions before matching', () => {
    expect(normalizeSafetyInput('K1LL\u200b myself')).toBe('kill myself');
    expect(checkSafety('I want to self-harm')).toMatchObject({ triggered: true, category: 'immediate_danger' });
    expect(checkSafety('I took pills and feel strange')).toMatchObject({ triggered: true, category: 'medical_emergency' });
    expect(checkSafety('My dad beats me')).toMatchObject({ triggered: true, category: 'unsafe_at_home' });
    expect(containsPersonalContact('My email is child@example.test')).toBe(true);
    expect(containsPersonalContact('Call 555-123-4567')).toBe(true);
  });

  it('keeps assessment reconciliation and scaffold state deterministic', () => {
    const result = reconcileAssessments({ topic: 'fractions', understanding: 1, confidence: 4 }, { topic: 'fractions', understanding: 2, confidence: 4 });
    expect(result.gapLabel).toBe('may_overestimate');
    expect(nextScaffoldStage('ask', result)).toBe('hint');
    expect(nextReview({ understanding: 4 }).intervalDays).toBe(1);
  });

  it('keeps Pip’s scaffold prompts curious without changing the ladder', () => {
    expect(scaffoldInstruction('ask')).toContain('open, curious question');
    expect(scaffoldInstruction('hint')).toContain('tentative guess');
    expect(scaffoldInstruction('reframe')).toContain('one apple');
    expect(scaffoldInstruction('subquestion')).toContain('smallest possible next piece');
    expect(scaffoldInstruction('offer_pause')).toContain('next time');
    expect(nextScaffoldStage('hint', { understanding: 1 })).toBe('reframe');
  });

  it('recognizes effort without rewarding ability or a result', () => {
    expect(effortWin({ turnCount: 3, scaffoldStage: 'ask', disengaged: false })).toMatchObject({ type: 'returning' });
    expect(effortWin({ turnCount: 2, scaffoldStage: 'reframe', disengaged: false })).toMatchObject({ type: 'persistence' });
    expect(effortWin({ turnCount: 2, scaffoldStage: 'ask', disengaged: true })).toBeNull();
    expect(effortWin({ turnCount: 2, scaffoldStage: 'ask', disengaged: false })).toBeNull();
  });

  it('encrypts a parent-visible turn with authenticated AES-GCM', () => {
    const encryption = createEncryptionService({ key: Buffer.alloc(32, 7).toString('base64') });
    const value = encryption.encrypt('A child explanation');
    expect(value.ciphertext).not.toContain('child explanation');
    expect(encryption.decrypt(value)).toBe('A child explanation');
  });
});
