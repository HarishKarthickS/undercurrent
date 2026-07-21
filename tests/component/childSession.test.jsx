// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useChildSessionMock, useVoiceMock } = vi.hoisted(() => ({ useChildSessionMock: vi.fn(), useVoiceMock: vi.fn() }));
vi.mock('#web/features/child-session/hooks/useChildSession.js', () => ({ useChildSession: useChildSessionMock }));
vi.mock('#web/features/child-session/hooks/useVoice.js', () => ({ useVoice: useVoiceMock }));
import { ChildSession } from '#web/features/child-session/components/ChildSession.jsx';

afterEach(cleanup);

const base = { text: '', setText: vi.fn(), status: 'idle', setStatus: vi.fn(), morningStep: 'mood', response: 'Pip here!', submit: vi.fn(), submitTyped: vi.fn(), chooseMood: vi.fn(), chooseSendOff: vi.fn() };

function renderSession(overrides = {}, voice = {}) {
  useChildSessionMock.mockReturnValue({ ...base, ...overrides });
  useVoiceMock.mockReturnValue({ canRecognize: false, canSynthesize: false, isListening: false, isSpeaking: false, transcript: '', error: '', startListening: vi.fn(), stopListening: vi.fn(), speak: vi.fn(), ...voice });
  return render(<ChildSession session={{ sessionId: 's', sessionType: overrides.sessionType ?? 'evening', openingPrompt: 'Pip here!' }} busy={false} onSubmitTurn={vi.fn()} onEnd={vi.fn()} onExitTerminal={vi.fn()} />);
}

describe('ChildSession', () => {
  it('renders evening controls and submits a quick response', () => {
    const submit = vi.fn();
    renderSession({ ...base, submit });
    fireEvent.click(screen.getByRole('button', { name: 'I learned about fractions.' }));
    expect(submit).toHaveBeenCalledWith('I learned about fractions.', 'tap');
    expect(screen.getByText('Voice input is unavailable here. Type or tap instead.')).toBeTruthy();
  });

  it('renders morning mood choices and terminal states', () => {
    const chooseMood = vi.fn();
    renderSession({ ...base, sessionType: 'morning', chooseMood });
    fireEvent.click(screen.getByRole('button', { name: 'Curious' }));
    expect(chooseMood).toHaveBeenCalledWith('Curious');
    renderSession({ ...base, status: 'safety-ended' });
    expect(screen.getByText('This session is paused.')).toBeTruthy();
  });

  it('shows send-off, completed, speaking, and available-voice controls', () => {
    const chooseSendOff = vi.fn(); const onEnd = vi.fn(); const speak = vi.fn(); const startListening = vi.fn(); const stopListening = vi.fn();
    useChildSessionMock.mockReturnValue({ ...base, morningStep: 'sendoff', response: 'Tell me more!', chooseSendOff });
    useVoiceMock.mockReturnValue({ canRecognize: true, canSynthesize: true, isListening: false, isSpeaking: true, transcript: 'A transcript', error: 'Oops', startListening, stopListening, speak });
    render(<ChildSession session={{ sessionId: 'm', sessionType: 'morning', openingPrompt: 'Pip' }} busy={false} onSubmitTurn={vi.fn()} onEnd={onEnd} onExitTerminal={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask a good question' }));
    expect(chooseSendOff).toHaveBeenCalledWith('Ask a good question');
    expect(screen.getByRole('alert').textContent).toContain('Oops');
    useChildSessionMock.mockReturnValue({ ...base, morningStep: 'complete' });
    render(<ChildSession session={{ sessionId: 'c', sessionType: 'morning', openingPrompt: 'Pip' }} busy={false} onSubmitTurn={vi.fn()} onEnd={onEnd} onExitTerminal={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Finish for now' }).at(-1));
    expect(onEnd).toHaveBeenCalledWith('child_exit');
  });

  it('uses typed, speech, playback, finish, and normal-terminal callbacks', () => {
    const submitTyped = vi.fn((event) => event.preventDefault()); const setText = vi.fn(); const onEnd = vi.fn(); const onReturn = vi.fn(); const speak = vi.fn(); const startListening = vi.fn();
    useChildSessionMock.mockReturnValue({ ...base, text: 'A lesson', setText, submitTyped });
    useVoiceMock.mockReturnValue({ canRecognize: true, canSynthesize: true, isListening: false, isSpeaking: false, transcript: '', error: '', startListening, stopListening: vi.fn(), speak });
    render(<ChildSession session={{ sessionId: 'e', sessionType: 'evening', openingPrompt: 'Pip' }} busy={false} onSubmitTurn={vi.fn()} onEnd={onEnd} onExitTerminal={onReturn} />);
    fireEvent.change(screen.getByPlaceholderText('I learned that...'), { target: { value: 'Changed' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Share it' }).closest('form'));
    fireEvent.click(screen.getByRole('button', { name: /Hear that again/ }));
    fireEvent.click(screen.getByRole('button', { name: /Talk instead/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish for now' }));
    expect(setText).toHaveBeenCalled(); expect(submitTyped).toHaveBeenCalled(); expect(speak).toHaveBeenCalledWith('Pip here!'); expect(startListening).toHaveBeenCalled(); expect(onEnd).toHaveBeenCalledWith('child_exit');
    renderSession({ ...base, status: 'ended' });
    fireEvent.click(screen.getByRole('button', { name: 'Return to child space' }));
  });

  it('reflects listening activity in the session status', () => {
    const setStatus = vi.fn();
    renderSession({ ...base, setStatus }, { canRecognize: true, canSynthesize: false, isListening: true });
    expect(setStatus).toHaveBeenCalledWith('listening');
    useVoiceMock.mock.calls.at(-1)[0].onTranscript('spoken words');
    expect(base.submit).toHaveBeenCalledWith('spoken words', 'voice');
  });

  it('shows a clear waiting panel and locks new answers while Pip thinks', () => {
    renderSession({ ...base, status: 'thinking' });
    expect(screen.getByText('Pip is following your idea...')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'I learned about fractions.' }).disabled).toBe(true);
  });

  it('uses the dedicated Talk to Pip surface for open chat sessions', () => {
    useChildSessionMock.mockReturnValue({ ...base, messages: [{ role: 'pip', text: 'What should we wonder about?' }] });
    useVoiceMock.mockReturnValue({ canRecognize: true, canSynthesize: true, isListening: false, isSpeaking: false, transcript: '', error: '', startListening: vi.fn(), stopListening: vi.fn(), speak: vi.fn() });
    render(<ChildSession session={{ sessionId: 'chat', sessionType: 'evening', mode: 'chat', openingPrompt: 'What should we wonder about?' }} busy={false} onSubmitTurn={vi.fn()} onEnd={vi.fn()} onExitTerminal={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'What is on your mind?' })).toBeTruthy();
    expect(screen.getByText('Can I ask a why question?')).toBeTruthy();
  });
});
