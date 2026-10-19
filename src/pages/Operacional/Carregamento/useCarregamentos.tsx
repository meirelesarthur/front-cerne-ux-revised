// src/pages/Operacional/Carregamento/useCarregamentos.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CARREGAMENTOS (Charge) — mesmo padrão de
// `Operacional/Romaneios/useRomaneios.tsx`:
//   - useChargesList → useCustomGridQuery (listagem paginada REAL de
//     servidor + 7 filtros do drawer, TASK-FE-CG-02). SEM `registrationId` —
//     Carregamentos é listagem global da fazenda ativa (via `X-Farm-Id`),
//     sem ID de contexto pai.
//
// A hidratação do formulário (`useChargeForm`) e as fábricas de linha de
// item/despesa entram em `TASK-FE-CG-03/04` (mesmo arquivo, convenção já
// usada em `useRomaneios.tsx`) — NÃO duplicar este arquivo do zero.
//
// Sem Zustand — paginação/filtro por `userPaginatedQuery` (Contexto React),
// dados de servidor só no TanStack Query.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import {
  chargeApropriationOptions,
  chargeExpensePayerOptions,
  chargeExpenseTypeOptions,
} from '@/constants/carregamentos/charge/options';
import { queryKey } from '@/constants/query-key';

import {
  buildChargeTransferDraft,
  finishCharge,
  getCharge,
  listCharges,
  listChargeDocuments,
  syncChargeDocuments,
} from '@/services/v2/Carregamentos/charge-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ChargeDetail,
  ChargeDocumentItem,
  ChargeDocumentPayloadItem,
  ChargeExpenseAncillaryDetail,
  ChargeExpenseForm,
  ChargeExpensePayload,
  ChargeExpenseType,
  ChargeFilterForm,
  ChargeItemForm,
  ChargeItemPayload,
  ChargeListItem,
  FinishChargePayload,
  ItemChargeDetail,
} from '@/@types/v2/Carregamentos';

interface UseChargesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ChargeFilterForm;
}

// DD-078-04 — texto exibido quando o payload não traz o rótulo (nunca o uuid).
export const NOT_INFORMED_LABEL = 'Não informado';

export function useChargesList({ paginatedQuery, setPaginatedQuery, filter }: UseChargesListProps) {
  return useCustomGridQuery<ChargeListItem, ChargeFilterForm>({
    asyncFunction: listCharges,
    queryKey: queryKey.carregamentos.charges,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ChargeFilterForm),
  });
}

// -----------------------------------------------------------------------------
// Hidratação do formulário criar/editar (TASK-FE-CG-03, `get_pwa_form_query_
// pattern`, Lei 2) — `useCustomFormQueryById` (NÃO `ByGuid`, convenção literal
// da ficha da Tarefa): `registrationId` SEMPRE string (`chargeUuid ?? ''`), o
// hook internamente valida o formato de 36 caracteres antes de habilitar a
// query — sem chamada de rede em modo criação (`''` nunca bate a validação).
// -----------------------------------------------------------------------------
interface UseChargeFormProps {
  registrationId: string;
  fillForm: (data: ChargeDetail, resetForce?: boolean) => void;
}

export function useChargeForm({ registrationId, fillForm }: UseChargeFormProps) {
  return useCustomFormQueryById<ChargeDetail>({
    registrationId,
    asyncFunction: getCharge,
    fillForm,
    queryKey: queryKey.carregamentos.charge,
  });
}

