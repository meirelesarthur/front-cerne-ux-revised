// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralBatchesDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Gerenciar/Sincronizar Lotes do Curral — TASK-FE-042-209, `AM14`.
// Mirror `agro365/resources/js/components/FeedlotMap/ModalLotes.js`: datas
// de entrada/saída (+ total de dias derivado), GMD esperado, dieta+consumo,
// array repetível de lotes (`useFieldArray`, dedupe por `batch_uuid`), aviso
// de capacidade NÃO-bloqueante.
//
// Resumo calculado (`CV09-14`: animais/peso médio entrada/ganho previsto/
// peso pós-confinamento) — TASK-063-MAPA2-04 (execução 063, F-036 rejeição
// QA rodada 2, §2b). `GAP-FE-241` RESOLVIDO: `GET .../batch-options` agora
// devolve `animals_count`/`average_weight`/`average_start_weight` por lote
// (TASK-063-MAPA2-03, API). Fórmulas mirror EXATO do legado
// `ModalLotes.js:140-159,327-345` — soma/média ponderada por
// `animals_count`; Ganho Previsto = `expected_adg × totalDays`; Peso
// Pós-Confinamento = Ganho Previsto + Peso Médio de Entrada (ponderado).
// Dieta atual pré-selecionada via `corral.diet` {uuid,label} (`GAP-FE-242`
// RESOLVIDO na API); curral sem dieta → vazio.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Dialog, Flex, Portal, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  syncBatchesSchemaResolver,
  type SyncBatchesFormValues,
} from '@/validations/schemas/FeedlotMap/syncBatches-schema';

