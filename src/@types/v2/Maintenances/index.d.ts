// src/@types/v2/Maintenances/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Gestão de Frota — Manutenções (Maintenance, F-103) —
// execução 97-Esteiras/010, Tarefas front 43/44/45. Header reaproveitado de
// `Appropriation` (mirror `Supplies`/`MaintenancePreventives`, MESMO módulo
// "Gestão de Frota"), cada item mistura equipamento + (opcional) consumo de
// estoque + (opcional) custo de mão de obra (Funcionário OU Fornecedor).
// Modelado por leitura direta do contrato de API desenhado pelo
// `gb-cerne-api-architect-v2` (`06-Tarefas_Backend/43-manutencoes-api-core.md`/
// `44-manutencoes-api-financeiro.md`, CONTRATO_AUTOAPROVADO — backend em
// implementação nesta mesma execução).
//
//   GET    /maintenances                          → paginado (listagem)
//   POST   /maintenances                          → 201, permission
//                                                    maintenances_create
//   GET    /maintenances/{uuid}                   → detalhe (show — reusado
//                                                    para hidratar a Edição,
//                                                    sem GET .../edit)
//   PUT    /maintenances/{uuid}                   → 200, full-replace de
//                                                    items[]
//   DELETE /maintenances/{uuid}                   → 204
//   POST   /maintenances/{uuid}/generate-financial → 201, permission
//                                                    maintenances_generate_financial
//                                                    (Tarefa 45)
//
// `id` sequencial NUNCA exposto — sempre `uuid` (Lei 10). `code`/`user_id`/
// `farm_id`/`amount`/`total_amount`/`employee_amount`/`employee_total_amount`
// NUNCA fazem parte do payload de escrita (calculados/atribuídos
// server-side, `ConsumeMaintenanceStockForItemAction`/
// `CalculateMaintenanceEmployeeCostAction` — FID-G3F §3, não reproduzir
// CL-26: nenhuma fórmula de recálculo é reimplementada em TS).
//
// CORREÇÃO (Erro Frontend, execução 010, pós-Tester/pré-PR, decisão do
// dono) — `requester_user_uuid` foi REMOVIDO de `MaintenanceForm` e de
// `MaintenancePayload`. O campo "Requisitante" deixou de ser controlável
// pelo cliente: o backend agora SEMPRE grava `Auth::id()` no create e
// NUNCA aceita troca de requisitante no update (a Action ignora qualquer
// valor enviado). A tela (`CreateOrUpdateManutencao.tsx`) só EXIBE o
// requisitante em `InputReadOnly` (CREATE = usuário autenticado via
// `useAuth`, EDIT = `MaintenanceDetail.requester.name` já hidratado — ver
// leitura abaixo, que não muda).
//
// CORREÇÃO (Erro Frontend, execução 010) — `MaintenanceResource::toArray()`
// (backend) expõe a chave `requester` (`{uuid, name} | null`, via
// `whenLoaded('user')`), NUNCA `user` nem `employee` soltos no JSON.
// `MaintenanceListItem` abaixo foi corrigido para casar com o Resource real
// — a leitura anterior (`data.user`/`data.employee`) nunca existia na
// resposta e por isso o "Requisitante" chegava sempre vazio na Edição/
// Visualização. Achado de backend separado (fora deste mandato, reportado
// ao Maestro): o Resource só deriva `requester` de `user_id` — registros
// reais migrados do legado com `employee_id` preenchido e `user_id` nulo
// (cabeçalho de Manutenção originado de um Funcionário) NUNCA aparecerão
// como Requisitante até o backend também considerar essa origem.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (leitura — mirror shape enxuto de outros módulos)
// ============================================

export interface MaintenancePersonRef {
  uuid: string;
  name: string;
}

export interface MaintenanceDescribedRef {
  uuid: string;
  description: string;
}

export interface MaintenanceMeasurementRef {
  uuid: string;
  name: string;
}

