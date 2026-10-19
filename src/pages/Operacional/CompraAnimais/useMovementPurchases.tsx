// src/pages/Operacional/CompraAnimais/useMovementPurchases.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de COMPRA DE ANIMAIS (MovementPurchase) — TASK-CP-05
// (listagem) + TASK-CP-06/07 (form criar/editar). Mesmo padrão de
// `Operacional/VendaAnimais/useMovementSales.tsx`:
//   - useMovementPurchasesList → useCustomGridQuery (listagem paginada real de
//     servidor + 4 filtros efetivos, TASK-CP-05).
//   - useMovementPurchaseForm → useCustomFormQueryByGuid (hidratação do form
//     de criar/editar, TASK-CP-06 — `fillForm` é a função NOMEADA com guarda
//     `dirtyFields`/`resetForce` da própria tela, Lei 2, passada pelo caller).
//
// Sem Zustand — fazenda ativa já vem do AuthContext via interceptor;
// paginação/filtro por `userPaginatedQuery`. Exclusão da listagem usa
// `useMutation` direto no componente (mirror `VendaAnimaisList`, ver
// docblock de `index.tsx`) — não um hook nomeado aqui.
//
// Hidratação de Detalhe (readonly, `TASK-CP-09`) fica para quando a tela que
// a consome existir.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  getMovementPurchaseByUuid,
  listMovementPurchases,
  storeMovementPurchaseDocuments,
} from '@/services/v2/MovementPurchases/movement-purchase-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  MovementPurchaseDetail,
  MovementPurchaseDocumentRow,
  MovementPurchaseFilterForm,
  MovementPurchaseFinancialBlock,
  MovementPurchaseForm,
  MovementPurchaseItem,
  MovementPurchaseItemForm,
  MovementPurchaseItemPayload,
  MovementPurchaseListItem,
  MovementPurchasePayload,
} from '@/@types/v2/MovementPurchases';

import { fromCents, toCents } from './movementPurchaseFinancialMath';

interface UseMovementPurchasesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MovementPurchaseFilterForm;
}

export function useMovementPurchasesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMovementPurchasesListProps) {
  return useCustomGridQuery<MovementPurchaseListItem, MovementPurchaseFilterForm>({
    asyncFunction: listMovementPurchases,
    queryKey: queryKey.movementPurchases.movementPurchases,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MovementPurchaseFilterForm),
  });
}

// -----------------------------------------------------------------------------
// Hidratação do formulário de Criar/Editar (TASK-CP-06) — mesmo racional de
// `useMovementSaleForm`: só habilita a query em modo edição (`registrationId`
// presente); `fillForm` é a função NOMEADA com guarda `dirtyFields`/
// `resetForce` da própria tela (Lei 2), passada pelo caller.
// -----------------------------------------------------------------------------
export interface UseMovementPurchaseFormProps {
  registrationId: string | undefined;
  fillForm: (data: MovementPurchaseDetail, resetForce?: boolean) => void;
}

export function useMovementPurchaseForm({
  registrationId,
  fillForm,
}: UseMovementPurchaseFormProps) {
  return useCustomFormQueryByGuid<MovementPurchaseDetail>({
    registrationId,
    asyncFunction: getMovementPurchaseByUuid,
    fillForm,
    queryKey: queryKey.movementPurchases.movementPurchase,
  });
}

// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO read-only (TASK-CP-09, contrato §6) — SEM `useForm`,
// mirror `useMovementSaleDetail` (`Operacional/VendaAnimais/useMovementSales.tsx`):
// a tela lê `.data` direto, `fillForm` é um no-op deliberado (nunca chamado de
// fato em modo leitura pura). Também reusado pelo modal de Documentos
// (`MovementPurchaseDocumentsModal.tsx`) como fonte ÚNICA de hidratação —
// não existe `GET .../documents` dedicado.
// -----------------------------------------------------------------------------
export function useMovementPurchaseDetail(movementPurchaseUuid: string | undefined) {
  return useCustomFormQueryByGuid<MovementPurchaseDetail>({
    registrationId: movementPurchaseUuid,
    asyncFunction: getMovementPurchaseByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.movementPurchases.movementPurchase,
  });
}

