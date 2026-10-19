// src/pages/CadastrosBase/CausaMortePerda/CreateOrUpdateCausaMortePerda.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CAUSA MORTE/PERDA (mesmo arquivo para os
// dois casos). Rotas: /cadastros-base/causa-morte-perda/novo (criar) e
// /cadastros-base/causa-morte-perda/:deathLossId (editar, GUID) — ambas
// registradas em src/router/index.tsx (TASK-FE-052), guardadas por
// `death_loss_view` (autorização real de create/edit é 403 do backend).
//
// Estrutura é a INTERSEÇÃO de `Racas/CreateOrUpdateRaca.tsx` (Switch +
// SelectAsyncPaginate de Espécie, payload sempre completo, guard GUID) e
// `MotivosBaixa/CreateOrUpdateMotivoBaixa.tsx` (Select nativo de enum 2
// valores, mesmo padrão de `do_movement`, aplicado aqui a `cause`).
//
// `DeathLossRequest::rules()` NÃO diferencia store/update — payload SEMPRE
// completo (mesma nota de `CreateOrUpdateRaca.tsx`: nunca montar um PATCH
// parcial de `dirtyFields`).
//
// Select de Espécie (`specie_uuid`) consome `listSpecies` — o MESMO endpoint
// `/species` usado por `Racas`, gateado por `specie_view` (GAP-BE-040, já
// tracked como sistêmico — `Species←DeathLoss` herda o mesmo comportamento,
// não é um bug novo desta Tarefa).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
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

import { createDeathLoss, updateDeathLoss } from '@/services/v2/DeathLosses/death-loss-service';
import { listSpecies } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type {
  DeathLossCauseValue,
  DeathLossData,
  DeathLossForm as DeathLossFormType,
  DeathLossPayload,
} from '@/@types/v2/DeathLosses';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

import { deathLossSchemaResolver } from './death-loss-schema';
import { useDeathLossForm } from './useDeathLosses';

export default function CreateOrUpdateCausaMortePerda() {
  const { deathLossId } = useParams<{ deathLossId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:deathLossId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(deathLossId);

  // Guard de navegação: um `deathLossId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de query
  // nem renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de `CreateOrUpdateRaca.tsx`.
  useEffect(() => {
    if (deathLossId && !isValidGuid(deathLossId)) {
      navigate('/cadastros-base/causa-morte-perda', { replace: true });
    }
  }, [deathLossId, navigate]);

  const text = languageGB.deathLosses.deathLoss;

  const causeOptions: Option<DeathLossCauseValue>[] = [
    { value: 'M', label: text.form.fields.causeOptions.death },
    { value: 'P', label: text.form.fields.causeOptions.loss },
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<DeathLossFormType>({
    mode: 'onChange',
    resolver: deathLossSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
      cause: null,
    },
  });

  function fillForm(data: DeathLossData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
        cause: {
          label:
            data.cause === 'M'
              ? text.form.fields.causeOptions.death
              : text.form.fields.causeOptions.loss,
          value: data.cause,
        },
      });
    }
  }

  const deathLossQuery = useDeathLossForm({
    registrationId: isEditing ? deathLossId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([deathLossQuery as any]);

  // Sem flags de autorização por item no `DeathLossResource` — permissão
  // GLOBAL basta (mesmo padrão de Racas/Perfil).
  const canSave = isEditing ? can('death_loss_edit') : can('death_loss_create');

  const deathLossMutation = useRequest({
    asyncFunction: tryPersistDeathLoss,
    entityName: text.singularLabel,
    queryKey: queryKey.deathLosses.list,
    queryKey2: queryKey.deathLosses.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo: payload SEMPRE completo (create e
  // update) — `DeathLossRequest::rules()` exige `description`/`is_enabled`/
  // `specie_uuid`/`cause` em ambos os verbos, sem suporte a PATCH parcial.
  async function tryPersistDeathLoss(data: DeathLossFormType) {
    const payload: DeathLossPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid!.value,
      cause: data.cause!.value,
    };

    if (isEditing && deathLossId) {
      return await updateDeathLoss(deathLossId, payload);
    }
    return await createDeathLoss(payload);
  }

  async function onSubmit(data: DeathLossFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await deathLossMutation.mutateAsync(data);
    }
  }

  const isSubmitting = deathLossMutation.isPending;

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
            helperText={errors.description?.message ? undefined : `${descriptionLength}/191`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="cause"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.cause}
                placeholder={text.form.placeholders.cause}
                name={name}
                value={causeOptions.find((option) => option.value === value?.value) ?? null}
                onChange={onChange}
                options={causeOptions}
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
                // Mesmo fix de `CreateOrUpdateRaca.tsx` (TASK-BREED-FORM-SELECT-
                // PORTAL): o menu não-portalizado é recortado pelo container do
                // form. Portaliza no <body>, SEM `position="fixed"` na prop raiz.
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
