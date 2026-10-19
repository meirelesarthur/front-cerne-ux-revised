// src/pages/Operacional/LoteFazenda/TransferBatchFarms/TransferBatchFarmEligibleAnimalsPreview.tsx
// -----------------------------------------------------------------------------
// Preview READ-ONLY dos animais elegíveis do Lote selecionado, agrupados por
// categoria (063-est03-9-reprovacoes, QA2 — lote-fazenda-f022-roteiro-qa2.md
// item 2). A API (`GET /transfer-batch-farms/eligible-animals`) já devolve o
// agrupamento fiel ao legado (`ListEligibleAnimalsForTransferBatchFarmAction`,
// chaveado pela descrição da categoria, `identification` legível). Mirror
// visual de `AnimalCategorySelector.tsx`
// (`src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/AnimalCategorySelector.tsx`,
// feature irmã) — mas SEM seleção: aqui é o lote INTEIRO que transfere (mirror
// legado SR, sem `animal_uuids` no payload), então não há
// `Checkbox`/`onChange`/"Marcar todos", só leitura.
// -----------------------------------------------------------------------------

import { Box, Card, Flex, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { TransferBatchFarmEligibleAnimalsByCategory } from '@/@types/v2/LoteFazenda/transferBatchFarm';

export interface TransferBatchFarmEligibleAnimalsPreviewProps {
  byCategory: TransferBatchFarmEligibleAnimalsByCategory;
}

export function TransferBatchFarmEligibleAnimalsPreview({
  byCategory,
}: TransferBatchFarmEligibleAnimalsPreviewProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.loteFazenda.transferBatchFarm.form.eligibleAnimalsByCategory;

  const categoryLabels = Object.keys(byCategory);

  if (categoryLabels.length === 0) {
    return null;
  }

  return (
    <Flex direction="column" gap={4} mt={4}>
      {categoryLabels.map((categoryLabel) => {
        const animals = byCategory[categoryLabel] ?? [];

        return (
          <Card.Root key={categoryLabel} variant="outline" size="sm">
            <Card.Header>
              <Text fontSize="sm" fontWeight="semibold">
                {categoryLabel} — {animals.length} {text.countLabel}
              </Text>
            </Card.Header>
            <Card.Body>
              {/* Altura fixa + scroll interno por categoria (mirror
                  `AnimalCategorySelector.tsx`, lição da 062): com lotes
                  grandes o card não pode crescer sem limite e empurrar o
                  resto do formulário. */}
              <Flex
                direction="column"
                gap={1}
                maxHeight="240px"
                overflowY="auto"
                paddingRight="1"
                css={{ '&::-webkit-scrollbar': { display: 'none' } }}
              >
                {animals.map((animal) => (
                  <Box key={animal.uuid}>
                    <Text fontSize="sm">{animal.identification}</Text>
                  </Box>
                ))}
              </Flex>
            </Card.Body>
          </Card.Root>
        );
      })}
    </Flex>
  );
}
