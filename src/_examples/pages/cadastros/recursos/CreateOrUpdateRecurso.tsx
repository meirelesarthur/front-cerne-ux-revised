// src/_examples/pages/cadastros/recursos/CreateOrUpdateRecurso.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — tela ÚNICA de CRIAÇÃO **e** EDIÇÃO da feature "Recursos".
//
// Espelha o `Admin/Agents/CreateOrUpdateAgent.tsx` do Rank:
//   - Um SÓ arquivo para criar e editar (NUNCA dois separados).
//   - `isEditing` decide o comportamento (título, request create vs update com
//     delta de dirtyFields, e quais abas aparecem).
//   - ID é GUID (string) — padrão novo da empresa. `isEditing` = tem GUID válido
//     e não é a rota "create".
//   - ABAS internas: a aba 0 ("Dados Gerais") fica INLINE aqui; a aba 1
//     ("Configurações") só aparece ao EDITAR e é um componente SEPARADO
//     (RecursoConfiguracoesTab.tsx) renderizado dentro de <Tabs.Content>.
//
// Validação: schema Yup real via `resourceSchemaResolver(languageGB)` (que
// reaproveita a infra `fieldValidationSchema`). Textos: `languageGB.examples.*`.
//
// Rotas: /exemplo/create  e  /exemplo/:resourceId  (resourceId = GUID)
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, SimpleGrid, Tabs } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useResourceForm } from '@/_examples/hooks/useResources';
import { createResource, updateResource } from '@/_examples/services/resource-service';
import { resourceSchemaResolver } from '@/_examples/validations/resource-schema';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Textarea } from '@/components/Form/InputTextArea';
import { Select } from '@/components/Form/Select';
import { FormFooter } from '@/components/FormFooter';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { RecursoConfiguracoesTab } from './RecursoConfiguracoesTab';

import type {
  CreateResourceRequest,
  ResourceData,
  ResourceForm as ResourceFormType,
  UpdateResourceRequest,
} from '@/_examples/types/resource';

export default function CreateOrUpdateRecurso() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  // Padrão real do Rank (`agentId !== "create"`), adaptado ao GUID:
  // é edição quando existe um GUID válido na rota (a rota "create" não é GUID).
  const isEditing = isValidGuid(resourceId);

  // Índice da aba sincronizado com a URL (?tab=), padrão do Rank (useCustomSearch)
  // em vez de estado local — a aba sobrevive a refresh/link direto.
  const { tabIndex, handleTabsChange } = useCustomSearch();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ResourceFormType>({
    mode: 'onChange',
    resolver: resourceSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      code: '',
      status: 'active',
      enabled: true,
    },
  });

  const STATUS_OPTIONS = useMemo(
    () => [
      {
        value: 'active',
        label: languageGB.examples.resource.list.table.active,
      },
      {
        value: 'inactive',
        label: languageGB.examples.resource.list.table.inactive,
      },
    ],
    [languageGB]
  );

  function fillForm(data: ResourceData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        id: data.id,
        name: data.name,
        description: data.description || '',
        code: data.code,
        status: data.status,
        enabled: !!data.enabled,
      });
    }
  }

  const resourceQuery = useResourceForm({
    registrationId: isEditing ? resourceId : undefined,
    fillForm,
  });

  const isLoading = checkLoadingStatus([resourceQuery as any]);

  const resourceMutation = useRequest({
    asyncFunction: tryPersistResource,
    entityName: languageGB.examples.resource.singularLabel,
    queryKey: queryKey._example.list,
    queryKey2: queryKey._example.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistResource(data: ResourceFormType) {
    if (isEditing && resourceId) {
      // UPDATE: envia só o delta (dirtyFields), padrão do Rank.
      const updateData: UpdateResourceRequest = {};
      if (dirtyFields.name) updateData.name = data.name;
      if (dirtyFields.description) updateData.description = data.description;
      if (dirtyFields.code) updateData.code = data.code;
      if (dirtyFields.status) updateData.status = data.status;
      if (dirtyFields.enabled) updateData.enabled = data.enabled;

      return await updateResource(resourceId, updateData);
    }

    // CREATE: payload completo.
    return await createResource({
      name: data.name,
      description: data.description,
      code: data.code,
      status: data.status,
      enabled: data.enabled,
    } as CreateResourceRequest);
  }

  async function onSubmit(data: ResourceFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await resourceMutation.mutateAsync(data);
    }
  }

  const isSubmitting = resourceMutation.isPending;

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.examples.resource.form.title.edit
          : languageGB.examples.resource.form.title.create
      }
      subtitle={
        isEditing
          ? languageGB.examples.resource.form.subtitle.edit
          : languageGB.examples.resource.form.subtitle.create
      }
      showDivider
    >
      {/* @ts-ignore - custom variant */}
      <Tabs.Root
        value={String(tabIndex)}
        onValueChange={(e: any) => handleTabsChange(Number(e.value))}
        variant="secondary"
      >
        {/* @ts-ignore */}
        <Tabs.List>
          {/* @ts-ignore */}
          <Tabs.Trigger value="0">
            {languageGB.examples.resource.form.tabs.generalInfo}
          </Tabs.Trigger>
          {/* Aba extra: só aparece ao EDITAR (padrão real do Rank). */}
          {isEditing && (
            // @ts-ignore
            <Tabs.Trigger value="1">{languageGB.examples.resource.form.tabs.settings}</Tabs.Trigger>
          )}
        </Tabs.List>

        {/* ---- ABA 0: Dados Gerais + Form (padrão Rank → form DENTRO da aba) ---- */}
        {/* @ts-ignore */}
        <Tabs.Content value="0">
          <Form onSubmit={handleSubmit(onSubmit)} noPadding>
            <Box pt={4}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <Input
                  label={languageGB.examples.resource.form.fields.name}
                  placeholder={languageGB.examples.resource.form.placeholders.name}
                  {...register('name')}
                  error={errors.name?.message}
                  isRequired
                  loading={isLoading}
                />

                <Input
                  label={languageGB.examples.resource.form.fields.code}
                  placeholder={languageGB.examples.resource.form.placeholders.code}
                  {...register('code')}
                  error={errors.code?.message}
                  isRequired
                  loading={isLoading}
                  fontFamily="mono"
                />
              </SimpleGrid>

              <Box mt={6}>
                <Textarea
                  label={languageGB.examples.resource.form.fields.description}
                  placeholder={languageGB.examples.resource.form.placeholders.description}
                  {...register('description')}
                  loading={isLoading}
                />
              </Box>

              <Box mt={6}>
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={languageGB.examples.resource.form.fields.status}
                        placeholder={languageGB.examples.resource.form.fields.status}
                        name={name}
                        value={STATUS_OPTIONS.find((o) => o.value === value)}
                        onChange={(val: any) => onChange(val?.value)}
                        options={STATUS_OPTIONS}
                        error={error?.message}
                        isRequired
                        isDisabled={isLoading}
                        loading={isLoading}
                      />
                    )}
                  />
                </SimpleGrid>
              </Box>
            </Box>

            <FormFooter noPadding>
              <Button
                title={languageGB.defaltStrings?.cancel || 'Cancelar'}
                variant="outline"
                onClick={() => navigate(-1)}
              />
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || isLoading}
              />
            </FormFooter>
          </Form>
        </Tabs.Content>

        {/* ---- ABA 1: Configurações (ARQUIVO SEPARADO, só ao EDITAR) ---- */}
        {isEditing && (
          // @ts-ignore
          <Tabs.Content value="1">
            <RecursoConfiguracoesTab control={control} languageGB={languageGB} />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </FormContainer>
  );
}
