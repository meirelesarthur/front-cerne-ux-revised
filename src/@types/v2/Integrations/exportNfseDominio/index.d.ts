// src/@types/v2/Integrations/exportNfseDominio/index.d.ts
// Tipos da tela STANDALONE "Exportação NFS-e → Domínio" (F-119, Integrações,
// canário `97-Esteiras/071`). NÃO é CRUD — só o form de filtro (2 datas) e o
// request de export enviado à API. `DateInput` opera com string ISO
// `yyyy-MM-dd` (nunca `Date` — quebraria o round-trip do wire, ver
// `field-validation-schema.ts::date()`).

/** Form (React Hook Form) — `DateInput` trabalha com ISO string | null. */
export interface ExportNfseDominioForm {
  /** "Dt. Início" — 'yyyy-MM-dd'. */
  start_date: string | null;
  /** "Dt. Fim" — 'yyyy-MM-dd'. */
  end_date: string | null;
}

/**
 * Query params enviados à API (`GET /integrations/exports/nfse-dominio`).
 * Unwrapped (sem `null` — só chega aqui após validação do schema). SEM
 * `farm_id` — o contexto de fazenda vai via header `X-Farm-Id`, injetado
 * pelo interceptor do `api.V2` (contrato de tela §2.1/§3).
 */
export interface ExportNfseDominioExportRequest {
  start_date: string;
  end_date: string;
}
