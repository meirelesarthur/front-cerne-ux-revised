// src/pages/BaseRegistrations/Troughs/CreateOrUpdateTrough.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Cocho (Trough) — Cadastros Base /
// Pecuários. Rotas: `/cadastros-base/cochos/novo` (criar) e
// `/cadastros-base/cochos/:uuid` (editar, GUID), já registradas em
// `router/index.tsx` (TASK-FE-2204, chokepoint de fundação) — guardadas por
// `troughs_view` na rota, `troughs_create`/`troughs_edit` no botão de salvar.
//
// 2 REGRAS DE UI (contrato de tela §3.1/§4, D-FE-1/D-FE-2 do gate):
//   1. Área XOR Módulo Pastejo — selecionar um LIMPA e DESABILITA o outro
//      (não só limpa — reforça visualmente a exclusividade, D-FE-2).
//   2. Curral — 3 estados no payload (Optional/null/uuid, contrato §9.3):
//      - Inalterado (nunca tocado) → `feedlot_corral_uuid` OMITIDO do payload.
//      - Selecionado um novo Curral → uuid no payload (`dirtyFields`).
//      - Botão "Remover vínculo" (só visível quando há Curral atual) → `null`
//        explícito. O `Select` de Curral é `noClearable` quando há um Curral
//        ORIGINAL (edição) — a única forma de desvincular é o botão
//        dedicado, nunca o "x" nativo do Select (mitigação do risco
//        documentado no contrato: "limpar" um Select comum pensando em
//        desvincular, na prática, não mudaria nada — `Optional ≠ null`).
//
// ⚠️ NÃO usa `useRequest` — mesma razão já documentada em
// `Grazings/CreateOrUpdateGrazing.tsx`: os 2 erros 422 de negócio (D1 —
// exclusividade Área×Módulo; D-CURRAL-1 — Curral já ocupado) precisam de
// `setError` dedicado PERTO do campo certo (`area_uuid`/`feedlot_corral_uuid`,
// chaves confirmadas por leitura direta do backend — `TroughRequest`/
// `FeedlotCorralAvailableForFarmRule`), não um toast genérico solto.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { troughTypeOptions } from '@/constants/Trough/options/trough-type-options';

import { troughSchemaResolver } from '@/validations/schemas/BaseRegistrations/troughs-schema';

import { createTrough, updateTrough } from '@/services/v2/BaseRegistrations/troughs-service';

import type { Option } from '@/@types/option';
import type {
  TroughData,
  TroughForm as TroughFormType,
  TroughPayload,
  TroughType,
} from '@/@types/v2/BaseRegistrations/troughs';

import { useTroughForm, useTroughOptions } from './useTroughs';

