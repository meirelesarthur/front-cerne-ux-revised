// ESCRITA SIMULADA (em memória) sobre o dump — Bancos, Plano de Contas e Embalagens.
// O dump continua intacto: criações, edições e exclusões ficam numa "camada" (overlay) aplicada às
// leituras e valem até reiniciar a API. Cidades não tem tela de escrita no front (só consulta).
// Dados criados aqui são de teste; nada vai ao banco nem ao git.
import { TENANT_ID, query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';
import { catalogRoutes } from './catalog.mjs';
import { financeRoutes } from './finance.mjs';
import { productRoutes } from './products.mjs';

const NOW = () => new Date().toISOString();
const unprocessable = (errors) => ({ status: 422, body: null, errors });
const notFound = () => ({ status: 404, body: null, message: 'Registro não encontrado.' });

const origin = (routes, method, source) => {
  const r = routes.find((x) => x.method === method && x.pattern.source === source);
  if (!r) throw new Error(`rota original não encontrada: ${method} ${source}`);
  return r.handler;
};

/** Camada de escrita de um recurso. Ids novos partem de 900001 (não colidem com o dump). */
const makeStore = (kind) => ({
  kind,
  created: new Map(),
  patches: new Map(),
  deleted: new Set(),
  seq: 900000,
  nextId() {
    this.seq += 1;
    return this.seq;
  },
});

const idOfUuid = (uuid) => idFrom(uuid);
const withPatches = (st, item) => ({ ...item, ...(st.patches.get(idOfUuid(item.uuid)) ?? {}) });
const visible = (st, items) => items.filter((i) => !st.deleted.has(idOfUuid(i.uuid))).map((i) => withPatches(st, i));

const contains = (value, term) => String(value ?? '').toLowerCase().includes(String(term).trim().toLowerCase());

/** Leitura paginada: dump (+ edições, − exclusões) com os criados no topo da 1ª página. */
const wrapList = (orig, st, matchesCreated) => async (ctx) => {
  const out = await orig(ctx);
  let body = visible(st, out.body);
  let meta = out.meta;
  const term = ctx.query.search;
  const extra = [...st.created.values()].filter((c) => !st.deleted.has(idOfUuid(c.uuid)) && (!term || matchesCreated(c, term))).map((c) => withPatches(st, c));
  if (meta) {
    const page = paging(ctx.query);
    if (page.page === 1) body = [...extra, ...body];
    meta = pageMeta(page, Math.max(0, meta.total + extra.length - st.deleted.size));
  } else {
    body = [...extra, ...body];
  }
  return { ...out, body, meta };
};

const wrapDetail = (orig, st, matchUuid = (m) => m[1]) => async (ctx) => {
  const uuid = matchUuid(ctx.match);
  const id = idOfUuid(uuid);
  if (st.deleted.has(id)) return notFound();
  if (st.created.has(id)) return { body: withPatches(st, st.created.get(id)) };
  const out = await orig(ctx);
  if (!out.body) return out;
  return { ...out, body: withPatches(st, out.body) };
};

// ── Bancos ────────────────────────────────────────────────────────────────────
const banks = makeStore(KIND.bank);
const toBank = (code, name, id) => ({ uuid: uuidFor(KIND.bank, id), code, name, info: `${code}-${name}` });

async function validateBank(b, selfId) {
  const errors = {};
  if (!String(b.code ?? '').trim()) errors.code = ['O código é obrigatório.'];
  if (!String(b.name ?? '').trim()) errors.name = ['O nome é obrigatório.'];
  if (String(b.code ?? '').length > 10) errors.code = ['O código deve ter no máximo 10 caracteres.'];
  const code = String(b.code ?? '').trim();
  if (code) {
    const dump = await query('select id from banks where code = $1', [code]);
    const dupDump = dump.some((r) => r.id !== selfId && !banks.deleted.has(r.id) && !(banks.patches.get(r.id)?.code && banks.patches.get(r.id).code !== code));
    const dupNew = [...banks.created.entries()].some(([id, v]) => id !== selfId && withPatches(banks, v).code === code);
    if (dupDump || dupNew) errors.code = ['Já existe um banco com esse código.'];
  }
  return Object.keys(errors).length ? errors : null;
}

const bankList = origin(catalogRoutes, 'get', '^\\/banks(\\/options)?$');
const bankDetail = origin(catalogRoutes, 'get', '^\\/banks\\/([\\w-]+)$');

const bankRoutes = [
  { method: 'get', pattern: /^\/banks(\/options)?$/, handler: wrapList(bankList, banks, (c, t) => contains(c.name, t) || contains(c.code, t)) },
  { method: 'get', pattern: /^\/banks\/([\w-]+)$/, handler: wrapDetail(bankDetail, banks) },
  {
    method: 'post',
    pattern: /^\/banks$/,
    handler: async ({ body }) => {
      const errors = await validateBank(body, null);
      if (errors) return unprocessable(errors);
      const id = banks.nextId();
      const item = toBank(String(body.code).trim(), String(body.name).trim(), id);
      banks.created.set(id, item);
      return { status: 201, body: item };
    },
  },
  {
    method: 'put',
    pattern: /^\/banks\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const id = idFrom(match[1]);
      if (banks.deleted.has(id)) return notFound();
      const errors = await validateBank(body, id);
      if (errors) return unprocessable(errors);
      const code = String(body.code).trim();
      const name = String(body.name).trim();
      if (banks.created.has(id)) banks.created.set(id, toBank(code, name, id));
      else {
        const rows = await query('select id from banks where id = $1', [id]);
        if (!rows[0]) return notFound();
        banks.patches.set(id, { code, name, info: `${code}-${name}` });
      }
      return { body: toBank(code, name, id) };
    },
  },
  {
    method: 'delete',
    pattern: /^\/banks\/([\w-]+)$/,
    handler: async ({ match }) => {
      const id = idFrom(match[1]);
      if (banks.created.has(id)) banks.created.delete(id);
      else banks.deleted.add(id);
      return { status: 204 };
    },
  },
];

