import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { ChargeExpenseAncillaryDetail } from '@/@types/v2/Carregamentos';

import { chargeExpenseToForm } from './useCarregamentos';

const U = '33333333-3333-4333-8333-333333333333';

function expense(provider: ChargeExpenseAncillaryDetail['provider']): ChargeExpenseAncillaryDetail {
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
  } as unknown as ChargeExpenseAncillaryDetail;
}

describe('chargeExpenseToForm — label do fornecedor (DD-078-04)', () => {
  const lang = languagePtBr.BR as never;

  it('usa provider.name e preserva o uuid como value', () => {
    expect(chargeExpenseToForm(expense({ uuid: U, name: 'Posto W' }), lang).provider_uuid).toEqual({
      label: 'Posto W',
      value: U,
    });
  });

  it('sem name mostra "Não informado", nunca o uuid', () => {
    const option = chargeExpenseToForm(expense({ uuid: U }), lang).provider_uuid;
    expect(option).toEqual({ label: 'Não informado', value: U });
  });

  it('sem fornecedor retorna null', () => {
    expect(chargeExpenseToForm(expense(null), lang).provider_uuid).toBeNull();
  });
});
