// src/pages/Operacional/Reproducao/Acasalamento/BatchTransferDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo `bm-dialog-batch-transfer` / `pd-dialog-batch-transfer` (BreedingMating,
// F-016, 97-Esteiras/001, TASK-BM-FE-05, contrato de tela §6.3.5, CLM-017,
// CLM-023). `Dialog.Root` no contrato B4 COMPLETO (`Portal` + `Dialog.Backdrop`
// + `Dialog.Positioner`), `lazyMount` + `unmountOnExit` — mirror EXATO
// `PlanningActivityDialog.tsx` (raw Chakra `Dialog`/`Portal`, NUNCA o wrapper
// `@/components/ui/dialog` nem `<Modal>` v2). `<form id="batch-transfer-form">`
// no `Dialog.Body`, `<Button type="submit" form="batch-transfer-form">` no
// `Dialog.Footer` — mirror `AnimalReproductiveStatusDialog.tsx`.
//
// **Recebe tudo do pai por prop — não busca dado sozinho** (Regra 2 do
// Modelo C, regra 9 da Tarefa): `animals` (lista readonly a transferir) e
// `batchOptions` (`EP-BM-13`, `bm-endpoint-batches-to-transfer`) chegam já
// resolvidos. `useTransferBatchOptions`, exportado abaixo, é o hook
// COMPARTILHADO que tanto este diálogo quanto `ProtocolRow.tsx`
// (`Transferência/Lote`) consomem — mesmo nó do manifesto FID-G3F alimenta
// os dois consumidores.
//
// Dois acionadores, mesmo componente:
//   1. `CreateOrUpdateAcasalamento.tsx`, pré-submit (CLM-017) — `animals` =
//      vacas do lote elegíveis SEM linha de protocolo preenchida;
//      `warningMessage` = aviso literal do legado.
//   2. `ProtocolRow.tsx`, botão `+` ao lado de `Transferência/Lote` — `animals`
//      = só o animal daquela linha; sem `warningMessage`.
//
// Ao confirmar: `EP-BM-15` (`transferAnimalsBatch`, REUSO INTEGRAL do módulo
// Animal, contrato de API §12.1) com `same_batch: true`. `onSuccess` é
// exclusivamente do PAI — o fluxo 1 reenvia o formulário principal (mirror
// legado); o fluxo 2 só invalida o lookup, e **deliberadamente não
// autoatribui** o lote ao campo da linha (`GAP-FE-BM-03` §3/CLM-023 — defeito
// preservado por decisão do dono, não "conserte" com `setValue`).
// -----------------------------------------------------------------------------

import { FormEvent, useEffect, useState } from 'react';

import { Dialog, Portal, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { transferAnimalsBatch } from '@/services/v2/Animals/animal-service';
import { listTransferBatchOptions } from '@/services/v2/BreedingMating/breeding-mating-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TransferAnimalsBatchPayload } from '@/@types/v2/Animals';
import type { TransferBatchOptionRef } from '@/@types/v2/BreedingMating';

function mapTransferBatchOption(item: TransferBatchOptionRef): Option<string> {
  return { label: item.label, value: item.uuid };
}

/**
 * `EP-BM-13` (`bm-endpoint-batches-to-transfer`) — lotes de destino
 * elegíveis, excluindo os já pertencentes ao lote de reprodução atual
 * (contrato de tela §3.6). Consumido por este diálogo E por
 * `ProtocolRow.tsx` (`Transferência/Lote`) — mesmo nó do manifesto, mesma
 * query, sem round-trip duplicado (React Query dedupe por `queryKey`).
 * @param {string | undefined} breedingBatchUuid - Lote de reprodução atual; `undefined` desabilita a query.
 * @return {UseQueryResult} Resultado da query (`TransferBatchOptionRef[]`).
 */
export function useTransferBatchOptions(breedingBatchUuid: string | undefined) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.breedingMating,
      'transfer-batches',
      breedingBatchUuid ?? null,
    ],
    queryFn: () => listTransferBatchOptions(breedingBatchUuid!),
    enabled: !!breedingBatchUuid,
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export interface BatchTransferAnimalRef {
  uuid: string;
  code: string;
}

export interface BatchTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  animals: BatchTransferAnimalRef[];
  batchOptions: TransferBatchOptionRef[];
  isLoadingBatchOptions?: boolean;
  /** Presente só no fluxo 1 (CLM-017, pré-submit) — mensagem literal do
   *  legado exibida no corpo do diálogo. Ausente no fluxo 2 (botão `+`
   *  por linha). */
  warningMessage?: string;
  languageGB: LanguageDate;
  /** Chamado após `EP-BM-15` com sucesso — o PAI decide o que fazer a
   *  seguir (reenviar o formulário principal, ou só invalidar o lookup). */
  onSuccess: () => void;
}

export function BatchTransferDialog({
  isOpen,
  onClose,
  animals,
  batchOptions,
  isLoadingBatchOptions = false,
  warningMessage,
  languageGB,
  onSuccess,
}: BatchTransferDialogProps) {
  const text = languageGB.breedingMatings.breedingMating.form.batchTransferDialog;
  const queryClient = useQueryClient();

  const [batchOption, setBatchOption] = useState<Option<string> | null>(null);
  const batchSelectOptions = batchOptions.map(mapTransferBatchOption);

  useEffect(() => {
    if (!isOpen) return;
    setBatchOption(null);
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload: TransferAnimalsBatchPayload) => transferAnimalsBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.breedingMatings.breedingMating, 'transfer-batches'],
      });
      toaster.success({
        title: text.title,
        description: languageGB.defaltStrings.appliedRegister,
        duration: 5000,
      });
      onClose();
      onSuccess();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  function handleClose() {
    if (mutation.isPending) return;
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batchOption) return;
    const payload: TransferAnimalsBatchPayload = {
      animal_uuids: animals.map((animal) => animal.uuid),
      same_batch: true,
      batch_uuid: batchOption.value,
    };
    mutation.mutate(payload);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
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
              <form id="batch-transfer-form" onSubmit={handleSubmit}>
                <VStack align="stretch" gap={4}>
                  {warningMessage && (
                    <Text fontSize="sm" color="fg.warning">
                      {warningMessage}
                    </Text>
                  )}

                  <InputReadOnly
                    name="batch-transfer-animals"
                    label={text.animalsLabel}
                    value={animals.map((animal) => animal.code).join(', ') || '—'}
                  />

                  <Select
                    name="batch-transfer-new-batch"
                    label={text.newBatch}
                    options={batchSelectOptions}
                    value={batchOption}
                    onChange={(option: Option<string> | null) => setBatchOption(option ?? null)}
                    loading={isLoadingBatchOptions}
                    isRequired
                    isDisabled={mutation.isPending}
                  />
                </VStack>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                />
              </Dialog.ActionTrigger>
              <Button
                type="submit"
                form="batch-transfer-form"
                title={text.confirmButton}
                loading={mutation.isPending}
                disabled={!batchOption || mutation.isPending}
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default BatchTransferDialog;
