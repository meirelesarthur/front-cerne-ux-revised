import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { TransferExpense } from '@/@types/v2/Transfers';

import { transferExpenseToForm } from './useRomaneios';

const U = '44444444-4444-4444-8444-444444444444';

function expense(provider: TransferExpense['provider']): TransferExpense {
  return {
    uuid: 'e1',
    type: 'freight',
    who_pay: 'provider',
    provider,
    product: null,
    warehouse: null,
    service_reversal: null,
    quantity: 1,
    vl_unit: 1,
    value: 1,
    apropriation: 'cost',
  } as unknown as TransferExpense;
}

describe('transferExpenseToForm — label do fornecedor (DD-078-04)', () => {
  const lang = languagePtBr.BR as never;

  it('usa provider.name e preserva o uuid como value', () => {
    expect(
      transferExpenseToForm(expense({ uuid: U, name: 'Posto W' }), lang).provider_uuid
    ).toEqual({
      label: 'Posto W',
      value: U,
    });
  });

  it('sem name mostra "Não informado", nunca o uuid', () => {
    expect(transferExpenseToForm(expense({ uuid: U }), lang).provider_uuid).toEqual({
      label: 'Não informado',
      value: U,
    });
  });

  it('sem fornecedor retorna null', () => {
    expect(transferExpenseToForm(expense(null), lang).provider_uuid).toBeNull();
  });
});
