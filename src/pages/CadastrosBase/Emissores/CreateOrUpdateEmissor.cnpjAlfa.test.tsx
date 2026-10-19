// @vitest-environment jsdom
// UT-000776 / T-776-FE-07 — Emissor: o CNPJ alfanumérico digitado chega ao payload com as letras
// (caixa alta, sem máscara) em vez de ser apagado por `onlyDigits`.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const mocks = vi.hoisted(() => ({
  createIssuer: vi.fn().mockResolvedValue({}),
  updateIssuer: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: any) => ({ mutateAsync: asyncFunction, isPending: false }),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  createIssuer: mocks.createIssuer,
  updateIssuer: mocks.updateIssuer,
}));
vi.mock('@/services/v2/Cities/city-service', () => ({ listCityOptions: vi.fn() }));
vi.mock('./useIssuers', () => ({
  useFarmsList: () => ({ data: [] }),
  useIssuerForm: () => ({ isLoading: false, isFetching: false }),
}));
vi.mock('./emissor-schema', () => ({
  emissorSchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));

import CreateOrUpdateEmissor from './CreateOrUpdateEmissor';

afterEach(cleanup);

describe('CreateOrUpdateEmissor CNPJ alfanumérico', () => {
  it('mantém as letras do CNPJ no payload (maiúsculas, sem máscara)', async () => {
    const { container } = render(
      <ChakraProvider value={system}>
        <CreateOrUpdateEmissor />
      </ChakraProvider>
    );
    const input = container.querySelector('input[name="cpf_cnpj"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12abc3450001' } });
    fireEvent.change(input, { target: { value: '12abc345000188' } });
    expect(input.value).toBe('12.ABC.345/0001-88');

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.createIssuer).toHaveBeenCalled());
    expect(mocks.createIssuer.mock.calls[0][0].cpf_cnpj).toBe('12ABC345000188');
  });
});
