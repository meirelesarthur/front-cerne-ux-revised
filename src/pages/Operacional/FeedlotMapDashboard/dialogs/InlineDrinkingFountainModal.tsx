// src/pages/Operacional/FeedlotMapDashboard/dialogs/InlineDrinkingFountainModal.tsx
// -----------------------------------------------------------------------------
// Sub-modal "Novo Bebedouro" (Model C.5, `S011`) — chamado de dentro do
// diálogo de Curral (`FeedlotCorralDialog.tsx`, botão "+" ao lado do select
// de `drinking_fountain_uuid`). Mirror EXATO de `InlineTroughModal.tsx`
// (mesmo Model C.5) — REUSO 100% de `createDrinkingFountain`/
// `drinkingFountainSchemaResolver` (já em produção). Campos (`FM033-038`,
// exceto `code` gerado): `type` (A/B), `description`, `total_area` (L),
// `length` (cm, opcional), `is_enabled` (default Sim).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { drinkingFountainSchemaResolver } from '@/validations/schemas/BaseRegistrations/drinkingFountains-schema';

import { createDrinkingFountain } from '@/services/v2/BaseRegistrations/drinking-fountains-service';

import type { Option } from '@/@types/option';
import type {
  DrinkingFountainPayload,
  DrinkingFountainType,
} from '@/@types/v2/BaseRegistrations/drinking-fountains';

interface InlineDrinkingFountainFormValues {
  type: DrinkingFountainType | '';
  description: string;
  total_area: number | '';
  length: number | '' | null;
  area_uuid: string | null;
  grazing_uuid: string | null;
  feedlot_corral_uuid: string | null;
  is_enabled: boolean;
}

const EMPTY_VALUES: InlineDrinkingFountainFormValues = {
  type: '',
  description: '',
  total_area: '',
  length: null,
  area_uuid: null,
  grazing_uuid: null,
  feedlot_corral_uuid: null,
  is_enabled: true,
};

export interface InlineDrinkingFountainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (option: { uuid: string; description: string }) => void;
}

export function InlineDrinkingFountainModal({
  isOpen,
  onClose,
  onCreated,
}: InlineDrinkingFountainModalProps) {
  const { languageGB } = useLanguage();
  const drinkingFountainText = languageGB.baseRegistrations.drinkingFountain;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InlineDrinkingFountainFormValues>({
    mode: 'onChange',
    resolver: drinkingFountainSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload: DrinkingFountainPayload) => createDrinkingFountain(payload),
    onSuccess: (response) => {
      toaster.success({
        title: languageGB.feedlotMap.feedlotMap.corral.fields.drinkingFountain,
        description: languageGB.defaltStrings.actionSuccess,
      });
      onCreated({ uuid: response.data.uuid, description: response.data.description });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: languageGB.feedlotMap.feedlotMap.corral.fields.drinkingFountain,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: InlineDrinkingFountainFormValues) {
    mutation.mutate({
      type: data.type as DrinkingFountainType,
      description: data.description.trim(),
      total_area: Number(data.total_area),
      length: data.length === '' || data.length === null ? null : Number(data.length),
      is_enabled: data.is_enabled,
    });
  }

  const isSubmitting = mutation.isPending;
  const typeOptions: Option<DrinkingFountainType>[] = [
    { value: 'A', label: drinkingFountainText.typeOptions.covered },
    { value: 'B', label: drinkingFountainText.typeOptions.uncovered },
  ];
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

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
              <Dialog.Title>
                {languageGB.feedlotMap.feedlotMap.corral.addDrinkingFountain}
              </Dialog.Title>
            </Dialog.Header>

            <form id="inline-drinking-fountain-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={drinkingFountainText.form.fields.type}
                        name={name}
                        value={typeOptions.find((option) => option.value === value) ?? null}
                        onChange={(option: Option<DrinkingFountainType> | null) =>
                          onChange(option?.value ?? '')
                        }
                        options={typeOptions}
                        error={error?.message}
                        isRequired
                      />
                    )}
                  />

                  <Input
                    label={drinkingFountainText.form.fields.description}
                    {...register('description')}
                    error={errors.description?.message}
                    isRequired
                  />

                  <Controller
                    name="total_area"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        name={field.name}
                        label={drinkingFountainText.form.fields.totalArea}
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

                  <Controller
                    name="length"
                    control={control}
                    render={({ field, fieldState }) => (
                      <NumberInput
                        name={field.name}
                        label={drinkingFountainText.form.fields.length}
                        value={
                          field.value === '' || field.value == null ? null : Number(field.value)
                        }
                        onValueChange={(value) => field.onChange(value ?? null)}
                        allowDot
                        decimalPlaces={2}
                        min={0}
                        error={fieldState.error?.message}
                      />
                    )}
                  />

                  <Controller
                    name="is_enabled"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={drinkingFountainText.form.fields.active}
                        name={name}
                        value={booleanOptions.find((option) => option.value === value) ?? null}
                        onChange={(option: Option<boolean> | null) => onChange(!!option?.value)}
                        options={booleanOptions}
                        error={error?.message}
                        isRequired
                        noClearable
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
                form="inline-drinking-fountain-form"
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
