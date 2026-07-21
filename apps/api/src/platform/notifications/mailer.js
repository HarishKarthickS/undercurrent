import nodemailer from 'nodemailer';

export function createMailer({ smtpUrl, from, publicAppUrl }) {
  const transport = smtpUrl ? nodemailer.createTransport(smtpUrl) : nodemailer.createTransport({ jsonTransport: true });
  return Object.freeze({
    verify: () => smtpUrl ? transport.verify() : Promise.resolve(true),
    async sendParentVerification({ parent, token }) {
      const link = `${publicAppUrl}/parent/verify?parent=${encodeURIComponent(parent.id)}&token=${encodeURIComponent(token)}`;
      return transport.sendMail({ from, to: parent.email, subject: 'Verify your Undercurrent parent account', text: `Verify your parent account: ${link}\n\nThis link expires in 24 hours.` });
    },
    async sendGuardianInvitation({ email, token, role }) {
      const link = `${publicAppUrl}/parent/signup?invite=${encodeURIComponent(token)}`;
      return transport.sendMail({ from, to: email, subject: 'You are invited to an Undercurrent closed demo household', text: `You have been invited as a ${role} to a closed Undercurrent demo. Create your account here: ${link}\n\nThis invitation expires in 7 days. This demo is not a public child service and does not provide verified parental consent.` });
    },
    async sendPasswordReset({ parent, token }) {
      const link = `${publicAppUrl}/parent/reset-password?token=${encodeURIComponent(token)}`;
      return transport.sendMail({ from, to: parent.email, subject: 'Reset your Undercurrent password', text: `Reset your password: ${link}\n\nThis link expires in 30 minutes.` });
    },
    async sendStudentInvitation({ student, destinationEmail, token }) {
      const link = `${publicAppUrl}/student/invite/${encodeURIComponent(token)}`;
      return transport.sendMail({ from, to: destinationEmail, subject: `${student.name}'s Undercurrent device invitation`, text: `Open this parent-authorized device invitation for ${student.name}: ${link}\n\nThis link expires in 24 hours and can be used once.` });
    },
    async sendSafetyAlert({ parent, student, category }) {
      return transport.sendMail({ from, to: parent.email, subject: 'Undercurrent safety check needs your attention', text: `A safety check was triggered for ${student.name}. Please check in with them now. Category: ${category}. ${publicAppUrl}` });
    }
  });
}
