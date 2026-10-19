// src/@types/v2/ModuleWeighing/module-weighing.ts
// -----------------------------------------------------------------------------
// Tipos do domínio `ModuleWeighing` (Pesagem Rodoviária — Operacional,
// execução 044, F-045, TASK-MWG-FE-01). Fundação da esteira `TASK-MWG-FE-*`
// — consumida por TODAS as Tarefas 02-13.
//
// PINO CRÍTICO: `ModuleWeighing` ≠ `Weighing`/`WeighingRecord` (pesagem de
// ANIMAIS, F-071, já em produção em `src/@types/v2/Weighing`). Namespace,
// pasta e rota deliberadamente disjuntos (`CONTRATO-TELA-PESAGEM-FE §1`) —
// nenhum tipo aqui reaproveita ou colide com `Weighing*`.
//
// Fonte: `CONTRATO-API-PESAGEM.md §3` (Model + Enums + DTO) — 15 endpoints
// `/api/v1/module-weighings*` ainda NÃO implementados no backend
// (`TASK-PES-01/02/03` em curso em paralelo); os tipos abaixo são escritos
// CONTRA O CONTRATO, não contra um endpoint testável agora (mesma situação
// já documentada em `Equipment/equipment-service.ts`).
//
// Os enums `ModuleWeighingStatus`/`ModuleWeighingType`/`ModuleWeighingCategory`
// são declarados aqui como UNIONS DE LITERAIS (contrato de tipagem/domínio,
// espelhando 1:1 os backed enums do backend, contrato API §3) — os valores
// RUNTIME (const object + color map + fábrica de opções `(languageGB) => Map`,
// `get_pwa_constants_and_mappers_pattern §3`) vivem em
// `src/constants/ModuleWeighing/` (criados pela Tarefa que primeiro precisa
// renderizar/mapear o enum na UI, `TASK-MWG-FE-02`) — nunca dentro de um
// `.tsx`, Regra de Ouro Absoluta do padrão de constantes.
//
// `uuid` sempre — nenhum tipo aqui expõe `id` sequencial (Lei 10 SPA).
// -----------------------------------------------------------------------------

import type { DiscountRuleType } from '@/@types/v2/DiscountTables';

// ============================================
// ENUMS (unions de literais — espelho 1:1 dos backed enums do backend)
// ============================================

/** `App\Enums\ModuleWeighingStatus` — 1 PreCadastro, 2 PesagemInicial, 3 Classificacao (opcional), 4 PesagemFinal, 5 Finalizado. */
export type ModuleWeighingStatus = 1 | 2 | 3 | 4 | 5;

/** `App\Enums\ModuleWeighingType` — 0 VendaSaida, 1 CompraEntrada, 2 Avulsa, 3 EntradaColheita, 4 EntradaTerceiros. */
export type ModuleWeighingType = 0 | 1 | 2 | 3 | 4;

/** `App\Enums\ModuleWeighingCategory` — 'E' Externa (default), 'I' Interna. */
export type ModuleWeighingCategory = 'E' | 'I';

/** `App\Enums\ModuleWeighingMovementType` (histórico de transição, `ModuleWeighingMovement`) — 'M' Manual, 'A' Automático. */
export type ModuleWeighingMovementInputType = 'M' | 'A';

// ============================================
// REFS ANINHADAS (shape leve — granularidade de listagem, contrato API §4
// `with()` "list: product/provider/equipment leves"). Todas nullable —
// optional chaining obrigatório em todo consumo (mesma cautela de
// `WarehouseTransferListItem`).
// ============================================

/** `code` OPCIONAL (correção 050, DIV-04) — `ModuleWeighingResource.php:65-68`
 *  nunca expõe `code` na ref de produto (só `uuid`/`description`); mantido
 *  aqui por compatibilidade de tipo com outros domínios que expõem `code`,
 *  mas nenhum consumo desta ref pode assumir presença (trate defensivo). */
