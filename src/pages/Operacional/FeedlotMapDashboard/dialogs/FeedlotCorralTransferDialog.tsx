// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralTransferDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Transferir Lote — TASK-FE-042-210, `AM15`. Mirror
// `agro365/resources/js/components/FeedlotMap/ModalTransferirLote.js`:
// `batch_uuid` (lotes do curral de origem), `destination_type` (cascata
// curral/área/pastejo), `destination_uuid` (opções trocam conforme o tipo),
// `transfer_date`.
//
// `IG20`: trocar `destination_type` limpa `destination_uuid` SEMPRE (nunca
// reenviar um uuid de outro tipo de destino).
//
// `GAP-FE-243` RESOLVIDO (TASK-063-MAPA2-07, execução 063, F-036 rejeição QA
// rodada 2, §4): `GET .../transfer-options` agora devolve, só no grupo
// `corrals`, `identification`/`status`/`status_label`/`capacity`/
// `animals_count` (TASK-063-MAPA2-06, API). O label do destino "curral" é
// composto aqui, na tela — mirror EXATO do legado `ModalTransferirLote.js:
// 195-208` (`formatOptionLabel`): `"{identification} - {label}
// ({status_label} | {animals_count}/{capacity} animais)"` (ocupação só
// aparece quando `capacity > 0`). `areas`/`grazings` continuam `{value,
// label}` puro, sem enriquecimento.
//
// Aviso NÃO-BLOQUEANTE de capacidade (causa-raiz confirmada, execução 063):
// mirror `ModalTransferirLote.js:80-93` (`checkCapacity`) — só AVISA, nunca
// bloqueia (o legado nunca desabilita o botão Transferir por capacidade).
// `GET .../transfer-options` agora devolve `animals_count` também no grupo
// `batches` (aditivo). Reativo via `useWatch` de `batch_uuid`/
// `destination_uuid` (mesmo padrão de `Box bg="feedBack.warn"` já em uso em
// `FeedlotCorralBatchesDialog.tsx:329-335`) — sem validação bloqueante no
// schema, sem desabilitar o submit.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  transferBatchSchemaResolver,
  type TransferBatchFormValues,
} from '@/validations/schemas/FeedlotMap/transferBatch-schema';

import {
  getCorralTransferOptions,
  transferCorralBatch,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { Option } from '@/@types/option';
import type {
  FeedlotCorralTransferDestinationType,
  TransferCorralBatchRequest,
} from '@/@types/v2/FeedlotMap/transfer';

const EMPTY_VALUES: TransferBatchFormValues = {
  batch_uuid: null,
  destination_type: null,
  destination_uuid: null,
  transfer_date: null,
};

export interface FeedlotCorralTransferDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  onClose: () => void;
}

