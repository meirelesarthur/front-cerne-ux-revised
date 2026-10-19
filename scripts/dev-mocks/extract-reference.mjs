// Extrai tabelas de REFERÊNCIA (sem dados pessoais) de um dump PostgreSQL (pg_dump,
// formato COPY) para JSON, usadas pelos mocks de dev (src/mocks/dev-api).
//
// Uso: node scripts/dev-mocks/extract-reference.mjs <caminho/init_db.sql>
// Saída: src/mocks/dev-api/data/reference/<tabela>.json
//
// REGRA: só tabelas públicas/de catálogo entram em REFERENCE_TABLES. Nunca extraia
// pessoas, usuários, fornecedores, clientes, fazendas reais, movimentos financeiros
// etc. — o dump é uma base real e esses JSON são commitados no repositório.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const REFERENCE_TABLES = {
  banks: ['id', 'code', 'name'],
  countries: ['id', 'codigo', 'nome'],
  states: ['id', 'title', 'letter', 'iso', 'country_id'],
  cities: ['id', 'state_id', 'title', 'iso', 'iso_ddd', 'status'],
  breeds: ['id', 'description', 'is_enabled', 'specie_id'],
};

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/dev-mocks/extract-reference.mjs <init_db.sql>');
  process.exit(1);
}

const outDir = path.resolve('src/mocks/dev-api/data/reference');
fs.mkdirSync(outDir, { recursive: true });

// COPY text format: separador TAB, \N = null, escapes \t \n \r \\
const unescape = (v) =>
  v === '\\N'
    ? null
    : v.replace(/\\([tnr\\])/g, (_, c) => ({ t: '\t', n: '\n', r: '\r', '\\': '\\' })[c]);

const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
let current = null;
const data = {};

for await (const line of rl) {
  if (current) {
    if (line === '\\.') {
      current = null;
      continue;
    }
    const cells = line.split('\t');
    const row = {};
    current.cols.forEach((col, i) => {
      if (current.keep.includes(col)) row[col] = unescape(cells[i]);
    });
    data[current.table].push(row);
  } else if (line.startsWith('COPY gbcerne.')) {
    const m = line.match(/^COPY gbcerne\.(\w+) \(([^)]*)\) FROM stdin;$/);
    if (m && REFERENCE_TABLES[m[1]]) {
      current = { table: m[1], cols: m[2].split(', '), keep: REFERENCE_TABLES[m[1]] };
      data[m[1]] = [];
    }
  }
}

for (const [table, rows] of Object.entries(data)) {
  fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows));
  console.log(`${table}: ${rows.length} linhas`);
}
