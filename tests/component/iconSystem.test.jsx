// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppIcon, StudentMark } from '#web/shared/components/index.js';

describe('shared icon system', () => {
  it('keeps decorative icons out of the accessibility tree and labels meaningful icons', () => {
    const { container } = render(<><AppIcon name="settings" decorative /><AppIcon name="alert" label="Safety notice" /></>);
    expect(container.querySelector('.app-icon-settings')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('img', { name: 'Safety notice' })).toBeTruthy();
  });

  it('maps student concepts to expressive SVG marks instead of text glyphs', () => {
    const { container } = render(<><StudentMark name="bright" label="Bright mood" /><StudentMark name="compass" decorative /></>);
    expect(screen.getByRole('img', { name: 'Bright mood' })).toBeTruthy();
    expect(container.querySelectorAll('.student-mark').length).toBe(2);
    expect(container.textContent).toBe('');
  });
});