export interface ModuleWeighingProductRef {
  uuid: string;
  code?: string;
  description: string;
}

export interface ModuleWeighingWarehouseRef {
  uuid: string;
  description: string;
}

export interface ModuleWeighingProviderRef {
  uuid: string;
  name: string;
}

export interface ModuleWeighingEquipmentRef {
  uuid: string;
  description: string;
  tara?: number | string | null;
}

/** `employee.people.name` fallback `user.people.name` (LM-003, `responsible`). */
export interface ModuleWeighingResponsibleRef {
  uuid: string;
  name: string;
}

export interface ModuleWeighingClientRef {
  uuid: string;
  name: string;
}

export interface ModuleWeighingAreaRef {
  uuid: string;
  description: string;
}

export interface ModuleWeighingMeasurementRef {
  uuid: string;
  description: string;
}

export interface ModuleWeighingDiscountTableRef {
  uuid: string;
  description: string;
}

export interface ModuleWeighingFarmRef {
  uuid: string;
  name: string;
}

// ============================================
// CLASSIFICAÇÃO (contrato API §3, `ModuleWeighingClassificationData`) — 6
// chaves fixas, cada uma `{percent, applied}` (TASK-MWG-FE-06 preenche o
// consumo real na tela de Classificação; a fundação só tipa o shape).
// ============================================

/**
 * `applied` é o PERCENTUAL DE DESCONTO já resolvido (float), NUNCA um
 * boolean (correção 050, DIV-01) — mirror
 * `App\Data\ModuleWeighing\ModuleWeighingClassificationItemData::$applied`
 * (float) e `ModuleWeighingCalculator::applyDiscounts()` (`discount =
 * remaining * applied/100`). Resolvido client-side pela faixa aplicável de
 * `discount_rules` para o `percent` informado (`resolveAppliedPercent`,
 * `classificationDiscountCalculator.ts`) — `0` quando o item não foi
 * marcado como aplicado pelo usuário ou nenhuma faixa corresponde ao
 * `percent`. A UI (`StepClassificacao.tsx`) mantém um checkbox local
 * ("aplicar este desconto") desacoplado deste shape de transporte — a
 * conversão checkbox↔percentual acontece na fronteira do componente, nunca
 * aqui.
 */
export interface ModuleWeighingClassificationItem {
  percent: number | null;
  applied: number;
}

export interface ModuleWeighingClassification {
  impureza: ModuleWeighingClassificationItem;
  umidade: ModuleWeighingClassificationItem;
  quebrado: ModuleWeighingClassificationItem;
  esverdeado: ModuleWeighingClassificationItem;
  avariado: ModuleWeighingClassificationItem;
  taxa_recepcao: ModuleWeighingClassificationItem;
}

// ============================================
// LISTAGEM (GET /module-weighings, RT-001) — granularidade LEVE (contrato
// API §4). Colunas `LM-001..LM-009` (contrato-pesagem-norm.md) + `nfe_uuid`/
// `transfer_uuid` (nullable) exigidos pelas condições do menu de ações
// (`AM-008`/`AM-009`, TASK-MWG-FE-02 §Regras) — nunca `nfe_id`/`transfer_id`
// numéricos (Lei 10).
// ============================================

export interface ModuleWeighingListItem {
  uuid: string;
  status: ModuleWeighingStatus;
  code: string;
  responsible: ModuleWeighingResponsibleRef | null;
  date: string; // YYYY-MM-DD
  warehouse: ModuleWeighingWarehouseRef | null;
  product: ModuleWeighingProductRef | null;
  type: ModuleWeighingType;
  category: ModuleWeighingCategory;
  /** `null` até a Ação "Emitir NFe" (RT-012) vincular — condição `AM-008`. */
  nfe_uuid: string | null;
  /** `null` até a Ação "Emitir Romaneio" (RT-013) vincular — condição `AM-009`. */
  transfer_uuid: string | null;
  created_at?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /module-weighings)
// ============================================