// ============================================
// ITEM (linha do cabeçalho — resposta, contrato Tarefa 43 backend §"MaintenanceItemResource")
// ============================================

export interface MaintenanceItemListData {
  /** O `MaintenanceItemResource` NÃO expõe `uuid` de item — não inventar. */
  equipment: MaintenanceDescribedRef;
  hour_meter: number | null;
  mileage: number | null;
  warehouse: MaintenanceDescribedRef | null;
  product: MaintenanceDescribedRef | null;
  measurement: MaintenanceMeasurementRef | null;
  quantity: number | null;
  amount: number | null;
  total_amount: number | null;
  executor_type: 'employee' | 'provider' | null;
  employee: MaintenancePersonRef | null;
  provider: MaintenancePersonRef | null;
  /** Custo de mão de obra própria — SEMPRE o valor devolvido pelo servidor
   *  (`CalculateMaintenanceEmployeeCostAction`). NUNCA recalcular no client
   *  (FID-G3F §3, GAP-MNT-02 — não reproduzir CL-26). */
  employee_amount: number | null;
  employee_total_amount: number | null;
  /** ASSUNÇÃO documentada (Executor, Tarefa 44) — a Tarefa front 43 NÃO
   *  listou `employee_quantity`/`provider_total` no shape de leitura, mas
   *  ambos são colunas persistidas no pivot (`SyncMaintenanceItemsAction`
   *  grava o array completo retornado por
   *  `CalculateMaintenanceEmployeeCostAction`, que inclui
   *  `employee_quantity`; `provider_total` é o valor digitado, também
   *  persistido). Sem os dois, a hidratação da Edição perderia o valor ao
   *  reabrir um item existente. Tipados como opcionais/nulos para não
   *  quebrar se o Resource real de fato os omitir — CONFIRMAR no Tester
   *  (`GET /maintenances/{uuid}` real) antes de fechar como ✅. */
  employee_quantity?: number | null;
  provider_total?: number | null;
  note: string | null;
}

// ============================================
// SHAPE REAL DA API (UT-000684) — `MaintenanceItemResource` devolve o
// executor ANINHADO. `mapMaintenanceItem` (maintenance-mapper.ts) normaliza
// para `MaintenanceItemListData` (plano) uma única vez, no service.
// ============================================

export type MaintenanceItemExecutorApi =
  | {
      type: 'employee';
      employee: MaintenancePersonRef | null;
      quantity: number | string | null;
      amount: number | string | null;
      total_amount: number | string | null;
    }
  | {
      type: 'provider';
      provider: MaintenancePersonRef | null;
      total_amount: number | string | null;
    };

export interface MaintenanceItemApi {
  equipment: MaintenanceDescribedRef;
  hour_meter: number | string | null;
  mileage: number | string | null;
  warehouse: MaintenanceDescribedRef | null;
  product: MaintenanceDescribedRef | null;
  measurement: MaintenanceMeasurementRef | null;
  quantity: number | string | null;
  amount: number | string | null;
  total_amount: number | string | null;
  executor: MaintenanceItemExecutorApi | null;
  note: string | null;
}

export interface MaintenanceDetailApi {
  uuid: string;
  code: string;
  date: string;
  requester: MaintenancePersonRef | null;
  has_financial?: boolean;
  items: MaintenanceItemApi[];
}

// ============================================
// LISTAGEM / DETALHE (`GET /maintenances`, `GET /maintenances/{uuid}` —
// mesmo shape, mirror `SupplyListItem`/`SupplyDetail`)
// ============================================

