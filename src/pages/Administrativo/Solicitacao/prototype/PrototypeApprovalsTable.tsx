// src/pages/Administrativo/Solicitacao/prototype/PrototypeApprovalsTable.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 3, item 4 do plano — F3) — "Aprovações" da Ordem de compra,
// na aba Histórico acima da linha do tempo: nível de alçada, aprovador,
// situação (Aprovada / Recusada / Aguardando), data e parecer. `approvals[]`
// ainda não existe na API (vem dos dados de demonstração).
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';

import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { RequestTabHeader } from '../RequestTabParts';

import type { PurchaseOrderApproval } from './prototypeFields';

const STATUS_COLOR: Record<PurchaseOrderApproval['status'], string> = {
  approved: 'green.600',
  rejected: 'red.600',
  pending: 'semanticNeutral.400',
};

export function PrototypeApprovalsTable({ approvals }: { approvals: PurchaseOrderApproval[] }) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.prototype.approvals;
  const statusLabel: Record<PurchaseOrderApproval['status'], string> = {
    approved: text.approved,
    rejected: text.rejected,
    pending: text.pending,
  };

  const columns: SimpleTableColumn[] = [
    { key: 'level', header: text.level },
    { key: 'approver', header: text.approver },
    { key: 'status', header: text.status },
    { key: 'date', header: text.date },
    { key: 'note', header: text.note },
  ];

  const rows: SimpleTableRow[] = [...approvals]
    .sort((a, b) => a.level - b.level)
    .map((approval) => ({
      key: `${approval.level}-${approval.user.uuid}`,
      cells: {
        level: (
          <Box minW="200px">
            <Text fontWeight="semibold">{`${approval.level}. ${approval.level_label}`}</Text>
          </Box>
        ),
        approver: <Text fontWeight="medium">{approval.user.name}</Text>,
        status: <StatusTag size="sm" label={statusLabel[approval.status]} color={STATUS_COLOR[approval.status]} />,
        date: (
          <Text whiteSpace="nowrap" color={approval.decided_at ? undefined : 'fg.muted'}>
            {approval.decided_at ? formatDate(approval.decided_at, 'dd/MM/yyyy HH:mm') : '—'}
          </Text>
        ),
        note: (
          <Text minW="220px" color={approval.note ? undefined : 'fg.muted'}>
            {approval.note ?? '—'}
          </Text>
        ),
      },
    }));

  return (
    <Box pt={4} pb={2}>
      <RequestTabHeader title={text.title} count={approvals.length} />
      <SimpleTable columns={columns} rows={rows} ariaLabel={text.title} />
    </Box>
  );
}