export interface ModuleWeighingsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ModuleWeighingsListEnvelope {
  success: boolean;
  message: string;
  data: ModuleWeighingListItem[];
  errors: Record<string, string[]> | null;
  meta: ModuleWeighingsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-MWG-FE-02 — Contrato B). 5 filtros
// (`FM-001..FM-005`, contrato-pesagem-norm.md) — `product_uuid` corrigido
// nesta esteira (`DV-008`) para usar a MESMA fonte AJAX do relatório
// (`listProductOptions`, `LK-025`), nunca o lookup vazio do legado (`LK-005`).
// ============================================

export interface ModuleWeighingFilterRequest {
  user_uuid?: string;
  equipment_uuid?: string;
  warehouse_uuid?: string;
  product_uuid?: string;
  provider_uuid?: string;
}

/**
 * Filtro da listagem + companions DISPLAY-ONLY de re-hidratação do
 * `SelectAsyncPaginate` (`*_label`), mirror `WeighingFilterForm`. Nunca
 * enviados ao servidor.
 */
export interface ModuleWeighingFilterForm extends ModuleWeighingFilterRequest {
  user_label?: string;
  equipment_label?: string;
  warehouse_label?: string;
  product_label?: string;
  provider_label?: string;
}

// ============================================
// DETALHE (GET /module-weighings/{uuid}, RT-004) — granularidade COMPLETA
// (contrato API §4, `with()` "show/finish/nfe/transfer: grafo completo").
// Estende o item de lista com as refs completas + os 9 campos
// system-managed (nunca aceitos em payload de escrita, contrato API §3).
// ============================================

/** Linha do histórico de transição de status (`ModuleWeighingMovement`,
 *  ordenado por `datetime` — contrato API §4). Exibido no comprovante
 *  (`TASK-MWG-FE-08`, `LM-039`). */
export interface ModuleWeighingMovementItem {
  uuid: string;
  datetime: string;
  status: ModuleWeighingStatus;
  input_type: ModuleWeighingMovementInputType;
  note?: string | null;
}

export interface ModuleWeighingData extends Omit<ModuleWeighingListItem, 'warehouse' | 'product'> {
  product: ModuleWeighingProductRef | null;
  warehouse: ModuleWeighingWarehouseRef | null;
  warehouse_out: ModuleWeighingWarehouseRef | null;
  provider: ModuleWeighingProviderRef | null;
  provider_buy: ModuleWeighingProviderRef | null;
  client: ModuleWeighingClientRef | null;
  equipment: ModuleWeighingEquipmentRef | null;
  area: ModuleWeighingAreaRef | null;
  measurement: ModuleWeighingMeasurementRef | null;
  discount_table: ModuleWeighingDiscountTableRef | null;
  farm_to: ModuleWeighingFarmRef | null;
  gross_weight: number | null;
  tare_weight: number | null;
  has_classification: boolean;
  classification: ModuleWeighingClassification | null;
  provider_lot: string | null;
  lot: string | null;
  expiration_date: string | null;
  note: string | null;
  /** System-managed (contrato API §3) — nunca no payload de `store`/`update`. */
  final_weight: number | null;
  classification_discount: number | null;
  average_cost: number | null;
  total: number | null;
  dfe_uuid: string | null;
  /** Histórico de transição de status, ordenado por `datetime` (contrato API
   *  §4) — usado pelo comprovante (`TASK-MWG-FE-08`). */
  movements: ModuleWeighingMovementItem[];
}

// ============================================
// PAYLOAD DE ESCRITA (POST/PUT, RT-003/RT-006) — SOMENTE os campos
// aceitos do cliente (contrato API §3): `farmId`/`tenantId`/`status`/`final_weight`/
// `classification_discount`/`average_cost`/`total`/`dfe_uuid`/`nfe_uuid`/
// `transfer_uuid`/`warehouse_out_uuid` NUNCA entram aqui — são
// system-managed, resolvidos pelo servidor.
// ============================================

