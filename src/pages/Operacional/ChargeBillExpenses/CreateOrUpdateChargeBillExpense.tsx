// src/pages/Operacional/ChargeBillExpenses/CreateOrUpdateChargeBillExpense.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CONTA A PAGAR (ChargeBillExpense) —
// Operacional / Agricultura / Carregamento. TASK-CBE-06, esteira
// 97-Esteiras/062 (contrato de tela §2.2/§3, FID-G3F FLD-01..09/RN-12/13/14).
//
// Referência UX — UX-GAP declarada (`get_spa_ux_fidelity_pattern`, sem tela
// oficial "Contas a Pagar/Carregamento" no design system `cerne`): mirror
// ESTRUTURAL da CASCA de `Operacional/ChargeBillIncomes/
// CreateOrUpdateChargeBillIncome.tsx` (gêmeo direto — `FormContainer` com
// footer opt-in, `useForm`+`fillForm` nomeado com guarda de `dirtyFields`,
// `useRequest`) + mirror da CASCATA `provider→branch` (peça EXCLUSIVA, sem
// precedente no gêmeo) de
// `Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx` (linhas ~1244-1277 e
// ~1553-1585) — NUNCA copiado do Storybook `cerne` (não há tela lá).
//
// Rotas: `/operacional/carregamento/contas-a-pagar/novo` (create) e
// `/operacional/carregamento/contas-a-pagar/:chargeBillExpenseUuid` (edit),
// registradas em `src/router/index.tsx` (TASK-CBE-07, fora do escopo desta
// Tarefa). Gates `charge_expense_create`/`charge_expense_edit`.
//
// 9 campos NA ORDEM EXATA do contrato de tela (§2.2):
//   1. code            — InputReadOnly; NUNCA no payload (server-authoritative,
//                        RN-04/RN-05/RN-16). Create: placeholder "Gerado
//                        automaticamente ao salvar"; Edit: `data.code`.
//   2. dt_emission     — DateInput (ISO), obrigatório, default HOJE no create.
//   3. due_date        — DateInput (ISO), obrigatório.
//   4. number          — texto, opcional, max 15.
//   5. amount          — MoneyInput (número puro), obrigatório, min 0
//                        (RN-03 — conversão pt-BR<->float só no servidor).
//   6. provider_uuid   — SelectAsyncPaginate → `loadProviderOptions`,
//                        nullable/clearable ("Todos Associados"). `onChange`
//                        limpa `branch_uuid` (cascata, mirror
//                        `CreateOrUpdateExpense.tsx:1494-1497`).
//   7. branch_uuid     — EXCLUSIVO desta feature. SelectAsyncPaginate →
//                        `loadBranchOptions(providerUuid)` (watch de
//                        `provider_uuid`). `isDisabled` até `provider_uuid`
//                        preenchido OU fornecedor sem filiais
//                        (`providerHasNoBranches`, query dedicada — mirror
//                        `providerBranchesQuery`/`CreateOrUpdateExpense.tsx:
//                        1260-1277`). `helperText` cobre os 2 estados
//                        intermediários. Re-hidrata no editar DIRETO do
//                        payload de detalhe (`data.branch{uuid,name}`), sem
//                        2ª chamada (RN-14 FIXED).
//   8. cultivation_uuid — SelectAsyncPaginate → `loadCultivationOptions`,
//                        nullable/clearable ("Todos").
//   9. description     — texto, obrigatório.
//
// DEC-FE-02 (ratificado, mirror gêmeo) — `provider_uuid`/`branch_uuid`/
// `cultivation_uuid` enviados como UUID (o backend resolve uuid→id na
// Action). Payload NUNCA inclui `code`/`type`/`farm_id`.
//
// PRÉ-REQUISITO — TASK-CBE-02/03 (backend leitura/escrita) precisam estar
// ENTREGUES para este submit integrar de verdade (senão 404/422 nas
// chamadas reais).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
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

import { chargeBillExpenseSchemaResolver } from '@/validations/schemas/ChargeBillExpense/charge-bill-expense-schema';

import {
  createChargeBillExpense,
  loadBranchOptions,
  loadCultivationOptions,
  loadProviderOptions,
  updateChargeBillExpense,
} from '@/services/v2/ChargeBillExpense/charge-bill-expense-service';
import { listBranchesByProvider } from '@/services/v2/Financeiro/Branches/branch-service';

