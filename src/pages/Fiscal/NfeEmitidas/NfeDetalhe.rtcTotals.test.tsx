// @vitest-environment jsdom
// UT-000776 / T-776-FE-01 — NfeDetalhe: totais IBS/CBS/IS (valor formatado; `null` -> noData).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const GUID = '123e4567-e89b-42d3-a456-426614174000';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ nfeId: GUID }),
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => false }),
}));
vi.mock('./NfeEmissionPanel', () => ({ NfeEmissionPanel: () => null }));
vi.mock('@/components/ui/toaster', () => ({ toaster: { create: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  downloadNfeDanfe: vi.fn(),
  downloadNfeDanfePreview: vi.fn(),
}));

let detail: Record<string, unknown> | undefined;
vi.mock('./useNfeDetail', () => ({
  useNfeDetail: () => ({ data: detail, isLoading: false, isPending: false, isError: false }),
}));

import NfeDetalhe from './NfeDetalhe';

const lang = getLanguageRouter(languageContextTypes.BR);
const totals = lang.nfes.nfe.form.totalsFields;
const noData = lang.nfes.nfe.detail.table.noData;

const base = {
  uuid: GUID,
  code: '1',
  estado: 'aprovado',
  total_products: 100,
  amount: 100,
  items: [],
};

function renderDetail() {
  return render(
    <ChakraProvider value={system}>
      <NfeDetalhe />
    </ChakraProvider>
  );
}

function valueOf(label: string): string {
  const el = screen.getByText(label);
  return el.nextElementSibling?.textContent ?? '';
}

afterEach(() => cleanup());

describe('NfeDetalhe — totais IBS/CBS/IS', () => {
  it('exibe os valores formatados em BRL', () => {
    detail = { ...base, v_ibs: 12.5, v_cbs: 7.3, v_is: 0 };
    renderDetail();
    expect(valueOf(totals.vIbs)).toMatch(/12,50/);
    expect(valueOf(totals.vCbs)).toMatch(/7,30/);
    expect(valueOf(totals.vIs)).toMatch(/0,00/);
  });

  it('null (sem snapshot) mostra o placeholder de sem dado', () => {
    detail = { ...base, v_ibs: null, v_cbs: null, v_is: null };
    renderDetail();
    expect(valueOf(totals.vIbs)).toBe(noData);
    expect(valueOf(totals.vCbs)).toBe(noData);
    expect(valueOf(totals.vIs)).toBe(noData);
  });
});
