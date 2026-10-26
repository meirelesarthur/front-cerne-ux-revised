// src/pages/Operacional/Budget/CreateOrUpdateBudget.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO/EDIÇÃO de Orçamento (Budget — Operacional / Vendas,
// F-018, 97-Esteiras/054, TASK-BG-FE-03/04). Rotas `/operacional/orcamentos/novo`
// (`budgets_create`) e `/operacional/orcamentos/:uuid` (`budgets_edit`),
// MESMO componente (mirror `Invoices`, `budgets-frontend-contract.md §5.2`).
//
// Mirror ESTRUTURAL DIRETO de `Administrativo/Requisition/
// CreateRequisition.tsx` (casca `FormContainer`+`Form`, `useFieldArray`
// vivendo no PAI, editores recebendo `control`/`fields`/`append`/`remove`/
// `errors` por prop) + `get_pwa_form_query_pattern` (`useCustomFormQueryById`+
// `fillForm` nomeada, Lei 2).
//
// ESCOPO: cabeçalho (`FLD-01..06`, `TASK-BG-FE-03`) + editor de ITENS
// (`BudgetItemsEditor.tsx`, `FLD-07..14`, `TASK-BG-FE-03`) + editor de
// PAGAMENTOS (`BudgetPaymentsEditor.tsx`, `FLD-20..34`, `TASK-BG-FE-04`,
// `useFieldArray` no mesmo nível de `items`; o bloco financeiro de
// parcelamento — `useFieldArray` aninhado — vive em `BudgetPaymentRow.tsx`).
//
// GAP-BG-FE-09 (RESOLVIDO nesta Tarefa): `TASK-BG-FE-03` documentava que o
// schema `payments.min(1)` bloqueava o submit de CRIAÇÃO por falta de UI de
// pagamentos — `BudgetPaymentsEditor` (`TASK-BG-FE-04`) fecha essa lacuna;
// criar um orçamento com >=1 pagamento agora é salvável normalmente.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
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
import { regex } from '@/utils/regex-id';

import { budgetPaymentMethodOptions } from '@/constants/Budgets/options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { budgetSchemaResolver } from '@/validations/schemas/Budgets/budget-schema';

import {
  createBudget,
  getBudget,
  getNextBudgetCode,
  updateBudget,
} from '@/services/v2/Budgets/budget-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';

import type {
  BudgetData,
  BudgetForm,
  BudgetItemPayload,
  BudgetPaymentPayload,
  CreateOrUpdateBudgetPayload,
} from '@/@types/v2/Budgets';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';

import { BudgetItemsEditor, createEmptyBudgetItem } from './BudgetItemsEditor';
import { BudgetPaymentsEditor } from './BudgetPaymentsEditor';

import type { BudgetItemsFieldValues } from './BudgetItemsEditor';
import type { BudgetPaymentsFieldValues } from './BudgetPaymentsEditor';
import type { Control, UseFieldArrayAppend } from 'react-hook-form';

