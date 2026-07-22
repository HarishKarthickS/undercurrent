import { describe, expect, it, vi } from 'vitest';

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn(async (payload) => payload);
  const createTransport = vi.fn(() => ({ sendMail, verify: async () => true }));
  return { sendMail, createTransport };
});

vi.mock('nodemailer', () => ({ default: { createTransport } }));

import { createMailer } from '#api/platform/notifications/mailer.js';

describe('mailer copy', () => {
  it('sends branded HTML and plain-text verification mail', async () => {
    const mailer = createMailer({ smtpUrl: 'smtps://example', from: 'Undercurrent <demo@example.com>', publicAppUrl: 'https://demo.example' });
    await mailer.sendParentVerification({ parent: { id: 'parent-1', email: 'parent@example.com', displayName: 'Sam' }, token: 'verify-token' });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'parent@example.com',
      subject: 'Confirm your Undercurrent parent account',
      text: expect.stringContaining('https://demo.example/parent/verify?parent=parent-1&token=verify-token'),
      html: expect.stringContaining('Verify my email')
    }));
    expect(sendMail.mock.calls[0][0].html).toContain('family control center');
  });

  it('escapes student names in device invitation HTML', async () => {
    const mailer = createMailer({ smtpUrl: null, from: 'Undercurrent <demo@example.com>', publicAppUrl: 'https://demo.example' });
    await mailer.sendStudentInvitation({ student: { name: 'Ari <script>' }, destinationEmail: 'parent@example.com', token: 'invite-token' });
    const payload = sendMail.mock.calls.at(-1)[0];
    expect(payload.html).toContain('Ari &lt;script&gt;');
    expect(payload.html).not.toContain('<script>');
    expect(payload.subject).toContain("Ari <script>'s Undercurrent trail");
  });

  it('keeps safety alerts calm and actionable', async () => {
    const mailer = createMailer({ smtpUrl: null, from: 'Undercurrent <demo@example.com>', publicAppUrl: 'https://demo.example' });
    await mailer.sendSafetyAlert({ parent: { email: 'parent@example.com', displayName: 'Sam' }, student: { name: 'Bryn' }, category: 'self_harm' });
    const payload = sendMail.mock.calls.at(-1)[0];
    expect(payload.subject).toContain('Please check in with Bryn');
    expect(payload.text).toContain('Category: self harm');
    expect(payload.html).toContain('Open family control center');
  });
});
