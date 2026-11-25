import { describe, expect, it } from 'vitest';

import { getInitialRequestType } from '@/pages/Administrativo/Solicitacao/initialRequestType';

import {
  HUB_CHOICES,
  HUB_JOURNEY_ROUTES,
  HUB_JOURNEY_STEP_KEYS,
  HUB_SHORTCUTS,
  REQUEST_TYPE_QUERY_PARAM,
} from './serviceOrdersHubRoutes';

describe('rotas da Central (Apontamento × Ordem de compra)', () => {
  it('tem só dois caminhos: apontamento e ordem de compra', () => {
    expect(HUB_CHOICES.map((c) => c.key)).toEqual(['internal', 'purchase']);
  });

  it('trabalho da equipe abre um novo apontamento', () => {
    expect(HUB_CHOICES[0].path).toBe('/operacional/apontamentos/novo');
    expect(HUB_CHOICES[0].permission).toBe('appropriations_view');
  });

  it('ordem de compra abre o formulário sem tipo; o tipo ainda pode vir pela URL', () => {
    expect(HUB_CHOICES[1].path).toBe('/administrativo/solicitacao/novo');
    expect(getInitialRequestType(`?${REQUEST_TYPE_QUERY_PARAM}=S`, false)).toBe('S');
  });

  it('a jornada segue os status da ordem de compra, na ordem', () => {
    expect(HUB_JOURNEY_STEP_KEYS).toEqual(['request', 'quote', 'approve', 'buy', 'receive', 'pay']);
    HUB_JOURNEY_STEP_KEYS.forEach((key) =>
      expect(HUB_JOURNEY_ROUTES[key]).toMatch(/^\/administrativo\//)
    );
  });

  it('nenhum destino aponta para telas de OS', () => {
    const paths = [
      ...HUB_CHOICES.map((c) => c.path),
      ...Object.values(HUB_JOURNEY_ROUTES),
      ...HUB_SHORTCUTS.map((s) => s.path),
    ];
    paths.forEach((p) => expect(p).not.toMatch(/lista-os|minhas-os|monitoramento|avaliacoes/));
  });
});