export interface ModuleWeighingPayload {
  date: string;
  product_uuid: string;
  /** Nullable, `required_unless(type, Avulsa)` — contrato API §3. */
  warehouse_uuid: string | null;
  provider_uuid: string;
  equipment_uuid: string;
  // `employee_uuid` REMOVIDO do payload (correção 050, D1) — o legado nunca
  // aceita um funcionário escolhido aqui (`user_id = Auth::id()`, texto
  // readonly em tela); o servidor passa a resolver o Responsável sozinho a
  // partir do usuário autenticado, sem receber nada do cliente.
  gross_weight: number | null;
  tare_weight: number | null;
  type: ModuleWeighingType;
  category: ModuleWeighingCategory;
  has_classification: boolean;
  classification: ModuleWeighingClassification | null;
  discount_table_uuid: string | null;
  measurement_uuid: string | null;
  note: string | null;
  provider_lot: string | null;
  // `lot` REMOVIDO do payload (correção 050, D2) — não é campo de form no
  // legado (`uniqid()` gerado no servidor, `Controller.php:306,935`); o
  // servidor passa a gerá-lo (mirror `CreateModuleWeighingAction`), nunca a
  // partir do payload do cliente. `provider_lot` continua sendo o único
  // campo de lote do usuário.
  expiration_date: string | null;
  area_uuid: string | null;
  /** Obrigatório quando `category=Externa` e `type∈{VendaSaida,EntradaTerceiros}` (grupo de validação #5). */
  client_uuid: string | null;
  /** Obrigatório quando aplicável (grupo de validação #6). */
  provider_buy_uuid: string | null;
  /** Obrigatório quando aplicável (grupo de validação #7). */
  farm_to_uuid: string | null;
}

/**
 * Representação React Hook Form do payload acima — Selects como `Option<string>`
 * (mirror `WarehouseTransferCreateForm`/`farm-schema.ts`). Estendida pela
 * `TASK-MWG-FE-03` (Criar/Editar) — a fundação só declara o shape para não
 * bloquear os tipos de schema/serviço que dependem dela.
 */
export interface ModuleWeighingForm {
  date: string;
  product: { value: string; label: string } | null;
  warehouse: { value: string; label: string } | null;
  provider: { value: string; label: string } | null;
  equipment: { value: string; label: string } | null;
  gross_weight: number | null;
  tare_weight: number | null;
  type: ModuleWeighingType | null;
  category: ModuleWeighingCategory | null;
  has_classification: boolean;
  discount_table: { value: string; label: string } | null;
  measurement: { value: string; label: string } | null;
  note: string | null;
  provider_lot: string | null;
  expiration_date: string | null;
  area: { value: string; label: string } | null;
  client: { value: string; label: string } | null;
  provider_buy: { value: string; label: string } | null;
  farm_to: { value: string; label: string } | null;
}

// ============================================
// WIZARD — hidratação (`GET .../next-step`, RT-008, TASK-MWG-FE-05) e
// avanço de etapa (`PUT .../next-step`, RT-009). Reconciliado nesta correção
// (execução 050, Bug 2) contra o backend REAL
// (`GetModuleWeighingNextStepHydrationAction`/`ModuleWeighingController::
// nextStep`, `GB.Cerne.Api`) — o `GET` devolve um envelope ANINHADO
// (`{ module_weighing, next_status, active_warehouses, discount_rules }`),
// achatado pelo adaptador do service (`module-weighing-service.ts`) para
// este shape; o `PUT` devolve o `ModuleWeighingResource` PLANO (sem
// `next_status`/`active_warehouses`/`discount_rules` — por isso o service
// não tenta remapear a resposta do `PUT` para este tipo, ver
// `advanceModuleWeighingStep`).
// ============================================

