// src/pages/Operacional/VendaAnimais/useMovementSales.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de VENDA DE ANIMAIS (MovementSale) — mesmo padrão
// de `Operacional/Romaneios/useRomaneios.tsx`:
//   - useMovementSalesList → useCustomGridQuery (listagem paginada real de
//     servidor + filtro `type_sale`, TASK-VD-FE-01).
//   - useMovementSaleDetail → useCustomFormQueryByGuid (hidratação read-only
//     da tela de Detalhe — sem `useForm`, mesmo racional de
//     `useTransferDetail`/`RomaneioDetalhe.tsx`).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  downloadMovementSaleWeighingTemplate,
  finalizeMovementSaleSlaughter,
  finalizeMovementSalesSlaughterMany,
  getMovementSaleByUuid,
  getMovementSalePendingSlaughter,
  issueMovementSaleNfe,
  listMovementSalePaymentTypeOptions,
  listMovementSales,
  listMovementSalesPendingSlaughterMany,
  parseMovementSaleWeighingSpreadsheet,
  storeMovementSaleDocuments,
} from '@/services/v2/MovementSales/movement-sale-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { Response } from '@/@types/response-api';
import type {
  MovementSaleAllocationRowForm,
  MovementSaleCategoryAggregate,
  MovementSaleCategoryAggregateForm,
  MovementSaleCategoryPayload,
  MovementSaleDetail,
  MovementSaleDocumentRow,
  MovementSaleFilterForm,
  MovementSaleForm,
  MovementSaleIncome,
  MovementSaleInstallmentRowForm,
  MovementSaleItem,
  MovementSaleItemForm,
  MovementSaleItemPayload,
  MovementSaleListItem,
  MovementSaleNfeHandoffPayload,
  MovementSalePayload,
  MovementSalePricingType,
  MovementSaleSlaughterManyPayload,
  MovementSaleSlaughterPayload,
  MovementSaleWeighingParseRow,
} from '@/@types/v2/MovementSales';

interface UseMovementSalesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MovementSaleFilterForm;
}

export function useMovementSalesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMovementSalesListProps) {
  return useCustomGridQuery<MovementSaleListItem, MovementSaleFilterForm>({
    asyncFunction: listMovementSales,
    queryKey: queryKey.movementSales.movementSales,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MovementSaleFilterForm),
  });
}

// Tela de VISUALIZAÇÃO read-only (contrato de tela §6) — SEM `useForm`
// (GAP-VENDAS mirror `RomaneioDetalhe.tsx`/`GAP-TRF-FE-10`): a tela lê
// `.data` direto, `fillForm` é um no-op deliberado (nunca chamado de fato em
// modo leitura pura).
export function useMovementSaleDetail(movementSaleUuid: string | undefined) {
  return useCustomFormQueryByGuid<MovementSaleDetail>({
    registrationId: movementSaleUuid,
    asyncFunction: getMovementSaleByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.movementSales.movementSale,
  });
}

