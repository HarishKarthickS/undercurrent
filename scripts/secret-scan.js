import { readFileSync } from 'node:fs';
import { sourceFiles } from './source-files.js';

const files = sourceFiles({
  roots: ['apps/api/src', 'apps/web/src', 'scripts', 'tests', 'docs', '.github'],
  extensions: ['.js', '.jsx', '.md', '.yml', '.yaml', '.json']
});
const patterns = [
  [/sk-[A-Za-z0-9_-]{20,}/, 'possible OpenAI secret key'],
  [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key material'],
  [/\b(AWS|GOOGLE|GCP|AZURE)_[A-Z0-9_]*(SECRET|KEY|TOKEN)\s*=\s*['"]?[A-Za-z0-9/+_=.-]{16,}/, 'possible cloud credential']
];
const issues = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const [pattern, label] of patterns) {
    if (pattern.test(text)) issues.push(`${file}: ${label}`);
  }
}

if (issues.length > 0) {
  console.error(`Secret scan failed:\n${issues.join('\n')}`);
  process.exit(1);
}

console.log(`Secret scan passed for ${files.length} files.`);
