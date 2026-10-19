// Execução 081, T-081-FE-10 — matriz de ações da lista Recebimentos (contrato 09,
// AM-01..AM-08 e LM-12), na ordem do dropdown do legado.
import { describe, expect, it } from 'vitest';

import type {
  SupplyActionContext,
  SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

import { getReceiptActions, isLaunched } from './receiptsActions';

const ALL = [
  'request-purchases_view',
  'request-purchases_edit',
  'request-purchases_transfer',
  'request-purchases_financial',
  'request-receipts_edit',
  'status-sla_report_view',
];

function ctx(permissions: string[] = ALL, userUuid = 'me'): SupplyActionContext {
  return { userUuid, can: (p) => permissions.includes(p) };
}

function row(overrides: Partial<SupplyRuleRow> = {}): SupplyRuleRow {
  return { status: 7, type: 'P', responsible: { uuid: 'me' }, has_financial: false, ...overrides };
}

describe('getReceiptActions', () => {
  it('status 7 e responsável: Confirmar Recebimento, sem Financeiro nem Finalizar', () => {
    expect(getReceiptActions(row(), ctx())).toEqual([
      'view',
      'slaReport',
      'transfer',
      'confirmReceipt',
      'stepBack',
    ]);
  });

  it('status 8, tipo S, sem financeiro: Gerar Financeiro (não Finalizar)', () => {
    const actions = getReceiptActions(row({ status: 8, type: 'S' }), ctx());
    expect(actions).toContain('generateFinancial');
    expect(actions).not.toContain('finalize');
    expect(actions).not.toContain('confirmReceipt');
  });

  it.each(['S', 'A', 'R', 'D', 'C'])('status 8, tipo %s gera financeiro', (type) => {
    expect(getReceiptActions(row({ status: 8, type }), ctx())).toContain('generateFinancial');
  });

  it.each(['P', 'F', 'E', 'M', 'U', 'B'])('status 8, tipo %s finaliza (B incluso)', (type) => {
    const actions = getReceiptActions(row({ status: 8, type }), ctx());
    expect(actions).toContain('finalize');
    expect(actions).not.toContain('generateFinancial');
  });

  it('status 8, tipo S com financeiro já gerado: nenhuma das duas', () => {
    const actions = getReceiptActions(row({ status: 8, type: 'S', has_financial: true }), ctx());
    expect(actions).not.toContain('generateFinancial');
    expect(actions).not.toContain('finalize');
  });

  it('só o responsável vê as ações de recebimento e fechamento', () => {
    const other = ctx(ALL, 'someone-else');
    expect(getReceiptActions(row({ status: 7 }), other)).not.toContain('confirmReceipt');
    expect(getReceiptActions(row({ status: 8, type: 'S' }), other)).not.toContain(
      'generateFinancial'
    );
    expect(getReceiptActions(row({ status: 8, type: 'P' }), other)).not.toContain('finalize');
    expect(getReceiptActions(row({ status: 7 }), other)).not.toContain('stepBack');
  });

  it('sem responsável: Receber aparece, sem exigir permissão', () => {
    const actions = getReceiptActions(row({ responsible: null }), ctx([]));
    expect(actions).toEqual(['receive']);
  });

  it('Transferir some nos status 3 e 4 e exige request-purchases_edit', () => {
    expect(getReceiptActions(row({ status: 3 }), ctx())).not.toContain('transfer');
    expect(getReceiptActions(row({ status: 4 }), ctx())).not.toContain('transfer');
    expect(
      getReceiptActions(row(), ctx(ALL.filter((p) => p !== 'request-purchases_edit')))
    ).not.toContain('transfer');
  });

  it('não-responsável com request-purchases_transfer ainda transfere', () => {
    expect(getReceiptActions(row(), ctx(ALL, 'other'))).toContain('transfer');
  });

  it('Relatório SLA exige status-sla_report_view', () => {
    expect(
      getReceiptActions(row(), ctx(ALL.filter((p) => p !== 'status-sla_report_view')))
    ).not.toContain('slaReport');
  });

  it('Confirmar, Financeiro e Finalizar exigem as permissões do legado', () => {
    expect(
      getReceiptActions(row(), ctx(ALL.filter((p) => p !== 'request-receipts_edit')))
    ).not.toContain('confirmReceipt');
    const noFinancial = ctx(ALL.filter((p) => p !== 'request-purchases_financial'));
    expect(getReceiptActions(row({ status: 8, type: 'S' }), noFinancial)).not.toContain(
      'generateFinancial'
    );
    expect(getReceiptActions(row({ status: 8, type: 'P' }), noFinancial)).not.toContain('finalize');
  });
});

describe('isLaunched', () => {
  it('Lançado = has_financial ou status 9', () => {
    expect(isLaunched({ has_financial: true, status: 8 })).toBe(true);
    expect(isLaunched({ has_financial: false, status: 9 })).toBe(true);
    expect(isLaunched({ has_financial: false, status: 8 })).toBe(false);
    expect(isLaunched({ status: 7 })).toBe(false);
  });
});
