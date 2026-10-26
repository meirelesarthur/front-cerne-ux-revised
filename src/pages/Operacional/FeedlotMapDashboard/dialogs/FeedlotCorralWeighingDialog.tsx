// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralWeighingDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Pesagem Manual — TASK-FE-042-213/214, `FM062-071`. Tabela com 1
// linha por animal ativo do curral, célula `current_weight` editável com
// propagação para linhas seguintes ainda vazias (`propagateWeightToEmptyRows`,
// variante tipada local de `propagateToEmptyRows.ts` — mesma lógica, campo
// diferente, decisão de implementação da Tarefa). Painel de importação
// (`TASK-FE-042-214`, `FeedlotWeighingImportPanel`) hidrata a MESMA tabela
// via `handleWeightsParsed`. Submit único (`saveMultipleWeighings`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Dialog, Portal, Table, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { todayLocalIso } from '@/utils/localDate';

import { queryKey } from '@/constants/query-key';

import {
  multipleWeighingsSchemaResolver,
  type MultipleWeighingsFormValues,
} from '@/validations/schemas/FeedlotMap/multipleWeighings-schema';

import {
  getCorralAnimalsForWeighing,
  saveMultipleWeighings,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type {
  SaveMultipleWeighingsRequest,
  WeighingParseResultItem,
} from '@/@types/v2/FeedlotMap/weighing';

import { FeedlotWeighingImportPanel } from './FeedlotWeighingImportPanel';
import { FeedlotWeighingRow } from './FeedlotWeighingRow';

function todayString(): string {
  return todayLocalIso();
}

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export interface FeedlotCorralWeighingDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  onClose: () => void;
}

export function FeedlotCorralWeighingDialog({
  isOpen,
  targetUuid,
  onClose,
}: FeedlotCorralWeighingDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.weighing;
  const queryClient = useQueryClient();

  const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { control, handleSubmit, reset, getValues, setValue, formState } =
    useForm<MultipleWeighingsFormValues>({
      mode: 'onSubmit',
      resolver: multipleWeighingsSchemaResolver(languageGB) as any,
      defaultValues: { date: todayString(), rows: [] },
    });

  const { fields } = useFieldArray({ control, name: 'rows' });

  const animalsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-weighing-animals', targetUuid],
    queryFn: async () => (await getCorralAnimalsForWeighing(targetUuid as string)).data,
    enabled: isOpen && !!targetUuid,
  });

  useEffect(() => {
    if (!isOpen) return;
    setIsImportPanelOpen(false);
    reset({
      date: todayString(),
      rows: (animalsQuery.data ?? []).map((animal) => ({
        animal_uuid: animal.animal_uuid,
        identification: animal.identification,
        batch_description: animal.batch_description,
        last_weighing_date: animal.last_weighing_date,
        last_weight: animal.last_weight,
        current_weight: null,
      })),
    });
  }, [isOpen, targetUuid, animalsQuery.data]);

  function propagateWeightToEmptyRows(currentIndex: number, value: number | null) {
    const total = getValues('rows').length;
    for (let index = currentIndex + 1; index < total; index += 1) {
      const currentValue = getValues(`rows.${index}.current_weight`);
      if (currentValue === null || currentValue === undefined) {
        setValue(`rows.${index}.current_weight`, value, { shouldDirty: true });
      }
    }
  }

  function handleWeightChange(index: number, value: number | null) {
    setValue(`rows.${index}.current_weight`, value, { shouldDirty: true });
    propagateWeightToEmptyRows(index, value);
  }

  function handleWeightsParsed(items: WeighingParseResultItem[]) {
    const rows = getValues('rows');
    items.forEach((item) => {
      const index = rows.findIndex((row) => row.animal_uuid === item.animal_uuid);
      if (index >= 0) handleWeightChange(index, item.weight);
    });
  }

  function handleTabFromLast(event: React.KeyboardEvent<HTMLInputElement>) {
    event.preventDefault();
    inputRefs.current[0]?.focus();
  }

  const mutation = useMutation({
    mutationFn: async (payload: SaveMultipleWeighingsRequest) => saveMultipleWeighings(payload),
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

  function onSubmit(data: MultipleWeighingsFormValues) {
    const applicableRows = data.rows.filter((row) => (row.current_weight ?? 0) > 0);
    mutation.mutate({
      animal_uuids: applicableRows.map((row) => row.animal_uuid),
      weights: applicableRows.map((row) => Number(row.current_weight)),
      date: data.date as string,
    });
  }

  const isSubmitting = mutation.isPending;

  const watchedDate = useWatch({ control, name: 'date' });
  const watchedRows = useWatch({ control, name: 'rows' });

  const averages = useMemo(() => {
    const applicable = (watchedRows ?? []).filter((row) => (row.current_weight ?? 0) > 0);
    if (applicable.length === 0) return { weight: null, gain: null };
    const avgWeight =
      applicable.reduce((sum, row) => sum + (row.current_weight ?? 0), 0) / applicable.length;
    const gains = applicable
      .filter((row) => row.last_weight !== null)
      .map((row) => (row.current_weight ?? 0) - (row.last_weight ?? 0));
    const avgGain =
      gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / gains.length : null;
    return { weight: avgWeight, gain: avgGain };
  }, [watchedRows]);

  return (
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
          <Dialog.Content maxW={{ base: '95vw', xl: '72rem' }}>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <form id="feedlot-corral-weighing-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body maxH="70vh" overflowY="auto">
                <Box mb={4} display="flex" gap={3} alignItems="flex-end">
                  <Box minW="180px">
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <Field label={text.title} isRequired>
                          <DateInput value={field.value} onChange={field.onChange} />
                        </Field>
                      )}
                    />
                  </Box>
                  <Button
                    title={text.importToggle}
                    variant="outline"
                    type="button"
                    onClick={() => setIsImportPanelOpen((prev) => !prev)}
                    disabled={!targetUuid}
                  />
                </Box>

                {isImportPanelOpen && targetUuid && (
                  <FeedlotWeighingImportPanel
                    corralUuid={targetUuid}
                    onWeightsParsed={handleWeightsParsed}
                  />
                )}

                {formState.errors.rows?.message && (
                  <Text color="fg.error" fontSize="sm" mb={2}>
                    {formState.errors.rows.message}
                  </Text>
                )}

                {fields.length === 0 ? (
                  <Text color="fg.muted">{text.empty}</Text>
                ) : (
                  <Table.ScrollArea borderWidth="1px" borderRadius="md">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>{text.columns.identification}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.batch}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.lastWeighingDate}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.lastWeight}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.currentWeight}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.gain}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.days}</Table.ColumnHeader>
                          <Table.ColumnHeader>{text.columns.gmd}</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {fields.map((field, index) => (
                          <FeedlotWeighingRow
                            key={field.id}
                            control={control}
                            index={index}
                            isLast={index === fields.length - 1}
                            weighingDate={watchedDate}
                            onWeightChange={handleWeightChange}
                            registerInputRef={(rowIndex, el) => {
                              inputRefs.current[rowIndex] = el;
                            }}
                            onTabFromLast={handleTabFromLast}
                            languageGB={languageGB}
                          />
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Table.ScrollArea>
                )}

                {fields.length > 0 && (
                  <Box mt={3} display="flex" gap={6}>
                    <Text fontSize="sm">
                      {text.averageCurrentWeight}: {formatNumber(averages.weight, 2)}
                    </Text>
                    <Text fontSize="sm">
                      {text.averageGain}: {formatNumber(averages.gain, 2)}
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
                form="feedlot-corral-weighing-dialog-form"
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
