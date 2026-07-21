import { readFileSync } from 'node:fs';
import { sourceFiles } from './source-files.js';

const issues = [];
const consoleLogAllowlist = new Set(['apps/api/src/bootstrap/startServer.js']);

for (const file of sourceFiles()) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\bdebugger\b/.test(line) && file !== 'scripts/lint-js.js') issues.push(`${file}:${index + 1} remove debugger statement`);
    if (/\b(describe|it|test)\.only\s*\(/.test(line)) issues.push(`${file}:${index + 1} remove focused test`);
    if (/\b(console\.log)\s*\(/.test(line) && !consoleLogAllowlist.has(file) && !file.startsWith('scripts/')) issues.push(`${file}:${index + 1} use structured output instead of console.log`);
    if (/\b(TODO|FIXME)\b/.test(line) && file !== 'scripts/lint-js.js') issues.push(`${file}:${index + 1} replace TODO/FIXME with tracked task`);
  });
}

if (issues.length > 0) {
  console.error(`Lint check failed:\n${issues.join('\n')}`);
  process.exit(1);
}

console.log(`Lint check passed for ${sourceFiles().length} files.`);
