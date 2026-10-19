// src/pages/Fiscal/Cte/CteEmissao/ChavesReadonlyTab.tsx
// -----------------------------------------------------------------------------
// Tab "Chaves referenciadas" (S23) da tela de Emissão SEFAZ — leitura pura de
// `data.chaves_nfe[]` (mesmo `CteDetailResource` da Onda 1). SEM
// `useFieldArray` (readonly, mirror Contrato §2.2). Reaproveita o rótulo já
// traduzido em `languageGB.ctes.cte.form.chavesNfe` (Onda 1).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';

import type { LanguageDate } from '@/@types/language';

export interface ChavesReadonlyTabProps {
  chavesNfe: string[];
  languageGB: LanguageDate;
}

export function ChavesReadonlyTab({ chavesNfe, languageGB }: ChavesReadonlyTabProps) {
  const text = languageGB.ctes.cte.form.chavesNfe;
  const emptyText = languageGB.ctes.cte.emission.readonlyEmpty.noChaves;

  return (
    <Box pt={4}>
      {chavesNfe.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2}>
          {chavesNfe.map((chave) => (
            <InputReadOnly key={chave} label={text.chaveLabel} value={chave} />
          ))}
        </Flex>
      )}
    </Box>
  );
}

export default ChavesReadonlyTab;
