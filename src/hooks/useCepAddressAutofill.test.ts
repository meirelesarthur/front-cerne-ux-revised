// TASK-072-FE-04 — autofill de endereço por CEP (ViaCEP + /cities?iso= mockados).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAddressByCepMock = vi.fn();
const getCityByIsoMock = vi.fn();
const toasterCreateMock = vi.fn();

vi.mock('@/services/viacep', () => ({
  getAddressByCep: (cep: string) => getAddressByCepMock(cep),
}));

vi.mock('@/services/v2/Cities/city-service', () => ({
  getCityByIso: (iso: number) => getCityByIsoMock(iso),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: (args: unknown) => toasterCreateMock(args) },
}));

const { autofillByCep, useCepAddressAutofill } = await import('@/hooks/useCepAddressAutofill');

const messages = {
  invalidFormat: { title: 'Formato de CEP inválido.', description: 'd-invalid' },
  notFound: { title: 'CEP não encontrado.', description: 'd-notfound' },
  cityNotResolved: { title: 'Cidade não localizada', description: 'd-city' },
  networkError: { title: 'Falha ao consultar o CEP', description: 'd-network' },
};

const VIACEP_SE = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
};

function makeHandlers() {
  return { onAddress: vi.fn(), onCity: vi.fn(), messages };
}

describe('TASK-072-FE-04 — useCepAddressAutofill', () => {
  beforeEach(() => {
    getAddressByCepMock.mockReset();
    getCityByIsoMock.mockReset();
    toasterCreateMock.mockReset();
  });

  it('8 dígitos com sucesso → limpa, preenche o endereço e seleciona a cidade pelo IBGE', async () => {
    getAddressByCepMock.mockResolvedValue(VIACEP_SE);
    getCityByIsoMock.mockResolvedValue({
      uuid: 'uuid-sp',
      title: 'São Paulo',
      state: { letter: 'SP' },
    });
    const handlers = makeHandlers();

    await autofillByCep('01001-000', handlers);

    expect(getAddressByCepMock).toHaveBeenCalledWith('01001000');
    expect(getCityByIsoMock).toHaveBeenCalledWith(3550308);
    expect(handlers.onAddress).toHaveBeenNthCalledWith(1, '', '');
    expect(handlers.onAddress).toHaveBeenNthCalledWith(2, 'Praça da Sé', 'Sé');
    expect(handlers.onCity).toHaveBeenCalledWith({ label: 'São Paulo — SP', value: 'uuid-sp' });
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('7 dígitos → toast invalidFormat, sem fetch e sem mexer no endereço', async () => {
    const handlers = makeHandlers();

    await autofillByCep('0100-100', handlers);

    expect(getAddressByCepMock).not.toHaveBeenCalled();
    expect(handlers.onAddress).not.toHaveBeenCalled();
    expect(toasterCreateMock).toHaveBeenCalledWith({
      type: 'warning',
      title: messages.invalidFormat.title,
      description: messages.invalidFormat.description,
    });
  });

  it('vazio → nada acontece', async () => {
    const handlers = makeHandlers();

    await autofillByCep('', handlers);
    await autofillByCep('-', handlers);

    expect(getAddressByCepMock).not.toHaveBeenCalled();
    expect(handlers.onAddress).not.toHaveBeenCalled();
    expect(toasterCreateMock).not.toHaveBeenCalled();
  });

  it('ViaCEP null → toast notFound e endereço fica vazio', async () => {
    getAddressByCepMock.mockResolvedValue(null);
    const handlers = makeHandlers();

    await autofillByCep('00000-000', handlers);

    expect(handlers.onAddress).toHaveBeenCalledTimes(1);
    expect(handlers.onAddress).toHaveBeenCalledWith('', '');
    expect(getCityByIsoMock).not.toHaveBeenCalled();
    expect(toasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning', title: messages.notFound.title })
    );
  });

  it('cidade não resolvida → endereço preenchido + toast cityNotResolved', async () => {
    getAddressByCepMock.mockResolvedValue(VIACEP_SE);
    getCityByIsoMock.mockResolvedValue(null);
    const handlers = makeHandlers();

    await autofillByCep('01001000', handlers);

    expect(handlers.onAddress).toHaveBeenLastCalledWith('Praça da Sé', 'Sé');
    expect(handlers.onCity).not.toHaveBeenCalled();
    expect(toasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning', title: messages.cityNotResolved.title })
    );
  });

  it('rejeição de rede → toast networkError (sem propagar exceção)', async () => {
    getAddressByCepMock.mockResolvedValue(VIACEP_SE);
    getCityByIsoMock.mockRejectedValue(new Error('network'));
    const handlers = makeHandlers();

    await expect(autofillByCep('01001-000', handlers)).resolves.toBeUndefined();

    expect(handlers.onCity).not.toHaveBeenCalled();
    expect(toasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', title: messages.networkError.title })
    );
  });

  it('rejeição do ViaCEP também vira networkError', async () => {
    getAddressByCepMock.mockRejectedValue(new Error('offline'));
    const handlers = makeHandlers();

    await autofillByCep('01001-000', handlers);

    expect(toasterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', title: messages.networkError.title })
    );
  });

  it('o hook expõe a mesma função', () => {
    expect(useCepAddressAutofill().autofillByCep).toBe(autofillByCep);
  });
});
