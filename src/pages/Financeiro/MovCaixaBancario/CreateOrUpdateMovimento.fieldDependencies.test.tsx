// UT-000796 — dependências Tipo × Tp. Categoria × Cliente × Fornecedor ×
// Conta destino × Gera Obrigação na tela de Mov. Caixa/Bancário.
// Mocks nativos simples de Select/SelectAsyncPaginate expõem `disabled` e
// opções desabilitadas; o foco é o COMPORTAMENTO do form (matriz, limpeza só
// em ação do usuário, hidratação intacta, payload saneado, 422 por campo).
import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { useWatch } from 'react-hook-form';
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
  useAuth: () => ({ activeFarmUuid: 'farm-uuid-1', user: { username: 'dev' } }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), create: vi.fn() },
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const mockDetail = vi.hoisted(() => ({ value: null as any }));
vi.mock('@/services/v2/Movements/movement-service', () => ({
  createMovement: vi.fn(),
  updateMovement: vi.fn(),
  getMovement: vi.fn(() => Promise.resolve({ data: mockDetail.value })),
}));
vi.mock('@/services/v2/Farms/farm-admin-service', () => ({
  getFarmByUuid: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@/services/v2/CadastrosBase/Account/account-service', () => ({ listAccounts: vi.fn() }));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({ listClients: vi.fn() }));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  listProviders: vi.fn(),
}));
vi.mock('@/pages/CadastrosBase/ContasBancarias/useAccounts', () => ({
  useFarmsList: () => ({ data: [], isLoading: false }),
  useProprietariesList: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/pages/CadastrosBase/Clientes/ClientFormModal', () => ({
  ClientFormModal: () => null,
}));
vi.mock('@/pages/CadastrosBase/Fornecedores/ProviderFormModal', () => ({
  ProviderFormModal: () => null,
}));
vi.mock('@/pages/CadastrosBase/Fornecedores/useApplySavedProvider', () => ({
  useApplySavedProvider: () => vi.fn(),
}));

vi.mock('@/components/ButtonSaveAndNext', () => ({
  ButtonSaveAndNext: (props: any) => (
    <button type="button" data-testid="save" onClick={props.onClick} disabled={props.disabled}>
      save
    </button>
  ),
}));
vi.mock('@/components/DateInput', () => ({
  DateInput: (props: any) => (
    <input
      data-testid="date-input"
      aria-label="date"
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
      onChange={(e) => props.onValueChange(Number(e.target.value))}
    />
  ),
}));
vi.mock('@/components/Form/SelectCombobox', () => ({
  SelectCombobox: (props: any) => <div data-testid={`combo-${props.name}`} />,
}));

// Select nativo: expõe disabled e opções desabilitadas.
vi.mock('@/components/Form/Select', () => ({
  Select: (props: any) => (
    <div>
      <select
        data-testid={`select-${props.name}`}
        disabled={!!props.isDisabled}
        value={props.value?.value ?? ''}
        onChange={(e) =>
          props.onChange(props.options.find((o: any) => o.value === e.target.value) ?? null)
        }
      >
        <option value="" />
        {props.options.map((o: any) => (
          <option
            key={o.value}
            value={o.value}
            disabled={!!props.isOptionDisabled?.(o)}
            data-testid={`opt-${props.name}-${o.value}`}
          >
            {o.label}
          </option>
        ))}
      </select>
      {props.error && <span data-testid={`err-${props.name}`}>{props.error}</span>}
    </div>
  ),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div
      data-testid={`sap-${props.name}`}
      data-disabled={String(!!props.isDisabled)}
      data-value={props.value?.value ?? ''}
    >
      <button
        type="button"
        data-testid={`pick-${props.name}`}
        disabled={!!props.isDisabled}
        onClick={() => props.onChange({ label: `L-${props.name}`, value: `V-${props.name}` })}
      >
        pick
      </button>
      {props.labelAction}
      {props.error && <span data-testid={`err-${props.name}`}>{props.error}</span>}
    </div>
  ),
}));

