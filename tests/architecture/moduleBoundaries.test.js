import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('module boundaries', () => {
  it('keeps Fastify bootstrap as the only HTTP composition root', () => {
    const students = readFileSync(resolve('apps/api/src/modules/students/index.js'), 'utf8');
    const sessions = readFileSync(resolve('apps/api/src/modules/sessions/index.js'), 'utf8');
    expect(students).not.toContain("from 'fastify'");
    expect(sessions).not.toContain("from 'fastify'");
  });
});
