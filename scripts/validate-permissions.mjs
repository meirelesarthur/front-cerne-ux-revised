// scripts/validate-permissions.mjs
// Validação do mapa de permissões do menu (risco §8.2 do
// PLANO-PERMISSIONAMENTO-GBCERNE.md): como os nomes de permissão são strings
// livres, um typo (`farm_view` em vez de `farms_view`) falha SILENCIOSO —
// só esconde o item do menu. Este script quebra o build/CI nesses casos.
//
// Uso: `npm run validate:permissions` (ou `node scripts/validate-permissions.mjs`)
//
// Fontes:
// - src/config/v2/navigationPermissions.ts  (mapa id → regra, GERADO)
// - src/config/v2/navigationTree.ts         (ids válidos de item de menu)
// - src/config/v2/permissionsCatalog.json   (SNAPSHOT do catálogo real do
//   backend — nomes de Spatie\Permission; uuids ficam de fora porque variam
//   por ambiente. Para regenerar:
//   docker exec gbcerne-web php artisan tinker --execute="file_put_contents('/tmp/cat.json', \Spatie\Permission\Models\Permission::orderBy('name')->pluck('name')->toJson(JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));"
//   docker exec gbcerne-web cat /tmp/cat.json > src/config/v2/permissionsCatalog.json )
//
// Checagens:
// 1. Toda `permission` e todo membro de `anyOf` existem no catálogo.
// 2. Todo `sameAs` aponta para um id que existe na árvore E tem regra própria.
// 3. Toda CHAVE do mapa é um id que existe no navigationTree.
// 4. (aviso, não falha) Folhas da árvore sem regra no mapa — allow-by-default.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

const catalog = new Set(JSON.parse(read("src/config/v2/permissionsCatalog.json")));
const navSrc = read("src/config/v2/navigationTree.ts");
const permSrc = read("src/config/v2/navigationPermissions.ts");

// Ids válidos da árvore (folhas e módulos).
// Aspas agnósticas: prettier (singleQuote: true) pode reformatar estes
// arquivos de aspas duplas para simples a qualquer momento (ex.: GAP-FE-230,
// eslint --fix reformatou navigationPermissions.ts inteiro). As regexes
// abaixo casam ' OU " para não quebrar de novo na próxima reformatação.
const treeIds = new Set([...navSrc.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));

// Entradas do mapa: "id": { permission: "x" } | { anyOf: [...] } | { sameAs: "id" }
// `role` é ADITIVO (execução 079): `{ permission: 'x', role: 'Y' }` continua validando `permission`.
const entryRe = /['"]([^'"]+)['"]:\s*\{\s*(permission|anyOf|sameAs):\s*(\[[^\]]*\]|['"][^'"]*['"])(?:\s*,\s*role:\s*['"][^'"]*['"])?\s*\}/g;
const entries = new Map();
for (const m of permSrc.matchAll(entryRe)) {
  const [, id, kind, raw] = m;
  const value =
    kind === "anyOf" ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : raw.slice(1, -1);
  entries.set(id, { kind, value });
}

const errors = [];
const warnings = [];

if (entries.size === 0) errors.push("nenhuma entrada extraída de navigationPermissions.ts — regex desatualizada?");
if (catalog.size === 0) errors.push("permissionsCatalog.json vazio");

for (const [id, { kind, value }] of entries) {
  if (!treeIds.has(id)) errors.push(`"${id}": id não existe no navigationTree.ts (item removido/renomeado?)`);

  if (kind === "permission") {
    if (!catalog.has(value)) errors.push(`"${id}": permission "${value}" não existe no catálogo`);
  } else if (kind === "anyOf") {
    if (value.length === 0) errors.push(`"${id}": anyOf vazio`);
    for (const p of value) {
      if (!catalog.has(p)) errors.push(`"${id}": anyOf contém "${p}" que não existe no catálogo`);
    }
  } else if (kind === "sameAs") {
    if (!treeIds.has(value)) errors.push(`"${id}": sameAs "${value}" não existe no navigationTree.ts`);
    const target = entries.get(value);
    if (!target) errors.push(`"${id}": sameAs "${value}" não tem regra própria no mapa (herança quebrada)`);
    else if (target.kind === "sameAs") errors.push(`"${id}": sameAs em cadeia ("${value}" também é sameAs) — só 1 salto é resolvido`);
  }
}

// Cobertura (aviso): folha de árvore sem regra = visível para qualquer autenticado.
const leafIds = [
  ...navSrc.matchAll(/\{ id:\s*['"]([^'"]+)['"], label:\s*['"][^'"]+['"], path:\s*['"][^'"]+['"] \}/g),
].map((m) => m[1]);
for (const id of leafIds) {
  if (!entries.has(id)) warnings.push(`folha "${id}" sem regra no mapa (visível para qualquer autenticado — confirme se é intencional)`);
}

for (const w of warnings) console.warn(`AVISO: ${w}`);
if (errors.length) {
  console.error(`\n✖ validate-permissions: ${errors.length} erro(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✔ validate-permissions: ${entries.size} regras OK contra ${catalog.size} permissões do catálogo (${warnings.length} aviso(s)).`
);
