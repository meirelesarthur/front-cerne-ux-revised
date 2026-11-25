import { describe, expect, it } from 'vitest';

import {
  PURCHASE_ORDER_PERMISSIONS,
  PURCHASE_ORDER_VIEWS,
  purchaseOrderViewPath,
  resolvePurchaseOrderView,
  visiblePurchaseOrderViews,
} from './purchaseOrderViews';

const canOnly = (...perms: string[]) => (permission: string) => perms.includes(permission);

describe('purchaseOrderViews', () => {
  it('cobre as 7 listas atuais em 9 visões (Todas + rejeitadas e canceladas separadas)', () => {
    expect(PURCHASE_ORDER_VIEWS).toHaveLength(9);
    expect(new Set(PURCHASE_ORDER_VIEWS.map((v) => v.legacyPath)).size).toBe(7);
  });

  it('abre em "Todas" por padrão, que pede o escopo completo', () => {
    const visible = visiblePurchaseOrderViews(() => true);
    expect(resolvePurchaseOrderView(null, visible)).toBe('todas');
    expect(PURCHASE_ORDER_VIEWS.at(0)?.fixedFilter).toEqual({ scope: 'all' });
  });

  it('rejeitadas e canceladas fixam a situação na mesma lista', () => {
    const byKey = Object.fromEntries(PURCHASE_ORDER_VIEWS.map((v) => [v.key, v]));
    expect(byKey.rejeitadas.fixedFilter).toEqual({ status: 5 });
    expect(byKey.canceladas.fixedFilter).toEqual({ status: 10 });
  });

  it('link antigo ?visao=encerradas abre Rejeitadas', () => {
    const visible = visiblePurchaseOrderViews(() => true);
    expect(resolvePurchaseOrderView('encerradas', visible)).toBe('rejeitadas');
  });

  it('abre a tela com qualquer uma das 6 permissões de leitura', () => {
    expect(PURCHASE_ORDER_PERMISSIONS).toEqual([
      'request-purchases_view',
      'request-authorization_view',
      'request-quotation_view',
      'request-buy_view',
      'request-receipts_view',
      'rejected-requests_view',
    ]);
  });

  it('mostra só as visões que a pessoa pode ver', () => {
    const visible = visiblePurchaseOrderViews(canOnly('request-buy_view', 'request-receipts_view'));
    expect(visible.map((v) => v.key)).toEqual(['compra', 'recebimento']);
  });

  it('request-purchases_view libera "Criadas por mim" e "Sob minha responsabilidade"', () => {
    const visible = visiblePurchaseOrderViews(canOnly('request-purchases_view'));
    expect(visible.map((v) => v.key)).toEqual(['todas', 'minhas', 'responsabilidade']);
  });

  it('respeita a visão da URL quando permitida', () => {
    const visible = visiblePurchaseOrderViews(() => true);
    expect(resolvePurchaseOrderView('aprovar', visible)).toBe('aprovar');
  });

  it('cai na primeira visão permitida quando a da URL é inválida ou proibida', () => {
    const visible = visiblePurchaseOrderViews(canOnly('request-buy_view'));
    expect(resolvePurchaseOrderView('aprovar', visible)).toBe('compra');
    expect(resolvePurchaseOrderView('xyz', visible)).toBe('compra');
    expect(resolvePurchaseOrderView(null, visible)).toBe('compra');
  });

  it('sem nenhuma permissão não há visão', () => {
    expect(resolvePurchaseOrderView('minhas', [])).toBeUndefined();
  });

  it('monta o link da visão', () => {
    expect(purchaseOrderViewPath('recebimento')).toBe('/administrativo/ordens-de-compra?visao=recebimento');
  });
});
