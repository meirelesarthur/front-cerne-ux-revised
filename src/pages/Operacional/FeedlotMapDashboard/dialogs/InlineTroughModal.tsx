// src/pages/Operacional/FeedlotMapDashboard/dialogs/InlineTroughModal.tsx
// -----------------------------------------------------------------------------
// Sub-modal "Novo Cocho" (Model C.5, `S010`) — chamado de dentro do diálogo
// de Curral (`FeedlotCorralDialog.tsx`, botão "+" ao lado do select de
// `trough_uuid`). Mirror EXATO de `NewBatchModal.tsx` (2 `Dialog.Root`
// empilhados, Chakra v3 suporta nativamente) — REUSO 100% de `createTrough`/
// `troughSchemaResolver` (já em produção, `CreateOrUpdateTrough.tsx`).
// Campos (`FM028-032`, exceto `code` gerado): `type` (A/B), `description`,
// `total_area` (cm), `is_enabled` (default Sim). `area_uuid`/`grazing_uuid`/
// `feedlot_corral_uuid` ficam de fora do payload (schema aceita nulo) — o
// vínculo com ESTE curral é feito pelo próprio `trough_uuid` selecionado no
// formulário pai, não por este sub-modal.
//
// Ao salvar, `onCreated(option)` popula o select do pai e fecha SÓ o
// sub-modal — o diálogo de Curral permanece aberto (`SE18`/`SE19`).
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

import { troughTypeOptions } from '@/constants/Trough/options/trough-type-options';

import { troughSchemaResolver } from '@/validations/schemas/BaseRegistrations/troughs-schema';

import { createTrough } from '@/services/v2/BaseRegistrations/troughs-service';

import type { Option } from '@/@types/option';
import type { TroughPayload, TroughType } from '@/@types/v2/BaseRegistrations/troughs';

interface InlineTroughFormValues {
  type: TroughType | '';
  description: string;
  total_area: number | '';
  area_uuid: string | null;
  grazing_uuid: string | null;
  feedlot_corral_uuid: string | null;
  is_enabled: boolean;
}

const EMPTY_VALUES: InlineTroughFormValues = {
  type: '',
  description: '',
  total_area: '',
  area_uuid: null,
  grazing_uuid: null,
  feedlot_corral_uuid: null,
  is_enabled: true,
};

export interface InlineTroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (option: { uuid: string; description: string }) => void;
}

export function InlineTroughModal({ isOpen, onClose, onCreated }: InlineTroughModalProps) {
  const { languageGB } = useLanguage();
  const troughText = languageGB.baseRegistrations.trough;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InlineTroughFormValues>({
    mode: 'onChange',
    resolver: troughSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(EMPTY_VALUES);
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload: TroughPayload) => createTrough(payload),
    onSuccess: (response) => {
      toaster.success({
        title: languageGB.feedlotMap.feedlotMap.corral.fields.trough,
        description: languageGB.defaltStrings.actionSuccess,
      });
      onCreated({ uuid: response.data.uuid, description: response.data.description });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: languageGB.feedlotMap.feedlotMap.corral.fields.trough,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: InlineTroughFormValues) {
    mutation.mutate({
      type: data.type as TroughType,
      description: data.description.trim(),
      total_area: Number(data.total_area),
      is_enabled: data.is_enabled,
    });
  }

  const isSubmitting = mutation.isPending;
  const typeOptions = troughTypeOptions.options(languageGB);
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
              <Dialog.Title>{languageGB.feedlotMap.feedlotMap.corral.addTrough}</Dialog.Title>
            </Dialog.Header>

            <form id="inline-trough-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={1} gap={4}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={troughText.form.fields.type}
                        name={name}
                        value={typeOptions.find((option) => option.value === value) ?? null}
                        onChange={(option: Option<TroughType> | null) =>
                          onChange(option?.value ?? '')
                        }
                        options={typeOptions}
                        error={error?.message}
                        isRequired
                      />
                    )}
                  />

                  <Input
                    label={troughText.form.fields.description}
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
                        label={troughText.form.fields.totalArea}
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
                    name="is_enabled"
                    control={control}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={troughText.form.fields.active}
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
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              <Button
                title={languageGB.defaltStrings.save}
                type="submit"
                form="inline-trough-form"
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
