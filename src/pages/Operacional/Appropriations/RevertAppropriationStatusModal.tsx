// src/pages/Operacional/Appropriations/RevertAppropriationStatusModal.tsx
// -----------------------------------------------------------------------------
// Modal "Voltar Status" (componente NOVO, TASK-FE-2706, reutilizado por
// `TASK-FE-2710`/`TASK-FE-2712`) — form dentro de `Dialog` (mirror
// `CadastrosBase/Depreciacao/GerarDepreciacaoModal.tsx`, "form dentro de
// Dialog com RHF + submit condicionado à validação" — não existia um modal
// "Voltar Status" prévio na SPA).
//
// Client-side, `F→O` e `A→F` são os 2 únicos destinos possíveis — o "novo
// status" é CALCULADO a partir do atual (`APPROPRIATION_STATUS_META`,
// `appropriationStatus.ts`), nunca pedido via Select (a API não recebe
// `new_status`, só `observation` — o backend decide o destino pela máquina
// de estados, `RevertAppropriationStatusRequest`). `status=O` é o piso da
// máquina — o caller não deve abrir este modal nesse caso (defensivamente,
// o submit fica desabilitado se não houver `nextStatus`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import type { AppropriationStatusValue } from '@/@types/v2/Appropriations';

import { APPROPRIATION_STATUS_META, getAppropriationStatusLegend } from './appropriationStatus';
import { useRevertAppropriationStatus } from './useAppropriations';

export interface RevertAppropriationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  appropriationUuid?: string;
  currentStatus?: AppropriationStatusValue;
  onSuccess?: () => void;
}

interface RevertStatusFormValues {
  observation: string;
}

export function RevertAppropriationStatusModal({
  isOpen,
  onClose,
  appropriationUuid,
  currentStatus,
  onSuccess,
}: RevertAppropriationStatusModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.appropriations.appropriation.revertStatusModal;
  const legend = getAppropriationStatusLegend(languageGB);

  const nextStatus = currentStatus
    ? APPROPRIATION_STATUS_META[currentStatus].nextStatusOnRevert
    : null;
  const currentStatusLabel = legend.find((item) => item.status === currentStatus)?.label ?? '—';
  const newStatusLabel = legend.find((item) => item.status === nextStatus)?.label ?? '—';

  const { register, handleSubmit, reset, watch } = useForm<RevertStatusFormValues>({
    defaultValues: { observation: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ observation: '' });
  }, [isOpen]);

  const mutation = useRevertAppropriationStatus({
    actionSuccess: () => {
      reset({ observation: '' });
      onClose();
      onSuccess?.();
    },
  });

  const observationValue = watch('observation');
  const canSubmit = !!appropriationUuid && !!nextStatus && !!observationValue?.trim();

  function onSubmit(data: RevertStatusFormValues) {
    if (!appropriationUuid || !nextStatus) return;
    mutation.mutate({ uuid: appropriationUuid, observation: data.observation.trim() });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) onClose();
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

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.currentStatus}:{' '}
                    <Text as="span" fontWeight="semibold">
                      {currentStatusLabel}
                    </Text>
                    {' → '}
                    {text.newStatus}:{' '}
                    <Text as="span" fontWeight="semibold">
                      {newStatusLabel}
                    </Text>
                  </Text>

                  <Textarea
                    label={text.observation}
                    placeholder={text.observationPlaceholder}
                    maxLength={500}
                    isRequired
                    disabled={mutation.isPending}
                    {...register('observation')}
                    helperText={!observationValue?.trim() ? text.observationRequired : undefined}
                  />
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={text.cancel}
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={mutation.isPending}
                />
                <Button
                  title={text.confirm}
                  type="submit"
                  loading={mutation.isPending}
                  disabled={!canSubmit}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
