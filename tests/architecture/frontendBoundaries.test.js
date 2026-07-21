import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sourceFiles } from '../../scripts/source-files.js';

describe('web architecture', () => {
  it('keeps network access in the shared HTTP client and app imports on feature barrels', () => {
    const files = sourceFiles({ roots: ['apps/web/src'], extensions: ['.js', '.jsx'] });
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      if (file !== 'apps/web/src/shared/api/httpClient.js') expect(source).not.toMatch(/\bfetch\s*\(/);
    }
    const app = readFileSync('apps/web/src/app/App.jsx', 'utf8');
    expect(app).not.toMatch(/#web\/features\/[^/]+\/(?:api|components|hooks)\//);
  });
});
