// /people — pessoas vinculadas ao contratante (fornecedor, cliente ou proprietário).
import { TENANT_ID, query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const SCOPE = `p.id in (
  select pr.person_id from providers pr join provider_tenant pt on pt.provider_id = pr.id where pt.tenant_id = $1
  union select cl.person_id from clients cl join client_tenant ct on ct.client_id = cl.id where ct.tenant_id = $1
  union select pp.person_id from proprietaries pp join proprietary_tenant pt2 on pt2.proprietary_id = pp.id where pt2.tenant_id = $1
)`;

const SELECT = `select p.*, c.id as c_id, c.title as city_title, s.title as state_title, s.letter as state_letter
  from people p left join cities c on c.id = p.city_id left join states s on s.id = c.state_id`;

const toPerson = (p) => ({
  uuid: uuidFor(KIND.person, p.id),
  name: p.name,
  nickname: p.nickname ?? '',
  nif: p.nif ?? '',
  email: p.email,
  phone: p.phone,
  address: p.address,
  number: p.number,
  district: p.district,
  zip_code: p.zip_code,
  city: p.c_id
    ? { uuid: uuidFor(KIND.city, p.c_id), name: p.city_title, state: { name: p.state_title, uf: p.state_letter } }
    : null,
});

export const peopleRoutes = [
  {
    method: 'get',
    pattern: /^\/people$/,
    handler: async ({ query: q }) => {
      const pg = paging(q);
      const where = [SCOPE];
      const args = [TENANT_ID];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`(p.name ilike $${args.length} or p.nickname ilike $${args.length} or p.nif ilike $${args.length})`);
      }
      const [{ total }] = await query(`select count(*)::int as total from people p where ${where.join(' and ')}`, args);
      const rows = await query(
        `${SELECT} where ${where.join(' and ')} order by p.name limit ${pg.limit} offset ${pg.offset}`,
        args,
      );
      return { body: rows.map(toPerson), meta: pageMeta(pg, total) };
    },
  },
  {
    method: 'get',
    pattern: /^\/people\/by-nif\/([\w.\-/%]+)$/,
    handler: async ({ match }) => {
      const rows = await query(`${SELECT} where p.nif = $1 limit 1`, [decodeURIComponent(match[1])]);
      return rows[0] ? { body: toPerson(rows[0]) } : { status: 404, body: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/people\/([\w-]+)$/,
    handler: async ({ match }) => {
      const rows = await query(`${SELECT} where p.id = $1`, [idFrom(match[1])]);
      return rows[0] ? { body: toPerson(rows[0]) } : { status: 404, body: null };
    },
  },
];