// Editor de rateio: expõe categoryOptionsParams e as categorias do form.
vi.mock('@/components/MovementAllocationEditor/MovementAllocationEditor', () => ({
  MovementAllocationEditor: (props: any) => {
    const rows = useWatch({ control: props.control, name: 'allocations' }) as any[];
    return (
      <div
        data-testid="allocation-editor"
        data-params={JSON.stringify(props.categoryOptionsParams ?? null)}
      >
        {(rows ?? []).map((row, i) => (
          <span key={i} data-testid={`alloc-cat-${i}`}>
            {row?.category_uuid?.value ?? 'null'}
          </span>
        ))}
      </div>
    );
  },
}));

import { createMovement, updateMovement } from '@/services/v2/Movements/movement-service';

import CreateOrUpdateMovimento from './CreateOrUpdateMovimento';

const UUID = '22222222-2222-4222-8222-222222222222';

function buildDetail(over: Record<string, any> = {}) {
  return {
    uuid: UUID,
    code: 'MV-0001',
    date: '2026-09-30',
    type: 'E',
    type_category: 'F',
    account: { uuid: 'acc-1', bank: 'Banco', agency: '1', account: '2' },
    destination_account: null,
    farm_uuid: null,
    proprietary: { uuid: 'prop-1', name: 'Prop' },
    client: null,
    provider: { uuid: 'prov-1', name: 'Fornecedor X' },
    value: 100,
    interest: null,
    document: '',
    note: '',
    fiscal_document: false,
    generates_obligation: false,
    allocations: [
      {
        category: { uuid: 'cat-1', code: '1', description: 'Cat' },
        center: { uuid: 'cc-1', code: '1', description: 'Centro' },
        plan_account: null,
        harvest: null,
        value: 100,
      },
    ],
    ...over,
  };
}

