import { apiUrl, requestJson } from '#web/shared/api/index.js';

export const consumeStudentInvitation = (token, deviceLabel) => requestJson(apiUrl('/student/invitations/consume'), { method: 'POST', body: JSON.stringify({ token, deviceLabel }) });
export const listLocalStudentProfiles = () => requestJson(apiUrl('/student/device/profiles'));
export const setStudentPin = (studentId, pin) => requestJson(apiUrl('/student/device/pin'), { method: 'POST', body: JSON.stringify({ studentId, pin }) });
export const unlockStudent = (studentId, pin) => requestJson(apiUrl('/student/device/unlock'), { method: 'POST', body: JSON.stringify({ studentId, pin }) });
export const inviteStudentDevice = (payload) => requestJson(apiUrl('/parent/student-access/invitations'), { method: 'POST', body: JSON.stringify(payload) });
export const getStudentAccess = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/access`));
export const resetStudentPin = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/pin/reset`), { method: 'POST' });
export const revokeStudentDevice = (studentId, deviceId) => requestJson(apiUrl(`/parent/students/${studentId}/devices/${deviceId}`), { method: 'DELETE' });
export const revokeAllStudentDevices = (studentId) => requestJson(apiUrl(`/parent/students/${studentId}/devices/revoke-all`), { method: 'POST' });