// -----------------------------------------------------------------------------
// Options de forma de pagamento (`type_payment`, TASK-VD-FE-03, PARADA-FE-1
// aceita — backend TASK-41 ✅) — `GET /movement-sales/payment-types/options`,
// sem paginação, `staleTime` alto (catálogo fiscal estático, mesmo racional
// de `useChargeItemWarehouseOptions`, `Operacional/Carregamento/
// useCarregamentos.tsx`). `retry: false` — em erro, o consumidor
// (`CreateOrUpdateMovementSale.tsx`/`FinishMovementSale.tsx`) cai
// SILENCIOSAMENTE no catálogo local `movementSaleTypePaymentOptions`
// (`isError` → fallback), nunca select vazio.
// -----------------------------------------------------------------------------
export function useMovementSalePaymentTypeOptions() {
  return useQuery({
    queryKey: [queryKey.movementSales.movementSale, 'payment-type-options'],
    queryFn: () => listMovementSalePaymentTypeOptions(),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// Hidratação do formulário de Criar/Editar (TASK-VD-FE-02, contrato §7) —
// mesmo racional de `useTransferForm`/`CreateOrUpdateRomaneio.tsx`: só
// habilita a query em modo edição (`registrationId` presente); `fillForm` é
// a função NOMEADA com guarda `dirtyFields`/`resetForce` da própria tela
// (Lei 2), passada pelo caller.
export interface UseMovementSaleFormProps {
  registrationId: string | undefined;
  fillForm: (data: MovementSaleDetail, resetForce?: boolean) => void;
}

export function useMovementSaleForm({ registrationId, fillForm }: UseMovementSaleFormProps) {
  return useCustomFormQueryByGuid<MovementSaleDetail>({
    registrationId,
    asyncFunction: getMovementSaleByUuid,
    fillForm,
    queryKey: queryKey.movementSales.movementSale,
  });
}

// -----------------------------------------------------------------------------
// Fábricas de item/categoria + montagem do payload de escrita (TASK-VD-FE-02,
// contrato §7.2/§7.3/§7.8) — mirror estrutural de `transferItemToForm`/
// `buildTransferItemPayload`/`createEmptyTransferItem` (`useRomaneios.tsx`).
//
// Fator de conversão Kg↔Arroba do form principal (`CV2`,
// `WeightConversion::KG_TO_ARROBA_MAIN_FACTOR`) — NUNCA o fator 15 da
// finalização de abate (`CV3`, fora do escopo desta Tarefa).
// -----------------------------------------------------------------------------

const KG_TO_ARROBA_MAIN_FACTOR = 30;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Hidratação de item (edição) — `gain`/`gmd` vêm PRONTOS do servidor
// (recalculados a cada leitura, `GetMovementSaleAction`); `previous_weight_kg`/
// `entry_date` NÃO são devolvidos pelo Resource — permanecem `null` até o
// usuário RESSELECIONAR o animal na linha (`MovementSaleItemRow.tsx`, que
// então busca `getAnimalByUuid` de novo). SEM MOCK — nunca fabricado.
export function movementSaleItemDetailToForm(item: MovementSaleItem): MovementSaleItemForm {
  return {
    animal_uuid: item.animal
      ? { label: item.animal.identification ?? item.animal.uuid, value: item.animal.uuid }
      : null,
    category_uuid: item.category
      ? { label: item.category.description ?? item.category.uuid, value: item.category.uuid }
      : null,
    previous_weight_kg: null,
    entry_date: null,
    weight_kg: item.weight_kg,
    performance: item.performance,
    gain: item.gain,
    gmd: item.gmd,
    carcass_weight: item.carcass_weight,
    note: item.note ?? '',
  };
}

export function movementSaleCategoryDetailToForm(
  category: MovementSaleCategoryAggregate
): MovementSaleCategoryAggregateForm {
  return {
    category_uuid: category.uuid,
    description: category.description ?? '',
    quantity: category.quantity,
    value_real: category.value_real,
    value_arroba: category.value_arroba,
    value_head: category.value_head,
    value_total: category.value_total,
  };
}

// -----------------------------------------------------------------------------
// Reidratação financeira na edição (VD-FE-04, `GAP-API-FE-01` fechado pela
// api — `MovementSaleResource.incomes[]`) — `fillMovementSaleForm`
// (`CreateOrUpdateMovementSale.tsx`) consome os 2 mappers abaixo.
// -----------------------------------------------------------------------------

// Parcelamento — 1 `MovementSaleIncome` (parcela física) = 1 linha do form,
// ordenada por `installment` (o servidor já devolve na ordem de criação, mas
// a ordenação explícita evita depender disso). Mirror direto do shape de
// escrita (`date_installments[]`/`value_installments[]`).
export function movementSaleIncomesToInstallmentsForm(
  incomes: MovementSaleIncome[]
): MovementSaleInstallmentRowForm[] {
  return [...incomes]
    .sort((a, b) => a.installment - b.installment)
    .map((income) => ({ date: income.due_date, value: income.amount }));
}

// Rateio — TODAS as parcelas de uma venda carregam o MESMO conjunto de
// `allocations[]` (mirror `InsertFinancialAction`: cada parcela recebe
// `value = installmentValue * percent`, `percent` idêntico em todas as
// parcelas) — por isso a reidratação usa a PRIMEIRA parcela para descobrir
// as linhas (categoria/centro/conta) e SOMA o `value` de cada linha através
// de TODAS as parcelas (mais preciso que `percent * total`, absorve
// arredondamento residual do parcelamento). O Resource só devolve `uuid` (sem
// descrição/código embutidos) — o rótulo exibido nasce como o PRÓPRIO uuid
// (nunca inventado) e é resolvido para o rótulo real (código — descrição) por
// `MovementSaleIncomeAllocation.tsx` ao montar (mesma mecânica de
// `IncomeApportionmentTab.tsx`, 1 lookup por uuid ainda não resolvido).
export function movementSaleIncomeAllocationsToForm(
  incomes: MovementSaleIncome[]
): MovementSaleAllocationRowForm[] {
  if (incomes.length === 0) return [];

  const [first] = incomes;

  return first.allocations.map((allocation, index) => {
    const totalValue = incomes.reduce(
      (sum, income) => sum + (income.allocations[index]?.value ?? 0),
      0
    );

    return {
      category_uuid: {
        label: allocation.financial_category_uuid,
        value: allocation.financial_category_uuid,
      },
      center_uuid: allocation.cost_center_uuid
        ? { label: allocation.cost_center_uuid, value: allocation.cost_center_uuid }
        : null,
      plan_account_uuid: allocation.plan_account_uuid
        ? { label: allocation.plan_account_uuid, value: allocation.plan_account_uuid }
        : null,
      value: round(totalValue, 2),
    };
  });
}

// `value_unit` — MESMA fórmula de `CreateMovementSaleItemsAction` (API),
// ignorada de qualquer forma no servidor, mas precisa ser um número válido
// ≥0 para passar `items.*.value_unit` (`required|numeric|min:0`).
export function computeMovementSaleItemValueUnit(
  pricingType: MovementSalePricingType,
  valueReal: number,
  valueHead: number,
  weightKg: number
): number {
  return pricingType === 2 ? valueHead : valueReal * (weightKg / KG_TO_ARROBA_MAIN_FACTOR);
}

// Achado de fidelidade (contrato §7.3, ver docblock de
// `MovementSaleCategoriesTab.tsx`) — o `MovementSaleRequest` real exige
// `value_real`/`value_arroba`/`value_head`/`value_unit` em CADA item, não só
// no array `categories`. O preço é digitado 1x por categoria na UI
// (`MovementSaleCategoriesTab.tsx`); esta função replica o valor da
// categoria do item em cada linha do payload. `quantity: 1`/`amount:
// value_unit` — inferência do Executor (campos `required` no servidor sem
// uso funcional aparente além de persistência, ver docblock de
// `@/@types/v2/MovementSales`).
export function buildMovementSaleItemPayload(
  item: MovementSaleItemForm,
  categories: MovementSaleCategoryAggregateForm[],
  pricingType: MovementSalePricingType
): MovementSaleItemPayload {
  const category = categories.find((c) => c.category_uuid === item.category_uuid?.value);
  const valueReal = category?.value_real ?? 0;
  const valueArroba = category?.value_arroba ?? 0;
  const valueHead = category?.value_head ?? 0;
  const weightKg = item.weight_kg ?? 0;
  const valueUnit = round(
    computeMovementSaleItemValueUnit(pricingType, valueReal, valueHead, weightKg),
    2
  );

  return {
    animal_uuid: item.animal_uuid!.value,
    category_uuid: item.category_uuid!.value,
    weight_kg: weightKg,
    performance: item.performance ?? undefined,
    value_real: valueReal,
    value_arroba: valueArroba,
    value_head: valueHead,
    value_unit: valueUnit,
    amount: valueUnit,
    quantity: 1,
    note: item.note?.trim() || undefined,
    carcass_weight: item.carcass_weight ?? undefined,
  };
}

export function buildMovementSaleCategoryPayload(
  category: MovementSaleCategoryAggregateForm
): MovementSaleCategoryPayload {
  return {
    category_uuid: category.category_uuid,
    quantity: category.quantity,
    value_real: category.value_real ?? 0,
    value_arroba: category.value_arroba ?? 0,
    value_total: category.value_total,
    value_head: category.value_head ?? 0,
  };
}

// Monta o payload completo de escrita (`POST`/`PUT /movement-sales`) —
// `total_products`/`total` são RECALCULADOS aqui a partir de
// `categories`/`freight`/`other_values`/`discount` (mesma fórmula de
// `MovementSaleTotalsBlock.tsx`) — mirror do racional de Romaneios (bloco
// Totais é prévia pura, nunca um campo do form persistido por `setValue`).
// `has_financial`/`financial.*` — TASK-VD-FE-04 (fundação compartilhada,
// GAP-VENDAS-FE-04/-05): shape REAL da API (`financial.date_installments[]`/
// `value_installments[]`/`vl_total`/`income_categories[]`/`income_centers[]`/
// `income_category_values[]`), lido de `financial_allocations`/
// `financial_installments` (`MovementSaleIncomeAllocation`/
// `MovementSaleInstallmentsSection`, Tarefas 22/23) — SEM a parcela única
// fabricada anteriormente. Percentuais (`category_percent_values[]` do
// legado) são calculados no submit e NUNCA enviados (mirror
// `CreateFarmTransfer.tsx:303-329`). Os 2 campos ainda são `undefined` até
// as Tarefas 22/23 montarem os componentes nas telas — tratados como `[]`.
export function buildMovementSalePayload(data: MovementSaleForm): MovementSalePayload {
  const pricingType = (data.pricing_type?.value ?? 1) as MovementSalePricingType;

  const categoriesPayload = data.categories.map(buildMovementSaleCategoryPayload);
  const totalProducts = round(
    categoriesPayload.reduce((sum, category) => sum + category.value_total, 0),
    2
  );
  const total = round(totalProducts + data.freight + data.other_values - data.discount, 2);

  const payload: MovementSalePayload = {
    dt_sale: data.dt_sale,
    client_uuid: data.client_uuid!.value,
    seller_uuid: data.seller_uuid?.value,
    batch_sale: data.batch_sale,
    batch_id_sale_uuid: data.batch_sale ? (data.batch_uuid?.value ?? undefined) : undefined,
    type_sale: data.type_sale!.value,
    pricing_type: pricingType,
    type_payment: data.type_payment!.value,
    gtas: data.gtas?.trim() || undefined,
    note: data.note?.trim() || undefined,
    total_products: totalProducts,
    freight: data.freight,
    other_values: data.other_values,
    discount: data.discount,
    total,
    items: data.items.map((item) =>
      buildMovementSaleItemPayload(item, data.categories, pricingType)
    ),
    categories: categoriesPayload,
    has_financial: data.has_financial,
  };

  if (data.has_financial) {
    const allocations = data.financial_allocations ?? [];
    const installments = data.financial_installments ?? [];

    payload.financial = {
      date_installments: installments.map((installment) => installment.date ?? ''),
      value_installments: installments.map((installment) => Number(installment.value) || 0),
      vl_total: total,
      income_categories: allocations.map((allocation) => allocation.category_uuid!.value),
      income_centers: allocations.map((allocation) => allocation.center_uuid!.value),
      income_category_values: allocations.map((allocation) => Number(allocation.value) || 0),
      // VD-API-03 (`GAP-API-FE-03`) — Conta Contábil opcional por linha,
      // `null` quando a linha não tem conta vinculada (mirror `income_centers`).
      income_plan_accounts: allocations.map(
        (allocation) => allocation.plan_account_uuid?.value ?? null
      ),
    };
  }

  return payload;
}

// -----------------------------------------------------------------------------
// Finalização de abate (TASK-VD-FE-03, contrato §8) — mirror
// `useAppropriationForm`/`useFinishAppropriation` (`Operacional/
// Appropriations/useAppropriations.tsx`).
// -----------------------------------------------------------------------------

export interface UseMovementSaleFinishFormProps {
  registrationId: string | undefined;
  fillForm: (data: MovementSaleDetail, resetForce?: boolean) => void;
}

// `GET /movement-sales/{uuid}/slaughter` (`GetPendingSlaughterAction`,
// 404 se a venda não estiver `status=Pendente`) — dedicado à Finalização
// individual (`FinishMovementSale.tsx`), distinto de `useMovementSaleForm`
// (que usa `GET /movement-sales/{uuid}`, sem o guard de status no servidor).
export function useMovementSaleFinishForm({
  registrationId,
  fillForm,
}: UseMovementSaleFinishFormProps) {
  return useCustomFormQueryByGuid<MovementSaleDetail>({
    registrationId,
    asyncFunction: getMovementSalePendingSlaughter,
    fillForm,
    queryKey: queryKey.movementSales.movementSale,
  });
}

// `GET /movement-sales/slaughter-many?sale_uuids[]=...` — busca EM UMA ÚNICA
// CHAMADA todas as vendas `status=Pendente` do lote (`FinishMovementSaleMany.
// tsx`, ver achado de fidelidade em `movement-sale-service.ts`: diverge da
// leitura do contrato de tela §8.2 de `Promise.allSettled` por venda — o
// endpoint real já devolve o lote inteiro).
export function useMovementSalesPendingSlaughterMany(saleUuids: string[]) {
  return useQuery({
    queryKey: [queryKey.movementSales.movementSale, 'slaughter-many', saleUuids],
    queryFn: async () => {
      const response = await listMovementSalesPendingSlaughterMany(saleUuids);
      return response.data;
    },
    enabled: saleUuids.length > 0,
    retry: false,
  });
}

interface UseFinishMovementSaleProps {
  actionSuccess: (data: MovementSaleDetail) => void;
}

// `PUT /movement-sales/{uuid}/slaughter` — finalização INDIVIDUAL
// (`FinalizeSlaughterAction`, fator 15, `GAP-VD-04`).
export function useFinishMovementSale({ actionSuccess }: UseFinishMovementSaleProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale;

  return useRequest<MovementSaleDetail>({
    asyncFunction: async ({
      uuid,
      payload,
    }: {
      uuid: string;
      payload: MovementSaleSlaughterPayload;
    }) => {
      return await finalizeMovementSaleSlaughter(uuid, payload);
    },
    queryKey: queryKey.movementSales.movementSales,
    queryKey2: queryKey.movementSales.movementSale,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.finish.finishedToast,
    actionSuccess,
  });
}

interface UseFinishMovementSaleManyProps {
  actionSuccess: (data: MovementSaleDetail[]) => void;
}

// `PUT /movement-sales/slaughter-many` — finalização EM LOTE
// (`FinalizeSlaughterManyAction`, distribuição proporcional com correção de
// resíduo, `CV6` — feita PELO SERVIDOR).
export function useFinishMovementSaleMany({ actionSuccess }: UseFinishMovementSaleManyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale;

  return useRequest<MovementSaleDetail[]>({
    asyncFunction: async (payload: MovementSaleSlaughterManyPayload) => {
      return await finalizeMovementSalesSlaughterMany(payload);
    },
    queryKey: queryKey.movementSales.movementSales,
    queryKey2: queryKey.movementSales.movementSale,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.finishMany.finishedToast,
    actionSuccess,
  });
}

// -----------------------------------------------------------------------------
// Documentos (Tarefa 17.b, task-packet §3/§6, matriz FID-G3F #1) —
// `POST /movement-sales/{uuid}/documents`. `useRequest` (não `useMutation`
// direto): é um formulário completo com entidade nomeável e feedback formal
// (`get_pwa_mutation_query_pattern`), invalidando detalhe + listagem (a
// resposta devolve o `MovementSaleResource` inteiro, §1.6 da Tarefa).
// -----------------------------------------------------------------------------

export interface UseStoreMovementSaleDocumentsProps {
  actionSuccess: (data: MovementSaleDetail) => void;
}

export function useStoreMovementSaleDocuments({
  actionSuccess,
}: UseStoreMovementSaleDocumentsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale;

  return useRequest<MovementSaleDetail>({
    asyncFunction: async ({
      uuid,
      documents,
    }: {
      uuid: string;
      documents: MovementSaleDocumentRow[];
    }) => {
      return await storeMovementSaleDocuments(uuid, documents);
    },
    queryKey: queryKey.movementSales.movementSale,
    queryKey2: queryKey.movementSales.movementSales,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.documents.savedToast,
    actionSuccess,
  });
}

// -----------------------------------------------------------------------------
// Emitir NFe — HANDOFF (Tarefa 17.c, task-packet §3/§6, matriz FID-G3F #3) —
// `POST /movement-sales/{uuid}/nfe-issue`. `useMutation` DIRETO (não
// `useRequest`): a ação NÃO persiste nada no servidor (DEC-022 — devolve só
// um payload de handoff, mirror `session('nfe')` do legado), então não há
// "entidade nomeável" para um toast de sucesso formal, nem queryKey a
// invalidar (nada mudou no estado da venda — a lista NÃO perde o item, o
// `MovementSaleResource` continua sem `nfe_id`). Mesmo racional de "ação sem
// necessidade de toast (efeito silencioso)" do `get_pwa_mutation_query_pattern`
// — o caller navega imediatamente para `/fiscal/nfe-emitidas/novo` com o
// payload recebido, e trata erro localmente (`mutate(uuid, { onError })`).
// -----------------------------------------------------------------------------

export function useIssueMovementSaleNfe() {
  return useMutation<Response<MovementSaleNfeHandoffPayload>, unknown, string>({
    mutationFn: async (uuid: string) => issueMovementSaleNfe(uuid),
  });
}

// -----------------------------------------------------------------------------
// Importação de Pesagem (VD-FE-01, contrato §3.2 FALTA-A, SURF-PNL-001) —
// `useMutation` DIRETO (não `useRequest`), mesmo racional de
// `useIssueMovementSaleNfe`: NENHUMA persistência no servidor (`SE-013`), sem
// "entidade nomeável" para um toast formal e sem queryKey a invalidar (nada
// muda no estado da venda — o peso só grava ao salvar via `store`/`update`
// já existentes). O caller (`MovementSaleWeighingImportPanel.tsx`) trata
// sucesso/erro localmente (download do blob / reconciliação por
// `animal_uuid` + toast próprio).
// -----------------------------------------------------------------------------

export function useDownloadMovementSaleWeighingTemplate() {
  return useMutation<Blob, unknown, string[]>({
    mutationFn: async (animalUuids: string[]) => downloadMovementSaleWeighingTemplate(animalUuids),
  });
}

export function useParseMovementSaleWeighing() {
  return useMutation<Response<MovementSaleWeighingParseRow[]>, unknown, File>({
    mutationFn: async (file: File) => parseMovementSaleWeighingSpreadsheet(file),
  });
}