import type {
  ChargeBillExpenseBranchOption,
  ChargeBillExpenseCultivationOption,
  ChargeBillExpenseDetail,
  ChargeBillExpenseForm as ChargeBillExpenseFormValues,
  ChargeBillExpensePayload,
  ChargeBillExpenseProviderOption,
} from '@/@types/v2/ChargeBillExpense';

import { useChargeBillExpenseForm } from './useChargeBillExpenseForm';

const CHARGE_BILL_EXPENSES_LIST_ROUTE = '/operacional/carregamento/contas-a-pagar';

function todayIso(): string {
  return todayLocalIso();
}

export default function CreateOrUpdateChargeBillExpense() {
  const { chargeBillExpenseUuid } = useParams<{ chargeBillExpenseUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.chargeBillExpenses.chargeBillExpense;
  const formText = text.form;

  const isEditing = isValidGuid(chargeBillExpenseUuid);

  // Guard — uuid presente e malformado não pode chegar ao hook de detalhe
  // (`useCustomFormQueryByGuid` só desabilita a query, não redireciona;
  // mirror `CreateOrUpdateChargeBillIncome.tsx`).
  useEffect(() => {
    if (!chargeBillExpenseUuid) return;
    if (!isValidGuid(chargeBillExpenseUuid)) {
      navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE, { replace: true });
    }
  }, [chargeBillExpenseUuid, navigate]);

  const canSave = isEditing ? can('charge_expense_edit') : can('charge_expense_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ChargeBillExpenseFormValues>({
    mode: 'onChange',
    resolver: chargeBillExpenseSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      dt_emission: todayIso(),
      due_date: '',
      number: '',
      amount: 0,
      provider_uuid: null,
      branch_uuid: null,
      cultivation_uuid: null,
      description: '',
    },
  });

  // Lei 2 (get_pwa_form_query_pattern) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect` (apagaria o que o
  // usuário digitou num refetch).
  function fillChargeBillExpenseForm(data: ChargeBillExpenseDetail, resetForce?: boolean) {
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
      // RN-14 FIXED — resolve DIRETO do payload de detalhe (`data.branch`),
      // sem 2ª chamada: a cascata só precisa disparar de novo se o usuário
      // TROCAR de fornecedor manualmente (onChange de `provider_uuid`
      // abaixo), não ao carregar a tela.
      branch_uuid: data.branch?.uuid ? { label: data.branch.name, value: data.branch.uuid } : null,
      cultivation_uuid: data.cultivation
        ? { label: data.cultivation.name, value: data.cultivation.uuid }
        : null,
      description: data.description,
    });
  }

  const chargeBillExpenseQuery = useChargeBillExpenseForm({
    registrationId: isEditing ? chargeBillExpenseUuid : undefined,
    fillForm: fillChargeBillExpenseForm,
  });

  const chargeBillExpenseDetail = chargeBillExpenseQuery.data as
    ChargeBillExpenseDetail | undefined;
  const isLoading = isEditing && checkLoadingStatus([chargeBillExpenseQuery as any]);
  const isDisabledField = !canSave || isLoading;

  // ---- Cascata provider→branch (contrato §2.2 FLD-07, EXCLUSIVA desta
  // feature) — mirror `CreateOrUpdateExpense.tsx:1244-1277,1553-1585`. ----
  const providerUuid = watch('provider_uuid')?.value;

  // Query dedicada para saber se a lista de filiais do fornecedor atual
  // voltou VAZIA de verdade (o `SelectAsyncPaginate` não expõe esse
  // callback pro caller — mirror `providerBranchesQuery`).
  const providerBranchesQuery = useQuery({
    queryKey: ['charge-bill-expense-provider-branches', providerUuid],
    queryFn: () => listBranchesByProvider(providerUuid!),
    enabled: !!providerUuid,
  });
  const providerHasNoBranches =
    !!providerUuid &&
    providerBranchesQuery.isSuccess &&
    providerBranchesQuery.data.data.length === 0;

  // Se a busca resolver 0 filiais para o fornecedor atual, garante que o
  // form nunca fique com um `branch_uuid` órfão.
  useEffect(() => {
    if (providerHasNoBranches) {
      setValue('branch_uuid', null);
    }
  }, [providerHasNoBranches, setValue]);

  async function loadBranchOptionsForProvider() {
    if (!providerUuid) {
      return {
        success: true,
        message: '',
        data: {
          items: [],
          pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
        },
      };
    }
    return loadBranchOptions(providerUuid);
  }

  async function tryPersistChargeBillExpense(data: ChargeBillExpenseFormValues) {
    // `code`/`type`/`farm_id` NUNCA no payload (server-authoritative,
    // RN-01/RN-02/RN-04/RN-05/RN-16 do contrato legado). `amount` numérico
    // puro — a conversão pt-BR<->float (RN-03) acontece só no servidor.
    const payload: ChargeBillExpensePayload = {
      dt_emission: data.dt_emission,
      due_date: data.due_date,
      number: data.number?.trim() || null,
      amount: Number(data.amount),
      provider_uuid: data.provider_uuid?.value ?? null,
      branch_uuid: data.branch_uuid?.value ?? null,
      cultivation_uuid: data.cultivation_uuid?.value ?? null,
      description: data.description,
    };

    try {
      // Full-resource-replace no PUT (mirror `ChargeBillIncomePayload`/
      // `ChargeRequest` unificado store+update) — sem branching por
      // `dirtyFields`.
      return isEditing && chargeBillExpenseUuid
        ? await updateChargeBillExpense(chargeBillExpenseUuid, payload)
        : await createChargeBillExpense(payload);
    } catch (error) {
      // 422 → mapeia por campo (react-hook-form), limpo automaticamente no
      // próximo `onChange` (RHF `reValidateMode: 'onChange'`). `throw`
      // preserva o toast genérico do `useRequest` (mirror gêmeo).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as keyof ChargeBillExpenseFormValues, {
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

  const chargeBillExpenseMutation = useRequest({
    asyncFunction: tryPersistChargeBillExpense,
    entityName: text.singularLabel,
    queryKey: queryKey.chargeBillExpenses.chargeBillExpensesList,
    queryKey2: queryKey.chargeBillExpenses.chargeBillExpense,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing
      ? formText.toasts.updatedSuccess
      : formText.toasts.createdSuccess,
    actionSuccess: () => {
      navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE);
    },
  });

  const isSubmitting = chargeBillExpenseMutation.isPending;

  async function onSubmit(data: ChargeBillExpenseFormValues) {
    // Guard explícita de campos sujos (DoD — não copiar `isEmpty` cegamente
    // do padrão de PATCH parcial: aqui o payload é sempre full-resource,
    // então a guarda só evita submit de um form intocado em modo edição).
    if (isEditing && Object.keys(dirtyFields).length === 0) return;
    await chargeBillExpenseMutation.mutateAsync(data);
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
            onClick={() => navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE)}
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
          {/* 1. code — readonly/view; server-authoritative (RN-04/RN-05). */}
          <InputReadOnly
            label={formText.fields.code}
            value={isEditing ? (chargeBillExpenseDetail?.code ?? '—') : formText.placeholders.code}
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
              ("Todos Associados"). `onChange` limpa `branch_uuid` (cascata,
              mirror `CreateOrUpdateExpense.tsx:1494-1497`). */}
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
                mapOptions={(item: ChargeBillExpenseProviderOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  setValue('branch_uuid', null);
                }}
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 7. branch_uuid — EXCLUSIVO desta feature. Nullable. `isDisabled`
              até `provider_uuid` preenchido OU fornecedor sem filiais.
              `helperText` cobre os 2 estados intermediários. */}
          <Controller
            name="branch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.branch}
                helperText={
                  !providerUuid
                    ? formText.hints.branchRequiresProvider
                    : providerHasNoBranches
                      ? formText.hints.providerHasNoBranches
                      : undefined
                }
                service={loadBranchOptionsForProvider as any}
                mapOptions={(item: ChargeBillExpenseBranchOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                cacheUniqs={[providerUuid]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabledField || !providerUuid || providerHasNoBranches}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 8. cultivation_uuid — SelectAsyncPaginate, nullable/clearable
              ("Todos"). */}
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
                mapOptions={(item: ChargeBillExpenseCultivationOption) => ({
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

          {/* 9. description — texto, obrigatório. */}
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
