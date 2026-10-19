// src/pages/Fiscal/NfeEmitidas/useNfeDetail.tsx
// ---- Hook de Query — Detalhe de NFe Emitida (domínio Fiscal) ----
// TASK-FE-036-406. Mirror `Invoices/useInvoiceDetail.tsx` (hook mínimo de 1
// query).

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getNfe } from '@/services/v2/Fiscal/nfe-service';

import type { NfeDetail } from '@/@types/v2/Nfes';

export function useNfeDetail(nfeUuid: string | undefined, enabled = true) {
  return useQuery<NfeDetail>({
    queryKey: [queryKey.nfes.nfe, nfeUuid],
    queryFn: async () => {
      if (!nfeUuid) {
        throw new Error('nfeUuid is required');
      }
      const response = await getNfe(nfeUuid);
      return response.data;
    },
    enabled: enabled && !!nfeUuid,
  });
}
