import { spawnSync } from 'node:child_process';
import { sourceFiles } from './source-files.js';

const files = sourceFiles({ roots: ['apps/api/src', 'scripts', 'tests'], extensions: ['.js'] });
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${file}\n${result.stderr || result.stdout}`);
}

if (failures.length > 0) {
  console.error(`Syntax/type gate failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Syntax/type gate passed for ${files.length} API/test/script files.`);
