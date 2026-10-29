// -----------------------------------------------------------------------------
// MOCK SINTÉTICO — só para trabalho de UX local. Responde QUALQUER endpoint dos serviços
// (`src/services/v2/**`) com dados fictícios no formato certo, sem backend nem banco.
//
// Como funciona:
//  - `generated/schemas.json` (gerado por `scripts/dev-mocks/extract-schemas.mjs`) descreve o
//    FORMATO da resposta de cada rota, extraído dos tipos TypeScript dos serviços.
//  - Aqui os campos são preenchidos por NOME e TIPO (e-mail, telefone, datas, valores, enums…),
//    de forma determinística: a mesma rota devolve sempre as mesmas linhas.
//  - Listas têm 15 linhas (paginação e busca funcionam); o detalhe devolve o mesmo registro da
//    lista; criar/editar/excluir mexem numa cópia em memória (some ao recarregar a página).
//
// Dados 100% inventados (nomes, e-mails `.test`, documentos fictícios). Nada de dado real.
// -----------------------------------------------------------------------------

type Def = [string, ...any[]];
interface SchemaFile {
  defs: Def[];
  routes: Record<string, number>;
}

interface RouteEntry {
  verb: string;
  pattern: string;
  regex: RegExp;
  statics: number;
  params: number;
  root: number;
}

export interface SyntheticRequest {
  method: string;
  path: string;
  params: Record<string, any>;
  body: unknown;
}

export interface SyntheticResponse {
  status: number;
  data: unknown;
}

const LIST_SIZE = 15;

// ---------------------------------------------------------------------------
// utilidades
// ---------------------------------------------------------------------------
function hash(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0);
}