import { listDietOptions } from '@/services/v2/Diets/diet-service';
import {
  getCorralBatchOptions,
  syncCorralBatches,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { CorralCardData } from '@/@types/v2/FeedlotMap';
import type { SyncCorralBatchesRequest } from '@/@types/v2/FeedlotMap/batches';

import { FeedlotCorralBatchRow } from './FeedlotCorralBatchRow';

const EMPTY_VALUES: SyncBatchesFormValues = {
  entry_date: null,
  exit_date: null,
  diet_id: null,
  feed_intake: '',
  expected_adg: '',
  batches: [],
};

function calcTotalDays(entryDate: string | null, exitDate: string | null): number | null {
  if (!entryDate || !exitDate) return null;
  const diff = Math.round(
    (new Date(exitDate).getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? diff : null;
}

// TASK-063-MAPA2-04 — mirror `ModalLotes.js` (`avgWeight.toFixed(2)` /
// `toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2})`),
// mesmo padrão local já em uso em `FeedlotCorralWeighingDialog.tsx`.
function formatNumber(value: number | null, decimals = 2): string {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export interface FeedlotCorralBatchesDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  corralData?: CorralCardData;
  onClose: () => void;
}

export function FeedlotCorralBatchesDialog({
  isOpen,
  targetUuid,
  corralData,
  onClose,
}: FeedlotCorralBatchesDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.batches;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<SyncBatchesFormValues>({
    mode: 'onChange',
    resolver: syncBatchesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'batches' });

  const batchOptionsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-batch-options', targetUuid],
    queryFn: async () => (await getCorralBatchOptions(targetUuid as string)).data,
    enabled: isOpen && !!targetUuid,
  });

  const dietOptionsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'diet-options'],
    queryFn: () => listDietOptions(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      entry_date: corralData?.entry_date ?? null,
      exit_date: corralData?.exit_date ?? null,
      diet_id: corralData?.diet
        ? { value: corralData.diet.uuid, label: corralData.diet.label }
        : null,
      feed_intake: corralData?.feed_intake ?? '',
      expected_adg: corralData?.expected_adg ?? '',
      batches: (corralData?.batches ?? []).map((batch) => ({
        batch_uuid: { label: batch.description, value: batch.uuid },
      })),
    });
  }, [isOpen, targetUuid]);

  const mutation = useMutation({
    mutationFn: async (payload: SyncCorralBatchesRequest) => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return syncCorralBatches(targetUuid, payload);
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

  function onSubmit(data: SyncBatchesFormValues) {
    const batchUuids = data.batches
      .map((row) => row.batch_uuid?.value)
      .filter((value): value is string => !!value);

    mutation.mutate({
      batch_ids: batchUuids,
      entry_date: data.entry_date as string,
      exit_date: data.exit_date as string,
      diet_id: data.diet_id?.value ?? null,
      feed_intake: data.feed_intake === '' ? null : Number(data.feed_intake),
      expected_adg: Number(data.expected_adg),
    });
  }

  const isSubmitting = mutation.isPending;

  const watchedEntryDate = useWatch({ control, name: 'entry_date' });
  const watchedExitDate = useWatch({ control, name: 'exit_date' });
  const totalDays = calcTotalDays(watchedEntryDate, watchedExitDate);

  const watchedBatches = useWatch({ control, name: 'batches' });
  const watchedExpectedAdg = useWatch({ control, name: 'expected_adg' });
  const usedBatchUuids = useMemo(
    () => new Set((watchedBatches ?? []).map((row) => row.batch_uuid?.value).filter(Boolean)),
    [watchedBatches]
  );

  // TASK-063-MAPA2-04 — resumo de rodapé, mirror `ModalLotes.js:140-159`.
  // `selectedBatchOptions` cruza os lotes selecionados no form (`usedBatchUuids`,
  // já reativo via `watchedBatches`) com as métricas vindas de `batch-options`
  // (`batchOptionsQuery.data`) — nunca recalcula peso/contagem no front.
  const selectedBatchOptions = useMemo(
    () => (batchOptionsQuery.data ?? []).filter((option) => usedBatchUuids.has(option.value)),
    [usedBatchUuids, batchOptionsQuery.data]
  );

  const totalAnimals = selectedBatchOptions.reduce(
    (sum, option) => sum + (option.animals_count || 0),
    0
  );
  const totalStartWeight = selectedBatchOptions.reduce(
    (sum, option) => sum + (option.animals_count || 0) * (option.average_start_weight || 0),
    0
  );
  // mirror `avgStartWeightFloat` legado: default 0 (não `null`) quando não
  // há lote selecionado — "Peso Médio Entrada" sempre mostra número, nunca
  // "—", mesma UX do legado.
  const averageStartWeight = totalAnimals > 0 ? totalStartWeight / totalAnimals : 0;

  const expectedAdgFloat =
    watchedExpectedAdg === '' || watchedExpectedAdg == null ? null : Number(watchedExpectedAdg);
  // "–" (mirror literal `ganhosPrevisto`/`pesoFinalPrevisto` do legado)
  // enquanto GMD Previsto/Total de Dias não estiverem preenchidos.
  const expectedGain =
    expectedAdgFloat !== null && totalDays !== null ? expectedAdgFloat * totalDays : null;
  const postConfinementWeight = expectedGain !== null ? expectedGain + averageStartWeight : null;

  function optionsForRow(currentUuid?: string) {
    return (batchOptionsQuery.data ?? [])
      .filter((option) => option.value === currentUuid || !usedBatchUuids.has(option.value))
      .map((option) => ({ label: option.label, value: option.value }));
  }

  const capacity = corralData?.capacity ?? 0;

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
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <form id="feedlot-corral-batches-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body maxH="70vh" overflowY="auto">
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={4}>
                  <Controller
                    name="entry_date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.entryDate}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                  <Controller
                    name="exit_date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.exitDate}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                  <Field label={text.fields.totalDays}>
                    <Text fontWeight="bold" mt={2}>
                      {totalDays ?? '—'}
                    </Text>
                  </Field>
                  <Controller
                    name="expected_adg"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        name={field.name}
                        label={text.fields.expectedAdg}
                        value={field.value === '' ? null : Number(field.value)}
                        onValueChange={(value) => field.onChange(value ?? '')}
                        allowDot
                        decimalPlaces={2}
                        min={0}
                        error={fieldState.error?.message}
                        isRequired
                      />
                    )}
                  />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
                  <Controller
                    name="diet_id"
                    control={control}
                    render={({ field: { name, value, onChange } }) => (
                      <Select
                        label={text.fields.diet}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={dietOptionsQuery.data ?? []}
                        loading={dietOptionsQuery.isPending}
                      />
                    )}
                  />
                  <Controller
                    name="feed_intake"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        name={field.name}
                        label={text.fields.feedIntake}
                        value={field.value === '' ? null : Number(field.value)}
                        onValueChange={(value) => field.onChange(value ?? '')}
                        allowDot
                        decimalPlaces={2}
                        min={0}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </SimpleGrid>

                {capacity > 0 && usedBatchUuids.size > 0 && (
                  <Box bg="feedBack.warn" borderRadius="md" px={4} py={2} mb={4}>
                    <Text fontSize="sm">
                      {text.capacityWarning.replace('{capacity}', String(capacity))}
                    </Text>
                  </Box>
                )}

                <VStack align="stretch" gap={3}>
                  {fields.map((field, index) => (
                    <FeedlotCorralBatchRow
                      key={field.id}
                      control={control}
                      index={index}
                      label={text.fields.batch}
                      // TASK-063-MAPA2-02 — `field` vem de `useFieldArray` (`fields`),
                      // snapshot ESTÁTICO que só atualiza em append/remove; usar
                      // `field.batch_uuid?.value` aqui fazia a própria opção recém
                      // selecionada sumir da collection no próximo render (comparada
                      // contra `usedBatchUuids`, que É reativo). Fonte correta:
                      // `watchedBatches` (useWatch, reativo), mesmo índice da linha.
                      options={optionsForRow(watchedBatches?.[index]?.batch_uuid?.value)}
                      onRemove={() => remove(index)}
                      removeLabel={text.removeBatch}
                    />
                  ))}
                </VStack>

                {fields.length === 0 && (
                  <Text color="fg.muted" mt={3}>
                    {text.empty}
                  </Text>
                )}

                <Button
                  title={text.addBatch}
                  variant="outline"
                  type="button"
                  mt={4}
                  onClick={() => append({ batch_uuid: null })}
                  disabled={batchOptionsQuery.isPending}
                />
              </Dialog.Body>
            </form>

            <Dialog.Footer justifyContent="space-between" flexWrap="wrap" gap={4}>
              {/* TASK-063-MAPA2-04 — rodapé de resumo, mirror `ModalLotes.js`
                  (`Modal.Footer` legado, `d-flex justify-content-between`). */}
              <Flex gap={5} flexWrap="wrap">
                <Box textAlign="center">
                  <Text fontWeight="bold">{totalAnimals}</Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.summary.animals}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontWeight="bold">{formatNumber(averageStartWeight)}kg</Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.summary.averageStartWeight}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontWeight="bold">
                    {expectedGain !== null ? `${formatNumber(expectedGain)}kg` : '—'}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.summary.expectedGain}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontWeight="bold">
                    {postConfinementWeight !== null
                      ? `${formatNumber(postConfinementWeight)}kg`
                      : '—'}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.summary.postConfinementWeight}
                  </Text>
                </Box>
              </Flex>

              <Flex gap={2}>
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
                  form="feedlot-corral-batches-dialog-form"
                  loading={isSubmitting}
                />
              </Flex>
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
