// Lista as folhas do menu (id, rótulo, caminho) por módulo e grupo, para escrever as descrições
// das centrais de agrupador. Uso: node scripts/ux-docs/list-nav-leaves.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../src/config/v2/navigationTree.ts', import.meta.url), 'utf8');
const re = /id:\s*'([^']+)',\s*\n?\s*label:\s*'([^']+)'(?:,\s*\n?\s*path:\s*'([^']+)')?/g;
let m;
let n = 0;
while ((m = re.exec(src))) {
  const [, id, label, path] = m;
  if (path) n += 1;
  console.log(`${path ? '  ' : '#'} ${id} | ${label}${path ? ' | ' + path : ''}`);
}
console.error('folhas:', n);
