// UT-000796 — NewMovementModal (Conciliação OFX) segue a MESMA matriz de
// dependências da tela principal (`deriveMovementFieldState`): opções de
// Tp. Categoria desabilitadas pelo Tipo fixo, Cliente/Fornecedor/Conta destino
// pela matriz, limpeza só na ação do usuário e payload saneado coerente com as
// 422 da API.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { Controller } from 'react-hook-form';
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
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ activeFarmUuid: 'farm-uuid-1' }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));
const toasterMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), create: vi.fn() }));
vi.mock('@/components/ui/toaster', () => ({ toaster: toasterMock }));

vi.mock('@/services/v2/Movements/movement-service', () => ({ createMovement: vi.fn() }));
vi.mock('@/services/v2/CadastrosBase/Account/account-service', () => ({ listAccounts: vi.fn() }));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({
  listClientOptions: vi.fn(),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  listProviderOptions: vi.fn(),
}));
vi.mock('@/pages/CadastrosBase/ContasBancarias/useAccounts', () => ({
  useFarmsList: () => ({ data: [], isLoading: false }),
  useProprietariesList: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/pages/CadastrosBase/Fornecedores/useApplySavedProvider', () => ({
  useApplySavedProvider: () => vi.fn(),
}));
vi.mock('./dialogs/InlineClienteFornecedorDialog', () => ({
  InlineClienteFornecedorDialog: () => null,
}));
vi.mock('@/components/CustomDialog', () => ({
  CustomDialog: (props: any) => (
    <div>
      {props.children}
      {props.footer}
    </div>
  ),
}));
vi.mock('@/components/Form/SelectCombobox', () => ({
  SelectCombobox: (props: any) => (
    <button
      type="button"
      data-testid={`combo-${props.name}`}
      onClick={() => props.onChange({ label: 'Prop', value: 'prop-1' })}
    />
  ),
}));
vi.mock('@/components/Form/MoneyInput', () => ({ MoneyInput: () => null }));
vi.mock('@/components/Form/Select', () => ({
  Select: (props: any) => (
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
          data-testid={`opt-${o.value}`}
        >
          {o.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div
      data-testid={`sap-${props.name}`}
      data-disabled={String(!!props.isDisabled)}
      data-value={props.value?.value ?? ''}
      data-label={props.label}
    >
      <button
        type="button"
        data-testid={`pick-${props.name}`}
        disabled={!!props.isDisabled}
        onClick={() => props.onChange({ label: 'x', value: `V-${props.name}` })}
      />
      {props.error && <span data-testid={`err-${props.name}`}>{props.error}</span>}
    </div>
  ),
}));
vi.mock('@/components/MovementAllocationEditor/MovementAllocationEditor', () => ({
  MovementAllocationEditor: (props: any) => (
    <div
      data-testid="alloc-editor"
      data-params={JSON.stringify(props.categoryOptionsParams ?? null)}
    >
      <Controller
        name="allocations.0.category_uuid"
        control={props.control}
        render={({ field }) => (
          <button
            type="button"
            data-testid="alloc-category"
            onClick={() => field.onChange({ label: 'c', value: 'cat-1' })}
          />
        )}
      />
      <Controller
        name="allocations.0.center_uuid"
        control={props.control}
        render={({ field }) => (
          <button
            type="button"
            data-testid="alloc-center"
            onClick={() => field.onChange({ label: 'c', value: 'cc-1' })}
          />
        )}
      />
    </div>
  ),
}));

import { createMovement } from '@/services/v2/Movements/movement-service';

import { NewMovementModal } from './NewMovementModal';

const item = {
  fit_id: 'fit-1',
  date: '2026-09-30',
  value: 100,
  type: 'E' as const,
  memo: 'memo',
  classification: 'x' as any,
  matched_movement_uuid: null,
  reconciled: false,
};

function renderModal(type: 'E' | 'S' = 'E', onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <NewMovementModal
          isOpen
          onClose={vi.fn()}
          item={{ ...item, type }}
          accountUuid="acc-ofx"
          accountLabel="Banco OFX"
          onSuccess={onSuccess}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );
  return onSuccess;
}

const pickCategory = (value: string) =>
  fireEvent.change(screen.getByTestId('select-type_category'), { target: { value } });
const sapDisabled = (n: string) => screen.getByTestId(`sap-${n}`).getAttribute('data-disabled');
const sapValue = (n: string) => screen.getByTestId(`sap-${n}`).getAttribute('data-value');
const optDisabled = (v: string) => (screen.getByTestId(`opt-${v}`) as HTMLOptionElement).disabled;

async function fillRequiredAndSubmit() {
  fireEvent.click(screen.getByTestId('combo-proprietary_uuid'));
  fireEvent.click(screen.getByTestId('alloc-category'));
  fireEvent.click(screen.getByTestId('alloc-center'));
  await act(async () => {
    fireEvent.click(
      screen.getByText(
        languagePtBr.BR.ofxImports.ofxImport.reconciliation.newMovementModal.submitButton
      )
    );
  });
}

