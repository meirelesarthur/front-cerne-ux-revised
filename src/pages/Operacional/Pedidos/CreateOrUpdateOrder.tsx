// src/pages/Operacional/Pedidos/CreateOrUpdateOrder.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO/EDIÇÃO de Pedido (Order — Operacional / Vendas,
// F-051, 97-Esteiras/043, PED-FE-03/04). Rotas `/operacional/pedidos/novo`
// (`orders_create`) e `/operacional/pedidos/:uuid` (`orders_edit`), MESMO
// componente (mirror `Operacional/Budget/CreateOrUpdateBudget.tsx` — módulo
// análogo direto).
//
// ESCOPO de PED-FE-03: casca `FormContainer`+`<Form id>` + CABEÇALHO
// (F-001..006/019) + TOTAIS computados (CV-004..007) + SUBMIT ATÔMICO
// (create/update num único request; diff de itens por `olds[]`,
// PARADA-DEF-D; montagem de `installment_details`).
//
// ESCOPO de PED-FE-04: seção de ITENS (`OrderItemsEditor`/`OrderItemRow`,
// `useFieldArray('items')` instanciado AQUI — DEC-PED-FE-ITENS — e repassado
// por prop, mirror `BudgetItemsEditor`) — F-007..F-014, IG-001..IG-009
// completos (cascata produto→um, recompute de total, desconto
// valor↔percentual, add/remove com gate).
//
// ESCOPO de PED-FE-05 (esta edição): seção de PAGAMENTO/PARCELAS
// (`OrderPaymentsEditor`/`OrderInstallmentRow`, `useFieldArray(
// 'installment_details.installments')` DECLARADO DENTRO do editor — F-020..
// F-029, IG-010..014/017 completos: `payment_method`/`has_input` condicional/
// `installments`/`due_date`/`interval`/`fiscal_document` + cronograma
// editável com recompute `calcInstallments`/ajuste de centavos
// `adjustInstallmentsDifference`). `total` (CV-004..007) é calculado pelo
// PRÓPRIO editor via `useWatch('items'/'freight')` + `@/utils/orderTotals`
// (MESMA fonte usada aqui embaixo por `OrderFooterTotals`/`tryPersistOrder`)
// — PARADA-DEF-C (corrige CLM-025): o editor re-dispara o recompute do
// cronograma toda vez que este `total` muda.
//
// ERRO-FE-001 (isEmpty invertida) — `src/utils/isEmpty.ts` retorna `true`
// quando o objeto TEM alguma chave (o oposto do nome sugere). A guarda de
// `fillOrderForm` está correta ao testar `!isEmpty(dirtyFields) ||
// resetForce` (reseta só quando NÃO há edição em andamento). O `onSubmit`
// abaixo usa `!isEmpty(dirtyFields)` (PATCH só quando HÁ algo sujo) — a
// polaridade oposta da usada aqui é a landmine documentada (onSubmit que
// descarta a edição sem PUT); conferir sempre as duas pontas ao alterar.
//
// PARADA-DEF-D (CLM-022/OQ-003, corrigir): item novo na edição não carrega
// `olds` (`OrderItemForm.olds` fica `undefined` numa linha recém-adicionada
// pelo botão "Adicionar item", PED-FE-04) — `tryPersistOrder` repassa
// `item.olds` tal como está (nunca inventa um valor), então o item cai
// naturalmente no branch de CRIAÇÃO do servidor (`OrderItemPayload.olds`
// ausente = cria; presente = atualiza; ausente do array = removido).
//
// Totais (CV-004..007): `subtotal`/`discount` são SEMPRE readonly,
// calculados client-side a partir de `items` (espelho — o servidor é
// autoridade e recalcula, contrato-tela §3); `freight` é o único editável
// do rodapé; `total = subtotal + freight − discount`. O client NUNCA
// bloqueia o submit por divergência com o servidor (só espelha).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import {
  Box,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';
