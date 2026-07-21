import { describe, expect, it } from 'vitest';
import { demoAccess, seedDemo } from '../../scripts/seed-demo.js';

function createFixtureDatabase() {
  const operations = [];
  const database = {
    transaction: async (callback) => callback(database),
    delete(table) { return { where: async () => { operations.push({ type: 'delete', table }); } }; },
    insert(table) { return { values: async (values) => { operations.push({ type: 'insert', table, values }); } }; }
  };
  return { database, operations };
}

const encryption = { encrypt: (text) => ({ ciphertext: `encrypted:${text}`, iv: 'fixture-iv', authTag: 'fixture-tag', keyVersion: 'fixture-v1' }) };
const valuesFor = (operations, predicate) => operations.filter((operation) => operation.type === 'insert' && predicate(operation.values)).flatMap((operation) => Array.isArray(operation.values) ? operation.values : [operation.values]);

describe('demo seed', () => {
  it('requires encryption for ordinary conversation fixtures', async () => {
    const { database } = createFixtureDatabase();
    await expect(seedDemo(database)).rejects.toThrow('ENCRYPTION_KEY');
  });

  it('creates three rich student profiles, fresh invitations, and no safety transcript', async () => {
    const { database, operations } = createFixtureDatabase();
    const result = await seedDemo(database, { encryption, publicAppUrl: 'http://demo.local' });
    const studentRows = valuesFor(operations, (values) => Array.isArray(values) && values.some((value) => value.name === 'Ari'));
    const invitationRows = valuesFor(operations, (values) => Array.isArray(values) && values.some((value) => value.destinationType === 'parent'));
    const sessionRows = valuesFor(operations, (values) => Array.isArray(values) && values.some((value) => value.questId === 'talk-to-pip'));
    const turnRows = valuesFor(operations, (values) => Array.isArray(values) && values.some((value) => value.ciphertext?.startsWith('encrypted:')));
    const safetyRows = valuesFor(operations, (values) => !Array.isArray(values) && values.category === 'demo_check_in');

    expect(demoAccess).toEqual({ parentEmail: result.parent.email, parentPassword: result.parent.password, studentPin: '2468' });
    expect(result.parent.email).toBeTruthy();
    expect(result.parent.password).toBeTruthy();
    expect(result.students).toHaveLength(3);
    expect(result.students.every((student) => student.invitationUrl.startsWith('http://demo.local/student/invite/demo-'))).toBe(true);
    expect(studentRows.map((student) => student.name)).toEqual(['Ari', 'Bryn', 'Cora']);
    expect(invitationRows).toHaveLength(3);
    expect(sessionRows).toHaveLength(8);
    const liveSession = sessionRows.find((session) => session.questId === 'talk-to-pip');
    expect(liveSession).toMatchObject({ turnCount: 2 });
    expect(liveSession.endedAt).toBeUndefined();
    expect(turnRows.some((turn) => turn.ciphertext.includes('demo_check_in'))).toBe(false);
    expect(safetyRows).toEqual([expect.objectContaining({ sessionId: null, category: 'demo_check_in' })]);
  });

  it('refreshes fixture data and generates different invitation links on rerun', async () => {
    const { database, operations } = createFixtureDatabase();
    const first = await seedDemo(database, { encryption });
    const second = await seedDemo(database, { encryption });

    expect(operations.filter((operation) => operation.type === 'delete').length).toBeGreaterThan(10);
    expect(second.students.map((student) => student.invitationUrl)).not.toEqual(first.students.map((student) => student.invitationUrl));
  });
});
