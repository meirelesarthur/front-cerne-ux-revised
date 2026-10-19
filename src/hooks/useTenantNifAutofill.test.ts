// @vitest-environment jsdom
// TASK-072-FE-05 (I5) — autofill por NIF (services, CEP e toaster mockados).
import { renderHook } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findPersonByNifMock = vi.fn();
const lookupCnpjMock = vi.fn();
const autofillByCepMock = vi.fn();
const toasterCreateMock = vi.fn();

vi.mock('@/services/v2/BaseRegistrations/tenant-lookup-service', () => ({
  findPersonByNif: (nif: string) => findPersonByNifMock(nif),
  lookupCnpj: (cnpj: string) => lookupCnpjMock(cnpj),
}));

vi.mock('@/hooks/useCepAddressAutofill', () => ({
  autofillByCep: (cep: string, handlers: unknown) => autofillByCepMock(cep, handlers),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: (args: unknown) => toasterCreateMock(args) },
}));

const { autofillByNif, useTenantNifAutofill } = await import('@/hooks/useTenantNifAutofill');

const CPF = '529.982.247-25';
const CNPJ = '11.222.333/0001-81';

const messages = {
  alreadyTenant: { title: 't-already', description: 'd-already' },
  cnpjNotFound: { title: 't-notfound', description: 'd-notfound' },
  cnpjUnavailable: { title: 't-unavailable', description: 'd-unavailable' },
  rateLimited: { title: 't-rate', description: 'd-rate' },
  networkError: { title: 't-network', description: 'd-network' },
};

const cepMessages = {
  invalidFormat: { title: 'a', description: 'a' },
  notFound: { title: 'b', description: 'b' },
  cityNotResolved: { title: 'c', description: 'c' },
  networkError: { title: 'd', description: 'd' },
};

const CITY_SP = {
  uuid: 'uuid-sp',
  name: 'São Paulo',
  iso: 3550308,
  state: { uuid: 'u', uf: 'SP' },
};

const PERSON = {
  uuid: 'uuid-person',
  nif: CPF,
  nickname: 'João da Silva',
  name: 'João',
  email: 'joao@example.com',
  phone: '11987654321',
  address: 'Rua A',
  zip_code: '01001-000',
  is_tenant: false,
  city: CITY_SP,
};

const COMPANY = {
  nickname: 'ACME COMERCIO LTDA',
  name: 'ACME',
  email: 'contato@acme.com.br',
  phone: '1133334444',
  address: 'Praça da Sé, 100, Sé',
  zip_code: '01001-000',
  city: CITY_SP,
};

