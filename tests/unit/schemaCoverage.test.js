import { describe, expect, it } from 'vitest';
import * as schema from '#api/platform/database/schema/index.js';

describe('database schema declarations', () => {
  it('exports every production table and enum used by repositories', () => {
    for (const name of ['consentRecords', 'households', 'outboxEvents', 'parentAccounts', 'parentSessions', 'safetyEvents', 'scores', 'sessionTurns', 'sessions', 'students', 'topics', 'turnRequests', 'wins']) {
      expect(schema[name]).toBeDefined();
    }
    expect(schema.sessionType.enumValues).toEqual(['morning', 'evening']);
  });
});
