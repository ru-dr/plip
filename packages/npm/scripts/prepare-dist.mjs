// Finishes the dual ESM/CJS build: marks dist/cjs as CommonJS for Node's
// resolver, and copies the repo-root docs that npm cannot include from
// outside the package directory.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageDir, '..', '..');

writeFileSync(join(packageDir, 'dist', 'cjs', 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  const source = join(repoRoot, file);
  if (existsSync(source)) {
    copyFileSync(source, join(packageDir, file));
  }
}
