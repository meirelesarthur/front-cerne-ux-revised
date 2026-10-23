// Produtos, armazéns e embalagens (escopo do contratante).
import { TENANT_ID, query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const ref = (kind, id, description) => (id ? { uuid: uuidFor(kind, id), description } : null);

const toProduct = (r) => ({
  uuid: uuidFor(KIND.product, r.id),
  code: String(r.code ?? r.id),
  description: r.description,
  group: ref(KIND.group, r.group_id, r.group_description) ?? { uuid: '', description: '' },
  category: ref(KIND.category, r.category_id, r.category_description) ?? { uuid: '', description: '' },
  kind: ref(KIND.kind, r.kind_id, r.kind_name),
  min_stock: r.min_stock === null ? null : Number(r.min_stock),
  has_lot: Boolean(r.has_lot),
  is_equipment: Boolean(r.is_equipment),
  is_enabled: Boolean(r.is_enabled),
  measurement: ref(KIND.measurement, r.measurement_id, r.measurement_description) ?? undefined,
  measurement_second: ref(KIND.measurement, r.second_measurement_id, r.second_measurement_description),
  financial_category: null,
  average_cost: r.average_cost === null ? null : Number(r.average_cost),
});

const PRODUCT_SELECT = `
  select p.*, g.description as group_description, c.description as category_description,
         k.name as kind_name, m.description as measurement_description,
         m2.description as second_measurement_description
  from products p
  left join group_products g on g.id = p.group_id
  left join category_products c on c.id = p.category_id
  left join kinds k on k.id = p.kind_id
  left join measurements m on m.id = p.measurement_id
  left join measurements m2 on m2.id = p.second_measurement_id`;

const WAREHOUSE_TYPE = {
  I: { slug: 'insumos', label: 'Insumos' },
  P: { slug: 'producao', label: 'Produção' },
  R: { slug: 'formulacao', label: 'Formulação' },
};

const toWarehouse = (w) => ({
  uuid: uuidFor(KIND.warehouse, w.id),
  initials: w.initials,
  description: w.description,
  type: (WAREHOUSE_TYPE[w.type] ?? WAREHOUSE_TYPE.I).slug,
  type_label: (WAREHOUSE_TYPE[w.type] ?? WAREHOUSE_TYPE.I).label,
  is_active: Boolean(w.is_active),
  created_at: w.created_at,
  updated_at: w.updated_at,
});

const toPackage = (r) => ({
  uuid: uuidFor(KIND.package, r.id),
  description: r.description,
  size: r.size === null ? 0 : Number(r.size),
  measurement_uuid: r.measurement_id ? uuidFor(KIND.measurement, r.measurement_id) : null,
  measurement_name: r.measurement_name,
  created_at: r.created_at,
  updated_at: r.updated_at,
});

export const productRoutes = [
  {
    method: 'get',
    pattern: /^\/products$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const where = ['p.tenant_id = $1'];
      const args = [TENANT_ID];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`(p.description ilike $${args.length} or p.code::text ilike $${args.length})`);
      }
      const [{ total }] = await query(`select count(*)::int as total from products p where ${where.join(' and ')}`, args);
      const rows = await query(
        `${PRODUCT_SELECT} where ${where.join(' and ')} order by p.description limit ${p.limit} offset ${p.offset}`,
        args,
      );
      return { body: rows.map(toProduct), meta: pageMeta(p, total) };
    },
  },
  {
    method: 'get',
    pattern: /^\/products\/([\w-]+)$/,
    handler: async ({ match }) => {
      const rows = await query(`${PRODUCT_SELECT} where p.id = $1`, [idFrom(match[1])]);
      return rows[0] ? { body: toProduct(rows[0]) } : { status: 404, body: null };
    },
  },
  {
    method: 'get',
    pattern: /^\/warehouses$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const args = [TENANT_ID];
      const where = ['w.farm_id in (select id from farms where tenant_id = $1)'];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`(w.description ilike $${args.length} or w.initials ilike $${args.length})`);
      }
      const [{ total }] = await query(`select count(*)::int as total from warehouses w where ${where.join(' and ')}`, args);
      const rows = await query(
        `select w.* from warehouses w where ${where.join(' and ')} order by w.description limit ${p.limit} offset ${p.offset}`,
        args,
      );
      return { body: rows.map(toWarehouse), meta: pageMeta(p, total) };
    },
  },
  {
    method: 'get',
    pattern: /^\/warehouses\/options$/,
    handler: async () => {
      const rows = await query(
        'select * from warehouses where farm_id in (select id from farms where tenant_id = $1) order by description limit 200',
        [TENANT_ID],
      );
      return {
        body: rows.map((w) => ({ uuid: uuidFor(KIND.warehouse, w.id), initials: w.initials, description: w.description })),
        meta: null,
      };
    },
  },
  {
    method: 'get',
    pattern: /^\/packages$/,
    handler: async ({ query: q }) => {
      const p = paging(q);
      const args = [TENANT_ID];
      const where = ['k.tenant_id = $1'];
      if (q.search) {
        args.push(norm(q.search));
        where.push(`k.description ilike $${args.length}`);
      }
      const [{ total }] = await query(`select count(*)::int as total from packages k where ${where.join(' and ')}`, args);
      const rows = await query(
        `select k.*, m.name as measurement_name from packages k left join measurements m on m.id = k.measurement_id
         where ${where.join(' and ')} order by k.description limit ${p.limit} offset ${p.offset}`,
        args,
      );
      return { body: rows.map(toPackage), meta: pageMeta(p, total) };
    },
  },
];
