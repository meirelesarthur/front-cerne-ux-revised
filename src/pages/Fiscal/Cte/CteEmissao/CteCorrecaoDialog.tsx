// src/pages/Fiscal/Cte/CteEmissao/CteCorrecaoDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Carta de Correção" (S27-S29, D18-D20 — execução 045, Onda 2,
// TASK-CTE-FE-11). `Dialog.Root` v3 completo (Portal+Backdrop+Positioner),
// mirror estrutural `NfeEmitModal.tsx`/`NfeMotivoModal.tsx` — `isOpen`/
// `onClose` vêm do PAI (`CteEmissao/index.tsx`, via `useDisclosure`), a
// `mutation` também é instanciada no pai (`actionSuccess` fecha o dialog).
//
// Campos: `grupo` (Select, LK20 — `cteGrupoCorrecaoOptions`, estático),
// `campo` (Input, `required|max:255` — `CorrectCteRequest::rules()`),
// `motivo` (Textarea, `required|min:15|max:1000`, `cte-correcao-schema.ts`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';

import type { useRequest } from '@/hooks/useRequest';

import { cteGrupoCorrecaoOptions } from '@/constants/Fiscal/cte/options/cte-grupo-correcao-options';

import { cteCorrecaoSchemaResolver } from '@/validations/schemas/Fiscal/cte-correcao-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  CorrigirCteRequest,
  CorrigirCteResult,
  CteCorrecaoFormValues,
} from '@/@types/v2/Fiscal/cteEmissao';

export interface CteCorrecaoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  languageGB: LanguageDate;
  mutation: ReturnType<typeof useRequest<CorrigirCteResult>>;
  onConfirm: (payload: CorrigirCteRequest) => void;
}

const DEFAULT_VALUES: CteCorrecaoFormValues = { grupo: null, campo: '', motivo: '' };

export function CteCorrecaoDialog({
  isOpen,
  onClose,
  languageGB,
  mutation,
  onConfirm,
}: CteCorrecaoDialogProps) {
  const text = languageGB.ctes.cte.emission.correcaoDialog;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CteCorrecaoFormValues>({
    mode: 'onChange',
    resolver: cteCorrecaoSchemaResolver(languageGB),
    defaultValues: DEFAULT_VALUES,
  });

  // Reabertura do dialog — form nasce limpo a cada vez (mirror
  // `NfeEmitModal`, o `Dialog` não desmonta o `Content` entre aberturas).
  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  function submit(data: CteCorrecaoFormValues) {
    if (!data.grupo?.value) return;
    onConfirm({ grupo: data.grupo.value, campo: data.campo, motivo: data.motivo });
  }

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) handleClose();
      }}
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

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" color="fg.muted">
                  {text.description}
                </Text>

                <Controller
                  name="grupo"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.grupoLabel}
                      placeholder={text.grupoPlaceholder}
                      name={name}
                      value={value}
                      onChange={onChange}
                      options={cteGrupoCorrecaoOptions.options()}
                      error={error?.message}
                      isRequired
                      isDisabled={mutation.isPending}
                      disablePortal
                    />
                  )}
                />

                <Input
                  label={text.campoLabel}
                  maxLength={255}
                  {...register('campo')}
                  error={errors.campo?.message}
                  isRequired
                  disabled={mutation.isPending}
                />

                <Textarea
                  label={text.motivoLabel}
                  placeholder={text.motivoPlaceholder}
                  isRequired
                  maxLength={1000}
                  disabled={mutation.isPending}
                  error={errors.motivo?.message}
                  {...register('motivo')}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
              />
              <Button
                title={text.confirmButton}
                type="button"
                onClick={handleSubmit(submit)}
                loading={mutation.isPending}
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

export default CteCorrecaoDialog;
