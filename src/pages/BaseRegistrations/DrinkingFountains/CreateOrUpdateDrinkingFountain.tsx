// src/pages/BaseRegistrations/DrinkingFountains/CreateOrUpdateDrinkingFountain.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/edição de Bebedouro (DrinkingFountain) — Cadastros
// Base / Pecuários. Execução 029, TASK-FE-2302. DELTA sobre
// `contrato-fe-cochos.md §3/§4` (contrato-fe-bebedouros.md §3): rótulo
// "Volume (L)" (mesma coluna física `total_area`) + campo extra opcional
// "Comprimento (cm)" (`length`, que Cochos NÃO tem). As 2 regras de UI
// delicadas são IDÊNTICAS a Cochos:
//   1. Área XOR Módulo Pastejo — selecionar um limpa/desabilita o outro
//      (client-side, `useWatch` + `setValue` + `isDisabled`).
//   2. Curral — semântica de 3 estados via `dirtyFields.feedlot_corral_uuid`
//      (RHF): campo intocado → OMITIDO do payload (mantém o vínculo atual);
//      selecionado novo Curral → uuid no payload; botão explícito "Remover
//      vínculo" (só visível quando há Curral atual) → seta o campo para
//      `null`, que também fica `dirty` → `null` explícito no payload
//      (desvincula). Nenhum estado local extra: o próprio mecanismo de
//      `dirtyFields` do RHF já resolve os 3 estados, porque `defaultValues.
//      feedlot_corral_uuid` é preenchido com o vínculo ATUAL na edição.
//
// `useMutation` DIRETO (não `useRequest`, mirror `Grazings/
// CreateOrUpdateGrazing.tsx`) — os 3 pontos de 422 de negócio (XOR Área×
// Módulo, Curral ocupado, `length` inválido) precisam de `setError` perto do
// campo certo, não um toast genérico solto.
//
// i18n SEM alias (protocolo v2) — caminho completo
// `languageGB.baseRegistrations.drinkingFountain...` inline.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { drinkingFountainSchemaResolver } from '@/validations/schemas/BaseRegistrations/drinkingFountains-schema';

import {
  createDrinkingFountain,
  getDrinkingFountainByUuid,
  updateDrinkingFountain,
} from '@/services/v2/BaseRegistrations/drinking-fountains-service';

import type { Option } from '@/@types/option';
import type {
  DrinkingFountainData,
  DrinkingFountainForm as DrinkingFountainFormType,
  DrinkingFountainPayload,
  DrinkingFountainType,
} from '@/@types/v2/BaseRegistrations/drinking-fountains';

import { useDrinkingFountainOptions } from './useDrinkingFountains';

// Campos que a API pode devolver em `errors` (422) — usados para rotear a
// 1ª mensagem específica para o `setError` do campo certo (XOR Área×Módulo,
// Curral ocupado, `length` inválido).
const KNOWN_FIELD_ERRORS: Array<keyof DrinkingFountainFormType> = [
  'type',
  'description',
  'total_area',
  'length',
  'area_uuid',
  'grazing_uuid',
  'feedlot_corral_uuid',
  'is_enabled',
];

