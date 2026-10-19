// src/pages/BaseRegistrations/Indexers/CreateOrUpdateIndexers.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de INDEXADOR — Cadastros Base / Financeiros
// (TASK-FE-212).
// Rotas: /cadastros-base/indexadores/novo e
// /cadastros-base/indexadores/:indexerId (GUID), registradas em
// src/router/index.tsx (TASK-FE-213), guardadas por `indexers_view`.
//
// Fidelidade (Indexer-contrato §16): EXATAMENTE 3 campos, nesta ordem —
// `description` (Input, obrigatório, max 100) → `descriptive` (Input,
// obrigatório, max 100, mesma regra de `description`) → `is_enabled` (Select
// Ativo/Inativo, obrigatório, default `true` no create). Sem FK, sem abas —
// mirror ~1:1 de
// `ObservacaoNascimento/CreateOrUpdateObservacaoNascimento.tsx` + 1 campo.
//
// Payload SEMPRE completo (create e update) — `IndexerRequest::rules()` não
// diferencia por verbo (full-resource-replace, mesmo racional de
// updateBirthNote).
//
// D5 do Maestro (não-negociável): `is_enabled` é SEMPRE `Select` "Ativo/
// Inativo" — NUNCA `Switch` (diferente de CreateOrUpdateRaca.tsx, que usa
// Switch — não é o precedente a seguir aqui).
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — a função tem nome
// INVERTIDO: retorna `true` quando o objeto TEM chaves (não vazio) e `false`
// quando está vazio. Guard usado aqui é o CORRIGIDO, literalmente o mesmo de
// `CreateOrUpdateObservacaoNascimento.tsx`: `fillForm` só reseta quando
// `!isEmpty(dirtyFields) || resetForce` (ou seja, quando `dirtyFields` está
// REALMENTE vazio, ou é forçado); `onSubmit` só volta sem salvar quando
// `isEditing && !isEmpty(dirtyFields)` (ou seja, quando NADA mudou). NÃO usar
// a leitura ingênua do nome (sem o `!`) — descartaria toda edição real em
// silêncio.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
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

import { indexerSchemaResolver } from '@/validations/schemas/BaseRegistrations/indexer-schema';

import {
  createIndexer,
  getIndexerByUuid,
  updateIndexer,
} from '@/services/v2/BaseRegistrations/indexer-service';

import type { Option } from '@/@types/option';
import type {
  IndexerData,
  IndexerForm as IndexerFormType,
  IndexerPayload,
} from '@/@types/v2/BaseRegistrations/indexer';

export default function CreateOrUpdateIndexers() {
  const { indexerId } = useParams<{ indexerId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(indexerId);

  const text = languageGB.baseRegistrations.indexer;

  const canSave = isEditing ? can('indexers_edit') : can('indexers_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<IndexerFormType>({
    mode: 'onChange',
    resolver: indexerSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      descriptive: '',
      is_enabled: true,
    },
  });

  // Lei 2 (obrigatória) — só reseta o form a partir do servidor quando
  // `dirtyFields` está REALMENTE vazio (nada editado ainda) ou quando forçado
  // (`resetForce`). `isEmpty()` é INVERTIDO (ver cabeçalho do arquivo) — daqui
  // vem o `!`.
  function fillForm(data: IndexerData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        descriptive: data.descriptive,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const indexerQuery = useCustomFormQueryByGuid<IndexerData>({
    registrationId: isEditing ? indexerId : undefined,
    queryKey: queryKey.baseRegistrations.indexer,
    asyncFunction: getIndexerByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([indexerQuery as any]);

  const indexerMutation = useRequest({
    asyncFunction: tryPersistIndexer,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.indexers,
    queryKey2: queryKey.baseRegistrations.indexer,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistIndexer(data: IndexerFormType) {
    // Payload SEMPRE completo — `IndexerRequest::rules()` não diferencia por
    // verbo (`description`/`descriptive`/`is_enabled` são `required` tanto
    // no store quanto no update), então NUNCA gated por `dirtyFields` (mesmo
    // racional de updateBirthNote).
    const payload: IndexerPayload = {
      description: data.description.trim(),
      descriptive: data.descriptive.trim(),
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && indexerId) {
      return await updateIndexer(indexerId, payload);
    }

    return await createIndexer(payload);
  }

  // Guard CORRIGIDO (ver cabeçalho do arquivo / ERRO-FE-001): "editar sem
  // alterar nada = Cancelar" — só volta sem salvar quando `isEditing` E
  // `dirtyFields` está REALMENTE vazio (`!isEmpty(dirtyFields)`, dado que
  // `isEmpty()` retorna `true` quando HÁ chaves). A versão sem o `!`
  // descartaria toda edição real em silêncio.
  async function onSubmit(data: IndexerFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await indexerMutation.mutateAsync(data);
    }
  }

  const isSubmitting = indexerMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateObservacaoNascimento.tsx (evita duplicar chave
  // de i18n para o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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

          <Input
            label={text.form.fields.descriptive}
            placeholder={text.form.placeholders.descriptive}
            {...register('descriptive')}
            error={errors.descriptive?.message}
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
                value={statusOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions}
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
