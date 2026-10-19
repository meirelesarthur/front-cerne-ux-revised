// src/pages/CadastrosBase/Operacoes/CreateOrUpdateOperacao.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de OPERAÇÃO (Operation) — Cadastros Base /
// Agrícolas (TASK-FE-043). Rotas: /cadastros-base/operacoes/novo e
// /cadastros-base/operacoes/:operationId (GUID), registradas em
// src/router/index.tsx (TASK-FE-044), guardadas por `operations_view`
// (leitura mínima) + `canSave` por `operations_create`/`operations_edit`.
//
// Referência UX: UX-GAP (mapeamento do Maestro) — mirror estrutural de
// CadastrosBase/Atividades/CreateOrUpdateAtividade.tsx (mecânica idêntica:
// `isEditing` por GUID, `fillForm` guardado por
// `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest` com
// `typesRequest` condicional, `ButtonSaveAndNext`) — campos diferentes (fiéis
// ao legado de Operação, Doc Bruta §2/§5).
//
// Campos, na ordem do legado: name/description/grouper_uuid(Select
// "Agrupador")/order/use/is_enabled.
//
// Campo "Ordem" — READ-ONLY nos dois modos (ajuste pós-E2E: backend virou
// AUTORITATIVO sobre `order`, recalcula no create e preserva no update).
// Em CRIAÇÃO exibe a PRÓXIMA ordem disponível (`GET /operations/next-order`,
// `useOperationNextOrder`); em EDIÇÃO exibe `data.order` da própria Operação
// (já vem do Resource via `fillForm`, sem query extra). Continua no payload
// de `tryPersistOperation` (o backend ignora no create) — schema Yup
// inalterado, sempre populado automaticamente antes do submit.
//
// Campo "Agrupador" — Select real (`GAP-FE-006` resolvido, Opção B):
// `Controller` + `SelectAsyncPaginate` (`@/components/Form/SelectAsyncPaginate`),
// contra `listGrouperOptions` (GET /groupers/options — GAP-BE-040 Opção B,
// sem gate `groupers_view`, alimenta o select mesmo para quem não tem essa
// permissão), habilitado em `create` E `edit` — precedente literal: campo `specie_uuid`
// de CreateOrUpdateRaca.tsx. Diferente de Breed (campo obrigatório), aqui é
// OPCIONAL/nullable — `value ?? null` (não `?? undefined`, mesma landmine de
// clear documentada em FilterSideRacas.tsx). `fillForm` monta o par
// `{ label, value }` DIRETO de `data.grouper_uuid`/`data.grouper_name` (sem
// query de preview extra — `OperationResource` já retorna ambos).
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (landmine `ERRO-FE-001`). Guarda usada
// abaixo — LITERAL do task-packet, mesmo padrão de
// CreateOrUpdateAtividade.tsx/CreateOrUpdateEspecie.tsx.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listGrouperOptions } from '@/services/v2/Groupers/grouper-service';
import { createOperation, updateOperation } from '@/services/v2/Operations/operation-service';

import type { Option } from '@/@types/option';
import type { GrouperListItem } from '@/@types/v2/Groupers';
import type {
  OperationDetail,
  OperationForm as OperationFormType,
  OperationPayload,
  OperationUseSlug,
} from '@/@types/v2/Operations';

import { operationSchemaResolver } from './operation-schema';
import { useOperationForm, useOperationNextOrder } from './useOperations';

export default function CreateOrUpdateOperacao() {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(operationId);

  const text = languageGB.operations.operation;

  const canSave = isEditing ? can('operations_edit') : can('operations_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<OperationFormType>({
    mode: 'onChange',
    resolver: operationSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      grouper_uuid: null,
      is_enabled: true,
      order: 0,
      use: 'ambos',
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`.
  function fillForm(data: OperationDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        description: data.description ?? '',
        grouper_uuid: data.grouper_uuid
          ? { label: data.grouper_name ?? data.grouper_uuid, value: data.grouper_uuid }
          : null,
        is_enabled: !!data.is_enabled,
        order: Number(data.order),
        use: data.use,
      });
    }
  }

  const operationQuery = useOperationForm({
    registrationId: isEditing ? operationId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([operationQuery as any]);

  // Ajuste pós-E2E — só em CRIAÇÃO: busca a próxima ordem disponível e
  // preenche o campo read-only (backend é autoritativo sobre `order`; em
  // EDIÇÃO o valor já chega por `fillForm`/`data.order`, sem query extra).
  const nextOrderQuery = useOperationNextOrder({ enabled: !isEditing });

  useEffect(() => {
    if (!isEditing && nextOrderQuery.data) {
      setValue('order', nextOrderQuery.data.next_order);
    }
  }, [isEditing, nextOrderQuery.data, setValue]);

  const operationMutation = useRequest({
    asyncFunction: tryPersistOperation,
    entityName: text.singularLabel,
    queryKey: queryKey.operations.list,
    queryKey2: queryKey.operations.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistOperation(data: OperationFormType) {
    const payload: OperationPayload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      // GAP-FE-006 resolvido — sempre explícito: uuid selecionado ou `null`
      // se limpo/vazio (desvincula o Agrupador).
      grouper_uuid: data.grouper_uuid?.value ?? null,
      is_enabled: !!data.is_enabled,
      order: Number(data.order),
      use: data.use as OperationUseSlug,
    };

    if (isEditing && operationId) {
      return await updateOperation(operationId, payload);
    }

    return await createOperation(payload);
  }

  async function onSubmit(data: OperationFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação, ou edição com alteração real → salva.
      await operationMutation.mutateAsync(data);
    }
  }

  const isSubmitting = operationMutation.isPending;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const useOptions: Option<OperationUseSlug>[] = [
    { value: 'ambos', label: text.form.useOptions.both },
    { value: 'agricultura', label: text.form.useOptions.agriculture },
    { value: 'pecuaria', label: text.form.useOptions.livestock },
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
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="order"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.order}
                value={value ?? null}
                onValueChange={(value) => onChange(value)}
                min={0}
                allowDot={false}
                error={error?.message}
                isRequired
                // Ajuste pós-E2E — BLOQUEADO nos dois modos (backend
                // autoritativo sobre `order`): CRIAÇÃO exibe a próxima ordem
                // (`useOperationNextOrder`), EDIÇÃO exibe a ordem própria da
                // Operação (`fillForm`/`data.order`). Sempre read-only,
                // independente de `canSave`.
                readOnly
                disabled
              />
            )}
          />

          <Controller
            name="use"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.use}
                name={name}
                value={useOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<OperationUseSlug> | null) => onChange(opt?.value ?? '')}
                options={useOptions}
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

        {/* Campo "Agrupador" — Select funcional por `grouper_uuid` (GAP-FE-006
            resolvido, Opção B). Último campo do corpo (mesmo
            posicionamento de `specie_uuid` em CreateOrUpdateRaca.tsx) — fora
            do SimpleGrid de colunas curtas, célula própria de largura total. */}
        <Box mt={6}>
          <Controller
            name="grouper_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.grouper}
                placeholder={text.form.placeholders.grouper}
                service={listGrouperOptions}
                mapOptions={(item: GrouperListItem) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Campo OPCIONAL/nullable (diferente de Breed) — `?? null`
                // (NÃO `?? undefined`, mesma landmine de clear documentada em
                // FilterSideRacas.tsx).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave}
                // Fix de portal (mesmo achado de CreateOrUpdateRaca.tsx) — o
                // menu não-portalizado seria recortado pelo container do
                // form (último campo do corpo).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
