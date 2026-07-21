import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { loadConfig } from '#api/config/env.js';
import { createDatabaseClient } from '#api/platform/database/client.js';
import { createEncryptionService } from '#api/platform/security/encryption.js';
import {
  accessAuditEvents,
  consentRecords,
  householdPreferences,
  householdTermsAcceptances,
  households,
  morningRippleEntries,
  parentAccounts,
  parentAdvisorRequests,
  parentAdvisorTurns,
  parentChildPreferences,
  parentInvitations,
  parentSessions,
  scores,
  safetyEvents,
  sessionRecaps,
  sessions,
  sessionTurns,
  studentDeviceSessions,
  studentInvitations,
  studentRitualSettings,
  studentUnlockSessions,
  students,
  topics,
  turnRequests,
  wins
} from '#api/platform/database/schema/index.js';

const DEMO_PARENT = Object.freeze({
  id: '00000000-0000-4000-8000-00000000d002',
  householdId: '00000000-0000-4000-8000-00000000d001',
  email: process.env.PARENT_TEST_EMAIL?.trim() || 'hkarthick439@gmail.com',
  password: process.env.PARENT_TEST_PASSWORD || 'UndercurrentDemo!2026',
  displayName: 'Demo Parent'
});
const DEMO_PIN = '2468';
const studentIds = Object.freeze({ ari: '00000000-0000-4000-8000-00000000d101', bryn: '00000000-0000-4000-8000-00000000d102', cora: '00000000-0000-4000-8000-00000000d103' });
const sessionIds = Object.freeze({ ariMorning: '00000000-0000-4000-8000-00000000d201', ariMoon: '00000000-0000-4000-8000-00000000d202', ariPlants: '00000000-0000-4000-8000-00000000d203', brynMorning: '00000000-0000-4000-8000-00000000d204', brynMagnets: '00000000-0000-4000-8000-00000000d205', brynLive: '00000000-0000-4000-8000-00000000d206', coraMorning: '00000000-0000-4000-8000-00000000d207', coraRainbow: '00000000-0000-4000-8000-00000000d208' });
const topicIds = Object.freeze({ ariMoon: '00000000-0000-4000-8000-00000000d301', ariPlants: '00000000-0000-4000-8000-00000000d302', brynMagnets: '00000000-0000-4000-8000-00000000d303', brynMaps: '00000000-0000-4000-8000-00000000d304', coraRainbow: '00000000-0000-4000-8000-00000000d305', coraSeeds: '00000000-0000-4000-8000-00000000d306' });
const dashboardLayout = ['next', 'progress', 'conversation', 'digest', 'topics', 'effort'];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const addMinutes = (value, minutes) => new Date(value.getTime() + minutes * 60_000);

export const demoAccess = Object.freeze({ parentEmail: DEMO_PARENT.email, parentPassword: DEMO_PARENT.password, studentPin: DEMO_PIN });

function at(daysAgo, hour, minute = 0) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  value.setDate(value.getDate() - daysAgo);
  return value;
}

function inviteToken(name) {
  return `demo-${name.toLowerCase()}-${randomBytes(24).toString('base64url')}`;
}

