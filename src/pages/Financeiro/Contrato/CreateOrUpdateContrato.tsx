// src/pages/Financeiro/Contrato/CreateOrUpdateContrato.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/edição de Gestão de Contratos (Contract — Financeiro,
// esteira 97-Esteiras/023, TASK-CTR-FE-08). MESMO arquivo para os dois casos
// (`isEditing = isValidGuid(contractId)`, mirror `CreateOrUpdateSolicitacao.tsx`/
// `CreateOrUpdateDiagnosisPregnancy.tsx`). Rotas previstas `/financeiro/
// contratos/novo` e `/financeiro/contratos/:contractId` — wiring real de rota
// é `TASK-CTR-FE-09` (NÃO tocado aqui).
//
// SEM ABAS — decisão de layout já registrada em `Contract-FrontEnd-contrato.md
// §6`: 2 blocos (cabeçalho + itens) não justificam `Tabs.Root` (regra de
// proporcionalidade de UX). Cabeçalho num `SimpleGrid` (mirror
// `columnsForm.default`), seguido da seção `ContractItemRow` (TASK-CTR-FE-06)
// na mesma página.
//
// `useCustomFormQueryByGuid` (mirror `RequestPurchase`/`DiagnosisPregnancy`)
// para o `GET` de edição + `fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce` (Lei 2 — o `!` é OBRIGATÓRIO,
// `isEmpty()` é mal nomeada: retorna `true` quando HÁ chaves, ERRO-FE-001).
//
// `code`/`amount` NUNCA são campos editáveis — `InputReadOnly`, SÓ em edição
// (`isEditing && contractData`). Em criação nenhum dos dois existe ainda
// (mesma lógica de "não existe ainda" já usada para `code`/`movements[]` em
// `RequestPurchase`) — nenhum placeholder renderizado. Nenhum dos dois entra
// no `useForm`/payload (sempre lidos direto de `contractData`, nunca de
// `data.*` do submit) — não há risco do ERRO-FE-001-bis de "campo `disabled`
// descartado pelo RHF no submit" citado no task-packet, porque `code`/
// `amount` nunca são campos do formulário (não existem no schema/`ContractForm`,
// `TASK-CTR-FE-01/04`).
//
// Payload é sempre JSON puro (`ContractPayload`, sem `FormData`/method
// spoofing) — `tryPersistContract` monta o payload e chama `createContract`/
// `updateContract` (`contract-service.ts`, `api.V2.put` nativo, TASK-CTR-FE-05).
//
// Guarda de navegação: `contractId` presente mas NÃO é GUID válido (URL
// adulterada) → redireciona para a listagem (mirror `CreateOrUpdateSolicitacao`/
// `CreateOrUpdateEquipamento`).
//
// "Editar sem alterar nada = Cancelar" (`!isEmpty(dirtyFields)` — o `!` é
// OBRIGATÓRIO, ERRO-FE-001 já documentado no precedente de RequestPurchase).
//
// Botão de submit FORA do `<form>` (`FormContainer footer`, "Cancelar" à
// esquerda, "Salvar" à direita — regra global de UX nº2, botão SEMPRE
// "Salvar", nunca "Criar"/"Atualizar").
//
// Guarda `onInvalid` cobrindo o form todo (sem abas aqui, mas útil se a tela
// crescer, mirror `## Definition of Done` da Tarefa) — mostra toast com a
// mensagem REAL do 1º erro (já 100% localizada pelo Yup, TASK-CTR-FE-04).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { contractSchemaResolver } from '@/validations/schemas/Contracts/contract-schema';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  createContract,
  getContract,
  updateContract,
} from '@/services/v2/Contracts/contract-service';

import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type {
  ContractData,
  ContractForm as ContractFormType,
  ContractPayload,
  ItemContractPayload,
} from '@/@types/v2/Contracts';

import { ContractItemRow } from './ContractItemRow';