// ── Plano de contas ───────────────────────────────────────────────────────────
const plans = makeStore(KIND.planAccount);
const CONDITION_PLAN = { 1: 'Devedor', 2: 'Credor', 3: 'Ambos' };
const CLASS_LABEL = { 1: 'Sintético', 2: 'Analítico' };

const planAccountList = origin(financeRoutes, 'get', '^\\/plan-accounts$');
const planAccountDetail = origin(financeRoutes, 'get', '^\\/plan-accounts\\/([\\w-]+)$');
const planAccountOptions = origin(financeRoutes, 'get', '^\\/plan-accounts\\/options(?:\\/global)?$');

async function parentOf(uuid) {
  if (!uuid) return null;
  const id = idFrom(uuid);
  if (plans.created.has(id)) {
    const c = withPatches(plans, plans.created.get(id));
    return { id, code: c.code, description: c.description, class: c.class };
  }
  const [r] = await query('select id, code, description, class from plan_accounts where id = $1', [id]);
  return r ? { id: r.id, code: r.code, description: r.description, class: Number(r.class) } : null;
}

async function nextPlanCode(parent) {
  if (parent) {
    const [{ n }] = await query('select count(*)::int as n from plan_accounts where parent_id = $1', [parent.id]);
    const added = [...plans.created.values()].filter((c) => c.parent?.uuid === uuidFor(KIND.planAccount, parent.id)).length;
    return `${parent.code}.${n + added + 1}`;
  }
  const [{ n }] = await query('select count(*)::int as n from plan_accounts where parent_id is null and (tenant_id = $1 or tenant_id is null)', [TENANT_ID]);
  const added = [...plans.created.values()].filter((c) => !c.parent).length;
  return String(n + added + 1);
}