const uuidFor = (seed: string) => {
  const h = (n: number) => (hash(`${seed}:${n}`) >>> 0).toString(16).padStart(8, '0');
  const a = h(1) + h(2) + h(3) + h(4);
  return `${a.slice(0, 8)}-${a.slice(8, 12)}-4${a.slice(13, 16)}-8${a.slice(17, 20)}-${a.slice(20, 32)}`;
};

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const humanize = (key: string) => {
  const t = key.replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const pick = <T,>(arr: T[], i: number) => arr[Math.abs(i) % arr.length];
const pad = (n: number, len: number) => String(n).padStart(len, '0');

const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nelson', 'Olívia'];
const LAST = ['Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Ferraz', 'Gouveia', 'Honório', 'Ibrahim', 'Junqueira', 'Klein', 'Lacerda', 'Moura', 'Nogueira', 'Orlando'];
const COMPANY = ['Agropecuária Santa Aurora', 'Fazenda Boa Esperança', 'Grupo Terra Viva', 'Cooperativa Vale Verde', 'Comercial Campo Forte', 'Insumos Rio Claro', 'Transportes Estrela do Sul', 'Laticínios Serra Azul', 'Frigorífico Horizonte', 'Sementes Aroeira', 'Máquinas Planalto', 'Pecuária Três Marias', 'Agrícola Cerrado Norte', 'Armazéns Sol Nascente', 'Fertilizantes Vale Dourado'];
const CITIES = ['Uberaba', 'Rio Verde', 'Sorriso', 'Ribeirão Preto', 'Campo Grande', 'Goiânia', 'Barretos', 'Dourados', 'Araguaína', 'Londrina'];
const STATUS_LABEL = ['Ativo', 'Pendente', 'Concluído', 'Em andamento', 'Inativo'];

/** Nome (singular, PT-BR) do que a coleção guarda, a partir do último trecho da rota. */
const NOUNS: Record<string, string> = {
  farms: 'Fazenda', harvests: 'Safra', banks: 'Banco', products: 'Produto', packages: 'Embalagem', 'product-packages': 'Embalagem',
  'cost-centers': 'Centro de custo', 'plan-accounts': 'Conta', users: 'Usuário', roles: 'Perfil', people: 'Pessoa', warehouses: 'Armazém',
  addressings: 'Endereçamento', measurements: 'Unidade', 'product-groups': 'Grupo', 'category-products': 'Categoria', kinds: 'Classe',
  animals: 'Animal', batches: 'Lote', breeds: 'Raça', species: 'Espécie', vaccines: 'Vacina', equipments: 'Equipamento', 'family-equipments': 'Família',
  contracts: 'Contrato', invoices: 'Nota', suppliers: 'Fornecedor', clients: 'Cliente', customers: 'Cliente', owners: 'Proprietário',
  employees: 'Funcionário', drivers: 'Motorista', vehicles: 'Veículo', activities: 'Atividade', areas: 'Área', pastures: 'Pasto', plots: 'Talhão',
  accounts: 'Conta', teams: 'Equipe', permissions: 'Permissão', notifications: 'Notificação', orders: 'Pedido', sales: 'Venda', purchases: 'Compra',
  budgets: 'Orçamento', markers: 'Marcador', headbands: 'Cabeçalho', functions: 'Função', 'category-animals': 'Categoria', 'reasons': 'Motivo',
};
const PERSON_COLLECTIONS = /(users?|people|persons?|employees?|clients?|customers?|suppliers?|owners?|drivers?|contacts?|members?|responsible|sellers?|vendors?|affiliates|afiliados)/;

function nounFor(coll: string): string {
  const segs = coll.split('/').filter((s) => s && !s.startsWith(':') && !/^[0-9a-f-]{20,}$/i.test(s));
  const last = segs[segs.length - 1] ?? 'item';
  if (NOUNS[last]) return NOUNS[last];
  const words = last.replace(/-/g, ' ');
  const singular = words.replace(/ies$/, 'y').replace(/ses$/, 's').replace(/s$/, '');
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

const personName = (i: number) => `${pick(FIRST, i)} ${pick(LAST, i * 7 + 3)}`;
const fakeDoc = (i: number, cnpj: boolean) => {
  const base = pad(Math.abs(hash(`doc${i}`)) % 1e9, 9) + pad(i % 100, 2);
  return cnpj
    ? `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/0001-${base.slice(8, 10)}`
    : `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6, 9)}-${base.slice(9, 11)}`;
};
const isoDay = (i: number, back = 0) => {
  const d = new Date(Date.UTC(2026, 9, 28));
  d.setUTCDate(d.getUTCDate() - back - i * 3);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------
// geração de valores por schema
// ---------------------------------------------------------------------------
interface Ctx {
  coll: string;
  noun: string;
  i: number;
  depth: number;
}

let schema: SchemaFile | null = null;
let entries: RouteEntry[] = [];

function node(id: number): Def {
  return schema!.defs[id];
}

function genString(key: string, c: Ctx): unknown {
  const k = key.toLowerCase();
  const i = c.i;
  if (k === 'uuid' || k.endsWith('_uuid') || k === 'id' || k.endsWith('_id')) {
    return uuidFor(k === 'uuid' || k === 'id' ? c.coll + ':' + i : `${k}:${i % 3}`);
  }
  if (/email/.test(k)) return `contato${i + 1}@exemplo.test`;
  if (/(phone|celular|telefone|mobile|fone|whatsapp)/.test(k)) return `(34) 9${pad(Math.abs(hash(`p${i}`)) % 1e8, 8).replace(/^(\d{4})(\d{4})$/, '$1-$2')}`;
  if (/(cnpj)/.test(k)) return fakeDoc(i, true);
  if (/(cpf|nif|document|documento)/.test(k)) return fakeDoc(i, i % 3 === 0);
  if (/(cep|zip|postal)/.test(k)) return `38${pad(i % 1000, 3)}-${pad((i * 37) % 1000, 3)}`;
  if (/(photo|image|logo|avatar|picture|thumbnail)/.test(k)) return null;
  if (/(url|link|href|path|file|arquivo)/.test(k)) return null;
  if (/(_at$|datetime|timestamp)/.test(k)) return `${isoDay(i)}T${pad(8 + (i % 9), 2)}:${pad((i * 7) % 60, 2)}:00.000000Z`;
  if (/(date|data_|_data|vencimento|emissao|due|start|end|begin|inicio|fim)/.test(k) && !/(update|candidate)/.test(k)) return isoDay(i, /(end|fim|due|venc)/.test(k) ? -20 : 10);
  if (/(^time$|hora|_time$)/.test(k)) return `${pad(7 + (i % 10), 2)}:${pad((i * 11) % 60, 2)}`;
  if (/(color|cor$)/.test(k)) return pick(['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'], i);
  if (/(plate|placa)/.test(k)) return `ABC${i % 10}${pick(['D', 'E', 'F'], i)}${pad((i * 13) % 100, 2)}`;
  if (/(state|uf)$/.test(k)) return pick(['MG', 'GO', 'MT', 'SP', 'MS'], i);
  if (/(city|cidade|municipio)/.test(k)) return pick(CITIES, i);
  if (/(address|street|logradouro|endereco)/.test(k)) return `Rua das Palmeiras, ${100 + i * 12}`;
  if (/(neighborhood|bairro)/.test(k)) return 'Centro';
  if (/(unit|sigla|abbreviation|symbol)/.test(k)) return pick(['kg', 'un', 'L', 'ha', 'sc'], i);
  if (/(currency|moeda)/.test(k)) return 'BRL';
  if (/(note|obs|comment|comentario|text|message|body|reason|motivo|detail)/.test(k)) return 'Texto de exemplo para visualizar o layout da tela.';
  if (/(code|codigo|sku|number|numero|serie|serial|chave|protocol)/.test(k)) return pad(i + 1, 4);
  if (/(status|situacao).*label|label$/.test(k)) return pick(STATUS_LABEL, i);
  if (/(trade|company|razao|fantasia|social)/.test(k)) return pick(COMPANY, i);
  if (/(^|_)(name|nome|title|titulo|description|descricao|descriptive|label|text)($|_)/.test(k) || k === 'title') {
    if (PERSON_COLLECTIONS.test(c.coll) && /(name|nome)/.test(k)) return personName(i);
    return `${c.noun} ${i + 1}`;
  }
  if (/(status|situacao|type|tipo|kind|category|categoria|class|origin|origem|mode|modo)/.test(k)) return pick(['active', 'pending', 'done'], i);
  return `${humanize(key)} ${i + 1}`;
}

function genNumber(key: string, c: Ctx): number {
  const k = key.toLowerCase();
  const i = c.i;
  if (k === 'id') return i + 1;
  if (k.endsWith('_id')) return (i % 3) + 1;
  if (/(percent|perc|rate|aliq|taxa|margin|margem)/.test(k)) return Math.round((5 + ((i * 7) % 90)) * 100) / 100;
  if (/(price|preco|value|valor|amount|total|cost|custo|saldo|balance|salary|salario|revenue|receita|despesa|expense)/.test(k)) return Math.round((120 + i * 37.5) * 100) / 100;
  if (/(quantity|qty|quantidade|stock|estoque|count|qtd|heads|cabecas|animals)/.test(k)) return 10 * (i + 1);
  if (/(weight|peso)/.test(k)) return 420 + i * 15;
  if (/(area|hectare|size|tamanho)/.test(k)) return 50 + i * 20;
  if (/(^year$|ano$)/.test(k)) return 2026 - (i % 3);
  if (/(month|mes)/.test(k)) return (i % 12) + 1;
  if (/(^day$|dia$)/.test(k)) return (i % 28) + 1;
  if (/(order|position|sequence|ordem|sequencia|number|numero)/.test(k)) return i + 1;
  if (/(latitude|lat$)/.test(k)) return -19.75 - i * 0.01;
  if (/(longitude|lng$|lon$)/.test(k)) return -47.93 - i * 0.01;
  if (/(page|current_page|last_page)/.test(k)) return 1;
  return (i + 1) * 10;
}

function genBoolean(key: string, c: Ctx): boolean {
  const k = key.toLowerCase();
  if (/(enabled|active|ativo|can_|has_|allow|visible|is_user)/.test(k)) return true;
  if (/(deleted|blocked|bloqueado|expired|error|failed|overdue)/.test(k)) return false;
  return c.i % 2 === 0;
}

function enumLabel(v: unknown): string {
  return typeof v === 'number' ? `Opção ${v}` : humanize(String(v));
}

function gen(id: number, key: string, c: Ctx): unknown {
  const n = node(id);
  switch (n[0]) {
    case 's':
      return genString(key, c);
    case 'n':
      return genNumber(key, c);
    case 'b':
      return genBoolean(key, c);
    case 'e': {
      const values = n[1] as unknown[];
      return values[Math.abs(c.i) % values.length];
    }
    case 'z':
    case 'x':
      return null;
    case 'm':
      return {};
    case 'a': {
      if (c.depth > 3) return [];
      const count = c.depth === 0 ? LIST_SIZE : c.depth === 1 ? 2 : 1;
      const out: unknown[] = [];
      for (let j = 0; j < count; j += 1) out.push(gen(n[1], key, { ...c, i: c.i * 3 + j, depth: c.depth + 1 }));
      return out;
    }
    case 'o': {
      if (c.depth > 4) return {};
      const props = n[1] as Record<string, number>;
      const obj: Record<string, unknown> = {};
      for (const [pk, pid] of Object.entries(props)) obj[pk] = gen(pid, pk, { ...c, depth: c.depth + 1 });
      // rótulos coerentes com o campo-base (ex.: class → class_label)
      for (const pk of Object.keys(obj)) {
        if (pk.endsWith('_label') && pk.slice(0, -6) in obj) {
          const base = obj[pk.slice(0, -6)];
          if (base !== null && typeof base !== 'object') obj[pk] = enumLabel(base);
        }
      }
      return obj;
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// rotas e coleções
// ---------------------------------------------------------------------------
function buildIndex(file: SchemaFile) {
  schema = file;
  entries = Object.entries(file.routes).map(([k, root]) => {
    const space = k.indexOf(' ');
    const verb = k.slice(0, space);
    const pattern = k.slice(space + 1);
    const re = pattern
      .split(/(:p)/)
      .map((part) => (part === ':p' ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('');
    return {
      verb,
      pattern,
      regex: new RegExp(`^${re}$`),
      statics: pattern.split('/').filter((s) => s && !s.includes(':p')).length,
      params: (pattern.match(/:p/g) ?? []).length,
      root,
    };
  });
  // mais estáticas e menos parâmetros primeiro (a rota específica vence a genérica)
  entries.sort((a, b) => a.params - b.params || b.statics - a.statics);
}

function findRoute(verb: string, path: string): RouteEntry | undefined {
  return entries.find((e) => e.verb === verb && e.regex.test(path));
}

const rootProps = (root: number) => (node(root)[0] === 'o' ? (node(root)[1] as Record<string, number>) : {});
const dataOf = (root: number): number | undefined => rootProps(root).data;
const isListRoot = (root: number) => {
  const d = dataOf(root);
  return d !== undefined && node(d)[0] === 'a';
};
const hasMeta = (root: number) => 'meta' in rootProps(root);

interface Entity {
  i: number;
  id: string;
  patch: Record<string, unknown>;
}
const store = new Map<string, Entity[]>();
let created = 0;

function entitiesOf(coll: string): Entity[] {
  let list = store.get(coll);
  if (!list) {
    list = Array.from({ length: LIST_SIZE }, (_, i) => ({ i, id: uuidFor(`${coll}:${i}`), patch: {} }));
    store.set(coll, list);
  }
  return list;
}

/** Coleção "dona" de um caminho concreto: tira o /:id final e sufixos auxiliares (options). */
function collectionOf(path: string): { coll: string; id: string | null } {
  const segs = path.split('/').filter(Boolean);
  const last = segs[segs.length - 1];
  if (last === 'options' || (segs[segs.length - 2] === 'options' && last === 'global')) {
    return { coll: '/' + segs.slice(0, last === 'global' ? -2 : -1).join('/'), id: null };
  }
  const looksLikeId = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || /^\d+$/.test(s);
  if (segs.length >= 2 && looksLikeId(last)) return { coll: '/' + segs.slice(0, -1).join('/'), id: last };
  return { coll: '/' + segs.join('/'), id: null };
}

const merge = (base: unknown, patch: Record<string, unknown>) =>
  base && typeof base === 'object' && !Array.isArray(base) ? { ...(base as object), ...patch } : base;

function genRow(root: number, coll: string, e: Entity): unknown {
  const d = dataOf(root);
  if (d === undefined) return null;
  const n = node(d);
  const itemId = n[0] === 'a' ? n[1] : d;
  const row = gen(itemId, '', { coll, noun: nounFor(coll), i: e.i, depth: 1 }) as Record<string, unknown> | null;
  if (row && typeof row === 'object') {
    if ('uuid' in row) row.uuid = e.id;
    else if ('id' in row && typeof row.id === 'string') row.id = e.id;
    return merge(row, e.patch);
  }
  return row;
}

function envelope(root: number, data: unknown, meta: unknown | undefined): unknown {
  const base = gen(root, '', { coll: '/', noun: '', i: 0, depth: 4 }) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...(base && typeof base === 'object' ? base : {}) };
  out.success = true;
  out.message = 'dev-mock';
  if ('errors' in out || true) out.errors = null;
  if ('statusCode' in out) out.statusCode = 200;
  if ('notifications' in out) out.notifications = [];
  out.data = data;
  if (meta !== undefined) out.meta = meta;
  else if ('meta' in out) out.meta = null;
  return out;
}

function paginate(rows: unknown[], params: Record<string, any>) {
  const perPage = Math.max(1, Number(params.per_page ?? params.limit ?? params.perPage) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  const total = rows.length;
  const last = Math.max(1, Math.ceil(total / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);
  return {
    slice,
    meta: {
      current_page: page,
      last_page: last,
      per_page: perPage,
      total,
      count: slice.length,
      from: slice.length ? (page - 1) * perPage + 1 : null,
      to: slice.length ? (page - 1) * perPage + slice.length : null,
      links: { first: null, prev: null, next: null, last: null },
    },
  };
}

const SKIP_FILTER = new Set(['page', 'per_page', 'perPage', 'limit', 'search', 'sort', 'sort_by', 'order', 'order_by', 'direction', 'with', 'include', 'only_analytic']);

function filterRows(rows: any[], params: Record<string, any>): any[] {
  let out = rows;
  const term = typeof params.search === 'string' ? slug(params.search.trim()) : '';
  if (term) {
    out = out.filter((r) =>
      r && typeof r === 'object' && Object.values(r).some((v) => typeof v === 'string' && slug(v).includes(term))
    );
  }
  for (const [k, v] of Object.entries(params)) {
    if (SKIP_FILTER.has(k) || v === undefined || v === null || v === '' || typeof v === 'object') continue;
    out = out.filter((r) => !(r && typeof r === 'object' && k in r && typeof r[k] !== 'object' && r[k] !== null) || String(r[k]) === String(v));
  }
  return out;
}

function bodyToObject(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const o: Record<string, unknown> = {};
    body.forEach((v, k) => {
      if (typeof v === 'string') o[k] = v;
    });
    return o;
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return typeof body === 'object' ? { ...(body as Record<string, unknown>) } : {};
}

// ---------------------------------------------------------------------------
// entrada
// ---------------------------------------------------------------------------
export async function loadSynthetic(): Promise<boolean> {
  if (schema) return true;
  try {
    const mod = await import('./generated/schemas.json');
    buildIndex((mod as any).default ?? mod);
    return true;
  } catch {
    return false;
  }
}

export function syntheticHandle(req: SyntheticRequest): SyntheticResponse | null {
  if (!schema) return null;
  const verb = req.method.toLowerCase();
  const path = '/' + req.path.replace(/^\/+/, '').replace(/\/+$/, '').replace(/^api\/v1\//, '');
  const route = findRoute(verb, path);
  if (!route) return null;
  const { coll, id } = collectionOf(path);
  const root = route.root;
  const listRoute = isListRoot(root);

  // ---- leitura ----
  if (verb === 'get') {
    if (listRoute) {
      const rows = entitiesOf(coll).map((e) => genRow(root, coll, e));
      const filtered = filterRows(rows as any[], req.params);
      if (hasMeta(root)) {
        const { slice, meta } = paginate(filtered, req.params);
        return { status: 200, data: envelope(root, slice, meta) };
      }
      return { status: 200, data: envelope(root, filtered, undefined) };
    }
    if (id) {
      const list = entitiesOf(coll);
      const e = list.find((x) => x.id === id || String(x.i + 1) === id) ?? { i: 0, id, patch: {} };
      return { status: 200, data: envelope(root, genRow(root, coll, e), undefined) };
    }
    const d = dataOf(root);
    const one = d === undefined ? null : gen(d, '', { coll: path, noun: nounFor(path), i: 0, depth: 1 });
    return { status: 200, data: envelope(root, one, undefined) };
  }

  // ---- escrita ----
  const payload = bodyToObject(req.body);
  if (verb === 'post' && !id && !listRoute) {
    // criar registro na coleção (ou ação genérica quando a coleção não existe)
    created += 1;
    const e: Entity = { i: 1000 + created, id: uuidFor(`${coll}:new:${created}`), patch: payload };
    entitiesOf(coll).unshift(e);
    return { status: 201, data: envelope(root, genRow(root, coll, e), undefined) };
  }
  if ((verb === 'put' || verb === 'patch') && id) {
    const list = entitiesOf(coll);
    let e = list.find((x) => x.id === id || String(x.i + 1) === id);
    if (!e) {
      e = { i: 0, id, patch: {} };
      list.push(e);
    }
    e.patch = { ...e.patch, ...payload };
    return { status: 200, data: envelope(root, genRow(root, coll, e), undefined) };
  }
  if (verb === 'delete' && id) {
    const list = entitiesOf(coll);
    const at = list.findIndex((x) => x.id === id || String(x.i + 1) === id);
    if (at >= 0) list.splice(at, 1);
    return { status: 204, data: '' };
  }

  // ação genérica (ex.: ativar/inativar, exportar): sucesso com o formato esperado
  const d = dataOf(root);
  const out = d === undefined ? null : gen(d, '', { coll: path, noun: nounFor(path), i: 0, depth: 1 });
  return { status: verb === 'delete' ? 204 : 200, data: verb === 'delete' ? '' : envelope(root, out, undefined) };
}
