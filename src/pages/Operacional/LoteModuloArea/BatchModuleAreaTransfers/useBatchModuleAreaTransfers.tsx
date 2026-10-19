// src/pages/Operacional/LoteModuloArea/BatchModuleAreaTransfers/useBatchModuleAreaTransfers.tsx
// -----------------------------------------------------------------------------
// Hook orquestrador da grid de Listagem "Lote/Módulo/Área"
// (BatchModuleAreaTransfer — Operacional > Pecuária > Transferências,
// 97-Esteiras/070, TASK-LMA-FE-02). Mirror `CadastrosBase/Batches/useBatches.tsx`
// (`useBatchesList` → `useCustomGridQuery`), sem ID pai — listagem global
// escopada por `X-Farm-Id` (contrato de tela `## 4.1`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { queryKey } from '@/constants/query-key';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { listBatchModuleAreaTransfers } from '@/services/v2/LoteModuloArea/batchModuleAreaTransfer-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { BatchModuleAreaTransferListItem } from '@/@types/v2/LoteModuloArea/batchModuleAreaTransfer';

// Filtro único (`## 4.1` do contrato de tela, S-FORM-FILTER) — aplicado
// inline no header da grid, SEM `FilterSide`/drawer completo (decisão
// herdada, não reabrir sem Gap).
export interface BatchModuleAreaTransferFilter {
  batch_uuid?: string;
}

interface UseBatchModuleAreaTransfersListProps {
  paginatedQuery: PaginatedQueryProps<BatchModuleAreaTransferFilter>;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

export function useBatchModuleAreaTransfersList({
  paginatedQuery,
  setPaginatedQuery,
}: UseBatchModuleAreaTransfersListProps) {
  return useCustomGridQuery<BatchModuleAreaTransferListItem, BatchModuleAreaTransferFilter>({
    asyncFunction: listBatchModuleAreaTransfers,
    queryKey: queryKey.batchModuleAreaTransfer.transfers,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: { batch_uuid: paginatedQuery.filter?.batch_uuid },
  });
}