export function FeedlotCorralTransferDialog({
  isOpen,
  targetUuid,
  onClose,
}: FeedlotCorralTransferDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.transfer;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, setValue } = useForm<TransferBatchFormValues>({
    mode: 'onChange',
    resolver: transferBatchSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const optionsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-transfer-options', targetUuid],
    queryFn: async () => (await getCorralTransferOptions(targetUuid as string)).data,
    enabled: isOpen && !!targetUuid,
  });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen, targetUuid]);

  const destinationTypeOptions: Option<FeedlotCorralTransferDestinationType>[] = [
    { label: text.destinationTypeOptions.corral, value: 'corral' },
    { label: text.destinationTypeOptions.area, value: 'area' },
    { label: text.destinationTypeOptions.grazing, value: 'grazing' },
  ];

  const watchedDestinationType = useWatch({ control, name: 'destination_type' });
  const watchedBatchUuid = useWatch({ control, name: 'batch_uuid' });
  const watchedDestinationUuid = useWatch({ control, name: 'destination_uuid' });

  // Aviso NÃO-BLOQUEANTE de capacidade — mirror `ModalTransferirLote.js:
  // 80-93` (`checkCapacity`): só se aplica quando `destination_type ===
  // 'corral'` (áreas/pastejo não têm capacidade). Cruza o `destCorral`
  // selecionado (opções de `corrals`, com `animals_count`+`capacity`) com o
  // `batch` selecionado (opções de `batches`, agora com `animals_count`).
  const capacityWarning = useMemo(() => {
    if (watchedDestinationType?.value !== 'corral') return null;
    const destCorral = optionsQuery.data?.corrals.find(
      (corral) => corral.value === watchedDestinationUuid?.value
    );
    const batch = optionsQuery.data?.batches.find(
      (option) => option.value === watchedBatchUuid?.value
    );
    if (!destCorral || !batch) return null;

    const total = (destCorral.animals_count || 0) + (batch.animals_count || 0);
    if (destCorral.capacity > 0 && total > destCorral.capacity) {
      return { total, capacity: destCorral.capacity };
    }
    return null;
  }, [watchedDestinationType, watchedDestinationUuid, watchedBatchUuid, optionsQuery.data]);

  function handleDestinationTypeChange(
    option: Option<FeedlotCorralTransferDestinationType> | null
  ) {
    setValue('destination_type', option);
    // IG20 — trocar o tipo SEMPRE limpa o destino (nunca reenviar um uuid de outro tipo).
    setValue('destination_uuid', null);
  }

  const destinationOptions: Option<string>[] = (() => {
    if (!optionsQuery.data || !watchedDestinationType) return [];
    switch (watchedDestinationType.value) {
      case 'corral':
        // TASK-063-MAPA2-07 — label enriquecido (rota simples, decisão do
        // dono), mirror EXATO `ModalTransferirLote.js:195-208`
        // (`formatOptionLabel`): "{identification} - {label} ({status_label}
        // | {animals_count}/{capacity} animais)". Ocupação só aparece com
        // `capacity > 0` (mirror do legado).
        return optionsQuery.data.corrals.map((corral) => ({
          value: corral.value,
          label: `${corral.identification} - ${corral.label} (${corral.status_label}${
            corral.capacity > 0 ? ` | ${corral.animals_count}/${corral.capacity} animais` : ''
          })`,
        }));
      case 'area':
        return optionsQuery.data.areas;
      case 'grazing':
        return optionsQuery.data.grazings;
      default:
        return [];
    }
  })();

  const mutation = useMutation({
    mutationFn: async (payload: TransferCorralBatchRequest) => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return transferCorralBatch(targetUuid, payload);
    },
    onSuccess: () => {
      toaster.success({ title: text.title, description: languageGB.defaltStrings.actionSuccess });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: TransferBatchFormValues) {
    mutation.mutate({
      batch_uuid: data.batch_uuid!.value,
      destination_type: data.destination_type!.value,
      destination_uuid: data.destination_uuid!.value,
      transfer_date: data.transfer_date as string,
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="md"
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
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <form id="feedlot-corral-transfer-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Controller
                    name="batch_uuid"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={text.fields.batch}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={optionsQuery.data?.batches ?? []}
                        error={error?.message}
                        isRequired
                        loading={optionsQuery.isPending}
                      />
                    )}
                  />

                  <Controller
                    name="destination_type"
                    control={control}
                    render={({ field: { name, value }, fieldState: { error } }) => (
                      <Select
                        label={text.fields.destinationType}
                        name={name}
                        value={value}
                        onChange={handleDestinationTypeChange}
                        options={destinationTypeOptions}
                        error={error?.message}
                        isRequired
                      />
                    )}
                  />

                  <Controller
                    name="destination_uuid"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={text.fields.destination}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={destinationOptions}
                        error={error?.message}
                        isRequired
                        isDisabled={!watchedDestinationType}
                        loading={optionsQuery.isPending}
                      />
                    )}
                  />

                  <Controller
                    name="transfer_date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.transferDate}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                </SimpleGrid>

                {capacityWarning && (
                  // Aviso NÃO-BLOQUEANTE — mirror EXATO do Box de capacidade
                  // já em uso em `FeedlotCorralBatchesDialog.tsx:329-335`
                  // (`bg="feedBack.warn"`). Nunca desabilita o submit.
                  <Box bg="feedBack.warn" borderRadius="md" px={4} py={2} mt={4}>
                    <Text fontSize="sm">
                      {text.capacityWarning
                        .replace('{total}', String(capacityWarning.total))
                        .replace('{capacity}', String(capacityWarning.capacity))}
                    </Text>
                  </Box>
                )}
              </Dialog.Body>
            </form>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              <Button
                title={languageGB.defaltStrings.save}
                type="submit"
                form="feedlot-corral-transfer-dialog-form"
                loading={isSubmitting}
              />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
