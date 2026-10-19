// src/pages/Operacional/Reproducao/Acasalamento/detail/SimplifiedDetailBlock.tsx
// -----------------------------------------------------------------------------
// Bloco `bm-tab-simplified` (nomenclatura herdada do escopo selado — NÃO é
// uma aba, ver ADR-FE-BM-01/GAP-FE-BM-02) da visualização de Acasalamento
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-06, contrato de tela
// §6.4). Renderizado pelo pai (`AcasalamentoDetalhe.tsx`) SÓ quando
// `data.simplified !== null`.
//
// Conteúdo: linhas com produto, armazém, unidade de medida, estoque no
// momento, quantidade e inseminador — mirror `sections/SimplifiedSection.tsx`/
// `SimplifiedRow.tsx` (TASK-BM-FE-05) em modo LEITURA. Rótulos reusados de
// `form.sections.simplified.*`.
// -----------------------------------------------------------------------------

import { Box, Heading, Table, Text } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';
import type { BreedingMatingSimplifiedDetail } from '@/@types/v2/BreedingMating';

export interface SimplifiedDetailBlockProps {
  simplified: BreedingMatingSimplifiedDetail;
  languageGB: LanguageDate;
}

export function SimplifiedDetailBlock({ simplified, languageGB }: SimplifiedDetailBlockProps) {
  const text = languageGB.breedingMatings.breedingMating;
  const sectionText = text.form.sections.simplified;
  const detailText = text.detail;

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
        {text.detail.sections.simplified}
      </Heading>

      {simplified.animals.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" py={2}>
          {detailText.emptySection}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{sectionText.animal}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.warehouse}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.product}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.measurement}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.stock}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.quantity}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.responsible}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {simplified.animals.map((row, index) => (
                <Table.Row key={row.uuid ?? `${row.animal.uuid}-${index}`}>
                  <Table.Cell>{row.animal.code}</Table.Cell>
                  <Table.Cell>{row.warehouse.label}</Table.Cell>
                  <Table.Cell>{row.product.label}</Table.Cell>
                  <Table.Cell>{row.measurement.label}</Table.Cell>
                  <Table.Cell>{row.stock}</Table.Cell>
                  <Table.Cell>{row.quantity}</Table.Cell>
                  <Table.Cell>{row.provider?.label ?? '—'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  );
}

export default SimplifiedDetailBlock;
