// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralDietDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Alterar Dieta — TASK-FE-042-212, `AM17`, `R28`. Mirror
// `[[07-front-lotes-sync-transfer]]` §5: `date` (default hoje), `diet_id`
// (`Select` sobre `diets/diet-options`, REUSO), `feed_intake` — os 2 últimos
// obrigatórios (`D09`, servidor exige apesar de "opcional" no legado).
//
// `diet_id` É pré-selecionado com a dieta atual do curral (`corral.diet`
// {uuid,label}, GAP-FE-242 RESOLVIDO na API); curral sem dieta → vazio e a
// obrigatoriedade segue valendo. `date`/`feed_intake` também são hidratados
// (hoje / valor atual). Reset a cada abertura/troca de curral.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { todayLocalIso } from '@/utils/localDate';

import { queryKey } from '@/constants/query-key';

import {
  corralDietHistorySchemaResolver,
  type CorralDietHistoryFormValues,
} from '@/validations/schemas/FeedlotMap/corralDietHistory-schema';

import { listDietOptions } from '@/services/v2/Diets/diet-service';
import { createCorralDietHistory } from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { CorralCardData } from '@/@types/v2/FeedlotMap';
import type { CreateCorralDietHistoryRequest } from '@/@types/v2/FeedlotMap/diet';

function todayString(): string {
  return todayLocalIso();
}

const EMPTY_VALUES: CorralDietHistoryFormValues = {
  date: todayString(),
  diet_id: null,
  feed_intake: '',
};

export interface FeedlotCorralDietDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  corralData?: CorralCardData;
  onClose: () => void;
}

export function FeedlotCorralDietDialog({
  isOpen,
  targetUuid,
  corralData,
  onClose,
}: FeedlotCorralDietDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.diet;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<CorralDietHistoryFormValues>({
    mode: 'onChange',
    resolver: corralDietHistorySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const dietOptionsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'diet-options'],
    queryFn: () => listDietOptions(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      date: todayString(),
      diet_id: corralData?.diet
        ? { value: corralData.diet.uuid, label: corralData.diet.label }
        : null,
      feed_intake: corralData?.feed_intake ?? '',
    });
  }, [isOpen, targetUuid]);

  const mutation = useMutation({
    mutationFn: async (payload: CreateCorralDietHistoryRequest) => createCorralDietHistory(payload),
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

  function onSubmit(data: CorralDietHistoryFormValues) {
    if (!targetUuid) return;
    mutation.mutate({
      feedlot_corral_uuid: targetUuid,
      date: data.date as string,
      diet_id: data.diet_id!.value,
      feed_intake: Number(data.feed_intake),
    });
  }

  const isSubmitting = mutation.isPending;

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

            <form id="feedlot-corral-diet-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.date}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput value={field.value} onChange={field.onChange} />
                      </Field>
                    )}
                  />
                  <Controller
                    name="diet_id"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={text.fields.diet}
                        name={name}
                        value={value}
                        onChange={onChange}
                        options={dietOptionsQuery.data ?? []}
                        error={error?.message}
                        isRequired
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
                        isRequired
                      />
                    )}
                  />
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
                form="feedlot-corral-diet-dialog-form"
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