/** Faixa de desconto (`App\Models\DiscountRule`, via `discount_rules` do
 *  `GET next-step`) já filtrada pelo backend para a tabela/produto vinculados
 *  ao `ModuleWeighing` — NÃO é uma lista de tabelas para escolher (a tabela é
 *  fixada no pré-cadastro, `CreateOrUpdateModuleWeighing`); é a entrada para
 *  o cálculo/preview client-side (`classificationDiscountCalculator.ts`).
 *  Ordem preservada tal como a API devolveu (`GAP-PES-05`, nunca reordenar). */
export interface ModuleWeighingDiscountRuleRef {
  type: DiscountRuleType;
  initial_limit_percent: number;
  final_limit_percent: number;
  discount_percent: number;
}

/**
 * Hidratação idempotente da etapa corrente do wizard (armazéns ativos da
 * fazenda, regras de desconto aplicável, entidades já selecionadas) — GET
 * sem side-effect (fecha DV-014, contrato API §5.2). Inclui os campos
 * necessários para o front decidir a ordem de captura (`type`) e se a etapa
 * de classificação se aplica (`has_classification`).
 */
export interface ModuleWeighingNextStepHydration {
  uuid: string;
  /** Status JÁ PERSISTIDO do registro (`module_weighing.status`) — NUNCA use
   *  para decidir qual etapa do wizard renderizar (um registro recém-criado
   *  está em `status=1/PreCadastro`, mas a UI precisa mostrar a etapa de
   *  Pesagem Inicial). Use `next_status` para isso. */
  status: ModuleWeighingStatus;
  /** Próxima transição esperada pelo backend
   *  (`GetModuleWeighingNextStepHydrationAction::resolveNextStatus`) — FONTE
   *  ÚNICA para decidir a etapa corrente do wizard. `null` quando não há
   *  mais etapa (todas as capturas concluídas — hora de navegar para a
   *  Finalização). */
  next_status: ModuleWeighingStatus | null;
  type: ModuleWeighingType;
  category: ModuleWeighingCategory;
  code: string;
  /** Produto já selecionado no pré-cadastro — usado pela etapa de
   *  Classificação (`TASK-MWG-FE-06`) para localizar as faixas de desconto
   *  do produto dentro da tabela selecionada. */
  product_uuid: string | null;
  gross_weight: number | null;
  tare_weight: number | null;
  has_classification: boolean;
  classification: ModuleWeighingClassification | null;
  discount_table: ModuleWeighingDiscountTableRef | null;
  measurement: ModuleWeighingMeasurementRef | null;
  equipment_tara: number | null;
  /** Armazéns ativos da fazenda — hidratação da etapa (contrato API §5.2). */
  warehouses: ModuleWeighingWarehouseRef[];
  /** Faixas de desconto (`discount_rules`) da tabela já fixada no
   *  pré-cadastro, filtradas pelo backend para o produto vinculado — usado
   *  pela etapa de Classificação (`TASK-MWG-FE-06`) quando
   *  `has_classification=true` para o preview de desconto. */
  discount_rules: ModuleWeighingDiscountRuleRef[];
}

/**
 * Payload de avanço de etapa (`PUT next-step`) — SOMENTE o campo capturado
 * na etapa corrente (peso bruto OU tara, conforme a ordem por `type`) e,
 * quando aplicável, a classificação completa (`TASK-MWG-FE-06`). Peso
 * líquido/desconto são SEMPRE calculados/persistidos pelo servidor — nunca
 * enviados aqui (contrato de tela §6.1). Reconciliado contra
 * `AdvanceModuleWeighingStepData` (backend real): `has_classification`/
 * `discount_table_uuid` NUNCA são aceitos por este endpoint (a tabela de
 * desconto é fixada no pré-cadastro, não neste passo) — removidos aqui para
 * não enviar campos que o backend ignora silenciosamente.
 */
export interface AdvanceModuleWeighingStepPayload {
  gross_weight?: number | null;
  tare_weight?: number | null;
  classification?: ModuleWeighingClassification | null;
}