import { computeOrderTotals } from '@/utils/orderTotals';
import { regex } from '@/utils/regex-id';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { orderSchemaResolver } from '@/validations/schemas/Orders/order-schema';

import {
  createOrder,
  getNextOrderCode,
  getOrder,
  listOrderClientOptions,
  updateOrder,
} from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';

import type {
  CreateOrderRequest,
  OrderDetail,
  OrderForm,
  OrderInstallmentDetailsPayload,
  OrderItemForm,
  OrderItemPayload,
  OrderPaymentMethod,
} from '@/@types/v2/Orders';

import { InlineClientModal } from './dialogs/InlineClientModal';
import { createEmptyOrderItem } from './OrderItemRow';
import { OrderItemsEditor } from './OrderItemsEditor';
import { OrderPaymentsEditor } from './OrderPaymentsEditor';

import type { FieldErrors, Control } from 'react-hook-form';

function mapClientOption(item: OrderClientOptionItem) {
  return { label: item.name ?? '—', value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function todayIso(): string {
  return todayLocalIso();
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// CLM-030 (guarda div-by-zero) — PED-FE-04, mesma fórmula de `OrderItemRow`:
// hidratação de edição (`fillOrderForm`) precisa exibir `discount_percent`
// consistente com o `discount`/`total` já persistidos (F-012 "edit calcula
// discount/(price×quantity)×100"), nunca `null`/`NaN`.
function computeItemDiscountPercent(discount: number, quantity: number, price: number): number {
  const base = roundTo2(quantity * price);
  if (base <= 0) return 0;
  return roundTo2((discount / base) * 100);
}

// T1 (Onda G, execução 065) — acha o 1º erro folha de `formState.errors`
// (busca em profundidade, respeitando a ordem de `Object.keys`, que segue a
// ordem de declaração do schema Yup). Usado pelo `onInvalid` do
// `handleSubmit` para (i) exibir a mensagem específica no toast e (ii)
// chamar `setFocus` no campo — RHF `setFocus` é um no-op seguro quando o
// `path` não resolve a um `ref` registrado (não lança), então isto nunca
// quebra o form mesmo para campos de componentes que não repassam ref.
function findFirstFieldError(
  node: unknown,
  path: string[] = []
): { path: string; message?: string } | null {
  if (!node || typeof node !== 'object') return null;

  const candidate = node as { message?: unknown; type?: unknown };
  if (typeof candidate.message === 'string' || typeof candidate.type === 'string') {
    return {
      path: path.join('.'),
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
    };
  }

  for (const key of Object.keys(node as Record<string, unknown>)) {
    const found = findFirstFieldError((node as Record<string, unknown>)[key], [...path, key]);
    if (found) return found;
  }

  return null;
}

export default function CreateOrUpdateOrder() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.orders.order;
  const header = text.form.fields.header;
  const footerText = text.form.fields.footer;

  const isEditing = !!uuid;
  const canSave = can(isEditing ? 'orders_edit' : 'orders_create');

  // Guard de navegação — `uuid` malformado não deve chegar ao hook de query
  // (mirror `get_pwa_form_query_pattern`, "Guard de navegação").
  useEffect(() => {
    if (!uuid) return;
    if (uuid.length !== 36 || uuid.replace(regex, '').length > 0) {
      navigate('/operacional/pedidos');
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<OrderForm>({
    mode: 'onChange',
    resolver: orderSchemaResolver(languageGB, !isEditing),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIso(),
      client: null,
      freight: 0,
      discount: 0,
      note: null,
      payment_method: null,
      installments: 1,
      interval: 0,
      due_date: todayIso(),
      // PED-FE-04 — modo CRIAÇÃO já nasce com 1 linha vazia (AJUSTE #3,
      // mirror `createEmptyBudgetItem`/Budget) já que `items.min(1)` exige
      // pelo menos uma de qualquer forma (`order-schema.ts`). Em EDIÇÃO,
      // `fillOrderForm`/`reset()` hidrata o array real assim que a query
      // resolve — o `[]` aqui é só o instante antes do 1º `reset`.
      items: isEditing ? [] : [createEmptyOrderItem()],
      // Sem UI própria nesta Tarefa (PED-FE-05 acrescenta o editor) — o
      // objeto já existe na shape para o payload atômico ficar
      // estruturalmente correto desde já.
      installment_details: null,
    },
  });

  // PED-FE-04 — `useFieldArray` de `items` (DEC-PED-FE-ITENS, contrato-tela
  // §6): vive no formulário PAI (aqui), `OrderItemsEditor`/`OrderItemRow`
  // recebem `control`/`fields`/`append`/`remove` por prop (mirror
  // `BudgetItemsEditor`).
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: 'items' });

  // PED-FE-07 — `InlineClientModal` (SURF-016..019, IG-018..021). Botão
  // "+"/"editar" ao lado do select de cliente (mirror
  // `VendaAnimais/CreateOrUpdateMovementSale.tsx::clientModalDisclosure`).
  const clientModalDisclosure = useDisclosure();
  // `useWatch` isolado só do campo `client` — dá ao wrapper o uuid atual
  // para o modal decidir CRIAR (undefined) vs EDITAR (IG-018, hidrata via
  // `GET clients/{uuid}`), sem re-render do form inteiro a cada tecla de
  // outro campo (mesmo racional de `OrderFooterTotals` abaixo).
  const selectedClient = useWatch({ control, name: 'client' });
  // IG-018/019 — "insere/atualiza a option e seleciona no pai, sem refetch
  // pesado": `setValue` já seleciona a option recém-criada/editada
  // diretamente no `AsyncPaginate` (basta o `value` controlado); o bump de
  // `cacheUniqs` só invalida o cache INTERNO do menu, garantindo que a
  // option apareça ao reabrir o dropdown — sem refazer a busca corrente.
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);

  // ✅ LEI 2 — função nomeada com guarda de `dirtyFields`, `resetForce` na
  // carga inicial (`useCustomFormQueryById` sempre chama com `true`).
  function fillOrderForm(data: OrderDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        code: data.code,
        date: data.date,
        client: data.client ? { label: data.client.info, value: data.client.uuid } : null,
        freight: data.freight,
        discount: data.discount,
        note: data.note,
        payment_method: data.payment_method
          ? { label: data.payment_method.label, value: data.payment_method.value }
          : null,
        installments: data.installments,
        interval: data.interval,
        due_date: data.due_date,
        items: data.items.map((item): OrderItemForm => ({
          olds: item.uuid,
          product: { label: item.product.description, value: item.product.uuid },
          um: item.product.measurement ?? '',
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          discount_percent: computeItemDiscountPercent(item.discount, item.quantity, item.price),
          total_amount: item.total,
        })),
        // PARADA-DEF-B (CLM-024, corrigir): `has_input` reidratado como
        // booleano real (nunca null/"Selecione") — a UI de PED-FE-05
        // consome este valor direto, sem reinterpretar `0`/`1`.
        installment_details: data.installment_details
          ? {
              has_input: data.installment_details.has_input,
              input_date: data.installment_details.input_date,
              input_value: data.installment_details.input_value,
              qtt_installments: data.installment_details.qtt_installments,
              first_installment: data.installment_details.first_installment,
              installment_interval: data.installment_details.installment_interval,
              fiscal_document: data.installment_details.fiscal_document,
              installments: data.installment_details.installments.map((entry) => ({
                date: entry.date_installment,
                value: entry.value_installment,
              })),
            }
          : null,
      });
    }
  }

  const orderQuery = useCustomFormQueryById<OrderDetail>({
    registrationId: uuid ?? '',
    asyncFunction: getOrder,
    queryKey: queryKey.orders.order,
    fillForm: fillOrderForm,
  });

  // Prévia do próximo `code` — só em CRIAÇÃO (`GET /orders/next-code`,
  // CV-001, mirror `getNextBudgetCode`). Falha na consulta mantém '—'
  // (fallback, não quebra o formulário).
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.orders.nextCode],
    queryFn: async () => (await getNextOrderCode()).data.code,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // `useCustomFormQueryById` devolve o `useQuery` cru mas TIPADO como
  // `Response<TData>` (mirror `CreateOrUpdateBudget.tsx`) — `as any` é o
  // idioma já usado nesta base para contornar essa divergência de tipo sem
  // alterar o hook.
  const isLoadingOrderQuery = isEditing && checkLoadingStatus([orderQuery as any]);
  const codeValue = isEditing ? (orderQuery.data?.code ?? '—') : (nextCodeQuery.data ?? '—');
  const codeLoading = isEditing ? isLoadingOrderQuery : nextCodeQuery.isLoading;

  const orderMutation = useRequest({
    asyncFunction: tryPersistOrder,
    entityName: text.singularLabel,
    queryKey: queryKey.orders.order,
    queryKey2: queryKey.orders.orders,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // ✅ LEI 3 — wrapper nomeado; monta o payload atômico real (`code`/
  // `status`(create)/`subtotal`/`total` NUNCA entram — sempre gerados/
  // recalculados no servidor, contrato-api-pedidos.md §3.3).
  async function tryPersistOrder(data: OrderForm) {
    const { discount } = computeOrderTotals(data.items, Number(data.freight) || 0);

    const installmentDetailsPayload: OrderInstallmentDetailsPayload | null =
      data.installment_details
        ? {
            has_input: data.installment_details.has_input,
            input_date: data.installment_details.input_date,
            input_value: data.installment_details.input_value,
            qtt_installments: Number(data.installment_details.qtt_installments) || 0,
            first_installment:
              data.installment_details.first_installment || data.due_date || data.date,
            installment_interval: Number(data.installment_details.installment_interval) || 0,
            fiscal_document: data.installment_details.fiscal_document,
            installments: data.installment_details.installments.map((entry) => ({
              date_installment: entry.date,
              value_installment: Number(entry.value),
            })),
          }
        : null;

    const payload: CreateOrderRequest = {
      date: data.date,
      client_uuid: data.client!.value,
      freight: Number(data.freight) || 0,
      discount,
      note: data.note || null,
      // PED-FE-05 — `payment_method` obrigatório (F-020, `order-schema.ts`
      // já bloqueia o submit sem ele); o `as unknown as OrderPaymentMethod`
      // só existe porque `Option<T>.value` é opcional no tipo genérico —
      // aqui sempre vem preenchido (Yup `.required()`) antes do `handleSubmit`
      // chegar a chamar este wrapper.
      payment_method: data.payment_method!.value as OrderPaymentMethod,
      installments: Number(data.installments) || 1,
      interval: Number(data.interval) || 0,
      due_date: data.due_date || data.date,
      items: data.items.map((item): OrderItemPayload => ({
        // PARADA-DEF-D — repassa `olds` tal como veio do form; nunca
        // inventa: linha nova (sem `olds`) cai no branch de criação do
        // servidor, linha hidratada (`olds` = uuid original) no de update.
        olds: item.olds,
        product_uuid: item.product!.value,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: item.discount ?? null,
      })),
      installment_details: installmentDetailsPayload,
    };

    if (isEditing && uuid) {
      return await updateOrder(uuid, payload);
    }
    return await createOrder(payload);
  }

  async function onSubmit(data: OrderForm) {
    // ERRO-FE-001 — `!isEmpty(dirtyFields)` é "HÁ algo sujo" (a guarda
    // correta é a inversa da usada em `fillOrderForm`). Sem isso, salvar
    // uma edição real cairia no early-return e nenhum PUT sairia.
    if (isEditing && !isEmpty(dirtyFields)) {
      // T3 (Onda G, execução 065) — early-return "nada mudou" deixava de dar
      // qualquer feedback (no-op silencioso equivalente ao do `onInvalid`).
      // Mirror `FeedlotSectorDialog.tsx`/`FeedlotYardDialog.tsx`
      // (`text.dialog.noChangesToast`).
      toaster.create({
        type: 'info',
        title: text.singularLabel,
        description: text.form.noChangesToast,
      });
      return;
    }
    await orderMutation.mutateAsync(data);
  }

  // T1 (Onda G, execução 065) — `handleSubmit(onSubmit)` sem 2º argumento
  // deixava uma reprovação do resolver Yup 100% silenciosa (nem toast, nem
  // request saía) — causa-raiz do "Salvar não faz nada"
  // (`onda-G-pedidos-salvar-plano.md §4/§5`). `onInvalid` cobre as DUAS
  // chamadas de `handleSubmit` abaixo (footer + `<Form onSubmit>`).
  function onInvalid(formErrors: FieldErrors<OrderForm>) {
    const firstError = findFirstFieldError(formErrors);

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: firstError?.message ?? text.form.errors.invalidFields,
      duration: 6000,
    });

    if (firstError?.path) {
      setFocus(firstError.path as any);
    }
  }

  const isSaving = orderMutation.isPending || isSubmitting;

  // T4 (Onda G, execução 065) — `!isEmpty(dirtyFields)` aqui significava
  // "NADA sujo" (polaridade correta só no `onSubmit`, ERRO-FE-001); usada
  // para "HÁ mudança" era a polaridade ERRADA. Efeito do bug: o guard de
  // saída disparava em form pristino e NUNCA disparava com edição real.
  // Mirror `CreateOrUpdateBudget.tsx` (mesma guarda, polaridade correta).
  const hasUnsavedChanges = isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const isLoadingOrder = isLoadingOrderQuery;

  return (
    <>
      <FormContainer
        title={isEditing ? text.form.title.edit : text.form.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoadingOrder}
              />
            )}
          </>
        }
      >
        {isLoadingOrder ? (
          <VStack align="stretch" gap={4}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="200px" />
          </VStack>
        ) : (
          <Form noPadding id="order-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
            {/* Cabeçalho — ORDEM FIEL ao legado (F-001..004): código
                (readonly) → responsável (readonly, decorativo — NUNCA no
                schema/payload, `user_id` é NAO_APLICAVEL como input,
                servidor força o usuário autenticado) → data → cliente
                (F-019). `note` (F-006) vive no rodapé (ordem VISUAL, mirror
                `CreateOrUpdateBudget.tsx`). */}
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                name="code"
                label={header.code}
                value={codeValue}
                loading={codeLoading}
              />

              <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

              {/* `DateInput` não tem prop `label`/`error` própria — wrapper
                  Box+Text é o MESMO padrão usado em `CreateOrUpdateBudget.tsx`
                  (mirror `Invoices/CreateOrUpdateInvoice.tsx`). */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {header.date}
                </Text>
                <Controller
                  name="date"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <DateInput
                        value={field.value ?? null}
                        onChange={(value) => field.onChange(value ?? '')}
                        disabled={!canSave}
                      />
                      {error?.message && (
                        <Text fontSize="xs" color="fg.error" mt={1}>
                          {error.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </Box>

              {/* PED-FE-07 — botão "+"/"editar" (`InlineClientModal`) ao lado
                  do select de cliente (SURF-016..019, IG-018/019, GAP-API-FE-01
                  desbloqueado — mirror `CreateOrUpdateMovementSale.tsx`). */}
              <Controller
                name="client"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={header.client}
                    placeholder={text.form.placeholders.header.client}
                    service={listOrderClientOptions}
                    mapOptions={mapClientOption}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isRequired
                    isDisabled={!canSave}
                    cacheUniqs={[clientOptionsCacheKey]}
                    // EST-07 — botão "+"/"editar" (`InlineClientModal`)
                    // migrado do `IconButton` avulso para o `labelAction`,
                    // mirror EXATO `CreateOrUpdateMovementSale.tsx`.
                    labelActionTooltip={
                      field.value ? text.form.clientModal.editAria : text.form.clientModal.addAria
                    }
                    labelAction={
                      <IconButton
                        aria-label={
                          field.value
                            ? text.form.clientModal.editAria
                            : text.form.clientModal.addAria
                        }
                        variant="ghost"
                        size="2xs"
                        minH="0"
                        h="20px"
                        w="20px"
                        minW="0"
                        p="0"
                        disabled={!canSave || !(can('clients_create') || can('clients_edit'))}
                        onClick={clientModalDisclosure.onOpen}
                      >
                        <Icon
                          as={field.value ? FiEdit : FiPlus}
                          boxSize="16px"
                          color="primaryMain"
                        />
                      </IconButton>
                    }
                  />
                )}
              />
            </SimpleGrid>

            {/* Seção de ITENS (`OrderItemsEditor`/`OrderItemRow`,
                `useFieldArray('items')`, PED-FE-04 — F-007..F-014,
                IG-001..IG-009). */}
            <Box mt={6}>
              <OrderItemsEditor
                control={control}
                fields={itemFields}
                append={appendItem}
                remove={removeItem}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>

            {/* Rodapé — subtotal/desconto/total SEMPRE readonly (recalculados
                no servidor, CV-004/005/006); `freight` é o ÚNICO campo
                editável do rodapé (CV-007). Os 3 readonly são PREVIEW
                client-side — nunca enviados como tal ao servidor (o payload
                não tem `subtotal`/`total`, só `discount` agregado). */}
            <OrderFooterTotals control={control} footerText={footerText} />

            <Box mt={6}>
              <Controller
                name="freight"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={footerText.freight}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />
            </Box>

            <Box mt={6}>
              <Textarea
                label={header.note}
                maxLength={200}
                {...register('note')}
                error={errors.note?.message}
                disabled={!canSave}
              />
            </Box>

            {/* Seção de PAGAMENTO/PARCELAS (`OrderPaymentsEditor`,
                `useFieldArray('installment_details.installments')` DECLARADO
                DENTRO do editor, PED-FE-05 — F-020..F-029, IG-010..014/017).
                ORDEM FIEL ao legado: `payment_method` (F-020) vem logo após
                `note` (F-019). */}
            <OrderPaymentsEditor
              control={control}
              errors={errors}
              languageGB={languageGB}
              isCreating={!isEditing}
              disabled={!canSave}
            />
          </Form>
        )}
      </FormContainer>

      <InlineClientModal
        isOpen={clientModalDisclosure.open}
        onClose={clientModalDisclosure.onClose}
        clientUuid={selectedClient?.value}
        onSaved={(client) => {
          setValue(
            'client',
            { value: client.uuid, label: client.label },
            { shouldDirty: true, shouldValidate: true }
          );
          setClientOptionsCacheKey((key) => key + 1);
        }}
      />

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={text.form.unsavedChangesDialog.title}
        description={text.form.unsavedChangesDialog.description}
        confirmButtonText={text.form.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}

// Rodapé de totais — `useWatch` local (Controller genérico via `control`
// tipado do PAI) para não recalcular via estado próprio (Lei 4). Extraído
// como subcomponente para isolar `useWatch('items')`/`useWatch('freight')`
// do resto do form (evita re-render do formulário inteiro a cada tecla) —
// mirror `BudgetFooterTotals` de `CreateOrUpdateBudget.tsx`.
interface OrderFooterTotalsProps {
  control: Control<OrderForm>;
  footerText: {
    subtotal: string;
    freight: string;
    discount: string;
    total: string;
  };
}

function OrderFooterTotals({ control, footerText }: OrderFooterTotalsProps) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;

  const { subtotal, discount, total } = computeOrderTotals(items, freight);

  return (
    <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
      <InputReadOnly label={footerText.subtotal} value={formatCurrencyBRL(subtotal)} />
      <InputReadOnly label={footerText.discount} value={formatCurrencyBRL(discount)} />
      <InputReadOnly label={footerText.total} value={formatCurrencyBRL(total)} />
    </SimpleGrid>
  );
}
