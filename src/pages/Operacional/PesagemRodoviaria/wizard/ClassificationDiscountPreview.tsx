// src/pages/Operacional/PesagemRodoviaria/wizard/ClassificationDiscountPreview.tsx
// -----------------------------------------------------------------------------
// Preview do desconto total da etapa de Classificação (TASK-MWG-FE-06) —
// espelho client-side do cálculo do servidor (`classificationDiscountCalculator.ts`)
// — NUNCA a fonte oficial (o servidor recalcula e persiste no `PUT next-step`).
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';

export interface ClassificationDiscountPreviewProps {
  title: string;
  totalLabel: string;
  totalDiscount: number | null;
}

export function ClassificationDiscountPreview({
  title,
  totalLabel,
  totalDiscount,
}: ClassificationDiscountPreviewProps) {
  return (
    <Box borderWidth="1px" borderColor="border.muted" borderRadius="md" p={4}>
      <Text fontWeight="medium" mb={1}>
        {title}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {totalLabel}: {totalDiscount != null ? totalDiscount.toFixed(2) : '-'} kg
      </Text>
    </Box>
  );
}

export default ClassificationDiscountPreview;