function renderScreen(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/financeiro/caixa/novo" element={<CreateOrUpdateMovimento />} />
              <Route path="/financeiro/caixa/:uuid" element={<CreateOrUpdateMovimento />} />
            </Routes>
          </MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

async function openEdit(detail: any) {
  mockDetail.value = detail;
  renderScreen(`/financeiro/caixa/${UUID}`);
  await waitFor(() =>
    expect(screen.getByTestId('select-type')).toHaveProperty('value', detail.type)
  );
}

function pickSelect(name: string, value: string) {
  fireEvent.change(screen.getByTestId(`select-${name}`), { target: { value } });
}
const sapDisabled = (name: string) =>
  screen.getByTestId(`sap-${name}`).getAttribute('data-disabled');
const sapValue = (name: string) => screen.getByTestId(`sap-${name}`).getAttribute('data-value');
const optDisabled = (value: string) =>
  (screen.getByTestId(`opt-type_category-${value}`) as HTMLOptionElement).disabled;

describe('UT-796 — criação: matriz de dependências', () => {
  afterEach(() => cleanup());

  it('Tipo=Entrada: Tp.Categoria Saída desabilitada, Fornecedor desabilitado, Cliente habilitado', () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'E');
    expect(optDisabled('S')).toBe(true);
    expect(optDisabled('E')).toBe(false);
    expect(optDisabled('T')).toBe(false);
    expect(optDisabled('F')).toBe(false);
    expect(sapDisabled('provider_uuid')).toBe('true');
    expect(sapDisabled('client_uuid')).toBe('false');
  });

  it('Tipo=Saída: inverso', () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'S');
    expect(optDisabled('E')).toBe(true);
    expect(optDisabled('S')).toBe(false);
    expect(sapDisabled('client_uuid')).toBe('true');
    expect(sapDisabled('provider_uuid')).toBe('false');
  });

  it('trocar o Tipo limpa Tp.Categoria, Cliente, Fornecedor e categorias do rateio (linhas permanecem)', async () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'E');
    pickSelect('type_category', 'E');
    fireEvent.click(screen.getByTestId('pick-client_uuid'));
    expect(sapValue('client_uuid')).toBe('V-client_uuid');
    // semeia uma categoria no rateio (via setValue do form não exposto: usa o mock do editor)
    // — o teste da limpeza de categoria de rateio está no caso de edição abaixo.
    pickSelect('type', 'S');
    await waitFor(() => expect(sapValue('client_uuid')).toBe(''));
    expect((screen.getByTestId('select-type_category') as HTMLSelectElement).value).toBe('');
    expect(screen.getByTestId('alloc-cat-0')).toBeTruthy();
  });

  it('Financiamento com Tipo E: Fornecedor habilitado, Cliente desabilitado, Gera Obrigação marcado e desabilitado', async () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'E');
    pickSelect('type_category', 'F');
    await waitFor(() => expect(sapDisabled('provider_uuid')).toBe('false'));
    expect(sapDisabled('client_uuid')).toBe('true');
    const sw = screen.getByRole('checkbox', { name: 'Gera Obrigação' }) as HTMLInputElement;
    expect(sw.checked).toBe(true);
    expect(sw.disabled).toBe(true);
  });

  it('Financiamento com Tipo S inverte a parte (Cliente habilitado)', async () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'S');
    pickSelect('type_category', 'F');
    await waitFor(() => expect(sapDisabled('client_uuid')).toBe('false'));
    expect(sapDisabled('provider_uuid')).toBe('true');
  });

  it('Transferência: Conta destino aparece (rótulo Conta Origem com Tipo=E) e é obrigatória', async () => {
    renderScreen('/financeiro/caixa/novo');
    expect(screen.queryByTestId('sap-destination_account_uuid')).toBeNull();
    pickSelect('type', 'E');
    pickSelect('type_category', 'T');
    await waitFor(() => expect(screen.getByTestId('sap-destination_account_uuid')).toBeTruthy());
    expect(sapDisabled('client_uuid')).toBe('true');
    expect(sapDisabled('provider_uuid')).toBe('true');
    // submit sem Conta destino (e demais obrigatórios) não chama a API
    await act(async () => {
      fireEvent.click(screen.getByTestId('save'));
    });
    expect(createMovement).not.toHaveBeenCalled();
  });

  it('botão "+" de Cliente/Fornecedor desabilita junto com o campo (D-102-10)', () => {
    renderScreen('/financeiro/caixa/novo');
    pickSelect('type', 'E');
    const clientBtn = screen.getByLabelText(
      languagePtBr.BR.movements.movement.form.actions.addClientAria
    );
    const providerBtn = screen.getByLabelText(
      languagePtBr.BR.movements.movement.form.actions.addProviderAria
    );
    expect((clientBtn as HTMLButtonElement).disabled).toBe(false);
    expect((providerBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('filtro de categoria do rateio acompanha Tipo/Tp.Categoria', () => {
    renderScreen('/financeiro/caixa/novo');
    const params = () =>
      JSON.parse(screen.getByTestId('allocation-editor').getAttribute('data-params')!);
    expect(params()).toBeNull();
    pickSelect('type', 'S');
    pickSelect('type_category', 'S');
    expect(params()).toEqual({ type_id: 1, cost_center_scoped: 'true' });
    pickSelect('type_category', 'T');
    expect(params()).toEqual({ bank_movement_scoped: 'true', class: 2, is_enabled: 'true' });
  });
});

describe('UT-796 — edição: hidratação nunca limpa nada', () => {
  beforeEach(() => {
    (createMovement as any).mockReset();
    (updateMovement as any).mockReset();
    (updateMovement as any).mockResolvedValue({ data: { uuid: UUID } });
  });
  afterEach(() => cleanup());

  it('F/E com Fornecedor: abre preenchido, Gera Obrigação derivado, nada é salvo sozinho', async () => {
    await openEdit(buildDetail());
    expect(sapValue('provider_uuid')).toBe('prov-1');
    expect(sapDisabled('provider_uuid')).toBe('false');
    expect(sapDisabled('client_uuid')).toBe('true');
    expect(screen.getByTestId('alloc-cat-0').textContent).toBe('cat-1');
    const sw = screen.getByRole('checkbox', { name: 'Gera Obrigação' }) as HTMLInputElement;
    expect(sw.checked).toBe(true); // derivado, não o valor salvo (false)
    expect(updateMovement).not.toHaveBeenCalled();
  });

  it('edição de Transferência: Tipo e Tp.Categoria travados', async () => {
    await openEdit(
      buildDetail({
        type_category: 'T',
        provider: null,
        destination_account: { uuid: 'acc-2', bank: 'B', agency: '1', account: '3' },
      })
    );
    expect((screen.getByTestId('select-type') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByTestId('select-type_category') as HTMLSelectElement).disabled).toBe(true);
  });

  it('edição de não-T: Tipo e Tp.Categoria seguem editáveis', async () => {
    await openEdit(buildDetail());
    expect((screen.getByTestId('select-type') as HTMLSelectElement).disabled).toBe(false);
    expect((screen.getByTestId('select-type_category') as HTMLSelectElement).disabled).toBe(false);
  });

  it('trocar o Tipo na edição limpa as categorias do rateio sem remover a linha', async () => {
    await openEdit(buildDetail());
    pickSelect('type', 'S');
    await waitFor(() => expect(screen.getByTestId('alloc-cat-0').textContent).toBe('null'));
    expect(sapValue('provider_uuid')).toBe('');
  });

  it('payload saneado: Cliente residual descartado, generates_obligation derivado, destino null fora de T', async () => {
    // registro legado incoerente: F/E com Cliente E Fornecedor + destino residual
    await openEdit(
      buildDetail({
        client: { uuid: 'cli-1', name: 'Cliente X' },
        destination_account: { uuid: 'acc-2', bank: 'B', agency: '1', account: '3' },
      })
    );
    fireEvent.change(screen.getByTestId('money-value'), { target: { value: '100' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save'));
    });
    await waitFor(() => expect(updateMovement).toHaveBeenCalledTimes(1));
    const [uuid, payload] = (updateMovement as any).mock.calls[0];
    expect(uuid).toBe(UUID);
    expect(payload.client_uuid).toBeNull();
    expect(payload.provider_uuid).toBe('prov-1');
    expect(payload.destination_account_uuid).toBeNull();
    expect(payload.generates_obligation).toBe(true);
    expect(payload.type).toBe('E');
    expect(payload.type_category).toBe('F');
  });

  it('422 com errors.client_uuid mostra a mensagem no campo', async () => {
    const err = new AxiosError('x');
    err.response = {
      status: 422,
      data: { errors: { provider_uuid: ['O Fornecedor não pode ser informado.'] } },
      statusText: '',
      headers: {},
      config: {} as any,
    };
    (updateMovement as any).mockRejectedValue(err);
    await openEdit(buildDetail());
    fireEvent.change(screen.getByTestId('money-value'), { target: { value: '100' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('err-provider_uuid').textContent).toBe(
        'O Fornecedor não pode ser informado.'
      )
    );
  });
});

// ---------------------------------------------------------------------------
// UT-000796 r2 — Gera Obrigação (navegação com rascunho), Saldo Inicial somente
// leitura, rótulos A4 e confirmação de cascata (títulos gerados).
// ---------------------------------------------------------------------------
const OBLIGATION_MOVEMENT_UUID = '019f62a6-1111-7023-8abc-0123456789ab';

function buildObligationDraft(type: 'expense' | 'income') {
  return {
    type,
    note: 'Financiamento',
    amount: '100.00',
    provider_uuid: type === 'expense' ? 'prov-1' : null,
    client_uuid: type === 'income' ? 'cli-1' : null,
    proprietary_uuid: 'prop-1',
    interest: '0.00',
    dt_emission: '2026-09-30',
    movement_uuid: OBLIGATION_MOVEMENT_UUID,
    appropriation: 2,
  };
}

async function saveEdit() {
  fireEvent.change(screen.getByTestId('money-value'), { target: { value: '100' } });
  await act(async () => {
    fireEvent.click(screen.getByTestId('save'));
  });
}

describe('UT-796 r2 — Gera Obrigação: navegação após salvar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    (createMovement as any).mockReset();
    (updateMovement as any).mockReset();
    window.sessionStorage.clear();
  });
  afterEach(() => cleanup());

  it('update F/E com rascunho navega (replace) para Nova Conta a Pagar com o movement_uuid do RASCUNHO', async () => {
    const draft = buildObligationDraft('expense');
    (updateMovement as any).mockResolvedValue({
      data: { uuid: 'novo-uuid-recriado', generated_obligation_draft: draft },
    });
    await openEdit(buildDetail());
    await saveEdit();
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        { pathname: '/financeiro/pagar/novo', search: `?fromMovement=${OBLIGATION_MOVEMENT_UUID}` },
        { replace: true, state: { movementObligationDraft: draft } }
      )
    );
    expect(navigateMock).not.toHaveBeenCalledWith(-1);
    expect(
      window.sessionStorage.getItem(`gb:movement-obligation-draft:${OBLIGATION_MOVEMENT_UUID}`)
    ).not.toBeNull();
  });

  it('F/S com rascunho de income navega para Nova Conta a Receber', async () => {
    const draft = buildObligationDraft('income');
    (updateMovement as any).mockResolvedValue({
      data: { uuid: 'novo', generated_obligation_draft: draft },
    });
    await openEdit(
      buildDetail({ type: 'S', provider: null, client: { uuid: 'cli-1', name: 'C' } })
    );
    await saveEdit();
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/financeiro/receber/novo' }),
        expect.objectContaining({ replace: true })
      )
    );
  });

  it('sem rascunho segue navigate(-1)', async () => {
    (updateMovement as any).mockResolvedValue({ data: { uuid: 'novo' } });
    await openEdit(buildDetail({ type_category: 'E', provider: null }));
    await saveEdit();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(-1));
  });
});

