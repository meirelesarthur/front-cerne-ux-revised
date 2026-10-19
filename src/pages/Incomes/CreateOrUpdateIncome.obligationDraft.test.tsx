// @vitest-environment jsdom
// UT-000796 r2 — Gera Obrigação (destino): Nova Conta a Receber pré-preenchida a
// partir do rascunho de um movimento Financiamento de SAÍDA (cliente). Espelho
// de `CreateOrUpdateExpense.obligationDraft.test.tsx`; o form de Receber NÃO tem
// o campo Apropriação (ignorado) e `movement_uuid` vai ao POST como chave
// condicional.
import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { username: 'dev' }, activeFarmUuid: 'farm-uuid-1' }),
}));
vi.mock('@/hooks/useMyFarms', () => ({ useMyFarms: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useCurrentFarm', () => ({
  useCurrentFarm: () => ({ data: { tenant: { use_fiscal: true, list_all_farms: false } } }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));

const toasterMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  create: vi.fn(),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: toasterMock }));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const services = vi.hoisted(() => ({
  createIncome: vi.fn(),
  updateIncome: vi.fn(),
  getClientByUuid: vi.fn(),
  getProprietaryByUuid: vi.fn(),
}));
vi.mock('@/services/v2/Incomes/income-service', () => ({
  createIncome: services.createIncome,
  updateIncome: services.updateIncome,
  getIncome: vi.fn(),
}));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({
  getClientByUuid: services.getClientByUuid,
  listClients: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  getProprietaryByUuid: services.getProprietaryByUuid,
  listProprietaries: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/BaseRegistrations/typeTitles-service', () => ({
  getTypeTitleByUuid: vi.fn(),
  listTypeTitleOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  getHarvest: vi.fn(),
  listHarvests: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div
      data-testid={`sap-${props.name}`}
      data-value={props.value?.value ?? ''}
      data-label={props.value?.label ?? ''}
    />
  ),
}));
vi.mock('@/components/Form/Select', () => ({
  Select: (props: any) => <div data-testid={`select-${props.name}`} />,
}));
vi.mock('@/components/DateInput', () => ({
  DateInput: (props: any) => (
    <input
      data-testid={`date-${props.label}`}
      value={props.value ?? ''}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ),
}));
vi.mock('@/components/Form/MoneyInput', () => ({
  MoneyInput: (props: any) => (
    <input
      data-testid={`money-${props.name}`}
      value={props.value ?? ''}
      onChange={(e) => props.onValueChange?.(Number(e.target.value))}
    />
  ),
}));
vi.mock('@/components/Form/NumberInput', () => ({ NumberInput: () => null }));
vi.mock('@/components/Button', () => ({
  Button: (props: any) => (
    <button
      type="button"
      disabled={props.disabled}
      onClick={(e) => {
        Promise.resolve(props.onClick?.(e)).catch(() => undefined);
      }}
    >
      {props.title}
    </button>
  ),
}));
vi.mock('@/components/ButtonSaveAndNext', () => ({
  ButtonSaveAndNext: (props: any) => (
    <button
      type="button"
      data-testid="save"
      onClick={(e) => {
        Promise.resolve(props.onClick?.(e)).catch(() => undefined);
      }}
    >
      save
    </button>
  ),
}));
vi.mock('@/components/XmlPrefill', () => ({ XmlPrefillModal: () => null }));
vi.mock('@/pages/CadastrosBase/Clientes/ClientFormModal', () => ({ ClientFormModal: () => null }));
vi.mock('@/validations/schemas/Incomes/income-schema', () => ({
  incomeSchemaResolver: () => async (values: any) => ({ values, errors: {} }),
}));
vi.mock('./IncomeAutomaticWriteoffSection', () => ({ IncomeAutomaticWriteoffSection: () => null }));
vi.mock('./IncomeInstallmentsTab', () => ({ IncomeInstallmentsTab: () => null }));
vi.mock('./IncomeApportionmentTab', () => ({
  IncomeApportionmentTab: (props: any) => (
    <button
      type="button"
      data-testid="fill-required"
      onClick={() => {
        props.setValue('number', 'R-1');
        props.setValue('type_title_uuid', { label: 'Tipo', value: 'tt-1' });
        props.setValue('due_date', '2026-11-15');
        if (!props.watch('dt_emission')) props.setValue('dt_emission', '2026-10-01');
        props.setValue('categories', [
          { category_uuid: 'cat-1', percentage: 100, center_uuid: 'cc-1', plan_account_uuid: null },
        ]);
      }}
    />
  ),
}));

import CreateOrUpdateIncome from './CreateOrUpdateIncome';

const MOVEMENT_UUID = '019f62a6-1111-7023-8abc-0123456789ab';
const CLIENT_UUID = '019f62a6-4444-7023-8abc-0123456789ab';
const PROPRIETARY_UUID = '019f62a6-3333-7023-8abc-0123456789ab';
const storageKey = `gb:movement-obligation-draft:${MOVEMENT_UUID}`;

function buildDraft(over: Record<string, any> = {}) {
  return {
    type: 'income',
    note: 'Financiamento concedido',
    amount: '800.00',
    provider_uuid: null,
    client_uuid: CLIENT_UUID,
    proprietary_uuid: PROPRIETARY_UUID,
    interest: '5.00',
    dt_emission: '2026-10-15',
    movement_uuid: MOVEMENT_UUID,
    appropriation: 2,
    ...over,
  };
}

function renderCreate(entry: string | { pathname: string; search?: string; state?: unknown }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[entry as any]}>
            <Routes>
              <Route path="/financeiro/receber/novo" element={<CreateOrUpdateIncome />} />
              <Route path="/financeiro/receber/:incomeId" element={<CreateOrUpdateIncome />} />
            </Routes>
          </MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const note = () => document.querySelector('textarea[name="note"]') as HTMLTextAreaElement | null;
