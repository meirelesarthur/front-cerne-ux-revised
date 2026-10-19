// @vitest-environment jsdom
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

const getFinishMock = vi.fn();

vi.mock('@/services/v2/ModuleWeighing/module-weighing-service', () => ({
  getModuleWeighingFinish: (...args: unknown[]) => getFinishMock(...args),
  finalizeModuleWeighing: vi.fn(),
}));

import FinalizeModuleWeighing from './FinalizeModuleWeighing';

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/finalizar/abc']}>
          <Routes>
            <Route path="/finalizar/:uuid" element={<FinalizeModuleWeighing />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  getFinishMock.mockReset();
});

describe('FinalizeModuleWeighing', () => {
  it('exibe pesos em pt-BR, Peso Líquido em destaque e sem Custo Médio/Total', async () => {
    getFinishMock.mockResolvedValue({
      data: {
        uuid: 'abc',
        status: 4,
        type: 1,
        code: '0001',
        gross_weight: '45000.00',
        tare_weight: '15000.00',
        final_weight: '30000.00',
        measurement_name: null,
        classification_discount: null,
        average_cost: '0.00',
        total: '0.00',
        dfe_lookup_unavailable: false,
        eligible_dfes: [],
      },
    });
    renderScreen();

    await screen.findByText(/Peso Líquido: 30\.000,00 kg/);
    expect(screen.getByText(/Peso Bruto: 45\.000,00 kg/)).toBeTruthy();
    expect(screen.getByText(/Tara: 15\.000,00 kg/)).toBeTruthy();
    expect(screen.queryByText(/Custo Médio/)).toBeNull();
    expect(screen.queryByText(/^Total/)).toBeNull();
  });
});
