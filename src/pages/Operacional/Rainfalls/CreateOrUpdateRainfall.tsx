// src/pages/Operacional/Rainfalls/CreateOrUpdateRainfall.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PLUVIOMETRIA (Rainfall) — Operacional,
// execução 041, TASK-FE-041-PLV-03. Rotas: `/operacional/pluviometria/novo`
// (criação) e `/operacional/pluviometria/:rainfallUuid` (edição, GUID) —
// `/novo` declarada ANTES de `/:uuid` no router (mesma armadilha de
// `DeathAnimals`/`FeedlotYards`).
//
// Campos (contrato §4.2, mirror `FLD-004..013`):
//   - `user` — `InputReadOnly`, usuário autenticado (criar) ou `data.user.name`
//     (editar). NUNCA entra no payload (DIV-010, backend sempre sobrescreve).
//   - `date` — `Input type="date"`.
//   - `amount` — `KgInput` (`decimalPlaces=1`, `allowDot`), mm de Chuva.
//   - `areas` — `CheckboxListField` (Controller RHF), fonte `GET
//     /api/v1/areas/options` (`getAreasOptions()`, mirror EXATO
//     `harvestProduct-service.ts`).
//
// `fillRainfallForm` — Lei 2, guarda EXPLÍCITA `Object.keys(dirtyFields).length
// === 0` (NUNCA `isEmpty()`/`!isEmpty()` do utilitário mal-nomeado/INVERTIDO,
// `src/utils/isEmpty.ts` — landmine documentada em `DeathAnimals/
// CreateOrUpdateDeathAnimal.tsx` e `FeedlotYards/CreateOrUpdateFeedlotYard.tsx`
// já reproduzem os 2 sentidos possíveis do bug; este arquivo usa a forma
// explícita e inequívoca).
//
// PUT (edição) e POST (criação) enviam SEMPRE o payload COMPLETO
// (`date`+`amount`+`areas`) — decisão de contrato de backend (full-replace,
// `RainfallRequest::rules()` exige tudo sempre, sem `sometimes`;
// `UpdateRainfallAction::handle()` faz `sync()` completo de `areas`, sem
// suporte a atualização parcial). Correção UT-000317/F-058: o formato
// anterior (`PATCH` parcial por `dirtyFields`, Lei 2 genérica) fazia `areas`
// desaparecer do payload quando só `date`/`amount` eram alterados (`areas` é
// populado via `reset()` em `fillRainfallForm`, nunca fica "dirty"), causando
// erro "áreas obrigatórias" no backend mesmo com áreas marcadas na tela.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { KgInput } from '@/components/Form/kgInput';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { rainfallSchemaResolver } from '@/validations/schemas/Rainfalls/rainfall-schema';

import {
  createRainfall,
  getAreasOptions,
  updateRainfall,
} from '@/services/v2/Rainfalls/rainfall-service';

import type {
  CreateRainfallRequest,
  RainfallDetail,
  RainfallForm as RainfallFormType,
  UpdateRainfallRequest,
} from '@/@types/v2/Rainfalls';

import { useRainfallForm } from './useRainfalls';

const RAINFALLS_LIST_ROUTE = '/operacional/pluviometria';

