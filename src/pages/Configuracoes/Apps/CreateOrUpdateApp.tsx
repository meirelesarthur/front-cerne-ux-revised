// src/pages/Configuracoes/Apps/CreateOrUpdateApp.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de APLICATIVO (App, TASK-APP-FE-01). Rotas:
// /configuracoes/apps/create (criar) e /configuracoes/apps/:id (editar,
// UUID v7 do backend Laravel `HasUuids`) — ambas registradas em
// `src/router/index.tsx`, guardadas por `apps_view` (botões internos checam
// `apps_create`/`apps_edit` via `usePermissions`).
//
// Form de 5 campos, todos obrigatórios (App-contrato.md Seção 1):
//   - `platform` (Input, maxLength=10) — texto livre, SEM enum (DA-APP-02).
//   - `version` (Input, maxLength=10) — texto livre, SEM enum (DA-APP-02).
//   - `description` (Textarea) — texto livre, sem limite.
//   - `release_date`/`deadline` (Input type="date") — string `Y-m-d` pura,
//     tanto na entrada (controlled input nativo) quanto na saída
//     (`AppResource::toDateString()`), NUNCA ISO com hora — mesmo racional já
//     catalogado em `animal-schema.ts`/`entry_date` e garantido pelo
//     `fv.date()` de `app-schema.ts`.
//
// SEM validação client-side de duplicidade `platform`+`version` (DA-APP-03 —
// dois registros idênticos são válidos, fidelidade ao legado).
//
// Update PARCIAL — só os campos em `dirtyFields` vão no PATCH (mirror do
// Código Ouro de `get_pwa_form_query_pattern`, `tryPersistRole`); o backend
// resolve o campo ausente preservando o valor atual (`AppData` com
// `Optional`, App-contrato.md Seção 6). Create envia o payload completo
// (`CreateAppRequest`, todos os 5 campos obrigatórios).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Textarea } from '@/components/Form/InputTextArea';
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

import { appSchemaResolver } from '@/validations/schemas/Configuracoes/app-schema';

import { createApp, getAppByUuid, updateApp } from '@/services/v2/Configuracoes/Apps/app-service';

import type {
  AppData,
  AppForm as AppFormType,
  CreateAppRequest,
  UpdateAppRequest,
} from '@/@types/v2/Configuracoes/apps';

export default function CreateOrUpdateApp() {
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
  // racional de CreateOrUpdateHelp.tsx.
  useEffect(() => {
    if (id && !isValidGuid(id)) {
      navigate('/configuracoes/apps', { replace: true });
    }
  }, [id, navigate]);

  const text = languageGB.configuracoes.app;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<AppFormType>({
    mode: 'onChange',
    resolver: appSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      platform: '',
      version: '',
      description: '',
      release_date: '',
      deadline: '',
    },
  });

  // ✅ Lei 2: fillForm NUNCA chama reset() inline em useEffect; guarda
  // `!isEmpty(dirtyFields) || resetForce` (ficha desta Tarefa).
  function fillAppForm(data: AppData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        platform: data.platform,
        version: data.version,
        description: data.description,
        release_date: data.release_date,
        deadline: data.deadline,
      });
    }
  }

  const appQuery = useCustomFormQueryByGuid<AppData>({
    registrationId: isEditing ? id : undefined,
    queryKey: queryKey.configuracoes.app,
    asyncFunction: getAppByUuid,
    fillForm: fillAppForm,
  });

  const isLoading = isEditing && checkLoadingStatus([appQuery as any]);

  const canSave = isEditing ? can('apps_edit') : can('apps_create');

  const appMutation = useRequest({
    asyncFunction: tryPersistApp,
    entityName: text.singularLabel,
    queryKey: queryKey.configuracoes.apps,
    queryKey2: queryKey.configuracoes.app,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Update PARCIAL (só dirtyFields) / Create com payload completo — ver
  // cabeçalho do arquivo.
  async function tryPersistApp(data: AppFormType) {
    if (isEditing && id) {
      const payload: UpdateAppRequest = {};
      if (dirtyFields.platform) payload.platform = data.platform;
      if (dirtyFields.version) payload.version = data.version;
      if (dirtyFields.description) payload.description = data.description;
      if (dirtyFields.release_date) payload.release_date = data.release_date;
      if (dirtyFields.deadline) payload.deadline = data.deadline;
      return await updateApp(id, payload);
    }
    const payload: CreateAppRequest = {
      platform: data.platform,
      version: data.version,
      description: data.description,
      release_date: data.release_date,
      deadline: data.deadline,
    };
    return await createApp(payload);
  }

  // Guard (DECIDE SE dispara a chamada de update): nada mudou em edição não
  // chama a API — mesmo racional de CreateOrUpdateHelp.tsx.
  async function onSubmit(data: AppFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasChanges) {
      navigate(-1);
      return;
    }

    await appMutation.mutateAsync(data);
  }

  const isSubmitting = appMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
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
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
          <Input
            label={text.form.fields.platform}
            placeholder={text.form.placeholders.platform}
            {...register('platform')}
            error={errors.platform?.message}
            maxLength={10}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.version}
            placeholder={text.form.placeholders.version}
            {...register('version')}
            error={errors.version?.message}
            maxLength={10}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Controller
            name="release_date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.releaseDate}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="deadline"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.deadline}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Textarea
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
