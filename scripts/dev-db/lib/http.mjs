// Helpers de contrato: envelope ApiResponse, paginação, UUID determinístico.

export const envelope = (data, meta = null) => ({
  success: true,
  message: 'dev-db',
  data,
  errors: null,
  meta,
});

export function parseQuery(searchParams) {
  const q = {};
  for (const [k, v] of searchParams.entries()) q[k] = v;
  return q;
}

/** Paginação (default 10): devolve { limit, offset, page, perPage }. */
export function paging(query, defaultPerPage = 10) {
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(200, Math.max(1, Number(query.per_page) || defaultPerPage));
  return { page, perPage, limit: perPage, offset: (page - 1) * perPage };
}

export function pageMeta({ page, perPage }, total) {
  return {
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    total,
    from: total ? (page - 1) * perPage + 1 : null,
    to: total ? Math.min(page * perPage, total) : null,
  };
}

// UUID determinístico e reversível: <kind(8 hex)>-0000-4000-8000-<id(12 dígitos)>.
// `kind` identifica o recurso (evita colisão entre tabelas).
export const uuidFor = (kind, id) =>
  id === null || id === undefined ? null : `${kind}-0000-4000-8000-${String(id).padStart(12, '0')}`;

export const idFrom = (uuid) => {
  const m = String(uuid ?? '').match(/-(\d{12})$/);
  return m ? Number(m[1]) : null;
};

export const KIND = {
  farm: 'f0000001',
  person: 'f0000002',
  bank: 'f0000003',
  city: 'f0000004',
  state: 'f0000005',
  country: 'f0000006',
  costCenter: 'f0000007',
  planAccount: 'f0000008',
  warehouse: 'f0000009',
  package: 'f000000a',
  product: 'f000000b',
  group: 'f000000c',
  category: 'f000000d',
  kind: 'f000000e',
  measurement: 'f000000f',
};

export const norm = (s) => `%${String(s ?? '').trim()}%`;