function httpError(status: number, data: unknown = {}) {
  return new AxiosError('http', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

function makeHandlers(mode: 'create' | 'edit' | 'view' = 'create') {
  return { mode, onField: vi.fn(), onCity: vi.fn(), messages, cepMessages };
}

function lastToast() {
  return toasterCreateMock.mock.calls.at(-1)?.[0];
}

describe('TASK-072-FE-05 — autofillByNif', () => {
  beforeEach(() => {
    findPersonByNifMock.mockReset();
    lookupCnpjMock.mockReset();
    autofillByCepMock.mockReset();
    toasterCreateMock.mockReset();
  });

  it('Person 200 preenche os campos (telefone/CEP mascarados), seleciona a cidade e NÃO chama lookupCnpj', async () => {
    findPersonByNifMock.mockResolvedValue(PERSON);
    const handlers = makeHandlers();

    const result = await autofillByNif(CPF, handlers);

    expect(result).toBe('done');
    expect(findPersonByNifMock).toHaveBeenCalledWith(CPF);
    expect(lookupCnpjMock).not.toHaveBeenCalled();
    expect(handlers.onField).toHaveBeenCalledWith('nickname', 'João da Silva');
    expect(handlers.onField).toHaveBeenCalledWith('name', 'João');
    expect(handlers.onField).toHaveBeenCalledWith('email', 'joao@example.com');
    expect(handlers.onField).toHaveBeenCalledWith('phone', '(11)98765-4321');
    expect(handlers.onField).toHaveBeenCalledWith('zip_code', '01001-000');
    expect(handlers.onField).toHaveBeenCalledWith('address', 'Rua A');
    expect(handlers.onField).not.toHaveBeenCalledWith('nif', expect.anything());
    expect(handlers.onCity).toHaveBeenCalledWith({ label: 'São Paulo — SP', value: 'uuid-sp' });
    expect(autofillByCepMock).not.toHaveBeenCalled();
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('Person já contratante → preenche e avisa sem bloquear', async () => {
    findPersonByNifMock.mockResolvedValue({ ...PERSON, is_tenant: true });
    const handlers = makeHandlers();

    await autofillByNif(CPF, handlers);

    expect(handlers.onField).toHaveBeenCalled();
    expect(lastToast()).toEqual({
      type: 'info',
      title: messages.alreadyTenant.title,
      description: messages.alreadyTenant.description,
    });
  });

  it('CPF 404 NÃO chama lookupCnpj e não avisa', async () => {
    findPersonByNifMock.mockResolvedValue(null);
    const handlers = makeHandlers();

    await autofillByNif(CPF, handlers);

    expect(lookupCnpjMock).not.toHaveBeenCalled();
    expect(handlers.onField).not.toHaveBeenCalled();
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('CNPJ 404 na pessoa → consulta a Receita pelo back com 14 dígitos e preenche', async () => {
    findPersonByNifMock.mockResolvedValue(null);
    lookupCnpjMock.mockResolvedValue(COMPANY);
    const handlers = makeHandlers();

    await autofillByNif(CNPJ, handlers);

    expect(lookupCnpjMock).toHaveBeenCalledWith('11222333000181');
    expect(handlers.onField).toHaveBeenCalledWith('nickname', 'ACME COMERCIO LTDA');
    expect(handlers.onField).toHaveBeenCalledWith('name', 'ACME');
    expect(handlers.onField).toHaveBeenCalledWith('phone', '(11)3333-4444');
    expect(handlers.onCity).toHaveBeenCalledWith({ label: 'São Paulo — SP', value: 'uuid-sp' });
  });

  it('CNPJ 404 na Receita → toast cnpjNotFound', async () => {
    findPersonByNifMock.mockResolvedValue(null);
    lookupCnpjMock.mockResolvedValue(null);
    const handlers = makeHandlers();

    await autofillByNif(CNPJ, handlers);

    expect(handlers.onField).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({
      type: 'warning',
      title: messages.cnpjNotFound.title,
      description: messages.cnpjNotFound.description,
    });
  });

  it('503 com code CNPJ_LOOKUP_UNAVAILABLE → toast cnpjUnavailable e form livre', async () => {
    findPersonByNifMock.mockResolvedValue(null);
    lookupCnpjMock.mockRejectedValue(httpError(503, { code: 'CNPJ_LOOKUP_UNAVAILABLE' }));
    const handlers = makeHandlers();

    const result = await autofillByNif(CNPJ, handlers);

    expect(result).toBe('failed');
    expect(handlers.onField).not.toHaveBeenCalled();
    expect(lastToast()).toEqual({
      type: 'warning',
      title: messages.cnpjUnavailable.title,
      description: messages.cnpjUnavailable.description,
    });
  });

  it('429 → toast rateLimited', async () => {
    findPersonByNifMock.mockRejectedValue(httpError(429));
    const handlers = makeHandlers();

    await autofillByNif(CPF, handlers);

    expect(lastToast()?.title).toBe(messages.rateLimited.title);
  });

  it('falha de rede → toast networkError; 422 é silencioso', async () => {
    findPersonByNifMock.mockRejectedValueOnce(new AxiosError('Network Error'));
    await autofillByNif(CPF, makeHandlers());
    expect(lastToast()).toEqual({
      type: 'error',
      title: messages.networkError.title,
      description: messages.networkError.description,
    });

    toasterCreateMock.mockReset();
    findPersonByNifMock.mockRejectedValueOnce(httpError(422));
    await autofillByNif(CPF, makeHandlers());
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('city null → aciona o autofill por CEP com o zip_code retornado sem sobrescrever o endereço', async () => {
    findPersonByNifMock.mockResolvedValue(null);
    lookupCnpjMock.mockResolvedValue({ ...COMPANY, city: null });
    const handlers = makeHandlers();

    await autofillByNif(CNPJ, handlers);

    expect(autofillByCepMock).toHaveBeenCalledTimes(1);
    const [cep, cepHandlers] = autofillByCepMock.mock.calls[0];
    expect(cep).toBe('01001000');
    expect(cepHandlers.messages).toBe(cepMessages);

    handlers.onField.mockClear();
    cepHandlers.onAddress('Logradouro do ViaCEP', 'Bairro');
    expect(handlers.onField).not.toHaveBeenCalled();
    cepHandlers.onCity({ label: 'São Paulo — SP', value: 'uuid-sp' });
    expect(handlers.onCity).toHaveBeenCalledWith({ label: 'São Paulo — SP', value: 'uuid-sp' });
  });

  it('modo edit/view → no-op (nenhuma consulta)', async () => {
    expect(await autofillByNif(CPF, makeHandlers('edit'))).toBe('skipped');
    expect(await autofillByNif(CPF, makeHandlers('view'))).toBe('skipped');
    expect(findPersonByNifMock).not.toHaveBeenCalled();
  });

  it('NIF com DV inválido ou parcial → não consulta', async () => {
    expect(await autofillByNif('529.982.247-24', makeHandlers())).toBe('skipped');
    expect(await autofillByNif('529.982', makeHandlers())).toBe('skipped');
    expect(findPersonByNifMock).not.toHaveBeenCalled();
  });
});

describe('TASK-072-FE-05 — useTenantNifAutofill', () => {
  beforeEach(() => {
    findPersonByNifMock.mockReset();
    toasterCreateMock.mockReset();
  });

  it('mesmo NIF em blur repetido não consulta de novo; após falha tenta de novo', async () => {
    const { result } = renderHook(() => useTenantNifAutofill());

    findPersonByNifMock.mockResolvedValue(PERSON);
    await result.current.handleNifBlur(CPF, makeHandlers());
    await result.current.handleNifBlur(CPF, makeHandlers());
    expect(findPersonByNifMock).toHaveBeenCalledTimes(1);

    findPersonByNifMock.mockReset();
    findPersonByNifMock.mockRejectedValueOnce(httpError(429)).mockResolvedValue(PERSON);
    await result.current.handleNifBlur('111.444.777-35', makeHandlers());
    await result.current.handleNifBlur('111.444.777-35', makeHandlers());
    expect(findPersonByNifMock).toHaveBeenCalledTimes(2);
  });
});