export default function CreateOrUpdateContrato() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:contractId`).
  const isEditing = isValidGuid(contractId);

  // Guard de navegação: `contractId` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem (mirror
  // `CreateOrUpdateSolicitacao.tsx`/`CreateOrUpdateEquipamento.tsx`).
  useEffect(() => {
    if (contractId && !isValidGuid(contractId)) {
      navigate('/financeiro/contratos', { replace: true });
    }
  }, [contractId, navigate]);

  const text = languageGB.contracts.contract;

  const canCreate = can('contracts_create');
  const canEdit = can('contracts_edit');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ContractFormType>({
    mode: 'onChange',
    resolver: contractSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      provider_uuid: null,
      employee_uuid: null,
      number: '',
      date: null,
      expiration_date: null,
      installments: null,
      quantity: null,
      unit_value_sc: null,
      items: [],
    },
  });

  function fillForm(data: ContractData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        provider_uuid: data.provider
          ? { label: data.provider.label ?? data.provider.uuid, value: data.provider.uuid }
          : null,
        employee_uuid: data.employee
          ? { label: data.employee.label ?? data.employee.uuid, value: data.employee.uuid }
          : null,
        number: data.number,
        date: data.date,
        expiration_date: data.expiration_date,
        installments: data.installments,
        quantity: data.quantity,
        unit_value_sc: data.unit_value_sc,
        items: (data.items ?? []).map((row) => ({
          item_uuid: row.uuid,
          warehouse_uuid: row.warehouse
            ? {
                label: `${row.warehouse.initials} — ${row.warehouse.description}`,
                value: row.warehouse.uuid,
              }
            : null,
          product_uuid: row.product
            ? { label: row.product.description, value: row.product.uuid }
            : null,
          quantity: row.quantity ?? null,
        })),
      });
    }
  }

  const contractQuery = useCustomFormQueryByGuid<ContractData>({
    registrationId: isEditing ? contractId : undefined,
    queryKey: queryKey.contracts.contract,
    asyncFunction: getContract,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([contractQuery as any]);
  const contractData = (contractQuery as any)?.data as ContractData | undefined;

  // -- Persistência (create/update, JSON puro via service TASK-CTR-FE-05) --
  async function tryPersistContract(data: ContractFormType) {
    const payload: ContractPayload = {
      provider_uuid: data.provider_uuid!.value,
      employee_uuid: data.employee_uuid!.value,
      number: data.number.trim(),
      date: data.date!,
      expiration_date: data.expiration_date!,
      installments: data.installments!,
      quantity: data.quantity!,
      unit_value_sc: data.unit_value_sc!,
      items: data.items.map((row): ItemContractPayload => ({
        item_uuid: row.item_uuid ?? null,
        warehouse_uuid: row.warehouse_uuid!.value,
        product_uuid: row.product_uuid!.value,
        quantity: row.quantity!,
      })),
    };

    if (isEditing && contractId) {
      return await updateContract(contractId, payload);
    }
    return await createContract(payload);
  }

  const contractMutation = useRequest({
    asyncFunction: tryPersistContract,
    entityName: text.singularLabel,
    queryKey: queryKey.contracts.contractsList,
    queryKey2: queryKey.contracts.contract,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // "editar sem alterar nada = Cancelar" (ERRO-FE-001: `isEmpty()` retorna
  // `true` quando HÁ chaves — o `!` é OBRIGATÓRIO, mirror
  // `CreateOrUpdateSolicitacao.tsx`/`CreateOrUpdateDiagnosisPregnancy.tsx`).
  async function onSubmit(data: ContractFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await contractMutation.mutateAsync(data);
    }
  }

  // Guarda `onInvalid` — cobre o form todo (sem abas aqui, mas útil se a
  // tela crescer, `## Definition of Done` da Tarefa); mostra a mensagem REAL
  // do 1º erro (já 100% localizada pelo Yup, TASK-CTR-FE-04).
  function onInvalid(formErrors: FieldErrors<ContractFormType>) {
    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: firstErrorMessage,
      duration: 6000,
    });
  }

  const isSubmitting = contractMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="contract-form"
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form id="contract-form" onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="provider_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.provider}
                placeholder={text.form.placeholders.provider}
                error={fieldState.error?.message as string | undefined}
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
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="employee_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.employee}
                placeholder={text.form.placeholders.employee}
                error={fieldState.error?.message as string | undefined}
                service={listEmployees}
                mapOptions={(item: EmployeeListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={text.form.fields.number}
            placeholder={text.form.placeholders.number}
            {...register('number')}
            error={errors.number?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.date}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || isLoading}
                />
              )}
            />
            {errors.date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.date.message as string}
              </Box>
            )}
          </Box>

          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.expirationDate}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="expiration_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || isLoading}
                />
              )}
            />
            {errors.expiration_date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.expiration_date.message as string}
              </Box>
            )}
          </Box>

          <Controller
            name="installments"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.installments}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot={false}
                min={1}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.quantity}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                min={0.01}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="unit_value_sc"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.unitValueSc}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                min={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          {/* `code` — SÓ EM EDIÇÃO, gerado pelo servidor (fora do
              `useForm`/payload). Reaproveita a chave já existente da
              listagem — sem chave própria dedicada no `form.fields` (mirror
              `CreateOrUpdateSolicitacao.tsx`). */}
          {isEditing && (
            <InputReadOnly
              label={text.list.table.code}
              value={contractData?.code ?? ''}
              loading={isLoading}
            />
          )}

          {/* `amount` — NUNCA editável, sempre recalculado server-side
              (DA-CT-06). Visível SÓ EM EDIÇÃO (em criação ainda não existe
              valor calculado, mesma lógica de "não existe ainda" de `code`).
              Fora do `useForm`/payload — lido direto de `contractData`. */}
          {isEditing && contractData && (
            <InputReadOnly
              label={text.list.table.amount}
              value={contractData.amount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              loading={isLoading}
            />
          )}
        </SimpleGrid>

        <ContractItemRow
          control={control}
          errors={errors}
          isLoading={!!isLoading}
          canSave={canSave}
        />
      </Form>
    </FormContainer>
  );
}
