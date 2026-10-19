// src/components/Suprimentos/supplyActionRules.test.ts
// Execução 081, T-081-FE-01 — uma linha de teste por ação do manifesto do
// legado (contratos 03 AC01..AC05, 04 AM01..AM16, 05 AM-11..AM-13, 08 AM-01..AM-08,
// 09 AM-05..AM-07) com os ajustes de permissão do plano (A-01).
import { describe, expect, it } from 'vitest';

import {
  canAcknowledge,
  canAuthorize,
  canConfirmReceipt,
  canDelete,
  canDownloadOrder,
  canEdit,
  canFinalize,
  canGenerateFinancial,
  canInformStatus,
  canQuote,
  canReceive,
  canSendToAuthorization,
  canSeparate,
  canStepBack,
  canTransfer,
  isEmergency,
  isResponsible,
  type SupplyActionContext,
  type SupplyRuleRow,
} from './supplyActionRules';

const ME = 'user-me';
const OTHER = 'user-other';

function ctx(
  permissions: string[] = [],
  overrides: Partial<SupplyActionContext> = {}
): SupplyActionContext {
  return { userUuid: ME, can: (permission) => permissions.includes(permission), ...overrides };
}

function row(overrides: Partial<SupplyRuleRow> = {}): SupplyRuleRow {
  return { status: 1, type: 'P', responsible: { uuid: ME }, ...overrides };
}

describe('isResponsible', () => {
  it('é o responsável quando o uuid bate', () => {
    expect(isResponsible(row(), ctx())).toBe(true);
  });
  it('não é quando o responsável é outro, ausente ou sem usuário logado', () => {
    expect(isResponsible(row({ responsible: { uuid: OTHER } }), ctx())).toBe(false);
    expect(isResponsible(row({ responsible: null }), ctx())).toBe(false);
    expect(isResponsible(row(), ctx([], { userUuid: null }))).toBe(false);
  });
  it('assumeResponsible (Meus Processos) vale mesmo sem o objeto responsible', () => {
    expect(
      isResponsible(row({ responsible: undefined }), ctx([], { assumeResponsible: true }))
    ).toBe(true);
  });
});

describe('Solicitação — Editar / Excluir (status 1)', () => {
  it('Editar: status 1 + request-purchases_edit', () => {
    expect(canEdit(row({ status: 1 }), ctx(['request-purchases_edit']))).toBe(true);
    expect(canEdit(row({ status: 2 }), ctx(['request-purchases_edit']))).toBe(false);
    expect(canEdit(row({ status: 1 }), ctx([]))).toBe(false);
  });
  it('Excluir: status 1 + request-purchases_delete', () => {
    expect(canDelete(row({ status: 1 }), ctx(['request-purchases_delete']))).toBe(true);
    expect(canDelete(row({ status: 6 }), ctx(['request-purchases_delete']))).toBe(false);
    expect(canDelete(row({ status: 1 }), ctx([]))).toBe(false);
  });
});

describe('Receber Solicitação — sem gate de permissão', () => {
  it('aparece só sem responsável', () => {
    expect(canReceive(row({ responsible: null }))).toBe(true);
    expect(canReceive(row({ responsible: undefined }))).toBe(true);
    expect(canReceive(row({ responsible: { uuid: OTHER } }))).toBe(false);
  });
});

describe('Transferir Responsável', () => {
  const edit = ['request-purchases_edit'];
  it.each([1, 2, 5, 6, 7, 8, 9, 10, 11])('responsável no status %i com _edit', (status) => {
    expect(canTransfer(row({ status }), ctx(edit))).toBe(true);
  });
  it.each([3, 4])('nunca nos status 3 e 4 (status %i)', (status) => {
    expect(canTransfer(row({ status }), ctx([...edit, 'request-purchases_transfer']))).toBe(false);
  });
  it('não responsável sem _transfer: não aparece; com _transfer: aparece', () => {
    const other = row({ status: 6, responsible: { uuid: OTHER } });
    expect(canTransfer(other, ctx(edit))).toBe(false);
    expect(canTransfer(other, ctx([...edit, 'request-purchases_transfer']))).toBe(true);
  });
  it('sem request-purchases_edit não aparece nem para o responsável', () => {
    expect(canTransfer(row({ status: 6 }), ctx(['request-purchases_transfer']))).toBe(false);
  });
});

