// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotYardDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Pátio (FeedlotYard) do Mapa de Confinamento —
// TASK-FE-042-204. ZERO service/schema novo — REUSO 100% de
// `feedlot-yard-service.ts`/`feedlotYard-schema.ts`/`useFeedlotYardForm`
// (mesmos usados pela tela de rota própria `CreateOrUpdateFeedlotYard.tsx`,
// execução 046) — só a CASCA muda (`Dialog.Root` Pattern 14 em vez de
// `FormContainer` de página cheia, mirror `NewBatchModal.tsx`).
//
// Campos (`FM001-007`): `code` (readonly, real só em editar), `name`,
// `is_active`, `width`/`length` (numéricos), `total_area` (derivado
// `width*length`, preview client-side, NUNCA no payload), `observation`
// (max 600 + contador).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useFeedlotYardForm } from '@/pages/Operacional/FeedlotYards/useFeedlotYards';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkErrorStatus, checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { feedlotYardStatusOptions } from '@/constants/FeedlotYards/options/feedlot-yard-status-options';
import { queryKey } from '@/constants/query-key';

import { feedlotYardSchemaResolver } from '@/validations/schemas/FeedlotYards/feedlotYard-schema';

import {
  createFeedlotYard,
  updateFeedlotYard,
} from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotYardRequest,
  FeedlotYardDetail,
  FeedlotYardForm as FeedlotYardFormType,
  UpdateFeedlotYardRequest,
} from '@/@types/v2/FeedlotYards';

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface FeedlotYardDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  onClose: () => void;
}

export function FeedlotYardDialog({ isOpen, targetUuid, onClose }: FeedlotYardDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotYards.feedlotYard;
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(targetUuid);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FeedlotYardFormType>({
    mode: 'onChange',
    resolver: feedlotYardSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      width: '',
      length: '',
      is_active: feedlotYardStatusOptions.getOption(true, languageGB),
      observation: '',
    },
  });

  function fillForm(data: FeedlotYardDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        width: data.width ?? '',
        length: data.length ?? '',
        is_active: feedlotYardStatusOptions.getOption(!!data.is_active, languageGB),
        observation: data.observation ?? '',
      });
    }
  }

  const feedlotYardQuery = useFeedlotYardForm({
    registrationId: isOpen && isEditing ? targetUuid : undefined,
    fillForm,
  });

  const isLoadingDetail = isOpen && isEditing && checkLoadingStatus([feedlotYardQuery as any]);
  // TASK-063-MAPA-02 — `checkLoadingStatus` sozinho não distingue "falhou"
  // de "ainda não carregou"; sem isto, um `GET /feedlot-yards/{uuid}` que
  // falha deixa o formulário em branco (parece "Criar" em vez de "Editar"),
  // sem nenhum aviso (GAP-FE-042-MAPA-01, roteiro §1).
  const hasLoadError =
    isOpen && isEditing && !isLoadingDetail && checkErrorStatus([feedlotYardQuery as any]);
  const feedlotYardData = feedlotYardQuery.data as FeedlotYardDetail | undefined;

  const mutation = useMutation({
    mutationFn: async (data: FeedlotYardFormType) => {
      if (isEditing && targetUuid) {
        const patch: UpdateFeedlotYardRequest = {};
        if (dirtyFields.name) patch.name = data.name;
        if (dirtyFields.width) patch.width = Number(data.width);
        if (dirtyFields.length) patch.length = Number(data.length);
        if (dirtyFields.is_active) patch.is_active = data.is_active.value;
        if (dirtyFields.observation) patch.observation = data.observation;
        return updateFeedlotYard(targetUuid, patch);
      }

      const payload: CreateFeedlotYardRequest = {
        name: data.name,
        width: Number(data.width),
        length: Number(data.length),
        is_active: data.is_active.value,
        observation: data.observation || undefined,
      };
      return createFeedlotYard(payload);
    },
    onSuccess: () => {
      toaster.success({
        title: text.singularLabel,
        description: languageGB.defaltStrings.actionSuccess,
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotYards.feedlotYards] });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotYards.feedlotYard, targetUuid] });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: FeedlotYardFormType) {
    // TASK-063-MAPA-01 — a guarda de `dirtyFields` (Lei 2, PATCH parcial)
    // continua igual; o que muda é o feedback: antes fechava em silêncio
    // (indistinguível de "Salvar quebrado" para quem testa), agora avisa
    // explicitamente que não havia nada para salvar.
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
    () => feedlotYardStatusOptions.options(languageGB),
    [languageGB]
  );

  const displayCode = isEditing ? feedlotYardData?.code : text.form.hints.codeGenerated;

  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const areaPreview = useMemo(() => {
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

            <form id="feedlot-yard-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                {hasLoadError ? (
                  // TASK-063-MAPA-02 — estado de erro explícito (mirror
                  // `get_spa_ux_fidelity_pattern §3`) em vez de deixar os
                  // campos em branco sem nenhum aviso.
                  <VStack gap={3} py={10}>
                    <Text color="fg.muted">{text.dialog.loadError.message}</Text>
                    <Button
                      type="button"
                      variant="outline"
                      title={text.dialog.loadError.retry}
                      onClick={() => (feedlotYardQuery as any).refetch()}
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
                        placeholder={text.form.placeholders.name}
                        {...register('name')}
                        error={errors.name?.message}
                        isRequired
                        loading={!!isLoadingDetail}
                      />

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
                          {areaPreview} m²
                        </Text>
                      </Box>
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
                  form="feedlot-yard-dialog-form"
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
