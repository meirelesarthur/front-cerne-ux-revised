// src/pages/Administrativo/Recebimentos/GerarFinanceiroPage.tsx
// -----------------------------------------------------------------------------
// Tela de escrita "Gerar Financeiro" (RequestReceipt — Administrativo /
// Suprimentos). `GET /request-receipts/{uuid}/financial` (contexto: valor sugerido
// server-authoritative) + `POST /request-receipts/{uuid}/financial` (gera) — rota
// `/administrativo/recebimentos/:uuid/financeiro` (`request-purchases_financial`).
//
// Execução 081, T-081-FE-10 (LEGADO-SUPRIMENTOS-09, FF-01..FF-26, IG-01..IG-14):
//  - Valor Total abre com `vl_total_suggested` e só é editável no tipo D
//    (`vl_total_editable`); só o tipo D envia `vl_total` (a API usa o sugerido nos demais);
//  - cabeçalho somente leitura: Código, Responsável (usuário logado), Data
//    Recebimento, Número da NFe e Observações;
//  - "Possui entrada ?" e "Int. Parcelas (dias)" abrem vazios (FF-13, FF-18);
//  - parcelas recalculadas ao sair dos campos (blur) e ao mudar datas/entrada
//    (change): a entrada vira a 1ª parcela e o restante é dividido pela
//    quantidade, sem ajuste de resíduo (CV-01, CV-02; ver `installments.ts`);
//  - Nº Título e Fornecedor obrigatórios; parcelas e rateio não vazios; o rateio
//    fecha com o Valor Total (mensagens literais do legado);
//  - payload com as chaves do contrato da API (`financialPayload.ts`); 422 por
//    campo vai para o campo; o congelamento mostra a mensagem da API (toast);
//  - centros de custo do rateio: analíticos, habilitados e da fazenda da solicitação
//    (`farm` do próprio contexto; sem `farm`, sem filtro e a API valida).
//
// Novo Fornecedor REUSA `ProviderFormModal` (boundary reuse).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Icon, IconButton } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, type FieldPath, useForm } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { ProviderFormModal } from '@/pages/CadastrosBase/Fornecedores/ProviderFormModal';
import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';
import { fiscalDocumentOptions } from '@/constants/RequestReceipts/options/fiscal-document-options';
import { hasInputOptions } from '@/constants/RequestReceipts/options/has-input-options';

import { financialSchemaResolver } from '@/validations/schemas/RequestReceipts/financial-schema';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  generateRequestReceiptFinancial,
  getRequestReceiptFinancialContext,
} from '@/services/v2/RequestReceipts/request-receipt-service';

import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type {
  GenerateFinancialForm,
  RequestReceiptFinancialContext,
} from '@/@types/v2/RequestReceipts';

import { mapFinancialApiErrors } from './financialApiErrors';
import { buildFinancialPayload, resolveFinancialFarmUuid } from './financialPayload';
import {
  buildInstallments,
  fillEmptyRatioValues,
  ratioMatchesTotal,
  sumValues,
} from './installments';
import { receiptRoutes } from './receiptsActions';
import { RequestReceiptInstallmentsFieldArray } from './RequestReceiptInstallmentsFieldArray';
import { RequestReceiptRatioFieldArray } from './RequestReceiptRatioFieldArray';

import type { ProviderFormModalSavedPayload } from '@/pages/CadastrosBase/Fornecedores/ProviderFormModal';

// Chave própria do contexto do financeiro: o Confirmar lê `GET /request-receipts/{uuid}`
// sob `requestReceipt` + uuid e os dois shapes não podem dividir o mesmo cache.
const FINANCIAL_CONTEXT_QUERY_KEY = `${queryKey.requestReceipts.requestReceipt}Financial`;

const pristineForm: GenerateFinancialForm = {
  code: null,
  responsible: null,
  receipt_date: null,
  nfe: null,
  receipt_note: null,
  vl_total: null,
  financial_number: '',
  financial_type_id: null,
  financial_proprietary_id: null,
  financial_provider_id: null,
  financial_note: '',
  // Legado: "Possui entrada ?" e "Int. Parcelas (dias)" abrem SEM valor (FF-13, FF-18).
  has_input: null,
  input_value: null,
  input_date: null,
  qtd_installments: null,
  first_installment: null,
  int_installments: null,
  fiscal_document: null,
  installments: [],
  ratio: [],
};

