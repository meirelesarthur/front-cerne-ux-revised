// @vitest-environment jsdom
// T-743-FE-05 (D-100-22) — TF-20: o bloco Rateio REAL mantém o asterisco em Classificação
// e Safra (legado `->required()`), sem exigir: o bloco só exibe, a regra mora no container.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { AuthorizationRatioBlock, initialRatioState } from './AuthorizationRatioBlock';

const ratioText = languagePtBr.BR.requestAuthorizations.requestAuthorization.detail.ratio;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listHarvests: vi.fn().mockResolvedValue({ data: { items: [] } }),
}));
vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenterOptions: vi.fn().mockResolvedValue({ data: { items: [] } }),
}));
vi.mock('@/services/v2/FinancialCategories/financial-category-service', () => ({
  listFinancialCategoryOptions: vi.fn().mockResolvedValue({ data: { items: [] } }),
}));

afterEach(cleanup);

describe('AuthorizationRatioBlock (real) — TF-20', () => {
  it('Classificação e Safra mostram o asterisco e o bloco não bloqueia nada por conta própria', () => {
    const onChange = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <ChakraProvider value={system}>
        <QueryClientProvider client={client}>
          <AuthorizationRatioBlock
            farmUuid="farm-1"
            value={initialRatioState()}
            onChange={onChange}
          />
        </QueryClientProvider>
      </ChakraProvider>
    );

    for (const label of [ratioText.classificationLabel, ratioText.harvestLabel]) {
      const el = screen.getByText(label, { selector: 'label' });
      expect(el.querySelector('.chakra-field__requiredIndicator')?.textContent).toBe('*');
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
