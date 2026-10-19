import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { requestQuotationPublicSchema } from './request-quotation-public-schema';

const languageGB = languagePtBr.BR;
const schema = requestQuotationPublicSchema(languageGB, false);
const messages = languageGB.requestQuotations.requestQuotation.publicForm.validation;

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

function base(unitary: number | null) {
  return {
    reponsible: 'Fornecedor',
    expiration_date: tomorrow,
    file: null,
    items: [
      {
        request_item_uuid: 'i-1',
        description: 'Item',
        quantity: 10,
        brand: 'Marca',
        unitary_value: unitary,
        observation: null,
        amount: 0,
      },
    ],
    payments: [
      {
        payment_method: { label: 'Boleto', value: 1 },
        installments: 2,
        interval: 30,
        total: null,
        amount: null,
      },
    ],
  };
}

async function errorsOf(value: unknown) {
  try {
    await schema.validate(value, { abortEarly: false });
    return [] as string[];
  } catch (error) {
    return (error as { errors: string[] }).errors;
  }
}

describe('request-quotation-public-schema — paridade com o legado', () => {
  it('aceita preço com 4 casas e "Valor Total" da condição derivado (não digitado)', async () => {
    expect(await errorsOf(base(12.3456))).toEqual([]);
  });

  it('preço unitário continua obrigatório', async () => {
    expect(await errorsOf(base(null))).toContain(messages.unitaryValueRequired);
  });

  it('não impõe mínimo ao preço (o total geral > 0 é validado no submit)', async () => {
    expect(await errorsOf(base(0))).toEqual([]);
  });

  it('mensagem de total geral igual à do legado', () => {
    expect(messages.totalValueMin).toBe('O valor deve ser maior que zero');
  });
});
