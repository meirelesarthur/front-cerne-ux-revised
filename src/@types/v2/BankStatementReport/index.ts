// src/@types/v2/BankStatementReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Extrato Financeiro" (`bankEstatement.report`, F-233,
// execução 97-Esteiras/079, TASK-F233-FE-01). Endpoint DELIVERED (FLAT, NÃO
// `/reports/...`): `GET /bank-statement-report` — params confirmados em
// `BankStatementReportRequest` (leitura direta da API viva, SEM MOCK):
// `account_uuid` (uuid, REQUIRED — única conta, diferente de
// `PaymentCashflowReport`/F-293, que tem `accounts[]` opcional/múltiplo),
// `start_date`/`end_date` (required, `after_or_equal:start_date`),
// `proprietary_uuid` (uuid, opt), `center_uuid` (uuid, opt), `categories_uuid[]`
// (uuid[], opt), `farm_uuid` (uuid, opt), `condition` (`S`|`C`, opt, default
// `'S'` no form), `report_type` (`pdf`|`excel`, NUNCA `type`).
//
// Options DEDICADO (FRONT-09, mirror F-293/F-311/F-276): `GET
// /bank-statement-report/options` devolve as 5 listas NUM ÚNICO fetch — shape
// EXATO de `ListBankStatementReportOptionsAction`. Aceita `farm_uuid`
// opcional na querystring (AF#2 — `cost_centers` é escopado pelo `farm_uuid`
// que o usuário está montando no FILTRO, não pela fazenda ATIVA). NUNCA os
// lookups genéricos `/accounts/options`/`/cost-centers/options`/
// `/proprietaries/options`/`/farms/options`.
//
// `BankStatementReportFormValues` (forma do form) ≠ `BankStatementReportParams`
// (payload real) — a fronteira permitida entre os dois é
// `toBankStatementReportParams()` (`bank-statement-report-service.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `condition` (FM-06) — enum server-side `BankStatementReportCondition{S,C}`.
 *  `S` = "Sem Categoria" (default do form), `C` = "Com Categoria". */
export type BankStatementReportConditionValue = 'S' | 'C';

/** `report_type` (FM-09) — literal `pdf`/`excel`, fixado por botão (mirror
 *  F-293/DEC-049). NUNCA um campo Select "Tipo de Relatório" no front. */
export type BankStatementReportType = 'pdf' | 'excel';

/** Forma INTERNA do form (react-hook-form) — 8 campos: 1 select OBRIGATÓRIO
 *  (`account`, ÚNICO — diferente de F-293), 3 selects opcionais
 *  (`proprietary`/`center_id`/`farm_id`), 1 multiselect opcional (`categories`,
 *  `CheckboxListField`), 1 select `noClearable` com default (`condition`) e 2
 *  datas OBRIGATÓRIAS (`start_date`/`end_date`). */
export interface BankStatementReportFormValues {
  account: Option<string> | null;
  proprietary: Option<string> | null;
  center_id: Option<string> | null;
  categories: string[];
  farm_id: Option<string> | null;
  condition: Option<BankStatementReportConditionValue> | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos 2
 *  handlers de download (literal `pdf`/`excel`), nunca lido do form. Nomes
 *  EXATOS de `BankStatementReportRequest`: `account_uuid` (REQUIRED, único),
 *  `proprietary_uuid`, `center_uuid`, `categories_uuid`, `farm_uuid`,
 *  `condition`, `report_type` (NUNCA `type`/sufixo `_id` do legado). */
export interface BankStatementReportParams {
  account_uuid: string;
  start_date: string;
  end_date: string;
  proprietary_uuid?: string;
  center_uuid?: string;
  categories_uuid?: string[];
  farm_uuid?: string;
  condition?: BankStatementReportConditionValue;
  report_type: BankStatementReportType;
}

/** Item de conta devolvido pelo fetch dedicado de options
 *  (`GET /bank-statement-report/options`) — label já vem "code -
 *  description" do backend. */
export interface BankStatementReportAccountOption {
  uuid: string;
  label: string;
}

/** Item de proprietário devolvido pelo fetch dedicado de options. */
export interface BankStatementReportProprietaryOption {
  uuid: string;
  name: string;
}

/** Item de centro de custo devolvido pelo fetch dedicado de options —
 *  escopado pelo `farm_uuid` do PRÓPRIO FILTRO (AF#2), NÃO pela fazenda
 *  ativa (diferente de F-293/DEFECT-02). */
export interface BankStatementReportCostCenterOption {
  uuid: string;
  description: string;
}

/** Item de categoria financeira devolvido pelo fetch dedicado de options —
 *  label já vem "code - description" do backend. */
export interface BankStatementReportFinancialCategoryOption {
  uuid: string;
  label: string;
}

/** Item de fazenda devolvido pelo fetch dedicado de options — restrito às
 *  farms do usuário (`FarmRepository::listActiveForUser`). */
export interface BankStatementReportFarmOption {
  uuid: string;
  description: string;
}

/** Envelope de dados do fetch dedicado (FRONT-09) — UM ÚNICO `useQuery`
 *  popula os 5 campos (`accountOptions`/`proprietaryOptions`/
 *  `costCenterOptions`/`farmOptions`, todos via `useMemo`, + `categoryItems`
 *  do `CheckboxListField`). Shape EXATO de
 *  `ListBankStatementReportOptionsAction`. NUNCA os endpoints genéricos. */
export interface BankStatementReportOptions {
  accounts: BankStatementReportAccountOption[];
  proprietaries: BankStatementReportProprietaryOption[];
  cost_centers: BankStatementReportCostCenterOption[];
  financial_categories: BankStatementReportFinancialCategoryOption[];
  farms: BankStatementReportFarmOption[];
}
