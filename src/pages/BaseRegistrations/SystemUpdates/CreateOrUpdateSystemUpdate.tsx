// src/pages/BaseRegistrations/SystemUpdates/CreateOrUpdateSystemUpdate.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ATUALIZAÇÃO DO SISTEMA — Cadastros Base,
// execução 031, TASK-FE-1102. Rotas `/cadastros-base/atualizacoes-sistema/novo`
// e `/cadastros-base/atualizacoes-sistema/:uuid` (wiring real das rotas é
// TASK-FE-1104, este arquivo não mexe em router/menu).
//
// Molde estrutural: `BaseRegistrations/Warehouses/CreateOrUpdateWarehouses.tsx`
// (`useCustomFormQueryByGuid` + `useRequest` INLINE, guarda `!isEmpty(dirtyFields)`)
// — 2 campos, sem FK, sem abas.
//
// Decisão do dono §7.1 (contrato-front-atualizacoes-sistema.md, aprovada,
// `decisoes-do-dono-031.md` #5): campo `description` usa `RichTextEditor`
// (Tiptap) — NÃO o fallback `Textarea` cogitado pelo contrato enquanto a
// decisão estivesse pendente (já não está).
//
// `release_date`: o contrato de tela/DTO (TASK-FE-1100, `SystemUpdateForm`)
// tipa o campo como `string` (ISO 'yyyy-MM-dd', mesmo formato de
// `v.date()`/`field-validation-schema.ts`) — literal ao contrato. O
// componente de data do projeto (`InputDate`, mesmo usado por
// `ParameterWeights/CreateOrUpdateParameterWeights.tsx`) trabalha com `Date`;
// a conversão string↔Date fica isolada no `Controller` deste campo (via
// `date-fns`), sem alterar o shape do formulário/payload.
//
// Guard de UUID malformado: redireciona para a listagem (mesmo padrão de
// `SystemUpdateDetalhe.tsx`/`get_pwa_form_query_pattern` "Guard de navegação").
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { RichTextEditor } from '@/components/RichTextEditor';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { systemUpdateSchemaResolver } from '@/validations/schemas/BaseRegistrations/systemUpdate-schema';

import {
  createSystemUpdate,
  getSystemUpdate,
  updateSystemUpdate,
} from '@/services/v2/BaseRegistrations/systemUpdate-service';

import type {
  SystemUpdateDetail,
  SystemUpdateForm as SystemUpdateFormType,
  SystemUpdatePayload,
} from '@/@types/v2/BaseRegistrations/systemUpdate';

const SYSTEM_UPDATES_LIST_ROUTE = '/cadastros-base/atualizacoes-sistema';

export default function CreateOrUpdateSystemUpdate() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.systemUpdate;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);

  // Guard de navegação — um `:uuid` malformado (nem "novo" nem um GUID real)
  // não deve renderizar o formulário: redireciona para a listagem (mesmo
  // racional de `SystemUpdateDetalhe.tsx`).
  useEffect(() => {
    if (uuid && uuid !== 'novo' && !isValidGuid(uuid)) {
      navigate(SYSTEM_UPDATES_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const canSave = isEditing ? can('system_updates_edit') : can('system_updates_create');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<SystemUpdateFormType>({
    mode: 'onChange',
    resolver: systemUpdateSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      release_date: '',
      description: '',
    },
  });

  // ⚠️ `!isEmpty(dirtyFields)` — `isEmpty(obj)` retorna `true` quando `obj`
  // TEM ao menos uma chave (semântica invertida, `ERRO-FE-001` catalogado em
  // `Warehouses/CreateOrUpdateWarehouses.tsx`). Só sobrescreve o form quando
  // NÃO há edição do usuário em andamento (`dirtyFields` vazio) OU quando
  // forçado (`resetForce`) — Lei 2 obrigatória mesmo em formulário de 2 campos.
  function fillSystemUpdateForm(data: SystemUpdateDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        release_date: data.release_date,
        description: data.description,
      });
    }
  }

  const systemUpdateQuery = useCustomFormQueryByGuid<SystemUpdateDetail>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.baseRegistrations.systemUpdate,
    asyncFunction: getSystemUpdate,
    fillForm: fillSystemUpdateForm,
  });

  const isLoading = isEditing && checkLoadingStatus([systemUpdateQuery as any]);

  const systemUpdateMutation = useRequest({
    asyncFunction: tryPersistSystemUpdate,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.systemUpdates,
    queryKey2: queryKey.baseRegistrations.systemUpdate,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistSystemUpdate(data: SystemUpdateFormType) {
    const payload: SystemUpdatePayload = {
      release_date: data.release_date,
      description: data.description,
    };

    if (isEditing && uuid) {
      return await updateSystemUpdate(uuid, payload);
    }

    return await createSystemUpdate(payload);
  }

  // Mesmo atalho de `Warehouses`/`ParameterWeights`: em edição, se NADA
  // mudou, só volta pra lista sem chamar a mutação (evita PUT vazio).
  async function onSubmit(data: SystemUpdateFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await systemUpdateMutation.mutateAsync(data);
    }
  }

  const isSubmitting = systemUpdateMutation.isPending;

  if (uuid && uuid !== 'novo' && !isValidGuid(uuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
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
          <Controller
            name="release_date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.form.fields.releaseDate}
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                isRequired
                disabled={!canSave || isLoading}
                error={errors.release_date?.message}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={1} gap={6} mt={6}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label={text.form.fields.description}
                placeholder={text.form.placeholders.description}
                value={field.value}
                onChange={field.onChange}
                isRequired
                isDisabled={!canSave || isLoading}
                error={errors.description?.message}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
