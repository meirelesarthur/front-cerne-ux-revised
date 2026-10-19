// src/@types/v2/Relatorios/animals-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Estoque/Rebanho" (F-228, execução
// 97-Esteiras/078, TASK-F228-F01). Endpoint DELIVERED (raiz, NÃO
// `/reports/...`): `GET /animals-report` — params FLAT `start_date,end_date,
// species[]?`. **PDF-ONLY** — sem `report_type`, sem Excel (fiel ao legado,
// FRONT-05). Mirror ESTRUTURAL de `@/@types/v2/Relatorios/discards-report.ts`
// (F-256), porém com `species` MULTISELECT (não 1 `area` single).
//
// `AnimalsReportFormValues` (forma do form) ≠ `AnimalsReportParams` (payload
// real) — a fronteira permitida entre os dois é `toAnimalsReportParams()`
// (`animals-report-service.ts`).
//
// `SpecieOptionItem`/`SpeciesOptionsListEnvelope` NÃO são redeclarados aqui —
// reusam o tipo já existente em `@/@types/v2/Species/species` (mirror
// `listSpecieOptions()` em `species-service.ts`, endpoint já vivo `GET
// /species/options`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 3 campos: 2 obrigatórios
 *  (`start_date`/`end_date`) + 1 opcional multiselect (`species`). */
export interface AnimalsReportFormValues {
  start_date: string | null;
  end_date: string | null;
  species: Option<string>[] | null;
}

/** Payload REAL enviado ao servidor — SEM `report_type` (PDF-only, FRONT-05).
 *  `species` já desempacotado para `uuid[]` (fronteira `toAnimalsReportParams`). */
export interface AnimalsReportParams {
  start_date: string;
  end_date: string;
  species?: string[];
}
