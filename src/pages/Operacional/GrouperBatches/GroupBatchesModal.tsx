// src/pages/Operacional/GrouperBatches/GroupBatchesModal.tsx
// -----------------------------------------------------------------------------
// Modal "Agrupar" (GrouperBatch, execução 042, TASK-FE-042-304) — mirror QUASE
// literal de `Administrativo/SaldoEstoque/GroupStocksModal.tsx` (Dialog v3
// headless + `RadioGroup`), trocando as colunas: aqui só 4 (radio + code +
// description + animals_count), D-front-5.
//
// Abre já com a prévia resolvida (sem spinner interno, mirror
// `GroupStocksModal`). `RadioGroup`/`Radio` de `@/components/ui/radio`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Dialog, Flex, Portal, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Radio, RadioGroup } from '@/components/ui/radio';

import type { LanguageDate } from '@/@types/language';
import type { GrouperBatchLookupItem } from '@/@types/v2/GrouperBatches';

import type { useGroupBatches } from './useGroupBatches';

export interface GroupBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Linhas da prévia (`GET /grouper-batches`), já resolvidas no `index.tsx`. */
  previewRows: GrouperBatchLookupItem[];
  languageGB: LanguageDate;
  /** Instanciada no `index.tsx` — o `onSuccess` fecha o modal e limpa a seleção. */
  mutation: ReturnType<typeof useGroupBatches>;
}

export function GroupBatchesModal({
  isOpen,
  onClose,
  previewRows,
  languageGB,
  mutation,
}: GroupBatchesModalProps) {
  const text = languageGB.grouperBatches.grouperBatch.group;

  // Lote principal ("correto") escolhido no radio — reset a cada (re)abertura
  // (nenhum principal pré-selecionado).
  const [correctUuid, setCorrectUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCorrectUuid(null);
  }, [isOpen]);

  function handleConfirm() {
    if (!correctUuid) return;

    mutation.mutate({
      batch_uuids: previewRows.map((row) => row.uuid),
      correct_batch_uuid: correctUuid,
    });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !mutation.isPending) onClose();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.modalTitle}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text fontSize="sm" fontWeight="medium" color="fg.default">
                  {text.modalPrimaryLabel}
                </Text>

                <SimpleGrid
                  columns={4}
                  gap={2}
                  px={2}
                  color="fg.muted"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  <Box />
                  <Text>{text.columns.code}</Text>
                  <Text>{text.columns.description}</Text>
                  <Text textAlign="right">{text.columns.totalAnimals}</Text>
                </SimpleGrid>

                <RadioGroup
                  value={correctUuid}
                  onValueChange={(details: { value: string | null }) =>
                    setCorrectUuid(details.value)
                  }
                >
                  <VStack align="stretch" gap={1}>
                    {previewRows.map((row) => (
                      <SimpleGrid
                        key={row.uuid}
                        columns={4}
                        gap={2}
                        px={2}
                        py={2}
                        alignItems="center"
                        borderWidth="1px"
                        borderColor="borderGrid"
                        borderRadius="md"
                        bg={correctUuid === row.uuid ? 'selectedTextGridColor' : undefined}
                      >
                        <Radio value={row.uuid} aria-label={row.description} />
                        <Text fontSize="sm" fontWeight="medium" lineClamp="1">
                          {row.code}
                        </Text>
                        <Text fontSize="sm" color="fg.muted" lineClamp="1">
                          {row.description}
                        </Text>
                        <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
                          {row.animals_count}
                        </Text>
                      </SimpleGrid>
                    ))}
                  </VStack>
                </RadioGroup>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Flex justify="space-between" width="full">
                <Button
                  title={text.cancelButton}
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={mutation.isPending}
                />
                <Button
                  title={text.confirmButton}
                  type="button"
                  onClick={handleConfirm}
                  loading={mutation.isPending}
                  disabled={!correctUuid}
                />
              </Flex>
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
