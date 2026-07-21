import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { consentRecords, outboxEvents, parentSessions, sessions, students, topics } from '../../apps/api/src/platform/database/schema/index.js';

describe('Drizzle PostgreSQL schema', () => {
  it('exports the production entities and their database constraints', () => {
    expect(students.id.name).toBe('id');
    expect(sessions.studentId.name).toBe('student_id');
    expect(consentRecords.status.name).toBe('status');
    expect(parentSessions.tokenHash.name).toBe('token_hash');
    expect(topics.studentId.name).toBe('student_id');
    expect(outboxEvents.idempotencyKey.name).toBe('idempotency_key');
  });

  it('uses Drizzle configuration and generated migration history', () => {
    const config = readFileSync(resolve('apps/api/drizzle.config.js'), 'utf8');
    const journal = JSON.parse(readFileSync(resolve('apps/api/drizzle/meta/_journal.json'), 'utf8'));
    expect(config).toContain("out: './apps/api/drizzle'");
    expect(journal.entries).toHaveLength(10);
  });
});