// -----------------------------------------------------------------------------
// Documentos (TASK-CP-08) — `POST .../{uuid}/documents`, mirror
// `useStoreMovementSaleDocuments`. `useRequest` (não `useMutation` direto):
// é um submit de "entidade nomeável" com toast formal e invalidação de
// múltiplas queryKeys (detalhe + listagem), mesma regra de
// `get_pwa_mutation_query_pattern` (§"Regra Explícita").
// -----------------------------------------------------------------------------
export interface UseStoreMovementPurchaseDocumentsProps {
  actionSuccess: (data: MovementPurchaseDetail) => void;
}

export function useStoreMovementPurchaseDocuments({
  actionSuccess,
}: UseStoreMovementPurchaseDocumentsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementPurchases.movementPurchase;

  return useRequest<MovementPurchaseDetail>({
    asyncFunction: async ({
      uuid,
      documents,
    }: {
      uuid: string;
      documents: MovementPurchaseDocumentRow[];
    }) => {
      return await storeMovementPurchaseDocuments(uuid, documents);
    },
    queryKey: queryKey.movementPurchases.movementPurchase,
    queryKey2: queryKey.movementPurchases.movementPurchases,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.documents.savedToast,
    actionSuccess,
  });
}

// -----------------------------------------------------------------------------
// Fábrica/mapper de item + montagem do payload de escrita (TASK-CP-06/07) —
// mirror estrutural de `createEmptyMovementSaleItem`/`movementSaleItemDetailToForm`/
// `buildMovementSalePayload` (`useMovementSales.tsx`).
// -----------------------------------------------------------------------------

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// `batch_uuid`/`grazing_uuid`/`center_uuid` sempre `null` na fábrica — NÃO
// renderizados no `MovementPurchaseItemRow` (decisão de fidelidade §4.2 do
// contrato de frontend + task-packet RUN-047); o tipo os mantém para não
// quebrar o DTO de escrita real (`MovementPurchaseItemData`, que os aceita
// como `sometimes|nullable`) caso uma Tarefa futura decida expandir.
// Valor Total do item: qtd × unit (round 2). Com `fiscal_baseline` (item do
// XML / compra salva com chave) e quantidade/unitário inalterados, preserva o
// `amount` da nota (I8 — paridade com o legado, que mantém vProd até editar).
export function computeMovementPurchaseItemAmount(item: MovementPurchaseItemForm): number {
  const quantity = Number(item.quantity) || 0;
  const valueUnit = Number(item.value_unit) || 0;
  const baseline = item.fiscal_baseline;
  if (baseline && baseline.quantity === quantity && baseline.value_unit === valueUnit) {
    return baseline.amount;
  }
  return round(quantity * valueUnit, 2);
}

export function createEmptyMovementPurchaseItem(): MovementPurchaseItemForm {
  return {
    category_uuid: null,
    batch_uuid: null,
    grazing_uuid: null,
    center_uuid: null,
    quantity: null,
    value_unit: null,
    amount: null,
    note: '',
    item_description: null,
  };
}

// Hidratação de item (edição) — `MovementPurchaseItem` (leitura, `whenLoaded`
// só no detalhe) não devolve `batch`/`grazing`/`center` (achado #2 do
// docblock de `@/@types/v2/MovementPurchases`: o DTO de leitura desta Tarefa
// não os expõe) — permanecem `null`, mirror da não-renderização (§4.2).
export function movementPurchaseItemDetailToForm(
  item: MovementPurchaseItem,
  hasChave = false
): MovementPurchaseItemForm {
  return {
    category_uuid: item.category
      ? { label: item.category.description ?? item.category.uuid, value: item.category.uuid }
      : null,
    batch_uuid: null,
    grazing_uuid: null,
    center_uuid: null,
    quantity: item.quantity,
    value_unit: item.value_unit,
    amount: item.amount,
    note: item.note ?? '',
    item_description: item.item_description,
    fiscal_baseline: hasChave
      ? { quantity: item.quantity, value_unit: item.value_unit, amount: item.amount }
      : null,
  };
}