export default function CreateOrUpdateDrinkingFountain() {
  // Rota registrada como `/cadastros-base/bebedouros/:uuid` (TASK-FE-2304,
  // `router/index.tsx`) — o parâmetro de rota chama-se `uuid` (mesmo nome que
  // o backend lê em `DrinkingFountainRequest::resolveCurrentCorralUuid()`).
  const { uuid: drinkingFountainId } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(drinkingFountainId);
  const canSave = isEditing ? can('drinking-fountains_edit') : can('drinking-fountains_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<DrinkingFountainFormType>({
    mode: 'onChange',
    resolver: drinkingFountainSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      type: '',
      description: '',
      total_area: null,
      length: null,
      area_uuid: null,
      grazing_uuid: null,
      feedlot_corral_uuid: null,
      is_enabled: true,
    },
  });

  function fillForm(data: DrinkingFountainData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        type: data.type,
        description: data.description,
        total_area: data.total_area,
        length: data.length,
        area_uuid: data.area?.uuid ?? null,
        grazing_uuid: data.grazing?.uuid ?? null,
        feedlot_corral_uuid: data.feedlot_corral?.uuid ?? null,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const drinkingFountainQuery = useCustomFormQueryByGuid<DrinkingFountainData>({
    registrationId: isEditing ? drinkingFountainId : undefined,
    queryKey: queryKey.drinkingFountains.drinkingFountain,
    asyncFunction: getDrinkingFountainByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([drinkingFountainQuery as any]);
  const drinkingFountainData = (drinkingFountainQuery as any)?.data as
    DrinkingFountainData | undefined;

  // Endpoint agregador (contrato de API §6) — 1 única chamada para Área +
  // Módulo Pastejo + Curral. Em edição, `drinking_fountain_uuid` mantém
  // visível o Curral HOJE vinculado a ESTE Bebedouro.
  const {
    isLoading: isOptionsLoading,
    areaOptions,
    grazingOptions,
    feedlotCorralOptions,
  } = useDrinkingFountainOptions(isEditing ? drinkingFountainId : undefined);

  // ---- Regra de UI 1 — Área XOR Módulo Pastejo ----------------------------
  const areaValue = useWatch({ control, name: 'area_uuid' });
  const grazingValue = useWatch({ control, name: 'grazing_uuid' });

  // ---- Regra de UI 2 — Curral: botão "Remover vínculo" --------------------
  const feedlotCorralValue = useWatch({ control, name: 'feedlot_corral_uuid' });
  const hasCurrentFeedlotCorral = isEditing && !!drinkingFountainData?.feedlot_corral;
  const showRemoveFeedlotCorralButton = hasCurrentFeedlotCorral && !!feedlotCorralValue;

  async function tryPersistDrinkingFountain(data: DrinkingFountainFormType) {
    // Payload SEMPRE completo (mirror `updateGrazing`/`updateTrough`,
    // `DrinkingFountainRequest` não diferencia por verbo além de
    // `required`→`sometimes`) — EXCETO `feedlot_corral_uuid` abaixo.
    const payload: DrinkingFountainPayload = {
      description: data.description.trim(),
      type: data.type as DrinkingFountainType,
      total_area: data.total_area as number,
      length: data.length ?? null,
      is_enabled: !!data.is_enabled,
      area_uuid: data.area_uuid ?? null,
      grazing_uuid: data.grazing_uuid ?? null,
    };

    // `feedlot_corral_uuid` — Optional DE VERDADE (contrato de API §9.3):
    // só entra no payload quando o RHF confirma que o campo foi TOCADO
    // (seleção nova OU botão "Remover vínculo", que seta `null`) — campo
    // intocado nunca aparece, preservando o vínculo atual em edição.
    if (dirtyFields.feedlot_corral_uuid) {
      payload.feedlot_corral_uuid = data.feedlot_corral_uuid ?? null;
    }

    if (isEditing && drinkingFountainId) {
      return await updateDrinkingFountain(drinkingFountainId, payload);
    }
    return await createDrinkingFountain(payload);
  }

  const drinkingFountainMutation = useMutation({
    mutationFn: tryPersistDrinkingFountain,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.drinkingFountains.drinkingFountainsList],
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.drinkingFountains.drinkingFountain] });
      // Currais recém-ocupados/desocupados por este salvamento não devem
      // continuar aparecendo desatualizados no combo (mirror
      // `contrato-fe-cochos.md §6`).
      queryClient.invalidateQueries({ queryKey: [queryKey.drinkingFountains.options] });

      toaster.success({
        title: languageGB.baseRegistrations.drinkingFountain.singularLabel,
        description: `${languageGB.baseRegistrations.drinkingFountain.singularLabel} ${
          isEditing
            ? languageGB.defaltStrings.updateRegister
            : languageGB.defaltStrings.createRegister
        }`,
        duration: 7000,
      });

      navigate(-1);
    },
    onError: (error) => {
      console.error('DrinkingFountain persist - error:', error);

      // 422 de negócio (XOR Área×Módulo em `area_uuid`, Curral ocupado em
      // `feedlot_corral_uuid`, `length` inválido) — exibido PERTO do campo
      // certo via `setError`, nunca escondido atrás de um toast genérico.
      if (isAxiosError(error) && error.response?.status === 422) {
        const resData = error.response.data as { errors?: Record<string, string[]> };
        const fieldErrors = resData?.errors;

        if (fieldErrors) {
          for (const fieldName of KNOWN_FIELD_ERRORS) {
            const messages = fieldErrors[fieldName as string];
            if (messages && messages.length > 0) {
              setError(fieldName, { type: 'server', message: messages[0] });
              return;
            }
          }
        }
      }

      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: languageGB.baseRegistrations.drinkingFountain.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isSubmitting = drinkingFountainMutation.isPending;

  // Guard EXPLÍCITA (mirror `Grazings/CreateOrUpdateGrazing.tsx`): (1) editar
  // COM alteração → salva; (2) editar SEM alteração → só navega; (3) criar
  // → sempre salva.
  async function onSubmit(data: DrinkingFountainFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await drinkingFountainMutation.mutateAsync(data);
  }

  const typeOptions: Option<DrinkingFountainType>[] = [
    { value: 'A', label: languageGB.baseRegistrations.drinkingFountain.typeOptions.covered },
    { value: 'B', label: languageGB.baseRegistrations.drinkingFountain.typeOptions.uncovered },
  ];

  const activeOptions: Option<boolean>[] = [
    { value: true, label: languageGB.baseRegistrations.drinkingFountain.activeOptions.yes },
    { value: false, label: languageGB.baseRegistrations.drinkingFountain.activeOptions.no },
  ];

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.baseRegistrations.drinkingFountain.form.title.edit
          : languageGB.baseRegistrations.drinkingFountain.form.title.create
      }
      subtitle={
        isEditing
          ? languageGB.baseRegistrations.drinkingFountain.form.subtitle.edit
          : languageGB.baseRegistrations.drinkingFountain.form.subtitle.create
      }
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
        {/* `code` — readonly, SÓ em edição (server-gerado, sem prévia no
            create, contrato de API §11, mirror `Grazings/
            CreateOrUpdateGrazing.tsx`). */}
        {isEditing && drinkingFountainData?.code && (
          <Box mb={6}>
            <Input
              label={languageGB.baseRegistrations.drinkingFountain.form.fields.code}
              value={drinkingFountainData.code}
              readOnly
              disabled
              helperText={languageGB.baseRegistrations.drinkingFountain.form.hints.codeGenerated}
              loading={isLoading}
            />
          </Box>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={languageGB.baseRegistrations.drinkingFountain.form.fields.type}
                placeholder={languageGB.baseRegistrations.drinkingFountain.form.placeholders.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<DrinkingFountainType> | null) =>
                  onChange(option?.value ?? '')
                }
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={languageGB.baseRegistrations.drinkingFountain.form.fields.description}
            placeholder={
              languageGB.baseRegistrations.drinkingFountain.form.placeholders.description
            }
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="total_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={languageGB.baseRegistrations.drinkingFountain.form.fields.totalArea}
                placeholder={
                  languageGB.baseRegistrations.drinkingFountain.form.placeholders.totalArea
                }
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                isRequired
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          {/* "Comprimento (cm)" — OPCIONAL, campo que Cochos NÃO tem (D5-BEB).
              Ausência não é erro — omite/`null` no payload sem bloquear o
              submit. */}
          <Controller
            name="length"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={languageGB.baseRegistrations.drinkingFountain.form.fields.length}
                placeholder={languageGB.baseRegistrations.drinkingFountain.form.placeholders.length}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={languageGB.baseRegistrations.drinkingFountain.form.fields.active}
                name={name}
                value={activeOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<boolean> | null) => onChange(!!option?.value)}
                options={activeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Trio de localização — Área XOR Módulo Pastejo (regra de UI 1) +
            Curral (regra de UI 2). Mesma anatomia de
            `contrato-fe-cochos.md §3/§4`. */}
        <Box mt={6}>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            {languageGB.baseRegistrations.drinkingFountain.form.hints.locationExclusive}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="grazing_uuid"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={languageGB.baseRegistrations.drinkingFountain.form.fields.grazing}
                  placeholder={
                    languageGB.baseRegistrations.drinkingFountain.form.placeholders.grazing
                  }
                  name={name}
                  value={grazingOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<string> | null) => {
                    onChange(option?.value ?? null);
                    if (option?.value) {
                      setValue('area_uuid', null, { shouldDirty: true });
                    }
                  }}
                  options={grazingOptions}
                  error={error?.message}
                  isDisabled={!canSave || !!areaValue}
                  loading={isOptionsLoading}
                />
              )}
            />

            <Controller
              name="area_uuid"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={languageGB.baseRegistrations.drinkingFountain.form.fields.area}
                  placeholder={languageGB.baseRegistrations.drinkingFountain.form.placeholders.area}
                  name={name}
                  value={areaOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<string> | null) => {
                    onChange(option?.value ?? null);
                    if (option?.value) {
                      setValue('grazing_uuid', null, { shouldDirty: true });
                    }
                  }}
                  options={areaOptions}
                  error={error?.message}
                  isDisabled={!canSave || !!grazingValue}
                  loading={isOptionsLoading}
                />
              )}
            />

            <Box>
              <Controller
                name="feedlot_corral_uuid"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={languageGB.baseRegistrations.drinkingFountain.form.fields.feedlotCorral}
                    placeholder={
                      languageGB.baseRegistrations.drinkingFountain.form.placeholders.feedlotCorral
                    }
                    tooltip={
                      languageGB.baseRegistrations.drinkingFountain.form.hints.feedlotCorralKeep
                    }
                    name={name}
                    value={feedlotCorralOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={feedlotCorralOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isOptionsLoading}
                  />
                )}
              />
              {showRemoveFeedlotCorralButton && canSave && (
                <Flex justify="flex-end" mt={2}>
                  <Button
                    title={
                      languageGB.baseRegistrations.drinkingFountain.form.actions.removeFeedlotCorral
                    }
                    variant="ghost"
                    size="xs"
                    type="button"
                    onClick={() => setValue('feedlot_corral_uuid', null, { shouldDirty: true })}
                  />
                </Flex>
              )}
            </Box>
          </SimpleGrid>
        </Box>
      </Form>
    </FormContainer>
  );
}
