// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '#web/features/landing/components/LandingPage.jsx';

describe('LandingPage', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('sends every prominent setup action to parent setup and keeps sign-in separate', () => {
    const onGetStarted = vi.fn();
    const onSignIn = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} onSignIn={onSignIn} />);

    fireEvent.click(screen.getAllByRole('button', { name: /start parent setup/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /parent sign in/i })[0]);

    expect(onGetStarted).toHaveBeenCalledOnce();
    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('exposes labelled anchor navigation and closes the mobile menu with Escape', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<LandingPage onGetStarted={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Landing page' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open page navigation' }));
    expect(document.querySelector('#field-guide-mobile-nav a')?.getAttribute('href')).toBe('#the-trail');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open page navigation' }).getAttribute('aria-expanded')).toBe('false');
  });
});