export interface MaintenanceListItem {
  uuid: string;
  code: string;
  date: string;
  /** Chave real do `MaintenanceResource` (`whenLoaded('user')`) — carrega o
   *  `requester_user_uuid` resolvido no create/update, NÃO o autor da
   *  mutação (`Auth::id()` não entra no payload/Resource). `null` quando a
   *  relação `user` não resolve nenhum registro (ver nota de cabeçalho —
   *  achado de backend separado sobre `employee_id` migrado do legado). */
  requester: MaintenancePersonRef | null;
  /** Aditivo (UT-000684, API): já existe despesa gerada para a manutenção.
   *  Opcional — ausência é tratada como `false`. Só vem no detalhe. */
  has_financial?: boolean;
  items: MaintenanceItemListData[];
}

/** Alias estrutural — `GET /maintenances/{uuid}` devolve o MESMO shape do
 *  item de listagem (mirror `SupplyDetail`, "sem reconversão adicional"). */
export type MaintenanceDetail = MaintenanceListItem;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface MaintenancesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaintenancesListEnvelope {
  success: boolean;
  message: string;
  data: MaintenanceDetailApi[];
  errors: Record<string, string[]> | null;
  meta: MaintenancesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, mirror FM-1/2/3 — `MaintenanceFilterData`)
// ============================================

export interface MaintenanceFilterForm {
  equipment_uuid?: string;
  /** Display-only — re-hidrata o drawer, NUNCA enviado à API. */
  equipment_label?: string;
  start_date?: string;
  end_date?: string;
}

export type MaintenanceFilterRequest = MaintenanceFilterForm;

// ============================================
// FORMULÁRIO (criar/editar — Tarefa 44, mirror `MaintenanceItemData`/
// `MaintenanceRequest` do backend). Declarado já na Tarefa 43 (fundação)
// para não fatiar o arquivo entre Tarefas — mirror da decisão já tomada em
// Suprimentos (38/39) e Abastecimentos (40/41).
// ============================================

/** Linha do formulário — `useFieldArray` (`MaintenanceItemsFieldArray.tsx`/
 *  `MaintenanceItemRow.tsx`). DISTINTO de `MaintenanceItemListData` (leitura)
 *  — shape de ESCRITA, mirror EXATO `MaintenanceItemData` do backend. Nenhum
 *  campo de `amount`/`total_amount`/`employee_amount`/`employee_total_amount`
 *  aqui — são calculados no servidor (FID-G3F §3/§6). */
export interface MaintenanceItemForm {
  equipment_uuid: Option<string> | null;
  /** Fallback herdado da Tarefa 41 de Abastecimentos (`EquipmentOption` não
   *  expõe `family_equipment_uuid`, IG-01) — campo SEMPRE visível, editável
   *  diretamente (sem cascata de último-registro, distinto de Supplies:
   *  não há `GET /maintenances/last-reading/{equipment}` no contrato). */
  hour_meter: number | null;
  mileage: number | null;
  warehouse_uuid: Option<string> | null;
  /** Option enriquecida por `listStockAvailability` (MESMO mecanismo de
   *  `SupplyItemForm.stock_uuid`), mas o `value` aqui é o `product.uuid`
   *  (não o uuid físico do registro de `Stock`) — o DTO backend
   *  (`MaintenanceItemData.product_uuid`) espera o produto, a resolução do
   *  registro de `Stock` (`resolveStock`) é feita 100% server-side. */
  product_uuid:
    | (Option<string> & {
        quantity?: number;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: 'M' | 'D' | null;
      })
    | null;
  measurement_uuid: Option<string> | null;
  /** 3 casas decimais (mirror `.money3`, GAP-MNT-04 — schema/DTO já
   *  corrigidos no backend, sem mismatch a esconder no client). */
  quantity: number | null;
  note: string | null;
  /** Item pode ser só de equipamento/estoque, sem custo de mão de obra —
   *  por isso `Option<'employee'|'provider'> | null`, nunca obrigatório. */
  executor_type: Option<'employee' | 'provider'> | null;
  employee_uuid: Option<string> | null;
  /** Horas — só quando `executor_type.value==='employee'`. NUNCA um campo
   *  de custo digitável (`employee_amount` é 100% calculado no servidor,
   *  GAP-MNT-02). */
  employee_quantity: number | null;
  provider_uuid: Option<string> | null;
  /** Custo total digitado — só quando `executor_type.value==='provider'`.
   *  Único dos 2 ramos que É digitado pelo usuário (mirror DTO backend
   *  `provider_total: float`). */
  provider_total: number | null;
}

