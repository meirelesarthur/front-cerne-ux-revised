// @vitest-environment jsdom
// UT-000752 (T-752-FE-01) — FilterSideDfe: booleanos enviados como '1'/'0'
// (a API valida `boolean` e devolvia 422 com 'true'/'false'), migração do
// filtro legado do localStorage e label do emissor (nome, nunca UUID).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageDfes } from '@/constants/languages/languagePtBr/languageDfes';

const getIssuerByUuidMock = vi.fn();
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  listIssuers: vi.fn(),
  getIssuerByUuid: (...args: unknown[]) => getIssuerByUuidMock(...args),
}));

vi.mock('@/components/FilterSide', () => ({
  FilterSide: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="drawer">{children}</div> : null,
}));

vi.mock('@/components/Form/Select', () => ({
  Select: ({ label, value }: any) => (
    <div data-testid={`select-${label}`}>{value?.label ?? ''}</div>
  ),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ value }: any) => (
    <div data-testid="issuer">{value ? `${value.label}|${value.value}` : ''}</div>
  ),
}));

vi.mock('@/components/DateInput', () => ({
  DateInput: () => <input data-testid="date" />,
}));

import { FilterSideDfe } from './FilterSideDfe';

const languageGB: any = {
  dfes: languageDfes,
  defaltStrings: {
    yes: 'Sim',
    no: 'Não',
    clearAllFilters: 'Limpar tudo',
    cancel: 'Cancelar',
    applyFilters: 'Aplicar filtros',
  },
};

function setup(filter: any) {
  const handlers = { onClose: vi.fn(), handleReset: vi.fn(), handleFilterChange: vi.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChakraProvider value={system}>
        <FilterSideDfe isOpen {...handlers} filter={filter} languageGB={languageGB} />
      </ChakraProvider>
    </QueryClientProvider>
  );
  return handlers;
}

describe('FilterSideDfe — UT-000752 T-752-FE-01', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reabrir o drawer mostra o NOME do emissor (não o UUID)', async () => {
    getIssuerByUuidMock.mockResolvedValue({
      data: { uuid: 'uuid-1', razao_social: 'Emissor ACME' },
    });
    setup({ issue_uuid: 'uuid-1' });

    await waitFor(() =>
      expect(screen.getByTestId('issuer').textContent).toBe('Emissor ACME|uuid-1')
    );
    expect(screen.getByTestId('issuer').textContent).not.toMatch(/^uuid-1\|/);
    expect(getIssuerByUuidMock).toHaveBeenCalledWith('uuid-1');
  });

  it("filtro salvo com 'true'/'false' legado é convertido para '1'/'0' ao aplicar", async () => {
    getIssuerByUuidMock.mockResolvedValue({
      data: { uuid: 'uuid-1', razao_social: 'Emissor ACME' },
    });
    const { handleFilterChange } = setup({
      issue_uuid: 'uuid-1',
      launched: 'true',
      is_personal: 'false',
      is_shipment: '1',
      status: 0,
    });

    expect(screen.getByTestId('select-Lançada').textContent).toBe('Sim');
    expect(screen.getByTestId('select-Pessoal').textContent).toBe('Não');

    fireEvent.click(screen.getByText('Aplicar filtros'));

    await waitFor(() => expect(handleFilterChange).toHaveBeenCalledTimes(1));
    const sent = handleFilterChange.mock.calls[0][0];
    expect(sent.launched).toBe('1');
    expect(sent.is_personal).toBe('0');
    expect(sent.is_shipment).toBe('1');
    expect(sent.status).toBe(0);
    expect(sent.issue_uuid).toBe('uuid-1');
  });
});