// -----------------------------------------------------------------------------
// Satélite PLANO do Armazém da linha de item (TASK-FE-CG-03, nota técnica 1
// do plano) — `GET /warehouses/options?type=producao` (FD-06, `Warehouse::
// PRODUCTION do farm atual`), mesmo racional `Select` + `useQuery` de
// `useTransferItemWarehouseOptions('producao')` — reusada por TODAS as
// linhas do repeater (1 requisição só, nunca uma por linha).
// -----------------------------------------------------------------------------
export function useChargeItemWarehouseOptions() {
  return useQuery({
    queryKey: ['carregamentos-form-warehouse-options', 'producao'],
    queryFn: () => listWarehouseOptions({ type: 'producao' }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// Satélite PLANO do Armazém da linha de DESPESA acessória (TASK-FE-CG-04,
// `type='insumos'`) — mirror `useTransferItemWarehouseOptions('insumos')`
// de `Romaneios/useRomaneios.tsx`: query key/`type` PRÓPRIOS (`'insumos'`),
// DIFERENTE do satélite de Itens (`useChargeItemWarehouseOptions`, `type=
// 'producao'`) — são 2 catálogos de armazém fisicamente distintos, nunca
// reusar 1 hook para os 2 (FD-06 dos Itens vs. contrato de despesas).
// -----------------------------------------------------------------------------
export function useChargeExpenseWarehouseOptions() {
  return useQuery({
    queryKey: ['carregamentos-form-warehouse-options', 'insumos'],
    queryFn: () => listWarehouseOptions({ type: 'insumos' }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// -----------------------------------------------------------------------------
// Fábrica de linha vazia de Item (TASK-FE-CG-03) — create inicia com 1 linha
// (mirror `createEmptyTransferItem`), reusada pelo `defaultValues` do
// `useForm` raiz e pelo `handleAdd` de `ChargeItemsTab.tsx`.
// -----------------------------------------------------------------------------
export function createEmptyChargeItem(): ChargeItemForm {
  return {
    item_uuid: null,
    product_uuid: null,
    warehouse_uuid: null,
    quantity: null,
    amount: null,
    type: null,
    calibre: '',
    team_uuid: null,
    seller_uuid: null,
    area_uuid: null,
    provider_uuid: null,
    note: '',
    total_amount: null,
    weight: null,
    // FD-30/FD-31 (CL-46) — hints client-only, nascem vazios (linha nova
    // sem Armazém/Produto escolhido ainda).
    qtd_stock: null,
    um: null,
  };
}

// -----------------------------------------------------------------------------
// Hidratação de uma linha existente (`fillChargeForm`/`CreateOrUpdateCharge.
// tsx`) — `item_uuid` SEMPRE preservado (mesma armadilha de `transferItemToForm`
// — perdê-lo faz o servidor apagar/recriar a linha).
//
// `team`/`seller`/`provider` (GAP FIX #4, execução 045, fix de API em
// paralelo) — a API passa a expor `{uuid, label}` (`ChargeItemPartyRef`,
// nome real) em vez de só `{uuid}`; o SELECT usa `item.X.label` quando
// presente. Fallback SEGURO `NOT_INFORMED_LABEL` quando `label` vier
// ausente (registro antigo/satélite não resolvido pelo backend) — NUNCA o
// uuid nem nome inventado no cliente (DD-078-04).
// `total_amount`/`weight` hidratam com o valor REAL do servidor (nota técnica
// 2) só para exibição inicial — `ChargeItemRow` recalcula `total_amount` ao
// vivo (`quantity * amount`) a partir da digitação; `weight` permanece o
// último valor conhecido do servidor até novo save (sem fórmula client-side,
// a linha do item não tem seletor de unidade secundária nesta tela).
// -----------------------------------------------------------------------------
export function chargeItemToForm(item: ItemChargeDetail): ChargeItemForm {
  return {
    item_uuid: item.uuid,
    product_uuid: item.product
      ? { label: item.product.description, value: item.product.uuid }
      : null,
    warehouse_uuid: item.warehouse
      ? { label: item.warehouse.description, value: item.warehouse.uuid }
      : null,
    quantity: item.quantity,
    amount: item.amount,
    type: item.type ? { label: item.type_label ?? item.type, value: item.type } : null,
    calibre: item.calibre ?? '',
    team_uuid: item.team
      ? { label: item.team.label ?? NOT_INFORMED_LABEL, value: item.team.uuid }
      : null,
    seller_uuid: item.seller
      ? { label: item.seller.label ?? NOT_INFORMED_LABEL, value: item.seller.uuid }
      : null,
    area_uuid: item.area ? { label: item.area.description, value: item.area.uuid } : null,
    provider_uuid: item.provider
      ? { label: item.provider.label ?? NOT_INFORMED_LABEL, value: item.provider.uuid }
      : null,
    note: item.note ?? '',
    total_amount: item.total_amount,
    weight: item.quantity_second,
    // FD-30 ("Estoque") — nunca hidratado de uma linha existente (é hint de
    // saldo de armazém, só existe durante a digitação, IG-02).
    qtd_stock: null,
    // FD-31 ("Un. Medida") — `ItemChargeResource` não expõe
    // `product.measurement`; resolvido depois via `resolveItemMeasurements`
    // (fire-and-forget, `CreateOrUpdateCharge.tsx`), começa `null` aqui.
    um: null,
  };
}

// -----------------------------------------------------------------------------
// Payload de escrita de uma linha (`tryPersistCharge`/`CreateOrUpdateCharge.
// tsx`) — descarta os hints client-only `total_amount`/`weight` (nota técnica
// 2 do plano — NUNCA vão ao payload, mesmo racional de `buildTransferItemPayload`
// descartando `total_amount`/`factor`/`factor_type`/`measurement_second`).
// `warehouse_uuid` opcional (fiel ao legado FD-06) — sentinela `''` (opção
// "Sem estoque") vira `null`.
// -----------------------------------------------------------------------------
export function buildChargeItemPayload(item: ChargeItemForm): ChargeItemPayload {
  return {
    item_uuid: item.item_uuid ?? null,
    product_uuid: item.product_uuid!.value,
    warehouse_uuid: item.warehouse_uuid?.value || null,
    quantity: item.quantity!,
    amount: item.amount!,
    type: item.type?.value ?? null,
    calibre: item.calibre?.trim() || null,
    team_uuid: item.team_uuid?.value ?? null,
    seller_uuid: item.seller_uuid?.value ?? null,
    area_uuid: item.area_uuid?.value ?? null,
    provider_uuid: item.provider_uuid?.value ?? null,
    note: item.note?.trim() || null,
  };
}

// -----------------------------------------------------------------------------
// Fábrica de linha vazia de DESPESA acessória — GAP FIX (Onda 2, execução
// 045). Repeater inicia VAZIO ao criar (diferente dos Itens, que iniciam com
// 1 linha), reusada pelo `defaultValues` do `useForm` raiz e pelo
// `handleAdd` de `ChargeExpensesTab.tsx`. Mirror ESTRUTURAL EXATO
// `createEmptyTransferExpense` (`Romaneios/useRomaneios.tsx`) — `apropriation`
// já nasce `'N'` (mesmo default do servidor/mirror), por isso recebe
// `languageGB`.
//
// `fixedType` (CL-48/CL-49) — a linha nasce SEMPRE com `type` já preenchido
// pela aba que a criou (Estornos/Insumos/Serviços); o usuário nunca escolhe
// "Natureza" manualmente (mirror hidden `expense_type[]` do legado).
// -----------------------------------------------------------------------------
export function createEmptyChargeExpense(
  languageGB: LanguageDate,
  fixedType: ChargeExpenseType
): ChargeExpenseForm {
  return {
    expense_uuid: null,
    type: {
      label: chargeExpenseTypeOptions.getLabel(fixedType, languageGB),
      value: fixedType,
    },
    service_reversal_uuid: null,
    warehouse_uuid: null,
    product_uuid: null,
    provider_uuid: null,
    quantity: null,
    vl_unit: null,
    who_pay: null,
    apropriation: {
      label: chargeApropriationOptions.getLabel('N', languageGB),
      value: 'N',
    },
    value: null,
    // FD-32 ("Estoque", aba Insumos) — hint client-only, nasce vazio (linha
    // nova sem Armazém/Produto escolhido ainda), mirror `qtd_stock` de
    // `createEmptyChargeItem`.
    stock: null,
  };
}

// -----------------------------------------------------------------------------
// Hidratação de uma linha de despesa existente (`fillChargeForm`/
// `CreateOrUpdateCharge.tsx`) — `expense_uuid` SEMPRE preservado (mesma
// armadilha do `item_uuid`: perdê-lo faz o servidor apagar/recriar a linha).
// Mirror ESTRUTURAL EXATO `transferExpenseToForm` — `warehouse`/
// `service_reversal` ausentes no `GET` viram `null` (DESCONHECIDO, nunca
// inventado, defesa em profundidade). `provider` expõe `{uuid, name}`
// (DD-078-04, `ChargePartyRef`) — rótulo = `name`; sem `name`, placeholder
// `NOT_INFORMED_LABEL`, nunca o uuid.
// -----------------------------------------------------------------------------
export function chargeExpenseToForm(
  expense: ChargeExpenseAncillaryDetail,
  languageGB: LanguageDate
): ChargeExpenseForm {
  return {
    expense_uuid: expense.uuid,
    type: {
      label: chargeExpenseTypeOptions.getLabel(expense.type, languageGB),
      value: expense.type,
    },
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
      label: chargeExpensePayerOptions.getLabel(expense.who_pay, languageGB),
      value: expense.who_pay,
    },
    apropriation: {
      label: chargeApropriationOptions.getLabel(expense.apropriation, languageGB),
      value: expense.apropriation,
    },
    value: expense.value,
    // FD-32 ("Estoque") — nunca hidratado de uma linha existente (é hint de
    // saldo de armazém, só existe durante a digitação, IG-10), mirror
    // `qtd_stock` de `chargeItemToForm`.
    stock: null,
  };
}

// -----------------------------------------------------------------------------
// Payload de escrita de uma linha de despesa (`tryPersistCharge`/
// `CreateOrUpdateCharge.tsx`) — descarta o hint client-only `value` (nunca é
// campo de fato persistido/enviado). Monta SEMPRE a partir do ESTADO DO FORM
// (nunca do objeto do `GET`), mesma defesa em profundidade de
// `buildTransferExpensePayload`.
// -----------------------------------------------------------------------------
export function buildChargeExpensePayload(expense: ChargeExpenseForm): ChargeExpensePayload {
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

// -----------------------------------------------------------------------------
// TASK-FE-CG-05 — mutação de FINALIZAR (`PUT .../finish`), mirror
// `useFinishAppropriation` (`Appropriations/useAppropriations.tsx`). Invalida
// listagem + detalhe (o `GET` seguinte da tela de destino já busca o
// `ChargeDetail` fresco com `status='finalizada'`/`total_real` calculados).
// -----------------------------------------------------------------------------
interface UseFinishChargeProps {
  actionSuccess: (data: ChargeDetail) => void;
}

export function useFinishCharge({ actionSuccess }: UseFinishChargeProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge;

  return useRequest<ChargeDetail>({
    asyncFunction: async ({ uuid, payload }: { uuid: string; payload: FinishChargePayload }) =>
      finishCharge(uuid, payload),
    queryKey: queryKey.carregamentos.charges,
    queryKey2: queryKey.carregamentos.charge,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.finish.successToast,
    actionSuccess,
  });
}

// -----------------------------------------------------------------------------
// TASK-FE-CG-05 — cálculo do rascunho de romaneio (`POST .../transfer`,
// Action de LEITURA PURA, decisão d1 do dono). Mutação dedicada (não
// `useQuery`, embora o verbo HTTP seja `POST`) — o cálculo só deve rodar
// quando o usuário abre o diálogo "Gerar Romaneio", nunca em background por
// invalidação de cache (mirror do racional de `useRequest`, mas sem toast/
// redirect próprios — o diálogo decide o que fazer com o rascunho).
// -----------------------------------------------------------------------------
export function useBuildChargeTransferDraft() {
  return useMutation({
    mutationFn: (uuid: string) => buildChargeTransferDraft(uuid),
  });
}

// -----------------------------------------------------------------------------
// TASK-FE-CG-06 — Documentos (anexos PDF). Endpoint de leitura DEDICADO
// (`GET /charges/{uuid}/documents`, `queryKey: [queryKey.carregamentos.charge,
// uuid, 'documents']`, mirror da ficha da Tarefa) — DIFERENTE de
// `MovementSale`, que reusa o detalhe. Só habilita a query enquanto o modal
// está aberto (`uuid` chega `undefined` quando fechado, mesmo racional de
// `useMovementSaleDetail(isOpen ? uuid : undefined)` do mirror).
// -----------------------------------------------------------------------------
export function useChargeDocuments(uuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.carregamentos.charge, uuid, 'documents'],
    queryFn: async () => {
      const response = await listChargeDocuments(uuid!);
      return response.data;
    },
    enabled: !!uuid,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface UseSyncChargeDocumentsProps {
  actionSuccess: (data: ChargeDocumentItem[]) => void;
}

// `useRequest` (não `useMutation` direto) — invalida detalhe (prefixo
// `queryKey.carregamentos.charge`, que também cobre a query dedicada de
// documentos acima) + listagem, mirror `useStoreMovementSaleDocuments`.
export function useSyncChargeDocuments({ actionSuccess }: UseSyncChargeDocumentsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge;

  return useRequest<ChargeDocumentItem[]>({
    asyncFunction: async ({
      uuid,
      documents,
    }: {
      uuid: string;
      documents: ChargeDocumentPayloadItem[];
    }) => {
      return await syncChargeDocuments(uuid, documents);
    },
    queryKey: queryKey.carregamentos.charge,
    queryKey2: queryKey.carregamentos.charges,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.documents.savedToast,
    actionSuccess,
  });
}
