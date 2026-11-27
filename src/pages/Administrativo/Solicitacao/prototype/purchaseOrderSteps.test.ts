import { describe, expect, it } from 'vitest';

import { profilePath, purchaseOrderSteps } from './purchaseOrderSteps';

type Profile = 'simples' | 'padrao' | 'completo';
/** Só as etapas que o perfil tem (as puladas não aparecem na tela). */
const states = (status: number, profile?: Profile, at?: 'compra' | 'cotacao' | 'recebimento') =>
  purchaseOrderSteps(status, profile, at)
    .filter((s) => s.state !== 'skipped')
    .map((s) => `${s.key}:${s.state}`);

describe('etapas da Solicitação', () => {
  it('cada perfil tem um caminho diferente e todos terminam na Ordem de compra', () => {
    expect(profilePath('simples')).toEqual(['pedido', 'compra']);
    expect(profilePath('padrao')).toEqual(['pedido', 'cotacao', 'aprovacao', 'compra']);
    expect(profilePath('completo')).toEqual(['pedido', 'ciencia', 'cotacao', 'aprovacao', 'compra']);
  });

  it('pedido novo: só a primeira etapa ativa', () => {
    expect(states(1)).toEqual(['pedido:current', 'cotacao:todo', 'aprovacao:todo', 'compra:todo']);
  });

  it('Completo: aguardando ciência fica na Ciência, logo depois do pedido', () => {
    expect(states(4, 'completo').slice(0, 3)).toEqual(['pedido:done', 'ciencia:current', 'cotacao:todo']);
  });

  it('sem Ciência no perfil, aguardando ciência conta como Aprovação', () => {
    expect(states(4, 'padrao')).toEqual(['pedido:done', 'cotacao:done', 'aprovacao:current', 'compra:todo']);
  });

  it('aguardando a compra: a Ordem de compra está em andamento', () => {
    expect(states(6).at(-1)).toBe('compra:current');
  });

  it('compra efetuada, recebida ou encerrada: a Solicitação concluiu', () => {
    expect(states(7).every((s) => s.endsWith(':done'))).toBe(true);
    expect(states(8).every((s) => s.endsWith(':done'))).toBe(true);
    expect(states(9).every((s) => s.endsWith(':done'))).toBe(true);
  });

  it('recusada para na aprovação', () => {
    expect(states(5).slice(2)).toEqual(['aprovacao:stopped', 'compra:todo']);
  });

  it('cancelada para na etapa informada; etapa da Ordem conta como Ordem de compra', () => {
    expect(states(10, 'padrao', 'cotacao').at(1)).toBe('cotacao:stopped');
    expect(states(10).at(-1)).toBe('compra:stopped');
    expect(states(10, 'padrao', 'recebimento').at(-1)).toBe('compra:stopped');
  });

  it('perfil Simples vai direto do pedido para a ordem', () => {
    expect(states(6, 'simples')).toEqual(['pedido:done', 'compra:current']);
  });
});
