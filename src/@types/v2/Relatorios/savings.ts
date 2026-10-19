// src/@types/v2/Relatorios/savings.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Savings" (F-319, execução 97-Esteiras/013,
// TASK-013-F319-FE-01/02). Contrato reconciliado contra o PLANO da camada api
// (`fid-g3f-savings.md §3`, ainda PROPOSTO — não `CONTRATO_AUTOAPROVADO` no
// momento desta escrita, exceção autorizada pelo dono 2026-09-08 para iniciar
// o front em paralelo). Se a API selada divergir, é o Tester quem pega na
// integração (LACUNA declarada, não mock).
//
// `SavingsReportFormValues` (5 campos) ≠ `SavingsReportParams` (4 chaves) —
// a distinção é DELIBERADA: `user_id` ("Comprador Responsável") é campo
// DECORATIVO por decisão do dono (`DEC-FE-02` = manter quebrado, mirror do
// filtro morto do legado `CL-019`/`OQ-007`). A única fronteira permitida
// entre os dois é a função pura `toSavingsReportParams()`
// (`savings-report-service.ts`) — nunca spread/omit/delete inline na página.
// O parâmetro de responsável opcional da API (nome PROIBIDO no front, grep no
// DoD) — a API tem o parâmetro opcional, mas ele não tem consumidor no front.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 5 campos: 4 funcionais +
 *  `user_id` decorativo (nunca vai ao payload). */
export interface SavingsReportFormValues {
  farm_uuid: string[];
  start_date: string | null;
  end_date: string | null;
  status: Option<number> | null;
  /** "Comprador Responsável" — CAMPO DECORATIVO (`DEC-FE-02`). Visível,
   *  preenchível, populado por `data.responsibles`, SEM efeito nenhum.
   *  Nunca lido por `toSavingsReportParams()`. */
  user_id: Option<string> | null;
}

/** Payload REAL enviado ao servidor — EXATAMENTE 4 chaves. Nenhuma 5ª chave,
 *  nunca `user_id` nem o parâmetro de responsável da API (`DEC-FE-02`,
 *  `T-01-11`/`T-02-08`). */
export interface SavingsReportParams {
  farm_uuid: string[];
  start_date: string;
  end_date: string;
  status?: number;
}

export interface SavingsReportFarmOption {
  uuid: string;
  description: string;
}

export interface SavingsReportResponsibleOption {
  uuid: string;
  name: string;
}

export interface SavingsReportStatusOption {
  value: number;
  label: string;
}

/** `GET /request-quotations/savings-report/options` — os 3 lookups da tela
 *  num único endpoint (P-06 do gate, `fid-g3f-savings.md §3`). */
export interface SavingsReportOptions {
  farms: SavingsReportFarmOption[];
  responsibles: SavingsReportResponsibleOption[];
  statuses: SavingsReportStatusOption[];
}
