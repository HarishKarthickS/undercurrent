// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVoice } from '#web/features/child-session/hooks/useVoice.js';

function browserWithVoice() {
  const instances = [];
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.onstart?.(); }
    stop() { this.onend?.(); }
  }
  class Utterance { constructor(message) { this.message = message; } }
  return { browser: { SpeechRecognition: Recognition, SpeechSynthesisUtterance: Utterance, speechSynthesis: { cancel: vi.fn(), speak: vi.fn((utterance) => utterance.onstart?.()) } }, instances };
}

describe('useVoice', () => {
  it('handles unavailable browser voice features', () => {
    const { result } = renderHook(() => useVoice({ browser: {} }));
    act(() => expect(result.current.startListening()).toBe(false));
    expect(result.current.error).toContain('not available');
    act(() => expect(result.current.speak('hello')).toBe(false));
    expect(result.current.error).toContain('playback');
  });

  it('transcribes, stops, handles recognition errors, and speaks', () => {
    const onTranscript = vi.fn(); const { browser, instances } = browserWithVoice();
    const { result } = renderHook(() => useVoice({ browser, onTranscript }));
    act(() => expect(result.current.startListening()).toBe(true));
    const recognition = instances[0];
    act(() => recognition.onresult({ results: [[{ transcript: 'hello ' }], [{ transcript: 'Pip' }]] }));
    expect(result.current.transcript).toBe('hello Pip');
    act(() => recognition.onresult({ results: Object.assign([[{ transcript: 'hello Pip' }]], { 0: Object.assign([{ transcript: 'hello Pip' }], { isFinal: true }) }) }));
    expect(onTranscript).toHaveBeenCalledWith('hello Pip');
    act(() => recognition.onerror({ error: 'no-speech' }));
    expect(result.current.error).toContain('did not hear');
    act(() => result.current.stopListening());
    act(() => expect(result.current.speak('Learn this')).toBe(true));
    expect(browser.speechSynthesis.speak).toHaveBeenCalled();
    act(() => browser.speechSynthesis.speak.mock.calls[0][0].onerror());
    expect(result.current.error).toContain('playback paused');
    act(() => recognition.onend());
  });

  it('handles a recognition start failure', () => {
    class Recognition { start() { throw new Error('no microphone'); } }
    const { result } = renderHook(() => useVoice({ browser: { SpeechRecognition: Recognition } }));
    act(() => expect(result.current.startListening()).toBe(false));
    expect(result.current.error).toContain('taking a pause');
  });
});
