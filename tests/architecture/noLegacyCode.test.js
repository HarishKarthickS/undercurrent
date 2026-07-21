import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sourceFiles } from '../../scripts/source-files.js';

describe('API architecture', () => {
  it('contains no legacy source files or deprecated runtime dependencies', () => {
    const files = sourceFiles({ roots: ['apps/api/src', 'apps/web/src', 'scripts'], extensions: ['.js', '.jsx'] });
    expect(files.some((file) => /apps\/api\/src\/(adapters|agents|ai|application|domain|learning|privacy|routes)\//.test(file))).toBe(false);
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/from ['"]express['"]/);
    expect(source).not.toMatch(/better-sqlite3|DATABASE_PATH/);
  });
});
