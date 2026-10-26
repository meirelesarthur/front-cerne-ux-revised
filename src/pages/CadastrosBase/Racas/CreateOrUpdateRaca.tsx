// src/pages/CadastrosBase/Racas/CreateOrUpdateRaca.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de RAÇA (mesmo arquivo para os dois casos, TASK-BREED-02).
// Rotas: /cadastros-base/racas/novo (criar) e /cadastros-base/racas/:breedId
// (editar, GUID) — ambas registradas em src/router/index.tsx, guardadas por
// `breeds_view` (autorização real de create/edit é 403 do backend).
//
// Estrutura mecânica idêntica a CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx
// (precedente mais recente do projeto), simplificada: 3 campos, sem abas, sem
// flags de autorização por item (`BreedResource` não expõe `can_edit`/
// `can_delete` — autorização 100% por permissão GLOBAL, mesmo padrão de
// Perfil/CreateOrUpdatePerfil.tsx).
//
// Select de Espécie (`specie_uuid`) — espelha EXATAMENTE o campo `parent_uuid`
// de CreateOrUpdateCentroCusto.tsx:648-679 (Controller + SelectAsyncPaginate +
// `listSpecies`, criado em TASK-BREED-01), adaptado para OBRIGATÓRIO
// (`BreedRequest.php:31-36` — diferente do Antecessor de Centro de Custo, que
// é opcional).
//
// ACHADO/DECISÃO DE IMPLEMENTAÇÃO (diverge do texto da ficha TASK-BREED-02,
// que descreve "delta de dirtyFields no update, mesmo padrão de
// CreateOrUpdateCentroCusto.tsx"): `BreedRequest::rules()` NÃO diferencia
// store/update por método (só `authorize()` o faz) — `description`,
// `is_enabled` E `specie_uuid` são `required` em AMBOS os verbos (confirmado
// por leitura direta de `api_root/app/Http/Requests/Api/V1/BreedRequest.php`).
// Um PATCH parcial (só os campos de `dirtyFields`) sofreria 422 sempre que
// omitisse qualquer um dos 3 campos. Por isso o `tryPersistBreed` abaixo
// envia o payload COMPLETO em ambos os modos (create/update) — o mesmo
// comportamento que `CreateOrUpdateCentroCusto.tsx` de fato implementa na
// prática (nenhuma tela do projeto usa um PATCH verdadeiramente parcial hoje;
// a menção a "delta" na ficha não reflete o `tryPersistCostCenter` real, que
// também monta o payload inteiro a cada submit). `dirtyFields` continua
// usado apenas para decidir se há algo a salvar (`isEmpty(dirtyFields)`) e
// para o rótulo do botão (`ButtonSaveAndNext`) — nunca para montar um PATCH
// parcial.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createBreed, updateBreed } from '@/services/v2/Breeds/breed-service';
import { listSpecies } from '@/services/v2/Species/species-service';

import type { BreedData, BreedForm as BreedFormType, BreedPayload } from '@/@types/v2/Breeds/breed';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

import { breedSchemaResolver } from './breed-schema';
import { useBreedForm } from './useBreeds';

export default function CreateOrUpdateRaca() {
  const { breedId } = useParams<{ breedId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:breedId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(breedId);

  // Guard de navegação: um `breedId` presente mas que NÃO é um GUID válido
  // (ex.: URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional do guard de `get_pwa_form_query_pattern` (CreateOrUpdateUser.tsx).
  useEffect(() => {
    if (breedId && !isValidGuid(breedId)) {
      navigate('/cadastros-base/racas', { replace: true });
    }
  }, [breedId, navigate]);

  const text = languageGB.breeds.breed;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<BreedFormType>({
    mode: 'onChange',
    resolver: breedSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
    },
  });

  function fillForm(data: BreedData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
      });
    }
  }

  const breedQuery = useBreedForm({
    registrationId: isEditing ? breedId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([breedQuery as any]);

  // Sem flags de autorização por item no `BreedResource` — permissão GLOBAL
  // basta (mesmo padrão de Perfil/CreateOrUpdatePerfil.tsx).
  const canSave = isEditing ? can('breeds_edit') : can('breeds_create');

  const breedMutation = useRequest({
    asyncFunction: tryPersistBreed,
    entityName: text.singularLabel,
    queryKey: queryKey.breeds.list,
    queryKey2: queryKey.breeds.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo: payload SEMPRE completo (create e
  // update) — `BreedRequest::rules()` exige `description`/`is_enabled`/
  // `specie_uuid` em ambos os verbos, sem suporte a PATCH parcial.
  async function tryPersistBreed(data: BreedFormType) {
    const payload: BreedPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid!.value,
    };

    if (isEditing && breedId) {
      return await updateBreed(breedId, payload);
    }
    return await createBreed(payload);
  }

  async function onSubmit(data: BreedFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await breedMutation.mutateAsync(data);
    }
  }

  const isSubmitting = breedMutation.isPending;

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Flex>
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="specie_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                error={errors.specie_uuid?.message as string | undefined}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave}
                // TASK-BREED-FORM-SELECT-PORTAL — mesmo fix de
                // FilterSideRacas.tsx (TASK-BREED-FILTER-FIX/-FIX-2): o menu
                // não-portalizado é recortado pelo container do form (último
                // campo antes do FormFooter). Portaliza no <body>, SEM
                // `position="fixed"` (essa prop é injetada no style do menu
                // INTERNO via SelectComponent.ts e forçaria o menu pra fora da
                // tela em modo portal — deixa no default "absolute").
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
