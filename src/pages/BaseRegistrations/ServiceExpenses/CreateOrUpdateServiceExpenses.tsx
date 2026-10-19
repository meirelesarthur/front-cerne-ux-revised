// src/pages/BaseRegistrations/ServiceExpenses/CreateOrUpdateServiceExpenses.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de SERVIÇOS (ServiceExpense) — Cadastros
// Base / Gerais. Rotas: /cadastros-base/servicos/novo e
// /cadastros-base/servicos/:serviceExpenseId (GUID), registradas em
// src/router/index.tsx (TASK-FE-133), guardadas por `service_view`.
//
// Mirror mecânico de Estorno/CreateOrUpdateEstorno.tsx (mesma estrutura:
// `isEditing` por GUID, `fillForm` guardado por `!isEmpty(dirtyFields) ||
// resetForce`, mutação via `useRequest` com `typesRequest` condicional,
// `ButtonSaveAndNext` com `dirtyFields`), COM 3 CAMPOS EXTRAS
// (`pay_team`/`has_commission`/`commission` — D-S3 do contrato de API).
//
// Campos, na ordem do legado (`agro365/resources/views/service/_forms.blade.php`):
// Descrição, Ativo, Usa Kg, Vl. Referência, Pagamento de Equipe, Tem
// Comissão, Comissão(%).
//   - `description` (Input, obrigatório, máx. 30 — fiel ao legado)
//   - `is_enabled` (Select Ativo/Inativo, obrigatório — NUNCA um Switch)
//   - `use_kg` (Select Sim/Não, obrigatório)
//   - `value` (MoneyInput — máscara monetária R$ + milhar + 2 casas,
//     obrigatório; payload envia número puro)
//   - `pay_team` (Select Sim/Não, obrigatório — NOVO, mesma convenção de
//     `use_kg`, nunca checkbox/Switch)
//   - `has_commission` (Select Sim/Não, obrigatório — NOVO, idem)
//   - `commission` (`CommissionPercentInput` local — NOVO, achado do
//     contrato §15: campo percentual, não monetário; payload envia número
//     puro, mesmo tratamento de `value`)
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio
// (ERRO-FE-001). Guarda usada: `!isEmpty(dirtyFields) || resetForce` no
// `fillForm` (reset seguro só quando `dirtyFields` está vazio ou carga
// forçada); no `onSubmit`, `isEditing && isEmpty(dirtyFields)` → `dirtyFields`
// TEM chaves → houve alteração real → salva; `isEditing` sem isso → nada
// mudou → só navega, sem PUT (mesmo padrão exato de
// CreateOrUpdateEstorno.tsx).
//
// Payload de escrita SEMPRE completo (POST e PUT) — `ServiceExpenseRequest`
// valida `sometimes` no update, mas os 7 campos SEMPRE vêm preenchidos no
// form (nenhum campo opcional aqui), então o payload nunca precisa ser
// parcial/gated por `dirtyFields` — mesmo padrão de Estorno/PaymentTerm.
//
// `value` E `commission` chegam como STRING decimal da API ("1234.5600"/
// "12.50", TASK-FE-130) — converter com Number(...) ANTES de
// reset({ value/commission: ... }), senão o MoneyInput/CommissionPercentInput
// recebem uma string e quebram a formatação.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { serviceExpenseSchemaResolver } from '@/validations/schemas/BaseRegistrations/serviceExpense-schema';

import {
  createServiceExpense,
  getServiceExpense,
  updateServiceExpense,
} from '@/services/v2/BaseRegistrations/serviceExpense-service';

import type { Option } from '@/@types/option';
import type {
  ServiceExpenseDetail,
  ServiceExpenseForm as ServiceExpenseFormType,
  ServiceExpensePayload,
} from '@/@types/v2/BaseRegistrations/serviceExpense';

import { CommissionPercentInput } from './CommissionPercentInput';

export default function CreateOrUpdateServiceExpenses() {
  const { serviceExpenseId } = useParams<{ serviceExpenseId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(serviceExpenseId);
  const text = languageGB.baseRegistrations.serviceExpense;
  const canSave = isEditing ? can('service_edit') : can('service_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ServiceExpenseFormType>({
    mode: 'onChange',
    resolver: serviceExpenseSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      use_kg: false,
      value: 0,
      pay_team: false,
      has_commission: false,
      commission: 0,
    },
  });

  // Guarda por `!isEmpty(dirtyFields) || resetForce`. `value` E `commission`
  // chegam como STRING decimal da API ("1234.5600"/"12.50") — Number(...)
  // ANTES do reset, senão o MoneyInput/CommissionPercentInput recebem string
  // e quebram a formatação (`numberToDigits` espera `number`).
  function fillForm(data: ServiceExpenseDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        use_kg: !!data.use_kg,
        value: Number(data.value),
        pay_team: !!data.pay_team,
        has_commission: !!data.has_commission,
        commission: Number(data.commission),
      });
    }
  }

  const serviceExpenseQuery = useCustomFormQueryByGuid<ServiceExpenseDetail>({
    registrationId: isEditing ? serviceExpenseId : undefined,
    queryKey: queryKey.baseRegistrations.serviceExpense,
    asyncFunction: getServiceExpense,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([serviceExpenseQuery as any]);

  const serviceExpenseMutation = useRequest({
    asyncFunction: tryPersistServiceExpense,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.serviceExpenses,
    queryKey2: queryKey.baseRegistrations.serviceExpense,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistServiceExpense(data: ServiceExpenseFormType) {
    // Payload SEMPRE completo (7 campos) em create e update — mesmo padrão
    // de Estorno/PaymentTerm (nunca gated por dirtyFields).
    const payload: ServiceExpensePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      use_kg: !!data.use_kg,
      value: Number(data.value),
      pay_team: !!data.pay_team,
      has_commission: !!data.has_commission,
      commission: Number(data.commission),
    };

    if (isEditing && serviceExpenseId) {
      return await updateServiceExpense(serviceExpenseId, payload);
    }

    return await createServiceExpense(payload);
  }

  async function onSubmit(data: ServiceExpenseFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      // dirtyFields TEM chaves (isEmpty real === true) → houve alteração → salva.
      await serviceExpenseMutation.mutateAsync(data);
    } else if (isEditing) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação → sempre salva.
      await serviceExpenseMutation.mutateAsync(data);
    }
  }

  const isSubmitting = serviceExpenseMutation.isPending;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const useKgOptions: Option<boolean>[] = [
    { value: true, label: text.form.useKgOptions.yes },
    { value: false, label: text.form.useKgOptions.no },
  ];

  const payTeamOptions: Option<boolean>[] = [
    { value: true, label: text.form.payTeamOptions.yes },
    { value: false, label: text.form.payTeamOptions.no },
  ];

  const hasCommissionOptions: Option<boolean>[] = [
    { value: true, label: text.form.hasCommissionOptions.yes },
    { value: false, label: text.form.hasCommissionOptions.no },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={enabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="use_kg"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.useKg}
                name={name}
                value={useKgOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={useKgOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="value"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <MoneyInput
                name={name}
                label={text.form.fields.value}
                value={value}
                onValueChange={onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="pay_team"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.payTeam}
                name={name}
                value={payTeamOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={payTeamOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="has_commission"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.hasCommission}
                name={name}
                value={hasCommissionOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={hasCommissionOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="commission"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <CommissionPercentInput
                name={name}
                label={text.form.fields.commission}
                value={value}
                onValueChange={onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
