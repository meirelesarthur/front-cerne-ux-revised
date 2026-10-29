// -----------------------------------------------------------------------------
// Gera `docs/ux/MAPA-DE-MUDANCAS.md`: mapa legível por IA (e por gente) de TUDO que mudou desde o
// baseline do front (tag `ux-baseline`) e de ONDE cada componente do kit é usado.
//
//   node scripts/ux-docs/gen-change-map.mjs        (regenere antes de entregar uma nova rodada)
//
// Seções: (1) diff por área, (2) kit de componentes com descrição e consumidores, (3) tokens de
// tema novos, (4) telas migradas por padrão, (5) commits por tema. Só lê git e o código.
// -----------------------------------------------------------------------------

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

const BASE = (() => {
  try {
    return sh('git rev-list -n 1 ux-baseline');
  } catch {
    return sh('git log --reverse --format=%H').split('\n')[0];
  }
})();
const HEAD = sh('git rev-parse --short HEAD');

// ---- 1. diff por área ----
const status = sh(`git diff --name-status ${BASE} HEAD`).split('\n').filter(Boolean).map((l) => {
  const [st, ...rest] = l.split('\t');
  return { st: st[0], file: rest[rest.length - 1] };
});
const areaOf = (f) => {
  const p = f.split('/');
  if (p[0] !== 'src') return p[0] === 'docs' ? 'docs/ux' : p.slice(0, 2).join('/');
  if (p[1] === 'pages') return `src/pages/${p[2]}`;
  if (p[1] === 'components') return `src/components/${p[2] && !p[2].includes('.') ? p[2] : '(raiz)'}`;
  return `src/${p[1]}`;
};
const areas = new Map();
for (const { st, file } of status) {
  const a = areaOf(file);
  if (!areas.has(a)) areas.set(a, { A: [], M: [], D: [] });
  (areas.get(a)[st] ?? areas.get(a).M).push(file);
}
const areaRows = [...areas.entries()]
  .sort((a, b) => b[1].M.length + b[1].A.length - (a[1].M.length + a[1].A.length))
  .map(([a, v]) => `| \`${a}\` | ${v.A.length} | ${v.M.length} | ${v.D.length} |`)
  .join('\n');
const added = status.filter((s) => s.st === 'A' && s.file.startsWith('src/')).map((s) => `- \`${s.file}\``).join('\n');

// ---- 2. kit de componentes ----
const srcFiles = sh('git ls-files src')
  .split('\n')
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f) && fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).isFile());
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const contents = new Map(srcFiles.map((f) => [f, read(f)]));
const kitFiles = srcFiles.filter((f) => /^src\/components\/ui\/[^/]+\.tsx$/.test(f));
const extra = ['src/components/FormSection/index.tsx', 'src/components/ButtonFilter.tsx', 'src/components/Pagination.tsx', 'src/components/SelectPagination.tsx'];
const kit = [...kitFiles, ...extra.filter((f) => contents.has(f))];