// ============================================
// FINALIZAÇÃO (`GET/PUT .../finish`, RT-010/RT-011, TASK-MWG-FE-07).
// Reconciliado nesta correção (execução 050, Bug "Finalização") contra o
// backend REAL (`GetModuleWeighingFinishHydrationAction`/
// `ModuleWeighingController::finish`) — mesmo formato aninhado do `GET
// next-step` (`{ module_weighing, eligible_dfes }`), achatado pelo adaptador
// do service. O backend NÃO expõe `dfe_lookup_unavailable` (GAP-PES-08 não
// implementou esse sinalizador — só devolve `eligible_dfes: []` quando não
// há elegíveis ou os dados do fornecedor/tenant são insuficientes) — o
// adaptador do service sempre resolve `false` (lista vazia já é um estado
// honesto, não um erro).
// ============================================

/** Candidato de DFe elegível para vínculo no finalize (`type=CompraEntrada`,
 *  GAP-PES-08 — coordenação com a feature DFe deste mesmo lote, resolvida
 *  via `uuid`/API própria de `dves`). Handoff: esta tela só EXIBE a lista e
 *  envia `dfe_uuid` escolhido — nenhuma lógica de emissão/parse aqui.
 *  `issue_date` não é devolvido pelo backend real (`GetModuleWeighingFinish
 *  HydrationAction::eligibleDfes` só seleciona `id,uuid,number,razao_social`)
 *  — permanece `null` (estado honesto, nunca inventado). */
export interface ModuleWeighingEligibleDfe {
  uuid: string;
  number: string | null;
  issuer_name: string | null;
  issue_date: string | null;
}

export interface ModuleWeighingFinishHydration {
  uuid: string;
  status: ModuleWeighingStatus;
  type: ModuleWeighingType;
  code: string;
  gross_weight: number | null;
  tare_weight: number | null;
  final_weight: number | null;
  measurement_name: string | null;
  classification_discount: number | null;
  average_cost: number | null;
  total: number | null;
  /** `true` → lista de DFe indisponível no momento (GAP-PES-08) — a tela
   *  mostra estado vazio explícito, NUNCA erro/crash. Backend real nunca
   *  sinaliza isto explicitamente (ver nota acima) — sempre `false`. */
  dfe_lookup_unavailable: boolean;
  eligible_dfes: ModuleWeighingEligibleDfe[];
}

export interface FinalizeModuleWeighingPayload {
  /** `uuid` do DFe escolhido na lista de elegíveis (`type=CompraEntrada`) —
   *  omitido/`null` quando não aplicável ou o usuário não vinculou nenhum. */
  dfe_uuid?: string | null;
}

// ============================================
// RELATÓRIO (`GET /module-weighings-report`, RT-015, TASK-MWG-FE-09) — todos
// os filtros OPCIONAIS (`FM-006..FM-012`). `type` é `number` real (incluindo
// `0`), NUNCA string vazia — não reintroduzir DV-006 no client mesmo que o
// backend já corrija na origem (`isset()`).
// ============================================

export interface ModuleWeighingReportFilterRequest {
  start_date?: string;
  end_date?: string;
  type?: ModuleWeighingType;
  category?: ModuleWeighingCategory;
  warehouse_uuid?: string;
  product_uuid?: string;
  client_uuid?: string;
}

/** UT-000715 / TASK-FE-715-01 / D-097-08 — payload de `GET module-weighings/{uuid}/nfe` (ARQ-API-715).
 *  `gross_weight` = bruto REAL da pesagem; `net_weight` e `items[].quantity` = `final_weight` (líquido).
 *  Valores decimais chegam como string numérica: coagir com `Number()` no consumidor. */
export interface ModuleWeighingNfePrefill {
  module_weighing_uuid: string;
  gross_weight: number | string | null;
  net_weight: number | string | null;
  measurement_uuid?: string | null;
  items: {
    product_uuid: string;
    quantity: number | string;
    amount: number | string;
    warehouse_uuid: string | null;
  }[];
  block_financial?: boolean;
}
