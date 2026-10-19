// @vitest-environment jsdom
// UT-000796 r2 — Gera Obrigação (destino): Nova Conta a Pagar pré-preenchida a
// partir do rascunho do movimento Financiamento. Fontes: `state` de rota OU
// sessionStorage via `?fromMovement=<uuid>` (refresh). Só criação; `movement_uuid`
// vai no POST como chave condicional; Cancelar/sucesso consomem o rascunho.
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
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  getProviderByUuid: vi.fn(),
  getProprietaryByUuid: vi.fn(),
}));
vi.mock('@/services/v2/Financeiro/Expenses/expense-service', () => ({
  createExpense: services.createExpense,
  updateExpense: services.updateExpense,
  getExpense: vi.fn(),
  listExpenseAppropriationTypeOptions: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  getProviderByUuid: services.getProviderByUuid,
  listProviders: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  getProprietaryByUuid: services.getProprietaryByUuid,
  listProprietaries: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/BaseRegistrations/typeTitles-service', () => ({
  getTypeTitleByUuid: vi.fn(),
  listTypeTitleOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CadastrosBase/Account/account-service', () => ({
  listAccounts: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  getAccountBalance: vi.fn(() => Promise.resolve({ data: { balance: 0 } })),
}));
vi.mock('@/services/v2/Financeiro/Branches/branch-service', () => ({
  listBranchesByProvider: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  getHarvest: vi.fn(),
  listHarvests: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Activities/activity-service', () => ({ listActivities: vi.fn() }));
vi.mock('@/services/v2/BaseRegistrations/areas-service', () => ({ listAreas: vi.fn() }));
vi.mock('@/services/v2/Operations/operation-service', () => ({ listOperations: vi.fn() }));
vi.mock('@/services/v2/XmlPrefill/xml-prefill-service', () => ({ downloadXml: vi.fn() }));

// Selects: expõem value/label para asserção.
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
  Select: (props: any) => (
    <div
      data-testid={`select-${props.name}`}
      data-value={String(props.value?.value ?? '')}
      data-label={props.value?.label ?? ''}
    />
  ),
}));
vi.mock('@/components/Form/SelectCultivation', () => ({ SelectCultivation: () => null }));
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
vi.mock('@/components/Form/PercentInput', () => ({ PercentInput: () => null }));
// Button de teste: engole a rejeição do `handleSubmit` (o `onSubmit` da tela
// propaga o erro do `mutateAsync` — comportamento pré-existente — e o toast já
// foi exibido pelo `useRequest`); evita unhandled rejection no 422.
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
vi.mock('@/components/XmlPrefill', () => ({ XmlPrefillModal: () => null }));
// Resolver passa-through: o foco aqui é o payload/vínculo, não a validação do schema.
vi.mock('@/validations/schemas/Financeiro/expense-schema', () => ({
  expenseSchemaResolver: () => async (values: any) => ({ values, errors: {} }),
}));
// A aba de Rateio expõe um botão que preenche o mínimo exigido pelo payload.
vi.mock('./ExpenseApportionmentTab', () => ({
  ExpenseApportionmentTab: (props: any) => (
    <button
      type="button"
      data-testid="fill-required"
      onClick={() => {
        props.setValue('number', 'T-1');
        props.setValue('type_title_uuid', { label: 'Tipo', value: 'tt-1' });
        props.setValue('due_date', '2026-11-15');
        props.setValue('payment_type', { label: 'Única', value: 1 });
        if (!props.watch('dt_emission')) props.setValue('dt_emission', '2026-10-01');
        props.setValue('categories', [
          {
            category_uuid: { label: 'c', value: 'cat-1' },
            center_uuid: { label: 'cc', value: 'cc-1' },
            value: 1500.5,
            percent: 100,
            plan_account_uuid: null,
            area_uuid: null,
            harvest_uuid: null,
          },
        ]);
      }}
    />
  ),
}));
vi.mock('./ExpenseInstallmentsTab', () => ({ ExpenseInstallmentsTab: () => null }));

import CreateOrUpdateExpense from './CreateOrUpdateExpense';

const MOVEMENT_UUID = '019f62a6-1111-7023-8abc-0123456789ab';
const PROVIDER_UUID = '019f62a6-2222-7023-8abc-0123456789ab';
const PROPRIETARY_UUID = '019f62a6-3333-7023-8abc-0123456789ab';

