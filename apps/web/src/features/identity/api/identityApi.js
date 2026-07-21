import { apiUrl, requestJson } from '#web/shared/api/index.js';

export const signUpParent = ({ displayName, email, password, invitationToken }) => requestJson(apiUrl('/auth/signup'), { method: 'POST', body: JSON.stringify({ displayName, email, password, invitationToken }) });
export const loginParent = ({ email, password }) => requestJson(apiUrl('/auth/login'), { method: 'POST', body: JSON.stringify({ email, password }) });
export const verifyParentEmail = ({ parentId, token }) => requestJson(apiUrl('/auth/verify-email'), { method: 'POST', body: JSON.stringify({ parentId, token }) });
export const resendParentVerification = ({ email }) => requestJson(apiUrl('/auth/verification/resend'), { method: 'POST', body: JSON.stringify({ email }) });
export const requestPasswordReset = ({ email }) => requestJson(apiUrl('/auth/password-reset/request'), { method: 'POST', body: JSON.stringify({ email }) });
export const completePasswordReset = ({ token, password }) => requestJson(apiUrl('/auth/password-reset/complete'), { method: 'POST', body: JSON.stringify({ token, password }) });
export const getParentSession = () => requestJson(apiUrl('/auth/session'));
export const logoutParent = () => requestJson(apiUrl('/auth/logout'), { method: 'POST' });
export const acceptDemoTerms = () => requestJson(apiUrl('/auth/terms'), { method: 'POST', body: JSON.stringify({ accepted: true }) });
