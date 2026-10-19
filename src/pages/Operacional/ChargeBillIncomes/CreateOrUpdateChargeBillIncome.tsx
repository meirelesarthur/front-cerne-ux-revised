// src/pages/Operacional/ChargeBillIncomes/CreateOrUpdateChargeBillIncome.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CONTA A RECEBER (ChargeBillIncome) —
// Operacional / Agricultura / Carregamento. TASK-CBI-FE-03, esteira
// 97-Esteiras/059 (contrato de tela §3/§6, FID-G3F SURF-FE-FORM-CREATE/-EDIT/
// -SELECT-PROVIDER/-SELECT-CULTIVATION/-AMOUNT/-DATES/-CODE).
//
// Referência UX — UX-GAP declarada (`get_spa_ux_fidelity_pattern`, sem tela
// oficial "Contas a Receber" no design system `cerne`): mirror ESTRUTURAL do
// padrão real já migrado neste fork —
// `Operacional/Carregamento/CreateOrUpdateCharge.tsx` (casca `FormContainer`
// + footer opt-in, `SelectAsyncPaginate` com `findParams` numérico, `code`
// nunca no payload) e
// `CadastrosBase/EstoqueInicial/CreateOrUpdateEstoqueInicial.tsx` (`fillForm`
// nomeado com guarda de `dirtyFields`, `DateInput`/`MoneyInput` via
// `Controller`) — NUNCA copiado do Storybook `cerne` (não há tela lá).
//
// Rotas: `/operacional/carregamento/contas-a-receber/novo` (create) e
// `/operacional/carregamento/contas-a-receber/:chargeBillIncomeUuid` (edit),
// registradas em `src/router/index.tsx` (TASK-CBI-FE-03). Gates
// `charge_income_create`/`charge_income_edit` via `RequirePermission` na
// ROTA (mirror Carregamento/Fechamento Semana).
//
// 8 campos NA ORDEM EXATA do legado (`_forms.blade.php`, contrato de tela §3):
//   1. code          — readonly/view; NUNCA no payload (server-authoritative,
//                      RN-04/RN-05 do contrato legado, DEC-FE-03). Create:
//                      disabled + placeholder "Gerado automaticamente ao
//                      salvar"; Edit: exibe `data.code`.
//   2. dt_emission   — DateInput (ISO), obrigatório, default HOJE no create.
//   3. due_date      — DateInput (ISO), obrigatório.
//   4. number        — texto, opcional, max 15.
//   5. amount        — MoneyInput (número puro), obrigatório, min 0 (RN-03 —
//                      a conversão pt-BR<->float acontece só no servidor).
//   6. provider_uuid    — `SelectAsyncPaginate` → `loadProviderOptions`
//      (`providers/options?type=1`, DEC-FE-04: `type` NUMÉRICO, nunca boolean
//      cru — GAP-TT-01), nullable/clearable ("Todos Associados").
//   7. cultivation_uuid — `SelectAsyncPaginate` → `loadCultivationOptions`
//      (`cultivations/options?only_children=1`, DEC-FE-01/DEC-CBI-02: só
//      subcultivos, rótulo "Pai - Filho"), nullable/clearable ("Todos").
//   8. description   — texto, obrigatório.
//
// DEC-FE-02 (ratificado) — `provider_uuid`/`cultivation_uuid` enviados como
// UUID (o backend FE-05 resolve uuid→id na Action, mirror `StoreChargeAction`).
// Payload NUNCA inclui `code`/`type`/`farm_id`/`branch_id`.
//
// PRÉ-REQUISITO — TASK-CBI-FE-05 (backend `provider_uuid`/`cultivation_uuid`
// + `only_children`) precisa estar ENTREGUE para este submit integrar de
// verdade (senão 422/500 na escrita); os loaders de opção (`loadProvider
// Options`/`loadCultivationOptions`) já vêm prontos de TASK-CBI-FE-01.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { chargeBillIncomeSchemaResolver } from '@/validations/schemas/ChargeBillIncome/charge-bill-income-schema';

