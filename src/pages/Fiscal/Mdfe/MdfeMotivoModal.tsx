// src/pages/Fiscal/Mdfe/MdfeMotivoModal.tsx
// -----------------------------------------------------------------------------
// Modal de "motivo" do Cancelamento SEFAZ — TASK-MDFE-FE-09
// (`CONTRATO-FRONT-MDFE.md §8`). Mirror ESTRUTURAL de
// `NfeEmitidas/NfeMotivoModal.tsx` (Dialog v3 headless; a `mutation` é
// instanciada no host — `MdfeEmissionPanel.tsx` — cujo `actionSuccess` fecha
// este modal).
//
// **Avaliação de reuso feita antes de escrever este arquivo** (task-packet
// pede para avaliar reuso direto de `NfeMotivoModal.tsx` antes de clonar):
// NÃO é seguro reusar o componente Nfe sem alteração — 2 motivos concretos:
//   1. `NfeMotivoModal` tipa `mutation: ReturnType<typeof useRequest<NfeEmissionResult>>`
//      (acoplado ao shape de retorno de Nfe); aqui a mutação retorna `MdfeData`.
//   2. A REGRA DE VALIDAÇÃO DIVERGE por decisão de fidelidade: Nfe usa
//      `required + maxLength:255` SEM mínimo (`DEC-118` — o legado de Nfe
//      nunca validou tamanho mínimo); MDFe exige `required + min:15` SOMENTE
//      client-side (mirror `IG-023`/`FD089` do legado MDFe — o backend novo
//      repassa à SEFAZ sem validar tamanho, então o front não pode inventar
//      um 422 que o servidor não tem). Generalizar o componente Nfe para
//      aceitar as duas regras simultaneamente arriscaria vazar a validação
//      errada para o módulo errado — mirror ESTRUTURAL (mesma anatomia
//      Dialog v3 + react-hook-form), NÃO compartilhamento de código.
// -----------------------------------------------------------------------------

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Textarea } from '@/components/Form/Textarea';

import type { useRequest } from '@/hooks/useRequest';

import type { MdfeData } from '@/@types/v2/Fiscal/Mdfe';

const MOTIVO_MIN_LENGTH = 15;

interface MotivoFormValues {
  motivo: string;
}

export interface MdfeMotivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  motivoLabel: string;
  motivoPlaceholder: string;
  motivoRequiredMessage: string;
  motivoMinLengthMessage: string;
  confirmLabel: string;
  cancelLabel: string;
  mutation: ReturnType<typeof useRequest<MdfeData>>;
  onConfirm: (motivo: string) => void;
}

export function MdfeMotivoModal({
  isOpen,
  onClose,
  title,
  description,
  motivoLabel,
  motivoPlaceholder,
  motivoRequiredMessage,
  motivoMinLengthMessage,
  confirmLabel,
  cancelLabel,
  mutation,
  onConfirm,
}: MdfeMotivoModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MotivoFormValues>({ mode: 'onChange', defaultValues: { motivo: '' } });

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
                  disabled={mutation.isPending}
                  error={errors.motivo?.message}
                  {...register('motivo', {
                    required: motivoRequiredMessage,
                    minLength: { value: MOTIVO_MIN_LENGTH, message: motivoMinLengthMessage },
                  })}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={cancelLabel}
                variant="outline"
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
