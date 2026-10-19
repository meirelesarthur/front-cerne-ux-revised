// src/pages/BaseRegistrations/Grazings/CreateOrUpdateGrazing.responsible.test.tsx
// -----------------------------------------------------------------------------
// TASK-PES-PAS-FE (decisão do dono 2026-10-08, legado `grazing/_forms.blade.php:26-29`):
// o select de funcionário saiu do Pastejo; "Responsável" é SOMENTE LEITURA com o
// nome do USUÁRIO (criação = logado; edição = `user.name` do Resource) e o
// payload NUNCA envia `employee_uuid`.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const { createGrazingMock, getGrazingByUuidMock, listEmployeesMock } = vi.hoisted(() => ({
  createGrazingMock: vi.fn(),
  getGrazingByUuidMock: vi.fn(),
  listEmployeesMock: vi.fn(),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'joao.logado' },
    profile: null,
    isAuthenticated: true,
    loading: false,
    activeFarmUuid: 'farm-uuid-1',
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    permissions: [],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => false,
    hasFarm: true,
    isFarmScoped: () => false,
  }),
}));

vi.mock('@/services/v2/BaseRegistrations/grazings-service', () => ({
  createGrazing: createGrazingMock,
  updateGrazing: vi.fn(),
  getGrazingByUuid: getGrazingByUuidMock,
}));
vi.mock('@/services/v2/BaseRegistrations/fodders-service', () => ({
  listFodders: vi.fn(() => Promise.resolve({ data: { items: [], pagination: {} } })),
}));
vi.mock('@/services/v2/CadastrosBase/Employee/employee-service', () => ({
  listEmployees: listEmployeesMock,
}));

vi.mock('./GrazingMap', () => ({
  GrazingMap: (props: any) => (
    <button
      type="button"
      data-testid="map-pick"
      onClick={() => props.onChange(['11111111-1111-4111-8111-111111111111'])}
    >
      map
    </button>
  ),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <button
      type="button"
      data-testid={`select-${props.name}`}
      onClick={() =>
        props.onChange({ label: 'Forragem', value: '22222222-2222-4222-8222-222222222222' })
      }
    >
      {props.label}
    </button>
  ),
}));

vi.mock('@/components/DateInput', () => ({
  DateInput: (props: any) => (
    <input
      data-testid="date-input"
      value={props.value ?? ''}
      onChange={(e: any) => props.onChange(e.target.value || null)}
    />
  ),
}));

import CreateOrUpdateGrazing from './CreateOrUpdateGrazing';

const text = languagePtBr.BR.baseRegistrations.grazing;
const GRAZING_UUID = '33333333-3333-4333-8333-333333333333';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/cadastros-base/modulo-pastejo/novo" element={<CreateOrUpdateGrazing />} />
            <Route
              path="/cadastros-base/modulo-pastejo/:grazingId"
              element={<CreateOrUpdateGrazing />}
            />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  createGrazingMock.mockReset();
  getGrazingByUuidMock.mockReset();
  listEmployeesMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Pastejo — Responsável somente leitura (usuário), sem funcionário', () => {
  it('criação: mostra o usuário logado como Responsável e NÃO tem select de funcionário', () => {
    renderAt('/cadastros-base/modulo-pastejo/novo');

    expect(screen.getByText(text.form.fields.responsible)).toBeTruthy();
    expect(screen.getByText('joao.logado')).toBeTruthy();
    expect(screen.queryByTestId('select-employee_uuid')).toBeNull();
    expect(listEmployeesMock).not.toHaveBeenCalled();
    // Somente leitura: nenhum input/textbox para o responsável.
    expect(screen.queryByRole('textbox', { name: text.form.fields.responsible })).toBeNull();
  });

  it('edição: mostra user.name do Resource (não o usuário logado)', async () => {
    getGrazingByUuidMock.mockResolvedValue({
      success: true,
      data: {
        uuid: GRAZING_UUID,
        code: '000010',
        description: 'Pastejo A',
        fodder: { uuid: '22222222-2222-4222-8222-222222222222', description: 'Forragem' },
        date: '2026-07-01',
        color: '#01ff70',
        control_productivity: false,
        areas_count: 1,
        areas_sum_total_area: 3,
        user: { uuid: 'u-1', name: 'Maria Cadastrou' },
        areas: [{ uuid: '11111111-1111-4111-8111-111111111111', description: 'Piquete 1' }],
      },
    });
    renderAt(`/cadastros-base/modulo-pastejo/${GRAZING_UUID}`);

    expect(await screen.findByText('Maria Cadastrou')).toBeTruthy();
    expect(screen.queryByText('joao.logado')).toBeNull();
  });

  it('submit de criação NUNCA envia employee_uuid', async () => {
    createGrazingMock.mockResolvedValue({ success: true, data: {} });
    renderAt('/cadastros-base/modulo-pastejo/novo');

    fireEvent.change(screen.getByPlaceholderText(text.form.placeholders.description), {
      target: { value: 'Pastejo novo' },
    });
    fireEvent.click(screen.getByTestId('select-fodder_uuid'));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2026-07-01' } });
    fireEvent.click(screen.getByTestId('map-pick'));

    const save = await waitFor(() => {
      const button = document.querySelector<HTMLButtonElement>('button[form="grazing-form"]');
      expect(button).toBeTruthy();
      expect(button!.disabled).toBe(false);
      return button!;
    });
    fireEvent.click(save);

    await waitFor(() => expect(createGrazingMock).toHaveBeenCalledTimes(1));
    const payload = createGrazingMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty('employee_uuid');
    expect(payload).toMatchObject({
      description: 'Pastejo novo',
      fodder_uuid: '22222222-2222-4222-8222-222222222222',
      areas: ['11111111-1111-4111-8111-111111111111'],
    });
  });
});