async function validatePlan(b) {
  const errors = {};
  const d = String(b.description ?? '').trim();
  if (!d) errors.description = ['A descrição é obrigatória.'];
  if (d.length > 150) errors.description = ['A descrição deve ter no máximo 150 caracteres.'];
  if (![1, 2, 3].includes(Number(b.condition))) errors.condition = ['Selecione a condição.'];
  if (b.parent_uuid) {
    const p = await parentOf(b.parent_uuid);
    if (!p) errors.parent_uuid = ['Conta-pai não encontrada.'];
    else if (p.class !== 1) errors.parent_uuid = ['A conta-pai deve ser sintética.'];
  }
  return Object.keys(errors).length ? errors : null;
}

const planCreatedMatches = (c, t) => contains(c.description, t) || contains(c.code, t);

const planRoutes = [
  {
    method: 'get',
    pattern: /^\/plan-accounts\/code-preview$/,
    handler: async ({ query: q }) => {
      const parent = await parentOf(q.parent_uuid);
      return { body: { code: await nextPlanCode(parent), class: parent ? 2 : 1, class_label: parent ? 'Analítico' : 'Sintético' } };
    },
  },
  { method: 'get', pattern: /^\/plan-accounts$/, handler: wrapList(planAccountList, plans, planCreatedMatches) },
  { method: 'get', pattern: /^\/plan-accounts\/options(?:\/global)?$/, handler: wrapList(planAccountOptions, plans, planCreatedMatches) },
  { method: 'get', pattern: /^\/plan-accounts\/([\w-]+)$/, handler: wrapDetail(planAccountDetail, plans) },
  {
    method: 'post',
    pattern: /^\/plan-accounts$/,
    handler: async ({ body }) => {
      const errors = await validatePlan(body);
      if (errors) return unprocessable(errors);
      const parent = await parentOf(body.parent_uuid);
      const id = plans.nextId();
      const cls = parent ? 2 : 1;
      const item = {
        uuid: uuidFor(KIND.planAccount, id),
        code: await nextPlanCode(parent),
        description: String(body.description).trim(),
        condition: Number(body.condition),
        condition_label: CONDITION_PLAN[Number(body.condition)],
        class: cls,
        class_label: CLASS_LABEL[cls],
        type: body.type ?? null,
        type_label: body.type === 1 ? 'CAPEX' : body.type === 2 ? 'OPEX' : null,
        is_enabled: body.is_enabled !== false,
        parent: parent ? { uuid: uuidFor(KIND.planAccount, parent.id), code: parent.code, description: parent.description, is_root: false } : null,
        categories: [],
        apportionments: [],
        created_at: NOW(),
        updated_at: NOW(),
      };
      plans.created.set(id, item);
      return { status: 201, body: item };
    },
  },
  {
    method: 'put',
    pattern: /^\/plan-accounts\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const id = idFrom(match[1]);
      if (plans.deleted.has(id)) return notFound();
      const errors = await validatePlan({ ...body, parent_uuid: null });
      if (errors) return unprocessable(errors);
      const patch = {
        description: String(body.description).trim(),
        condition: Number(body.condition),
        condition_label: CONDITION_PLAN[Number(body.condition)],
        is_enabled: body.is_enabled !== false,
        type: body.type ?? null,
        type_label: body.type === 1 ? 'CAPEX' : body.type === 2 ? 'OPEX' : null,
        updated_at: NOW(),
      };
      if (plans.created.has(id)) plans.created.set(id, { ...plans.created.get(id), ...patch });
      else {
        const rows = await query('select id from plan_accounts where id = $1', [id]);
        if (!rows[0]) return notFound();
        plans.patches.set(id, { ...(plans.patches.get(id) ?? {}), ...patch });
      }
      const out = await wrapDetail(planAccountDetail, plans)({ match });
      return out;
    },
  },
  {
    method: 'delete',
    pattern: /^\/plan-accounts\/([\w-]+)$/,
    handler: async ({ match }) => {
      const id = idFrom(match[1]);
      // não exclui conta com filhas (regra do backend real)
      const [{ n }] = await query('select count(*)::int as n from plan_accounts where parent_id = $1', [id]);
      const kids = [...plans.created.values()].filter((c) => c.parent?.uuid === match[1]).length;
      if (n + kids > 0) return unprocessable({ uuid: ['Não é possível excluir uma conta que possui contas vinculadas.'] });
      if (plans.created.has(id)) plans.created.delete(id);
      else plans.deleted.add(id);
      return { status: 204 };
    },
  },
];