describe('Voltar Etapa — só o responsável', () => {
  const edit = ['request-purchases_edit'];
  it('responsável com _edit', () => {
    expect(canStepBack(row({ status: 6 }), ctx(edit))).toBe(true);
  });
  it('outro usuário, mesmo com _transfer: não', () => {
    expect(
      canStepBack(
        row({ responsible: { uuid: OTHER } }),
        ctx([...edit, 'request-purchases_transfer'])
      )
    ).toBe(false);
  });
  it('sem _edit: não', () => {
    expect(canStepBack(row(), ctx([]))).toBe(false);
  });
  it('na lista de Solicitação o legado esconde no status 1', () => {
    expect(canStepBack(row({ status: 1 }), ctx(edit), { excludeFirstStatus: true })).toBe(false);
    expect(canStepBack(row({ status: 2 }), ctx(edit), { excludeFirstStatus: true })).toBe(true);
    expect(canStepBack(row({ status: 1 }), ctx(edit))).toBe(true);
  });
});

describe('Cotar Pedido / Enviar Autorização (status 1 e 2, responsável, request-quotation_view)', () => {
  const view = ['request-quotation_view'];
  it.each([1, 2])('status %i responsável', (status) => {
    expect(canQuote(row({ status }), ctx(view))).toBe(true);
    expect(canSendToAuthorization(row({ status }), ctx(view))).toBe(true);
  });
  it.each([3, 4, 5, 6, 11])('fora de {1,2} (status %i) não aparece', (status) => {
    expect(canQuote(row({ status }), ctx(view))).toBe(false);
    expect(canSendToAuthorization(row({ status }), ctx(view))).toBe(false);
  });
  it('não responsável ou sem permissão: não aparece', () => {
    expect(canQuote(row({ status: 1, responsible: { uuid: OTHER } }), ctx(view))).toBe(false);
    expect(canQuote(row({ status: 1 }), ctx([]))).toBe(false);
    expect(canSendToAuthorization(row({ status: 1 }), ctx([]))).toBe(false);
  });
});

describe('Autorizar (status 3 + is_authorizer) e Acusar ciência (status 4 + responsável)', () => {
  const auth = ['request-authorization_edit'];
  it('Autorizar', () => {
    expect(canAuthorize(row({ status: 3, is_authorizer: true }), ctx(auth))).toBe(true);
    expect(canAuthorize(row({ status: 3, is_authorizer: false }), ctx(auth))).toBe(false);
    expect(canAuthorize(row({ status: 3 }), ctx(auth))).toBe(false);
    expect(canAuthorize(row({ status: 4, is_authorizer: true }), ctx(auth))).toBe(false);
    expect(canAuthorize(row({ status: 3, is_authorizer: true }), ctx([]))).toBe(false);
  });
  it('Acusar ciência', () => {
    expect(canAcknowledge(row({ status: 4 }), ctx(auth))).toBe(true);
    expect(canAcknowledge(row({ status: 4, responsible: { uuid: OTHER } }), ctx(auth))).toBe(false);
    expect(canAcknowledge(row({ status: 3 }), ctx(auth))).toBe(false);
    expect(canAcknowledge(row({ status: 4 }), ctx([]))).toBe(false);
  });
});

describe('Informar Status x Criar Sub Solicitação (status 6, contagem de aprovadas)', () => {
  const buy = ['request-buy_edit'];
  it('Informar Status: uma aprovada + request-buy_edit', () => {
    expect(canInformStatus(row({ status: 6, approved_quotations_count: 1 }), ctx(buy))).toBe(true);
    expect(canInformStatus(row({ status: 6, approved_quotations_count: 2 }), ctx(buy))).toBe(false);
    expect(canInformStatus(row({ status: 6, approved_quotations_count: 0 }), ctx(buy))).toBe(false);
    expect(canInformStatus(row({ status: 6 }), ctx(buy))).toBe(false);
    expect(canInformStatus(row({ status: 7, approved_quotations_count: 1 }), ctx(buy))).toBe(false);
    expect(canInformStatus(row({ status: 6, approved_quotations_count: 1 }), ctx([]))).toBe(false);
    expect(
      canInformStatus(
        row({ status: 6, approved_quotations_count: 1, responsible: { uuid: OTHER } }),
        ctx(buy)
      )
    ).toBe(false);
  });
  it('Sub Solicitação (compra): mais de uma aprovada, sem permissão adicional', () => {
    expect(canSeparate(row({ status: 6, approved_quotations_count: 2 }), ctx())).toBe(true);
    expect(canSeparate(row({ status: 6, approved_quotations_count: 1 }), ctx())).toBe(false);
    expect(canSeparate(row({ status: 5, approved_quotations_count: 2 }), ctx())).toBe(false);
    expect(
      canSeparate(
        row({ status: 6, approved_quotations_count: 2, responsible: { uuid: OTHER } }),
        ctx()
      )
    ).toBe(false);
  });
  it('Informar Status e Sub são mutuamente exclusivos', () => {
    for (const count of [0, 1, 2, 3]) {
      const r = row({ status: 6, approved_quotations_count: count });
      const c = ctx(buy);
      expect(canInformStatus(r, c) && canSeparate(r, c)).toBe(false);
    }
  });
  it('Sub Solicitação (cotação): status 1/2 + responsável + request-quotation_view', () => {
    const view = ['request-quotation_view'];
    expect(canSeparate(row({ status: 2 }), ctx(view), 'quotation')).toBe(true);
    expect(canSeparate(row({ status: 3 }), ctx(view), 'quotation')).toBe(false);
    expect(canSeparate(row({ status: 2 }), ctx([]), 'quotation')).toBe(false);
  });
});

