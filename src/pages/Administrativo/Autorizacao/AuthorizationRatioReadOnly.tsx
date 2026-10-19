// src/pages/Administrativo/Autorizacao/AuthorizationRatioReadOnly.tsx
// -----------------------------------------------------------------------------
// Rateio somente leitura (execução 081, T-081-FE-06; legado `_forms.blade.php:481-525`
// e `second.blade.php:378-422`): quando o rateio já foi gravado e o usuário não é o
// Ordenador, a tela mostra Classificação, Safra e a tabela Categoria, Centro de Custo
// e Porcentagem. Dados do detalhe (`classification`, `harvest`, `ratio[]`); nada é
// calculado aqui.
// -----------------------------------------------------------------------------

import { Box, Flex, Table, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

const NO_DATA = '—';

export interface AuthorizationRatioReadOnlyProps {
  data: Pick<RequestPurchaseData, 'classification' | 'harvest' | 'ratio'>;
}

export function AuthorizationRatioReadOnly({ data }: AuthorizationRatioReadOnlyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.ratio;
  const rows = data.ratio ?? [];

  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.default"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {text.title}
      </Text>

      <Flex gap={6} mb={4} wrap="wrap">
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
            {text.classificationLabel}
          </Text>
          <Text fontSize="sm">{text.classificationOptions[data.classification ?? 'N']}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
            {text.harvestLabel}
          </Text>
          <Text fontSize="sm">{data.harvest?.description ?? NO_DATA}</Text>
        </Box>
      </Flex>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.categoryLabel}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.centerLabel}</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">{text.percentLabel}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            // `ratio[]` não traz uuid próprio; a lista é somente leitura e estável.
            // eslint-disable-next-line react/no-array-index-key
            <Table.Row key={index}>
              <Table.Cell>{row.category?.description ?? NO_DATA}</Table.Cell>
              <Table.Cell>{row.center?.description ?? NO_DATA}</Table.Cell>
              <Table.Cell textAlign="end">
                {Number(row.percent).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