// ── Centros de custo ──────────────────────────────────────────────────────────
const costs = makeStore(KIND.costCenter);
const CONDITION_COST = { 1: 'Despesa', 2: 'Receita', 3: 'Ambos' };
const TYPE_COST = { productive: 'Produtivo', apportioned: 'Rateado' };

const costList = origin(financeRoutes, 'get', '^\\/cost-centers$');
const costDetail = origin(financeRoutes, 'get', '^\\/cost-centers\\/([\\w-]+)$');
const costOptions = origin(financeRoutes, 'get', '^\\/cost-centers\\/options(?:\\/global)?$');

async function costParentOf(uuid) {
  if (!uuid) return null;
  const id = idFrom(uuid);
  if (costs.created.has(id)) {
    const c = withPatches(costs, costs.created.get(id));
    return { id, code: c.code, description: c.description, class: c.class };
  }
  const [r] = await query('select id, code, description, class from cost_centers where id = $1', [id]);
  return r ? { id: r.id, code: r.code, description: r.description, class: Number(r.class) } : null;
}

async function nextCostCode(parent) {
  if (parent) {
    const [{ n }] = await query('select count(*)::int as n from cost_centers where parent_id = $1', [parent.id]);
    const added = [...costs.created.values()].filter((c) => c.parent?.uuid === uuidFor(KIND.costCenter, parent.id)).length;
    return `${parent.code}.${n + added + 1}`;
  }
  const [{ n }] = await query('select count(*)::int as n from cost_centers where parent_id is null and (tenant_id = $1 or tenant_id is null)', [TENANT_ID]);
  return String(n + [...costs.created.values()].filter((c) => !c.parent).length + 1);
}

async function validateCost(b, isCreate) {
  const errors = {};
  const d = String(b.description ?? '').trim();
  if (!d) errors.description = ['A descrição é obrigatória.'];
  if (d.length > 40) errors.description = ['A descrição deve ter no máximo 40 caracteres.'];
  if (![1, 2, 3].includes(Number(b.condition))) errors.condition = ['Selecione a condição.'];
  if (!['productive', 'apportioned'].includes(b.type)) errors.type = ['Selecione o tipo.'];
  if (b.type === 'apportioned') {
    const rows = Array.isArray(b.apportionments) ? b.apportionments : [];
    if (!rows.length) errors.apportionments = ['Informe ao menos um centro de rateio.'];
    else if (rows.some((r) => !r.cost_center_uuid || !(Number(r.percentage) >= 0))) errors.apportionments = ['Preencha o centro e o percentual de cada linha.'];
  }
  if (isCreate && b.parent_uuid) {
    const p = await costParentOf(b.parent_uuid);
    if (!p) errors.parent_uuid = ['Antecessor não encontrado.'];
    else if (p.class !== 1) errors.parent_uuid = ['O antecessor deve ser sintético.'];
  }
  return Object.keys(errors).length ? errors : null;
}

async function apportionmentRows(rows) {
  const out = [];
  for (const r of rows ?? []) {
    const p = await costParentOf(r.cost_center_uuid);
    out.push({ uuid: r.cost_center_uuid, code: p?.code ?? '', description: p?.description ?? '', percentage: Number(r.percentage) });
  }
  return out;
}

const costFields = async (b) => ({
  description: String(b.description).trim(),
  condition: Number(b.condition),
  condition_label: CONDITION_COST[Number(b.condition)],
  type: b.type,
  type_label: TYPE_COST[b.type],
  is_enabled: b.is_enabled !== false,
  allow_pointing: !!b.allow_pointing,
  apportionments: b.type === 'apportioned' ? await apportionmentRows(b.apportionments) : [],
  categories: (b.category_uuids ?? []).map((uuid) => ({ uuid })),
  updated_at: NOW(),
});

const costCreatedMatches = (c, t) => contains(c.description, t) || contains(c.code, t);

