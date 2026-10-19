// src/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm/index.d.ts
// -----------------------------------------------------------------------------
// Tipos de "Transferência de Animal entre Fazendas" (TransferAnimalFarm —
// Operacional > Pecuária > Transferências, 97-Esteiras/042, TASK-FE-042-101).
// Mirror ESTRUTURAL (não import) de
// `@/@types/v2/LoteFazenda/transferBatchFarm` — mesma classe de problema
// (transferência entre fazendas + financeiro + recebimento→Processing), DTOs
// PRÓPRIOS: pivot `animal_uuids[]` N:N em vez de `batch_uuid` FK única.
//
// Fonte de verdade: `TransferAnimalFarmResource`/`TransferAnimalFarmRequest`/
// `TransferAnimalFarmFinancialRequest` (fork `GB.Cerne.Api`,
// TASK-BE-042-101..103) — nomes de campo EXATOS, sem tradução livre. Ver
// `01-Arquitetura_e_Contratos/TransferAnimalFarm/TransferAnimalFarm-contrato-frontend.md`
// §2, §3.7.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---- Status (Enum backend `TransferAnimalFarmStatus`) ----------------------
// 1=PENDING (Em Aberto), 2=PROCESSING (Em Processamento), 3=FINISHED
// (Finalizado), 4=CANCELED (Cancelado) — valores IDÊNTICOS a
// `TransferBatchFarmStatus` (mesmas cores, confirmado no contrato de API §5).
export type TransferAnimalFarmStatusValue = 1 | 2 | 3 | 4;

// ---- Resource (`TransferAnimalFarmResource`) — index E show, mesmo shape;
// `animals[]` só vem populado no `show` (SURF-006).
export interface TransferAnimalFarmAnimalRef {
  uuid: string;
  identification: string;
}

export interface TransferAnimalFarmListItem {
  uuid: string;
  code: string;
  date: string;
  status: TransferAnimalFarmStatusValue;
  status_label: string;
  status_color: string;
  farm_from: { uuid: string; description: string } | null;
  farm_to: { uuid: string; description: string } | null;
  employee: { uuid: string; name: string | null } | null;
  user: { uuid: string; name: string } | null;
  category: { uuid: string; description: string } | null;
  has_financial: boolean;
  animals_count: number;
  animals?: TransferAnimalFarmAnimalRef[];
  created_at: string | null;
}

export type TransferAnimalFarmDetail = TransferAnimalFarmListItem;

export interface TransferAnimalFarmsListEnvelope {
  success: boolean;
  message?: string;
  data: TransferAnimalFarmListItem[];
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

// ---- Criação (`TransferAnimalFarmRequest`) ---------------------------------
// `code`/`farm_from_uuid`/`user_uuid`/`status` NUNCA vão no payload
// (contexto server). `employee_uuid` NÃO existe neste DTO (FLD-005/006 — o
// Responsável do create é sempre o usuário autenticado, mesmo racional já
// aplicado à irmã).
export interface CreateTransferAnimalFarmRequest {
  date: string;
  farm_to_uuid: string;
  animal_uuids: string[];
  generate_financial?: boolean;
  financial?: CreateTransferAnimalFarmFinancialRequest;
}

export interface TransferAnimalFarmForm {
  code: string;
  date: string | null;
  farm_to_uuid: Option<string> | null;
  // Filtro (não persistido) que alimenta `eligible-animals` (FLD-009). Não
  // existe campo "Categoria" persistido nesta tela — o legado nunca preenche
  // `category_id` no `store()` (Item A, 063-est03-9-reprovacoes).
  batch_uuid: Option<string> | null;
  category_filter_uuids: Option<string>[];
  // Estado do seletor de animais — array de string, NUNCA `Option[]`
  // (FLD-012, §3.7 do contrato-frontend).
  animal_uuids: string[];
  has_financial: Option<boolean> | null;
  financial?: TransferAnimalFarmFinancialForm;
}

// ---- Financeiro (`TransferAnimalFarmFinancialRequest`) — mirror EXATO do
// shape da irmã (`TransferBatchFarmFinancialForm`), só o nome do tipo muda.
export interface TransferAnimalFarmInstallmentRowForm {
  due_date: string | null;
  value: number | null;
}

export interface TransferAnimalFarmCategoryRowForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  value: number | null;
}

export interface TransferAnimalFarmFinancialForm {
  vl_total: number;
  fiscal_document: Option<boolean> | null;
  proprietary_uuid: Option<string> | null;
  qtd_installments: number | null;
  first_installment_date: string | null;
  int_installments: number | null;
  installments: TransferAnimalFarmInstallmentRowForm[];
  income_categories: TransferAnimalFarmCategoryRowForm[];
  expense_categories: TransferAnimalFarmCategoryRowForm[];
  // DIV-08 (063-est03-9-reprovacoes) — bloco "Possui entrada?" restaurado
  // (mirror `transfer_form.blade.php`/`CreateOrUpdateTransferBatchFarm.tsx`).
  // Diferente da irmã Lote/Fazenda, AQUI os 3 campos SÃO enviados ao payload
  // — a API paralela (TASK-API-063-03) valida e persiste.
  has_input: Option<boolean> | null;
  input_date: string | null;
  input_value: number | null;
}

export interface CreateTransferAnimalFarmFinancialRequest {
  vl_total: number;
  fiscal_document: boolean;
  proprietary_uuid?: string;
  installments: { due_date: string; value: number }[];
  income_categories: { category_uuid: string; center_uuid: string; value: number }[];
  expense_categories: { category_uuid: string; center_uuid: string; value: number }[];
  has_input: boolean;
  input_date?: string;
  input_value?: number;
}

// ---- check-date (`CheckTransferAnimalFarmDateAction`) ----------------------
export interface TransferAnimalFarmDateCheckItem {
  valid: boolean;
  message: string | null;
}

export interface TransferAnimalFarmDateCheckResult {
  valid: boolean;
  checks: {
    batch?: TransferAnimalFarmDateCheckItem;
    farm?: TransferAnimalFarmDateCheckItem;
  };
}

// ---- eligible-animals (agrupado por categoria) — NOVO, sem precedente FE
// (§2.4/§4.2.1 do contrato-frontend): fonte REAL da seleção de animais desta
// feature (diferente da irmã, onde o endpoint homônimo é só preview de
// contagem).
export interface TransferAnimalFarmEligibleAnimal {
  uuid: string;
  identification: string;
}

export type TransferAnimalFarmEligibleAnimalsByCategory = Record<
  string,
  TransferAnimalFarmEligibleAnimal[]
>;

// ---- animal-batches/aggregates (5 indicadores, CALC-002) — Action já existe
// no backend (`GetBatchAnimalAggregatesAction`, TASK-BE-968), wiring FE NOVO.
// Nomes de campo realinhados ao contrato REAL da API (`BatchAggregatesData`,
// animal-batch-contrato.md §3.2) — QA2 TASK-FE-063-ANIMAL-AGG-01.
export interface AnimalBatchAggregates {
  total_animals: number;
  total_weight: number;
  average_weight: number;
  total_ua: number;
  average_ua: number;
}
