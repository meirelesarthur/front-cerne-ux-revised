// src/pages/Operacional/Pastagem/AppropriationHeaderPastagem.tsx
// -----------------------------------------------------------------------------
// Bloco "Dados da Pastagem" (read-only) da tela de Apropriação —
// TASK-PAST-FE-07. Mirror `Appropriations/AppropriationHeaderFields.tsx`,
// mas 100% read-only (a Apropriação não edita o cabeçalho da Pastagem).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { PastureDetail } from '@/@types/v2/Pastures';

export interface AppropriationHeaderPastagemProps {
  pasture: PastureDetail;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export function AppropriationHeaderPastagem({ pasture }: AppropriationHeaderPastagemProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture;
  const noData = '—';

  return (
    <SimpleGrid columns={columnsForm.default} gap={6}>
      <InfoField label={text.form.fields.code} value={pasture.code} />
      <InfoField label={text.form.fields.date} value={pasture.date} />
      <InfoField label={text.list.table.requester} value={pasture.requester ?? noData} />
    </SimpleGrid>
  );
}
