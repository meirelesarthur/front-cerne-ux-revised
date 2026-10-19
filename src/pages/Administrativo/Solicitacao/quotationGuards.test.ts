// src/pages/Administrativo/Solicitacao/quotationGuards.test.ts
// Cobre as regras puras da aba Cotações (081, T-081-FE-08): P20, P21, P09, AM-01 e P04.

import { describe, expect, it } from 'vitest';

import {
  buildProviderBoard,
  canAddQuotation,
  canEditStageItems,
  getLockedQuotationFields,
  hasItemsWithoutProduct,
} from './quotationGuards';

const withProduct = { product: { uuid: 'p-1' } };
const withoutProduct = { product: null };

describe('hasItemsWithoutProduct (P20)', () => {
  it('bloqueia P e U com item sem produto', () => {
    expect(hasItemsWithoutProduct('P', [withProduct, withoutProduct])).toBe(true);
    expect(hasItemsWithoutProduct('U', [withoutProduct])).toBe(true);
  });

  it('item sem a chave product também conta como sem produto', () => {
    expect(hasItemsWithoutProduct('P', [{}])).toBe(true);
  });

  it('não bloqueia quando todos os itens têm produto', () => {
    expect(hasItemsWithoutProduct('P', [withProduct, withProduct])).toBe(false);
  });

  it('não bloqueia os demais tipos (M, S, F...) nem lista vazia', () => {
    ['M', 'S', 'F', 'E', 'A', 'R', 'D', 'C', 'B'].forEach((type) => {
      expect(hasItemsWithoutProduct(type, [withoutProduct])).toBe(false);
    });
    expect(hasItemsWithoutProduct('P', [])).toBe(false);
    expect(hasItemsWithoutProduct(undefined, [withoutProduct])).toBe(false);
  });
});

describe('canEditStageItems (P21)', () => {
  const can = (granted: string[]) => (permission: string) => granted.includes(permission);

  it('edita só com bloqueio, status 1 ou 2 e request-quotation_edit', () => {
    expect(canEditStageItems(true, 1, can(['request-quotation_edit']))).toBe(true);
    expect(canEditStageItems(true, 2, can(['request-quotation_edit']))).toBe(true);
  });

  it('recusa sem bloqueio, fora do estágio ou sem permissão', () => {
    expect(canEditStageItems(false, 2, can(['request-quotation_edit']))).toBe(false);
    expect(canEditStageItems(true, 3, can(['request-quotation_edit']))).toBe(false);
    expect(canEditStageItems(true, 2, can([]))).toBe(false);
    expect(canEditStageItems(true, undefined, can(['request-quotation_edit']))).toBe(false);
  });
});

describe('getLockedQuotationFields (P09)', () => {
  it('trava fornecedor, filial e requires_file no status 3', () => {
    expect(getLockedQuotationFields(3)).toEqual({
      provider: true,
      branch: true,
      requiresFile: true,
    });
  });

  it('não trava nada nos status 1 e 2 nem na criação', () => {
    [1, 2, undefined].forEach((status) => {
      expect(getLockedQuotationFields(status)).toEqual({
        provider: false,
        branch: false,
        requiresFile: false,
      });
    });
  });
});

describe('canAddQuotation (AM-01)', () => {
  it('exige status 1 ou 2 e request-quotation_create', () => {
    const can = (permission: string) => permission === 'request-quotation_create';
    expect(canAddQuotation(1, can)).toBe(true);
    expect(canAddQuotation(2, can)).toBe(true);
    expect(canAddQuotation(3, can)).toBe(false);
    expect(canAddQuotation(2, () => false)).toBe(false);
  });
});

describe('buildProviderBoard (P04)', () => {
  it('devolve as 6 linhas na ordem do legado', () => {
    const board = buildProviderBoard({
      name: 'Agro Ltda',
      nickname: 'Agro',
      email: 'a@a.com',
      phone: '1133334444',
      cellphone: '11999998888',
      city: 'Cuiabá',
    });
    expect(board.map((row) => row.field)).toEqual([
      'corporateName',
      'tradeName',
      'email',
      'phone',
      'cellphone',
      'city',
    ]);
    expect(board[0].value).toBe('Agro Ltda');
    expect(board[4].value).toBe('11999998888');
  });

  it('sem fornecedor não há quadro; campo ausente vira texto vazio', () => {
    expect(buildProviderBoard(null)).toEqual([]);
    expect(buildProviderBoard({ name: 'X' }).find((row) => row.field === 'city')?.value).toBe('');
  });
});
