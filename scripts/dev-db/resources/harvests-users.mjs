// Safras (com semanas) e Usuários — dados SINTÉTICOS e COM ESTADO em memória (o dump não os traz
// no formato do front). Existem para validar SALVAR, EDITAR, EXCLUIR e ATIVAR/DESATIVAR ponta a
// ponta nas telas de Safras e Usuários. Reiniciar a API de dev volta ao estado inicial.
// Nada aqui é dado real/pessoal: nomes, e-mails (`.test`) e CPFs são fictícios.
import { query } from '../lib/db.mjs';
import { KIND, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const NOW = () => new Date().toISOString();
let seq = 1000;
const newUuid = (kind) => uuidFor(kind, ++seq);
const K_HARVEST = 'f0000030';
const K_WEEK = 'f0000031';
const K_USER = 'f0000032';
const K_ROLE = 'f0000033';

const HERD_LABEL = { individual: 'Individual', lote: 'Lote' };
const COLORS = ['amarelo', 'azul-claro', 'azul-escuro', 'azul-marinho', 'branco', 'marrom', 'palha', 'preto', 'rosa'];

const fmtDate = (d) => d.toISOString().slice(0, 10);

/** Semanas de 7 dias a partir da data inicial (mesma ideia do `generateWeeks` do front). */
function makeWeeks(start, end) {
  const out = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  let n = 1;
  while (cursor <= last && n <= 60) {
    const weekEnd = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    out.push({
      uuid: newUuid(K_WEEK),
      number_week: n,
      start_date: fmtDate(cursor),
      end_date: fmtDate(weekEnd > last ? last : weekEnd),
      color: COLORS[(n - 1) % COLORS.length],
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
    n++;
  }
  return out;
}

// ── Safras ────────────────────────────────────────────────────────────────────
const harvests = [
  { description: 'Safra 2025/2026', start: '2025-09-01', end: '2026-08-31', enabled: false, herd: 'lote', m1: 9, m2: 3, evo: false },
  { description: 'Safra 2026/2027', start: '2026-09-01', end: '2027-08-31', enabled: true, herd: 'individual', m1: 9, m2: 3, evo: true },
  { description: 'Safra Verão 2026', start: '2026-10-01', end: '2027-03-31', enabled: true, herd: 'lote', m1: 10, m2: 1, evo: false },
].map((h, i) => ({
  uuid: uuidFor(K_HARVEST, i + 1),
  description: h.description,
  start_date: h.start,
  end_date: h.end,
  is_enabled: h.enabled,
  herd_control: h.herd,
  herd_control_label: HERD_LABEL[h.herd],
  first_month: h.m1,
  second_month: h.m2,
  auto_evolution: h.evo,
  weeks: makeWeeks(h.start, h.end),
  periods: [],
  created_at: '2026-01-10T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
}));

const toHarvest = (p, base = {}) => {
  const weeks = Array.isArray(p.weeks) ? p.weeks : [];
  return {
    ...base,
    description: p.description,
    start_date: p.start_date,
    end_date: p.end_date,
    is_enabled: !!p.is_enabled,
    herd_control: p.herd_control,
    herd_control_label: HERD_LABEL[p.herd_control] ?? p.herd_control,
    first_month: p.first_month ?? null,
    second_month: p.second_month ?? null,
    auto_evolution: !!p.auto_evolution,
    // upsert por number_week (como o backend real): preserva uuid de semana existente
    weeks: weeks.map((w) => {
      const old = (base.weeks ?? []).find((x) => x.number_week === w.number_week);
      return { uuid: old?.uuid ?? newUuid(K_WEEK), number_week: w.number_week, start_date: w.start_date, end_date: w.end_date, color: w.color };
    }),
    periods: [],
    updated_at: NOW(),
  };
};

const validateHarvest = (p) => {
  const errors = {};
  if (!p.description || !String(p.description).trim()) errors.description = ['A descrição é obrigatória.'];
  if (!p.start_date) errors.start_date = ['A data de início é obrigatória.'];
  if (!p.end_date) errors.end_date = ['A data de fim é obrigatória.'];
  if (p.start_date && p.end_date && p.end_date < p.start_date) errors.end_date = ['A data de fim deve ser igual ou posterior à de início.'];
  if (harvests.some((h) => h.description.toLowerCase() === String(p.description ?? '').trim().toLowerCase() && h.uuid !== p.__self))
    errors.description = ['Já existe uma safra com essa descrição.'];
  return Object.keys(errors).length ? errors : null;
};

const unprocessable = (errors) => ({ status: 422, body: null, errors });

// ── Usuários ──────────────────────────────────────────────────────────────────
const roles = ['Administrador', 'Gestor', 'Operador', 'Conferente'].map((name, i) => ({ uuid: uuidFor(K_ROLE, i + 1), name }));
const roleByUuid = (u) => roles.find((r) => r.uuid === u);

const CITY = { uuid: uuidFor(KIND.city, 1), name: 'Cidade de Teste', state: { name: 'Mato Grosso', uf: 'MT' } };
const users = [
  { name: 'Ana Teste Silva', email: 'ana.teste@exemplo.test', nif: '52998224725', phone: '65999990001', active: true, assistant: false, role: 0, last: '2026-10-26T14:20:00Z' },
  { name: 'Bruno Exemplo Costa', email: 'bruno.exemplo@exemplo.test', nif: '11144477735', phone: '65999990002', active: true, assistant: true, role: 3, last: '2026-10-20T09:05:00Z' },
  { name: 'Carla Demo Souza', email: 'carla.demo@exemplo.test', nif: '39053344705', phone: '65999990003', active: false, assistant: false, role: 2, last: null },
  { name: 'Diego Fictício Lima', email: 'diego.ficticio@exemplo.test', nif: '86288366757', phone: '65999990004', active: true, assistant: false, role: 1, last: '2026-09-30T17:40:00Z' },
].map((u, i) => ({
  uuid: uuidFor(K_USER, i + 1),
  name: u.name,
  email: u.email,
  photo: null,
  photo_url: null,
  is_active: u.active,
  is_purchasing_assistant: u.assistant,
  last_activity: u.last,
  roles: [roles[u.role]],
  // a tela exige ao menos 1 fazenda por usuário
  farm_uuids: [uuidFor(KIND.farm, 1), uuidFor(KIND.farm, 2)],
  boss_uuids: [],
  person: { uuid: uuidFor(KIND.person, 9000 + i), name: u.name, nickname: u.name.split(' ')[0], nif: u.nif, email: u.email, phone: u.phone, address: 'Rua das Flores, 100', number: null, district: null, city: CITY },
}));

const listItem = (u) => ({
  uuid: u.uuid, name: u.name, email: u.email, photo: u.photo, photo_url: u.photo_url,
  is_active: u.is_active, is_purchasing_assistant: u.is_purchasing_assistant,
  last_activity: u.last_activity, roles: u.roles.map((r) => r.name),
});

async function farmsOf(uuids) {
  const ids = uuids.map((u) => Number(String(u).match(/-(\d{12})$/)?.[1])).filter(Boolean);
  if (!ids.length) return [];
  const rows = await query('select id, description from farms where id = any($1)', [ids]);
  return rows.map((r) => ({ uuid: uuidFor(KIND.farm, r.id), description: r.description }));
}

const toDetail = async (u) => ({
  ...listItem(u),
  roles: u.roles,
  farms: await farmsOf(u.farm_uuids),
  bosses: u.boss_uuids.map((b) => users.find((x) => x.uuid === b)).filter(Boolean).map((x) => ({ uuid: x.uuid, name: x.name })),
  person: u.person,
});

const asArray = (v) => (Array.isArray(v) ? v : v === undefined || v === '' ? [] : [v]);
const truthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

function validateUser(b, self) {
  const errors = {};
  if (!b.name || !String(b.name).trim()) errors.name = ['O nome é obrigatório.'];
  if (!b.email || !/^\S+@\S+\.\S+$/.test(b.email)) errors.email = ['Informe um e-mail válido.'];
  if (users.some((u) => u.email.toLowerCase() === String(b.email ?? '').toLowerCase() && u.uuid !== self)) errors.email = ['Este e-mail já está em uso.'];
  if (!b.nif) errors.nif = ['O CPF/CNPJ é obrigatório.'];
  if (!self && !b.password) errors.password = ['A senha é obrigatória.'];
  if (asArray(b['role_uuids[]'] ?? b.role_uuids).length === 0) errors.role_uuids = ['Selecione ao menos um perfil.'];
  return Object.keys(errors).length ? errors : null;
}

function applyUser(u, b) {
  u.name = b.name;
  u.email = b.email;
  u.is_active = truthy(b.is_active);
  u.is_purchasing_assistant = truthy(b.is_purchasing_assistant);
  u.roles = asArray(b['role_uuids[]'] ?? b.role_uuids).map(roleByUuid).filter(Boolean);
  u.farm_uuids = asArray(b['farm_uuids[]'] ?? b.farm_uuids);
  u.boss_uuids = asArray(b['boss_uuids[]'] ?? b.boss_uuids).filter((x) => x !== u.uuid);
  if (truthy(b.remove_photo)) { u.photo = null; u.photo_url = null; }
  u.person = {
    ...u.person,
    name: b.name,
    nif: String(b.nif ?? '').replace(/\D/g, ''),
    email: b.contact_email || b.email,
    phone: b.phone ?? u.person?.phone ?? null,
    address: b.address ?? u.person?.address ?? null,
    nickname: b.nickname ?? u.person?.nickname ?? null,
    city: b.city_uuid ? { ...CITY, uuid: b.city_uuid } : u.person?.city ?? CITY,
  };
}

const find = (list, uuid) => list.find((x) => x.uuid === uuid);
const notFound = () => ({ status: 404, body: null, message: 'Registro não encontrado.' });

export const harvestUserRoutes = [
  // ── Safras ──
  {
    method: 'get',
    pattern: /^\/harvests$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const term = String(q.search ?? '').trim().toLowerCase();
      let list = harvests.filter((h) => !term || h.description.toLowerCase().includes(term));
      if (q.is_enabled === 'true' || q.is_enabled === 'false') list = list.filter((h) => h.is_enabled === (q.is_enabled === 'true'));
      list = [...list].sort((a, b) => b.start_date.localeCompare(a.start_date));
      return { body: list.slice(p.offset, p.offset + p.limit), meta: pageMeta(p, list.length) };
    },
  },
  { method: 'get', pattern: /^\/harvests\/active$/, handler: async () => ({ body: harvests.filter((h) => h.is_enabled) }) },
  { method: 'get', pattern: /^\/harvests\/([\w-]+)$/, handler: async ({ match }) => { const h = find(harvests, match[1]); return h ? { body: h } : notFound(); } },
  {
    method: 'post',
    pattern: /^\/harvests$/,
    handler: async ({ body }) => {
      const errors = validateHarvest(body);
      if (errors) return unprocessable(errors);
      const h = { uuid: newUuid(K_HARVEST), created_at: NOW(), ...toHarvest(body) };
      harvests.push(h);
      return { status: 201, body: h };
    },
  },
  {
    method: 'put',
    pattern: /^\/harvests\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const i = harvests.findIndex((h) => h.uuid === match[1]);
      if (i < 0) return notFound();
      const errors = validateHarvest({ ...body, __self: match[1] });
      if (errors) return unprocessable(errors);
      harvests[i] = { ...harvests[i], ...toHarvest(body, harvests[i]) };
      return { body: harvests[i] };
    },
  },
  {
    method: 'delete',
    pattern: /^\/harvests\/([\w-]+)$/,
    handler: async ({ match }) => {
      const i = harvests.findIndex((h) => h.uuid === match[1]);
      if (i < 0) return notFound();
      harvests.splice(i, 1);
      return { status: 204 };
    },
  },

  // ── Perfis ──
  {
    method: 'get',
    pattern: /^\/roles$/,
    handler: async ({ query: q }) => {
      const p = paging(q, 50);
      const term = String(q.search ?? '').trim().toLowerCase();
      const list = roles.filter((r) => !term || r.name.toLowerCase().includes(term));
      return { body: list.slice(p.offset, p.offset + p.limit), meta: pageMeta(p, list.length) };
    },
  },

  // ── Usuários ──
  {
    method: 'get',
    pattern: /^\/users\/boss-options$/,
    handler: async ({ query: q }) => ({ body: users.filter((u) => u.uuid !== q.exclude_uuid && u.is_active).map((u) => ({ uuid: u.uuid, name: u.name })) }),
  },
  {
    method: 'get',
    pattern: /^\/users$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const term = String(q.search ?? '').trim().toLowerCase();
      let list = users.filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
      if (q.role_uuid) list = list.filter((u) => u.roles.some((r) => r.uuid === q.role_uuid));
      if (q.is_active === 'true' || q.is_active === 'false') list = list.filter((u) => u.is_active === (q.is_active === 'true'));
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      return { body: list.slice(p.offset, p.offset + p.limit).map(listItem), meta: pageMeta(p, list.length) };
    },
  },
  { method: 'get', pattern: /^\/users\/([\w-]+)$/, handler: async ({ match }) => { const u = find(users, match[1]); return u ? { body: await toDetail(u) } : notFound(); } },
  {
    method: 'post',
    pattern: /^\/users$/,
    handler: async ({ body }) => {
      const errors = validateUser(body, null);
      if (errors) return unprocessable(errors);
      const u = { uuid: newUuid(K_USER), photo: null, photo_url: null, last_activity: null, roles: [], farm_uuids: [], boss_uuids: [], person: { uuid: newUuid(KIND.person) } };
      applyUser(u, body);
      users.push(u);
      return { status: 201, body: await toDetail(u) };
    },
  },
  // atualização = POST com `_method=PUT` (multipart; o front nunca usa PUT com FormData)
  {
    method: 'post',
    pattern: /^\/users\/([\w-]+)$/,
    handler: async ({ match, body }) => {
      const u = find(users, match[1]);
      if (!u) return notFound();
      const errors = validateUser(body, u.uuid);
      if (errors) return unprocessable(errors);
      applyUser(u, body);
      return { body: await toDetail(u) };
    },
  },
  {
    method: 'patch',
    pattern: /^\/users\/([\w-]+)\/status$/,
    handler: async ({ match, body }) => {
      const u = find(users, match[1]);
      if (!u) return notFound();
      u.is_active = truthy(body.is_active);
      return { body: listItem(u) };
    },
  },
  { method: 'post', pattern: /^\/users\/([\w-]+)\/reset-password$/, handler: async () => ({ body: null }) },
  {
    method: 'delete',
    pattern: /^\/users\/([\w-]+)$/,
    handler: async ({ match }) => {
      const i = users.findIndex((u) => u.uuid === match[1]);
      if (i < 0) return notFound();
      users.splice(i, 1);
      return { status: 204 };
    },
  },
];