import {
  createChargeBillIncome,
  loadCultivationOptions,
  loadProviderOptions,
  updateChargeBillIncome,
} from '@/services/v2/ChargeBillIncome/charge-bill-income-service';

import type {
  ChargeBillIncomeCultivationOption,
  ChargeBillIncomeDetail,
  ChargeBillIncomeForm as ChargeBillIncomeFormValues,
  ChargeBillIncomePayload,
  ChargeBillIncomeProviderOption,
} from '@/@types/v2/ChargeBillIncome';

import { useChargeBillIncomeForm } from './useChargeBillIncomeForm';

const CHARGE_BILL_INCOMES_LIST_ROUTE = '/operacional/carregamento/contas-a-receber';

function todayIso(): string {
  return todayLocalIso();
}

export default function CreateOrUpdateChargeBillIncome() {
  const { chargeBillIncomeUuid } = useParams<{ chargeBillIncomeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.chargeBillIncomes.chargeBillIncome;
  const formText = text.form;

  const isEditing = isValidGuid(chargeBillIncomeUuid);

  // Guard — uuid presente e malformado não pode chegar ao hook de detalhe
  // (`useCustomFormQueryByGuid` só desabilita a query, não redireciona;
  // mirror `CreateOrUpdateCharge.tsx`).
  useEffect(() => {
    if (!chargeBillIncomeUuid) return;
    if (!isValidGuid(chargeBillIncomeUuid)) {
      navigate(CHARGE_BILL_INCOMES_LIST_ROUTE, { replace: true });
    }
  }, [chargeBillIncomeUuid, navigate]);

  const canSave = isEditing ? can('charge_income_edit') : can('charge_income_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<ChargeBillIncomeFormValues>({
    mode: 'onChange',
    resolver: chargeBillIncomeSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      dt_emission: todayIso(),
      due_date: '',
      number: '',
      amount: 0,
      provider_uuid: null,
      cultivation_uuid: null,
      description: '',
    },
  });

  // Lei 2 (get_pwa_form_query_pattern) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect` (apagaria o que o
  // usuário digitou num refetch).
  function fillChargeBillIncomeForm(data: ChargeBillIncomeDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      code: data.code,
      dt_emission: data.dt_emission,
      due_date: data.due_date,
      number: data.number ?? '',
      amount: Number(data.amount),
      provider_uuid: data.provider
        ? { label: data.provider.name, value: data.provider.uuid }
        : null,
      cultivation_uuid: data.cultivation
        ? { label: data.cultivation.name, value: data.cultivation.uuid }
        : null,
      description: data.description,
    });
  }

  const chargeBillIncomeQuery = useChargeBillIncomeForm({
    registrationId: isEditing ? chargeBillIncomeUuid : undefined,
    fillForm: fillChargeBillIncomeForm,
  });

  const chargeBillIncomeDetail = chargeBillIncomeQuery.data as ChargeBillIncomeDetail | undefined;
  const isLoading = isEditing && checkLoadingStatus([chargeBillIncomeQuery as any]);
  const isDisabledField = !canSave || isLoading;

  async function tryPersistChargeBillIncome(data: ChargeBillIncomeFormValues) {
    // `code`/`type`/`farm_id`/`branch_id` NUNCA no payload (server-authoritative,
    // DEC-FE-03/RN-01/RN-02 do contrato legado). `amount` numérico puro — a
    // conversão pt-BR<->float (RN-03) acontece só no servidor.
    const payload: ChargeBillIncomePayload = {
      dt_emission: data.dt_emission,
      due_date: data.due_date,
      number: data.number?.trim() || null,
      amount: Number(data.amount),
      provider_uuid: data.provider_uuid?.value ?? null,
      cultivation_uuid: data.cultivation_uuid?.value ?? null,
      description: data.description,
    };

    try {
      // Full-resource-replace no PUT (mirror `ChargeRequest` unificado
      // store+update de `CreateOrUpdateCharge.tsx`) — sem branching por
      // `dirtyFields` (o contrato de tela não declara PATCH parcial aqui).
      return isEditing && chargeBillIncomeUuid
        ? await updateChargeBillIncome(chargeBillIncomeUuid, payload)
        : await createChargeBillIncome(payload);
    } catch (error) {
      // 422 → mapeia por campo (react-hook-form), limpo automaticamente no
      // próximo `onChange` (RHF `reValidateMode: 'onChange'`). `throw`
      // preserva o toast genérico do `useRequest` (mirror
      // `CreateOrUpdateCharge.tsx`).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as keyof ChargeBillIncomeFormValues, {
                type: 'server',
                message: fieldMessages[0],
              });
            }
          });
        }
      }
      throw error;
    }
  }

  const chargeBillIncomeMutation = useRequest({
    asyncFunction: tryPersistChargeBillIncome,
    entityName: text.singularLabel,
    queryKey: queryKey.chargeBillIncomes.chargeBillIncomesList,
    queryKey2: queryKey.chargeBillIncomes.chargeBillIncome,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing
      ? formText.toasts.updatedSuccess
      : formText.toasts.createdSuccess,
    actionSuccess: () => {
      navigate(CHARGE_BILL_INCOMES_LIST_ROUTE);
    },
  });

  const isSubmitting = chargeBillIncomeMutation.isPending;

  async function onSubmit(data: ChargeBillIncomeFormValues) {
    await chargeBillIncomeMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(CHARGE_BILL_INCOMES_LIST_ROUTE)}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* 1. code — readonly/view; server-authoritative (DEC-FE-03). Create:
              placeholder "Gerado automaticamente ao salvar"; Edit: `data.code`. */}
          <InputReadOnly
            label={formText.fields.code}
            value={isEditing ? (chargeBillIncomeDetail?.code ?? '—') : formText.placeholders.code}
            loading={isLoading}
          />

          {/* 2. dt_emission — DateInput ISO, obrigatório, default hoje (create). */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.dtEmission}
              <Text as="span" color="fg.error">
                {' '}
                *
              </Text>
            </Text>
            <Controller
              name="dt_emission"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput value={value ?? null} onChange={onChange} disabled={isDisabledField} />
              )}
            />
            {errors.dt_emission?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.dt_emission.message}
              </Text>
            )}
          </Box>

          {/* 3. due_date — DateInput ISO, obrigatório. */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.dueDate}
              <Text as="span" color="fg.error">
                {' '}
                *
              </Text>
            </Text>
            <Controller
              name="due_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput value={value ?? null} onChange={onChange} disabled={isDisabledField} />
              )}
            />
            {errors.due_date?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.due_date.message}
              </Text>
            )}
          </Box>

          {/* 4. number — texto, opcional, max 15. */}
          <Input
            label={formText.fields.number}
            {...register('number')}
            error={errors.number?.message}
            maxLength={15}
            disabled={isDisabledField}
          />

          {/* 5. amount — MoneyInput (número puro), obrigatório, min 0. */}
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={formText.fields.amount}
                value={field.value ?? 0}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired
                disabled={isDisabledField}
              />
            )}
          />

          {/* 6. provider_uuid — SelectAsyncPaginate, nullable/clearable
              ("Todos Associados"). `loadProviderOptions` já fixa `type: 1`
              NUMÉRICO (DEC-FE-04/GAP-TT-01) — sem duplicar a decisão aqui. */}
          <Controller
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.provider}
                placeholder={formText.placeholders.provider}
                service={(params) =>
                  loadProviderOptions((params as { search?: string }).search ?? '')
                }
                mapOptions={(item: ChargeBillIncomeProviderOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 7. cultivation_uuid — SelectAsyncPaginate, nullable/clearable
              ("Todos"). `loadCultivationOptions` já fixa `only_children: 1`
              NUMÉRICO (DEC-FE-01/DEC-CBI-02) — só subcultivos, "Pai - Filho". */}
          <Controller
            name="cultivation_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.cultivation}
                placeholder={formText.placeholders.cultivation}
                service={(params) =>
                  loadCultivationOptions((params as { search?: string }).search ?? '')
                }
                mapOptions={(item: ChargeBillIncomeCultivationOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 8. description — texto, obrigatório. */}
          <Input
            label={formText.fields.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            disabled={isDisabledField}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
