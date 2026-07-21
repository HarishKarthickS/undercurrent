// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChildSession } from '#web/features/child-session/hooks/useChildSession.js';

const session = { sessionId: 'session', openingPrompt: 'Welcome Pip', sessionType: 'evening' };

describe('useChildSession', () => {
  it('submits terminal replies and resets with a new session', async () => {
    const onSubmitTurn = vi.fn(async () => ({ message: 'Thanks!', terminal: true }));
    const { result, rerender } = renderHook((props) => useChildSession(props), { initialProps: { session, busy: false, onSubmitTurn, onEnd: vi.fn() } });
    await act(async () => { await result.current.submit('hello', 'typed'); });
    expect(onSubmitTurn).toHaveBeenCalledWith('hello', 'typed');
    expect(result.current.status).toBe('ended');
    rerender({ session: { ...session, sessionId: 'new', openingPrompt: 'New prompt' }, busy: false, onSubmitTurn, onEnd: vi.fn() });
    expect(result.current.response).toBe('New prompt');
  });

  it('completes a morning send-off', async () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useChildSession({ session: { ...session, sessionType: 'morning' }, busy: false, onSubmitTurn: vi.fn(), onEnd }));
    act(() => result.current.chooseMood('Curious'));
    await act(async () => { await result.current.chooseSendOff('Ask a good question'); });
    expect(result.current.status).toBe('completed');
    expect(onEnd).toHaveBeenCalledWith('completed');
  });

  it('submits typed text through the form helper', async () => {
    const onSubmitTurn = vi.fn(async () => ({ message: 'Thanks!', terminal: false }));
    const { result } = renderHook(() => useChildSession({ session, busy: false, onSubmitTurn, onEnd: vi.fn() }));
    act(() => result.current.setText('Typed lesson'));
    await act(async () => { await result.current.submitTyped({ preventDefault: vi.fn() }); });
    expect(onSubmitTurn).toHaveBeenCalledWith('Typed lesson', 'typed');
  });
});
