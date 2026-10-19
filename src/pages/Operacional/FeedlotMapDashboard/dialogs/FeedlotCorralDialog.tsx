// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar/Duplicar Curral (FeedlotCorral) do Mapa de
// Confinamento — TASK-FE-042-206. 13 campos (`FM015-027`): `identification`
// (readonly, só em editar), `name`, `installation_type`, `status` (só em
// criar/duplicar — `prohibited` no PUT), `width`/`length`, `total_area`
// (derivado, preview), `capacity`, `coverage`/`floor`/`shading`,
// `trough_uuid`/`drinking_fountain_uuid` (via `GET .../options`, inclui o
// vínculo atual em editar/duplicar — `corral_uuid` repassado).
//
// Duplicar (`AM06`) usa o MESMO diálogo/endpoint `store` — abre com os
// campos visíveis pré-preenchidos, `identification` ausente, NUNCA reenvia
// `uuid`.
//
// 2 sub-modais empilhados (Model C.5, `S010`/`S011`): "+" ao lado dos
// selects de cocho/bebedouro abre `InlineTroughModal`/
// `InlineDrinkingFountainModal`; ao salvar, `onCreated` popula a lista LOCAL
// (sem novo fetch) e seleciona a opção nova, sem fechar este diálogo.
//
// `available_at`/`note` — ADITIVO (TASK-063-CUR-01, roteiro F-035 Currais,
// execução 063). Condicionais no CREATE (`requiresStatusDetail`, mirror
// EXATO de `StepIdentificacaoSituacao.tsx`) quando `status` ∈ {Vazio
// Sanitário, Limpeza, Manutenção, Interditado} = `FEEDLOT_CORRAL_STATUS_
// DETAIL_REQUIRED` — sem alterar/duplicar esse conjunto. Sem step de edição
// de situação neste diálogo (`isEditing` esconde `status`) — corrige o
// 422/500 ao criar com status restrito sem esses 2 campos.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Dialog, IconButton, Portal, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { FEEDLOT_CORRAL_DIMENSION_MAX } from '@/constants/FeedlotCorrals/feedlot-corral-dimension-max';
import { queryKey } from '@/constants/query-key';

import { feedlotCorralSchemaResolver } from '@/validations/schemas/FeedlotCorrals/feedlotCorral-schema';
import { requiresStatusDetail } from '@/validations/schemas/FeedlotCorrals/feedlotCorralWizard-schema';

import {
  createFeedlotCorral,
  getFeedlotCorral,
  getFeedlotCorralOptions,
  updateFeedlotCorral,
} from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotCorralRequest,
  FeedlotCorralDetail,
  FeedlotCorralForm as FeedlotCorralFormType,
  FeedlotCorralResourceRef,
  UpdateFeedlotCorralRequest,
} from '@/@types/v2/FeedlotCorrals';

import { InlineDrinkingFountainModal } from './InlineDrinkingFountainModal';
import { InlineTroughModal } from './InlineTroughModal';

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function refToOption(ref: FeedlotCorralResourceRef | null): Option<string> | null {
  return ref ? { label: ref.description, value: ref.uuid } : null;
}

const EMPTY_VALUES: FeedlotCorralFormType = {
  name: '',
  installation_type: null,
  status: null,
  available_at: null,
  note: '',
  width: '',
  length: '',
  capacity: '',
  coverage: null,
  floor: null,
  shading: null,
  trough_uuid: null,
  drinking_fountain_uuid: null,
};

export interface FeedlotCorralDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  sectorUuid?: string;
  mode?: 'create' | 'edit' | 'duplicate';
  onClose: () => void;
}

