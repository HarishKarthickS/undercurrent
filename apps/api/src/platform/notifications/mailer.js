import nodemailer from 'nodemailer';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function wrapHtml({ title, preview, bodyHtml, publicAppUrl }) {
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(preview);
  const appUrl = escapeHtml(publicAppUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f8ed;color:#18352e;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8ed;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:2px solid #18352e;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;background:linear-gradient(135deg,#dff4df,#fffaf0);border-bottom:1px solid #d5e4d6;">
              <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#43835b;">Undercurrent</p>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;font-weight:700;color:#18352e;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;font-size:16px;line-height:1.55;color:#18352e;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:13px;line-height:1.5;color:#587068;">
              <p style="margin:0 0 8px;">This is a closed Undercurrent demo email. It is not a public child service and does not provide verified parental consent.</p>
              <p style="margin:0;"><a href="${appUrl}" style="color:#5aaa69;font-weight:700;text-decoration:none;">Open Undercurrent</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(label, href) {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#18352e;color:#fffdf8;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#587068;word-break:break-all;">If the button does not work, copy this link:<br /><a href="${escapeHtml(href)}" style="color:#5aaa69;">${escapeHtml(href)}</a></p>`;
}

function textBlock(lines) {
  return lines.filter(Boolean).join('\n\n');
}

export function createMailer({ smtpUrl, from, publicAppUrl }) {
  const transport = smtpUrl ? nodemailer.createTransport(smtpUrl) : nodemailer.createTransport({ jsonTransport: true });
  const send = ({ to, subject, preview, text, htmlBody, title = subject }) => transport.sendMail({
    from,
    to,
    subject,
    text,
    html: wrapHtml({ title, preview, bodyHtml: htmlBody, publicAppUrl })
  });

  return Object.freeze({
    verify: () => smtpUrl ? transport.verify() : Promise.resolve(true),

    async sendParentVerification({ parent, token }) {
      const link = `${publicAppUrl}/parent/verify?parent=${encodeURIComponent(parent.id)}&token=${encodeURIComponent(token)}`;
      const name = parent.displayName || 'there';
      return send({
        to: parent.email,
        subject: 'Confirm your Undercurrent parent account',
        preview: 'One click verifies your email and opens your family control center.',
        title: 'Verify your email',
        text: textBlock([
          `Hi ${name},`,
          'Thanks for joining this Undercurrent closed demo. Confirm your email to open your family control center.',
          `Verify your account: ${link}`,
          'This link expires in 24 hours.',
          'If you did not create this account, you can ignore this email.'
        ]),
        htmlBody: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>
          <p style="margin:0 0 14px;">Thanks for joining this Undercurrent closed demo. Confirm your email to open your family control center—where you manage child profiles, approved devices, and gentle learning updates.</p>
          ${buttonHtml('Verify my email', link)}
          <p style="margin:0;font-size:14px;color:#587068;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`
      });
    },

    async sendGuardianInvitation({ email, token, role }) {
      const link = `${publicAppUrl}/parent/signup?invite=${encodeURIComponent(token)}`;
      const roleLabel = role === 'owner' ? 'household owner' : 'guardian';
      return send({
        to: email,
        subject: 'You are invited to an Undercurrent family demo',
        preview: `Create your ${roleLabel} account for this closed Undercurrent demo.`,
        title: 'You are invited',
        text: textBlock([
          `You have been invited as a ${roleLabel} to a closed Undercurrent demo household.`,
          'Undercurrent is a quiet learning companion where a child teaches Pip, and parents receive warm conversation starters—not report-card scores.',
          `Create your account: ${link}`,
          'This invitation expires in 7 days.',
          'This demo is not a public child service and does not provide verified parental consent.'
        ]),
        htmlBody: `
          <p style="margin:0 0 14px;">You have been invited as a <strong>${escapeHtml(roleLabel)}</strong> to a closed Undercurrent demo household.</p>
          <p style="margin:0 0 14px;">Undercurrent is a quiet learning companion where a child teaches Pip. Parents receive warm conversation starters—not grades, rankings, or report cards.</p>
          ${buttonHtml('Create my account', link)}
          <p style="margin:0;font-size:14px;color:#587068;">This invitation expires in 7 days and can be used once.</p>`
      });
    },

    async sendPasswordReset({ parent, token }) {
      const link = `${publicAppUrl}/parent/reset-password?token=${encodeURIComponent(token)}`;
      const name = parent.displayName || 'there';
      return send({
        to: parent.email,
        subject: 'Reset your Undercurrent password',
        preview: 'Use this secure link within 30 minutes to choose a new password.',
        title: 'Reset your password',
        text: textBlock([
          `Hi ${name},`,
          'We received a request to reset your Undercurrent password.',
          `Choose a new password: ${link}`,
          'This link expires in 30 minutes and can be used only once.',
          'If you did not request a reset, you can ignore this email. Your current password will stay the same.'
        ]),
        htmlBody: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>
          <p style="margin:0 0 14px;">We received a request to reset your Undercurrent password. Choose a new one below to keep your family control center protected.</p>
          ${buttonHtml('Choose a new password', link)}
          <p style="margin:0;font-size:14px;color:#587068;">This link expires in 30 minutes and can be used only once. If you did not request a reset, ignore this email—your current password will stay the same.</p>`
      });
    },

    async sendStudentInvitation({ student, destinationEmail, token }) {
      const link = `${publicAppUrl}/student/invite/${encodeURIComponent(token)}`;
      const studentName = student.name || 'your child';
      return send({
        to: destinationEmail,
        subject: `Open ${studentName}'s Undercurrent trail on this device`,
        preview: `A one-time approved-device link for ${studentName}. Expires in 24 hours.`,
        title: `Ready for ${studentName}`,
        text: textBlock([
          `Open this parent-authorized invitation on the device ${studentName} will use with Pip.`,
          `Device invitation: ${link}`,
          'After opening the link, they will choose a PIN for this device only.',
          'This link expires in 24 hours and can be used once.',
          'Only open it on a device you trust for this child.'
        ]),
        htmlBody: `
          <p style="margin:0 0 14px;">Open this parent-authorized invitation on the device <strong>${escapeHtml(studentName)}</strong> will use with Pip.</p>
          <p style="margin:0 0 14px;">After the link opens, they choose a short PIN for this device only. Their learning trail stays separate from the parent control center.</p>
          ${buttonHtml(`Open ${studentName}'s trail`, link)}
          <p style="margin:0;font-size:14px;color:#587068;">This link expires in 24 hours and can be used once. Only open it on a device you trust for this child.</p>`
      });
    },

    async sendSafetyAlert({ parent, student, category }) {
      const studentName = student.name || 'your child';
      const categoryLabel = String(category || 'needs_attention').replaceAll('_', ' ');
      return send({
        to: parent.email,
        subject: `Please check in with ${studentName} — Undercurrent safety notice`,
        preview: `A safety check was triggered for ${studentName}. A calm in-person check-in is the next step.`,
        title: 'A safety check needs you',
        text: textBlock([
          `Hi ${parent.displayName || 'there'},`,
          `A safety check was triggered during ${studentName}'s Undercurrent moment.`,
          `Category: ${categoryLabel}`,
          'Please check in with them in person now. Stay calm, listen first, and follow your family\'s usual support plan.',
          `Open your family control center: ${publicAppUrl}`,
          'Undercurrent does not replace trusted adults, emergency services, or professional support.'
        ]),
        htmlBody: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(parent.displayName || 'there')},</p>
          <p style="margin:0 0 14px;">A safety check was triggered during <strong>${escapeHtml(studentName)}</strong>'s Undercurrent moment. Please check in with them in person now.</p>
          <p style="margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#fff2c6;border:1px solid #e6c84a;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
          <p style="margin:0 0 14px;">Stay calm, listen first, and follow your family's usual support plan. Undercurrent does not replace trusted adults, emergency services, or professional support.</p>
          ${buttonHtml('Open family control center', publicAppUrl)}`
      });
    }
  });
}
