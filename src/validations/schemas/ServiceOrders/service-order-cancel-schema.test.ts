// Execução 086, FE-01 — motivo do cancelamento 5..1000 (espelho de
// `CancelServiceOrderRequest`), mensagens vindas da tradução.
import { describe, expect, it } from 'vitest';

import { languageServiceOrders as enUs } from '@/constants/languages/languageEnUs/languageServiceOrders';
import { languageServiceOrders as ptBr } from '@/constants/languages/languagePtBr/languageServiceOrders';

import type { LanguageDate } from '@/@types/language';

import { cancelServiceOrderSchema } from './service-order-cancel-schema';

const pt = { serviceOrders: ptBr } as unknown as LanguageDate;
const en = { serviceOrders: enUs } as unknown as LanguageDate;

async function messageFor(value: string | undefined, language = pt): Promise<string | null> {
  try {
    await cancelServiceOrderSchema(language).validate({ cancellation_reason: value });
    return null;
  } catch (error) {
    return (error as { message: string }).message;
  }
}

describe('cancelServiceOrderSchema', () => {
  it('motivo obrigatório (vazio, ausente e só espaços)', async () => {
    const required = ptBr.serviceOrder.cancel.validation.reasonRequired;
    expect(await messageFor('')).toBe(required);
    expect(await messageFor(undefined)).toBe(required);
    expect(await messageFor('      ')).toBe(required);
  });

  it('mínimo 5 caracteres (contando após trim) com mensagem interpolada', async () => {
    expect(await messageFor('abcd')).toBe('O motivo deve ter ao menos 5 caracteres');
    expect(await messageFor('  abcd  ')).toBe('O motivo deve ter ao menos 5 caracteres');
    expect(await messageFor('abcde')).toBeNull();
  });

  it('máximo 1000 caracteres', async () => {
    expect(await messageFor('a'.repeat(1000))).toBeNull();
    expect(await messageFor('a'.repeat(1001))).toBe('O motivo deve ter no máximo 1000 caracteres');
  });

  it('a mensagem acompanha o idioma (derivada da tradução)', async () => {
    expect(await messageFor('abc', en)).toBe('The reason must have at least 5 characters');
  });
});
