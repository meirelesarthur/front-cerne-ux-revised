// src/pages/Operacional/Romaneios/useRomaneios.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ROMANEIOS (Transfer) — mesmo padrão de
// Administrativo/Equipes/useEquipes.tsx:
//   - useTransfersList → useCustomGridQuery (listagem paginada REAL de
//     servidor + busca numérica + 9 filtros do drawer, TASK-TRF-FE-01).
//   - useTransferForm → useCustomFormQueryByGuid (hidratação do formulário
//     criar/editar, TASK-TRF-FE-02, contrato de tela §5.7/§5.8).
//   - useTransferProviderCatalogOptions/useTransferProprietaryCatalogOptions →
//     satélites PLANOS (`providers/options`/`proprietaries/options`,
//     `Select` + `useQuery`, NUNCA `SelectAsyncPaginate` — armadilha #1 da
//     Tarefa). Gateados por `accounts_create|accounts_edit` (GAP-TRF-FE-14):
//     403 vira `isError`, tratado como degradação graciosa pela tela (select
//     desabilitado + hint), nunca erro fatal do formulário.
//   - useTransferItemWarehouseOptions/useTransferItemMeasurementOptions/
//     useTransferItemPackageOptions (TASK-TRF-FE-03) → satélites PLANOS da
//     linha de item (`warehouses/options?type=producao`,
//     `measurements/options`, `product-packages/options`), mesmo racional
//     `Select` + `useQuery`. `product_uuid`/`area_uuid` NÃO têm hook aqui —
//     são `SelectAsyncPaginate` ligados direto a `listProductOptions`/
//     `listAreas` (paginados, contrato §5.2), sem adaptação extra.
//   - createEmptyTransferExpense/transferExpenseToForm/
//     buildTransferExpensePayload (TASK-TRF-FE-04, contrato §5.6) — mesmo
//     racional das 3 fábricas irmãs de item. `useTransferItemWarehouseOptions`
//     é REUSADA para o armazém de despesa (`type: 'insumos'`, mesma função
//     genérica); `useTransferProviderCatalogOptions` é REUSADA para
//     `provider_uuid` da linha (mesmo catálogo/gate de `seller_uuid`). Os
//     catálogos PAGINADOS `reversal-expenses`/`service-expenses` (gate
//     `reversal_view`/`service_view`) NÃO têm hook aqui — `SelectAsyncPaginate`
//     ligado direto a `listReversalExpenses`/`listServiceExpenses`
//     (`RomaneioExpenseRow.tsx`), mesmo racional de `listProductOptions`.
//
// Sem Zustand (contrato de tela §1.4 / mirror GAP-EQ-FE-10) — paginação/
// filtro por `userPaginatedQuery` (Contexto React), dados de servidor só no
// TanStack Query. `items`/`expenses` viajam no `useFieldArray` do próprio
// `useForm` raiz (GAP-TRF-FE-02, aprovado) — não neste arquivo.
//
// Ordenação é FIXA `latest('id')`, imposta pelo servidor (contrato de tela
// §4.3) — nenhum `orderBy` é enviado por esta tela.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';
import {
  apropriationOptions,
  expensePayerOptions,
  expenseTypeOptions,
} from '@/constants/transfers/options';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listPackageOptions } from '@/services/v2/Packages/package-service';
import {
  finishTransfer,
  getTransfer,
  getTransferFinish,
  listTransfers,
} from '@/services/v2/Transfers/transfer-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  TransferDetail,
  TransferExpense,
  TransferExpenseForm,
  TransferExpensePayload,
  TransferFilterForm,
  TransferFinishDetail,
  TransferFinishPayload,
  TransferItem,
  TransferItemForm,
  TransferItemPayload,
  TransferListItem,
} from '@/@types/v2/Transfers';
import type { WarehouseTypeSlug } from '@/@types/v2/Warehouses';

interface UseTransfersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: TransferFilterForm;
}

// DD-078-04 — texto exibido quando o payload não traz o rótulo (nunca o uuid).
export const NOT_INFORMED_LABEL = 'Não informado';

export function useTransfersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseTransfersListProps) {
  return useCustomGridQuery<TransferListItem, TransferFilterForm>({
    asyncFunction: listTransfers,
    queryKey: queryKey.transfers.transfers,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as TransferFilterForm),
  });
}

interface UseTransferFormProps {
  registrationId: string | undefined;
  fillForm: (data: TransferDetail, resetForce?: boolean) => void;
}

// Hidratação do formulário criar/editar — `registrationId` inválido/ausente
// (rota "/novo") desabilita a query automaticamente (`isValidGuid` interno do
// hook), sem chamada de rede em modo criação.
export function useTransferForm({ registrationId, fillForm }: UseTransferFormProps) {
  return useCustomFormQueryByGuid<TransferDetail>({
    registrationId,
    asyncFunction: getTransfer,
    fillForm,
    queryKey: queryKey.transfers.transfer,
  });
}

