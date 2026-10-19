// src/@types/v2/AccumulatedIncomeStatementReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Custo de Produção Acumulado" (F-217, esteira
// 97-Esteiras/058, TASK-058-F217-FE-01). Contrato de tela AUTOAPROVADO —
// `97-Esteiras/058/PLANOS/FRONT-F217-plano.md` §2/§3 — mirror ESTRUTURAL de
// `@/@types/v2/RequestPurchaseManagementReport` (pasta dedicada por feature,
// `toQuery` compartilhado por 2 rotas de download) para o SHAPE dos tipos.
//
// Divergência deliberada (D-058-02, ver plano §0): esta tela é
// download-only — SEM grid/prévia on-screen, SEM os 3 drill-downs que o
// irmão não-acumulado (F-272, `CustoProducao/index.tsx`) expõe. `format` é
// CLIENT-SIDE apenas (decide qual dos 2 endpoints chamar) — NUNCA entra na
// querystring (`AccumulatedIncomeStatementReportParams` não tem `format`).
//
// Campos EXATOS do form de filtro (plano §2.2, mirror
// `AccumulatedIncomeStatementController`/`AccumulatedIncomeStatementService`
// do legado):
//   group               obrigatório  'C' (Caixa) | 'O' (Competência)
//   type                obrigatório  1 (Sintético) | 2 (Analítico)
//   start_date          obrigatório  ISO 'yyyy-MM-dd'
//   end_date            obrigatório  ISO 'yyyy-MM-dd', >= start_date, <= 12 meses (D-058-06)
//   calculation_module  obrigatório  'F' (Financeiro) | 'A' (Apontamento)
//   farm_id             opcional     uuid
//   proprietary_id      opcional     uuid
//   has_stock           opcional     0 | 1 (default 0/"Não")
//   harvest_id          opcional     uuid
//   cost_center_ids     opcional     uuid[]
//
// CORREÇÃO CIRÚRGICA (TASK-058-F217-FIX-01, esteira 058): a API valida
// `type` com `Rule::enum(FinancialCategoryClass::class)`
// (`GB.Cerne.Api/app/Enums/FinancialCategoryClass.php`), enum BACKED EM
// INT — `SYNTHETIC=1`, `ANALYTICAL=2` — nunca a string 'SYNTHETIC'/
// 'ANALYTICS' que a tela enviava (422 `"The selected type is invalid."`).
// Os 3 filtros opcionais também foram renomeados para casar com
// `HasIncomeStatementFilterRules::incomeStatementFilterRules()`
// (`proprietary_id`, `harvest_id`, `cost_center_ids` — plural/array), que
// antes eram descartados em silêncio pela API por chave desconhecida
// (mesma classe do DEC-252).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type AccumulatedIncomeStatementGroup = 'C' | 'O';
/** Mirror `App\Enums\FinancialCategoryClass` (backed int) — `SYNTHETIC=1`,
 *  `ANALYTICAL=2`. NUNCA string — a API valida com `Rule::enum(...)`. */
export type AccumulatedIncomeStatementType = 1 | 2;
export type AccumulatedIncomeStatementCalculationModule = 'F' | 'A';
/** CLIENT-SIDE apenas — decide qual dos 2 endpoints de download é chamado.
 *  NUNCA é enviado como parâmetro de querystring (ver `toQuery` no service). */
export type AccumulatedIncomeStatementReportFormat = 'pdf' | 'excel';

/** Payload REAL enviado ao servidor — nomes 1:1 com o `FormRequest` da API
 *  (`GET /accumulated-income-statement/{pdf,excel}`,
 *  `HasIncomeStatementFilterRules`). SEM `format`. */
export interface AccumulatedIncomeStatementReportParams {
  group: AccumulatedIncomeStatementGroup;
  type: AccumulatedIncomeStatementType;
  start_date: string;
  end_date: string;
  calculation_module: AccumulatedIncomeStatementCalculationModule;
  farm_id?: string;
  proprietary_id?: string;
  has_stock?: 0 | 1;
  harvest_id?: string;
  cost_center_ids?: string[];
}

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `AccumulatedIncomeStatementReportParams` antes de
 *  chamar o service (mirror `Adiantamento`/`ContasAPagar`). */
export interface AccumulatedIncomeStatementReportFilterForm {
  group: Option<AccumulatedIncomeStatementGroup> | null;
  type: Option<AccumulatedIncomeStatementType> | null;
  start_date: string | null;
  end_date: string | null;
  calculation_module: Option<AccumulatedIncomeStatementCalculationModule> | null;
  farm_id: Option<string> | null;
  proprietary: Option<string> | null;
  has_stock: Option<0 | 1> | null;
  harvest: Option<string> | null;
  cost_center: string[];
  format: Option<AccumulatedIncomeStatementReportFormat> | null;
}
