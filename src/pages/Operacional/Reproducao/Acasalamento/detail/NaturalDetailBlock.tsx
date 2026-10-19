// src/pages/Operacional/Reproducao/Acasalamento/detail/NaturalDetailBlock.tsx
// -----------------------------------------------------------------------------
// Bloco `bm-tab-natural` (nomenclatura herdada do escopo selado — NÃO é uma
// aba, ver ADR-FE-BM-01/GAP-FE-BM-02) da visualização de Acasalamento
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-06, contrato de tela
// §6.4). Renderizado pelo pai (`AcasalamentoDetalhe.tsx`) SÓ quando
// `data.natural !== null` — este componente nunca decide sua própria
// nulidade, apenas recebe o bloco já resolvido.
//
// Conteúdo: touro, vacas e os 3 totalizadores read-only (mirror
// `sections/NaturalSection.tsx` da TASK-BM-FE-05, em modo LEITURA — nunca
// `Input isReadOnly`, sempre `DisplayField`/`DisplayFieldGroup`, regra 6 da
// Tarefa). Rótulos reusados de `form.sections.natural.*` (Touro/Vacas/
// Touros/Matriz-Touros) — mesmos termos do legado, sem duplicar chave de
// dicionário só porque o contexto é leitura em vez de formulário.
// -----------------------------------------------------------------------------

import { Box, Heading, Table, Text, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import type { LanguageDate } from '@/@types/language';
import type { BreedingMatingNaturalDetail } from '@/@types/v2/BreedingMating';

// `Matriz/Touros` — vacas ÷ touros, 2 casas decimais, `0` quando não há
// touro. Mirror `formatRatio` de `sections/NaturalSection.tsx` (TASK-BM-FE-05)
// — apresentação pura, nenhum cálculo de negócio novo (o bloco `natural`
// sempre traz exatamente 1 touro quando presente).
function formatRatio(cowsCount: number, bullsCount: number): string {
  if (bullsCount === 0) return (0).toFixed(2);
  return (cowsCount / bullsCount).toFixed(2);
}

export interface NaturalDetailBlockProps {
  natural: BreedingMatingNaturalDetail;
  languageGB: LanguageDate;
}

export function NaturalDetailBlock({ natural, languageGB }: NaturalDetailBlockProps) {
  const text = languageGB.breedingMatings.breedingMating;
  const sectionText = text.form.sections.natural;
  const detailText = text.detail;

  const bullsCount = 1;
  const cowsCount = natural.cows.length;

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Heading as="h3" size="sm" fontWeight="semibold" color="fg.default" mb={3}>
        {text.detail.sections.natural}
      </Heading>

      <DisplayFieldGroup
        loading={false}
        displayFields={[
          { label: sectionText.bull, value: natural.bull.code },
          { label: sectionText.cows, value: cowsCount },
          { label: sectionText.bulls, value: bullsCount },
          { label: sectionText.ratio, value: formatRatio(cowsCount, bullsCount) },
        ]}
      />

      <VStack align="stretch" gap={2} mt={4}>
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
          {sectionText.animalsBreedingBatch}
        </Text>

        {natural.cows.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" py={2}>
            {detailText.emptySection}
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Body>
                {natural.cows.map((cow) => (
                  <Table.Row key={cow.uuid}>
                    <Table.Cell>{cow.code}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default NaturalDetailBlock;
