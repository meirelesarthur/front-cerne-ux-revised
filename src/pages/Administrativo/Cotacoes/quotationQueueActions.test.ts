// src/pages/Administrativo/Cotacoes/quotationQueueActions.test.ts
// Cobre a ordem e as condições das ações da fila Cotações e o "x/y" de recebidas
// (081, T-081-FE-08; LEGADO 05 AM-11..AM-14, P72).

import { describe, expect, it } from 'vitest';

import { formatReceivedQuotations, getQuotationQueueActions } from './quotationQueueActions';

const USER = 'user-1';
const allPermissions = [
  'request-purchases_view',
  'request-purchases_edit',
  'request-purchases_delete',
  'request-purchases_transfer',
  'request-quotation_view',
  'status-sla_report_view',
];

function ctx(granted: string[] = allPermissions) {
  return { userUuid: USER, can: (permission: string) => granted.includes(permission) };
}

const mine = (status: number, type = 'P') => ({
  status,
  type,
  responsible: { uuid: USER },
});

describe('getQuotationQueueActions', () => {
  it('responsável em status 2: ordem do legado, sem Receber e sem Editar/Excluir', () => {
    expect(getQuotationQueueActions(mine(2), ctx())).toEqual([
      'view',
      'slaReport',
      'transfer',
      'quote',
      'sendToAuthorization',
      'createSub',
      'stepBack',
    ]);
  });

  it('status 1 acrescenta Editar e Excluir (acréscimo do novo mantido, D-01)', () => {
    expect(getQuotationQueueActions(mine(1), ctx())).toEqual([
      'view',
      'slaReport',
      'transfer',
      'quote',
      'sendToAuthorization',
      'createSub',
      'stepBack',
      'edit',
      'delete',
    ]);
  });

  it('sem responsável aparece Receber Solicitação e some o que exige ser o responsável', () => {
    const actions = getQuotationQueueActions({ status: 2, type: 'P', responsible: null }, ctx());
    expect(actions).toContain('receive');
    expect(actions).not.toContain('quote');
    expect(actions).not.toContain('sendToAuthorization');
    expect(actions).not.toContain('createSub');
    expect(actions).not.toContain('stepBack');
  });

  it('outro responsável: só Transferir pela permissão _transfer, nunca Voltar Etapa', () => {
    const other = { status: 2, type: 'P', responsible: { uuid: 'someone-else' } };
    const actions = getQuotationQueueActions(other, ctx());
    expect(actions).toContain('transfer');
    expect(actions).not.toContain('stepBack');
    expect(actions).not.toContain('quote');

    const noTransfer = getQuotationQueueActions(
      other,
      ctx(allPermissions.filter((permission) => permission !== 'request-purchases_transfer'))
    );
    expect(noTransfer).not.toContain('transfer');
  });

  it('Cotar Pedido e Criar Sub exigem request-quotation_view (DA-4)', () => {
    const actions = getQuotationQueueActions(
      mine(2),
      ctx(allPermissions.filter((permission) => permission !== 'request-quotation_view'))
    );
    expect(actions).not.toContain('quote');
    expect(actions).not.toContain('sendToAuthorization');
    expect(actions).not.toContain('createSub');
    expect(actions).toContain('stepBack');
  });

  it('Relatório SLA só com status-sla_report_view; sem permissões some quase tudo', () => {
    const noSla = getQuotationQueueActions(
      mine(2),
      ctx(allPermissions.filter((permission) => permission !== 'status-sla_report_view'))
    );
    expect(noSla).not.toContain('slaReport');
    expect(getQuotationQueueActions(mine(2), ctx([]))).toEqual([]);
  });
});

describe('formatReceivedQuotations', () => {
  it('mostra recebidas/total, com 0 quando ausentes', () => {
    expect(formatReceivedQuotations({ received_quotations_count: 2, quotations_count: 5 })).toBe(
      '2/5'
    );
    expect(formatReceivedQuotations({})).toBe('0/0');
    expect(formatReceivedQuotations({ quotations_count: 3 })).toBe('0/3');
  });
});
