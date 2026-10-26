// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralDatesDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Atualizar Datas/GMD previsto — TASK-FE-042-211, `AM16`. Mirror
// `IG22`: update direto, SEM histórico dedicado, sem confirmação extra.
// `entry_date`/`exit_date`/`expected_adg` nullable (aceitam vazio, mirror
// legado — sem forçar preenchimento). `total_days` é derivado no front
// (`InputReadOnly`), mirror `FeedlotCorralBatchesDialog.calcTotalDays`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  updateCorralDatesSchemaResolver,
  type UpdateCorralDatesFormValues,
} from '@/validations/schemas/FeedlotMap/updateCorralDates-schema';

import { updateCorralDates } from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { CorralCardData } from '@/@types/v2/FeedlotMap';
import type { UpdateCorralDatesRequest } from '@/@types/v2/FeedlotMap/batches';

const EMPTY_VALUES: UpdateCorralDatesFormValues = {
  entry_date: null,
  exit_date: null,
  expected_adg: '',
};

function calcTotalDays(entryDate: string | null, exitDate: string | null): number | null {
  if (!entryDate || !exitDate) return null;
  const diff = Math.round(
    (new Date(exitDate).getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? diff : null;
}

export interface FeedlotCorralDatesDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  corralData?: CorralCardData;
  onClose: () => void;
}

export function FeedlotCorralDatesDialog({
  isOpen,
  targetUuid,
  corralData,
  onClose,
}: FeedlotCorralDatesDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.dates;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<UpdateCorralDatesFormValues>({
    mode: 'onChange',
    resolver: updateCorralDatesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      entry_date: corralData?.entry_date ?? null,
      exit_date: corralData?.exit_date ?? null,
      expected_adg: corralData?.expected_adg ?? '',
    });
  }, [isOpen, targetUuid]);

  const mutation = useMutation({
    mutationFn: async (payload: UpdateCorralDatesRequest) => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return updateCorralDates(targetUuid, payload);
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

  function onSubmit(data: UpdateCorralDatesFormValues) {
    mutation.mutate({
      entry_date: data.entry_date || null,
      exit_date: data.exit_date || null,
      expected_adg: data.expected_adg === '' ? null : Number(data.expected_adg),
    });
  }

  const isSubmitting = mutation.isPending;

  const watchedEntryDate = useWatch({ control, name: 'entry_date' });
  const watchedExitDate = useWatch({ control, name: 'exit_date' });
  const totalDays = calcTotalDays(watchedEntryDate, watchedExitDate);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="sm"
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

            <form id="feedlot-corral-dates-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Controller
                    name="entry_date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field label={text.fields.entryDate} errorText={fieldState.error?.message}>
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                  <Controller
                    name="exit_date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field label={text.fields.exitDate} errorText={fieldState.error?.message}>
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                  <InputReadOnly
                    label={text.fields.totalDays}
                    value={totalDays !== null ? String(totalDays) : '—'}
                  />
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
                      />
                    )}
                  />
                </SimpleGrid>
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
                form="feedlot-corral-dates-dialog-form"
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
