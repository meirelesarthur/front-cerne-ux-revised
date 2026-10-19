// src/pages/Fiscal/Cte/CteEmissao/MedidasReadonlyTab.tsx
// -----------------------------------------------------------------------------
// Tab "Medidas" (S22) da tela de Emissão SEFAZ — leitura pura de
// `data.medidas[]` (mesmo `CteDetailResource` da Onda 1). SEM
// `useFieldArray` (readonly, mirror Contrato §2.2). Reaproveita os rótulos
// de coluna já traduzidos em `languageGB.ctes.cte.form.medidas` (Onda 1).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';

import type { LanguageDate } from '@/@types/language';
import type { CteMedidaData } from '@/@types/v2/Fiscal/cte';

export interface MedidasReadonlyTabProps {
  medidas: CteMedidaData[];
  languageGB: LanguageDate;
}

export function MedidasReadonlyTab({ medidas, languageGB }: MedidasReadonlyTabProps) {
  const text = languageGB.ctes.cte.form.medidas;
  const emptyText = languageGB.ctes.cte.emission.readonlyEmpty.noMedidas;

  return (
    <Box pt={4}>
      {medidas.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyText}
        </Text>
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          {medidas.map((medida) => (
            <SimpleGrid key={medida.uuid} columns={{ base: 1, md: 3 }} gap={4}>
              <InputReadOnly label={text.codUnidade} value={medida.cod_unidade} />
              <InputReadOnly label={text.tipoMedida} value={medida.tipo_medida} />
              <InputReadOnly
                label={text.quantidadeCarga}
                value={medida.quantidade_carga.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              />
            </SimpleGrid>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default MedidasReadonlyTab;
