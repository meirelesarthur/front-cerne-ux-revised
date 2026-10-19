import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { contadorSchema } from './contador-schema';

const pt = languagePtBr.BR;
const msg = pt.contadores.contador.form.validation;

const CPF = '529.982.247-25';
const CNPJ = '11.222.333/0001-81';

const base = {
  razao_social: 'Fulano de Tal',
  nome_fantasia: 'Fulano',
  cnpj: CPF,
  ie: '',
  rua: 'Rua A',
  numero: '10',
  bairro: 'Centro',
  cep: '12345-678',
  fone: '(11) 99999-9999',
  email: 'a@b.com',
  cidade_uuid: { label: 'Cidade', value: '0190a000-0000-7000-8000-000000000000' },
  issue_uuids: ['0190a000-0000-7000-8000-000000000001'],
  auto_send: true,
};

async function errorsOf(values: Record<string, unknown>) {
  try {
    await contadorSchema(pt).validate(values, { abortEarly: false });
    return {} as Record<string, string>;
  } catch (e) {
    const out: Record<string, string> = {};
    for (const inner of (e as { inner: { path: string; message: string }[] }).inner) {
      out[inner.path] = inner.message;
    }
    return out;
  }
}

describe('UT-000767 contadorSchema — IE condicional ao documento', () => {
  it('payload completo valido com CPF valido e IE vazia passa sem nenhum erro', async () => {
    expect(await errorsOf(base)).toEqual({});
  });

  it('CPF + IE vazia + issue_uuids vazio falha SOMENTE em issue_uuids', async () => {
    expect(await errorsOf({ ...base, issue_uuids: [] })).toEqual({
      issue_uuids: msg.issuesRequired,
    });
  });

  it('CPF + IE vazia + cidade nula falha SOMENTE em cidade_uuid', async () => {
    const errors = await errorsOf({ ...base, cidade_uuid: null });
    expect(Object.keys(errors)).toEqual(['cidade_uuid']);
  });

  it('CNPJ valido + IE vazia exige IE', async () => {
    expect(await errorsOf({ ...base, cnpj: CNPJ })).toEqual({ ie: msg.ieRequired });
  });

  it('documento incompleto (12 digitos) + IE vazia exige IE', async () => {
    const errors = await errorsOf({ ...base, cnpj: '123.456.789-012' });
    expect(errors.ie).toBe(msg.ieRequired);
  });

  it('IE com mais de 20 caracteres falha com ieMaxLength', async () => {
    expect((await errorsOf({ ...base, ie: '1'.repeat(21) })).ie).toBe(msg.ieMaxLength);
  });
});
