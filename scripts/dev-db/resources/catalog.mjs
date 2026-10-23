// Catálogos públicos: bancos, estados, cidades.
import { query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const toBank = (b) => ({ uuid: uuidFor(KIND.bank, b.id), code: b.code, name: b.name, info: `${b.code}-${b.name}` });
const toState = (s) => ({
  uuid: uuidFor(KIND.state, s.id),
  title: s.title,
  letter: s.letter,
  iso: Number(s.iso),
  slug: s.slug,
  population: s.population ?? 0,
});
const toCity = (c) => ({
  uuid: uuidFor(KIND.city, c.id),
  title: c.title,
  slug: c.slug,
  iso: Number(c.iso),
  iso_ddd: c.iso_ddd ? Number(c.iso_ddd) : null,
  status: c.status === null ? null : Number(c.status),
  status_label: Number(c.status) === 1 ? 'Inativa' : 'Ativa',
  population: c.population ?? 0,
  lat: c.lat ?? '',
  long: c.long ?? '',
  income_per_capita: c.income_per_capita ?? '',
  state: c.s_id
    ? { uuid: uuidFor(KIND.state, c.s_id), title: c.s_title, letter: c.s_letter, iso: Number(c.s_iso), slug: c.s_slug, population: 0 }
    : null,
});

const banks = async ({ query: q }) => {
  const p = paging(q);
  const args = [];
  let where = 'true';
  if (q.search) {
    args.push(norm(q.search));
    where = '(name ilike $1 or code ilike $1)';
  }
  const [{ total }] = await query(`select count(*)::int as total from banks where ${where}`, args);
  const rows = await query(`select * from banks where ${where} order by code limit ${p.limit} offset ${p.offset}`, args);
  return { body: rows.map(toBank), meta: pageMeta(p, total) };
};

export const catalogRoutes = [
  { method: 'get', pattern: /^\/banks(\/options)?$/, handler: banks },
  {
    method: 'get',
    pattern: /^\/banks\/([\w-]+)$/,
    handler: async ({ match }) => {
      const rows = await query('select * from banks where id = $1', [idFrom(match[1])]);
      return rows[0] ? { body: toBank(rows[0]) } : { status: 404, body: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/states(\/options)?$/,
    handler: async ({ query: q }) => {
      const p = paging(q, 100);
      const args = [];
      let where = 'true';
      if (q.search) {
        args.push(norm(q.search));
        where = 'title ilike $1';
      }
      const [{ total }] = await query(`select count(*)::int as total from states where ${where}`, args);
      const rows = await query(`select * from states where ${where} order by title limit ${p.limit} offset ${p.offset}`, args);
      return { body: rows.map(toState), meta: pageMeta(p, total) };
    },
  },
  {
    method: 'get',
    pattern: /^\/cities(\/options)?$/,
    handler: async ({ query: q }) => {
      const p = paging(q, 50);
      const args = [];
      const where = ['true'];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`c.title ilike $${args.length}`);
      }
      if (q.state_uuid) {
        args.push(idFrom(q.state_uuid));
        where.push(`c.state_id = $${args.length}`);
      }
      if (q.iso) {
        args.push(String(q.iso));
        where.push(`c.iso = $${args.length}`);
      }
      const [{ total }] = await query(`select count(*)::int as total from cities c where ${where.join(' and ')}`, args);
      const rows = await query(
        `select c.*, s.id as s_id, s.title as s_title, s.letter as s_letter, s.iso as s_iso, s.slug as s_slug
         from cities c left join states s on s.id = c.state_id
         where ${where.join(' and ')} order by c.title limit ${p.limit} offset ${p.offset}`,
        args,
      );
      return { body: rows.map(toCity), meta: pageMeta(p, total) };
    },
  },
];
