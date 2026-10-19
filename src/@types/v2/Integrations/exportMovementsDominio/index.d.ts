// src/@types/v2/Integrations/exportMovementsDominio/index.d.ts
// Tipos da tela STANDALONE "Exportação Movimento Bancário → Domínio" (F-116,
// Integrações, irmã do canário F-119 ExportNfseDominio). NÃO é CRUD — só o
// form de filtro (2 datas + 1 select `type`) e o request de export enviado à
// API. `DateInput` opera com string ISO `yyyy-MM-dd` (nunca `Date`); `type`
// é um `Option<number>` do Select (fábrica `(languageGB)=>Map`,
// `exportMovementsDominioTypeOptions`), NUNCA número/string cru no form.

import type { Option } from '@/@types/option';

/** Form (React Hook Form) — `DateInput` trabalha com ISO string | null;
 *  `type` trabalha com `Option<number> | null` (Select controlado). */
export interface ExportMovementsDominioForm {
  /** "Dt. Início" — 'yyyy-MM-dd'. */
  start_date: string | null;
  /** "Dt. Fim" — 'yyyy-MM-dd'. */
  end_date: string | null;
  /** "Tipo Dados" — 1=Entrada, 2=Saída. */
  type: Option<number> | null;
}

/**
 * Query params enviados à API
 * (`GET /integrations/exports/movements-dominio`). Unwrapped (sem `null`/
 * `Option` — só chega aqui após validação do schema, `type` já é `.value`).
 * SEM `farm_id` — o contexto de fazenda vai via header `X-Farm-Id`, injetado
 * pelo interceptor do `api.V2` (contrato de tela §2.1/§3).
 */
export interface ExportMovementsDominioExportRequest {
  start_date: string;
  end_date: string;
  type: number;
}