// -----------------------------------------------------------------------------
// Hidratação da tela de VISUALIZAÇÃO read-only (TASK-TRF-FE-05, contrato de
// tela §6/§7.3) — MESMO endpoint e MESMA query key de `useTransferForm`
// (`queryKey.transfers.transfer`, cache compartilhado com o formulário: abrir
// "Visualizar" depois de "Editar" no mesmo romaneio não refaz o GET). Sem
// `fillForm` de verdade — a tela lê `.data` direto (sem `useForm`, GAP-TRF-FE-10
// — decisão de tela dedicada, não formulário desabilitado), então o parâmetro
// é um no-op deliberado, nunca chamado de fato pelo hook em modo leitura pura.
export function useTransferDetail(transferUuid: string | undefined) {
  return useCustomFormQueryByGuid<TransferDetail>({
    registrationId: transferUuid,
    asyncFunction: getTransfer,
    fillForm: () => undefined,
    queryKey: queryKey.transfers.transfer,
  });
}

interface UseCatalogOptionsProps {
  /** Em read-only (GAP-EQ-FE-04, mesmo racional) o endpoint gateado não é
   *  chamado — o rótulo já vem hidratado pelo `fillTransferForm` a partir do
   *  satélite resolvido (1 request por satélite, contrato §5.8). */
  enabled?: boolean;
}

