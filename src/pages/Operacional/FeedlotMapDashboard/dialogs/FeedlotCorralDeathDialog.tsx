// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralDeathDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Lançar Morte — TASK-FE-042-216, `AM18`. Mirror
// `[[09-front-sanitario-morte]]` §2: `animal_id`/`cause_id` (selects sobre
// `.../death-data`), `date` (default hoje), `note` (opcional, max 500).
// `batch_uuid` é resolvido do animal selecionado (`FeedlotCorralDeathAnimalOption`),
// NUNCA um input próprio. Confirmação obrigatória (`DeleteConfirmDialog`,
// tone danger) antes do `createDeathAnimal` (REUSO TOTAL, ação irreversível).
// `photo` NÃO enviado (campo ausente no diálogo do Mapa, `Optional` na
// Action reusada).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { todayLocalIso } from '@/utils/localDate';

import { queryKey } from '@/constants/query-key';

import {
  mapDeathSchemaResolver,
  type MapDeathFormValues,
} from '@/validations/schemas/FeedlotMap/mapDeath-schema';

import { createDeathAnimal } from '@/services/v2/DeathAnimals/death-animal-service';
import { getCorralDeathData } from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { DeathAnimalPayload } from '@/@types/v2/DeathAnimals';
import type { FeedlotCorralDeathAnimalOption } from '@/@types/v2/FeedlotMap/death';

function todayString(): string {
  return todayLocalIso();
}

const EMPTY_VALUES: MapDeathFormValues = {
  animal_id: null,
  cause_id: null,
  date: todayString(),
  note: '',
};

export interface FeedlotCorralDeathDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  onClose: () => void;
}

export function FeedlotCorralDeathDialog({
  isOpen,
  targetUuid,
  onClose,
}: FeedlotCorralDeathDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.death;
  const queryClient = useQueryClient();

  const { control, register, handleSubmit, watch, reset } = useForm<MapDeathFormValues>({
    mode: 'onChange',
    resolver: mapDeathSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const deathDataQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-death-data', targetUuid],
    queryFn: async () => (await getCorralDeathData(targetUuid as string)).data,
    enabled: isOpen && !!targetUuid,
  });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen, targetUuid]);

  const [pendingPayload, setPendingPayload] = useState<DeathAnimalPayload | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: DeathAnimalPayload) => createDeathAnimal(payload),
    onSuccess: () => {
      toaster.success({ title: text.title, description: languageGB.defaltStrings.actionSuccess });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      setPendingPayload(null);
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  const watchedAnimal = watch('animal_id');

  function onSubmit(data: MapDeathFormValues) {
    const animalOption = (deathDataQuery.data?.animals ?? []).find(
      (option): option is FeedlotCorralDeathAnimalOption => option.value === data.animal_id?.value
    );
    if (!animalOption) return;

    setPendingPayload({
      date: data.date as string,
      animal_uuid: animalOption.value,
      batch_uuid: animalOption.batch_uuid,
      cause_uuid: data.cause_id!.value,
      note: data.note || undefined,
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <>
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

              <form id="feedlot-corral-death-dialog-form" onSubmit={handleSubmit(onSubmit)}>
                <Dialog.Body>
                  <SimpleGrid columns={1} gap={4}>
                    <Controller
                      name="animal_id"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.animal}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={deathDataQuery.data?.animals ?? []}
                          error={error?.message}
                          isRequired
                          loading={deathDataQuery.isPending}
                        />
                      )}
                    />
                    <Controller
                      name="cause_id"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.cause}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={deathDataQuery.data?.causes ?? []}
                          error={error?.message}
                          isRequired
                          loading={deathDataQuery.isPending}
                        />
                      )}
                    />
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
                    <Input label={text.fields.note} {...register('note')} maxLength={500} />
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
                  form="feedlot-corral-death-dialog-form"
                  loading={isSubmitting}
                  disabled={!watchedAnimal}
                />
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <DeleteConfirmDialog
        isOpen={pendingPayload !== null}
        onClose={() => setPendingPayload(null)}
        onConfirm={() => pendingPayload && mutation.mutate(pendingPayload)}
        isLoading={isSubmitting}
        title={text.confirm.title}
        description={text.confirm.description}
        hideQuestionMark
        tone="danger"
      />
    </>
  );
}
