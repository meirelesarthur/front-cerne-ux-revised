// src/pages/BaseRegistrations/BirthNotes/CreateOrUpdateBirthNotes.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de OBSERVAÇÃO DE NASCIMENTO — Cadastros Base /
// Pecuária (TASK-FE-102).
// Rotas: /cadastros-base/observacao-nascimento/novo e
// /cadastros-base/observacao-nascimento/:birthNoteId (GUID), registradas em
// src/router/index.tsx (TASK-FE-103), guardadas por `birth_note_view`.
//
// Fidelidade (BirthNote-contrato §16): EXATAMENTE 2 campos, nesta ordem —
// `description` (Input, obrigatório, max 100) seguido de `is_enabled` (Select
// Ativo/Inativo, obrigatório, default `true` no create). Sem FK, sem `code`,
// sem abas — mirror ~1:1 de
// CadastrosBase/TiposIdentificacao/CreateOrUpdateTipoIdentificacao.tsx (mesmo
// shape exato de 2 campos).
//
// Payload SEMPRE completo (create e update) — `BirthNoteRequest::rules()` não
// diferencia por verbo (full-resource-replace, mesmo racional de
// updateIdentificationType).
//
// D3 do Maestro (não-negociável): `is_enabled` é SEMPRE `Select` "Ativo/
// Inativo" — NUNCA `Switch` (diferente de CreateOrUpdateRaca.tsx, que usa
// Switch — não é o precedente a seguir aqui).
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — a função tem nome
// INVERTIDO: retorna `true` quando o objeto TEM chaves (não vazio) e `false`
// quando está vazio. Guard usado aqui é o CORRIGIDO, literalmente o mesmo de
// `CreateOrUpdateTipoIdentificacao.tsx`: `fillForm` só reseta quando
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

import { birthNoteSchemaResolver } from '@/validations/schemas/BaseRegistrations/birthNote-schema';

import {
  createBirthNote,
  getBirthNoteByUuid,
  updateBirthNote,
} from '@/services/v2/BaseRegistrations/birthNote-service';

import type { Option } from '@/@types/option';
import type {
  BirthNoteData,
  BirthNoteForm as BirthNoteFormType,
  BirthNotePayload,
} from '@/@types/v2/BaseRegistrations/birthNote';

export default function CreateOrUpdateBirthNotes() {
  const { birthNoteId } = useParams<{ birthNoteId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(birthNoteId);

  const text = languageGB.baseRegistrations.birthNote;

  const canSave = isEditing ? can('birth_note_edit') : can('birth_note_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<BirthNoteFormType>({
    mode: 'onChange',
    resolver: birthNoteSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
    },
  });

  // Lei 2 (obrigatória) — só reseta o form a partir do servidor quando
  // `dirtyFields` está REALMENTE vazio (nada editado ainda) ou quando forçado
  // (`resetForce`). `isEmpty()` é INVERTIDO (ver cabeçalho do arquivo) — daqui
  // vem o `!`.
  function fillForm(data: BirthNoteData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const birthNoteQuery = useCustomFormQueryByGuid<BirthNoteData>({
    registrationId: isEditing ? birthNoteId : undefined,
    queryKey: queryKey.baseRegistrations.birthNote,
    asyncFunction: getBirthNoteByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([birthNoteQuery as any]);

  const birthNoteMutation = useRequest({
    asyncFunction: tryPersistBirthNote,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.birthNotes,
    queryKey2: queryKey.baseRegistrations.birthNote,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistBirthNote(data: BirthNoteFormType) {
    // Payload SEMPRE completo — `BirthNoteRequest::rules()` não diferencia
    // por verbo (`description`/`is_enabled` são `required` tanto no store
    // quanto no update), então NUNCA gated por `dirtyFields` (mesmo racional
    // de updateIdentificationType).
    const payload: BirthNotePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && birthNoteId) {
      return await updateBirthNote(birthNoteId, payload);
    }

    return await createBirthNote(payload);
  }

  // Guard CORRIGIDO (ver cabeçalho do arquivo / ERRO-FE-001): "editar sem
  // alterar nada = Cancelar" — só volta sem salvar quando `isEditing` E
  // `dirtyFields` está REALMENTE vazio (`!isEmpty(dirtyFields)`, dado que
  // `isEmpty()` retorna `true` quando HÁ chaves). A versão sem o `!`
  // descartaria toda edição real em silêncio.
  async function onSubmit(data: BirthNoteFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await birthNoteMutation.mutateAsync(data);
    }
  }

  const isSubmitting = birthNoteMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateTipoIdentificacao.tsx (evita duplicar chave de
  // i18n para o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
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
