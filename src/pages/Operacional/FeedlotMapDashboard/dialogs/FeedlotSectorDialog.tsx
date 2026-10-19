// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotSectorDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Setor (FeedlotSector) do Mapa de Confinamento —
// TASK-FE-042-205. ZERO service/schema novo — REUSO 100% de
// `feedlot-sector-service.ts`/`feedlotSector-schema.ts`/`useFeedlotSectorForm`
// (mesmos da tela de rota própria `CreateOrUpdateFeedlotSector.tsx`,
// mirror EXATO de `FeedlotYardDialog.tsx`, TASK-FE-042-204).
//
// `feedlot_yard_uuid` só entra no payload de CRIAÇÃO (vem do pátio pai
// clicado no board, `yardUuid`/`yardName` do `FeedlotMapDialogState`) —
// NUNCA no de edição (imutável, mirror `feedlot-sector-service.ts`). Campo
// pré-preenchido e DESABILITADO no create a partir do board (o pai já é
// conhecido — sem 2º fetch) e em qualquer edição (`isReadOnly`+`isDisabled`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useFeedlotSectorForm } from '@/pages/Operacional/FeedlotSectors/useFeedlotSectors';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkErrorStatus, checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { feedlotSectorStatusOptions } from '@/constants/FeedlotSectors/options/feedlot-sector-status-options';
import { queryKey } from '@/constants/query-key';

import { feedlotSectorSchemaResolver } from '@/validations/schemas/FeedlotSectors/feedlotSector-schema';

import {
  createFeedlotSector,
  updateFeedlotSector,
} from '@/services/v2/FeedlotSectors/feedlot-sector-service';
import { listFeedlotYards } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotSectorRequest,
  FeedlotSectorDetail,
  FeedlotSectorForm as FeedlotSectorFormType,
  UpdateFeedlotSectorRequest,
} from '@/@types/v2/FeedlotSectors';
import type { FeedlotYardListItem } from '@/@types/v2/FeedlotYards';

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface FeedlotSectorDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  yardUuid?: string;
  yardName?: string;
  onClose: () => void;
}

