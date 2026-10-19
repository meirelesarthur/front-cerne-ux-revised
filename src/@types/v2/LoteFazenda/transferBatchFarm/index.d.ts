// src/@types/v2/LoteFazenda/transferBatchFarm/index.d.ts
// -----------------------------------------------------------------------------
// Tipos de "Transferência de Lote entre Fazendas" (TransferBatchFarm —
// Operacional > Pecuária > Transferências, 97-Esteiras/041,
// TASK-FE-041-LF-01..04). Mirror estrutural de
// `@/@types/v2/Livestock/transferAbcBatch` (par List/Detail + Form +
// CreateRequest), acrescido dos blocos específicos desta feature (financeiro
// morph, lookups de criação, módulo/área, lote novo).
//
// Fonte de verdade: `TransferBatchFarmResource`/`TransferBatchFarmRequest`/
// `TransferBatchFarmFinancialRequest`/`ChangeBatchModuleAreaRequest`/
// `BatchRequest` (fork `GB.Cerne.Api`, TASK-BE-041-LF-01..04) — nomes de
// campo EXATOS, sem tradução livre.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---- Status (Enum backend `TransferBatchFarmStatus`) -----------------------
export type TransferBatchFarmStatusValue = 1 | 2 | 3 | 4;

export interface TransferBatchFarmRefOption {
  uuid: string;
  label: string;
}

// ---- Resource (`TransferBatchFarmResource`) — index E detalhe, mesmo shape.
export interface TransferBatchFarmListItem {
  uuid: string;
  code: string;
  date: string;
  status: TransferBatchFarmStatusValue;
  status_label: string;
  status_color: string;
  has_financial: boolean;
  employee: { uuid: string; name: string | null } | null;
  batch: { uuid: string; description: string } | null;
  farm_from: { uuid: string; description: string } | null;
  farm_to: { uuid: string; description: string } | null;
  category: { uuid: string; description: string } | null;
  user: { uuid: string; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

export type TransferBatchFarmDetail = TransferBatchFarmListItem;

export interface TransferBatchFarmsListEnvelope {
  success: boolean;
  message?: string;
  data: TransferBatchFarmListItem[];
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

// ---- Criação (`TransferBatchFarmRequest`) -----------------------------------
// `generate_financial`/`financial` — TASK-BE-041-LF-06 (commit 2d8bc411): bloco
// financeiro OPCIONAL e ATÔMICO no MESMO `POST`, reusando o tipo
// `CreateTransferBatchFarmFinancialRequest` (já existente, abaixo) — não
// duplicar. Omitidos = comportamento LF-01/05 intocado (`create` simples).
export interface CreateTransferBatchFarmRequest {
  date: string;
  batch_uuid: string;
  farm_to_uuid: string;
  category_uuid?: string | null;
  generate_financial?: boolean;
  financial?: CreateTransferBatchFarmFinancialRequest;
}

export interface TransferBatchFarmForm {
  code: string;
  date: string | null;
  category_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  farm_to_uuid: Option<string> | null;
  has_financial: Option<boolean> | null;
  // Bloco financeiro embutido (F-CR11/14-31) — mesmos campos do form
  // standalone (`TransferBatchFarmFinancialForm` abaixo), achatados aqui
  // quando `has_financial=1` no CREATE (§4 `SCR-CREATE`, plano-front).
  financial?: TransferBatchFarmFinancialForm;
}

// ---- Financeiro (`TransferBatchFarmFinancialRequest`) ----------------------
export interface TransferBatchFarmInstallmentRowForm {
  due_date: string | null;
  value: number | null;
}

export interface TransferBatchFarmCategoryRowForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  value: number | null;
}

export interface TransferBatchFarmFinancialForm {
  vl_total: number;
  fiscal_document: Option<boolean> | null;
  proprietary_uuid: Option<string> | null;
  qtd_installments: number | null;
  first_installment_date: string | null;
  int_installments: number | null;
  installments: TransferBatchFarmInstallmentRowForm[];
  income_categories: TransferBatchFarmCategoryRowForm[];
  expense_categories: TransferBatchFarmCategoryRowForm[];
  // Bloco "Possui entrada?" (item 4, reprovação AD F-022) — FRONT-ONLY,
  // mirror `transfer_form.blade.php:550-559`/`calcInstallments()`: insumo do
  // cálculo de parcelas (`vl_total - entrada`), NUNCA persistido — ausente
  // de `CreateTransferBatchFarmFinancialRequest` (payload de rede) de
  // propósito, mesma fidelidade do legado.
  has_input?: Option<boolean> | null;
  input_date?: string | null;
  input_value?: number | null;
}

export interface CreateTransferBatchFarmFinancialRequest {
  vl_total: number;
  fiscal_document: boolean;
  proprietary_uuid?: string;
  installments: { due_date: string; value: number }[];
  income_categories: { category_uuid: string; center_uuid: string; value: number }[];
  expense_categories: { category_uuid: string; center_uuid: string; value: number }[];
}

// ---- Import (`TransferBatchFarmImportResultResource`) ----------------------
export interface TransferBatchFarmImportResult {
  rows_processed: number;
  created: number;
}

// ---- check-date (`CheckTransferBatchFarmDateAction`) -----------------------
export interface TransferBatchFarmDateCheckItem {
  valid: boolean;
  message: string | null;
}

export interface TransferBatchFarmDateCheckResult {
  valid: boolean;
  checks: {
    batch?: TransferBatchFarmDateCheckItem;
    farm?: TransferBatchFarmDateCheckItem;
  };
}

// ---- eligible-animals (agrupado por categoria) ------------------------------
export interface TransferBatchFarmEligibleAnimal {
  uuid: string;
  identification: string;
}

export type TransferBatchFarmEligibleAnimalsByCategory = Record<
  string,
  TransferBatchFarmEligibleAnimal[]
>;

// ---- Novo Lote (`BatchRequest`/`AnimalBatchResource`) -----------------------
export interface CreateBatchRequest {
  description: string;
  date: string;
  employee_uuid?: string | null;
  specie_uuid: string;
  category_uuids: string[];
  corral_uuid?: string | null;
  parameter_weight_uuid?: string | null;
}

export interface BatchDetail {
  uuid: string;
  description: string;
  date: string | null;
  employee_uuid: string | null;
  specie_uuid: string | null;
  parameter_weight_uuid: string | null;
  status: string;
  code: string | null;
  employee?: { uuid: string; name: string | null } | null;
  specie?: { uuid: string; description: string } | null;
  parameter_weight?: { uuid: string; description: string } | null;
  categories?: { uuid: string; description: string }[] | null;
  animals?: { uuid: string; identification: string }[];
  total_animals: number;
  areas?: { uuid: string; description: string }[];
  grazings?: { uuid: string; description: string }[];
}

// ---- Módulo/Área (`TransferBatchGrazingAreaResource`/`ChangeBatchModuleAreaRequest`)
export interface TransferBatchGrazingAreaLast {
  uuid: string;
  code: string;
  date: string;
  batch?: { uuid: string; description: string };
  area_old?: { uuid: string; description: string } | null;
  area_next?: { uuid: string; description: string } | null;
  grazing_old?: { uuid: string; description: string } | null;
  grazing_next?: { uuid: string; description: string } | null;
  employee?: { uuid: string; name: string | null } | null;
  created_at: string | null;
}

export interface ChangeBatchModuleAreaRequest {
  code: string;
  date: string;
  batch_uuid: string;
  employee_uuid?: string | null;
  area_uuid?: string | null;
  grazing_uuid?: string | null;
}
