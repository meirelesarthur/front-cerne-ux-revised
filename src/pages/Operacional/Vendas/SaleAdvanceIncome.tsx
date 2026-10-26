// src/pages/Operacional/Vendas/SaleAdvanceIncome.tsx
// -----------------------------------------------------------------------------
// Formulário de Adiantamento da Venda COMERCIAL (Sale — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-07, `S-SCREEN-006`/
// `S-FORM-003`/`FM006`). Rota `/operacional/vendas/:uuid/adiantamento`
// (`incomes_create`, §8 DEC-02 do contrato-api).
//
// GAP-043-SALE-FE-COM-03 `[RESOLVIDO]`: `GET /sales/{uuid}/advance-income`
// (A8) devolve SÓ saldo/pré-preenchimento (`SaleAdvanceIncomeDraft`, mirror
// `BuildAdvanceIncomeDraftAction`) — `client_uuid` NUNCA é campo do form
// (o backend resolve sempre a partir da própria Venda,
// `StoreAdvanceIncomeFromSaleAction`); aqui é só EXIBIDO (`InputReadOnly`,
// vindo do draft). Catálogos (`type_title_uuid`/categoria/centro/conta
// contábil) vêm SEMPRE dos endpoints de options já migrados
// (`/type-titles/options`, `/financial-categories/options`, `/cost-centers/
// options`, `/plan-accounts/options`) — nenhum duplicado.
//
// `payment_type` (=4)/`installment`+`qtd_installments` (=1) — FIXOS
// readonly (legado `SaleAdvanceIncomeController`), exibidos como
// `InputReadOnly` com valor fixo; NUNCA um Select real, NUNCA lidos do
// payload (o servidor sempre grava esses 3 valores).
//
// `amount` default = `sale.total` (draft), editável (obrigatório `>0`).
// `SE012` preservado — NENHUMA baixa automática; sucesso navega para
// `/financeiro/receber/:incomeUuid` (PARADA-6, `writeoff_hint`/
// `income.uuid`), onde vive `IncomeAutomaticWriteoffSection`.
//
// `useFieldArray('allocations')` vive AQUI (formulário pai) —
// `SaleAdvanceIncomeAllocation.tsx` (SALE-FE-COM-08) recebe `fields`/
// `append`/`remove` por prop, nunca instancia o próprio array.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type UseFieldArrayAppend,
} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { AuthContext } from '@/contexts/AuthContext';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';
import { regex } from '@/utils/regex-id';

import { columnsForm } from '@/constants/coluns-form';
import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { saleAdvanceIncomeSchemaResolver } from '@/validations/schemas/Sales/sale-advance-income-schema';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { createSaleAdvanceIncome, getSaleAdvanceIncome } from '@/services/v2/Sales/sale-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type {
  SaleAdvanceIncomeDraft,
  SaleAdvanceIncomeForm,
  SaleAdvanceIncomePayload,
} from '@/@types/v2/Sales';

import { SaleAdvanceIncomeAllocation } from './SaleAdvanceIncomeAllocation';

import type { SaleAdvanceIncomeAllocationFieldValues } from './SaleAdvanceIncomeAllocation';

const SALES_LIST_ROUTE = '/operacional/vendas';

function todayIso(): string {
  return todayLocalIso();
}

function mapTypeTitleOption(item: TypeTitleOptionItem): Option<string> {
  return { label: item.description, value: item.uuid };
}

