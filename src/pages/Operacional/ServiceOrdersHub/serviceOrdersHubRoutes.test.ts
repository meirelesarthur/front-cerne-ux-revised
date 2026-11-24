import { describe, expect, it } from 'vitest';

import { getInitialRequestType } from '@/pages/Administrativo/Solicitacao/initialRequestType';

import {
  HUB_CHOICE_ROUTES,
  HUB_JOURNEY_ROUTES,
  HUB_JOURNEY_STEP_KEYS,
  HUB_SHORTCUTS,
} from './serviceOrdersHubRoutes';

describe('rotas da visão geral da nova OS', () => {
  it('serviço de fora abre a solicitação já como tipo Serviço', () => {
    const [path, search] = HUB_CHOICE_ROUTES.service.split('?');
    expect(path).toBe('/administrativo/solicitacao/novo');
    expect(getInitialRequestType(`?${search}`, false)).toBe('S');
  });

  it('trabalho da equipe abre um novo apontamento', () => {
    expect(HUB_CHOICE_ROUTES.internal).toBe('/operacional/apontamentos/novo');
  });

  it('compra de produto abre a solicitação como tipo Produto', () => {
    const [, search] = HUB_CHOICE_ROUTES.purchase.split('?');
    expect(getInitialRequestType(`?${search}`, false)).toBe('P');
  });

  it('a jornada tem as 6 etapas da compra de serviço, na ordem', () => {
    expect(HUB_JOURNEY_STEP_KEYS).toEqual([
      'request',
      'approve',
      'hire',
      'execute',
      'attest',
      'pay',
    ]);
    HUB_JOURNEY_STEP_KEYS.forEach((key) =>
      expect(HUB_JOURNEY_ROUTES[key]).toMatch(/^\/(administrativo|operacional)\//)
    );
  });

  it('cada atalho tem a permissão da tela que abre', () => {
    expect(HUB_SHORTCUTS.map((s) => s.permission)).toEqual([
      'my-service-orders_view',
      'service-orders_view',
      'monitoring-service-orders_view',
      'rating-service-orders_view',
    ]);
  });
});
