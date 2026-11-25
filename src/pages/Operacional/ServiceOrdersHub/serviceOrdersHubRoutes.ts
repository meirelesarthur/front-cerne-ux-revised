// src/pages/Operacional/ServiceOrdersHub/serviceOrdersHubRoutes.ts
// Destinos da Central (Apontamento × Ordem de compra). Fonte única para a tela e
// para o teste. Toda rota aqui JÁ existe em `src/router/index.tsx`.
//
// A Ordem de Serviço foi desligada (`SERVICE_ORDERS_ENABLED`): serviço de fora é
// uma Ordem de compra do tipo Serviço, confirmada no Recebimento.

/** Query string lida por `CreateOrUpdateSolicitacao` para pré-selecionar o tipo. */
export const REQUEST_TYPE_QUERY_PARAM = 'tipo';

export type HubChoiceKey = 'internal' | 'purchase';

export const HUB_CHOICES: readonly { key: HubChoiceKey; path: string; permission: string }[] = [
  // Trabalho da equipe = Apontamento.
  { key: 'internal', path: '/operacional/apontamentos/novo', permission: 'appropriations_view' },
  // Produto ou serviço de fora = Ordem de compra (o tipo é escolhido no formulário).
  {
    key: 'purchase',
    path: '/administrativo/solicitacao/novo',
    permission: 'request-purchases_view',
  },
];

export const HUB_JOURNEY_STEP_KEYS = [
  'request',
  'quote',
  'approve',
  'buy',
  'receive',
  'pay',
] as const;

export type HubJourneyStepKey = (typeof HUB_JOURNEY_STEP_KEYS)[number];

/** Tela atual de cada etapa da Ordem de compra (mesma ordem dos status do sistema). */
export const HUB_JOURNEY_ROUTES: Record<HubJourneyStepKey, string> = {
  request: '/administrativo/solicitacao',
  quote: '/administrativo/cotacoes',
  approve: '/administrativo/autorizacao',
  buy: '/administrativo/compras',
  receive: '/administrativo/recebimentos',
  pay: '/administrativo/recebimentos',
};

export const HUB_SHORTCUTS = [
  { key: 'appropriations', path: '/operacional/apontamentos', permission: 'appropriations_view' },
  { key: 'orders', path: '/administrativo/solicitacao', permission: 'request-purchases_view' },
  { key: 'mine', path: '/administrativo/meus-processos', permission: 'request-purchases_view' },
  { key: 'receipts', path: '/administrativo/recebimentos', permission: 'request-receipts_view' },
] as const;
