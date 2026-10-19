// src/constants/serviceOrders/options/service-order-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options de status de Ordem de Serviço (ServiceOrder) —
// TASK-FE-2001. Deriva label (i18n, `languageGB.serviceOrders.serviceOrder.
// list.statusLabels`) + cor (token Chakra, `SERVICE_ORDER_STATUS_META`) do
// Enum `ServiceOrderStatus` (backend, backed int 1/2/3/4/9) — mirror
// `getAppropriationStatusLegend`. Consumida pela legenda da Listagem
// (TASK-FE-2002) e pelo badge da Visualização (TASK-FE-2003); NÃO é um
// Select de filtro nesta fatia (o contrato de filtro só tem `code`/
// `start_date`/`end_date`, ver `00-PLANO-FRONTEND-lista-os.md` §2.3).
// -----------------------------------------------------------------------------

import { SERVICE_ORDER_STATUS_META } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';

import type { LanguageDate } from '@/@types/language';
import type { ServiceOrderStatusValue } from '@/@types/v2/ServiceOrders';

export interface ServiceOrderStatusOption {
  status: ServiceOrderStatusValue;
  label: string;
  badgeColor: string;
}

/**
 * Legenda ordenada de status (1→2→3→4→9), label traduzido + cor tokenizada.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {ServiceOrderStatusOption[]} Legenda de status pronta para exibição.
 */
export function getServiceOrderStatusOptions(languageGB: LanguageDate): ServiceOrderStatusOption[] {
  const legend = languageGB.serviceOrders.serviceOrder.list.statusLabels;

  return [
    { status: 1, label: legend.opened, badgeColor: SERVICE_ORDER_STATUS_META[1].badgeColor },
    { status: 2, label: legend.inProgress, badgeColor: SERVICE_ORDER_STATUS_META[2].badgeColor },
    { status: 3, label: legend.completed, badgeColor: SERVICE_ORDER_STATUS_META[3].badgeColor },
    { status: 4, label: legend.evaluated, badgeColor: SERVICE_ORDER_STATUS_META[4].badgeColor },
    { status: 9, label: legend.cancelled, badgeColor: SERVICE_ORDER_STATUS_META[9].badgeColor },
  ];
}