function buildDraft(over: Record<string, any> = {}) {
  return {
    type: 'expense',
    note: 'Financiamento trator',
    amount: '1500.50',
    provider_uuid: PROVIDER_UUID,
    client_uuid: null,
    proprietary_uuid: PROPRIETARY_UUID,
    interest: '10.00',
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
              <Route path="/financeiro/pagar/novo" element={<CreateOrUpdateExpense />} />
              <Route path="/financeiro/pagar/:expenseId" element={<CreateOrUpdateExpense />} />
            </Routes>
          </MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const storageKey = `gb:movement-obligation-draft:${MOVEMENT_UUID}`;
const note = () => document.querySelector('textarea[name="note"]') as HTMLTextAreaElement | null;
const sap = (n: string) => screen.getByTestId(`sap-${n}`);
const hints = languagePtBr.BR.financial.expense.form.hints;

beforeEach(() => {
  Object.values(services).forEach((m) => m.mockReset());
  Object.values(toasterMock).forEach((m) => m.mockReset());
  navigateMock.mockReset();
  window.sessionStorage.clear();
  services.getProviderByUuid.mockResolvedValue({ data: { name: 'Fornecedor X' } });
  services.getProprietaryByUuid.mockResolvedValue({
    data: { name: 'Proprietário Y', uuid: PROPRIETARY_UUID },
  });
});
afterEach(() => cleanup());

describe('Nova Conta a Pagar — rascunho do movimento', () => {
  it('com state.movementObligationDraft: pré-preenche nota, valor, juros, emissão, fornecedor, proprietário e Indireta', async () => {
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await waitFor(() =>
      expect(sap('provider_uuid').getAttribute('data-label')).toBe('Fornecedor X')
    );
    expect(sap('provider_uuid').getAttribute('data-value')).toBe(PROVIDER_UUID);
    expect(sap('proprietary_uuid').getAttribute('data-label')).toBe('Proprietário Y');
    expect(note()!.value).toBe('Financiamento trator');
    expect((screen.getByTestId('money-amount') as HTMLInputElement).value).toBe('1500.5');
    expect(screen.getByTestId('select-appropriation').getAttribute('data-value')).toBe('2');
    expect(toasterMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ description: hints.obligationDraftApplied })
    );
    // o `state` é limpo, mas o ponteiro permanece na URL (permite refresh)
    expect(navigateMock).toHaveBeenCalledWith(
      `/financeiro/pagar/novo?fromMovement=${MOVEMENT_UUID}`,
      {
        replace: true,
        state: null,
      }
    );
  });

  it('refresh: sem state, com ?fromMovement + storage aplica o rascunho do storage', async () => {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({ pathname: '/financeiro/pagar/novo', search: `?fromMovement=${MOVEMENT_UUID}` });
    await waitFor(() => expect(note()!.value).toBe('Financiamento trator'));
    await waitFor(() =>
      expect(sap('provider_uuid').getAttribute('data-label')).toBe('Fornecedor X')
    );
    // aplicar NÃO consome o storage (é o que permite novo refresh)
    expect(window.sessionStorage.getItem(storageKey)).not.toBeNull();
  });

  it('ponteiro sem storage: toast de expirado e remove o parâmetro', async () => {
    renderCreate({ pathname: '/financeiro/pagar/novo', search: `?fromMovement=${MOVEMENT_UUID}` });
    await waitFor(() =>
      expect(toasterMock.info).toHaveBeenCalledWith(
        expect.objectContaining({ description: hints.obligationDraftExpired })
      )
    );
    expect(note()!.value).toBe('');
    expect(navigateMock).toHaveBeenCalledWith('/financeiro/pagar/novo', {
      replace: true,
      state: null,
    });
  });

  it('rascunho expirado (TTL) no storage: toast de expirado', async () => {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now() - 3 * 60 * 60 * 1000, draft: buildDraft() })
    );
    renderCreate({ pathname: '/financeiro/pagar/novo', search: `?fromMovement=${MOVEMENT_UUID}` });
    await waitFor(() =>
      expect(toasterMock.info).toHaveBeenCalledWith(
        expect.objectContaining({ description: hints.obligationDraftExpired })
      )
    );
    expect(note()!.value).toBe('');
  });

  it('rascunho de income numa tela de Pagar é ignorado (não preenche)', async () => {
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft({ type: 'income', client_uuid: 'c' }) },
    });
    await waitFor(() =>
      expect(toasterMock.info).toHaveBeenCalledWith(
        expect.objectContaining({ description: hints.obligationDraftExpired })
      )
    );
    expect(note()!.value).toBe('');
  });

  it('em edição o efeito não roda (nem toast nem preenchimento)', async () => {
    renderCreate({
      pathname: '/financeiro/pagar/019f62a6-9999-7023-8abc-0123456789ab',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(toasterMock.info).not.toHaveBeenCalled();
    expect(services.getProviderByUuid).not.toHaveBeenCalled();
  });

  it('nfseDraft/duplicateDraft têm precedência: o efeito novo não roda', async () => {
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: {
        nfseDraft: {
          xml_key: 'k',
          provider_uuid: PROVIDER_UUID,
          provider_matched: true,
          proprietary_uuid: null,
          farm_uuid: null,
          payment_type: 1,
          appropriation: 2,
          type_note_id: 3,
          type_id: 18,
        },
        movementObligationDraft: buildDraft(),
      },
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(toasterMock.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ description: hints.obligationDraftApplied })
    );
  });

  it('Cancelar apaga o storage, avisa e faz navigate(-1)', async () => {
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    await waitFor(() => expect(note()!.value).toBe('Financiamento trator'));
    await act(async () => {
      fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.cancel));
    });
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(toasterMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ description: hints.obligationDraftDiscarded })
    );
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('Cancelar sem rascunho aplicado só faz navigate(-1) (sem toast de descarte)', async () => {
    renderCreate('/financeiro/pagar/novo');
    await act(async () => {
      fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.cancel));
    });
    expect(navigateMock).toHaveBeenCalledWith(-1);
    expect(toasterMock.info).not.toHaveBeenCalled();
  });
});

