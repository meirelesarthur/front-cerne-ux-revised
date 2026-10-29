// -----------------------------------------------------------------------------
// Extrai dos serviços (`src/services/v2/**`) o FORMATO das respostas de cada endpoint —
// `api.V2.<verbo><TipoDaResposta>('/rota', ...)` — usando o compilador do TypeScript, e grava um
// JSON compacto (`src/mocks/dev-api/generated/schemas.json`). O mock sintético (`synthetic.ts`)
// usa esse JSON para gerar linhas fictícias com exatamente os campos que cada tela espera.
//
//   node scripts/dev-mocks/extract-schemas.mjs          (rode de novo quando mudar tipos/serviços)
//
// Sem dado real: o arquivo só descreve tipos (nomes de campo, enums, aninhamento).
// -----------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'src/mocks/dev-api/generated/schemas.json');
const VERBS = new Set(['get', 'post', 'put', 'patch', 'delete']);
const MAX_DEPTH = 6;

// ---- programa TypeScript (só os serviços e o que eles importam) ----
const cfg = ts.readConfigFile(path.join(ROOT, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, ROOT);
const serviceFiles = parsed.fileNames.filter((f) => /[\\/]src[\\/]services[\\/]v2[\\/]/.test(f) && !/\.test\./.test(f) && f.endsWith('.ts'));
const program = ts.createProgram(serviceFiles, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();

// ---- schema interning (reduz tamanho: nós iguais viram um só) ----
const defs = [];
const index = new Map();
function intern(node) {
  const key = JSON.stringify(node);
  let id = index.get(key);
  if (id === undefined) {
    id = defs.length;
    defs.push(node);
    index.set(key, id);
  }
  return id;
}
const S = () => intern(['s']);
const N = () => intern(['n']);
const B = () => intern(['b']);
const X = () => intern(['x']);
const Z = () => intern(['z']);

const isNullish = (t) => !!(t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Never));

function typeToSchema(type, depth, stack, loc) {
  if (depth > MAX_DEPTH) return X();
  const f = type.flags;
  if (f & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return X();
  if (isNullish(type)) return Z();
  if (f & ts.TypeFlags.StringLiteral) return intern(['e', [type.value]]);
  if (f & ts.TypeFlags.NumberLiteral) return intern(['e', [type.value]]);
  if (f & ts.TypeFlags.BooleanLiteral) return B();
  if (f & ts.TypeFlags.String) return S();
  if (f & (ts.TypeFlags.Number | ts.TypeFlags.BigInt)) return N();
  if (f & ts.TypeFlags.Boolean) return B();
  if (f & ts.TypeFlags.EnumLiteral && type.isLiteral && type.isLiteral()) return intern(['e', [type.value]]);

  if (type.isUnion()) {
    const members = type.types.filter((t) => !isNullish(t));
    if (members.length === 0) return Z();
    if (members.every((t) => t.flags & ts.TypeFlags.BooleanLiteral)) return B();
    const lits = members.filter((t) => t.isLiteral && t.isLiteral()).map((t) => t.value);
    if (lits.length === members.length) return intern(['e', lits]);
    // mistura de literais e tipos: prefere o primeiro objeto/array; senão o primeiro membro
    const obj = members.find((t) => t.flags & ts.TypeFlags.Object);
    return typeToSchema(obj ?? members[0], depth, stack, loc);
  }

  if (type.isIntersection()) {
    const props = {};
    for (const t of type.types) {
      if (!(t.flags & ts.TypeFlags.Object)) continue;
      for (const p of checker.getPropertiesOfType(t)) {
        props[p.name] = typeToSchema(checker.getTypeOfSymbolAtLocation(p, loc), depth + 1, stack, loc);
      }
    }
    return intern(['o', props]);
  }

  if (f & ts.TypeFlags.Object) {
    const name = type.symbol?.name ?? '';
    if (name === 'Date') return S();
    if (name === 'File' || name === 'Blob' || name === 'FormData') return X();
    if (checker.isArrayType(type) || checker.isTupleType(type)) {
      const el = checker.getTypeArguments(type)[0];
      return intern(['a', el ? typeToSchema(el, depth + 1, stack, loc) : X()]);
    }
    if (stack.has(type)) return X();
    const props = checker.getPropertiesOfType(type);
    const idx = checker.getIndexInfosOfType?.(type) ?? [];
    if (props.length === 0 && idx.length > 0) return intern(['m', typeToSchema(idx[0].type, depth + 1, stack, loc)]);
    if (props.length === 0) return X();
    stack.add(type);
    const out = {};
    for (const p of props) {
      const pt = checker.getTypeOfSymbolAtLocation(p, loc);
      if (pt.getCallSignatures().length > 0) continue;
      out[p.name] = typeToSchema(pt, depth + 1, stack, loc);
    }
    stack.delete(type);
    return intern(['o', out]);
  }
  return X();
}

// ---- URL da chamada → padrão com :p nos trechos dinâmicos ----
function urlPattern(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((sp) => ':p' + sp.literal.text).join('');
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = urlPattern(node.left);
    const r = urlPattern(node.right);
    return l === null ? null : l + (r ?? ':p');
  }
  if (ts.isParenthesizedExpression(node)) return urlPattern(node.expression);
  // constante/variável com tipo literal
  const t = checker.getTypeAtLocation(node);
  if (t.isStringLiteral && t.isStringLiteral()) return t.value;
  return ':p';
}

const routes = {};
let seen = 0;
let skipped = 0;

function visit(sf) {
  function walk(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const verb = node.expression.name.text;
      const target = node.expression.expression;
      if (VERBS.has(verb) && ts.isPropertyAccessExpression(target) && target.name.text === 'V2' && target.expression.getText() === 'api') {
        seen++;
        const arg = node.arguments[0];
        const typeArg = node.typeArguments?.[0];
        const raw = arg ? urlPattern(arg) : null;
        if (raw === null || !typeArg) {
          skipped++;
        } else {
          const pattern = '/' + raw.split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');
          const key = `${verb} ${pattern}`;
          if (!routes[key] && pattern !== '/:p') {
            const type = checker.getTypeFromTypeNode(typeArg);
            routes[key] = typeToSchema(type, 0, new Set(), typeArg);
          }
        }
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(sf);
}

for (const sf of program.getSourceFiles()) {
  const f = sf.fileName.replace(/\\/g, '/');
  if (f.includes('/src/services/v2/') && !f.includes('.test.')) visit(sf);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ defs, routes }));
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`chamadas: ${seen} · rotas com tipo: ${Object.keys(routes).length} · sem tipo/rota dinâmica: ${skipped} · nós: ${defs.length} · ${kb} KB`);
