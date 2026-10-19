// Mocks de catálogos de REFERÊNCIA (Bancos, Estados, Cidades), alimentados por
// JSON extraído do dump (scripts/dev-mocks/extract-reference.mjs). Sem dados
// pessoais. As escritas (POST/PUT/DELETE) ficam em memória durante a sessão.

import banksRaw from '../data/reference/banks.json';
import citiesRaw from '../data/reference/cities.json';
import statesRaw from '../data/reference/states.json';
import type { MockRequest, MockRoute } from '../index';

const uuidOf = (prefix: string, id: string | number) =>
  `00000000-0000-4000-${prefix}-${String(id).padStart(12, '0')}`;

const banks = (banksRaw as any[]).map((b) => ({
  uuid: uuidOf('b001', b.id),
  code: b.code,
  name: b.name,
  info: `${b.code}-${b.name}`,
}));

const states = (statesRaw as any[]).map((s) => ({
  uuid: uuidOf('5001', s.id),
  title: s.title,
  letter: s.letter,
  iso: Number(s.iso),
  slug: String(s.title).toLowerCase().replace(/\s+/g, '-'),
  population: 0,
  _id: s.id,
}));
const stateById = new Map(states.map((s) => [s._id, s]));
const stripState = ({ _id, ...rest }: (typeof states)[number]) => rest;

const cities = (citiesRaw as any[]).map((c) => ({
  uuid: uuidOf('c001', c.id),
  title: c.title,
  slug: String(c.title).toLowerCase().replace(/\s+/g, '-'),
  iso: Number(c.iso),
  iso_ddd: c.iso_ddd ? Number(c.iso_ddd) : null,
  status: Number(c.status),
  status_label: Number(c.status) === 1 ? 'Inativa' : 'Ativa',
  population: 0,
  lat: '',
  long: '',
  income_per_capita: '',
  state: stateById.get(c.state_id) ? stripState(stateById.get(c.state_id)!) : null,
  _state_uuid: stateById.get(c.state_id)?.uuid,
}));

const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function paginate<T>(rows: T[], params: Record<string, any>, defaultPerPage = 10) {
  const page = Number(params.page) || 1;
  const perPage = Number(params.per_page) || defaultPerPage;
  return {
    body: rows.slice((page - 1) * perPage, page * perPage),
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(rows.length / perPage)),
      per_page: perPage,
      total: rows.length,
      from: rows.length ? (page - 1) * perPage + 1 : null,
      to: rows.length ? Math.min(page * perPage, rows.length) : null,
    },
  };
}

const searchBanks = ({ params }: MockRequest) => {
  const s = norm(params.search);
  return paginate(
    banks.filter((b) => !s || norm(b.name).includes(s) || b.code.includes(s)),
    params,
  );
};

export const referenceRoutes: MockRoute[] = [
  // Bancos
  { method: 'get', pattern: /^\/banks$/, handler: searchBanks },
  { method: 'get', pattern: /^\/banks\/options$/, handler: searchBanks },
  {
    method: 'get',
    pattern: /^\/banks\/([\w-]+)$/,
    handler: ({ match }) => {
      const found = banks.find((b) => b.uuid === match[1]);
      return found ? { body: found } : { status: 404, body: null };
    },
  },
  {
    method: 'post',
    pattern: /^\/banks$/,
    handler: ({ body }) => {
      const b = typeof body === 'string' ? JSON.parse(body) : body;
      const created = { uuid: uuidOf('b001', 9000 + banks.length), code: b.code, name: b.name, info: `${b.code}-${b.name}` };
      banks.unshift(created);
      return { status: 201, body: created };
    },
  },
  { method: 'delete', pattern: /^\/banks\/([\w-]+)$/, handler: ({ match }) => {
    const i = banks.findIndex((b) => b.uuid === match[1]);
    if (i >= 0) banks.splice(i, 1);
    return { status: 204 };
  } },

  // Estados
  {
    method: 'get',
    pattern: /^\/states(\/options)?$/,
    handler: ({ params }) => {
      const s = norm(params.search);
      return paginate(states.filter((x) => !s || norm(x.title).includes(s)).map(stripState), params, 100);
    },
  },

  // Cidades
  {
    method: 'get',
    pattern: /^\/cities(\/options)?$/,
    handler: ({ params }) => {
      const s = norm(params.search);
      const iso = params.iso ? Number(params.iso) : null;
      const rows = cities
        .filter(
          (c) =>
            (!s || norm(c.title).includes(s)) &&
            (!params.state_uuid || c._state_uuid === params.state_uuid) &&
            (!iso || c.iso === iso),
        )
        .map(({ _state_uuid, ...rest }) => rest);
      return paginate(rows, params, 50);
    },
  },
];