// `GET /providers/options` — catálogo PLANO (armadilha #1 da Tarefa), gateado
// por `accounts_create|accounts_edit` (GAP-TRF-FE-14). Alimenta `seller_uuid`
// E `transporter_uuid` — 1 requisição reusada pelos dois selects, nunca uma
// por campo.
export function useTransferProviderCatalogOptions({ enabled = true }: UseCatalogOptionsProps = {}) {
  return useQuery({
    queryKey: ['transfers-form-provider-options'],
    queryFn: () => listProviderOptions({}),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// `GET /proprietaries/options` — catálogo PLANO, mesmo gate cruzado. Alimenta
// `proprietary_uuid`.
export function useTransferProprietaryCatalogOptions({
  enabled = true,
}: UseCatalogOptionsProps = {}) {
  return useQuery({
    queryKey: ['transfers-form-proprietary-options'],
    queryFn: () => listProprietaryOptions(),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// Satélites PLANOS da linha de item (TASK-TRF-FE-03, contrato §5.4) — SEM
// gate de permissão, `Select` + `useQuery` (armadilha #1, nunca
// `SelectAsyncPaginate`). Reusados por TODAS as linhas do repeater (1
// requisição só, nunca uma por linha).
// -----------------------------------------------------------------------------

// `GET /warehouses/options?type=producao` — 1ª opção "Sem estoque" é
// sintética, montada na própria `RomaneioItemRow.tsx` (sentinela
// `value: ''`), não faz parte da resposta do servidor.
export function useTransferItemWarehouseOptions(type: WarehouseTypeSlug) {
  return useQuery({
    queryKey: ['transfers-form-warehouse-options', type],
    queryFn: () => listWarehouseOptions({ type }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// `GET /measurements/options` — catálogo GLOBAL (não filtrado por produto,
// diferente de `InvoiceItemsTab.tsx` — contrato §5.4.1/§5.6 de Romaneios:
// `measurement_uuid` aceita qualquer unidade do catálogo, só é SEMEADA pela
// cascata produto→UM, nunca restringida a ela).
export function useTransferItemMeasurementOptions() {
  return useQuery({
    queryKey: ['transfers-form-measurement-options'],
    queryFn: () => listMeasurementOptions({}),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// `GET /product-packages/options` — catálogo GLOBAL, sempre habilitado
// (`FE-12`: a API não expõe o grupo do produto para replicar a trava do
// grupo 8 do legado). `listPackageOptions` já devolve o array PRONTO (sem
// paginação), mirror `listPackageOptions()` de `package-service.ts`.
export function useTransferItemPackageOptions() {
  return useQuery({
    queryKey: ['transfers-form-package-options'],
    queryFn: () => listPackageOptions(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// Fábrica de linha vazia (create inicia com 1 linha — contrato §5.4 "Adicionar
// / remover linha"; reusada pelo `defaultValues` do `useForm` raiz e pelo
// `handleAdd` de `RomaneioItemsTab.tsx`, nunca duplicada).
// -----------------------------------------------------------------------------
export function createEmptyTransferItem(): TransferItemForm {
  return {
    item_uuid: null,
    product_uuid: null,
    measurement_uuid: null,
    warehouse_uuid: null,
    package_uuid: null,
    lot: '',
    quantity: null,
    amount: null,
    total_amount: null,
    discard_kg: null,
    area_uuid: null,
    note: '',
    factor: null,
    factor_type: null,
    measurement_second: null,
  };
}

// -----------------------------------------------------------------------------
// Hidratação de uma linha existente (`fillTransferForm`/`CreateOrUpdateRomaneio.tsx`)
// — `item_uuid` SEMPRE preservado (armadilha #1: perder o uuid faz o servidor
// apagar/recriar a linha e movimentar estoque duas vezes). `factor`/
// `factor_type`/`measurement_second` ficam `null` — `TransferItem` (`GET`) NÃO
// os expõe (só `products/options` os traz); a cascata só resolve de fato
// quando o usuário reescolhe o produto nesta tela (hint some após reload até
// lá, degradação aceita — armadilha #8, `weight` não é campo persistido).
// -----------------------------------------------------------------------------
export function transferItemToForm(item: TransferItem): TransferItemForm {
  return {
    item_uuid: item.uuid,
    product_uuid: item.product
      ? { label: item.product.description, value: item.product.uuid }
      : null,
    measurement_uuid: item.measurement
      ? { label: item.measurement.description, value: item.measurement.uuid }
      : null,
    warehouse_uuid: item.warehouse
      ? { label: item.warehouse.description, value: item.warehouse.uuid }
      : null,
    package_uuid: item.package
      ? { label: item.package.description, value: item.package.uuid }
      : null,
    lot: item.lot ?? '',
    quantity: item.quantity,
    amount: item.amount,
    // Hidratado com o valor do PRÓPRIO servidor (2 casas) — NUNCA recalculado
    // de `quantity * amount` aqui (armadilha #2, drift de centavos).
    total_amount: item.total_amount,
    discard_kg: item.discard_kg,
    area_uuid: item.area ? { label: item.area.description, value: item.area.uuid } : null,
    note: item.note ?? '',
    factor: null,
    factor_type: null,
    measurement_second: null,
  };
}

// -----------------------------------------------------------------------------
// Payload de escrita de uma linha (`tryPersistTransfer`/`CreateOrUpdateRomaneio.tsx`)
// — descarta TODOS os derivados/client-only (`total_amount`, `factor`,
// `factor_type`, `measurement_second` — armadilha #3), nunca envia `id`
// (`Option.value` já é o `uuid`). `warehouse_uuid` vazio (sentinela `''` da
// opção "Sem estoque") vira `null` (armadilha #10).
// -----------------------------------------------------------------------------
export function buildTransferItemPayload(item: TransferItemForm): TransferItemPayload {
  return {
    item_uuid: item.item_uuid ?? null,
    product_uuid: item.product_uuid!.value,
    measurement_uuid: item.measurement_uuid!.value,
    warehouse_uuid: item.warehouse_uuid?.value || null,
    package_uuid: item.package_uuid?.value ?? null,
    lot: item.lot?.trim() || null,
    quantity: item.quantity!,
    amount: item.amount!,
    discard_kg: item.discard_kg ?? null,
    area_uuid: item.area_uuid?.value ?? null,
    note: item.note?.trim() || null,
  };
}

// -----------------------------------------------------------------------------
// Fábrica de linha vazia de DESPESA acessória (TASK-TRF-FE-04, contrato §5.6)
// — repeater de despesas inicia VAZIO ao criar (diferente dos itens, que
// iniciam com 1 linha), reusada pelo `defaultValues` do `useForm` raiz e pelo
// `handleAdd` de `RomaneioExpensesTab.tsx`. `apropriation` já nasce `'N'`
// (default do servidor/contrato §5.6, campo #10) — por isso recebe
// `languageGB` (única fábrica de linha do módulo que precisa dele).
// -----------------------------------------------------------------------------
export function createEmptyTransferExpense(languageGB: LanguageDate): TransferExpenseForm {
  return {
    expense_uuid: null,
    type: null,
    service_reversal_uuid: null,
    warehouse_uuid: null,
    product_uuid: null,
    provider_uuid: null,
    quantity: null,
    vl_unit: null,
    who_pay: null,
    apropriation: { label: apropriationOptions.getLabel('N', languageGB), value: 'N' },
    use_kg: null,
  };
}

// -----------------------------------------------------------------------------
// Hidratação de uma linha de despesa existente
// (`fillTransferForm`/`CreateOrUpdateRomaneio.tsx`) — `expense_uuid` SEMPRE
// preservado (armadilha #15/#18, mesma regra do `item_uuid`).
//
// GAP-TRF-09 (backend corrigido) — `warehouse`/`service_reversal` hidratados
// normalmente A PARTIR do que o `GET` devolver; se o Resource não trouxer o
// satélite (ausente/`null`), o campo fica `null` (DESCONHECIDO — hint na
// tela), NUNCA inventado. É defesa em profundidade explícita da armadilha #2:
// esta função nunca faz spread cru do objeto do GET, sempre mapeia campo a
// campo — se o contrato do backend regredir e parar de expor os dois campos,
// o pior caso volta a ser "vazio + hint", nunca `null` silencioso disfarçado
// de valor real.
//
// `provider_uuid`: o Resource devolve `{uuid, name}` (DD-078-04) — rótulo =
// `name`; sem `name`, `NOT_INFORMED_LABEL`, nunca o uuid. `RomaneioExpenseRow.tsx`
// ainda pode refinar por MATCH no catálogo `providers/options` já carregado
// (zero requests extra, nunca 1 por linha — contrato §5.8).
// -----------------------------------------------------------------------------
export function transferExpenseToForm(
  expense: TransferExpense,
  languageGB: LanguageDate
): TransferExpenseForm {
  return {
    expense_uuid: expense.uuid,
    type: { label: expenseTypeOptions.getLabel(expense.type, languageGB), value: expense.type },
    service_reversal_uuid: expense.service_reversal
      ? { label: expense.service_reversal.name, value: expense.service_reversal.uuid }
      : null,
    warehouse_uuid: expense.warehouse
      ? { label: expense.warehouse.name, value: expense.warehouse.uuid }
      : null,
    product_uuid: expense.product
      ? { label: expense.product.description, value: expense.product.uuid }
      : null,
    provider_uuid: expense.provider
      ? { label: expense.provider.name || NOT_INFORMED_LABEL, value: expense.provider.uuid }
      : null,
    quantity: expense.quantity,
    vl_unit: expense.vl_unit,
    who_pay: {
      label: expensePayerOptions.getLabel(expense.who_pay, languageGB),
      value: expense.who_pay,
    },
    apropriation: {
      label: apropriationOptions.getLabel(expense.apropriation, languageGB),
      value: expense.apropriation,
    },
    // `use_kg` é client-only (§5.6) — o `GET` não o devolve (não é campo da
    // despesa, é atributo do CATÁLOGO estorno/serviço); some após reload até
    // o usuário reescolher a natureza nesta tela (mesma degradação aceita de
    // `factor`/`factor_type` em `transferItemToForm`).
    use_kg: null,
  };
}

// -----------------------------------------------------------------------------
// Payload de escrita de uma linha de despesa
// (`tryPersistTransfer`/`CreateOrUpdateRomaneio.tsx`) — descarta o client-only
// `use_kg` e o derivado `value` (armadilha #5, nem sequer é campo do form).
// Nunca monta o payload a partir do objeto do GET — sempre a partir do
// ESTADO DO FORM (que só contém o que a tela realmente hidratou/o usuário
// editou), mesma defesa em profundidade de `transferExpenseToForm`.
// -----------------------------------------------------------------------------
export function buildTransferExpensePayload(expense: TransferExpenseForm): TransferExpensePayload {
  return {
    expense_uuid: expense.expense_uuid ?? null,
    type: expense.type!.value,
    service_reversal_uuid: expense.service_reversal_uuid?.value ?? null,
    warehouse_uuid: expense.warehouse_uuid?.value ?? null,
    product_uuid: expense.product_uuid?.value ?? null,
    provider_uuid: expense.provider_uuid?.value ?? null,
    quantity: expense.quantity!,
    vl_unit: expense.vl_unit!,
    who_pay: expense.who_pay!.value,
    apropriation: expense.apropriation!.value,
  };
}

export const TRANSFER_FINISH_QUERY_KEY = 'transfers-finish';

interface UseTransferFinishFormProps {
  registrationId: string | undefined;
  fillForm: (data: TransferFinishDetail, resetForce?: boolean) => void;
}

export function useTransferFinishForm({ registrationId, fillForm }: UseTransferFinishFormProps) {
  return useCustomFormQueryByGuid<TransferFinishDetail>({
    registrationId,
    asyncFunction: getTransferFinish,
    fillForm,
    queryKey: TRANSFER_FINISH_QUERY_KEY,
  });
}

interface UseFinishTransferProps {
  actionSuccess: () => void;
}

export function useFinishTransfer({ actionSuccess }: UseFinishTransferProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.transfers.transfer;

  return useRequest<TransferDetail>({
    asyncFunction: async ({ uuid, payload }: { uuid: string; payload: TransferFinishPayload }) =>
      finishTransfer(uuid, payload),
    queryKey: queryKey.transfers.transfers,
    queryKey2: queryKey.transfers.transfer,
    queryKey3: TRANSFER_FINISH_QUERY_KEY,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.finish.successToast,
    actionSuccess,
  });
}
