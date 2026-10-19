// src/pages/Frota/Transferencias/useTransferencias.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo TRANSFERÊNCIA DE MÁQUINAS (F-101,
// 97-Esteiras/005, TASK-ETR-FE-01) — mirror `Frota/Revisoes/useRevisoes.tsx`
// (listagem, `useCustomGridQuery`) + `Abastecimentos/useAbastecimentos.tsx`
// (detalhe, `useCustomFormQueryByGuid`).
//
// `useEquipmentTransfersList` — listagem paginada COM filtro de período
// (`FI-01`/`FI-02`, contrato-tela §FE-10) — variante SEM ID de contexto.
// `useEquipmentTransferDetail` — detalhe por `uuid` (telas de visualização e
// de recebimento, ambas reusam `GET /equipment-transfers/{uuid}`).
// `useNextEquipmentTransferCode`/`useDestinationFarms` — lookups do
// cabeçalho da criação (`useQuery` simples, NÃO paginados,
// `refetchOnWindowFocus: false` — consumidos uma vez ao montar a tela).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getEquipmentTransfer,
  getNextEquipmentTransferCode,
  listDestinationFarms,
  listEquipmentTransfers,
} from '@/services/v2/EquipmentTransfers/equipment-transfer-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  EquipmentTransferDetail,
  EquipmentTransferFilterForm,
  EquipmentTransferListItem,
} from '@/@types/v2/EquipmentTransfers';

interface UseEquipmentTransfersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

// Listagem paginada — `useCustomGridQuery` (família Grid SEM ID de
// contexto). `filterQuery: []` — nenhum filtro fixo; `filter` vem de
// `paginatedQuery.filter` (só `start_date`/`end_date`, FE-10).
export function useEquipmentTransfersList({
  paginatedQuery,
  setPaginatedQuery,
}: UseEquipmentTransfersListProps) {
  return useCustomGridQuery<EquipmentTransferListItem, EquipmentTransferFilterForm>({
    asyncFunction: listEquipmentTransfers,
    queryKey: queryKey.equipmentTransfers.equipmentTransfers,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as EquipmentTransferFilterForm),
  });
}

interface UseEquipmentTransferDetailProps {
  uuid: string | undefined;
  fillForm?: (data: EquipmentTransferDetail, resetForce?: boolean) => void;
}

// Detalhe por `uuid` — compartilhado pela Visualização (`fillForm: () =>
// undefined`, mirror `useSupplyDetailQuery` na Visualização) e pela
// hidratação da tela de Recebimento (`fillForm` real, com `reset`).
export function useEquipmentTransferDetail({ uuid, fillForm }: UseEquipmentTransferDetailProps) {
  return useCustomFormQueryByGuid<EquipmentTransferDetail>({
    registrationId: uuid,
    queryKey: queryKey.equipmentTransfers.equipmentTransfer,
    asyncFunction: getEquipmentTransfer,
    fillForm: fillForm ?? (() => undefined),
  });
}

interface UseNextEquipmentTransferCodeProps {
  enabled?: boolean;
}

// Lookup de `next-code` — consumido UMA VEZ ao montar a tela de criação
// (DEC-FE-ETR-01/contrato-tela §FE-11). Nunca recalculado no cliente.
export function useNextEquipmentTransferCode({
  enabled = true,
}: UseNextEquipmentTransferCodeProps = {}) {
  return useQuery({
    queryKey: [queryKey.equipmentTransfers.equipmentTransfer, 'next-code'],
    queryFn: getNextEquipmentTransferCode,
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// Lookup de `destination-farms` — SEM paginação, já exclui a fazenda ativa
// no servidor (LK-01) — não filtrar de novo no cliente.
export function useDestinationFarms(enabled = true) {
  return useQuery({
    queryKey: [queryKey.equipmentTransfers.equipmentTransfers, 'destination-farms'],
    queryFn: listDestinationFarms,
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
