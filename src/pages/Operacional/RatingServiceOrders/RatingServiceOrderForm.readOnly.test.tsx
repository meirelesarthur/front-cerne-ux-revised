// @vitest-environment jsdom
// Execução 086, FE-03 — Avaliação: MODO LEITURA (can_rate=false: status 4 e 9,
// sem botão de submit) e MODO AÇÃO (can_rate=true: Salvar presente).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const UUID = '11111111-1111-4111-8111-111111111111';
const lang = languagePtBr.BR;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));

const getRatingServiceOrder = vi.fn();
vi.mock('@/services/v2/RatingServiceOrders/rating-service-order-service', () => ({
  getRatingServiceOrder: (...args: unknown[]) => getRatingServiceOrder(...args),
  updateRatingServiceOrder: vi.fn(),
  getAllRatingServiceOrders: vi.fn(),
}));

import RatingServiceOrderForm from './RatingServiceOrderForm';

const base = {
  uuid: UUID,
  code: 'OS-000123',
  dt_emission: '2026-09-01',
  execution_date: '2026-09-05',
  deadline: '2026-09-10',
  category: 2,
  category_label: 'Agricultura',
  employees: [],
  equipments: [],
  products: [],
  productions: [],
  protections: [],
  assessment_grade: null,
  rating_date: null,
  feedback: null,
  recommendations: null,
};

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[`/operacional/avaliacoes/${UUID}`]}>
          <Routes>
            <Route path="/operacional/avaliacoes/:uuid" element={<RatingServiceOrderForm />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const saveLabel = lang.defaltStrings.save;
const cancelLabel = lang.defaltStrings.cancel;

describe('RatingServiceOrderForm — modo leitura/ação (086)', () => {
  beforeEach(() => getRatingServiceOrder.mockReset());
  afterEach(() => cleanup());

  it('status 4 (can_rate=false): mostra avaliação registrada e não tem botão de submit', async () => {
    getRatingServiceOrder.mockResolvedValue({
      data: {
        ...base,
        status: { value: 4, label: 'Avaliado', color: '#00FF00' },
        can_rate: false,
        assessment_grade: 5,
        rating_date: '2026-09-12T10:30',
        feedback: 'Serviço excelente',
        recommendations: 'Manter o padrão',
      },
    });
    renderForm();

    await waitFor(() => expect(screen.getByText('Serviço excelente')).toBeTruthy());
    expect(screen.getByText('Manter o padrão')).toBeTruthy();
    expect(screen.getByText('12/09/2026 10:30')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.queryByRole('button', { name: saveLabel })).toBeNull();
    expect(screen.queryByRole('button', { name: cancelLabel })).toBeNull();
    expect(
      screen.queryByText(lang.ratingServiceOrders.ratingServiceOrder.form.notFound.title)
    ).toBeNull();
  });

  it('status 9 (can_rate=false): mostra bloco de cancelamento e não tem submit', async () => {
    getRatingServiceOrder.mockResolvedValue({
      data: {
        ...base,
        status: { value: 9, label: 'Cancelada', color: '#FF0000' },
        can_rate: false,
        cancellation_reason: 'Chuva forte no talhão',
        cancellation_date: '2026-09-02T13:30:00-03:00',
        cancellation_user: { uuid: 'u-1', name: 'Carlos Gestor' },
      },
    });
    renderForm();

    await waitFor(() => expect(screen.getByText('Chuva forte no talhão')).toBeTruthy());
    expect(screen.getByText('Carlos Gestor')).toBeTruthy();
    expect(screen.queryByRole('button', { name: saveLabel })).toBeNull();
  });

  it('status 3 (can_rate=true): modo ação com Salvar', async () => {
    getRatingServiceOrder.mockResolvedValue({
      data: { ...base, status: { value: 3, label: 'Concluída', color: '#0000FF' }, can_rate: true },
    });
    renderForm();

    await waitFor(() => expect(screen.getByRole('button', { name: saveLabel })).toBeTruthy());
    expect(screen.getByRole('button', { name: cancelLabel })).toBeTruthy();
  });
});
