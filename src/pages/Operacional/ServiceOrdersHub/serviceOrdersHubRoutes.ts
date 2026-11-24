// src/pages/Operacional/ServiceOrdersHub/serviceOrdersHubRoutes.ts
// Destinos da visão geral da nova OS. Fonte única para a tela e para o teste.
// Toda rota aqui JÁ existe em `src/router/index.tsx` (nenhuma rota de negócio nova).

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

export type HubChoiceKey = 'service' | 'internal' | 'purchase';

/** Query string lida por `CreateOrUpdateSolicitacao` para pré-selecionar o tipo. */
export const REQUEST_TYPE_QUERY_PARAM = 'tipo';

export const HUB_CHOICE_ROUTES: Record<HubChoiceKey, string> = {
  // OS = solicitação de natureza serviço (tipo S) na cadeia de compras.
  service: `/administrativo/solicitacao/novo?${REQUEST_TYPE_QUERY_PARAM}=${requestPurchaseType.servico}`,
  // Trabalho da equipe = Apontamento.
  internal: '/operacional/apontamentos/novo',
  // Produto que entra no estoque = Compra (tipo P).
  purchase: `/administrativo/solicitacao/novo?${REQUEST_TYPE_QUERY_PARAM}=${requestPurchaseType.produto}`,
};

export const HUB_JOURNEY_STEP_KEYS = [
  'request',
  'approve',
  'hire',
  'execute',
  'attest',
  'pay',
] as const;

export type HubJourneyStepKey = (typeof HUB_JOURNEY_STEP_KEYS)[number];

/** Tela atual de cada etapa (onda 1: reaproveita a cadeia de compras e a execução da OS). */
export const HUB_JOURNEY_ROUTES: Record<HubJourneyStepKey, string> = {
  request: '/administrativo/solicitacao',
  approve: '/administrativo/autorizacao',
  hire: '/administrativo/cotacoes',
  execute: '/operacional/minhas-os',
  attest: '/operacional/avaliacoes',
  pay: '/administrativo/recebimentos',
};

export const HUB_SHORTCUTS = [
  { key: 'mine', path: '/operacional/minhas-os', permission: 'my-service-orders_view' },
  { key: 'all', path: '/operacional/lista-os', permission: 'service-orders_view' },
  {
    key: 'monitoring',
    path: '/operacional/monitoramento',
    permission: 'monitoring-service-orders_view',
  },
  { key: 'ratings', path: '/operacional/avaliacoes', permission: 'rating-service-orders_view' },
] as const;