// ---------------------------------------------------------------------------
// 088 D3-FE-T4 — financeiro no formulário (shape novo §2.3/§2.1 da API).
// ---------------------------------------------------------------------------

export type MovementPurchaseFinancialFormValues = Pick<
  MovementPurchaseForm,
  | 'has_financial'
  | 'financial_number'
  | 'financial_type_title'
  | 'financial_proprietary'
  | 'financial_note'
  | 'financial_has_input'
  | 'financial_input_date'
  | 'financial_input_value'
  | 'financial_fiscal_document'
  | 'financial_classification'
  | 'generator'
  | 'financial_installments'
  | 'financial_allocations'
  | 'financial_write_off'
>;

// Defaults do bloco financeiro (página): intervalo 30 dias, Dedutível = Sim,
// Classificação `N`, "Possui Entrada?" sem escolha (`null` = Selecione).
export function emptyMovementPurchaseFinancialForm(): MovementPurchaseFinancialFormValues {
  return {
    has_financial: false,
    financial_number: '',
    financial_type_title: null,
    financial_proprietary: null,
    financial_note: '',
    financial_has_input: null,
    financial_input_date: null,
    financial_input_value: null,
    financial_fiscal_document: true,
    financial_classification: 'N',
    generator: { count: null, first_due_date: null, interval_days: 30 },
    financial_installments: [],
    financial_allocations: [],
    financial_write_off: false,
  };
}

// Hidrata o financeiro da compra a partir do `show` (§2.3), SEM regenerar
// parcelas (pacote 2): cada linha volta exatamente como gravada (`origin='stored'`,
// a 1ª é `'input'` quando `has_input`); o gerador só recebe os 3 campos derivados;
// `%` vem do show (P-1). `financial_write_off` = alguma parcela baixada (D2).
// SEM MOCK: sem `financial` no show, reabre vazio.
export function movementPurchaseFinancialToForm(
  data: Pick<MovementPurchaseDetail, 'has_financial' | 'financial'>
): MovementPurchaseFinancialFormValues {
  const empty = emptyMovementPurchaseFinancialForm();
  const financial = data.financial;
  if (!financial) {
    return { ...empty, has_financial: data.has_financial === true };
  }

  const hasInput = financial.has_input === true;
  const installments = financial.installments ?? [];
  const allocations = financial.allocations ?? [];

  return {
    has_financial: data.has_financial === true || installments.length > 0,
    financial_number: financial.number ?? '',
    financial_type_title: financial.type_title
      ? {
          label: financial.type_title.description ?? financial.type_title.uuid,
          value: financial.type_title.uuid,
        }
      : null,
    financial_proprietary: financial.proprietary
      ? {
          label: financial.proprietary.name ?? financial.proprietary.uuid,
          value: financial.proprietary.uuid,
        }
      : null,
    financial_note: financial.note ?? '',
    financial_has_input: hasInput,
    financial_input_date: hasInput ? (financial.input?.due_date ?? null) : null,
    financial_input_value: hasInput ? (financial.input?.amount ?? null) : null,
    financial_fiscal_document: financial.fiscal_document !== false,
    financial_classification: financial.classification ?? 'N',
    generator: {
      count: financial.generator?.installments_count ?? null,
      first_due_date: financial.generator?.first_due_date ?? null,
      interval_days: financial.generator?.interval_days ?? 30,
    },
    financial_installments: installments.map((installment, index) => ({
      due_date: installment.due_date,
      amount: installment.amount,
      origin: hasInput && index === 0 ? 'input' : 'stored',
    })),
    financial_allocations: allocations.map((allocation) => ({
      category: {
        label: allocation.financial_category.description ?? allocation.financial_category.uuid,
        value: allocation.financial_category.uuid,
      },
      plan_account: allocation.plan_account
        ? {
            label: allocation.plan_account.code
              ? `${allocation.plan_account.code} — ${allocation.plan_account.description ?? ''}`
              : (allocation.plan_account.description ?? allocation.plan_account.uuid),
            value: allocation.plan_account.uuid,
          }
        : null,
      center: {
        label: allocation.cost_center.description ?? allocation.cost_center.uuid,
        value: allocation.cost_center.uuid,
      },
      value: allocation.value,
      percent: allocation.percent,
    })),
    financial_write_off: installments.some((installment) => installment.has_write_off),
  };
}

