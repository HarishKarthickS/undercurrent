// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getParentConversation, getParentConversations } = vi.hoisted(() => ({ getParentConversation: vi.fn(), getParentConversations: vi.fn() }));
vi.mock('#web/features/child-session/index.js', () => ({ getParentConversation, getParentConversations }));
import { ConversationsPage } from '#web/features/parent-dashboard/components/ParentDetailPages.jsx';

afterEach(cleanup);

describe('ConversationsPage', () => {
  it('shows a live ordinary conversation and its saved messages', async () => {
    getParentConversations.mockResolvedValue({ conversations: [{ id: 'session-1', type: 'evening', mode: 'chat', startedAt: '2026-07-21T12:00:00.000Z', turnCount: 1, live: true }] });
    getParentConversation.mockResolvedValue({ conversation: { id: 'session-1', type: 'evening', mode: 'chat', live: true }, turns: [{ id: 'turn-1', role: 'child', text: 'I saw a rainbow.', createdAt: '2026-07-21T12:01:00.000Z' }, { id: 'turn-2', role: 'companion', text: 'What colors did you notice?', createdAt: '2026-07-21T12:01:02.000Z' }] });
    render(<ConversationsPage student={{ id: 'student-1' }} />);
    await waitFor(() => expect(screen.getByText('I saw a rainbow.')).toBeTruthy());
    expect(screen.getByText('What colors did you notice?')).toBeTruthy();
    expect(screen.getAllByText('Live now').length).toBeGreaterThan(0);
  });
});
