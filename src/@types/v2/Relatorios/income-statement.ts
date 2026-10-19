// src/@types/v2/Relatorios/income-statement.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Custo de Produção" (F-272, `IncomeStatementController`
// do legado, esteira 97-Esteiras/073, TASK-272-FE-01). Shapes confirmados por leitura
// DIRETA do código real da API já materializada (`GB.Cerne.Api`), não adivinhados:
//   - `app/Http/Resources/V1/IncomeStatementRowResource.php`
//   - `app/Http/Resources/V1/IncomeStatementCategoryDetailResource.php`
//   - `app/Http/Resources/V1/IncomeStatementDepreciationDetailResource.php`
//   - `app/Http/Resources/V1/IncomeStatementApportionmentDetailResource.php`
//   - `app/Enums/Reports/IncomeStatementDrillDownType.php`
//   - `app/Rules/HasIncomeStatementFilterRules.php` (nomes de campo EXATOS do filtro)
//
// RISCO CRÍTICO (contrato de tela §2, risco #1): `farm_id`/`proprietary_id`/
// `harvest_id`/`cost_center_ids` são os nomes LITERAIS exigidos pela API desta
// feature — DIVERGEM da convenção `_uuid` das telas-irmãs (Dre/JurosPagos/
// ApuracaoCusto). NÃO renomear para `_uuid` "por consistência" — o backend
// ignora silenciosamente o nome errado (nem 422, nem efeito).
//
// `category_id` (drill-down de categoria) é `number` (int interno), NUNCA
// `string`/uuid — exceção documentada e confirmada em
// `IncomeStatementRowResource.php:17-23`, mirror literal do contrato AJAX
// legado C051.
// -----------------------------------------------------------------------------

export type IncomeStatementGroup = 'C' | 'O';
// 1 = Sintético, 2 = Analítico (`FinancialCategoryClass`, enum do backend).
export type IncomeStatementFinancialCategoryType = 1 | 2;
export type IncomeStatementCalculationModule = 'F' | 'A';
export type IncomeStatementDrillDownType = 'category' | 'depreciation' | 'apportionment';

export interface IncomeStatementFilterParams {
  group: IncomeStatementGroup;
  type: IncomeStatementFinancialCategoryType;
  start_date: string;
  end_date: string;
  calculation_module: IncomeStatementCalculationModule;
  /** uuid — NOME EXATO exigido pela API (`HasIncomeStatementFilterRules.php`), não renomear. */
  farm_id?: string;
  /** uuid — farm-scoped pela fazenda ATIVA (`listProprietaryOptions(search,'farm')`). */
  proprietary_id?: string;
  has_stock?: boolean;
  /** uuid — tenant-wide, SEM reset por fazenda ativa (mirror `harvest_id`/CashFlow `account_uuids`). */
  harvest_id?: string;
  /** uuid[] — farm-scoped pela fazenda ATIVA (mirror EXATO `cost_center_uuids` da F-245). */
  cost_center_ids?: string[];
}

export interface IncomeStatementDrillDown {
  type: IncomeStatementDrillDownType;
  /** Repassado CRU pela SPA — nunca reconstruído a partir de outros dados da linha. */
  params: Record<string, unknown>;
}

export interface IncomeStatementRow {
  description: string;
  value: number;
  percent: number;
  /** 0 = raiz. Indentação = `level * 1.5rem` — a API já entrega achatado (sem recursão no cliente). */
  level: number;
  variant: 'total' | 'group' | 'normal';
  /** int interno — NÃO uuid (ver nota de cabeçalho). */
  category_id: number | null;
  has_children: boolean;
  /** Linha clicável SOMENTE quando `drill_down !== null` — nunca usar `has_children` isolado. */
  drill_down: IncomeStatementDrillDown | null;
}

export interface IncomeStatementCategoryDetail {
  /** Já formatada `d/m/Y` pelo backend. */
  date: string;
  person: string | null;
  category: string;
  note: string | null;
  value: number;
}

export interface IncomeStatementDepreciationDetail {
  year: number;
  month: number;
  family: string;
  equipment: string;
  value: number;
}

export interface IncomeStatementApportionmentDetail {
  date: string;
  person: string | null;
  center: string;
  note: string | null;
  original_value: number;
  percentage: number;
  apportioned_value: number;
}
