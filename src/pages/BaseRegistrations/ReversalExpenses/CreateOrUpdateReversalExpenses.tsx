// src/pages/BaseRegistrations/ReversalExpenses/CreateOrUpdateReversalExpenses.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ESTORNO (ReversalExpense) — Cadastros
// Base / Gerais. Rotas: /cadastros-base/estorno/novo e
// /cadastros-base/estorno/:reversalExpenseId (GUID), registradas em
// src/router/index.tsx (TASK-FE-064), guardadas por `reversal_view`.
//
// Mirror mecânico de CondicoesPagamento/CreateOrUpdateCondicaoPagamento.tsx
// (estrutura mecânica: `isEditing` por GUID, `fillForm` guardado por
// `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest` com
// `typesRequest` condicional, `ButtonSaveAndNext` com `dirtyFields`) +
// Atividades/CreateOrUpdateAtividade.tsx para o campo monetário (`MoneyInput`).
//
// Campos, na ordem do legado (`reverse/_forms.blade.php`): Descrição, Usa Kg,
// Ativo, Valor.
//   - `description` (Input, obrigatório, máx. 30 — mais restritivo que a
//     coluna física, fiel ao legado)
//   - `use_kg` (Select Sim/Não, obrigatório — dado de negócio, não é toggle
//     imediato de UI)
//   - `is_enabled` (Select Ativo/Inativo, obrigatório — GAP-FE-008, NÃO um
//     Switch)
//   - `value` (MoneyInput — máscara monetária R$ + milhar + 2 casas,
//     obrigatório; payload envia número puro, NUNCA a string mascarada,
//     mesmo componente de Atividades.vl_hectare)
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio
// (ERRO-FE-001). Guarda usada: `!isEmpty(dirtyFields) || resetForce` no
// `fillForm` (reset seguro só quando `dirtyFields` está vazio ou carga
// forçada); no `onSubmit`, `isEditing && isEmpty(dirtyFields)` → `dirtyFields`
// TEM chaves → houve alteração real → salva; `isEditing` sem isso → nada
// mudou → só navega, sem PUT (mesmo padrão exato de
// CreateOrUpdateCondicaoPagamento.tsx).
//
// Payload de escrita SEMPRE completo (POST e PUT) — `ReversalExpenseRequest`
// valida `sometimes` no update, mas os 4 campos SEMPRE vêm preenchidos no
// form (nenhum campo opcional aqui), então o payload nunca precisa ser
// parcial/gated por `dirtyFields` — mesmo padrão de PaymentTerm.
//
// `value` chega como STRING decimal da API ("1234.5600", TASK-FE-061) —
// converter com Number(data.value) ANTES de reset({ value: ... }), senão o
// MoneyInput recebe uma string e quebra a formatação.
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

import { reversalExpenseSchemaResolver } from '@/validations/schemas/BaseRegistrations/reversalExpenses-schema';

import {
  createReversalExpense,
  getReversalExpense,
  updateReversalExpense,
} from '@/services/v2/BaseRegistrations/reversalExpenses-service';

import type { Option } from '@/@types/option';
import type {
  ReversalExpenseDetail,
  ReversalExpenseForm as ReversalExpenseFormType,
  ReversalExpensePayload,
} from '@/@types/v2/BaseRegistrations/reversalExpenses';

export default function CreateOrUpdateReversalExpenses() {
  const { reversalExpenseId } = useParams<{ reversalExpenseId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(reversalExpenseId);
  const text = languageGB.baseRegistrations.reversalExpense;
  const canSave = isEditing ? can('reversal_edit') : can('reversal_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ReversalExpenseFormType>({
    mode: 'onChange',
    resolver: reversalExpenseSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      use_kg: false,
      value: 0,
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`. `value` chega como STRING decimal da API ("1234.5600") —
  // Number(...) ANTES do reset, senão o MoneyInput recebe string e quebra a
  // formatação (`numberToDigits` espera `number`).
  function fillForm(data: ReversalExpenseDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        use_kg: !!data.use_kg,
        value: Number(data.value),
      });
    }
  }

  const reversalExpenseQuery = useCustomFormQueryByGuid<ReversalExpenseDetail>({
    registrationId: isEditing ? reversalExpenseId : undefined,
    queryKey: queryKey.baseRegistrations.reversalExpense,
    asyncFunction: getReversalExpense,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([reversalExpenseQuery as any]);

  const reversalExpenseMutation = useRequest({
    asyncFunction: tryPersistReversalExpense,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.reversalExpenses,
    queryKey2: queryKey.baseRegistrations.reversalExpense,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistReversalExpense(data: ReversalExpenseFormType) {
    // Payload SEMPRE completo (4 campos) em create e update — mesmo padrão
    // de PaymentTerm (nunca gated por dirtyFields).
    const payload: ReversalExpensePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      use_kg: !!data.use_kg,
      value: Number(data.value),
    };

    if (isEditing && reversalExpenseId) {
      return await updateReversalExpense(reversalExpenseId, payload);
    }

    return await createReversalExpense(payload);
  }

  async function onSubmit(data: ReversalExpenseFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      // dirtyFields TEM chaves (isEmpty real === true) → houve alteração → salva.
      await reversalExpenseMutation.mutateAsync(data);
    } else if (isEditing) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação → sempre salva.
      await reversalExpenseMutation.mutateAsync(data);
    }
  }

  const isSubmitting = reversalExpenseMutation.isPending;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const useKgOptions: Option<boolean>[] = [
    { value: true, label: text.form.useKgOptions.yes },
    { value: false, label: text.form.useKgOptions.no },
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
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