describe('UT-796 r2 — Saldo Inicial somente leitura e rótulos', () => {
  beforeEach(() => {
    (updateMovement as any).mockReset();
  });
  afterEach(() => cleanup());

  it('movimento type_category I: sem Salvar, aviso visível, campo hidratado intacto', async () => {
    await openEdit(buildDetail({ type_category: 'I', provider: null }));
    expect(screen.queryByTestId('save')).toBeNull();
    expect(
      screen.getByText(languagePtBr.BR.movements.movement.form.openingBalanceNotice)
    ).toBeTruthy();
    expect(sapValue('account_uuid')).toBe('acc-1');
    expect(updateMovement).not.toHaveBeenCalled();
  });

  it('is_opening_balance=true da API também trava (mesmo sem type_category I)', async () => {
    await openEdit(buildDetail({ is_opening_balance: true }));
    expect(screen.queryByTestId('save')).toBeNull();
  });

  it('rótulos A4: Trans. Interna e Financiamento/Empréstimo', () => {
    renderScreen('/financeiro/caixa/novo');
    expect(screen.getByTestId('opt-type_category-T').textContent).toBe('Trans. Interna');
    expect(screen.getByTestId('opt-type_category-F').textContent).toBe('Financiamento/Empréstimo');
  });
});

describe('UT-796 r2 — cascata ao editar movimento com títulos gerados', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    (updateMovement as any).mockReset();
    (updateMovement as any).mockResolvedValue({ data: { uuid: 'novo' } });
  });
  afterEach(() => cleanup());

  it('com generated_obligations_count > 0 pede confirmação e só envia o PUT após confirmar', async () => {
    await openEdit(buildDetail({ generated_obligations_count: 2 }));
    await saveEdit();
    expect(updateMovement).not.toHaveBeenCalled();
    const confirmLabel = languagePtBr.BR.movements.movement.form.cascadeSave.confirm;
    const confirmButton = await screen.findByText(confirmLabel);
    expect(await screen.findByText(/gerou 2 título\(s\)/, { exact: false })).toBeTruthy();
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    await waitFor(() => expect(updateMovement).toHaveBeenCalledTimes(1));
  });

  it('sem títulos gerados (count 0 ou ausente) salva direto', async () => {
    await openEdit(buildDetail({ generated_obligations_count: 0 }));
    await saveEdit();
    await waitFor(() => expect(updateMovement).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// UT-000796 r2b — transferência editada pelo lado ESPELHO (API r2 §5.3/§10.2):
// o form hidrata com os dados DA LINHA CLICADA (conta, Tipo e destino dela, como
// o GET detalhe devolve), Tipo/Tp. Categoria seguem readonly (T), o PUT envia o
// payload como hidratado e, como o uuid muda SEMPRE, a tela nunca navega pelo
// uuid da URL nem pelo `data.uuid` devolvido — sai para a lista (`navigate(-1)`).
// ---------------------------------------------------------------------------
describe('UT-796 r2b — transferência pelo lado espelho', () => {
  const MIRROR_UUID = '33333333-3333-4333-8333-333333333333';
  const NEW_UUID = '44444444-4444-4444-8444-444444444444';

  // Linha espelho de uma transferência E (A→B): conta B, Tipo S, destino A.
  function mirrorDetail(over: Record<string, any> = {}) {
    return buildDetail({
      uuid: MIRROR_UUID,
      type: 'S',
      type_category: 'T',
      is_mirror: true,
      account: { uuid: 'acc-B', bank: 'Banco B', agency: '2', account: '20' },
      destination_account: { uuid: 'acc-A', bank: 'Banco A', agency: '1', account: '10' },
      provider: null,
      ...over,
    });
  }

  async function openMirror(detail: any) {
    mockDetail.value = detail;
    renderScreen(`/financeiro/caixa/${detail.uuid}`);
    await waitFor(() =>
      expect(screen.getByTestId('select-type')).toHaveProperty('value', detail.type)
    );
  }

  beforeEach(() => {
    navigateMock.mockReset();
    (updateMovement as any).mockReset();
    (updateMovement as any).mockResolvedValue({ data: { uuid: NEW_UUID } });
  });
  afterEach(() => cleanup());

  it('hidrata com conta, Tipo e destino DA LINHA clicada; Tipo e Tp. Categoria readonly', async () => {
    await openMirror(mirrorDetail());
    expect(sapValue('account_uuid')).toBe('acc-B');
    expect(sapValue('destination_account_uuid')).toBe('acc-A');
    expect((screen.getByTestId('select-type') as HTMLSelectElement).value).toBe('S');
    expect((screen.getByTestId('select-type_category') as HTMLSelectElement).value).toBe('T');
    expect((screen.getByTestId('select-type') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByTestId('select-type_category') as HTMLSelectElement).disabled).toBe(true);
  });

  it('PUT usa o uuid da URL (linha clicada), envia o payload como hidratado e sai para a lista', async () => {
    await openMirror(mirrorDetail());
    await saveEdit();
    await waitFor(() => expect(updateMovement).toHaveBeenCalledTimes(1));
    const [uuid, payload] = (updateMovement as any).mock.calls[0];
    expect(uuid).toBe(MIRROR_UUID);
    expect(payload).toMatchObject({
      type: 'S',
      type_category: 'T',
      account_uuid: 'acc-B',
      destination_account_uuid: 'acc-A',
    });
    // o uuid devolvido (novo) nunca vira rota: volta à lista
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(-1));
    expect(navigateMock).not.toHaveBeenCalledWith(expect.stringContaining(NEW_UUID));
  });

  it('cascata usa generated_obligations_count do GET detalhe também no espelho', async () => {
    await openMirror(mirrorDetail({ generated_obligations_count: 1 }));
    await saveEdit();
    expect(updateMovement).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByText(languagePtBr.BR.movements.movement.form.cascadeSave.confirm)
    );
    await waitFor(() => expect(updateMovement).toHaveBeenCalledTimes(1));
  });
});
