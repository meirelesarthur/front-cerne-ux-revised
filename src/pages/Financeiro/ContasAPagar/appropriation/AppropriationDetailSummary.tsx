// src/pages/Financeiro/ContasAPagar/appropriation/AppropriationDetailSummary.tsx
// -----------------------------------------------------------------------------
// UT-000795 — resumo SOMENTE LEITURA do apontamento gravado (Código, Status,
// Data, Valor) no topo dos blocos Pecuária/Manutenção, na edição/visualização
// (D-102-14). Sem tabela nova: `DisplayField` do padrão do Cerne.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';

import { getAppropriationStatusLegend } from '../../../Operacional/Appropriations/appropriationStatus';

interface AppropriationDetailSummaryProps {
  code: string | null;
  status: string;
  date: string | null;
  amount: number;
}

export function AppropriationDetailSummary({
  code,
  status,
  date,
  amount,
}: AppropriationDetailSummaryProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.financial.expense.form;
  const statusLabel =
    getAppropriationStatusLegend(languageGB).find((item) => item.status === status)?.label ??
    status;

  return (
    <SimpleGrid columns={columnsForm.fourColumns} gap={4} mb={4}>
      <InputReadOnly label={formText.fields.appropriationGeneratedCode} value={code ?? '—'} />
      <InputReadOnly label={formText.fields.appropriationGeneratedStatus} value={statusLabel} />
      <InputReadOnly label={formText.fields.detailDate} value={date ? formatDate(date) : '—'} />
      <InputReadOnly label={formText.fields.detailAmount} value={formatCurrencyBRL(amount)} />
    </SimpleGrid>
  );
}
