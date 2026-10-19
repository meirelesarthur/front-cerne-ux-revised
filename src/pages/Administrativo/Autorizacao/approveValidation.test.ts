// Execução 081, T-081-FE-06 — validações da "Próxima Etapa" da Aprovação (IG05,
// IG06 e mensagens do servidor RA:183-250), seleção de cotação e lápis do item.
import { describe, expect, it } from 'vitest';

import {
  canEditItemQuantity,
  canTransferInApproval,
  initialSelectedQuotations,
  isJustifyFilled,
  quotationHasPayment,
  selectedPayment,
  shouldAutoPromote,
  validateApprove,
} from './authorizationRules';

const base = {
  justify: 'ok',
  type: 'P',
  quotationsCount: 2,
  selectedQuotationCount: 1,
  itemsCount: 2,
  selectedItemCount: 2,
};

describe('validateApprove', () => {
  it('IG05: sem comentário bloqueia primeiro', () => {
    expect(validateApprove({ ...base, justify: '   ', selectedQuotationCount: 0 })).toBe('comment');
  });

  it('IG06: há cotações e nenhuma marcada', () => {
    expect(validateApprove({ ...base, selectedQuotationCount: 0 })).toBe('quotation');
  });

  it('P/S/U/M sem item marcado: "items"', () => {
    for (const type of ['P', 'S', 'U', 'M']) {
      expect(validateApprove({ ...base, type, selectedItemCount: 0 })).toBe('items');
    }
  });

  it('um item e mais de uma cotação: "singleItemQuotations"', () => {
    expect(validateApprove({ ...base, selectedItemCount: 1, selectedQuotationCount: 2 })).toBe(
      'singleItemQuotations'
    );
  });

  it('tipos sem cotação (A, D, C, F...) aprovam sem itens nem cotação', () => {
    expect(
      validateApprove({
        ...base,
        type: 'D',
        quotationsCount: 0,
        selectedQuotationCount: 0,
        selectedItemCount: 0,
      })
    ).toBeNull();
  });

  it('caminho feliz', () => {
    expect(validateApprove(base)).toBeNull();
  });
});

describe('cotações e itens', () => {
  it('cotação com forma de pagamento escolhida ou com condição única', () => {
    expect(quotationHasPayment({ selected_payment_uuid: 'p1', payments: [] })).toBe(true);
    expect(quotationHasPayment({ selected_payment_uuid: null, payments: [{} as any] })).toBe(true);
    expect(
      quotationHasPayment({ selected_payment_uuid: null, payments: [{} as any, {} as any] })
    ).toBe(false);
    expect(quotationHasPayment({ selected_payment_uuid: null, payments: [] })).toBe(false);
  });

  it('forma de pagamento exibida: a escolhida, ou a única condição', () => {
    const a = { uuid: 'a' };
    const b = { uuid: 'b' };
    expect(selectedPayment({ selected_payment_uuid: 'b', payments: [a, b] })).toBe(b);
    expect(selectedPayment({ selected_payment_uuid: null, payments: [a] })).toBe(a);
    expect(selectedPayment({ selected_payment_uuid: null, payments: [a, b] })).toBeNull();
    expect(selectedPayment({ selected_payment_uuid: 'x', payments: [a] })).toBeNull();
  });

  it('marca sozinha só a cotação única que tem pagamento', () => {
    const withPayment = { uuid: 'q1', selected_payment_uuid: 'p', payments: [] } as any;
    const without = { uuid: 'q2', selected_payment_uuid: null, payments: [] } as any;
    expect(initialSelectedQuotations([withPayment])).toEqual(['q1']);
    expect(initialSelectedQuotations([without])).toEqual([]);
    expect(initialSelectedQuotations([withPayment, withPayment])).toEqual([]);
  });

  it('lápis do item só em P/S/U/M com cotação', () => {
    expect(canEditItemQuantity('P', 1)).toBe(true);
    expect(canEditItemQuantity('M', 2)).toBe(true);
    expect(canEditItemQuantity('P', 0)).toBe(false);
    expect(canEditItemQuantity('D', 3)).toBe(false);
  });
});

describe('ações', () => {
  it('justificativa preenchida', () => {
    expect(isJustifyFilled('  ')).toBe(false);
    expect(isJustifyFilled('x')).toBe(true);
  });

  it('Transf. Responsável da Aprovação: edit + (responsável ou transfer)', () => {
    const can = (granted: string[]) => (p: string) => granted.includes(p);
    expect(
      canTransferInApproval({ userUuid: 'u1', can: can(['request-purchases_edit']) }, 'u1')
    ).toBe(true);
    expect(
      canTransferInApproval({ userUuid: 'u1', can: can(['request-purchases_edit']) }, 'u2')
    ).toBe(false);
    expect(
      canTransferInApproval(
        { userUuid: 'u1', can: can(['request-purchases_edit', 'request-purchases_transfer']) },
        'u2'
      )
    ).toBe(true);
    expect(canTransferInApproval({ userUuid: 'u1', can: can([]) }, 'u1')).toBe(false);
  });

  it('promoção automática só com flag, responsável da Ciência e permissão', () => {
    const ctx = { auto_promote_available: true, can_acknowledge_second_level: true };
    expect(shouldAutoPromote(ctx, true)).toBe(true);
    expect(shouldAutoPromote(ctx, false)).toBe(false);
    expect(shouldAutoPromote({ ...ctx, auto_promote_available: false }, true)).toBe(false);
    expect(shouldAutoPromote({ ...ctx, can_acknowledge_second_level: false }, true)).toBe(false);
    expect(shouldAutoPromote(null, true)).toBe(false);
  });
});