const costRoutes = [
  { method: 'get', pattern: /^\/cost-centers$/, handler: wrapList(costList, costs, costCreatedMatches) },
  { method: 'get', pattern: /^\/cost-centers\/options(?:\/global)?$/, handler: wrapList(costOptions, costs, costCreatedMatches) },
  { method: 'get', pattern: /^\/cost-centers\/([\w-]+)$/, handler: wrapDetail(costDetail, costs) },
  {
    method: 'post',
    pattern: /^\/cost-centers$/,
    handler: async ({ body }) => {
      const errors = await validateCost(body, true);
      if (errors) return unprocessable(errors);
      const parent = await costParentOf(body.parent_uuid);
      const id = costs.nextId();
      const cls = parent ? 2 : 1;
      const item = {
        uuid: uuidFor(KIND.costCenter, id),
        code: await nextCostCode(parent),
        ...(await costFields(body)),
        class: cls,
        class_label: CLASS_LABEL[cls],
        can_edit: true,
        can_delete: true,
        can_create_descendant: cls === 1,
        parent: parent ? { uuid: uuidFor(KIND.costCenter, parent.id), code: parent.code, description: parent.description, is_root: false } : null,
        created_at: NOW(),
      };
      costs.created.set(id, item);
      return { status: 201, body: item };
    },
  },
  {
    method: 'put',
    pattern: /^\/cost-centers\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const id = idFrom(match[1]);
      if (costs.deleted.has(id)) return notFound();
      const errors = await validateCost(body, false);
      if (errors) return unprocessable(errors);
      const patch = await costFields(body);
      if (costs.created.has(id)) costs.created.set(id, { ...costs.created.get(id), ...patch });
      else {
        const rows = await query('select id from cost_centers where id = $1', [id]);
        if (!rows[0]) return notFound();
        costs.patches.set(id, { ...(costs.patches.get(id) ?? {}), ...patch });
      }
      return wrapDetail(costDetail, costs)({ match });
    },
  },
  {
    method: 'delete',
    pattern: /^\/cost-centers\/([\w-]+)$/,
    handler: async ({ match }) => {
      const id = idFrom(match[1]);
      const [{ n }] = await query('select count(*)::int as n from cost_centers where parent_id = $1', [id]);
      const kids = [...costs.created.values()].filter((c) => c.parent?.uuid === match[1]).length;
      if (n + kids > 0) return unprocessable({ uuid: ['Não é possível excluir um centro que possui centros vinculados.'] });
      if (costs.created.has(id)) costs.created.delete(id);
      else costs.deleted.add(id);
      return { status: 204 };
    },
  },
];

// ── Embalagens (+ unidades de medida para o seletor) ───────────────────────────
const packs = makeStore(KIND.package);

async function measurementName(uuid) {
  const [m] = await query('select id, name from measurements where id = $1', [idFrom(uuid)]);
  return m ? { id: m.id, name: m.name } : null;
}

const toPack = (r) => ({
  uuid: uuidFor(KIND.package, r.id),
  description: r.description,
  size: r.size === null ? 0 : Number(r.size),
  measurement_uuid: r.measurement_id ? uuidFor(KIND.measurement, r.measurement_id) : null,
  measurement_name: r.measurement_name ?? null,
  created_at: r.created_at,
  updated_at: r.updated_at,
});

const PACK_SELECT = `select k.*, m.name as measurement_name from packages k left join measurements m on m.id = k.measurement_id`;

async function packList({ query: q }) {
  const p = paging(q);
  const args = [TENANT_ID];
  const where = ['k.tenant_id = $1'];
  if (q.search) {
    args.push(norm(q.search));
    where.push(`k.description ilike $${args.length}`);
  }
  if (q.measurement_uuid) {
    args.push(idFrom(q.measurement_uuid));
    where.push(`k.measurement_id = $${args.length}`);
  }
  const [{ total }] = await query(`select count(*)::int as total from packages k where ${where.join(' and ')}`, args);
  const rows = await query(`${PACK_SELECT} where ${where.join(' and ')} order by k.description limit ${p.limit} offset ${p.offset}`, args);
  return { body: rows.map(toPack), meta: pageMeta(p, total) };
}