export function buildMovementPurchaseItemPayload(
  item: MovementPurchaseItemForm
): MovementPurchaseItemPayload {
  const quantity = Number(item.quantity) || 0;
  const valueUnit = Number(item.value_unit) || 0;
  const amount = computeMovementPurchaseItemAmount(item);

  return {
    category_uuid: item.category_uuid!.value,
    // §4.2 — NÃO renderizados no form; `undefined` preserva o `sometimes` do
    // Request real (nunca envia chave ausente como `null`).
    batch_uuid: item.batch_uuid?.value ?? undefined,
    grazing_uuid: item.grazing_uuid?.value ?? undefined,
    center_uuid: item.center_uuid?.value ?? undefined,
    quantity,
    value_unit: valueUnit,
    amount,
    note: item.note?.trim() || undefined,
    item_description: item.item_description ?? undefined,
  };
}

function roundMoney(value: number | null | undefined): number {
  return fromCents(toCents(value));
}

// `financial` do POST/PUT (§2.1 da API / §4.6 do plano). `input` só com
// `has_input=true` (com `false` a chave NÃO é enviada — `prohibited_unless`);
// `installments[0]` é a entrada quando `has_input` (a linha `origin='input'` da
// tabela, espelho do cabeçalho). Datas `yyyy-MM-dd` como estão no form.
export function buildMovementPurchaseFinancialPayload(
  data: MovementPurchaseFinancialFormValues
): MovementPurchaseFinancialBlock {
  const hasInput = data.financial_has_input === true;

  const block: MovementPurchaseFinancialBlock = {
    number: (data.financial_number ?? '').trim(),
    type_title_uuid: data.financial_type_title?.value as string,
    proprietary_uuid: data.financial_proprietary?.value ?? null,
    note: (data.financial_note ?? '').trim(),
    fiscal_document: data.financial_fiscal_document,
    classification: data.financial_classification,
    has_input: hasInput,
    installments: (data.financial_installments ?? []).map((installment) => ({
      due_date: installment.due_date ?? '',
      amount: roundMoney(installment.amount),
    })),
    allocations: (data.financial_allocations ?? []).map((allocation) => ({
      financial_category_uuid: allocation.category?.value as string,
      plan_account_uuid: allocation.plan_account?.value ?? null,
      cost_center_uuid: allocation.center?.value as string,
      value: roundMoney(allocation.value),
      percent: roundMoney(allocation.percent),
    })),
  };

  if (hasInput) {
    block.input = {
      due_date: data.financial_input_date ?? '',
      amount: roundMoney(data.financial_input_value),
    };
  }

  return block;
}

// ---------------------------------------------------------------------------
// 422 → campo do formulário (§4.7 do plano). Chaves `financial.*` da API viram os
// nomes do form; `total` (mensagem de total 0) cai na raiz das parcelas; chave
// desconhecida volta como `null` (a tela a mostra em `businessError`, nunca
// descartada em silêncio).
// ---------------------------------------------------------------------------

const FINANCIAL_SCALAR_ERROR_KEYS: Record<string, string> = {
  'financial.number': 'financial_number',
  'financial.type_title_uuid': 'financial_type_title',
  'financial.proprietary_uuid': 'financial_proprietary',
  'financial.note': 'financial_note',
  'financial.fiscal_document': 'financial_fiscal_document',
  'financial.classification': 'financial_classification',
  'financial.has_input': 'financial_has_input',
  'financial.input': 'financial_input_value',
  'financial.input.due_date': 'financial_input_date',
  'financial.input.amount': 'financial_input_value',
  // Raiz do field array = `.root` (mesmo lugar onde o resolver põe os testes do array;
  // não sobrescreve os erros por linha).
  'financial.installments': 'financial_installments.root',
  'financial.allocations': 'financial_allocations.root',
  total: 'financial_installments.root',
};

