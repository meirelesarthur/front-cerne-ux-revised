// @vitest-environment jsdom
// Execução 086, FE-03 — Minhas OS: MODO LEITURA (can_execute=false: status
// 3/4/9, sem Salvar nem checkboxes habilitados) e MODO AÇÃO (can_execute=true).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const UUID = '22222222-2222-4222-8222-222222222222';
const lang = languagePtBr.BR;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));

const getMyServiceOrder = vi.fn();
vi.mock('@/services/v2/MyServiceOrders/my-service-order-service', () => ({
  getMyServiceOrder: (...args: unknown[]) => getMyServiceOrder(...args),
  updateMyServiceOrderExecution: vi.fn(),
  getAllMyServiceOrders: vi.fn(),
}));

import MyServiceOrderExecutionForm from './MyServiceOrderExecutionForm';

const base = {
  uuid: UUID,
  code: 'OS-000777',
  dt_emission: '2026-09-01',
  execution_date: '2026-09-05',
  deadline: '2026-09-10',
  category: { value: 2, label: 'Agricultura' },
  category_label: 'Agricultura',
  area: { uuid: 'a1', name: 'Talhão 1', description: 'Talhão 1', productive_area: 12.5 },
  execution_start_date: '2026-09-06T08:00',
  execution_end_date: '2026-09-06T17:00',
  execution_problems: 'Falha no pulverizador',
  corrective_actions: 'Troca de bico',
  employees: [
    {
      id: 1,
      type: 1,
      employee_uuid: 'e1',
      function_uuid: null,
      provider_uuid: null,
      label: 'João da Silva',
      is_checked: true,
    },
  ],
  equipments: [{ id: 2, label: 'Trator JD 6110', is_checked: false }],
  products: [],
  productions: [],
  protections: [],
  attachments: [],
};

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[`/operacional/minhas-os/${UUID}`]}>
          <Routes>
            <Route path="/operacional/minhas-os/:uuid" element={<MyServiceOrderExecutionForm />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const saveLabel = lang.defaltStrings.save;
const cancelLabel = lang.defaltStrings.cancel;

describe('MyServiceOrderExecutionForm — modo leitura/ação (086)', () => {
  beforeEach(() => getMyServiceOrder.mockReset());
  afterEach(() => cleanup());

  it.each([
    [3, 'Concluída'],
    [4, 'Avaliado'],
    [9, 'Cancelada'],
  ])(
    'status %i (can_execute=false): leitura, itens com nome, sem Salvar/Cancelar',
    async (value, label) => {
      getMyServiceOrder.mockResolvedValue({
        data: {
          ...base,
          status: { value, label, color: '#999999' },
          can_execute: false,
          ...(value === 9
            ? {
                cancellation_reason: 'Chuva forte no talhão',
                cancellation_date: '2026-09-02T13:30:00-03:00',
                cancellation_user: { uuid: 'u-1', name: 'Carlos Gestor' },
              }
            : {}),
        },
      });
      renderForm();

      await waitFor(() => expect(screen.getByText('João da Silva')).toBeTruthy());
      expect(screen.getByText('Trator JD 6110')).toBeTruthy();
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      expect(screen.getByText('Falha no pulverizador')).toBeTruthy();
      expect(screen.queryByRole('button', { name: saveLabel })).toBeNull();
      expect(screen.queryByRole('button', { name: cancelLabel })).toBeNull();
      // itens do checklist não podem ser marcados
      screen.getAllByRole('checkbox').forEach((box) => {
        expect((box as HTMLInputElement).disabled).toBe(true);
      });
      if (value === 9) {
        expect(screen.getByText('Chuva forte no talhão')).toBeTruthy();
        expect(screen.getByText('Carlos Gestor')).toBeTruthy();
      }
    }
  );

  it('status 1 (can_execute=true): modo ação com Salvar e checklist habilitado', async () => {
    getMyServiceOrder.mockResolvedValue({
      data: {
        ...base,
        status: { value: 1, label: 'Aberta', color: '#999999' },
        can_execute: true,
        execution_start_date: null,
        execution_end_date: null,
        execution_problems: null,
        corrective_actions: null,
      },
    });
    renderForm();

    await waitFor(() => expect(screen.getByText('João da Silva')).toBeTruthy());
    expect(screen.getByRole('button', { name: saveLabel })).toBeTruthy();
    expect(screen.getByRole('button', { name: cancelLabel })).toBeTruthy();
    screen.getAllByRole('checkbox').forEach((box) => {
      expect((box as HTMLInputElement).disabled).toBe(false);
    });
  });
});
