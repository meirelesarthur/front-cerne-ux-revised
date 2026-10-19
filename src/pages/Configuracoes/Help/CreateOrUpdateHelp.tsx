// src/pages/Configuracoes/Help/CreateOrUpdateHelp.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TUTORIAL (Help, TASK-HP-06). Rotas:
// /configuracoes/helps/create (criar) e /configuracoes/helps/:id (editar,
// UUID v7 do backend Laravel `HasUuids`) — ambas registradas em
// `src/router/index.tsx`, guardadas por `helpers_view` (botões internos
// checam `helpers_create`/`helpers_edit` via `usePermissions`).
//
// Form de só 2 campos:
//   - `url` (Input) — obrigatória, formato de URL, máx. 100 chars
//     (`help-schema.ts`).
//   - `permission` (Select do lookup de TELAS) — endpoint NÃO-paginado
//     `/permissions/screens` (Help-contrato §10) → `SelectCombobox` (busca
//     CLIENT-SIDE), NÃO `SelectAsyncPaginate`. Option OBRIGATÓRIO no form
//     (mesmo endpoint não força obrigatoriedade no backend — decisão
//     explícita da ficha desta Tarefa).
//
// Payload SEMPRE completo (`url`+`permission_uuid`) em create E update —
// mesmo padrão de `CreateOrUpdateIssueDfeSyncTimes.tsx` — apesar de
// `UpdateHelpRequest` aceitar campos opcionais no backend (`sometimes`,
// Help-contrato §4.2), enviar o payload completo é um subconjunto válido e
// evita a complexidade de patch parcial num form de 2 campos.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { helpSchemaResolver } from '@/validations/schemas/Configuracoes/help-schema';

import {
  createHelp,
  getHelpByUuid,
  updateHelp,
} from '@/services/v2/Configuracoes/Help/help-service';

import type {
  CreateHelpRequest,
  HelpData,
  HelpForm as HelpFormType,
  UpdateHelpRequest,
} from '@/@types/v2/Configuracoes/help';

import { usePermissionScreens } from './usePermissionScreens';

export default function CreateOrUpdateHelp() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um UUID válido na rota ("create" não casa com
  // `/:id` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(id);

  // Guard de navegação: um `id` presente mas que NÃO é um UUID válido (ex.:
  // URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de CreateOrUpdateIssueDfeSyncTimes.tsx.
  useEffect(() => {
    if (id && !isValidGuid(id)) {
      navigate('/configuracoes/helps', { replace: true });
    }
  }, [id, navigate]);

  const text = languageGB.configuracoes.help;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<HelpFormType>({
    mode: 'onChange',
    resolver: helpSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      url: '',
      permission: null,
    },
  });

  // Reconstrução do Select a partir do Resource (uuid+label juntos, sem novo
  // fetch) — mesmo padrão de fillForm de CreateOrUpdateIssueDfeSyncTimes.tsx.
  // ✅ Lei 2: fillForm NUNCA chama reset() inline em useEffect; guarda
  // `!isEmpty(dirtyFields) || resetForce` via Object.keys().length.
  function fillHelpForm(data: HelpData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        url: data.url,
        permission: data.permission
          ? {
              label: data.permission.group_title ?? data.permission.name,
              value: data.permission.uuid,
            }
          : null,
      });
    }
  }

  const helpQuery = useCustomFormQueryByGuid<HelpData>({
    registrationId: isEditing ? id : undefined,
    queryKey: queryKey.configuracoes.help,
    asyncFunction: getHelpByUuid,
    fillForm: fillHelpForm,
  });

  const isLoading = isEditing && checkLoadingStatus([helpQuery as any]);

  // Select de tela — endpoint NÃO-paginado (Help-contrato §10), 1 fetch
  // compartilhado (`usePermissionScreens.tsx`), filtro CLIENT-SIDE dentro do
  // próprio `SelectCombobox`.
  const { options: screenOptions, isLoading: isLoadingScreens } = usePermissionScreens();

  const canSave = isEditing ? can('helpers_edit') : can('helpers_create');

  const helpMutation = useRequest({
    asyncFunction: tryPersistHelp,
    entityName: text.singularLabel,
    queryKey: queryKey.configuracoes.helps,
    queryKey2: queryKey.configuracoes.help,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo — ver cabeçalho do arquivo.
  async function tryPersistHelp(data: HelpFormType) {
    if (isEditing && id) {
      const payload: UpdateHelpRequest = {
        url: data.url,
        permission_uuid: data.permission!.value,
      };
      return await updateHelp(id, payload);
    }
    const payload: CreateHelpRequest = {
      url: data.url,
      permission_uuid: data.permission!.value,
    };
    return await createHelp(payload);
  }

  // Guard (DECIDE SE dispara a chamada de update): nada mudou em edição não
  // chama a API — mesmo racional de CreateOrUpdateIssueDfeSyncTimes.tsx.
  async function onSubmit(data: HelpFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasChanges) {
      navigate(-1);
      return;
    }

    await helpMutation.mutateAsync(data);
  }

  const isSubmitting = helpMutation.isPending;

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
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
          <Input
            label={text.form.fields.url}
            placeholder={text.form.placeholders.url}
            {...register('url')}
            error={errors.url?.message}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Controller
            name="permission"
            control={control}
            render={({ field }) => (
              <SelectCombobox
                name={field.name}
                label={text.form.fields.screen}
                placeholder={text.form.placeholders.screen}
                error={errors.permission?.message as string | undefined}
                options={screenOptions}
                loading={isLoadingScreens || !!isLoading}
                // Armadilha do checklist: `?? null` NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
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
