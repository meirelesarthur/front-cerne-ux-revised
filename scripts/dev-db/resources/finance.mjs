// Plano de contas e Centros de custo (hierarquias em conjunto aninhado: _lft/_rgt/parent_id).
import { TENANT_ID, query } from '../lib/db.mjs';
import { KIND, idFrom, norm, pageMeta, paging, uuidFor } from '../lib/http.mjs';

const CONDITION_COST = { 1: 'Despesa', 2: 'Receita', 3: 'Ambos' };
const CONDITION_PLAN = { 1: 'Devedor', 2: 'Credor', 3: 'Ambos' };
const CLASS_LABEL = { 1: 'Sintético', 2: 'Analítico' };
const TYPE_LABEL = { productive: 'Produtivo', apportioned: 'Rateado' };

const ref = (kind, id, code, description) =>
  id ? { uuid: uuidFor(kind, id), code, description, is_root: false } : null;

const toCostCenter = (r) => ({
  uuid: uuidFor(KIND.costCenter, r.id),
  code: r.code,
  description: r.description,
  type: r.type === 'apportioned' ? 'apportioned' : 'productive',
  type_label: TYPE_LABEL[r.type] ?? 'Produtivo',
  condition: Number(r.condition),
  condition_label: CONDITION_COST[r.condition] ?? 'Ambos',
  class: Number(r.class),
  class_label: CLASS_LABEL[r.class] ?? 'Analítico',
  is_enabled: Boolean(r.is_enabled),
  allow_pointing: Boolean(r.allow_pointing),
  can_edit: true,
  can_delete: true,
  can_create_descendant: Number(r.class) === 1,
  parent: ref(KIND.costCenter, r.parent_id, r.parent_code, r.parent_description),
});

const toPlanAccount = (r) => ({
  uuid: uuidFor(KIND.planAccount, r.id),
  code: r.code,
  description: r.description,
  condition: Number(r.condition),
  condition_label: CONDITION_PLAN[r.condition] ?? 'Ambos',
  class: Number(r.class),
  class_label: CLASS_LABEL[r.class] ?? 'Analítico',
  type: r.type === null || r.type === undefined ? null : Number(r.type),
  type_label: r.type === 1 ? 'CAPEX' : r.type === 2 ? 'OPEX' : null,
  is_enabled: Boolean(r.is_enabled),
  parent: ref(KIND.planAccount, r.parent_id, r.parent_code, r.parent_description),
});

function treeRoutes({ path, table, kind, mapper }) {
  const SELECT = `select t.*, p.code as parent_code, p.description as parent_description
    from ${table} t left join ${table} p on p.id = t.parent_id`;

  const list = async ({ query: q }) => {
    const p = paging(q, 25);
    const where = ['(t.tenant_id = $1 or t.tenant_id is null)'];
    const args = [TENANT_ID];
    if (q.search) {
      args.push(norm(q.search));
      where.push(`(t.description ilike $${args.length} or t.code ilike $${args.length})`);
    }
    const [{ total }] = await query(`select count(*)::int as total from ${table} t where ${where.join(' and ')}`, args);
    const rows = await query(
      `${SELECT} where ${where.join(' and ')} order by t._lft limit ${p.limit} offset ${p.offset}`,
      args,
    );
    return { body: rows.map(mapper), meta: pageMeta(p, total) };
  };

  return [
    { method: 'get', pattern: new RegExp(`^/${path}$`), handler: list },
    {
      method: 'get',
      pattern: new RegExp(`^/${path}/options(?:/global)?$`),
      handler: async ({ query: q }) => {
        const args = [TENANT_ID];
        let where = '(t.tenant_id = $1 or t.tenant_id is null)';
        if (q.search) {
          args.push(norm(q.search));
          where += ` and (t.description ilike $2 or t.code ilike $2)`;
        }
        const rows = await query(`select t.* from ${table} t where ${where} order by t._lft limit 200`, args);
        return {
          body: rows.map((r) => ({
            uuid: uuidFor(kind, r.id),
            code: r.code,
            description: r.description,
            is_root: r.parent_id === null,
          })),
          meta: null,
        };
      },
    },
    {
      method: 'get',
      pattern: new RegExp(`^/${path}/([\\w-]+)$`),
      handler: async ({ match }) => {
        const rows = await query(`${SELECT} where t.id = $1`, [idFrom(match[1])]);
        return rows[0]
          ? { body: { ...mapper(rows[0]), categories: [], apportionments: [] } }
          : { status: 404, body: null };
      },
    },
  ];
}

// Prévia do código da próxima conta (o backend real gera na criação): raiz → próximo inteiro;
// com pai → código do pai + "." + próximo sequencial entre os filhos. Só para a tela não mostrar erro.
const planAccountCodePreview = {
  method: 'get',
  pattern: /^\/plan-accounts\/code-preview$/,
  handler: async ({ query: q }) => {
    const parentId = q.parent_uuid ? idFrom(q.parent_uuid) : null;
    if (parentId) {
      const [parent] = await query('select code from plan_accounts where id = $1', [parentId]);
      const [{ n }] = await query('select count(*)::int as n from plan_accounts where parent_id = $1', [parentId]);
      return { body: { code: `${parent?.code ?? '1'}.${n + 1}`, class: 2, class_label: 'Analítico' } };
    }
    const [{ n }] = await query('select count(*)::int as n from plan_accounts where parent_id is null and (tenant_id = $1 or tenant_id is null)', [TENANT_ID]);
    return { body: { code: String(n + 1), class: 1, class_label: 'Sintético' } };
  },
};

export const financeRoutes = [
  planAccountCodePreview,
  ...treeRoutes({ path: 'cost-centers', table: 'cost_centers', kind: KIND.costCenter, mapper: toCostCenter }),
  ...treeRoutes({ path: 'plan-accounts', table: 'plan_accounts', kind: KIND.planAccount, mapper: toPlanAccount }),
];