async function packDetail({ match }) {
  const rows = await query(`${PACK_SELECT} where k.id = $1`, [idFrom(match[1])]);
  return rows[0] ? { body: toPack(rows[0]) } : notFound();
}

async function validatePack(b) {
  const errors = {};
  if (!String(b.description ?? '').trim()) errors.description = ['A descrição é obrigatória.'];
  if (!(Number(b.size) > 0)) errors.size = ['A quantidade deve ser maior que zero.'];
  if (!b.measurement_uuid) errors.measurement_uuid = ['Selecione a unidade de medida.'];
  else if (!(await measurementName(b.measurement_uuid))) errors.measurement_uuid = ['Unidade de medida não encontrada.'];
  return Object.keys(errors).length ? errors : null;
}

const packRoutes = [
  { method: 'get', pattern: /^\/product-packages$/, handler: wrapList(packList, packs, (c, t) => contains(c.description, t)) },
  {
    method: 'get',
    pattern: /^\/product-packages\/options$/,
    handler: async ({ query: q }) => {
      const rows = await query(`${PACK_SELECT} where k.tenant_id = $1 order by k.description limit 300`, [TENANT_ID]);
      const items = [...[...packs.created.values()], ...visible(packs, rows.map(toPack))];
      return { body: items.filter((i) => !q.search || contains(i.description, q.search)).map((i) => ({ uuid: i.uuid, description: i.description, size: i.size, measurement_name: i.measurement_name })), meta: null };
    },
  },
  { method: 'get', pattern: /^\/product-packages\/([\w-]+)$/, handler: wrapDetail(packDetail, packs) },
  {
    method: 'post',
    pattern: /^\/product-packages$/,
    handler: async ({ body }) => {
      const errors = await validatePack(body);
      if (errors) return unprocessable(errors);
      const m = await measurementName(body.measurement_uuid);
      const id = packs.nextId();
      const item = toPack({ id, description: String(body.description).trim(), size: Number(body.size), measurement_id: m.id, measurement_name: m.name, created_at: NOW(), updated_at: NOW() });
      packs.created.set(id, item);
      return { status: 201, body: item };
    },
  },
  {
    method: 'put',
    pattern: /^\/product-packages\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const id = idFrom(match[1]);
      if (packs.deleted.has(id)) return notFound();
      const errors = await validatePack(body);
      if (errors) return unprocessable(errors);
      const m = await measurementName(body.measurement_uuid);
      const patch = { description: String(body.description).trim(), size: Number(body.size), measurement_uuid: uuidFor(KIND.measurement, m.id), measurement_name: m.name, updated_at: NOW() };
      if (packs.created.has(id)) packs.created.set(id, { ...packs.created.get(id), ...patch });
      else {
        const rows = await query('select id from packages where id = $1', [id]);
        if (!rows[0]) return notFound();
        packs.patches.set(id, { ...(packs.patches.get(id) ?? {}), ...patch });
      }
      return wrapDetail(packDetail, packs)({ match });
    },
  },
  {
    method: 'delete',
    pattern: /^\/product-packages\/([\w-]+)$/,
    handler: async ({ match }) => {
      const id = idFrom(match[1]);
      if (packs.created.has(id)) packs.created.delete(id);
      else packs.deleted.add(id);
      return { status: 204 };
    },
  },
  // unidades de medida (seletor da embalagem e do produto)
  {
    method: 'get',
    pattern: /^\/measurements\/options$/,
    handler: async ({ query: q }) => {
      const args = [];
      let where = 'true';
      if (q.search) {
        args.push(norm(q.search));
        where = '(name ilike $1 or description ilike $1)';
      }
      const rows = await query(`select * from measurements where ${where} order by name limit 100`, args);
      return { body: rows.map((m) => ({ uuid: uuidFor(KIND.measurement, m.id), name: m.name, description: m.description, label: `${m.name} — ${m.description ?? ''}`.replace(/ — $/, '') })), meta: null };
    },
  },
];

export const writeRoutes = [...bankRoutes, ...planRoutes, ...costRoutes, ...packRoutes];
