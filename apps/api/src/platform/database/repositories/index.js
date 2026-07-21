import { createIdentityRepository } from './identityRepository.js';
import { createLearningRepository } from './learningRepository.js';
import { createParentDashboardRepository } from './parentDashboardRepository.js';
import { createSessionsRepository } from './sessionsRepository.js';
import { createStudentsRepository } from './studentsRepository.js';
import { createSafetyRepository } from './safetyRepository.js';
import { createStudentAccessRepository } from './studentAccessRepository.js';
import { createParentExperienceRepository } from './parentExperienceRepository.js';
import { createPrivacyRepository } from './privacyRepository.js';

export function createRepositories(db) {
  const identity = createIdentityRepository(db);
  const students = createStudentsRepository(db);
  const sessions = createSessionsRepository(db);
  const learning = createLearningRepository(db);
  const dashboard = createParentDashboardRepository(db, { learningRepository: learning });
  const safety = createSafetyRepository(db);
  const access = createStudentAccessRepository(db);
  const parentExperience = createParentExperienceRepository(db);
  const privacy = createPrivacyRepository(db);
  return Object.freeze({
    createParentSession: identity.createParentSession,
    createSessionForParent: identity.createSessionForParent,
    deleteParentSession: identity.deleteParentSession,
    revokeParentSession: identity.revokeParentSession,
    revokeAllParentSessions: identity.revokeAllParentSessions,
    listParentSessions: identity.listParentSessions,
    touchParentSession: identity.touchParentSession,
    findParentSession: identity.findParentSession,
    findParentByEmail: identity.findParentByEmail,
    findParentByHousehold: identity.findParentByHousehold,
    createAccount: identity.createAccount,
    findUsableInvitation: identity.findUsableInvitation,
    createAccountFromInvitation: identity.createAccountFromInvitation,
    createParentInvitation: identity.createParentInvitation,
    listParentInvitations: identity.listParentInvitations,
    acceptTerms: identity.acceptTerms,
    hasActiveTerms: identity.hasActiveTerms,
    revokeTerms: identity.revokeTerms,
    verifyEmail: identity.verifyEmail,
    setVerificationToken: identity.setVerificationToken,
    setPasswordResetToken: identity.setPasswordResetToken,
    resetPassword: identity.resetPassword,
    listStudents: students.listStudents,
    createStudent: students.createStudent,
    canAccessStudent: students.findAccessibleStudent,
    createSession: sessions.createSession,
    getSession: sessions.getSession,
    endSession: sessions.endSession,
    listCompletedSessions: sessions.listCompletedSessions,
    listParentConversations: sessions.listParentConversations,
    updateSessionProgress: sessions.updateProgress,
    addSessionTurn: sessions.addTurn,
    getTurnRequest: sessions.getTurnRequest,
    createTurnRequest: sessions.createTurnRequest,
    countHouseholdTurnRequests: sessions.countHouseholdTurnRequests,
    completeTurnRequest: sessions.completeTurnRequest,
    removeTurnRequest: sessions.removeTurnRequest,
    listSessionTurns: sessions.listTurns,
    getRitualSettings: sessions.getRitualSettings,
    saveRitualSettings: sessions.saveRitualSettings,
    createRecap: sessions.createRecap,
    listRecaps: sessions.listRecaps,
    createMorningRipple: sessions.createMorningRipple,
    listMorningRipples: sessions.listMorningRipples,
    upsertTopic: learning.upsertTopic,
    addScore: learning.addScore,
    addWin: learning.addWin,
    listScoresForTopic: learning.listScoresForTopic,
    listTopics: learning.listTopics,
    createSafetyEvent: safety.createSafetyEvent,
    listSafetyEvents: safety.listSafetyEvents,
    acknowledgeSafetyEvent: safety.acknowledgeSafetyEvent,
    getDashboard: dashboard.getDashboard,
    listParentRituals: dashboard.listParentRituals,
    listHouseholdDashboardSummaries: dashboard.listHouseholdSummaries
    ,getHouseholdPreferences: parentExperience.getHouseholdPreferences
    ,saveHouseholdPreferences: parentExperience.saveHouseholdPreferences
    ,getChildPreferences: parentExperience.getChildPreferences
    ,saveChildPreferences: parentExperience.saveChildPreferences
    ,recordProductAnalyticsEvent: parentExperience.recordProductAnalyticsEvent
    ,createAdvisorTurn: parentExperience.createAdvisorTurn
    ,listAdvisorTurns: parentExperience.listAdvisorTurns
    ,clearAdvisorTurns: parentExperience.clearAdvisorTurns
    ,getAdvisorRequest: parentExperience.getAdvisorRequest
    ,createAdvisorRequest: parentExperience.createAdvisorRequest
    ,completeAdvisorRequest: parentExperience.completeAdvisorRequest
    ,removeAdvisorRequest: parentExperience.removeAdvisorRequest
    ,countAdvisorTurns: parentExperience.countAdvisorTurns
    ,createStudentInvitation: access.createInvitation
    ,findStudentInvitation: access.findInvitation
    ,consumeStudentInvitation: access.consumeInvitation
    ,listStudentInvitations: access.listInvitations
    ,createStudentDevice: access.createDevice
    ,getStudentDevices: access.getDevicesByTokens
    ,listStudentDevices: access.listDevices
    ,revokeStudentDevice: access.revokeDevice
    ,revokeAllStudentDevices: access.revokeAllDevices
    ,updateStudentDeviceAccess: access.updateDeviceAccess
    ,setStudentPin: access.setPin
    ,createStudentUnlockSession: access.createUnlockSession
    ,getStudentUnlockSessions: access.getUnlockSessions
    ,revokeStudentUnlockSessionsForStudent: access.revokeUnlockSessionsForStudent
    ,revokeStudentUnlockSessionsForDevice: access.revokeUnlockSessionsForDevice
    ,addAccessAudit: access.addAudit
    ,listAccessAudit: access.listAudit
    ,withdrawStudent: privacy.withdrawStudent
    ,exportStudent: privacy.exportStudent
    ,deleteStudent: privacy.deleteStudent
    ,purgeDueStudents: privacy.purgeDueStudents
  });
}