function mapClientOption(item: ClientListItem) {
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

export default function CreateOrUpdateBudget() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.budgets.budget;
  const header = text.form.fields.header;
  const footerText = text.form.fields.footer;

  const isEditing = !!uuid;
  const canSave = can(isEditing ? 'budgets_edit' : 'budgets_create');

  // Guard de navegação — `uuid` malformado não deve chegar ao hook de query
  // (mirror `get_pwa_form_query_pattern`, "Guard de navegação").
  useEffect(() => {
    if (!uuid) return;
    if (uuid.length !== 36 || uuid.replace(regex, '').length > 0) {
      navigate('/operacional/orcamentos');
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<BudgetForm>({
    mode: 'onChange',
    resolver: budgetSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIso(),
      client: null,
      freight: 0,
      note: null,
      // AJUSTE #3 (homologação do dono) — modo CREATE já nasce com 1 linha
      // de item vazia (mesma shape do botão "Adicionar Item +",
      // `createEmptyBudgetItem` de `BudgetItemsEditor.tsx` — sem duplicar a
      // shape), já que o mínimo de 1 item é obrigatório de qualquer forma.
      // Modo EDIT não regride: `items` é sobrescrito pelos itens reais em
      // `fillBudgetForm` (`resetForce` na carga inicial), então o item
      // vazio aqui nunca sobrevive à edição.
      items: isEditing ? [] : [createEmptyBudgetItem()],
      payments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({ control, name: 'payments' });

  // ✅ LEI 2 — função nomeada com guarda de `dirtyFields`, `resetForce` na
  // carga inicial (`useCustomFormQueryById` sempre chama com `true`).
  function fillBudgetForm(data: BudgetData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        code: data.code,
        date: data.date,
        client: data.client ? { label: data.client.name ?? '—', value: data.client.uuid } : null,
        freight: data.freight,
        note: data.note,
        items: data.items.map((item) => ({
          uuid: item.uuid,
          product: { label: item.product.description, value: item.product.uuid },
          unit: item.product.unit ?? '',
          quantity: item.quantity,
          amount: item.amount,
          discount: item.discount,
          total: item.total,
        })),
        // Hidratado sem UI própria nesta Tarefa (ver docblock, GAP-BG-FE-09)
        // — reenviado intacto no submit para não apagar pagamentos reais
        // via diff-por-uuid do servidor.
        payments: data.payments.map((payment) => ({
          uuid: payment.uuid,
          payment_method: budgetPaymentMethodOptions.getOption(payment.payment_method, languageGB),
          installments: payment.installments,
          interval: payment.interval,
          due_date: payment.due_date,
          amount: payment.amount,
          total: payment.total,
          installment_details: payment.installment_details,
        })),
      });
    }
  }

  const budgetQuery = useCustomFormQueryById<BudgetData>({
    registrationId: uuid ?? '',
    asyncFunction: getBudget,
    queryKey: queryKey.budgets.budget,
    fillForm: fillBudgetForm,
  });

  // Prévia do próximo `code` — só em CRIAÇÃO (`GET /budgets/next-code`,
  // GAP-BG-05, mirror `getServiceOrderNextCode`/`CreateRequisition.tsx`).
  // Falha na consulta mantém '—' (fallback, não quebra o formulário).
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.budgets.nextCode],
    queryFn: async () => (await getNextBudgetCode()).data.code,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // `useCustomFormQueryById` (convenção REAL do fork) devolve o `useQuery`
  // cru mas TIPADO como `Response<TData>` (mirror `CreateOrUpdatePlanning.tsx`
  // — o próprio TS não enxerga `isLoading` no tipo declarado, só em runtime)
  // — `checkLoadingStatus([budgetQuery as any])` é o idioma já usado nesta
  // base para contornar essa divergência de tipo sem alterar o hook.
  const isLoadingBudgetQuery = isEditing && checkLoadingStatus([budgetQuery as any]);
  const codeValue = isEditing ? (budgetQuery.data?.code ?? '—') : (nextCodeQuery.data ?? '—');
  const codeLoading = isEditing ? isLoadingBudgetQuery : nextCodeQuery.isLoading;

  const budgetMutation = useRequest({
    asyncFunction: tryPersistBudget,
    entityName: text.singularLabel,
    queryKey: queryKey.budgets.budget,
    queryKey2: queryKey.budgets.budgets,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // ✅ LEI 3 — wrapper nomeado; monta o payload real (`code`/`subtotal`/
  // `total`/`discount` NUNCA entram — sempre gerados/recalculados no
  // servidor, `budgets-api-contract.md §4.3`).
  async function tryPersistBudget(data: BudgetForm) {
    const payload: CreateOrUpdateBudgetPayload = {
      date: data.date,
      client_uuid: data.client!.value,
      freight: Number(data.freight) || 0,
      note: data.note || null,
      items: data.items.map((item): BudgetItemPayload => ({
        uuid: item.uuid,
        product_uuid: item.product!.value,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        discount: item.discount ?? null,
      })),
      // Reenviado intacto (ver `fillBudgetForm`, GAP-BG-FE-09) — esta Tarefa
      // não altera pagamentos, só preserva o que já existia.
      payments: data.payments.map((payment): BudgetPaymentPayload => ({
        uuid: payment.uuid,
        payment_method: payment.payment_method!.value,
        installments: Number(payment.installments),
        interval: Number(payment.interval),
        due_date: payment.due_date,
        amount: payment.amount,
        total: Number(payment.total),
        installment_details: payment.installment_details,
      })),
    };

    if (isEditing && uuid) {
      return await updateBudget(uuid, payload);
    }
    return await createBudget(payload);
  }

  async function onSubmit(data: BudgetForm) {
    if (isEditing && isEmpty(dirtyFields)) return; // Lei 2 — nada a salvar
    await budgetMutation.mutateAsync(data);
  }

  const isSaving = budgetMutation.isPending || isSubmitting;

  // Guarda de saída sem salvar — mirror `CreateOrUpdatePlanning.tsx`.
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const isLoadingBudget = isLoadingBudgetQuery;

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
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoadingBudget}
              />
            )}
          </>
        }
      >
        {isLoadingBudget ? (
          <VStack align="stretch" gap={4}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="200px" />
          </VStack>
        ) : (
          <Form noPadding onSubmit={handleSubmit(onSubmit)}>
            {/* Cabeçalho — ORDEM FIEL ao legado (`FLD-01..04`): código
                (readonly) → responsável (readonly, decorativo — mirror
                `CreateRequisition.tsx`, NUNCA no schema/payload, `user_id`
                é NAO_APLICAVEL como input) → data → cliente. `note`
                (FLD-06) vive no rodapé (ordem VISUAL, `budgets-frontend-
                contract.md §5.2`). */}
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                name="code"
                label={header.code}
                value={codeValue}
                loading={codeLoading}
              />

              <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

              {/* `DateInput` não tem prop `label`/`error` própria — wrapper
                  Box+Text é o MESMO padrão já usado em
                  `Invoices/CreateOrUpdateInvoice.tsx` (`dt_emission`). */}
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

              <Controller
                name="client"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={header.client}
                    service={listClients}
                    mapOptions={mapClientOption}
                    findParams={(search: string | { search: string }) => ({
                      ...findParamsFromSearch(search),
                      is_enabled: true,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isRequired
                    isDisabled={!canSave}
                  />
                )}
              />
            </SimpleGrid>

            {/* Editor de itens — `useFieldArray` vive AQUI (pai), mirror
                `CreateRequisition.tsx`. */}
            <Box mt={6}>
              <BudgetItemsEditor
                control={control}
                fields={fields}
                append={append as unknown as UseFieldArrayAppend<BudgetItemsFieldValues, 'items'>}
                remove={remove}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>

            {/* Rodapé — subtotal/desconto/total SEMPRE readonly (recalculados
                no servidor, CV-02/03/04); `freight` é o ÚNICO campo editável
                do rodapé (mirror `budgets-frontend-contract.md §5.2`). Os 3
                readonly aqui são PREVIEW client-side — nunca enviados como
                tal ao servidor (o payload não tem `subtotal`/`total`). */}
            <BudgetFooterTotals control={control} footerText={footerText} />

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

            {/* Editor de PAGAMENTOS (`TASK-BG-FE-04`) — `useFieldArray` no
                mesmo nível de `items` (PAI), mesmo `useForm<BudgetForm>` da
                fundação. Bloco financeiro de parcelamento (`useFieldArray`
                aninhado) vive em `BudgetPaymentRow.tsx`. */}
            <BudgetPaymentsEditor
              control={control}
              fields={paymentFields}
              append={
                appendPayment as unknown as UseFieldArrayAppend<
                  BudgetPaymentsFieldValues,
                  'payments'
                >
              }
              remove={removePayment}
              errors={errors}
              languageGB={languageGB}
              disabled={!canSave}
            />
          </Form>
        )}
      </FormContainer>

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
// como subcomponente para isolar o `useWatch('items')`/`useWatch('freight')`
// do resto do form (evita re-render do formulário inteiro a cada tecla).
interface BudgetFooterTotalsProps {
  control: Control<BudgetForm>;
  footerText: {
    subtotal: string;
    freight: string;
    discount: string;
    total: string;
  };
}

function BudgetFooterTotals({ control, footerText }: BudgetFooterTotalsProps) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;

  const subtotal = roundTo2(
    items.reduce(
      (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.amount) || 0),
      0
    )
  );
  const discount = roundTo2(items.reduce((sum, item) => sum + (Number(item?.discount) || 0), 0));
  const total = roundTo2(subtotal + freight - discount);

  return (
    <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
      <InputReadOnly label={footerText.subtotal} value={formatCurrencyBRL(subtotal)} />
      <InputReadOnly label={footerText.discount} value={formatCurrencyBRL(discount)} />
      <InputReadOnly label={footerText.total} value={formatCurrencyBRL(total)} />
    </SimpleGrid>
  );
}
