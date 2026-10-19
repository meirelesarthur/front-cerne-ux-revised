// src/pages/CadastrosBase/Rebanho/AnimalBatchTransferDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de ação em lote — Transferir de Lote (Tarefa 30, Gestão Animais —
// feature 3596a556, AM-05). Move os animais selecionados para outro lote, com
// dois modos: um destino para todos (`same_batch=true`) ou um destino por
// animal (`same_batch=false`, `CLM-38`). Endpoint COMPARTILHADO com a feature
// Animais/Lote (`426be835`, `DEC-028`) — não duplicado.
//
// Nasce em `src/pages/CadastrosBase/Rebanho/`; se a feature Animais/Lote
// precisar do mesmo diálogo, ele é PROMOVIDO a `src/components/`, nunca
// copiado (nota de fronteira do contrato de tela, DEC-028). Não antecipado
// aqui — YAGNI.
//
// `useMutation` DIRETO — mesma decisão das Tarefas 28/29, mas pelo motivo
// OPOSTO: este endpoint NÃO devolve contagem (`data: []`,
// `AnimalController:324`), então o toast usa `selectedAnimals.length` — o
// único dos 3 diálogos em que a contagem local é correta (registrado aqui
// para não parecer inconsistência com as Tarefas 28/29).
//
// `SelectAsyncPaginate` dentro do diálogo usa `disablePortal` (não
// `menuPortalTarget=document.body`): o menu portalizado em `document.body`
// cria um filho DIRETO de `<body>`, fora da árvore de `Portal` do
// `Dialog.Root` (Ark UI/Zag.js) — o Dialog aplica `aria-hidden`/`inert` em
// elementos fora dessa árvore, deixando o menu VISÍVEL porém NÃO-CLICÁVEL
// (achado confirmado por leitura direta do docblock de
// `SelectAsyncPaginate.tsx:61-75`). `menuPortalTarget`/`fixed` (usado no
// drawer de filtro) é para FORA de um `Dialog`, não dentro.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Dialog } from '@/components/ui/dialog';
import { Radio, RadioGroup } from '@/components/ui/radio';
import { toaster } from '@/components/ui/toaster';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { transferAnimalsBatch } from '@/services/v2/Animals/animal-service';
import { listBatchOptions } from '@/services/v2/Batches/batch-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TransferAnimalsBatchPayload } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';

type TransferMode = 'same' | 'per_animal';

interface SelectedAnimalRef {
  uuid: string;
  identification: string;
}

interface AnimalBatchTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnimals: SelectedAnimalRef[];
  languageGB: LanguageDate;
  /** Chamado após sucesso — o pai fecha o diálogo e limpa a seleção. */
  onSuccess: () => void;
}

function mapBatchOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function findBatchParams(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export function AnimalBatchTransferDialog({
  isOpen,
  onClose,
  selectedAnimals,
  languageGB,
  onSuccess,
}: AnimalBatchTransferDialogProps) {
  const text = languageGB.animals.animal;
  const dialogText = text.dialogs.batchTransfer;
  const queryClient = useQueryClient();

  // `same` é o default — é o caso comum (contrato de tela §9.2).
  const [mode, setMode] = useState<TransferMode>('same');
  const [batchOption, setBatchOption] = useState<Option<string> | null>(null);
  const [perAnimalBatch, setPerAnimalBatch] = useState<Record<string, Option<string> | null>>({});

  useEffect(() => {
    if (!isOpen) return;
    setMode('same');
    setBatchOption(null);
    setPerAnimalBatch(Object.fromEntries(selectedAnimals.map((animal) => [animal.uuid, null])));
  }, [isOpen, selectedAnimals]);

  const mutation = useMutation({
    mutationFn: (payload: TransferAnimalsBatchPayload) => transferAnimalsBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animalsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.animals.animal] });
      toaster.success({
        title: text.pluralLabel,
        description: dialogText.successMessage.replace('{count}', String(selectedAnimals.length)),
        duration: 7000,
      });
      onSuccess();
    },
    onError: (error) => {
      toaster.error({
        title: text.pluralLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const canConfirm =
    mode === 'same'
      ? !!batchOption
      : selectedAnimals.length > 0 &&
        selectedAnimals.every((animal) => !!perAnimalBatch[animal.uuid]);

  function handleConfirm() {
    if (mode === 'same') {
      if (!batchOption) return;
      const payload: TransferAnimalsBatchPayload = {
        animal_uuids: selectedAnimals.map((animal) => animal.uuid),
        same_batch: true,
        batch_uuid: batchOption.value,
      };
      mutation.mutate(payload);
      return;
    }

    // Alinhamento por índice — a regra crítica (contrato de tela §9.2, item
    // 2). Os dois arrays saem de UMA ÚNICA passagem sobre `selectedAnimals`
    // (lista já ordenada e estável), NUNCA de `Object.keys`/`Object.values`
    // de fontes independentes — a ordem de iteração de um objeto não é
    // garantida por contrato e um desalinhamento aqui transfere animais para
    // os lotes errados SILENCIOSAMENTE (o backend só checa a quantidade).
    const rows = selectedAnimals.map((animal) => ({
      animal_uuid: animal.uuid,
      batch_uuid: perAnimalBatch[animal.uuid]?.value,
    }));
    if (rows.some((row) => !row.batch_uuid)) return;

    const payload: TransferAnimalsBatchPayload = {
      animal_uuids: rows.map((row) => row.animal_uuid),
      same_batch: false,
      batch_uuids: rows.map((row) => row.batch_uuid!),
    };
    mutation.mutate(payload);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{dialogText.title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <VStack align="stretch" gap={4}>
            <Text>
              {dialogText.countTemplate.replace('{count}', String(selectedAnimals.length))}
            </Text>

            <RadioGroup
              value={mode}
              onValueChange={(details: { value: string | null }) =>
                setMode((details.value as TransferMode) ?? 'same')
              }
            >
              <VStack align="stretch" gap={2}>
                <Radio value="same">{dialogText.sameBatchMode}</Radio>
                <Radio value="per_animal">{dialogText.perAnimalMode}</Radio>
              </VStack>
            </RadioGroup>

            {mode === 'same' ? (
              <SelectAsyncPaginate
                name="batch"
                label={dialogText.batchLabel}
                placeholder={dialogText.batchPlaceholder}
                service={listBatchOptions}
                mapOptions={mapBatchOption}
                findParams={findBatchParams}
                value={batchOption}
                onChange={(opt: any) => setBatchOption(opt ?? null)}
                disablePortal
              />
            ) : (
              <VStack align="stretch" gap={2}>
                <SimpleGrid
                  columns={2}
                  gap={2}
                  px={1}
                  color="fg.muted"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  <Text>{dialogText.animalColumnLabel}</Text>
                  <Text>{dialogText.batchLabel}</Text>
                </SimpleGrid>

                {/* Área rolável com altura máxima — a seleção pode ter até
                    100 itens (teto de `per_page`); o diálogo não pode
                    estourar a viewport. */}
                <Box maxHeight="320px" overflowY="auto">
                  <VStack align="stretch" gap={2}>
                    {selectedAnimals.map((animal) => (
                      <Flex key={animal.uuid} align="center" gap={2}>
                        <Text flex="1" fontSize="sm" lineClamp="1">
                          {animal.identification}
                        </Text>
                        <Box flex="1">
                          <SelectAsyncPaginate
                            name={`batch-${animal.uuid}`}
                            placeholder={dialogText.batchPlaceholder}
                            service={listBatchOptions}
                            mapOptions={mapBatchOption}
                            findParams={findBatchParams}
                            value={perAnimalBatch[animal.uuid] ?? null}
                            onChange={(opt: any) =>
                              setPerAnimalBatch((prev) => ({ ...prev, [animal.uuid]: opt ?? null }))
                            }
                            disablePortal
                          />
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </VStack>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            />
          </Dialog.ActionTrigger>
          <Button
            title={dialogText.submitButton}
            onClick={handleConfirm}
            loading={mutation.isPending}
            disabled={!canConfirm || mutation.isPending}
          />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