const sap = (n: string) => screen.getByTestId(`sap-${n}`);
const hints = languagePtBr.BR.incomes.income.form.hints;

beforeEach(() => {
  Object.values(services).forEach((m) => m.mockReset());
  Object.values(toasterMock).forEach((m) => m.mockReset());
  navigateMock.mockReset();
  window.sessionStorage.clear();
  services.getClientByUuid.mockResolvedValue({ data: { name: 'Cliente Z' } });
  services.getProprietaryByUuid.mockResolvedValue({
    data: { name: 'Proprietário Y', uuid: PROPRIETARY_UUID },
  });
});
afterEach(() => cleanup());

describe('Nova Conta a Receber — rascunho do movimento', () => {
  it('com state: pré-preenche nota, valor, cliente e proprietário (sem Apropriação)', async () => {
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await waitFor(() => expect(sap('client_uuid').getAttribute('data-label')).toBe('Cliente Z'));
    expect(sap('client_uuid').getAttribute('data-value')).toBe(CLIENT_UUID);
    expect(sap('proprietary_uuid').getAttribute('data-label')).toBe('Proprietário Y');
    expect(note()!.value).toBe('Financiamento concedido');
    expect((screen.getByTestId('money-amount') as HTMLInputElement).value).toBe('800');
    expect(screen.queryByTestId('select-appropriation')).toBeNull();
    expect(toasterMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ description: hints.obligationDraftApplied })
    );
    expect(navigateMock).toHaveBeenCalledWith(
      `/financeiro/receber/novo?fromMovement=${MOVEMENT_UUID}`,
      {
        replace: true,
        state: null,
      }
    );
  });

  it('refresh: ?fromMovement + storage aplica o rascunho e mantém o storage', async () => {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
    });
    await waitFor(() => expect(note()!.value).toBe('Financiamento concedido'));
    expect(window.sessionStorage.getItem(storageKey)).not.toBeNull();
  });

  it('ponteiro sem storage: toast de expirado e remove o parâmetro', async () => {
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
    });
    await waitFor(() =>
      expect(toasterMock.info).toHaveBeenCalledWith(
        expect.objectContaining({ description: hints.obligationDraftExpired })
      )
    );
    expect(navigateMock).toHaveBeenCalledWith('/financeiro/receber/novo', {
      replace: true,
      state: null,
    });
    expect(note()!.value).toBe('');
  });

  it('rascunho de expense numa tela de Receber é ignorado', async () => {
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft({ type: 'expense', provider_uuid: 'p' }) },
    });
    await waitFor(() =>
      expect(toasterMock.info).toHaveBeenCalledWith(
        expect.objectContaining({ description: hints.obligationDraftExpired })
      )
    );
    expect(note()!.value).toBe('');
  });

  it('em edição o efeito não roda', async () => {
    renderCreate({
      pathname: '/financeiro/receber/019f62a6-9999-7023-8abc-0123456789ab',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(services.getClientByUuid).not.toHaveBeenCalled();
    expect(toasterMock.info).not.toHaveBeenCalled();
  });

  it('Cancelar apaga o storage, avisa e faz navigate(-1)', async () => {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await waitFor(() => expect(note()!.value).toBe('Financiamento concedido'));
    await act(async () => {
      fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.cancel));
    });
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(toasterMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ description: hints.obligationDraftDiscarded })
    );
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});

describe('Nova Conta a Receber — POST do título com movement_uuid', () => {
  async function fillAndSave() {
    await waitFor(() => expect(sap('client_uuid').getAttribute('data-label')).toBe('Cliente Z'));
    fireEvent.click(screen.getByTestId('fill-required'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save'));
    });
  }

  it('create envia movement_uuid e cliente do rascunho; sucesso apaga o storage', async () => {
    services.createIncome.mockResolvedValue({ data: { uuid: 'inc-1' } });
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await fillAndSave();
    await waitFor(() => expect(services.createIncome).toHaveBeenCalledTimes(1));
    const payload = services.createIncome.mock.calls[0][0];
    expect(payload.movement_uuid).toBe(MOVEMENT_UUID);
    expect(payload.client_uuid).toBe(CLIENT_UUID);
    expect(payload.amount).toBe(800);
    expect(payload.interest).toBe(5);
    expect(payload.dt_emission).toBe('2026-10-15');
    expect('appropriation' in payload).toBe(false);
    await waitFor(() => expect(window.sessionStorage.getItem(storageKey)).toBeNull());
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('create sem rascunho NÃO envia a chave movement_uuid', async () => {
    services.createIncome.mockResolvedValue({ data: { uuid: 'inc-1' } });
    renderCreate('/financeiro/receber/novo');
    fireEvent.click(screen.getByTestId('fill-required'));
    fireEvent.change(screen.getByTestId('money-amount'), { target: { value: '10' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save'));
    });
    await waitFor(() => expect(services.createIncome).toHaveBeenCalledTimes(1));
    expect('movement_uuid' in services.createIncome.mock.calls[0][0]).toBe(false);
  });

  it('422 do POST mantém o rascunho no storage', async () => {
    const err: any = new Error('422');
    err.isAxiosError = true;
    err.response = {
      status: 422,
      data: { message: 'Movimento inválido', errors: { movement_uuid: ['x'] } },
    };
    services.createIncome.mockRejectedValue(err);
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/receber/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await fillAndSave();
    await waitFor(() => expect(services.createIncome).toHaveBeenCalledTimes(1));
    expect(window.sessionStorage.getItem(storageKey)).not.toBeNull();
    expect(navigateMock).not.toHaveBeenCalledWith(-1);
  });
});