export interface MaintenanceForm {
  date: string | null;
  /** SEM `requester_user_uuid` — ver nota de cabeçalho (correção, execução
   *  010). "Requisitante" não é mais um campo do formulário de escrita;
   *  a tela resolve o rótulo de exibição fora do `useForm` (`useAuth` no
   *  create, `MaintenanceDetail.requester` no edit). */
  items: MaintenanceItemForm[];
}

// ============================================
// PAYLOAD (wire de escrita — JSON puro, SEM multipart, mirror
// `MaintenanceItemData`/`MaintenanceData` do backend)
// ============================================

export interface MaintenanceItemPayload {
  equipment_uuid: string;
  hour_meter?: number;
  mileage?: number;
  warehouse_uuid?: string;
  product_uuid?: string;
  measurement_uuid?: string;
  quantity?: number;
  note?: string;
  executor_type?: 'employee' | 'provider';
  employee_uuid?: string;
  employee_quantity?: number;
  provider_uuid?: string;
  provider_total?: number;
}

export interface MaintenancePayload {
  date: string;
  /** SEM `requester_user_uuid` — removido do payload de escrita (correção,
   *  execução 010). O backend grava `Auth::id()` sozinho no create e
   *  ignora qualquer requisitante no update; o cliente não envia mais este
   *  campo. */
  items: MaintenanceItemPayload[];
}

// ============================================
// "GERAR FINANCEIRO" (Tarefa 45 — completado nesta mesma execução, mirror
// `GenerateMaintenanceFinancialProviderData`/`GenerateMaintenanceFinancialData`
// do backend). Reusa a INTERAÇÃO de `ExpenseApportionmentTab.tsx`/
// `ExpenseInstallmentsTab.tsx` (Contas a Pagar), tipo PRÓPRIO (não
// `ExpenseForm` — incompatível com o shape multi-fornecedor desta tela).
// ============================================

export interface GenerateFinancialCategoryForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  value: number | null;
}

export interface GenerateFinancialInstallmentForm {
  due_date: string | null;
  value: number | null;
}

export interface GenerateFinancialProviderForm {
  /** Fixo — vem dos itens da Manutenção (`items[].provider`), NUNCA um
   *  Select editável (mirror `provider_uuid: string` do DTO backend). */
  provider_uuid: string;
  /** Só para exibição no bloco (rótulo do fornecedor). */
  provider_label: string;
  number: string;
  type_title_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  note: string | null;
  fiscal_document: boolean;
  /** Referência do rateio (fechamento exato, tolerância 0) — preenchido
   *  pelo dev, opcionalmente pré-sugerido pela soma de `total_amount` dos
   *  itens daquele fornecedor (melhoria opcional, ver Tarefa 45 "Nota"). */
  total: number | null;
  categories: GenerateFinancialCategoryForm[];
  installments: GenerateFinancialInstallmentForm[];
}

export interface GenerateFinancialForm {
  providers: GenerateFinancialProviderForm[];
}

export interface GenerateFinancialCategoryPayload {
  category_uuid: string;
  center_uuid: string;
  value: number;
}

export interface GenerateFinancialInstallmentPayload {
  due_date: string;
  value: number;
}

export interface GenerateFinancialProviderPayload {
  provider_uuid: string;
  number: string;
  type_title_uuid: string;
  proprietary_uuid: string;
  note?: string;
  fiscal_document: boolean;
  total: number;
  categories: GenerateFinancialCategoryPayload[];
  installments: GenerateFinancialInstallmentPayload[];
}

export interface GenerateFinancialPayload {
  providers: GenerateFinancialProviderPayload[];
}
