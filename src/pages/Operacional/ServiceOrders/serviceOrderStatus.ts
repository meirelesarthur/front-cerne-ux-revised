// src/pages/Operacional/ServiceOrders/serviceOrderStatus.ts
// -----------------------------------------------------------------------------
// Dicionário ÚNICO de status→cor de Ordem de Serviço (ServiceOrder) —
// TASK-FE-2002/2003. Fonte única de verdade consumida pela Listagem (badge de
// linha) e pela Visualização (badge do cabeçalho).
//
// `ServiceOrderStatus` no backend expõe hex cru (`status.color`,
// `#858796`/`#FEC02C`/`#038F59`/`#0336FF`/`#FF0000`) — o front NÃO consome
// esse hex direto (proibição "hex fixo fora dos tokens" do Passo UX).
// Mapeamento por `Record<ServiceOrderStatusValue, ...>` para tokens Chakra,
// mirror `APPROPRIATION_STATUS_META`. `status.label` do Resource é usado
// direto (mesma convenção de `AppropriationListItem.status_label` — o
// backend já resolve o rótulo, sem tradução própria no front).
// -----------------------------------------------------------------------------

import { SERVICE_ORDER_CANCELLABLE_STATUSES } from '@/constants/serviceOrders/service-order-cancel-rules';

import type { ServiceOrderStatusValue } from '@/@types/v2/ServiceOrders';

export interface ServiceOrderStatusMeta {
  /** Token de cor Chakra para o dot do `Status.tsx` — NUNCA hex cru. */
  badgeColor: string;
}

export const SERVICE_ORDER_STATUS_META: Record<ServiceOrderStatusValue, ServiceOrderStatusMeta> = {
  1: { badgeColor: 'gray.500' }, // Aberta
  2: { badgeColor: 'yellow.500' }, // Em Execução
  3: { badgeColor: 'green.500' }, // Concluída
  4: { badgeColor: 'info.500' }, // Avaliado — azul REAL do CERNE (a escala `blue` do tema aponta para a rampa verde da marca; `info.500` é o azul verdadeiro, fiel ao legado #0336FF)
  9: { badgeColor: 'red.500' }, // Cancelada
};

/**
 * Fallback defensivo — `status.value` fora do dicionário (nunca deveria
 * ocorrer, mas evita `undefined.badgeColor` se o backend evoluir o Enum sem
 * o front acompanhar).
 * @param {ServiceOrderStatusValue} value - Valor do status (`ServiceOrderStatus` backend).
 * @return {string} Token de cor Chakra para o dot do `Status.tsx`.
 */
export function getServiceOrderStatusBadgeColor(value: ServiceOrderStatusValue): string {
  return SERVICE_ORDER_STATUS_META[value]?.badgeColor ?? 'gray.500';
}

/**
 * Visibilidade da ação "Cancelar OS" (execução 086): exige a permissão
 * `service-orders_cancel` E status Aberta (1) ou Em Execução (2) — mirror do
 * 422 de `CancelServiceOrderAction` para os demais status.
 * @param {boolean} hasCancelPermission - Resultado de `can('service-orders_cancel')`.
 * @param {number | null | undefined} statusValue - `status.value` da OS.
 * @return {boolean} `true` quando o botão/ação pode ser exibido.
 */
export function canCancelServiceOrder(
  hasCancelPermission: boolean,
  statusValue: number | null | undefined
): boolean {
  if (!hasCancelPermission || statusValue === null || statusValue === undefined) return false;
  return SERVICE_ORDER_CANCELLABLE_STATUSES.includes(statusValue as ServiceOrderStatusValue);
}
