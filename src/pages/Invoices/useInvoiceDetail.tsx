// src/pages/Invoices/useInvoiceDetail.tsx
// ---- Hook de Query — Detalhe de Invoice (Doc. Fiscal/Entrada) ----
// TASK-FE-2768. Mirror `useOpeningBalanceDetail.tsx` (hook mínimo de 1 query).

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getInvoice } from '@/services/v2/Invoices/invoice-service';

import type { InvoiceDetail } from '@/@types/v2/Invoices';

export function useInvoiceDetail(invoiceUuid: string | undefined, enabled = true) {
  return useQuery<InvoiceDetail>({
    queryKey: [queryKey.invoices.invoice, invoiceUuid],
    queryFn: async () => {
      if (!invoiceUuid) {
        throw new Error('invoiceUuid is required');
      }
      const response = await getInvoice(invoiceUuid);
      return response.data;
    },
    enabled: enabled && !!invoiceUuid,
  });
}
