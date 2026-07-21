// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CuriosityTrail } from '#web/features/child-session/index.js';

const days = Array.from({ length: 7 }, (_value, index) => ({ date: `2026-07-${String(13 + index).padStart(2, '0')}`, completed: index === 1 || index === 5 }));

describe('CuriosityTrail', () => {
  it('shows seven neutral-or-completed day markers with non-punitive copy', () => {
    render(<CuriosityTrail days={days} />);
    expect(screen.getByRole('heading', { name: 'Curiosity Trail' })).toBeTruthy();
    expect(screen.getByText('Every day you show up is one more step — missing a day doesn’t undo it.')).toBeTruthy();
    expect(screen.getByLabelText('2026-07-14: session completed')).toBeTruthy();
    expect(screen.getByLabelText('2026-07-13: no session recorded')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });
});