describe('Download Arquivo (status >= 6 e uma aprovada)', () => {
  it.each([6, 7, 8, 9, 10, 11])('Meus Processos: responsável, status %i', (status) => {
    expect(canDownloadOrder(row({ status, approved_quotations_count: 1 }), ctx())).toBe(true);
  });
  it('não aparece com status < 6 ou com contagem diferente de 1', () => {
    expect(canDownloadOrder(row({ status: 5, approved_quotations_count: 1 }), ctx())).toBe(false);
    expect(canDownloadOrder(row({ status: 6, approved_quotations_count: 2 }), ctx())).toBe(false);
    expect(canDownloadOrder(row({ status: 6 }), ctx())).toBe(false);
  });
  it('Compras: exige request-buy_view (não o responsável)', () => {
    const other = row({ status: 6, approved_quotations_count: 1, responsible: { uuid: OTHER } });
    expect(canDownloadOrder(other, ctx(['request-buy_view']), 'purchases')).toBe(true);
    expect(canDownloadOrder(other, ctx([]), 'purchases')).toBe(false);
    expect(canDownloadOrder(other, ctx(), 'myProcesses')).toBe(false);
  });
});

describe('Confirmar Recebimento (status 7 + responsável + request-receipts_edit)', () => {
  it('casos', () => {
    const edit = ['request-receipts_edit'];
    expect(canConfirmReceipt(row({ status: 7 }), ctx(edit))).toBe(true);
    expect(canConfirmReceipt(row({ status: 8 }), ctx(edit))).toBe(false);
    expect(canConfirmReceipt(row({ status: 7, responsible: { uuid: OTHER } }), ctx(edit))).toBe(
      false
    );
    expect(canConfirmReceipt(row({ status: 7 }), ctx([]))).toBe(false);
  });
});

describe('Gerar Financeiro x Finalizar Pedido (status 8)', () => {
  const fin = ['request-purchases_financial'];
  it.each(['S', 'A', 'R', 'D', 'C'])('Gerar Financeiro no tipo %s sem financeiro', (type) => {
    expect(canGenerateFinancial(row({ status: 8, type }), ctx(fin))).toBe(true);
    expect(canFinalize(row({ status: 8, type }), ctx(fin))).toBe(false);
  });
  it.each(['P', 'U', 'F', 'E', 'M'])('Finalizar Pedido no tipo %s (Meus Processos)', (type) => {
    expect(canFinalize(row({ status: 8, type }), ctx(fin))).toBe(true);
    expect(canGenerateFinancial(row({ status: 8, type }), ctx(fin))).toBe(false);
  });
  it('tipo B: nenhuma das duas em Meus Processos; Finalizar aparece em Recebimentos', () => {
    expect(canGenerateFinancial(row({ status: 8, type: 'B' }), ctx(fin))).toBe(false);
    expect(canFinalize(row({ status: 8, type: 'B' }), ctx(fin), 'myProcesses')).toBe(false);
    expect(canFinalize(row({ status: 8, type: 'B' }), ctx(fin), 'receipts')).toBe(true);
  });
  it('com financeiro já lançado, Gerar Financeiro some', () => {
    expect(canGenerateFinancial(row({ status: 8, type: 'S', has_financial: true }), ctx(fin))).toBe(
      false
    );
  });
  it('só no status 8, só responsável e só com request-purchases_financial', () => {
    expect(canGenerateFinancial(row({ status: 7, type: 'S' }), ctx(fin))).toBe(false);
    expect(canFinalize(row({ status: 9, type: 'P' }), ctx(fin))).toBe(false);
    expect(canFinalize(row({ status: 8, type: 'P', responsible: { uuid: OTHER } }), ctx(fin))).toBe(
      false
    );
    expect(canFinalize(row({ status: 8, type: 'P' }), ctx([]))).toBe(false);
    expect(canGenerateFinancial(row({ status: 8, type: 'S' }), ctx([]))).toBe(false);
  });
});

describe('isEmergency', () => {
  it('tipo U', () => {
    expect(isEmergency({ type: 'U' })).toBe(true);
    expect(isEmergency({ type: 'P' })).toBe(false);
  });
});