export default function GerarFinanceiroPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const text = languageGB.requestReceipts.requestReceipt;

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [pickedCategoryOptions, setPickedCategoryOptions] = useState<Record<string, Option>>({});
  const [pickedCenterOptions, setPickedCenterOptions] = useState<Record<string, Option>>({});
  const [pickedPlanAccountOptions, setPickedPlanAccountOptions] = useState<Record<string, Option>>(
    {}
  );

  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    setError,
    handleSubmit,
    reset,
    formState: { dirtyFields, isSubmitting, errors },
  } = useForm<GenerateFinancialForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: financialSchemaResolver(languageGB),
    defaultValues: {
      ...pristineForm,
      fiscal_document: fiscalDocumentOptions.getOption(true, languageGB),
    },
  });

  // Lei 2 — função nomeada com guarda de `dirtyFields`.
  function fillFinancialForm(data: RequestReceiptFinancialContext, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        ...pristineForm,
        code: data.code,
        // Legado: o campo "Responsável" mostra o usuário LOGADO (LR09).
        responsible: user?.username ?? data.responsible?.name ?? null,
        receipt_date: data.receipt_date,
        nfe: data.nfe,
        receipt_note: data.receipt_note,
        vl_total: data.vl_total_suggested,
        fiscal_document: fiscalDocumentOptions.getOption(true, languageGB),
      });
    }
  }

  const financialContextQuery = useCustomFormQueryByGuid<RequestReceiptFinancialContext>({
    registrationId: uuid,
    asyncFunction: getRequestReceiptFinancialContext,
    queryKey: FINANCIAL_CONTEXT_QUERY_KEY,
    fillForm: fillFinancialForm,
  });

  const isLoading = checkLoadingStatus([financialContextQuery as any]);

  const contextData = financialContextQuery.data;
  // Fazenda vem do próprio contexto; `null` => sem filtro (a API valida no POST).
  const farmUuid = resolveFinancialFarmUuid(contextData);
  const isVlTotalEditable = contextData?.vl_total_editable ?? contextData?.type === 'D';

  // Recalcula as parcelas (IG-03/IG-04). Sem dados suficientes, não mexe nas linhas.
  function recalculateInstallments() {
    const values = getValues();
    const rows = buildInstallments({
      total: values.vl_total,
      hasEntry: values.has_input?.value === 1,
      entryValue: values.input_value,
      entryDate: values.input_date,
      quantity: values.qtd_installments,
      firstDate: values.first_installment,
      intervalDays: values.int_installments,
    });
    if (!rows) return;
    setValue('installments', rows, { shouldDirty: true, shouldValidate: true });
  }

  // `blur` dos campos numéricos: espera o clamp do próprio campo gravar o valor.
  function recalculateAfterBlur() {
    setTimeout(recalculateInstallments, 0);
  }

  // IG-11 — ao sair de um valor de parcela, o total das parcelas preenche as linhas
  // do rateio sem valor.
  function handleInstallmentValueBlur() {
    setTimeout(() => {
      const values = getValues();
      if (values.ratio.length === 0) return;
      const next = fillEmptyRatioValues(
        values.ratio,
        sumValues(values.installments),
        Number(values.vl_total) || 0
      );
      setValue('ratio', next, { shouldDirty: true, shouldValidate: true });
    }, 0);
  }

  async function tryGenerateFinancial(data: GenerateFinancialForm) {
    const payload = buildFinancialPayload(data, { vlTotalEditable: !!isVlTotalEditable });

    try {
      return await generateRequestReceiptFinancial(uuid as string, payload);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        // 422 flat por campo -> mensagem junto de cada campo (a mensagem geral,
        // inclusive a do congelamento, aparece no toast da mutação).
        mapFinancialApiErrors(error.response?.data?.errors).forEach(({ name, message }) =>
          setError(name as FieldPath<GenerateFinancialForm>, { type: 'server', message })
        );
        if (!error.response?.data?.message) {
          toaster.error({
            title: text.singularLabel,
            description: text.financial.freezeErrorFallback,
          });
        }
      }
      throw error;
    }
  }

  const financialMutation = useRequest({
    asyncFunction: tryGenerateFinancial,
    entityName: text.singularLabel,
    queryKey: queryKey.requestReceipts.requestReceiptsList,
    queryKey2: queryKey.requestReceipts.requestReceipt,
    typesRequest: 'update',
    personalizedMessage: text.financial.submitToast,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
      navigate(receiptRoutes.list);
    },
  });

  async function onSubmit(data: GenerateFinancialForm) {
    // Mensagens do legado: parcelas/rateio vazios (RRC:239-245) e rateio que não
    // fecha com o Valor Total (IG-12).
    if (data.installments.length === 0 || data.ratio.length === 0) {
      toaster.error({
        title: text.singularLabel,
        description: text.financial.validation.installmentsAndRatioRequired,
      });
      return;
    }
    if (!ratioMatchesTotal(data.ratio, Number(data.vl_total) || 0)) {
      toaster.error({
        title: text.singularLabel,
        description: text.financial.validation.ratioTotalDiffers,
      });
      return;
    }
    await financialMutation.mutateAsync(data);
  }

  function handleProviderSaved(provider: ProviderFormModalSavedPayload) {
    applySavedProvider(provider, () =>
      setValue(
        'financial_provider_id',
        { label: provider.label, value: provider.uuid },
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      )
    );
    setIsProviderModalOpen(false);
  }

  const isSaving = financialMutation.isPending || isSubmitting;
  const hasInputValue = watch('has_input');
  const vlTotal = watch('vl_total') ?? 0;
  const hasInputOptionsList = hasInputOptions.options(languageGB);
  const fiscalDocumentOptionsList = fiscalDocumentOptions.options(languageGB);

  return (
    <FormContainer
      title={text.financial.pageTitle}
      subtitle={text.financial.pageSubtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(receiptRoutes.list)}
            disabled={isSaving}
          />
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form="generate-financial-form"
            loading={isSaving}
            disabled={isSaving || isLoading}
          />
        </>
      }
    >
      <Form id="generate-financial-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        {/* Cabeçalho somente leitura (FF-01..FF-06) */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
          gap={4}
          mb={8}
        >
          <InputReadOnly label={text.confirm.fields.code} value={watch('code') ?? '—'} />
          <InputReadOnly
            label={text.confirm.fields.responsible}
            value={watch('responsible') ?? '—'}
          />
          <InputReadOnly
            label={text.financial.fields.receiptDate}
            value={watch('receipt_date') ? formatDate(watch('receipt_date') as string) : '—'}
          />
          <InputReadOnly label={text.confirm.fields.nfe} value={watch('nfe') ?? '—'} />

          <Controller
            name="vl_total"
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.financial.fields.vlTotal}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={recalculateAfterBlur}
                error={errors.vl_total?.message}
                isRequired
                disabled={isSaving || !isVlTotalEditable}
              />
            )}
          />

          <InputReadOnly
            label={text.financial.fields.receiptNote}
            value={watch('receipt_note') ?? '—'}
          />
        </Box>

        {/* Condições de pagamento (FD-12..22) */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          gap={4}
          mb={8}
        >
          <Input
            label={text.financial.fields.financialNumber}
            maxLength={15}
            disabled={isSaving}
            isRequired
            error={errors.financial_number?.message}
            {...register('financial_number')}
          />

          <Controller
            name="financial_type_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.financial.fields.financialTypeId}
                placeholder={text.financial.placeholders.financialTypeId}
                service={listTypeTitleOptions}
                mapOptions={(item: TypeTitleOptionItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isSaving}
                isRequired
                error={errors.financial_type_id?.message}
              />
            )}
          />

          <Controller
            name="financial_proprietary_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.financial.fields.financialProprietaryId}
                placeholder={text.financial.placeholders.financialProprietaryId}
                service={listProprietaries}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isSaving}
              />
            )}
          />

          <Controller
            name="financial_provider_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.financial.fields.financialProviderId}
                placeholder={text.financial.placeholders.financialProviderId}
                service={listProviderOptions}
                mapOptions={(item: ProviderOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isSaving}
                isRequired
                error={errors.financial_provider_id?.message}
                // EST-07 — botão "novo fornecedor" migrado do `Button`
                // avulso abaixo do select para o `labelAction` (ação no
                // label), mirror EXATO do padrão `CreateOrUpdateNfe.tsx`.
                labelActionTooltip={text.financial.newProviderButton}
                labelAction={
                  <IconButton
                    aria-label={text.financial.newProviderButton}
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={isSaving}
                    onClick={() => setIsProviderModalOpen(true)}
                  >
                    <Icon as={FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          <Controller
            name="has_input"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.financial.fields.hasInput}
                value={field.value}
                onChange={(option) => {
                  field.onChange(option);
                  recalculateInstallments();
                }}
                options={hasInputOptionsList}
                isDisabled={isSaving}
                isRequired
                noClearable
                error={errors.has_input?.message}
              />
            )}
          />

          {hasInputValue?.value === 1 && (
            <>
              <Controller
                name="input_value"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    name={field.name}
                    label={text.financial.fields.inputValue}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={recalculateAfterBlur}
                    error={errors.input_value?.message}
                    isRequired
                    disabled={isSaving}
                  />
                )}
              />
              <Controller
                name="input_date"
                control={control}
                render={({ field }) => (
                  <Field
                    label={text.financial.fields.inputDate}
                    isRequired
                    errorText={errors.input_date?.message}
                  >
                    <DateInput
                      value={field.value ?? null}
                      onChange={(value) => {
                        field.onChange(value);
                        recalculateInstallments();
                      }}
                      disabled={isSaving}
                    />
                  </Field>
                )}
              />
            </>
          )}

          <Controller
            name="qtd_installments"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.financial.fields.qtdInstallments}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? null)}
                onBlur={recalculateAfterBlur}
                allowDot={false}
                isRequired
                error={errors.qtd_installments?.message}
                disabled={isSaving}
              />
            )}
          />

          <Controller
            name="first_installment"
            control={control}
            render={({ field }) => (
              <Field
                label={text.financial.fields.firstInstallment}
                isRequired
                errorText={errors.first_installment?.message}
              >
                <DateInput
                  value={field.value ?? null}
                  onChange={(value) => {
                    field.onChange(value);
                    recalculateInstallments();
                  }}
                  disabled={isSaving}
                />
              </Field>
            )}
          />

          <Controller
            name="int_installments"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.financial.fields.intInstallments}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? null)}
                onBlur={recalculateAfterBlur}
                allowDot={false}
                error={errors.int_installments?.message}
                disabled={isSaving}
              />
            )}
          />

          <Controller
            name="fiscal_document"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.financial.fields.fiscalDocument}
                value={field.value}
                onChange={field.onChange}
                options={fiscalDocumentOptionsList}
                isDisabled={isSaving}
                noClearable
              />
            )}
          />

          <Box gridColumn={{ base: '1', md: 'span 2' }}>
            <Textarea
              label={text.financial.fields.financialNote}
              maxLength={1000}
              disabled={isSaving}
              isRequired
              error={errors.financial_note?.message}
              {...register('financial_note')}
            />
          </Box>
        </Box>

        <Box mb={8}>
          <RequestReceiptInstallmentsFieldArray
            control={control}
            watch={watch}
            isDisabled={isSaving}
            onValueBlur={handleInstallmentValueBlur}
          />
        </Box>

        <RequestReceiptRatioFieldArray
          control={control}
          watch={watch}
          setValue={setValue}
          vlTotal={vlTotal}
          farmUuid={farmUuid}
          isDisabled={isSaving}
          pickedCategoryOptions={pickedCategoryOptions}
          setPickedCategoryOptions={setPickedCategoryOptions}
          pickedCenterOptions={pickedCenterOptions}
          setPickedCenterOptions={setPickedCenterOptions}
          pickedPlanAccountOptions={pickedPlanAccountOptions}
          setPickedPlanAccountOptions={setPickedPlanAccountOptions}
        />
      </Form>

      <ProviderFormModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onSaved={handleProviderSaved}
      />
    </FormContainer>
  );
}