const ALLOCATION_ERROR_FIELDS: Record<string, string> = {
  financial_category_uuid: 'category',
  plan_account_uuid: 'plan_account',
  cost_center_uuid: 'center',
  value: 'value',
  percent: 'percent',
};

const PASSTHROUGH_ERROR_KEY =
  /^(code|dt_sale|provider_uuid|seller_uuid|chave|serie|number|type_payment|gtas|note|total_products|freight|other_values|discount|has_financial|items|items\.\d+\.[a-z_]+)$/;

export function mapMovementPurchaseErrorKey(key: string): string | null {
  const scalar = FINANCIAL_SCALAR_ERROR_KEYS[key];
  if (scalar) return scalar;

  const installment = /^financial\.installments\.(\d+)\.(due_date|amount)$/.exec(key);
  if (installment) return `financial_installments.${installment[1]}.${installment[2]}`;

  const allocation = /^financial\.allocations\.(\d+)\.([a-z_]+)$/.exec(key);
  if (allocation && ALLOCATION_ERROR_FIELDS[allocation[2]]) {
    return `financial_allocations.${allocation[1]}.${ALLOCATION_ERROR_FIELDS[allocation[2]]}`;
  }

  return PASSTHROUGH_ERROR_KEY.test(key) ? key : null;
}

export interface MovementPurchaseServerErrors {
  fields: Array<{ name: string; message: string }>;
  business: string[];
}

export function resolveMovementPurchaseServerErrors(
  errors: Record<string, string[]>
): MovementPurchaseServerErrors {
  const result: MovementPurchaseServerErrors = { fields: [], business: [] };
  Object.entries(errors).forEach(([key, messages]) => {
    const message = messages?.[0];
    if (!message) return;
    const name = mapMovementPurchaseErrorKey(key);
    if (name) result.fields.push({ name, message });
    else result.business.push(message);
  });
  return result;
}

// Monta o payload completo de escrita (`POST`/`PUT /movement-purchases`) —
// `total_products`/`total` são RECALCULADOS aqui a partir de
// `items`/`freight`/`other_values`/`discount` (mirror `buildMovementSalePayload`
// — o bloco Totais é prévia pura, nunca um campo do form persistido cru).
export function buildMovementPurchasePayload(data: MovementPurchaseForm): MovementPurchasePayload {
  const itemsPayload = data.items.map(buildMovementPurchaseItemPayload);
  const totalProducts = round(
    itemsPayload.reduce((sum, item) => sum + item.amount, 0),
    2
  );
  const total = round(totalProducts + data.freight + data.other_values - data.discount, 2);

  const payload: MovementPurchasePayload = {
    dt_sale: data.dt_sale,
    provider_uuid: data.provider_uuid!.value,
    seller_uuid: data.seller_uuid?.value,
    chave: data.chave?.trim() || undefined,
    serie: data.serie?.trim() || undefined,
    number: data.number?.trim() || undefined,
    gtas: data.gtas?.trim() || undefined,
    // 088 — Forma de Pagamento só é enviada com Gerar Financeiro = Sim (ver
    // `if` abaixo). Observação segue o valor do form: oculta sem financeiro,
    // mas limpa ao alternar Sim→Não e preservada se hidratada do show.
    note: data.note?.trim() || undefined,
    total_products: totalProducts,
    freight: data.freight,
    other_values: data.other_values,
    discount: data.discount,
    total,
    items: itemsPayload,
    has_financial: data.has_financial,
  };

  if (data.has_financial) {
    payload.type_payment = data.type_payment?.value;
    payload.financial = buildMovementPurchaseFinancialPayload(data);
  }

  return payload;
}