export default function CreateOrUpdateTrough() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const text = languageGB.baseRegistrations.trough;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('troughs_edit') : can('troughs_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<TroughFormType>({
    mode: 'onChange',
    resolver: troughSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      type: '',
      description: '',
      total_area: '',
      area_uuid: null,
      grazing_uuid: null,
      feedlot_corral_uuid: null,
      is_enabled: true,
    },
  });

  const areaUuidValue = useWatch({ control, name: 'area_uuid' });
  const grazingUuidValue = useWatch({ control, name: 'grazing_uuid' });
  const feedlotCorralUuidValue = useWatch({ control, name: 'feedlot_corral_uuid' });

  // Curral — vínculo ORIGINAL (o que o registro TINHA ao carregar, contrato
  // §4) — só ele decide se o botão "Remover vínculo" existe e se o `Select`
  // fica `noClearable`. `removedFeedlotCorral` é a ação EXPLÍCITA do botão —
  // distinta de "nunca tocou" (payload omite a chave) e de "selecionou
  // outro" (`dirtyFields` cobre esse caso).
  const [originalFeedlotCorralUuid, setOriginalFeedlotCorralUuid] = useState<string | null>(null);
  const [removedFeedlotCorral, setRemovedFeedlotCorral] = useState(false);
  const hasOriginalFeedlotCorralLink = originalFeedlotCorralUuid !== null;

  function fillForm(data: TroughData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        code: data.code,
        type: data.type,
        description: data.description,
        total_area: data.total_area,
        area_uuid: data.area?.uuid ?? null,
        grazing_uuid: data.grazing?.uuid ?? null,
        feedlot_corral_uuid: data.feedlot_corral?.uuid ?? null,
        is_enabled: !!data.is_enabled,
      });
      setOriginalFeedlotCorralUuid(data.feedlot_corral?.uuid ?? null);
      setRemovedFeedlotCorral(false);
    }
  }

  const troughQuery = useTroughForm({
    registrationId: isEditing ? uuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([troughQuery as any]);
  const troughData = (troughQuery as any)?.data as TroughData | undefined;

  // 1 única chamada agregadora (contrato de API §6/D4) — `currentTroughUuid`
  // SÓ em edição, mantém visível o Curral hoje vinculado a ESTE Cocho.
  const {
    isLoading: isLoadingOptions,
    areaOptions,
    grazingOptions,
    feedlotCorralOptions,
  } = useTroughOptions(isEditing ? uuid : undefined);

  const typeOptions = troughTypeOptions.options(languageGB);
  const activeOptions: Option<boolean>[] = [
    { value: true, label: text.activeOptions.yes },
    { value: false, label: text.activeOptions.no },
  ];

  // Regra de UI — Área XOR Módulo Pastejo (contrato §3.1, D-FE-2 do gate):
  // selecionar um LIMPA e DESABILITA o outro.
  function handleAreaChange(option: Option<string> | null) {
    setValue('area_uuid', option?.value ?? null, { shouldDirty: true });
    if (option?.value) {
      setValue('grazing_uuid', null, { shouldDirty: true });
    }
  }

  function handleGrazingChange(option: Option<string> | null) {
    setValue('grazing_uuid', option?.value ?? null, { shouldDirty: true });
    if (option?.value) {
      setValue('area_uuid', null, { shouldDirty: true });
    }
  }

  // Selecionar um Curral é sempre uma associação/troca — nunca uma remoção
  // (a remoção só existe via o botão dedicado abaixo).
  function handleFeedlotCorralChange(option: Option<string> | null) {
    setValue('feedlot_corral_uuid', option?.value ?? null, { shouldDirty: true });
    setRemovedFeedlotCorral(false);
  }

  // Ação EXPLÍCITA (contrato §4/D-FE-1) — a ÚNICA forma de desvincular de
  // verdade. Zera o campo no form (a UI mostra "Nenhum") e marca a intenção
  // para o payload enviar `null` explícito (não a mera ausência da chave).
  function handleRemoveFeedlotCorral() {
    setValue('feedlot_corral_uuid', null, { shouldDirty: true });
    setRemovedFeedlotCorral(true);
  }

  async function tryPersistTrough(data: TroughFormType) {
    // Payload SEMPRE completo (contrato de tela §3 — `TroughRequest` não
    // diferencia por verbo além de `required`→`sometimes`) — EXCETO
    // `feedlot_corral_uuid`, o ÚNICO campo com semântica de 3 estados.
    const payload: TroughPayload = {
      description: data.description.trim(),
      type: data.type as TroughType,
      total_area: Number(data.total_area),
      is_enabled: !!data.is_enabled,
      area_uuid: data.area_uuid || null,
      grazing_uuid: data.grazing_uuid || null,
    };

    if (removedFeedlotCorral) {
      // Ação explícita do botão — desvincula de verdade.
      payload.feedlot_corral_uuid = null;
    } else if (dirtyFields.feedlot_corral_uuid) {
      // Usuário selecionou um Curral diferente do que carregou.
      payload.feedlot_corral_uuid = data.feedlot_corral_uuid;
    }
    // else: chave OMITIDA — nunca tocado, mantém o vínculo atual (Optional).

    if (isEditing && uuid) {
      return await updateTrough(uuid, payload);
    }
    return await createTrough(payload);
  }

  // `useMutation` DIRETO — ver nota de cabeçalho do arquivo: os 2 erros 422
  // de negócio (exclusividade Área×Módulo em `area_uuid`; Curral ocupado em
  // `feedlot_corral_uuid`) precisam de `setError` dedicado perto do campo,
  // não um toast genérico.
  const troughMutation = useMutation({
    mutationFn: tryPersistTrough,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.troughs.troughsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.troughs.trough] });
      // Revalida o agregador de opções — um Curral recém-associado/
      // desvinculado por ESTE Cocho não pode continuar aparecendo
      // desatualizado no combo (contrato de API §6).
      queryClient.invalidateQueries({ queryKey: [queryKey.troughs.options] });

      toaster.success({
        title: text.singularLabel,
        description: `${text.singularLabel} ${
          isEditing
            ? languageGB.defaltStrings.updateRegister
            : languageGB.defaltStrings.createRegister
        }`,
        duration: 7000,
      });

      navigate(-1);
    },
    onError: (error) => {
      console.error('Trough persist - error:', error);

      if (isAxiosError(error) && error.response?.status === 422) {
        const resData = error.response.data as { errors?: Record<string, string[]> };

        // D1 do gate — exclusividade Área×Módulo Pastejo (chave confirmada
        // por leitura direta de `TroughRequest::withValidator()`).
        const areaError = resData?.errors?.area_uuid;
        if (areaError && areaError.length > 0) {
          setError('area_uuid', { type: 'server', message: areaError[0] });
          return;
        }

        // D-CURRAL-1 do gate — Curral já ocupado por outro cocho/bebedouro
        // (chave = nome do atributo validado por
        // `FeedlotCorralAvailableForFarmRule`, confirmado por leitura direta).
        const feedlotCorralError = resData?.errors?.feedlot_corral_uuid;
        if (feedlotCorralError && feedlotCorralError.length > 0) {
          setError('feedlot_corral_uuid', { type: 'server', message: feedlotCorralError[0] });
          return;
        }
      }

      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isSubmitting = troughMutation.isPending;

  // Guard de `onSubmit` — tabela-verdade validada (mirror
  // `Grazings/CreateOrUpdateGrazing.tsx`): (1) editar COM alteração → salva;
  // (2) editar SEM alteração → só navega; (3) criar → sempre salva.
  async function onSubmit(data: TroughFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0 && !removedFeedlotCorral) {
      navigate(-1);
      return;
    }
    await troughMutation.mutateAsync(data);
  }

  const showRemoveFeedlotCorralButton = hasOriginalFeedlotCorralLink && !!feedlotCorralUuidValue;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
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
              type="submit"
              form="trough-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form id="trough-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* `code` — readonly, SÓ em edição (server-gerado, nunca no payload). */}
        {isEditing && troughData?.code && (
          <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
            <Input
              label={text.form.fields.code}
              value={troughData.code}
              readOnly
              disabled
              helperText={text.form.hints.codeGenerated}
              loading={isLoading}
            />
          </SimpleGrid>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                placeholder={text.form.placeholders.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<TroughType> | null) =>
                  setValue('type', option?.value ?? '', { shouldDirty: true })
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
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            type="number"
            step="0.01"
            label={text.form.fields.totalArea}
            placeholder={text.form.placeholders.totalArea}
            {...register('total_area')}
            error={errors.total_area?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.active}
                name={name}
                value={activeOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<boolean> | null) =>
                  setValue('is_enabled', !!option?.value, { shouldDirty: true })
                }
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

        {/* Trio de localização — Módulo Pastejo / Área (XOR client-side,
            contrato §3.1) / Curral (3 estados, contrato §4). Mesma anatomia
            de `DrinkingFountains/CreateOrUpdateDrinkingFountain.tsx` — hint
            de exclusividade ACIMA do grid (fora das células) para as 3
            colunas ficarem com a mesma altura, e o botão "Remover vínculo"
            embaixo do Select do Curral (não ao lado), evitando `align=
            "flex-end"` esticar a célula com o `SimpleGrid` (align-items:
            stretch por padrão). */}
        <Box mt={6}>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            {text.form.hints.locationExclusive}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="grazing_uuid"
              control={control}
              render={({ field: { name }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.grazing}
                  placeholder={text.form.placeholders.grazing}
                  name={name}
                  value={grazingOptions.find((option) => option.value === grazingUuidValue) ?? null}
                  onChange={handleGrazingChange}
                  options={grazingOptions}
                  error={error?.message}
                  isDisabled={!canSave || !!areaUuidValue}
                  loading={isLoading || isLoadingOptions}
                />
              )}
            />

            <Controller
              name="area_uuid"
              control={control}
              render={({ field: { name }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.area}
                  placeholder={text.form.placeholders.area}
                  name={name}
                  value={areaOptions.find((option) => option.value === areaUuidValue) ?? null}
                  onChange={handleAreaChange}
                  options={areaOptions}
                  error={error?.message}
                  isDisabled={!canSave || !!grazingUuidValue}
                  loading={isLoading || isLoadingOptions}
                />
              )}
            />

            <Box>
              <Controller
                name="feedlot_corral_uuid"
                control={control}
                render={({ field: { name }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.feedlotCorral}
                    placeholder={text.form.placeholders.feedlotCorral}
                    tooltip={
                      hasOriginalFeedlotCorralLink ? text.form.hints.feedlotCorralKeep : undefined
                    }
                    name={name}
                    value={
                      feedlotCorralOptions.find(
                        (option) => option.value === feedlotCorralUuidValue
                      ) ?? null
                    }
                    onChange={handleFeedlotCorralChange}
                    options={feedlotCorralOptions}
                    error={error?.message}
                    // `noClearable` quando há vínculo ORIGINAL — a ÚNICA
                    // forma de desvincular é o botão dedicado (contrato §4).
                    noClearable={hasOriginalFeedlotCorralLink}
                    isDisabled={!canSave}
                    loading={isLoading || isLoadingOptions}
                  />
                )}
              />
              {showRemoveFeedlotCorralButton && canSave && (
                <Flex justify="flex-end" mt={2}>
                  <Button
                    title={text.form.actions.removeFeedlotCorral}
                    variant="ghost"
                    size="xs"
                    type="button"
                    onClick={handleRemoveFeedlotCorral}
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