describe('Nova Conta a Pagar — POST do título com movement_uuid', () => {
  async function fillAndSave() {
    await waitFor(() => expect(note()!.value).toBe('Financiamento trator'));
    await waitFor(() =>
      expect(sap('provider_uuid').getAttribute('data-label')).toBe('Fornecedor X')
    );
    fireEvent.click(screen.getByTestId('fill-required'));
    await act(async () => {
      fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.save));
    });
  }

  it('create envia movement_uuid e fornecedor do rascunho; sucesso apaga o storage', async () => {
    services.createExpense.mockResolvedValue({ data: { uuid: 'exp-1' } });
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await fillAndSave();
    await waitFor(() => expect(services.createExpense).toHaveBeenCalledTimes(1));
    const payload = services.createExpense.mock.calls[0][0];
    expect(payload.movement_uuid).toBe(MOVEMENT_UUID);
    expect(payload.provider_uuid).toBe(PROVIDER_UUID);
    expect(payload.proprietary_uuid).toBe(PROPRIETARY_UUID);
    expect(payload.amount).toBe(1500.5);
    expect(payload.interest).toBe(10);
    expect(payload.dt_emission).toBe('2026-10-15');
    expect(payload.appropriation).toBe(2);
    await waitFor(() => expect(window.sessionStorage.getItem(storageKey)).toBeNull());
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('create sem rascunho NÃO envia a chave movement_uuid', async () => {
    services.createExpense.mockResolvedValue({ data: { uuid: 'exp-1' } });
    renderCreate('/financeiro/pagar/novo');
    fireEvent.click(screen.getByTestId('fill-required'));
    fireEvent.change(screen.getByTestId('money-amount'), { target: { value: '10' } });
    await act(async () => {
      fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.save));
    });
    await waitFor(() => expect(services.createExpense).toHaveBeenCalledTimes(1));
    expect('movement_uuid' in services.createExpense.mock.calls[0][0]).toBe(false);
  });

  it('422 do POST mantém o rascunho no storage (usuário pode cancelar ou ajustar)', async () => {
    const err: any = new Error('422');
    err.isAxiosError = true;
    err.response = {
      status: 422,
      data: { message: 'Movimento inválido', errors: { movement_uuid: ['Movimento inválido'] } },
    };
    services.createExpense.mockRejectedValue(err);
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), draft: buildDraft() })
    );
    renderCreate({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
      state: { movementObligationDraft: buildDraft() },
    });
    await fillAndSave();
    await waitFor(() => expect(services.createExpense).toHaveBeenCalledTimes(1));
    expect(window.sessionStorage.getItem(storageKey)).not.toBeNull();
    expect(navigateMock).not.toHaveBeenCalledWith(-1);
  });
});
