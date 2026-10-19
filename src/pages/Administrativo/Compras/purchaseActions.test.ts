// Execução 081, T-081-FE-09 — matriz de ações da lista Compras (contrato 08,
// AM-01..AM-08 e LM-09), na ordem do dropdown do legado.
import { describe, expect, it } from 'vitest';

import type {
  SupplyActionContext,
  SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

import { canSendOrder, getPurchaseActions } from './purchaseActions';

const ALL = [
  'request-buy_view',
  'request-buy_edit',
  'request-purchases_view',
  'request-purchases_edit',
  'request-purchases_transfer',
  'status-sla_report_view',
];

function ctx(permissions: string[] = ALL, userUuid = 'me'): SupplyActionContext {
  return { userUuid, can: (p) => permissions.includes(p) };
}

function row(overrides: Partial<SupplyRuleRow> = {}): SupplyRuleRow {
  return {
    status: 6,
    type: 'P',
    responsible: { uuid: 'me' },
    approved_quotations_count: 1,
    ...overrides,
  };
}

describe('getPurchaseActions', () => {
  it('status 6, responsável e uma cotação aprovada: Informar Status e Download, sem Sub', () => {
    expect(getPurchaseActions(row(), ctx())).toEqual([
      'view',
      'slaReport',
      'transfer',
      'informStatus',
      'downloadOrder',
      'stepBack',
    ]);
  });

  it('status 6, responsável e mais de uma cotação aprovada: Sub Solicitação, sem Informar Status nem Download', () => {
    const actions = getPurchaseActions(row({ approved_quotations_count: 2 }), ctx());
    expect(actions).toContain('createSub');
    expect(actions).not.toContain('informStatus');
    expect(actions).not.toContain('downloadOrder');
  });

  it('Informar Status e Sub são mutuamente exclusivos pela contagem de aprovadas', () => {
    for (const count of [0, 1, 2, 3]) {
      const actions = getPurchaseActions(row({ approved_quotations_count: count }), ctx());
      expect(actions.includes('informStatus') && actions.includes('createSub')).toBe(false);
    }
    expect(getPurchaseActions(row({ approved_quotations_count: 0 }), ctx())).not.toContain(
      'informStatus'
    );
  });

  it('quem não é o responsável não vê Informar Status, Sub, Transferir (sem _transfer) nem Voltar Etapa', () => {
    const permissions = ALL.filter((p) => p !== 'request-purchases_transfer');
    const actions = getPurchaseActions(
      row({ responsible: { uuid: 'other' }, approved_quotations_count: 2 }),
      ctx(permissions)
    );
    expect(actions).toEqual(['view', 'slaReport']);
  });

  it('Transferir aparece para quem tem request-purchases_transfer mesmo sem ser o responsável', () => {
    const actions = getPurchaseActions(row({ responsible: { uuid: 'other' } }), ctx());
    expect(actions).toContain('transfer');
    expect(actions).not.toContain('stepBack');
  });

  it('sem responsável: Receber Solicitação', () => {
    expect(getPurchaseActions(row({ responsible: null }), ctx())).toContain('receive');
    expect(getPurchaseActions(row(), ctx())).not.toContain('receive');
  });

  it('Informar Status exige request-buy_edit (perfil sem request-purchases_edit informa o status)', () => {
    const onlyBuy = ['request-buy_view', 'request-buy_edit', 'request-purchases_view'];
    expect(getPurchaseActions(row(), ctx(onlyBuy))).toContain('informStatus');
    expect(getPurchaseActions(row(), ctx(['request-buy_view']))).not.toContain('informStatus');
  });

  it('Sub Solicitação exige request-buy_edit', () => {
    const noEdit = ALL.filter((p) => p !== 'request-buy_edit');
    expect(getPurchaseActions(row({ approved_quotations_count: 2 }), ctx(noEdit))).not.toContain(
      'createSub'
    );
  });

  it('Transferir some nos status 3 e 4', () => {
    expect(getPurchaseActions(row({ status: 3 }), ctx())).not.toContain('transfer');
    expect(getPurchaseActions(row({ status: 4 }), ctx())).not.toContain('transfer');
  });

  it('Informar Status e Sub só no status 6', () => {
    for (const status of [7, 8, 10]) {
      const actions = getPurchaseActions(row({ status, approved_quotations_count: 1 }), ctx());
      expect(actions).not.toContain('informStatus');
    }
    expect(
      getPurchaseActions(row({ status: 7, approved_quotations_count: 2 }), ctx())
    ).not.toContain('createSub');
  });

  it('Relatório SLA depende de status-sla_report_view', () => {
    const noSla = ALL.filter((p) => p !== 'status-sla_report_view');
    expect(getPurchaseActions(row(), ctx(noSla))).not.toContain('slaReport');
  });
});

describe('canSendOrder (ícones WhatsApp e E-mail)', () => {
  it('status >= 6 com exatamente uma cotação aprovada e request-buy_view', () => {
    expect(canSendOrder(row({ status: 6 }), ctx())).toBe(true);
    expect(canSendOrder(row({ status: 7 }), ctx())).toBe(true);
    expect(canSendOrder(row({ status: 10 }), ctx())).toBe(true);
  });

  it('não aparece sem aprovada, com mais de uma ou sem permissão', () => {
    expect(canSendOrder(row({ approved_quotations_count: 0 }), ctx())).toBe(false);
    expect(canSendOrder(row({ approved_quotations_count: 2 }), ctx())).toBe(false);
    expect(canSendOrder(row({ approved_quotations_count: undefined }), ctx())).toBe(false);
    expect(canSendOrder(row(), ctx(['request-buy_edit']))).toBe(false);
  });

  it('não aparece antes do status 6', () => {
    expect(canSendOrder(row({ status: 5 }), ctx())).toBe(false);
  });
});