export function FeedlotSectorDialog({
  isOpen,
  targetUuid,
  yardUuid,
  yardName,
  onClose,
}: FeedlotSectorDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotSectors.feedlotSector;
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(targetUuid);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FeedlotSectorFormType>({
    mode: 'onChange',
    resolver: feedlotSectorSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      feedlot_yard_uuid: null,
      width: '',
      length: '',
      is_active: feedlotSectorStatusOptions.getOption(true, languageGB),
      observation: '',
    },
  });

  function fillForm(data: FeedlotSectorDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        feedlot_yard_uuid: { label: data.feedlot_yard.name, value: data.feedlot_yard.uuid },
        width: data.width ?? '',
        length: data.length ?? '',
        is_active: feedlotSectorStatusOptions.getOption(!!data.is_active, languageGB),
        observation: data.observation ?? '',
      });
    }
  }

  const feedlotSectorQuery = useFeedlotSectorForm({
    registrationId: isOpen && isEditing ? targetUuid : undefined,
    fillForm,
  });

  const isLoadingDetail = isOpen && isEditing && checkLoadingStatus([feedlotSectorQuery as any]);
  // TASK-063-MAPA-02 — mirror `FeedlotYardDialog.tsx` (GAP-FE-042-MAPA-01,
  // roteiro §1): distingue "falhou" de "ainda não carregou".
  const hasLoadError =
    isOpen && isEditing && !isLoadingDetail && checkErrorStatus([feedlotSectorQuery as any]);
  const feedlotSectorData = feedlotSectorQuery.data as FeedlotSectorDetail | undefined;

  // Create a partir do board: pátio pai JÁ conhecido (`yardUuid`/`yardName`)
  // — pré-preenche e desabilita, sem 2º fetch (mirror do `isReadOnly` de
  // edição, mesma razão: o valor já está resolvido pelo contexto de abertura).
  useEffect(() => {
    if (isOpen && !isEditing && yardUuid && yardName) {
      reset({
        ...getValues(),
        feedlot_yard_uuid: { label: yardName, value: yardUuid },
      });
    }
  }, [isOpen, isEditing, yardUuid, yardName]);

  const mutation = useMutation({
    mutationFn: async (data: FeedlotSectorFormType) => {
      if (isEditing && targetUuid) {
        const patch: UpdateFeedlotSectorRequest = {};
        if (dirtyFields.name) patch.name = data.name;
        if (dirtyFields.width) patch.width = Number(data.width);
        if (dirtyFields.length) patch.length = Number(data.length);
        if (dirtyFields.is_active) patch.is_active = data.is_active.value;
        if (dirtyFields.observation) patch.observation = data.observation;
        return updateFeedlotSector(targetUuid, patch);
      }

      const payload: CreateFeedlotSectorRequest = {
        name: data.name,
        feedlot_yard_uuid: data.feedlot_yard_uuid!.value,
        width: Number(data.width),
        length: Number(data.length),
        is_active: data.is_active.value,
        observation: data.observation || undefined,
      };
      return createFeedlotSector(payload);
    },
    onSuccess: () => {
      toaster.success({
        title: text.singularLabel,
        description: languageGB.defaltStrings.actionSuccess,
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotSectors.feedlotSectors] });
      queryClient.invalidateQueries({
        queryKey: [queryKey.feedlotSectors.feedlotSector, targetUuid],
      });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: FeedlotSectorFormType) {
    // TASK-063-MAPA-01 — mirror `FeedlotYardDialog.tsx`: guarda de
    // `dirtyFields` (Lei 2) inalterada, só o feedback muda (toast em vez de
    // fechar em silêncio).
    if (isEditing && isEmpty(dirtyFields)) {
      toaster.create({
        type: 'info',
        title: text.singularLabel,
        description: text.dialog.noChangesToast,
      });
      onClose();
      return;
    }
    mutation.mutate(data);
  }

  const isSubmitting = mutation.isPending;

  const statusOptions: Option<boolean>[] = useMemo(
    () => feedlotSectorStatusOptions.options(languageGB),
    [languageGB]
  );

  const displayCode = isEditing ? feedlotSectorData?.code : text.form.hints.codeGenerated;

  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const totalAreaPreview = useMemo(() => {
    const w = Number(watchedWidth) || 0;
    const l = Number(watchedLength) || 0;
    return areaFormatter.format(w * l);
  }, [watchedWidth, watchedLength]);

  const watchedObservation = useWatch({ control, name: 'observation' });
  const observationLength = (watchedObservation || getValues('observation') || '').length;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="lg"
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
              <Dialog.Title>
                {isEditing ? text.form.title.edit : text.form.title.create}
              </Dialog.Title>
            </Dialog.Header>

            <form id="feedlot-sector-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                {hasLoadError ? (
                  // TASK-063-MAPA-02 — mirror `FeedlotYardDialog.tsx`.
                  <VStack gap={3} py={10}>
                    <Text color="fg.muted">{text.dialog.loadError.message}</Text>
                    <Button
                      type="button"
                      variant="outline"
                      title={text.dialog.loadError.retry}
                      onClick={() => (feedlotSectorQuery as any).refetch()}
                    />
                  </VStack>
                ) : (
                  <>
                    <Box
                      bg="bg.muted"
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      px={4}
                      py={3}
                      mb={6}
                    >
                      <Skeleton loading={!!isLoadingDetail} borderRadius="md">
                        <Box>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="fg.muted"
                            textTransform="uppercase"
                          >
                            {text.form.fields.code}
                          </Text>
                          <Text fontSize="md" fontWeight="bold" fontFamily="mono">
                            {displayCode}
                          </Text>
                        </Box>
                      </Skeleton>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      <Input
                        label={text.form.fields.name}
                        {...register('name')}
                        error={errors.name?.message}
                        isRequired
                        loading={!!isLoadingDetail}
                      />

                      <Controller
                        name="feedlot_yard_uuid"
                        control={control}
                        render={({ field }) => (
                          <SelectAsyncPaginate
                            name={field.name}
                            label={text.form.fields.feedlotYard}
                            placeholder={text.form.placeholders.feedlotYard}
                            error={(errors.feedlot_yard_uuid as any)?.message}
                            service={listFeedlotYards}
                            mapOptions={(item: FeedlotYardListItem) => ({
                              label: item.name,
                              value: item.uuid,
                            })}
                            findParams={(search: string | { search: string }) => ({
                              search: typeof search === 'string' ? search : search.search,
                              is_active: true,
                            })}
                            value={field.value ?? undefined}
                            onChange={(option: any) => field.onChange(option ?? null)}
                            isRequired
                            isReadOnly={isEditing || !!yardUuid}
                            isDisabled={isEditing || !!yardUuid || !!isLoadingDetail}
                          />
                        )}
                      />

                      <Controller
                        name="width"
                        control={control}
                        render={({ field, fieldState }) => (
                          <NumberInput
                            name={field.name}
                            label={text.form.fields.width}
                            placeholder={text.form.placeholders.width}
                            value={field.value === '' ? null : Number(field.value)}
                            onValueChange={(value) => field.onChange(value ?? '')}
                            allowDot
                            decimalPlaces={2}
                            min={0}
                            error={fieldState.error?.message}
                            isRequired
                            disabled={!!isLoadingDetail}
                          />
                        )}
                      />

                      <Controller
                        name="length"
                        control={control}
                        render={({ field, fieldState }) => (
                          <NumberInput
                            name={field.name}
                            label={text.form.fields.length}
                            placeholder={text.form.placeholders.length}
                            value={field.value === '' ? null : Number(field.value)}
                            onValueChange={(value) => field.onChange(value ?? '')}
                            allowDot
                            decimalPlaces={2}
                            min={0}
                            error={fieldState.error?.message}
                            isRequired
                            disabled={!!isLoadingDetail}
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
                          {text.form.fields.area}
                        </Text>
                        <Text fontSize="md" fontWeight="bold">
                          {totalAreaPreview} m²
                        </Text>
                      </Box>

                      <Controller
                        name="is_active"
                        control={control}
                        render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                          <Select
                            label={text.form.fields.isActive}
                            name={name}
                            value={value}
                            onChange={onChange}
                            options={statusOptions}
                            error={error?.message}
                            isRequired
                            loading={!!isLoadingDetail}
                          />
                        )}
                      />
                    </SimpleGrid>

                    <Box mt={6}>
                      <Textarea
                        label={text.form.fields.observation}
                        helperText={
                          errors.observation?.message ? undefined : `${observationLength}/600`
                        }
                        {...register('observation')}
                        error={errors.observation?.message}
                        loading={!!isLoadingDetail}
                        disabled={!!isLoadingDetail}
                        minH="120px"
                      />
                    </Box>
                  </>
                )}
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
              {!hasLoadError && (
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="feedlot-sector-dialog-form"
                  loading={isSubmitting}
                  disabled={!!isLoadingDetail}
                />
              )}
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
