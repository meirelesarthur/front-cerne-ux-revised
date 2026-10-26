// src/pages/BaseRegistrations/Fodders/CreateOrUpdateFodders.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FORRAGEM — Cadastros Base / Pecuários
// (TASK-FD-FE-02).
// Rotas: /cadastros-base/forragem/novo e /cadastros-base/forragem/:fodderId
// (GUID), registradas em src/router/index.tsx, guardadas por
// `fodder_view`.
//
// Fidelidade ao legado (Doc Bruta §5): EXATAMENTE 2 campos, nesta ordem —
// `description` (Input, obrigatório, max 100) seguido de `is_enabled` (Select
// Ativo/Inativo, obrigatório, default `true` no create). Sem FK, sem `code`,
// sem abas — mirror ~1:1 de CreateOrUpdateIdentificationTypes.tsx (mesmo
// shape exato de 2 campos).
//
// Payload SEMPRE completo (create e update) — `FodderRequest::rules()` não
// diferencia por verbo (full-resource-replace, mesmo racional de
// IdentificationType, NÃO delta opcional de outros módulos).
//
// Guard corrigido (ERRO-FE-001 mapeado): "editar sem alterar nada = Cancelar"
// — só volta sem salvar quando `isEditing` E `dirtyFields` está REALMENTE vazio
// (uso de `Object.keys(dirtyFields).length === 0` explícito, forma robusta).
// Tabela-verdade: (1) editar c/ mudança → salva; (2) editar s/ mudança →
// navega; (3) criar → sempre salva.
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

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { fodderSchemaResolver } from '@/validations/schemas/BaseRegistrations/fodders-schema';

import {
  createFodder,
  getFodderByUuid,
  updateFodder,
} from '@/services/v2/BaseRegistrations/fodders-service';

import type { Option } from '@/@types/option';
import type {
  FodderData,
  FodderForm as FodderFormType,
  FodderPayload,
} from '@/@types/v2/BaseRegistrations/fodders';

export default function CreateOrUpdateFodders() {
  const { fodderId } = useParams<{ fodderId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(fodderId);

  const text = languageGB.baseRegistrations.fodder;

  const canSave = isEditing ? can('fodder_edit') : can('fodder_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<FodderFormType>({
    mode: 'onChange',
    resolver: fodderSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
    },
  });

  // Lei 2 (obrigatória) — só reseta o form a partir do servidor quando
  // `dirtyFields` está REALMENTE vazio (nada editado ainda) ou quando forçado
  // (`resetForce`). Forma explícita: `Object.keys(dirtyFields).length === 0`.
  function fillForm(data: FodderData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const fodderQuery = useCustomFormQueryByGuid<FodderData>({
    registrationId: isEditing ? fodderId : undefined,
    queryKey: queryKey.baseRegistrations.fodder,
    asyncFunction: getFodderByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([fodderQuery as any]);

  const fodderMutation = useRequest({
    asyncFunction: tryPersistFodder,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.fodders,
    queryKey2: queryKey.baseRegistrations.fodder,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFodder(data: FodderFormType) {
    // Payload SEMPRE completo — `FodderRequest::rules()` não diferencia por
    // verbo (`description`/`is_enabled` são `required` tanto no store quanto
    // no update), então NUNCA gated por `dirtyFields` (mesmo racional de
    // IdentificationType, NÃO o delta parcial de outros módulos).
    const payload: FodderPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && fodderId) {
      return await updateFodder(fodderId, payload);
    }

    return await createFodder(payload);
  }

  // Guard CORRETO (forma explícita recomendada): "editar sem alterar nada =
  // Cancelar" — só volta sem salvar quando `isEditing` E `dirtyFields` está
  // REALMENTE vazio. Tabela-verdade: (1) editar c/ mudança → salva; (2) editar
  // s/ mudança → navega; (3) criar → sempre salva.
  async function onSubmit(data: FodderFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
    } else {
      await fodderMutation.mutateAsync(data);
    }
  }

  const isSubmitting = fodderMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de IdentificationTypes (evita duplicar chave de i18n para o mesmo
  // par de rótulos).
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
