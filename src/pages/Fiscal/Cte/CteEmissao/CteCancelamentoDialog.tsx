// src/pages/Fiscal/Cte/CteEmissao/CteCancelamentoDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Cancelamento" (S30-S32, D21 — execução 045, Onda 2,
// TASK-CTE-FE-11). `Dialog.Root` v3 completo (Portal+Backdrop+Positioner),
// mirror estrutural `CteCorrecaoDialog.tsx`/`NfeMotivoModal.tsx` — `isOpen`/
// `onClose` vêm do PAI (`CteEmissao/index.tsx`), a `mutation` também é
// instanciada no pai (`actionSuccess` fecha o dialog).
//
// Campo único: `motivo` (Textarea, `required|min:15|max:1000` —
// `CancelCteRequest::rules()`, `cte-cancelamento-schema.ts`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Textarea } from '@/components/Form/Textarea';

import type { useRequest } from '@/hooks/useRequest';

import { cteCancelamentoSchemaResolver } from '@/validations/schemas/Fiscal/cte-cancelamento-schema';

import type { LanguageDate } from '@/@types/language';
import type { CteData } from '@/@types/v2/Fiscal/cte';
import type { CancelarCteRequest, CteCancelamentoFormValues } from '@/@types/v2/Fiscal/cteEmissao';

export interface CteCancelamentoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  languageGB: LanguageDate;
  mutation: ReturnType<typeof useRequest<CteData>>;
  onConfirm: (payload: CancelarCteRequest) => void;
}

const DEFAULT_VALUES: CteCancelamentoFormValues = { motivo: '' };

export function CteCancelamentoDialog({
  isOpen,
  onClose,
  languageGB,
  mutation,
  onConfirm,
}: CteCancelamentoDialogProps) {
  const text = languageGB.ctes.cte.emission.cancelamentoDialog;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CteCancelamentoFormValues>({
    mode: 'onChange',
    resolver: cteCancelamentoSchemaResolver(languageGB),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isOpen) reset(DEFAULT_VALUES);
  }, [isOpen, reset]);

  function submit(data: CteCancelamentoFormValues) {
    onConfirm({ motivo: data.motivo });
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
                variant="outline"
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

export default CteCancelamentoDialog;
