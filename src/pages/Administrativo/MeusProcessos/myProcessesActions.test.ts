// Execução 081, T-081-FE-07 — matriz status x tipo x papel das 16 ações de
// Meus Processos (contrato 04, AM01..AM16), na ordem do dropdown do legado.
import { describe, expect, it } from 'vitest';

import type {
  SupplyActionContext,
  SupplyRuleRow,
} from '@/components/Suprimentos/supplyActionRules';

import { getMyProcessesActions, myProcessesRoutes } from './myProcessesActions';

const ALL_PERMISSIONS = [
  'request-purchases_view',
  'request-purchases_edit',
  'request-purchases_delete',
  'request-purchases_transfer',
  'request-purchases_financial',
  'status-sla_report_view',
  'request-authorization_edit',
  'request-quotation_view',
  'request-buy_edit',
  'request-receipts_edit',
];

function ctx(permissions: string[] = ALL_PERMISSIONS): SupplyActionContext {
  return {
    userUuid: 'me',
    can: (permission) => permissions.includes(permission),
    assumeResponsible: true,
  };
}

function row(overrides: Partial<SupplyRuleRow> = {}): SupplyRuleRow {
  return { status: 1, type: 'P', ...overrides };
}

describe('getMyProcessesActions', () => {
  it('status 1: Visualizar, SLA, Editar, Excluir, Transferir, Cotar, Enviar Autorização e Voltar Etapa', () => {
    expect(getMyProcessesActions(row({ status: 1 }), ctx())).toEqual([
      'view',
      'slaReport',
      'edit',
      'delete',
      'transfer',
      'quote',
      'sendToAuthorization',
      'stepBack',
    ]);
  });

  it('status 2: sem Editar nem Excluir, com Cotar e Enviar Autorização', () => {
    const actions = getMyProcessesActions(row({ status: 2 }), ctx());
    expect(actions).not.toContain('edit');
    expect(actions).not.toContain('delete');
    expect(actions).toContain('quote');
    expect(actions).toContain('sendToAuthorization');
  });

  it('status 3: Autorizar só para o autorizador e sem Transferir', () => {
    const asAuthorizer = getMyProcessesActions(row({ status: 3, is_authorizer: true }), ctx());
    expect(asAuthorizer).toContain('authorize');
    expect(asAuthorizer).not.toContain('transfer');

    const notAuthorizer = getMyProcessesActions(row({ status: 3, is_authorizer: false }), ctx());
    expect(notAuthorizer).not.toContain('authorize');
    expect(getMyProcessesActions(row({ status: 3 }), ctx())).not.toContain('authorize');
  });

  it('status 4: Acusar ciência e sem Transferir', () => {
    const actions = getMyProcessesActions(row({ status: 4 }), ctx());
    expect(actions).toContain('acknowledge');
    expect(actions).not.toContain('transfer');
    expect(actions).not.toContain('authorize');
  });

  it('status 5: Visualizar, SLA, Transferir e Voltar Etapa', () => {
    expect(getMyProcessesActions(row({ status: 5 }), ctx())).toEqual([
      'view',
      'slaReport',
      'transfer',
      'stepBack',
    ]);
  });

  it('status 6: Informar Status com uma aprovada, Criar Sub com mais de uma, nunca os dois', () => {
    const one = getMyProcessesActions(row({ status: 6, approved_quotations_count: 1 }), ctx());
    expect(one).toContain('informStatus');
    expect(one).not.toContain('createSub');
    expect(one).toContain('downloadOrder');

    const many = getMyProcessesActions(row({ status: 6, approved_quotations_count: 2 }), ctx());
    expect(many).toContain('createSub');
    expect(many).not.toContain('informStatus');
    expect(many).not.toContain('downloadOrder');

    const none = getMyProcessesActions(row({ status: 6, approved_quotations_count: 0 }), ctx());
    expect(none).not.toContain('informStatus');
    expect(none).not.toContain('createSub');
  });

  it('Informar Status exige request-buy_edit; Criar Sub não exige permissão extra', () => {
    const permissions = ALL_PERMISSIONS.filter((permission) => permission !== 'request-buy_edit');
    expect(
      getMyProcessesActions(row({ status: 6, approved_quotations_count: 1 }), ctx(permissions))
    ).not.toContain('informStatus');
    expect(
      getMyProcessesActions(row({ status: 6, approved_quotations_count: 2 }), ctx(permissions))
    ).toContain('createSub');
  });

  it('status 7: Confirmar Recebimento com request-receipts_edit', () => {
    expect(getMyProcessesActions(row({ status: 7 }), ctx())).toContain('confirmReceipt');
    const permissions = ALL_PERMISSIONS.filter(
      (permission) => permission !== 'request-receipts_edit'
    );
    expect(getMyProcessesActions(row({ status: 7 }), ctx(permissions))).not.toContain(
      'confirmReceipt'
    );
    expect(getMyProcessesActions(row({ status: 8 }), ctx())).not.toContain('confirmReceipt');
  });

  it.each(['S', 'A', 'R', 'D', 'C'])(
    'status 8, tipo %s: Gerar Financeiro e não Finalizar',
    (type) => {
      const actions = getMyProcessesActions(row({ status: 8, type }), ctx());
      expect(actions).toContain('generateFinancial');
      expect(actions).not.toContain('finalize');
    }
  );

  it('Gerar Financeiro some quando já existe lançamento financeiro', () => {
    expect(
      getMyProcessesActions(row({ status: 8, type: 'S', has_financial: true }), ctx())
    ).not.toContain('generateFinancial');
  });

  it.each(['P', 'U', 'F', 'E', 'M'])(
    'status 8, tipo %s: Finalizar Pedido e não Gerar Financeiro',
    (type) => {
      const actions = getMyProcessesActions(row({ status: 8, type }), ctx());
      expect(actions).toContain('finalize');
      expect(actions).not.toContain('generateFinancial');
    }
  );

  it('status 8, tipo B: nem Gerar Financeiro nem Finalizar (como no legado)', () => {
    const actions = getMyProcessesActions(row({ status: 8, type: 'B' }), ctx());
    expect(actions).not.toContain('generateFinancial');
    expect(actions).not.toContain('finalize');
  });

  it('Gerar Financeiro e Finalizar exigem request-purchases_financial', () => {
    const permissions = ALL_PERMISSIONS.filter(
      (permission) => permission !== 'request-purchases_financial'
    );
    expect(getMyProcessesActions(row({ status: 8, type: 'S' }), ctx(permissions))).not.toContain(
      'generateFinancial'
    );
    expect(getMyProcessesActions(row({ status: 8, type: 'P' }), ctx(permissions))).not.toContain(
      'finalize'
    );
  });

  it('Download Arquivo: status 6 ou mais com uma cotação aprovada, sem permissão extra', () => {
    expect(
      getMyProcessesActions(row({ status: 7, approved_quotations_count: 1 }), ctx([]))
    ).toEqual(['downloadOrder']);
    expect(
      getMyProcessesActions(row({ status: 5, approved_quotations_count: 1 }), ctx([]))
    ).toEqual([]);
  });

  it('sem nenhuma permissão: só as ações sem @can do legado (Download e Sub)', () => {
    expect(
      getMyProcessesActions(row({ status: 6, approved_quotations_count: 2 }), ctx([]))
    ).toEqual(['createSub']);
  });

  it('Transferir também aparece para quem tem request-purchases_transfer quando não é a lista própria', () => {
    const outsider: SupplyActionContext = {
      userUuid: 'me',
      can: (permission) =>
        ['request-purchases_edit', 'request-purchases_transfer'].includes(permission),
    };
    expect(
      getMyProcessesActions(row({ status: 5, responsible: { uuid: 'other' } }), outsider)
    ).toContain('transfer');
  });

  it('rotas de destino', () => {
    expect(myProcessesRoutes.view('u')).toBe('/administrativo/solicitacao/u/visualizar');
    expect(myProcessesRoutes.confirmReceipt('u')).toBe('/administrativo/recebimentos/u/confirmar');
    expect(myProcessesRoutes.generateFinancial('u')).toBe(
      '/administrativo/recebimentos/u/financeiro'
    );
    expect(myProcessesRoutes.finalize('u')).toBe('/administrativo/recebimentos/u/finalizar');
    expect(myProcessesRoutes.authorization('u')).toBe('/administrativo/autorizacao/u');
  });
});
