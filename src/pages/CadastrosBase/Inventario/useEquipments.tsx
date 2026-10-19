// src/pages/CadastrosBase/Inventario/useEquipments.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo INVENTÁRIO (Equipment) — mesmo padrão de
// CadastrosBase/Produtos/Catalogo/useProducts.tsx (CRUD-por-GUID + guard de
// fazenda ativa):
//   - useEquipmentsList → useCustomGridQuery (listagem, 5 filtros achatados)
//   - useEquipmentForm  → useCustomFormQueryByGuid (detalhe por UUID)
//
// `enabled` é o guard de farm ativa (`usePermissions().hasFarm`, mesmo
// padrão de `useProductsList`/`usePackagesList`) — Equipment está dentro do
// bloco `farm.context` ESTRITO (Equipment-contrato.md §12, "Inventário
// sempre exige Farm ativa", diferente do híbrido de Product). Evita
// disparar o GET sem fazenda ativa selecionada (403).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getEquipment, listEquipments } from '@/services/v2/Equipments/equipment-service';
import type { ListEquipmentsParams } from '@/services/v2/Equipments/equipment-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { EquipmentData, EquipmentListItem } from '@/@types/v2/Equipments';

interface UseEquipmentsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ListEquipmentsParams;
  /** Guard de fazenda ativa (`farm.context` ESTRITO, ver cabeçalho do arquivo). */
  enabled: boolean;
}

// Query de listagem paginada de Inventário (`GET /equipments`, 5 filtros
// achatados — `search`/`family_equipment_uuid`/`proprietary_uuid`/
// `start_date`/`end_date` — já achatados pela tela, `TASK-FE-1004`).
export function useEquipmentsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled,
}: UseEquipmentsListProps) {
  return useCustomGridQuery<EquipmentListItem, ListEquipmentsParams>({
    asyncFunction: listEquipments,
    queryKey: queryKey.equipments.equipmentsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ListEquipmentsParams),
    enabled,
  });
}

interface UseEquipmentFormProps {
  registrationId?: string;
  fillForm: (data: EquipmentData, resetForce?: boolean) => void;
  /** Guard de fazenda ativa — ver cabeçalho do arquivo. */
  enabled: boolean;
}

// Query de detalhe (formulário de edição/tela de detalhe) — mesmo guard de
// fazenda ativa da listagem. Mesmo truque de `useProductForm`:
// `useCustomFormQueryByGuid` não aceita um `enabled` externo — quando
// `enabled` é `false`, `registrationId` vira `undefined` antes do hook
// compartilhado (`isValidGuid` falha, a query nem dispara).
export function useEquipmentForm({ registrationId, fillForm, enabled }: UseEquipmentFormProps) {
  return useCustomFormQueryByGuid<EquipmentData>({
    registrationId: enabled ? registrationId : undefined,
    queryKey: queryKey.equipments.equipment,
    asyncFunction: getEquipment,
    fillForm,
  });
}