async function clearDemoFamily(db) {
  const ids = Object.values(studentIds); const sessionKeys = Object.values(sessionIds); const topicKeys = Object.values(topicIds);
  await db.delete(parentAdvisorRequests).where(eq(parentAdvisorRequests.parentId, DEMO_PARENT.id));
  await db.delete(parentAdvisorTurns).where(eq(parentAdvisorTurns.parentId, DEMO_PARENT.id));
  await db.delete(sessionTurns).where(inArray(sessionTurns.sessionId, sessionKeys));
  await db.delete(turnRequests).where(inArray(turnRequests.sessionId, sessionKeys));
  await db.delete(sessionRecaps).where(inArray(sessionRecaps.sessionId, sessionKeys));
  await db.delete(morningRippleEntries).where(inArray(morningRippleEntries.sessionId, sessionKeys));
  await db.delete(scores).where(inArray(scores.topicId, topicKeys));
  await db.delete(wins).where(inArray(wins.studentId, ids));
  await db.delete(safetyEvents).where(inArray(safetyEvents.studentId, ids));
  await db.delete(sessions).where(inArray(sessions.id, sessionKeys));
  await db.delete(topics).where(inArray(topics.id, topicKeys));
  await db.delete(studentUnlockSessions).where(inArray(studentUnlockSessions.studentId, ids));
  await db.delete(studentDeviceSessions).where(inArray(studentDeviceSessions.studentId, ids));
  await db.delete(studentInvitations).where(inArray(studentInvitations.studentId, ids));
  await db.delete(accessAuditEvents).where(eq(accessAuditEvents.householdId, DEMO_PARENT.householdId));
  await db.delete(parentChildPreferences).where(eq(parentChildPreferences.parentId, DEMO_PARENT.id));
  await db.delete(studentRitualSettings).where(inArray(studentRitualSettings.studentId, ids));
  await db.delete(consentRecords).where(inArray(consentRecords.studentId, ids));
  await db.delete(students).where(inArray(students.id, ids));
  await db.delete(householdPreferences).where(eq(householdPreferences.householdId, DEMO_PARENT.householdId));
  await db.delete(householdTermsAcceptances).where(eq(householdTermsAcceptances.parentId, DEMO_PARENT.id));
  await db.delete(parentSessions).where(eq(parentSessions.parentId, DEMO_PARENT.id));
  await db.delete(parentInvitations).where(eq(parentInvitations.householdId, DEMO_PARENT.householdId));
  await db.delete(parentAccounts).where(eq(parentAccounts.id, DEMO_PARENT.id));
  await db.delete(households).where(eq(households.id, DEMO_PARENT.householdId));
}

function encryptedTurns(encryption, sessionId, startedAt, turns) {
  return turns.map(({ role, text }, index) => ({ sessionId, role, ...encryption.encrypt(text), createdAt: addMinutes(startedAt, index + 1) }));
}

function eveningRecap(sessionId, studentId, title, summary, discovery, createdAt) {
  return { sessionId, studentId, title, summary, discovery, createdAt };
}