describe('NewMovementModal — matriz UT-796', () => {
  beforeEach(() => {
    (createMovement as any).mockReset();
    toasterMock.create.mockReset();
  });
  afterEach(() => cleanup());

  it('Tipo E: Tp.Categoria Saída desabilitada; Cliente habilitado, Fornecedor desabilitado', () => {
    renderModal('E');
    expect(optDisabled('S')).toBe(true);
    expect(optDisabled('E')).toBe(false);
    expect(sapDisabled('client_uuid')).toBe('false');
    expect(sapDisabled('provider_uuid')).toBe('true');
  });

  it('Tipo S: Tp.Categoria Entrada desabilitada; Fornecedor habilitado', () => {
    renderModal('S');
    expect(optDisabled('E')).toBe(true);
    expect(optDisabled('S')).toBe(false);
    expect(sapDisabled('client_uuid')).toBe('true');
    expect(sapDisabled('provider_uuid')).toBe('false');
  });

  it('Transferência: Cliente/Fornecedor desabilitados, Conta destino visível (Conta Origem para Tipo E)', async () => {
    renderModal('E');
    pickCategory('T');
    await waitFor(() => expect(screen.getByTestId('sap-destination_account_uuid')).toBeTruthy());
    expect(sapDisabled('client_uuid')).toBe('true');
    expect(sapDisabled('provider_uuid')).toBe('true');
    expect(screen.getByTestId('sap-destination_account_uuid').getAttribute('data-label')).toBe(
      languagePtBr.BR.movements.movement.form.fields.originAccount
    );
  });

  it('trocar a Tp.Categoria limpa o campo que ficou desabilitado', async () => {
    renderModal('E');
    fireEvent.click(screen.getByTestId('pick-client_uuid'));
    expect(sapValue('client_uuid')).toBe('V-client_uuid');
    pickCategory('F');
    await waitFor(() => expect(sapValue('client_uuid')).toBe(''));
    expect(sapDisabled('provider_uuid')).toBe('false');
  });

  it('payload de Financiamento: parte invertida, generates_obligation derivado; rascunho vira toast', async () => {
    (createMovement as any).mockResolvedValue({
      data: { uuid: 'new', generated_obligation_draft: { type: 'expense' } },
    });
    const onSuccess = renderModal('E');
    pickCategory('F');
    await waitFor(() => expect(sapDisabled('provider_uuid')).toBe('false'));
    fireEvent.click(screen.getByTestId('pick-provider_uuid'));
    await fillRequiredAndSubmit();
    await waitFor(() => expect(createMovement).toHaveBeenCalledTimes(1));
    const payload = (createMovement as any).mock.calls[0][0];
    expect(payload).toMatchObject({
      type: 'E',
      type_category: 'F',
      provider_uuid: 'V-provider_uuid',
      client_uuid: null,
      destination_account_uuid: null,
      generates_obligation: true,
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(toasterMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: languagePtBr.BR.movements.movement.form.obligationDraftGenerated.title,
        // P-r2-2 (Atlas): o modal OFX NÃO redireciona — só informa. (O modal é
        // renderizado SEM Router neste teste: qualquer `useNavigate` falharia.)
        description: languagePtBr.BR.movements.movement.form.obligationDraftGenerated.ofxNotice,
      })
    );
  });

  it('O2: o rateio recebe categoryOptionsParams = deriveAllocationCategoryParams (E, S, F por Tipo, T); sem Tp.Categoria, undefined', () => {
    const params = () =>
      JSON.parse(screen.getByTestId('alloc-editor').getAttribute('data-params')!);
    renderModal('E');
    // O modal já nasce com Tp. Categoria = Entrada.
    expect(params()).toEqual({ type_id: 2, cost_center_scoped: 'true' });
    pickCategory('');
    expect(params()).toBeNull(); // sem Tp. Categoria => undefined (sem filtro)
    pickCategory('E');
    expect(params()).toEqual({ type_id: 2, cost_center_scoped: 'true' });
    pickCategory('S'); // Tipo E fixo: S desabilitada na opção, mas o filtro segue o mapa
    expect(params()).toEqual({ type_id: 1, cost_center_scoped: 'true' });
    pickCategory('F');
    expect(params()).toEqual({ type_id: 2, cost_center_scoped: 'true' });
    pickCategory('T');
    expect(params()).toEqual({ bank_movement_scoped: 'true', class: 2, is_enabled: 'true' });
  });

  it('O2: Tipo S + F inverte o tipo da categoria (type_id 1)', () => {
    renderModal('S');
    pickCategory('F');
    expect(JSON.parse(screen.getByTestId('alloc-editor').getAttribute('data-params')!)).toEqual({
      type_id: 1,
      cost_center_scoped: 'true',
    });
  });

  it('payload de E: Cliente enviado, Fornecedor/destino null, generates_obligation false', async () => {
    (createMovement as any).mockResolvedValue({ data: { uuid: 'new' } });
    renderModal('E');
    fireEvent.click(screen.getByTestId('pick-client_uuid'));
    await fillRequiredAndSubmit();
    await waitFor(() => expect(createMovement).toHaveBeenCalledTimes(1));
    expect((createMovement as any).mock.calls[0][0]).toMatchObject({
      type: 'E',
      type_category: 'E',
      client_uuid: 'V-client_uuid',
      provider_uuid: null,
      destination_account_uuid: null,
      generates_obligation: false,
    });
    expect(toasterMock.create).not.toHaveBeenCalled();
  });

  it('422 por campo aparece no campo', async () => {
    const err = new AxiosError('x');
    err.response = {
      status: 422,
      data: { errors: { client_uuid: ['Cliente não permitido.'] } },
      statusText: '',
      headers: {},
      config: {} as any,
    };
    (createMovement as any).mockRejectedValue(err);
    renderModal('E');
    await fillRequiredAndSubmit();
    await waitFor(() =>
      expect(screen.getByTestId('err-client_uuid').textContent).toBe('Cliente não permitido.')
    );
  });
});
