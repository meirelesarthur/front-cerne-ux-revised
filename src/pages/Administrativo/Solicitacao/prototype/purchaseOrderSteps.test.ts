import { describe, expect, it } from 'vitest';

import { purchaseOrderSteps } from './purchaseOrderSteps';

const states = (status: number, profile?: 'simples' | 'padrao' | 'completo', at?: 'compra' | 'cotacao') =>
  purchaseOrderSteps(status, profile, at).map((s) => `${s.key}:${s.state}`);

describe('purchaseOrderSteps', () => {
  it('pedido novo: só a primeira etapa ativa', () => {
    expect(states(1)).toEqual([
      'pedido:current',
      'cotacao:todo',
      'aprovacao:todo',
      'compra:todo',
      'recebimento:todo',
      'encerrada:todo',
    ]);
  });

  it('compra efetuada: etapas anteriores concluídas e recebimento em andamento', () => {
    expect(states(7)).toEqual([
      'pedido:done',
      'cotacao:done',
      'aprovacao:done',
      'compra:done',
      'recebimento:current',
      'encerrada:todo',
    ]);
  });

  it('compra recebida conclui o recebimento', () => {
    expect(states(8).at(4)).toBe('recebimento:done');
  });

  it('recusada para na aprovação', () => {
    expect(states(5).slice(2, 4)).toEqual(['aprovacao:stopped', 'compra:todo']);
  });

  it('cancelada para na etapa informada', () => {
    expect(states(10, 'padrao', 'cotacao').at(1)).toBe('cotacao:stopped');
    expect(states(10).at(3)).toBe('compra:stopped');
  });

  it('perfil Simples pula cotação e aprovação', () => {
    expect(states(6, 'simples')).toEqual([
      'pedido:done',
      'cotacao:skipped',
      'aprovacao:skipped',
      'compra:current',
      'recebimento:todo',
      'encerrada:todo',
    ]);
  });

  it('finalizada: tudo concluído', () => {
    expect(states(9).every((s) => s.endsWith(':done'))).toBe(true);
  });
});
