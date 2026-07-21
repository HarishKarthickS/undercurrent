import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DEFAULT_IGNORES = new Set(['.git', 'coverage', 'dist', 'node_modules']);

export function sourceFiles({ roots = ['apps/web/src', 'apps/api/src', 'scripts', 'tests'], extensions = ['.js', '.jsx'], ignores = DEFAULT_IGNORES } = {}) {
  const files = [];
  for (const root of roots) walk(root, files, extensions, ignores);
  return files.sort();
}

function walk(path, files, extensions, ignores) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return;
  if (stats.isDirectory()) {
    const name = path.split(/[\\/]/).at(-1);
    if (ignores.has(name)) return;
    for (const entry of readdirSync(path)) walk(join(path, entry), files, extensions, ignores);
    return;
  }
  if (stats.isFile() && extensions.some((extension) => path.endsWith(extension))) {
    files.push(relative(process.cwd(), path).split(sep).join('/'));
  }
}
