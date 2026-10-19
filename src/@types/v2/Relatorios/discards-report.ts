// src/@types/v2/Relatorios/discards-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Descarte Romaneio" (F-256, execução
// 97-Esteiras/078, TASK-F256-F01). Endpoint DELIVERED (raiz, NÃO
// `/reports/...`): `GET /discards-report` — params FLAT `start_date,end_date,
// area?,report_type(pdf|excel)`. Mirror ESTRUTURAL de
// `@/@types/v2/Relatorios/products-exit-cost-center.ts` (F-301) — porém com
// UM ÚNICO select opcional (`area`), não 3.
//
// `DiscardsReportFormValues` (forma do form) ≠ `DiscardsReportParams`
// (payload real) — a fronteira permitida entre os dois é
// `toDiscardsReportParams()` (`discards-report-service.ts`).
//
// `AreaOptionItem`/`FlatOptionsEnvelope` NÃO são redeclarados aqui — reusam o
// tipo já existente em `@/@types/v2/Rainfalls` (mirror `getAreasOptions()` em
// `rainfall-service.ts`, endpoint genérico `GET /areas/options`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 3 campos: 2 obrigatórios
 *  (`start_date`/`end_date`) + 1 opcional (`area`). */
export interface DiscardsReportFormValues {
  start_date: string | null;
  end_date: string | null;
  area: Option<string> | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. */
export interface DiscardsReportParams {
  start_date: string;
  end_date: string;
  area?: string;
  report_type: DiscardsReportType;
}

/** `type→report_type` do legado — literal `pdf`/`excel`. Dois botões no
 *  footer, cada um fixa o literal — NUNCA um Select "Tipo de Relatório" no
 *  front (FRONT-05, decisão já resolvida). */
export type DiscardsReportType = 'pdf' | 'excel';
