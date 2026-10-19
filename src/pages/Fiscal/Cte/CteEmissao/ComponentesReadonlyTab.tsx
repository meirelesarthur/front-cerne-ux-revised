// src/pages/Fiscal/Cte/CteEmissao/ComponentesReadonlyTab.tsx
// -----------------------------------------------------------------------------
// Tab "Componentes" (S21) da tela de Emissão SEFAZ — leitura pura de
// `data.componentes[]` (mesmo `CteDetailResource` da Onda 1). SEM
// `useFieldArray` (não é editável aqui — mirror Contrato §2.2, esta tela é
// 100% readonly exceto D14). Reaproveita os rótulos de coluna já
// traduzidos em `languageGB.ctes.cte.form.componentes` (Onda 1).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { LanguageDate } from '@/@types/language';
import type { CteComponenteData } from '@/@types/v2/Fiscal/cte';

export interface ComponentesReadonlyTabProps {
  componentes: CteComponenteData[];
  languageGB: LanguageDate;
}

export function ComponentesReadonlyTab({ componentes, languageGB }: ComponentesReadonlyTabProps) {
  const text = languageGB.ctes.cte.form.componentes;
  const emptyText = languageGB.ctes.cte.emission.readonlyEmpty.noComponentes;

  return (
    <Box pt={4}>
      {componentes.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyText}
        </Text>
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          {componentes.map((componente) => (
            <SimpleGrid key={componente.uuid} columns={{ base: 1, md: 2 }} gap={4}>
              <InputReadOnly label={text.nome} value={componente.nome} />
              <InputReadOnly label={text.valor} value={formatCurrencyBRL(componente.valor)} />
            </SimpleGrid>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default ComponentesReadonlyTab;