export async function seedDemo(db, { encryption, publicAppUrl = 'http://localhost:5173', now = new Date() } = {}) {
  if (!encryption) throw new Error('Demo seeding requires ENCRYPTION_KEY so ordinary Pip conversations can be safely encrypted.');
  const passwordHash = await argon2.hash(DEMO_PARENT.password, { type: argon2.argon2id });
  const pinHash = await argon2.hash(DEMO_PIN, { type: argon2.argon2id });
  const invitations = Object.entries(studentIds).map(([name, studentId]) => ({ name, studentId, token: inviteToken(name) }));
  const dates = {
    ariMorning: at(0, 7, 30), ariMoon: at(1, 18, 10), ariPlants: at(4, 18, 5), brynMorning: at(1, 7, 45), brynMagnets: at(3, 18, 15), brynLive: addMinutes(now, -2), coraMorning: at(2, 7, 35), coraRainbow: at(5, 18, 20)
  };

  await db.transaction(async (tx) => {
    await clearDemoFamily(tx);
    await tx.insert(households).values({ id: DEMO_PARENT.householdId, name: 'Undercurrent Demo Family', timeZone: 'UTC' });
    await tx.insert(parentAccounts).values({ id: DEMO_PARENT.id, householdId: DEMO_PARENT.householdId, displayName: DEMO_PARENT.displayName, email: DEMO_PARENT.email, passwordHash, emailVerifiedAt: now });
    await tx.insert(householdTermsAcceptances).values({ householdId: DEMO_PARENT.householdId, parentId: DEMO_PARENT.id, termsVersion: 'closed-demo-v1', termsSha256: 'demo-fixture-terms', acceptedAt: now });
    await tx.insert(householdPreferences).values({ householdId: DEMO_PARENT.householdId, locale: 'en', dailyDigestEnabled: true, weeklyDigestEnabled: true, productAnalyticsConsent: true, updatedAt: now });
    await tx.insert(students).values([
      { id: studentIds.ari, householdId: DEMO_PARENT.householdId, name: 'Ari', grade: '4', routineMorning: 'after breakfast', routineEvening: 'after dinner', pinHash, pinUpdatedAt: now },
      { id: studentIds.bryn, householdId: DEMO_PARENT.householdId, name: 'Bryn', grade: '2', routineMorning: 'before school', routineEvening: 'after dinner', pinHash, pinUpdatedAt: now },
      { id: studentIds.cora, householdId: DEMO_PARENT.householdId, name: 'Cora', grade: '5', routineMorning: 'when ready', routineEvening: 'before bedtime', pinHash, pinUpdatedAt: now }
    ]);
    await tx.insert(consentRecords).values(Object.values(studentIds).map((studentId) => ({ householdId: DEMO_PARENT.householdId, studentId, purpose: 'learning_companion', noticeVersion: 'closed-demo-v1', status: 'granted', verificationReference: 'demo-seed', grantedAt: now, collectionBasis: 'demo_terms_acknowledgement', termsVersion: 'closed-demo-v1', termsSha256: 'demo-fixture-terms', acceptedByParentId: DEMO_PARENT.id, updatedAt: now })));
    await tx.insert(studentRitualSettings).values([
      { studentId: studentIds.ari, morningStartHour: 5, eveningStartHour: 16, dailySessionLimit: 2, voiceEnabled: true, activityEnabled: true, preferredStyle: 'adaptive', morningPaths: 'energy,ready,calm,curiosity,reflect', morningSensitivity: 'standard' },
      { studentId: studentIds.bryn, morningStartHour: 5, eveningStartHour: 16, dailySessionLimit: 2, voiceEnabled: true, activityEnabled: true, preferredStyle: 'chat', morningPaths: 'energy,ready,calm,curiosity,reflect', morningSensitivity: 'gentle', experienceBandOverride: 'early' },
      { studentId: studentIds.cora, morningStartHour: 6, eveningStartHour: 17, dailySessionLimit: 3, voiceEnabled: false, activityEnabled: true, preferredStyle: 'quest', morningPaths: 'energy,ready,calm,curiosity,reflect', morningSensitivity: 'standard' }
    ]);
    await tx.insert(parentChildPreferences).values(Object.values(studentIds).map((studentId) => ({ parentId: DEMO_PARENT.id, studentId, dashboardLayout, guidanceMode: 'gentle', goalType: 'sessions', goalTarget: 3, transcriptConsent: true, advisorConsent: true, updatedAt: now })));
    await tx.insert(studentDeviceSessions).values(Object.entries(studentIds).map(([name, studentId]) => ({ householdId: DEMO_PARENT.householdId, studentId, tokenHash: hash(`demo-device-${name}`), deviceLabel: `${name[0].toUpperCase()}${name.slice(1)}'s family tablet`, lastAccessAt: now, expiresAt: addMinutes(now, 525_600) })));
    await tx.insert(accessAuditEvents).values(Object.values(studentIds).map((studentId) => ({ householdId: DEMO_PARENT.householdId, studentId, actorType: 'student_device', eventType: 'student_device_authorized', metadata: 'demo_fixture', createdAt: now })));
    await tx.insert(studentInvitations).values(invitations.map(({ studentId, token }) => ({ householdId: DEMO_PARENT.householdId, studentId, destinationEmail: DEMO_PARENT.email, destinationType: 'parent', parentConfirmedStudentEmail: false, tokenHash: hash(token), expiresAt: addMinutes(now, 1_440), createdAt: now })));
    await tx.insert(sessions).values([
      { id: sessionIds.ariMorning, studentId: studentIds.ari, type: 'morning', startedAt: dates.ariMorning, endedAt: addMinutes(dates.ariMorning, 4), endReason: 'completed', turnCount: 0, scaffoldStage: 'ask' },
      { id: sessionIds.ariMoon, studentId: studentIds.ari, type: 'evening', questId: 'moon-mystery', questStep: 'finish', startedAt: dates.ariMoon, endedAt: addMinutes(dates.ariMoon, 7), endReason: 'completed', turnCount: 2, scaffoldStage: 'explain' },
      { id: sessionIds.ariPlants, studentId: studentIds.ari, type: 'evening', questId: 'plant-helpers', questStep: 'finish', startedAt: dates.ariPlants, endedAt: addMinutes(dates.ariPlants, 6), endReason: 'child_exit', turnCount: 2, scaffoldStage: 'connect' },
      { id: sessionIds.brynMorning, studentId: studentIds.bryn, type: 'morning', startedAt: dates.brynMorning, endedAt: addMinutes(dates.brynMorning, 3), endReason: 'completed', turnCount: 0, scaffoldStage: 'ask' },
      { id: sessionIds.brynMagnets, studentId: studentIds.bryn, type: 'evening', questId: 'magnet-lab', questStep: 'finish', startedAt: dates.brynMagnets, endedAt: addMinutes(dates.brynMagnets, 7), endReason: 'completed', turnCount: 2, scaffoldStage: 'explain' },
      { id: sessionIds.brynLive, studentId: studentIds.bryn, type: 'evening', questId: 'talk-to-pip', questStep: 'try', startedAt: dates.brynLive, turnCount: 2, scaffoldStage: 'explain' },
      { id: sessionIds.coraMorning, studentId: studentIds.cora, type: 'morning', startedAt: dates.coraMorning, endedAt: addMinutes(dates.coraMorning, 4), endReason: 'completed', turnCount: 0, scaffoldStage: 'ask' },
      { id: sessionIds.coraRainbow, studentId: studentIds.cora, type: 'evening', questId: 'rainbow-lab', questStep: 'finish', startedAt: dates.coraRainbow, endedAt: addMinutes(dates.coraRainbow, 7), endReason: 'completed', turnCount: 2, scaffoldStage: 'connect' }
    ]);
    await tx.insert(morningRippleEntries).values([
      { studentId: studentIds.ari, sessionId: sessionIds.ariMorning, mood: 'bright', energy: 'high', path: 'curiosity', activityId: 'wonder-spark', activityResult: 'I want to notice moon shapes tonight.', intention: 'Look for one moon shape later.', theme: 'citrus', collectible: 'spark', contentSource: 'curated', prompt: 'Choose something you would love to notice or ask about today.', createdAt: addMinutes(dates.ariMorning, 3) },
      { studentId: studentIds.bryn, sessionId: sessionIds.brynMorning, mood: 'sleepy', energy: 'low', path: 'calm', activityId: 'cloud-breath', activityResult: 'I took one slow breath before school.', intention: 'Start with one small step.', theme: 'mist', collectible: 'cloud', contentSource: 'curated', prompt: 'Trace a slow cloud in the air and choose what would help you feel steady.', createdAt: addMinutes(dates.brynMorning, 2) },
      { studentId: studentIds.cora, sessionId: sessionIds.coraMorning, mood: 'curious', energy: 'medium', path: 'ready', activityId: 'backpack-plan', activityResult: 'I packed my notebook first.', intention: 'Keep one question ready.', theme: 'sky', collectible: 'compass', contentSource: 'curated', prompt: 'Pick the first small thing that will help your day feel ready.', createdAt: addMinutes(dates.coraMorning, 3) }
    ]);
    await tx.insert(sessionRecaps).values([
      eveningRecap(sessionIds.ariMoon, studentIds.ari, 'Moonlight shapes', 'Ari helped Pip notice why the moon can look different on different nights.', 'moon', addMinutes(dates.ariMoon, 7)),
      eveningRecap(sessionIds.ariPlants, studentIds.ari, 'Plant helpers', 'Ari showed Pip how sunlight and water help a plant grow.', 'leaf', addMinutes(dates.ariPlants, 6)),
      eveningRecap(sessionIds.brynMagnets, studentIds.bryn, 'Magnet pull', 'Bryn tested which small things a magnet could pull close.', 'spark', addMinutes(dates.brynMagnets, 7)),
      eveningRecap(sessionIds.coraRainbow, studentIds.cora, 'Rainbow light', 'Cora explained how light and water can make a rainbow appear.', 'sunbeam', addMinutes(dates.coraRainbow, 7))
    ]);
    await tx.insert(sessionTurns).values([
      ...encryptedTurns(encryption, sessionIds.ariMoon, dates.ariMoon, [{ role: 'child', text: 'The moon looks different because we can see different bright parts.' }, { role: 'companion', text: 'Oh! Which bright part do you think we might spot next?' }]),
      ...encryptedTurns(encryption, sessionIds.ariPlants, dates.ariPlants, [{ role: 'child', text: 'Plants use sunlight and water to grow their leaves.' }, { role: 'companion', text: 'That makes sense. What tiny plant clue could Pip look for?' }]),
      ...encryptedTurns(encryption, sessionIds.brynMagnets, dates.brynMagnets, [{ role: 'child', text: 'My magnet pulled a paper clip but not a wooden block.' }, { role: 'companion', text: 'Ooh, what do you notice about the things it can pull?' }]),
      ...encryptedTurns(encryption, sessionIds.brynLive, dates.brynLive, [{ role: 'child', text: 'I am thinking about how maps help people find places.' }, { role: 'companion', text: 'Maps are tiny picture guides! What symbol would you teach Pip first?' }]),
      ...encryptedTurns(encryption, sessionIds.coraRainbow, dates.coraRainbow, [{ role: 'child', text: 'Rainbows happen when light goes through tiny water drops.' }, { role: 'companion', text: 'What colors do you think Pip should look for first?' }])
    ]);
    await tx.insert(topics).values([
      { id: topicIds.ariMoon, studentId: studentIds.ari, label: 'Moon phases', firstSeenAt: dates.ariMoon, nextReviewAt: at(1, 12), ease: 2.3, intervalDays: 1 },
      { id: topicIds.ariPlants, studentId: studentIds.ari, label: 'Plant growth', firstSeenAt: dates.ariPlants, nextReviewAt: at(-3, 12), ease: 2.8, intervalDays: 7 },
      { id: topicIds.brynMagnets, studentId: studentIds.bryn, label: 'Magnets', firstSeenAt: dates.brynMagnets, nextReviewAt: at(2, 12), ease: 2.6, intervalDays: 5 },
      { id: topicIds.brynMaps, studentId: studentIds.bryn, label: 'Maps and symbols', firstSeenAt: dates.brynLive, nextReviewAt: at(-4, 12), ease: 2.5, intervalDays: 7 },
      { id: topicIds.coraRainbow, studentId: studentIds.cora, label: 'Rainbows', firstSeenAt: dates.coraRainbow, nextReviewAt: at(1, 12), ease: 2.4, intervalDays: 3 },
      { id: topicIds.coraSeeds, studentId: studentIds.cora, label: 'Seed travel', firstSeenAt: at(6, 18), nextReviewAt: at(-2, 12), ease: 2.9, intervalDays: 8 }
    ]);
    await tx.insert(scores).values([
      { sessionId: sessionIds.ariMoon, topicId: topicIds.ariMoon, understanding: 2, confidence: 2, gapLabel: 'new_example', assessedAt: addMinutes(dates.ariMoon, 3), assessorAgreement: 1 },
      { sessionId: sessionIds.ariMoon, topicId: topicIds.ariMoon, understanding: 3, confidence: 3, gapLabel: 'still_gathering_signal', assessedAt: addMinutes(dates.ariMoon, 5), assessorAgreement: 1 },
      { sessionId: sessionIds.ariPlants, topicId: topicIds.ariPlants, understanding: 3, confidence: 3, gapLabel: 'still_gathering_signal', assessedAt: addMinutes(dates.ariPlants, 4), assessorAgreement: 1 },
      { sessionId: sessionIds.brynMagnets, topicId: topicIds.brynMagnets, understanding: 2, confidence: 3, gapLabel: 'new_example', assessedAt: addMinutes(dates.brynMagnets, 3), assessorAgreement: 1 },
      { sessionId: sessionIds.brynLive, topicId: topicIds.brynMaps, understanding: 2, confidence: 2, gapLabel: 'still_gathering_signal', assessedAt: addMinutes(dates.brynLive, 1), assessorAgreement: 1 },
      { sessionId: sessionIds.coraRainbow, topicId: topicIds.coraRainbow, understanding: 3, confidence: 3, gapLabel: 'still_gathering_signal', assessedAt: addMinutes(dates.coraRainbow, 4), assessorAgreement: 1 },
      { sessionId: sessionIds.coraRainbow, topicId: topicIds.coraSeeds, understanding: 3, confidence: 3, gapLabel: 'new_example', assessedAt: addMinutes(dates.coraRainbow, 5), assessorAgreement: 1 }
    ]);
    await tx.insert(wins).values([
      { studentId: studentIds.ari, sessionId: sessionIds.ariMoon, type: 'explain', message: 'Ari kept trying a new example for Pip.', createdAt: addMinutes(dates.ariMoon, 6) },
      { studentId: studentIds.bryn, sessionId: sessionIds.brynMagnets, type: 'notice', message: 'Bryn noticed a careful difference between two objects.', createdAt: addMinutes(dates.brynMagnets, 6) },
      { studentId: studentIds.cora, sessionId: sessionIds.coraRainbow, type: 'connect', message: 'Cora connected an observation to a bigger idea.', createdAt: addMinutes(dates.coraRainbow, 6) }
    ]);
    await tx.insert(safetyEvents).values({ studentId: studentIds.cora, sessionId: null, category: 'demo_check_in', createdAt: addMinutes(now, -90), emailStatus: 'not_sent' });
    await tx.insert(parentAdvisorTurns).values([
      { parentId: DEMO_PARENT.id, studentId: studentIds.ari, role: 'parent', ...encryption.encrypt('How can I talk about moon phases tonight?'), createdAt: addMinutes(now, -45) },
      { parentId: DEMO_PARENT.id, studentId: studentIds.ari, role: 'advisor', ...encryption.encrypt('One optional idea: ask Ari what moon shape they would like to look for, then let their observation lead the conversation.'), createdAt: addMinutes(now, -44) }
    ]);
  });
  return { parent: { email: DEMO_PARENT.email, password: DEMO_PARENT.password }, pin: DEMO_PIN, students: invitations.map(({ name, studentId, token }) => ({ name: `${name[0].toUpperCase()}${name.slice(1)}`, studentId, invitationUrl: `${publicAppUrl.replace(/\/$/, '')}/student/invite/${token}` })) };
}

if (process.argv[1]?.endsWith('seed-demo.js')) {
  const config = loadConfig();
  if (config.nodeEnv === 'production' || !config.enableDevFixtures) throw new Error('Demo seeding requires a non-production environment with ENABLE_DEV_FIXTURES=true.');
  const encryption = config.encryptionKey ? createEncryptionService({ key: config.encryptionKey, keyVersion: config.encryptionKeyVersion }) : null;
  const database = createDatabaseClient({ connectionString: config.databaseUrl });
  try {
    const seeded = await seedDemo(database.db, { encryption, publicAppUrl: config.publicAppUrl });
    console.log(`Seeded ${seeded.students.length} demo student profiles for ${seeded.parent.email}.`);
    console.log(`Demo parent password: ${seeded.parent.password}`);
    console.log(`Demo student PIN: ${seeded.pin}`);
    for (const student of seeded.students) console.log(`${student.name} invitation: ${student.invitationUrl}`);
  } finally { await database.close(); }
}