function mapProprietaryOption(item: ProprietaryOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

interface ListProprietaryOptionsPaginatedParams extends PaginationQueryParams {
  search?: string;
}

// Adapta o array FLAT de `listProprietaryOptions` para o contrato
// `ResponsePagination` que `SelectAsyncPaginate` exige (mirror
// `SaleTotalsBlock.tsx::listProprietaryOptionsPaginated`).
async function listProprietaryOptionsPaginated(params: ListProprietaryOptionsPaginatedParams) {
  // `scope='farm'` (GAP-EARNING-07) — escopa pela fazenda ATIVA via
  // `farm_proprietary` (mirror SSR do legado, fix Execução 065 Frente F).
  // `SaleAdvanceIncomeRequest::proprietary_uuid` já valida farm-scoped; sem
  // isto o select listava tenant-wide e a API rejeitava "não pertence à
  // fazenda".
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export default function SaleAdvanceIncome() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.sales.sale;
  const advanceText = text.advanceIncome;

  const canSave = can('incomes_create');

  // TASK-FE-VENDAS-ADV-01 (bug reprovado, F-061) — universo farm-scoped do
  // Select de Centro de Custo do rateio (`SaleAdvanceIncomeAllocation`).
  // Mesmo padrão de `CreateFarmTransfer.tsx`/`CicloProducaoDetalhe.tsx`;
  // pode vir `undefined` para papéis sem fazenda ativa (ex.: revenda) — o
  // backend aplica seu próprio fallback (`/cost-centers/options` sem
  // `farm_uuid`), mesma tenancy dos demais ~47 consumidores do endpoint.
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);

  // Guard de navegação — `uuid` malformado não deve chegar ao hook de query.
  useEffect(() => {
    if (!uuid) return;
    if (uuid.length !== 36 || uuid.replace(regex, '').length > 0) {
      navigate(SALES_LIST_ROUTE);
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SaleAdvanceIncomeForm>({
    mode: 'onChange',
    resolver: saleAdvanceIncomeSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      number: '',
      type_title_uuid: null,
      proprietary_uuid: null,
      payment_type: 4,
      installment: 1,
      qtd_installments: 1,
      amount: null,
      dt_emission: todayIso(),
      due_date: '',
      note: '',
      fiscal_document: booleanOptions.getOption(false, languageGB),
      discount: 0,
      penalty: 0,
      interest: 0,
      perc_interest: 0,
      increase: 0,
      allocations: [
        { category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null },
      ],
    },
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({ control, name: 'allocations' });

  // ✅ LEI 2 — função nomeada com guarda de `dirtyFields`, `resetForce` na
  // carga inicial. Só pré-preenche `amount` (default = saldo/total da
  // venda) — os demais campos nascem em branco (não existe "edição" deste
  // form, é sempre criação a partir do draft).
  function fillAdvanceIncomeForm(data: SaleAdvanceIncomeDraft, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        number: '',
        type_title_uuid: null,
        proprietary_uuid: null,
        payment_type: 4,
        installment: 1,
        qtd_installments: 1,
        amount: data.sale.total,
        dt_emission: todayIso(),
        due_date: '',
        note: '',
        fiscal_document: booleanOptions.getOption(false, languageGB),
        discount: 0,
        penalty: 0,
        interest: 0,
        perc_interest: 0,
        increase: 0,
        allocations: [
          { category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null },
        ],
      });
    }
  }

  const advanceIncomeQuery = useCustomFormQueryById<SaleAdvanceIncomeDraft>({
    registrationId: uuid ?? '',
    asyncFunction: getSaleAdvanceIncome,
    queryKey: queryKey.sales.saleAdvanceIncome,
    fillForm: fillAdvanceIncomeForm,
  });

  const isLoadingDraft = checkLoadingStatus([advanceIncomeQuery as any]);
  const hasDraftLoadError = !isLoadingDraft && !!(advanceIncomeQuery as any)?.isError;
  const draft = (advanceIncomeQuery as any)?.data as SaleAdvanceIncomeDraft | undefined;

  const amount = Number(useWatch({ control, name: 'amount' })) || 0;

  const advanceIncomeMutation = useRequest({
    asyncFunction: tryPersistAdvanceIncome,
    entityName: advanceText.pageTitle,
    queryKey: queryKey.sales.sales,
    queryKey2: queryKey.sales.sale,
    queryKey3: queryKey.incomes.incomes,
    queryKey4: queryKey.incomes.income,
    typesRequest: 'create',
    personalizedMessage: advanceText.successToast,
    actionSuccess: (data) => {
      // SE012 preservado — NENHUMA baixa automática. Destino PARADA-6: o
      // form do título, onde vive `IncomeAutomaticWriteoffSection`.
      navigate(`/financeiro/receber/${data.income.uuid}`);
    },
  });

  // ✅ LEI 3 — wrapper nomeado; monta o payload real. `client_uuid`/
  // `farm_id`/`code`/`balance`/`incomeable_*` NUNCA entram — o servidor
  // resolve sempre a partir da própria Venda. `(%)` (percent) NUNCA vai ao
  // payload — só `value` por linha de rateio (CV007).
  async function tryPersistAdvanceIncome(data: SaleAdvanceIncomeForm) {
    if (!uuid) throw new Error('Sale uuid ausente.');

    const payload: SaleAdvanceIncomePayload = {
      number: data.number,
      type_title_uuid: data.type_title_uuid!.value,
      payment_type: 4,
      proprietary_uuid: data.proprietary_uuid?.value || null,
      dt_emission: data.dt_emission,
      due_date: data.due_date,
      amount: Number(data.amount),
      note: data.note,
      fiscal_document: !!data.fiscal_document?.value,
      discount: Number(data.discount) || 0,
      penalty: Number(data.penalty) || 0,
      interest: Number(data.interest) || 0,
      perc_interest: Number(data.perc_interest) || 0,
      increase: Number(data.increase) || 0,
      categories: data.allocations.map((row) => ({
        category_uuid: row.category_uuid!.value,
        center_uuid: row.center_uuid!.value,
        plan_account_uuid: row.plan_account_uuid?.value || null,
        value: Number(row.value),
      })),
    };

    return await createSaleAdvanceIncome(uuid, payload);
  }

  async function onSubmit(data: SaleAdvanceIncomeForm) {
    await advanceIncomeMutation.mutateAsync(data);
  }

  const isSaving = advanceIncomeMutation.isPending || isSubmitting;

  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const backRoute = SALES_LIST_ROUTE;

  return (
    <>
      <FormContainer
        title={advanceText.pageTitle}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(backRoute)}
            />
            {canSave && (
              <Button
                title={advanceText.saveButton}
                type="submit"
                form="sale-advance-income-form"
                loading={isSaving}
                disabled={isSaving || isLoadingDraft}
              />
            )}
          </>
        }
      >
        {isLoadingDraft ? (
          <VStack align="stretch" gap={4}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="200px" />
          </VStack>
        ) : hasDraftLoadError ? (
          <VStack gap={3} py={12}>
            <Text color="fg.muted">{text.list.error.message}</Text>
            <Button
              variant="outline"
              title={text.list.error.retry}
              onClick={() => (advanceIncomeQuery as any)?.refetch?.()}
            />
          </VStack>
        ) : (
          <Form noPadding id="sale-advance-income-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Identificação da Venda (display-only, `BuildAdvanceIncome
                DraftAction`) — `client` NUNCA é campo do form/payload. */}
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly label={advanceText.fields.saleCode} value={draft?.sale.code ?? '—'} />
              <InputReadOnly
                label={advanceText.fields.client}
                value={draft?.sale.client?.info ?? '—'}
              />
              <InputReadOnly
                label={advanceText.fields.balanceAvailable}
                value={formatCurrencyBRL(draft?.sale.total ?? 0)}
              />
            </SimpleGrid>

            {/* `FM006` — cabeçalho do título. */}
            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <Input
                label={advanceText.fields.number}
                maxLength={14}
                {...register('number')}
                error={errors.number?.message}
                isRequired
                disabled={!canSave}
              />

              <Controller
                name="type_title_uuid"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={advanceText.fields.typeTitle}
                    service={listTypeTitleOptions}
                    mapOptions={mapTypeTitleOption}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isRequired
                    isDisabled={!canSave}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="proprietary_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={advanceText.fields.proprietary}
                    service={listProprietaryOptionsPaginated}
                    mapOptions={mapProprietaryOption}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <InputReadOnly
                label={advanceText.fields.paymentType}
                value={advanceText.fields.paymentTypeFixedValue}
              />
              <InputReadOnly
                label={advanceText.fields.installments}
                value={advanceText.fields.installmentsFixedValue}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.amount}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    isRequired
                    disabled={!canSave}
                  />
                )}
              />

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {advanceText.fields.dtEmission}
                </Text>
                <Controller
                  name="dt_emission"
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

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {advanceText.fields.dueDate}
                </Text>
                <Controller
                  name="due_date"
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
                name="fiscal_document"
                control={control}
                render={({ field }) => (
                  <Select
                    name={field.name}
                    label={advanceText.fields.fiscalDocument}
                    options={booleanOptions.options(languageGB)}
                    value={field.value ?? null}
                    onChange={(option) => field.onChange(option ?? null)}
                    isDisabled={!canSave}
                    noClearable
                  />
                )}
              />

              <Controller
                name="discount"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.discount}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="penalty"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.penalty}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="interest"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.interest}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="perc_interest"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.percInterest}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="increase"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={advanceText.fields.increase}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />
            </SimpleGrid>

            <Box mt={6}>
              <Textarea
                label={advanceText.fields.note}
                maxLength={600}
                rows={4}
                error={errors.note?.message}
                isRequired
                disabled={!canSave}
                {...register('note')}
              />
            </Box>

            {/* Rateio (`FM007`, SALE-FE-COM-08) — `useFieldArray` no PAI. */}
            <Box mt={6}>
              <SaleAdvanceIncomeAllocation
                control={control}
                fields={allocationFields}
                append={
                  appendAllocation as unknown as UseFieldArrayAppend<
                    SaleAdvanceIncomeAllocationFieldValues,
                    'allocations'
                  >
                }
                remove={removeAllocation}
                setValue={setValue}
                amount={amount}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
                farmUuid={activeFarmUuid}
              />
            </Box>
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

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
