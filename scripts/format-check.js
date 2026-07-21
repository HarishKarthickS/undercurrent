import { readFileSync } from 'node:fs';
import { sourceFiles } from './source-files.js';

const files = sourceFiles({ extensions: ['.js', '.jsx', '.css', '.md', '.json', '.yml', '.yaml'] });
const issues = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (!text.endsWith('\n')) issues.push(`${file}: missing final newline`);
  text.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) issues.push(`${file}:${index + 1} trailing whitespace`);
  });
}

if (issues.length > 0) {
  console.error(`Format check failed:\n${issues.join('\n')}`);
  process.exit(1);
}

console.log(`Format check passed for ${files.length} files.`);