function firstDoc(src) {
  const lines = src.split('\n').slice(0, 14).filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/\s?/, ''));
  const body = lines.filter((l) => l && !l.startsWith('src/') && !/^-+$/.test(l));
  return (body[0] ?? '').replace(/\|/g, '\\|');
}
const kitRows = kit.map((f) => {
  const base = path.basename(f).replace(/\.tsx$/, '');
  const name = base === 'index' ? path.basename(path.dirname(f)) : base;
  const importPath = f.replace(/^src\//, '@/').replace(/\.tsx$/, '').replace(/\/index$/, '');
  const users = [...contents.entries()].filter(([g, c]) => g !== f && c.includes(`from '${importPath}'`) || c.includes(`from "${importPath}"`)).map(([g]) => g).filter((g) => g !== f);
  const ui = new Set(users);
  return { name, f, doc: firstDoc(contents.get(f)), count: ui.size, users: [...ui] };
}).sort((a, b) => b.count - a.count);
const kitTable = kitRows.map((k) => `| \`${k.name}\` | \`${k.f}\` | ${k.doc} | ${k.count} |`).join('\n');

// ---- 3. tokens de tema novos ----
function themeTokens() {
  const out = [];
  for (const mode of ['light', 'dark']) {
    const f = `src/styles/theme/semantic/${mode}.ts`;
    let before = '';
    try { before = sh(`git show ${BASE}:${f}`); } catch { /* arquivo novo */ }
    const keys = (s) => new Set([...s.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*\{\s*value/gm)].map((m) => m[1]));
    const b = keys(before);
    const n = [...keys(contents.get(f) ?? read(f))].filter((k) => !b.has(k));
    out.push(`- \`${f}\` — ${n.length} tokens novos: ${n.map((k) => `\`${k}\``).join(', ') || '(nenhum)'}`);
  }
  return out.join('\n');
}

// ---- 4. telas por padrão ----
const patterns = [
  ['PageHeader (título/descrição de listagem do DS)', "from '@/components/ui/PageHeader'"],
  ['ListToolbar (busca inline + Filtros)', "from '@/components/ui/ListToolbar'"],
  ['ButtonFilter (botão Filtros do DS)', "from '@/components/ButtonFilter'"],
  ['FormSection (seção de formulário)', "from '@/components/FormSection'"],
  ['ToggleRow (interruptor em linha)', "from '@/components/ui/ToggleRow'"],
  ['ToggleCard (cartão liga/desliga)', "from '@/components/ui/ToggleCard'"],
  ['RepeaterList (lista repetível)', "from '@/components/ui/RepeaterList'"],
  ['StepBody/StepHeader/StepFooter (wizard)', "from '@/components/ui/StepBody'"],
  ['ImageUpload com editor de imagem', 'editor={'],
  ['SimpleTable (tabela simples do kit)', "from '@/components/ui/SimpleTable'"],
];
const patternSections = patterns.map(([label, needle]) => {
  const files = [...contents.entries()].filter(([f, c]) => c.includes(needle) && f.startsWith('src/pages/')).map(([f]) => f);
  const sample = files.slice(0, 60).map((f) => `  - \`${f}\``).join('\n');
  return `### ${label}\n${files.length} telas.${files.length ? `\n${sample}${files.length > 60 ? `\n  - … (+${files.length - 60}; use \`git grep -l "${needle}" src/pages\`)` : ''}` : ''}`;
}).join('\n\n');

// ---- 5. commits ----
const commits = sh(`git log --reverse --format="%h %s" ${BASE}..HEAD`).split('\n').filter(Boolean).map((l) => `- ${l}`).join('\n');

const md = `# Mapa de mudanças desde o baseline (gerado)

> **Gerado por \`scripts/ux-docs/gen-change-map.mjs\`** — não edite à mão; rode o script.
> Baseline: tag \`ux-baseline\` (\`${BASE.slice(0, 10)}\`) · HEAD: \`${HEAD}\` · ${status.length} arquivos alterados.
> Para ver qualquer mudança: \`git diff ux-baseline HEAD -- <arquivo>\`. Guia de aplicação: [PORTING.md](PORTING.md).

## 1. Diff por área
| Área | Novos | Alterados | Removidos |
|---|---:|---:|---:|
${areaRows}

### Arquivos novos em \`src/\`
${added}

## 2. Kit de componentes (onde cada um é usado)
Ordenado por nº de consumidores. Antes de criar componente novo, procure aqui (Lei: kit primeiro).

| Componente | Arquivo | Para quê | Consumidores |
|---|---|---|---:|
${kitTable}

## 3. Tokens de tema novos (semânticos)
${themeTokens()}

## 4. Telas migradas por padrão
${patternSections}

## 5. Commits (ordem cronológica)
${commits}
`;

fs.writeFileSync(path.join(ROOT, 'docs/ux/MAPA-DE-MUDANCAS.md'), md);
console.log(`ok · ${status.length} arquivos · ${kit.length} componentes de kit · ${(md.length / 1024).toFixed(0)} KB`);
