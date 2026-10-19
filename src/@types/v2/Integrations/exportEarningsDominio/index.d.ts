// src/@types/v2/Integrations/exportEarningsDominio/index.d.ts
// Tipos da tela STANDALONE "Exportação Folha Salarial → Domínio" (F-117,
// Integrações, irmã do canário F-119 ExportNfseDominio). NÃO é CRUD — só o
// form de filtro (2 selects `year`/`month`) e o request de export enviado à
// API. `year`/`month` são `Option<number>` do Select (fábricas
// `(languageGB)=>Map`/dinâmica, `exportEarningsDominioYearOptions`/
// `exportEarningsDominioMonthOptions`), NUNCA número cru no form.

import type { Option } from '@/@types/option';

/** Form (React Hook Form) — `year`/`month` trabalham com `Option<number> |
 *  null` (Select controlado). Defaults = ano/mês corrente (CL-02). */
export interface ExportEarningsDominioForm {
  /** "Ano" — 4 dígitos, opções `[corrente, corrente-1]`. */
  year: Option<number> | null;
  /** "Mês" — 1..12. */
  month: Option<number> | null;
}

/**
 * Query params enviados à API
 * (`GET /integrations/exports/earnings-dominio`). Unwrapped (sem `null`/
 * `Option` — só chega aqui após validação do schema, `year`/`month` já são
 * `.value`). SEM `farm_id` — o contexto de fazenda vai via header
 * `X-Farm-Id`, injetado pelo interceptor do `api.V2` (contrato de tela
 * §2.1/§3).
 */
export interface ExportEarningsDominioExportRequest {
  year: number;
  month: number;
}
