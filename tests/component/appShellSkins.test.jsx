// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from '#web/app/AppShell.jsx';

afterEach(cleanup);

describe('product skins', () => {
  it('keeps the child trail and parent evening on separate shells', () => {
    const { container: child } = render(<AppShell routeType="student" onNavigate={() => {}} onSignOut={() => {}}>trail</AppShell>);
    expect(child.querySelector('.app-shell-student')).toBeTruthy();
    expect(child.querySelector('[data-skin="student"]')).toBeTruthy();
    expect(screen.queryByText('Student space')).toBeNull();
    cleanup();
    const { container: parent } = render(<AppShell routeType="parent" onNavigate={() => {}} onSignOut={() => {}}>evening</AppShell>);
    expect(parent.querySelector('.app-shell-parent')).toBeTruthy();
    expect(parent.querySelector('[data-skin="parent"]')).toBeTruthy();
    expect(screen.getByText('Evening summary')).toBeTruthy();
  });
});
