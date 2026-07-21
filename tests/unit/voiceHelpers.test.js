import { describe, expect, it } from 'vitest';
import { getVoiceCapabilities, voiceErrorMessage } from '#web/features/child-session/hooks/useVoice.js';

describe('voice helpers', () => {
  it('detects recognition and synthesis capabilities', () => {
    class Recognition {}
    class Utterance {}
    expect(getVoiceCapabilities({ SpeechRecognition: Recognition, speechSynthesis: {}, SpeechSynthesisUtterance: Utterance })).toMatchObject({ Recognition, canRecognize: true, canSynthesize: true });
    expect(getVoiceCapabilities({})).toMatchObject({ canRecognize: false, canSynthesize: false });
  });

  it('uses specific, child-safe microphone error messages', () => {
    expect(voiceErrorMessage('not-allowed')).toContain('permission');
    expect(voiceErrorMessage('service-not-allowed')).toContain('permission');
    expect(voiceErrorMessage('no-speech')).toContain('did not hear');
    expect(voiceErrorMessage('network')).toContain('taking a pause');
  });
});
