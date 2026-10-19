// src/constants/monitoring/serviceOrderStatus.ts
// -----------------------------------------------------------------------------
// Reaproveita o enum/cores JÁ EXISTENTES do domínio ServiceOrder (mesma
// tabela/mesmo enum de status no backend — contrato de tela §5.3,
// "reaproveitar, não duplicar"). A legenda de status da tela de
// Monitoramento renderiza os 5 status possíveis do domínio (fiel ao legado,
// CLM-24), mesmo a API de Monitoramento só retornando 3 (`status <= 3`,
// regra fixa de negócio) — ver `MonitoringStatusValue` (`@types/v2/
// Operacional/Monitoring`).
//
// NENHUM segundo enum é criado aqui — apenas um alias local do mesmo
// enum/mapa de cor já usado por `ServiceOrders` (TASK-MO-FE-01, esteira
// `97-Esteiras/057`).
// -----------------------------------------------------------------------------

export { getServiceOrderStatusOptions as getMonitoringStatusOptions } from '@/constants/serviceOrders/options/service-order-status-options';
export { getServiceOrderStatusBadgeColor as getMonitoringStatusBadgeColor } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';
