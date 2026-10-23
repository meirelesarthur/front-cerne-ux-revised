// /farms — fazendas do contratante em escopo (DEV_TENANT_ID).
import { TENANT_ID, query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const EXPLORATION = {
  1: 'Exploração individual (Imóvel próprio)',
  2: 'Condomínio',
  3: 'Imóvel arrendado',
  4: 'Parceria',
  5: 'Comodato',
  6: 'Outros',
};

const SELECT = `
  select f.*, c.title as city_title, s.letter as state_letter, c.id as c_id,
         co.id as co_id, co.nome as co_nome, co.codigo as co_codigo
  from farms f
  left join cities c on c.id = f.city_id
  left join states s on s.id = c.state_id
  left join countries co on co.id = f.country_id`;

const toFarm = (f) => ({
  uuid: uuidFor(KIND.farm, f.id),
  description: f.description,
  descriptive: f.descriptive ?? f.description,
  total_area: f.total_area === null ? 0 : Number(f.total_area),
  value_ha: f.value_ha === null ? 0 : Number(f.value_ha),
  car: f.car,
  city_id: f.city_id,
  town: f.c_id ? { uuid: uuidFor(KIND.city, f.c_id), name: f.city_title, state: f.state_letter } : null,
  note: f.note,
  is_enabled: Boolean(f.is_enabled),
  coordinates: f.coordinates,
  logo: null,
  logo_url: null,
  rate: f.rate,
  latitude: f.latitude,
  longitude: f.longitude,
  phone: f.phone ?? '',
  nif: f.nif,
  state_registration: f.state_registration,
  control_supplies_stock: Boolean(f.control_supplies_stock),
  cost_processing_date: f.cost_processing_date ?? 1,
  cafir: f.cafir,
  caepf: f.caepf,
  district: f.district,
  zip_code: f.zip_code,
  number: f.number,
  exploration_type: f.exploration_type
    ? { value: Number(f.exploration_type), label: EXPLORATION[f.exploration_type] ?? 'Outros' }
    : null,
  country: f.co_id ? { uuid: uuidFor(KIND.country, f.co_id), nome: f.co_nome, codigo: f.co_codigo } : null,
  coin: f.coin ?? 'BRL',
  nirf: f.nirf,
  ccir: f.ccir,
  use_cash_book: Boolean(f.use_cash_book),
  created_at: f.created_at,
  updated_at: f.updated_at,
  centers: [],
  areas: [],
});

export const farmRoutes = [
  {
    method: 'get',
    pattern: /^\/farms$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const where = ['f.tenant_id = $1'];
      const args = [TENANT_ID];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`f.description ilike $${args.length}`);
      }
      if (q.is_enabled) {
        args.push(q.is_enabled === 'true');
        where.push(`f.is_enabled = $${args.length}`);
      }
      const [{ total }] = await query(`select count(*)::int as total from farms f where ${where.join(' and ')}`, args);
      const rows = await query(
        `${SELECT} where ${where.join(' and ')} order by f.description limit ${p.limit} offset ${p.offset}`,
        args,
      );
      return { body: rows.map(toFarm), meta: pageMeta(p, total) };
    },
  },
  {
    method: 'get',
    pattern: /^\/farms\/current-tenant$/,
    handler: async () => {
      const rows = await query(`${SELECT} where f.tenant_id = $1 order by f.description`, [TENANT_ID]);
      return { body: rows.map(toFarm), meta: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/farms\/([\w-]+)$/,
    handler: async ({ match }) => {
      const rows = await query(`${SELECT} where f.id = $1`, [idFrom(match[1])]);
      return rows[0] ? { body: toFarm(rows[0]) } : { status: 404, body: null };
    },
  },
];
