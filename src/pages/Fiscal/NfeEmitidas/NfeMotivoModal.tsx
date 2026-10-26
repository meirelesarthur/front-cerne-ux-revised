// src/pages/Fiscal/NfeEmitidas/NfeMotivoModal.tsx
// -----------------------------------------------------------------------------
// Modal de "motivo" — reusado por Cancelar (TASK-FE-036-513) e Corrigir
// (Carta de Correção, TASK-FE-036-513). Mirror estrutural `NfeEmitModal.tsx`
// (Dialog v3 headless; a `mutation` é instanciada no host —
// `NfeEmissionPanel.tsx` — cujo `actionSuccess` fecha este modal).
//
// `motivo` é `required` + `minLength` 15 + `maxLength` por evento (cancelar 255,
// CC-e 1000) — mirror 1:1 `NfeEventRequest::rules()` (UT-000748 / P-07 /
// T-748-API-02; supera o antigo "sem min" do DEC-118). Os limites vêm do host
// (`nfe-event-limits.ts`). 422 de campo (`fieldError`) vai para o campo e 422
// de negócio (`serverError`, ex.: emissor sem ambiente) para um alerta dentro
// do modal, que permanece aberto no erro.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Flex, Portal, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Textarea } from '@/components/Form/Textarea';

import type { useRequest } from '@/hooks/useRequest';

import type { NfeEmissionResult } from '@/@types/v2/Nfes';

interface MotivoFormValues {
  motivo: string;
}

export interface NfeMotivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  motivoLabel: string;
  motivoPlaceholder: string;
  motivoRequiredMessage: string;
  minLength: number;
  maxLength: number;
  minLengthMessage: string;
  maxLengthMessage: string;
  helperText: string;
  /** Erro 422 do campo `motivo` devolvido pela API (mapeado no campo). */
  fieldError?: string;
  /** Erro de negócio (422 sem campo) exibido num alerta dentro do modal. */
  serverError?: string;
  confirmLabel: string;
  cancelLabel: string;
  mutation: ReturnType<typeof useRequest<NfeEmissionResult>>;
  onConfirm: (motivo: string) => void;
}

export function NfeMotivoModal({
  isOpen,
  onClose,
  title,
  description,
  motivoLabel,
  motivoPlaceholder,
  motivoRequiredMessage,
  minLength,
  maxLength,
  minLengthMessage,
  maxLengthMessage,
  helperText,
  fieldError,
  serverError,
  confirmLabel,
  cancelLabel,
  mutation,
  onConfirm,
}: NfeMotivoModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MotivoFormValues>({ mode: 'onChange', defaultValues: { motivo: '' } });

  useEffect(() => {
    if (fieldError) setError('motivo', { type: 'server', message: fieldError });
  }, [fieldError, setError]);

  function submit(data: MotivoFormValues) {
    onConfirm(data.motivo);
  }

  function handleClose() {
    reset({ motivo: '' });
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
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" color="fg.muted">
                  {description}
                </Text>

                <Textarea
                  label={motivoLabel}
                  placeholder={motivoPlaceholder}
                  isRequired
                  maxLength={maxLength}
                  helperText={helperText}
                  disabled={mutation.isPending}
                  error={errors.motivo?.message}
                  {...register('motivo', {
                    required: motivoRequiredMessage,
                    minLength: { value: minLength, message: minLengthMessage },
                    maxLength: { value: maxLength, message: maxLengthMessage },
                  })}
                />

                {serverError && (
                  <Flex
                    role="alert"
                    p={3}
                    bg="red.500/10"
                    border="1px solid"
                    borderColor="red.500/30"
                    borderRadius="lg"
                  >
                    <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                      {serverError}
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={cancelLabel}
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
              />
              <Button
                title={confirmLabel}
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