export function FeedlotCorralDialog({
  isOpen,
  targetUuid,
  sectorUuid,
  mode,
  onClose,
}: FeedlotCorralDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.corral;
  // TASK-063-CUR-01 — mesmos rótulos/mensagens de `available_at`/`note` já
  // usados por `StepIdentificacaoSituacao.tsx`/`FeedlotCorralStatusDialog.tsx`
  // (sem cópia divergente).
  const statusFieldsText = languageGB.feedlotMap.feedlotMap.status.fields;
  const queryClient = useQueryClient();

  const isEditing = mode === 'edit' && isValidGuid(targetUuid);
  const isDuplicating = mode === 'duplicate' && isValidGuid(targetUuid);
  const isCreate = !isEditing && !isDuplicating;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedlotCorralFormType>({
    mode: 'onChange',
    resolver: feedlotCorralSchemaResolver(languageGB, !isEditing) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const optionsQuery = useQuery({
    // `isEditing` entra na key (TASK-063-MAPA2-05) — `isCreate` sozinho não
    // distingue edit/duplicate (ambos `false`), e a query agora depende do
    // valor de `isEditing` para decidir o parâmetro enviado à API.
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-options', targetUuid, isCreate, isEditing],
    queryFn: async () => {
      // TASK-063-MAPA2-05 — só em EDITAR o próprio curral deve ser enviado
      // como exceção de vínculo 1:1. Em DUPLICAR, `targetUuid` é o curral de
      // ORIGEM (sendo copiado, não editado) — mandar esse uuid fazia a API
      // reincluir como "disponível" o cocho/bebedouro que já pertence à
      // origem, quando, do ponto de vista do curral NOVO, esse item está
      // vinculado a outro curral (mesma regra do create puro).
      const response = await getFeedlotCorralOptions(isEditing ? targetUuid : undefined);
      return response.data;
    },
    enabled: isOpen,
  });

  const detailQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-detail', targetUuid],
    queryFn: async () => {
      const response = await getFeedlotCorral(targetUuid as string);
      return response.data;
    },
    enabled: isOpen && (isEditing || isDuplicating),
  });

  const [troughList, setTroughList] = useState<FeedlotCorralResourceRef[]>([]);
  const [drinkingFountainList, setDrinkingFountainList] = useState<FeedlotCorralResourceRef[]>([]);

  useEffect(() => {
    if (optionsQuery.data) {
      setTroughList(optionsQuery.data.troughs);
      setDrinkingFountainList(optionsQuery.data.drinking_fountains);
    }
  }, [optionsQuery.data]);

  useEffect(() => {
    if (!isOpen) return;

    if (isCreate) {
      reset(EMPTY_VALUES);
      return;
    }

    const detail = detailQuery.data as FeedlotCorralDetail | undefined;
    if (!detail || !optionsQuery.data) return;

    reset({
      name: detail.name,
      installation_type: detail.installation_type,
      status: isDuplicating ? detail.status : null,
      // TASK-063-CUR-01 — acompanha `status` no duplicar (mesmo tratamento
      // dos demais campos copiados do detalhe); inerte em editar (`status`/
      // estes 2 campos não são renderizados nem enviados nesse modo).
      available_at: isDuplicating ? (detail.available_at ?? null) : null,
      note: isDuplicating ? (detail.last_status_note ?? '') : '',
      width: detail.width ?? '',
      length: detail.length ?? '',
      capacity: detail.capacity ?? '',
      coverage: detail.coverage,
      floor: detail.floor,
      shading: detail.shading,
      // TASK-063-MAPA2-05 — em DUPLICAR, cocho/bebedouro NÃO acompanham a
      // origem (vínculo 1:1, exclusivo por curral): nascem vazios, igual ao
      // create puro, forçando escolha explícita. Em EDITAR, mostram o
      // vínculo atual normalmente (regressão zero). Demais campos duplicados
      // (nome, dimensões, etc.) continuam copiados normalmente.
      trough_uuid: isDuplicating ? null : refToOption(detail.trough),
      drinking_fountain_uuid: isDuplicating ? null : refToOption(detail.drinking_fountain),
    });
  }, [isOpen, isCreate, isDuplicating, detailQuery.data, optionsQuery.data]);

  const isLoadingForm =
    isOpen &&
    (checkLoadingStatus([optionsQuery as any]) ||
      ((isEditing || isDuplicating) && checkLoadingStatus([detailQuery as any])));

  const [inlineModal, setInlineModal] = useState<'trough' | 'drinking-fountain' | null>(null);

  function invalidateTree() {
    queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
  }

  const mutation = useMutation({
    mutationFn: async (data: FeedlotCorralFormType) => {
      const basePayload = {
        name: data.name,
        installation_type: data.installation_type!.value,
        coverage: data.coverage!.value,
        floor: data.floor!.value,
        shading: data.shading!.value,
        width: Number(data.width),
        length: Number(data.length),
        capacity: Number(data.capacity),
        trough_uuid: data.trough_uuid!.value,
        drinking_fountain_uuid: data.drinking_fountain_uuid!.value,
      };

      if (isEditing && targetUuid) {
        const payload: UpdateFeedlotCorralRequest = basePayload;
        return updateFeedlotCorral(targetUuid, payload);
      }

      const payload: CreateFeedlotCorralRequest = {
        ...basePayload,
        feedlot_sector_uuid: sectorUuid as string,
        status: data.status!.value,
        // TASK-063-CUR-01 — só entra quando o status exige detalhe (backend
        // `required_if`, mirror `CreateOrUpdateFeedlotCorral.tsx`); nos
        // demais o campo é omitido/ignorado.
        ...(requiresStatusDetail(data.status)
          ? { available_at: data.available_at, note: data.note || null }
          : {}),
      };
      return createFeedlotCorral(payload);
    },
    onSuccess: () => {
      toaster.success({
        title: text.singularLabel,
        description: languageGB.defaltStrings.actionSuccess,
      });
      invalidateTree();
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: FeedlotCorralFormType) {
    mutation.mutate(data);
  }

  const isSubmitting = mutation.isPending;

  const troughOptions: Option<string>[] = useMemo(
    () => troughList.map((item) => ({ label: item.description, value: item.uuid })),
    [troughList]
  );
  const drinkingFountainOptions: Option<string>[] = useMemo(
    () => drinkingFountainList.map((item) => ({ label: item.description, value: item.uuid })),
    [drinkingFountainList]
  );

  const watchedStatus = useWatch({ control, name: 'status' });
  const showStatusDetail = !isEditing && requiresStatusDetail(watchedStatus);

  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const areaPreview = useMemo(() => {
    const w = Number(watchedWidth) || 0;
    const l = Number(watchedLength) || 0;
    return areaFormatter.format(w * l);
  }, [watchedWidth, watchedLength]);

  const dialogTitle = isEditing
    ? text.title.edit
    : isDuplicating
      ? text.title.duplicate
      : text.title.create;

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open && !isSubmitting) onClose();
        }}
        size="xl"
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Positioner>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.Content>
              <Dialog.Header>
                {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
                <Dialog.Title>{dialogTitle}</Dialog.Title>
              </Dialog.Header>

              <form id="feedlot-corral-dialog-form" onSubmit={handleSubmit(onSubmit)}>
                <Dialog.Body>
                  {isEditing && (
                    <Box
                      bg="bg.muted"
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      px={4}
                      py={3}
                      mb={6}
                    >
                      <Skeleton loading={!!isLoadingForm} borderRadius="md">
                        <Box>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="fg.muted"
                            textTransform="uppercase"
                          >
                            {text.fields.identification}
                          </Text>
                          <Text fontSize="md" fontWeight="bold" fontFamily="mono">
                            {detailQuery.data?.identification}
                          </Text>
                        </Box>
                      </Skeleton>
                    </Box>
                  )}

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Input
                      label={text.fields.name}
                      {...register('name')}
                      error={errors.name?.message}
                      isRequired
                      loading={!!isLoadingForm}
                    />

                    <Controller
                      name="installation_type"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.installationType}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={optionsQuery.data?.installation_types ?? []}
                          error={error?.message}
                          isRequired
                          loading={!!isLoadingForm}
                        />
                      )}
                    />

                    {!isEditing && (
                      <Controller
                        name="status"
                        control={control}
                        render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                          <Select
                            label={text.fields.status}
                            name={name}
                            value={value}
                            onChange={onChange}
                            options={optionsQuery.data?.statuses ?? []}
                            error={error?.message}
                            isRequired
                            loading={!!isLoadingForm}
                          />
                        )}
                      />
                    )}

                    {/* TASK-063-CUR-01 — `available_at`/`note`, condicionais
                        quando `status` ∈ {Vazio Sanitário, Limpeza,
                        Manutenção, Interditado} (`requiresStatusDetail`,
                        mirror EXATO de `StepIdentificacaoSituacao.tsx`).
                        Só no CREATE/DUPLICATE — este diálogo não tem step de
                        edição de situação (`status` já esconde em editar). */}
                    {showStatusDetail && (
                      <>
                        <Controller
                          name="available_at"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field
                              label={statusFieldsText.availableAt}
                              isRequired
                              errorText={fieldState.error?.message}
                            >
                              <DateInput
                                value={field.value}
                                onChange={field.onChange}
                                disabled={!!isLoadingForm}
                              />
                            </Field>
                          )}
                        />

                        <Textarea
                          label={statusFieldsText.note}
                          {...register('note')}
                          error={errors.note?.message}
                          isRequired
                          minH="100px"
                          disabled={!!isLoadingForm}
                        />
                      </>
                    )}

                    <Controller
                      name="width"
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumberInput
                          name={field.name}
                          label={text.fields.width}
                          value={field.value === '' ? null : Number(field.value)}
                          onValueChange={(value) => field.onChange(value ?? '')}
                          allowDot
                          decimalPlaces={2}
                          min={0}
                          max={FEEDLOT_CORRAL_DIMENSION_MAX}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={!!isLoadingForm}
                        />
                      )}
                    />

                    <Controller
                      name="length"
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumberInput
                          name={field.name}
                          label={text.fields.length}
                          value={field.value === '' ? null : Number(field.value)}
                          onValueChange={(value) => field.onChange(value ?? '')}
                          allowDot
                          decimalPlaces={2}
                          min={0}
                          max={FEEDLOT_CORRAL_DIMENSION_MAX}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={!!isLoadingForm}
                        />
                      )}
                    />

                    <Box>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="fg.muted"
                        textTransform="uppercase"
                        mb={1}
                      >
                        {text.fields.area}
                      </Text>
                      <Text fontSize="md" fontWeight="bold">
                        {areaPreview} m²
                      </Text>
                    </Box>

                    <Controller
                      name="capacity"
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumberInput
                          name={field.name}
                          label={text.fields.capacity}
                          value={field.value === '' ? null : Number(field.value)}
                          onValueChange={(value) => field.onChange(value ?? '')}
                          decimalPlaces={0}
                          min={0}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={!!isLoadingForm}
                        />
                      )}
                    />

                    <Controller
                      name="coverage"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.coverage}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={optionsQuery.data?.coverages ?? []}
                          error={error?.message}
                          isRequired
                          loading={!!isLoadingForm}
                        />
                      )}
                    />

                    <Controller
                      name="floor"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.floor}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={optionsQuery.data?.floors ?? []}
                          error={error?.message}
                          isRequired
                          loading={!!isLoadingForm}
                        />
                      )}
                    />

                    <Controller
                      name="shading"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.shading}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={optionsQuery.data?.shadings ?? []}
                          error={error?.message}
                          isRequired
                          loading={!!isLoadingForm}
                        />
                      )}
                    />

                    <Box>
                      <Box display="flex" alignItems="flex-end" gap={2}>
                        <Box flex="1">
                          <Controller
                            name="trough_uuid"
                            control={control}
                            render={({
                              field: { name, value, onChange },
                              fieldState: { error },
                            }) => (
                              <Select
                                label={text.fields.trough}
                                name={name}
                                value={value}
                                onChange={onChange}
                                options={troughOptions}
                                error={error?.message}
                                isRequired
                                loading={!!isLoadingForm}
                              />
                            )}
                          />
                        </Box>
                        <IconButton
                          aria-label={text.addTrough}
                          size="sm"
                          variant="outline"
                          onClick={() => setInlineModal('trough')}
                        >
                          <Plus />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box>
                      <Box display="flex" alignItems="flex-end" gap={2}>
                        <Box flex="1">
                          <Controller
                            name="drinking_fountain_uuid"
                            control={control}
                            render={({
                              field: { name, value, onChange },
                              fieldState: { error },
                            }) => (
                              <Select
                                label={text.fields.drinkingFountain}
                                name={name}
                                value={value}
                                onChange={onChange}
                                options={drinkingFountainOptions}
                                error={error?.message}
                                isRequired
                                loading={!!isLoadingForm}
                              />
                            )}
                          />
                        </Box>
                        <IconButton
                          aria-label={text.addDrinkingFountain}
                          size="sm"
                          variant="outline"
                          onClick={() => setInlineModal('drinking-fountain')}
                        >
                          <Plus />
                        </IconButton>
                      </Box>
                    </Box>
                  </SimpleGrid>
                </Dialog.Body>
              </form>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                />
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="feedlot-corral-dialog-form"
                  loading={isSubmitting}
                  disabled={!!isLoadingForm}
                />
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <InlineTroughModal
        isOpen={inlineModal === 'trough'}
        onClose={() => setInlineModal(null)}
        onCreated={(option) => {
          setTroughList((current) => [...current, option]);
          reset(
            (current) => ({
              ...current,
              trough_uuid: { label: option.description, value: option.uuid },
            }),
            { keepDirty: true, keepErrors: true, keepTouched: true }
          );
        }}
      />
      <InlineDrinkingFountainModal
        isOpen={inlineModal === 'drinking-fountain'}
        onClose={() => setInlineModal(null)}
        onCreated={(option) => {
          setDrinkingFountainList((current) => [...current, option]);
          reset(
            (current) => ({
              ...current,
              drinking_fountain_uuid: { label: option.description, value: option.uuid },
            }),
            { keepDirty: true, keepErrors: true, keepTouched: true }
          );
        }}
      />
    </>
  );
}
