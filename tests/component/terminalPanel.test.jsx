// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TerminalPanel } from '#web/features/child-session/components/TerminalPanel.jsx';

describe('TerminalPanel', () => {
  it('renders normal and safety endings and returns to the child space', () => {
    const onReturn = vi.fn();
    const { rerender } = render(<TerminalPanel onReturn={onReturn} />);
    expect(screen.getByText('You can come back whenever you want.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Return to child space' }));
    expect(onReturn).toHaveBeenCalledOnce();
    rerender(<TerminalPanel safety onReturn={onReturn} />);
    expect(screen.getByText('Please tell a trusted grown-up near you right now.')).toBeTruthy();
    rerender(<TerminalPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Return to child space' }));
  });
});