export default function CreateOrUpdateRainfall() {
  const { rainfallUuid } = useParams<{ rainfallUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const text = languageGB.rainfalls.rainfall;
  const formText = text.form;
  const pickerText = formText.areasPicker;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(rainfallUuid);

  const canEdit = can('rainfall_edit');
  const canCreate = can('rainfall_create');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<RainfallFormType>({
    mode: 'onChange',
    resolver: rainfallSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      amount: '',
      areas: [],
    },
  });

  // `user` — readonly, NÃO é campo RHF. Só populado em edição via `fillRainfallForm`.
  const [userNameDisplay, setUserNameDisplay] = useState<string | null>(null);

  // Função NOMEADA, guarda EXPLÍCITA `Object.keys(dirtyFields).length === 0`
  // (ver nota de cabeçalho do arquivo — landmine do utilitário `isEmpty()`).
  function fillRainfallForm(data: RainfallDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      date: data.date,
      amount: data.amount,
      areas: (data.areas ?? []).map((area) => area.uuid),
    });

    setUserNameDisplay(data.user?.name ?? null);
  }

  const rainfallQuery = useRainfallForm({
    registrationId: isEditing ? rainfallUuid : undefined,
    fillForm: fillRainfallForm,
  });

  // ---- Lookup local de Áreas — `areas/options` é FLAT (sem paginação real,
  // D2 do plano de API), mirror EXATO `HarvestProduct/CreateOrUpdateHarvestProduct.tsx`. ----
  const areasQuery = useQuery({
    queryKey: [queryKey.rainfalls.rainfalls, 'areas-options'],
    queryFn: getAreasOptions,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [areasSearch, setAreasSearch] = useState('');

  const isLoading = isEditing && checkLoadingStatus([rainfallQuery as any]);

  const rainfallMutation = useRequest({
    asyncFunction: tryPersistRainfall,
    entityName: text.singularLabel,
    queryKey: queryKey.rainfalls.rainfalls,
    queryKey2: queryKey.rainfalls.rainfall,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistRainfall(data: RainfallFormType) {
    // Payload SEMPRE completo (create e update) — backend de Pluviometria é
    // full-replace (`RainfallRequest`/`UpdateRainfallAction`, sem
    // `sometimes`/atualização parcial). `user` NUNCA entra aqui (DIV-010).
    const payload: CreateRainfallRequest = {
      date: data.date,
      amount: Number(data.amount),
      areas: data.areas,
    };

    if (isEditing && rainfallUuid) {
      return updateRainfall(rainfallUuid, payload as UpdateRainfallRequest);
    }

    return createRainfall(payload);
  }

  // Guard `onSubmit`: sem campos sujos em edição → nada a salvar.
  async function onSubmit(data: RainfallFormType) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges) {
      navigate(-1);
      return;
    }
    await rainfallMutation.mutateAsync(data);
  }

  const isSubmitting = rainfallMutation.isPending;

  if (rainfallUuid && !isValidGuid(rainfallUuid)) {
    navigate(RAINFALLS_LIST_ROUTE, { replace: true });
    return null;
  }

  const displayUserName = isEditing ? (userNameDisplay ?? '') : (user?.username ?? '');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
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
              type="submit"
              form="rainfall-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="rainfall-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={formText.fields.date}
                error={errors.date?.message as string | undefined}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <KgInput
                name={field.name}
                label={formText.fields.amount}
                value={field.value ?? ''}
                // `??`, NUNCA `||` — `0` é índice de chuva legítimo.
                onChange={(_event, _masked, floatValue) => field.onChange(floatValue ?? null)}
                allowDot
                decimalPlaces={1}
                isRequired
                isReadOnly={!canSave}
                error={errors.amount?.message as string | undefined}
              />
            )}
          />

          <InputReadOnly
            label={formText.fields.user}
            value={displayUserName}
            loading={!!isLoading}
          />
        </SimpleGrid>

        {/* Áreas — `CheckboxListField` multi, NÃO `SelectAsyncPaginate isMulti`
            (componente canônico do projeto, mirror `BatchAreas/CreateBatchArea.tsx`). */}
        <Box mt={6}>
          <Controller
            name="areas"
            control={control}
            render={({ field: { value, onChange } }) => {
              const searchTerm = areasSearch.trim().toLowerCase();
              const options = areasQuery.data ?? [];
              const filteredOptions = searchTerm
                ? options.filter((area) => area.description.toLowerCase().includes(searchTerm))
                : options;
              const checklistItems: CheckboxListItem<string>[] = filteredOptions.map((area) => ({
                value: area.uuid,
                label: area.description,
              }));

              return (
                <>
                  <CheckboxListField<string>
                    label={formText.fields.areas}
                    items={checklistItems}
                    selectedValues={value}
                    onChange={onChange}
                    searchValue={areasSearch}
                    onSearchChange={setAreasSearch}
                    searchPlaceholder={pickerText.searchPlaceholder}
                    selectAllLabel={pickerText.selectAllLabel}
                    deselectAllLabel={pickerText.deselectAllLabel}
                    selectedCountLabel={pickerText.selectedCountLabel}
                    emptyLabel={pickerText.emptyLabel}
                    isLoading={areasQuery.isLoading}
                    isError={areasQuery.isError}
                    errorLabel={pickerText.errorLabel}
                    onRetry={() => areasQuery.refetch()}
                    retryLabel={pickerText.retryLabel}
                    isDisabled={!canSave || !!isLoading}
                  />
                  {errors.areas?.message && (
                    <Box mt={1} color="feedBack.errorMain" fontSize="sm">
                      {errors.areas.message as string}
                    </Box>
                  )}
                </>
              );
            }}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
