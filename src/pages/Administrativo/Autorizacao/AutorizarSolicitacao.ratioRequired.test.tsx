// @vitest-environment jsdom
// UT-000743 (D-100-22, supera D-100-14/17/18/19) — Safra e Classificação IGUAIS AO LEGADO:
// nenhuma ação bloqueia por falta delas. Quando preenchidas, vão em Aprovar, Voltar Etapa,
// Próxima Etapa (2/4) e Enviar para Autorização; chave vazia é OMITIDA do corpo. Devolver e
// Reprovar da Ciência mandam só `{ justify }`. O rateio segue validando soma/categoria/centro.
// Os corpos são conferidos com `toStrictEqual` (chave vazia omitida != chave `undefined`).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import AutorizarSolicitacao from './AutorizarSolicitacao';

const UUID = '11111111-1111-4111-8111-111111111111';
const t = languagePtBr.BR.requestAuthorizations.requestAuthorization;
const actions = t.detail.actions;
const validation = t.detail.clientValidation;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uuid: 'user-1' } }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

const toasts = vi.hoisted(() => ({ create: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/components/ui/toaster', () => ({ toaster: toasts }));

const svc = vi.hoisted(() => ({
  getRequestAuthorization: vi.fn(),
  approveRequestAuthorization: vi.fn(),
  rejectPartialRequestAuthorization: vi.fn(),
  rejectFinalRequestAuthorization: vi.fn(),
  acknowledgeRequestAuthorization: vi.fn(),
  returnRequestAuthorization: vi.fn(),
  rejectSecondLevelRequestAuthorization: vi.fn(),
  reassignRequestAuthorization: vi.fn(),
}));
vi.mock('@/services/v2/RequestAuthorizations/request-authorization-service', () => svc);

const autoPromote = vi.hoisted(() => ({ params: null as any }));
vi.mock('./useAutoPromoteOnce', () => ({
  useAutoPromoteOnce: (params: unknown) => {
    autoPromote.params = params;
    return { isPromoting: false };
  },
}));
vi.mock('@/components/Suprimentos/invalidateSupplyQueries', () => ({
  invalidateSupplyQueries: vi.fn(),
}));
vi.mock('@/components/Suprimentos/TransferResponsibleDialog', () => ({
  TransferResponsibleDialog: () => null,
}));
vi.mock('@/components/Layout/FormContainer', () => ({
  FormContainer: (p: any) => (
    <div>
      {p.children}
      {p.footer}
    </div>
  ),
}));
vi.mock('@/components/Button', () => ({
  Button: (p: any) => (
    <button type="button" onClick={p.onClick} disabled={p.disabled}>
      {p.title}
    </button>
  ),
}));
vi.mock('./RequestAuthorizationInfoSection', () => ({
  RequestAuthorizationInfoSection: () => null,
}));
vi.mock('./RequestAuthorizationAttachments', () => ({
  RequestAuthorizationAttachments: () => null,
}));
vi.mock('./RequestAuthorizationItemsSection', () => ({
  RequestAuthorizationItemsSection: () => null,
}));
vi.mock('./RequestAuthorizationQuotationsSection', () => ({
  RequestAuthorizationQuotationsSection: () => null,
}));
vi.mock('./AuthorizationRatioReadOnly', () => ({ AuthorizationRatioReadOnly: () => null }));
vi.mock('../Solicitacao/RequestMovementHistory', () => ({ RequestMovementHistory: () => null }));
vi.mock('./AuthorizationJustifyBlock', () => ({
  AuthorizationJustifyBlock: (p: any) => (
    <input aria-label="justify" value={p.value} onChange={(e) => p.onChange(e.target.value)} />
  ),
}));
vi.mock('./AuthorizationRatioBlock', () => ({
  initialRatioState: () => ({
    classification: '',
    harvestUuid: '',
    rows: [{ category_uuid: 'cat', center_uuid: 'ctr', percent: 100 }],
  }),
  AuthorizationRatioBlock: (p: any) => (
    <div>
      <button type="button" onClick={() => p.onChange({ ...p.value, harvestUuid: 'harvest-1' })}>
        pick-harvest
      </button>
      <button type="button" onClick={() => p.onChange({ ...p.value, classification: 'C' })}>
        pick-classification
      </button>
      <button
        type="button"
        onClick={() =>
          p.onChange({
            ...p.value,
            rows: [{ category_uuid: 'cat', center_uuid: 'ctr', percent: 90 }],
          })
        }
      >
        break-sum
      </button>
      <span data-testid="harvest-error">{p.harvestError ?? ''}</span>
      <span data-testid="classification-error">{p.classificationError ?? ''}</span>
    </div>
  ),
}));
vi.mock('./SendForAuthorizationDialog', () => ({
  SendForAuthorizationDialog: (p: any) =>
    p.isOpen ? (
      <div data-testid="send-dialog">
        <button type="button" onClick={() => p.onSuccess?.()}>
          payload:{Object.keys(p.getRatioPayload()).sort().join(',')}
        </button>
      </div>
    ) : null,
}));

function detail(opts: { first: boolean; requiresRatio: boolean; nextStatus?: number }) {
  return {
    uuid: UUID,
    code: '0001',
    type: 'O',
    type_label: 'Outros',
    status: 3,
    status_label: 'Aguardando',
    items: [{ uuid: 'item-1' }],
    quotations: [],
    movements: [],
    attachments: [],
    ratio: [],
    farm: { uuid: 'farm-1' },
    responsible: { uuid: 'user-2' },
    authorization_context: {
      can_approve_first_level: opts.first,
      can_acknowledge_second_level: !opts.first,
      requires_ratio_block: opts.requiresRatio,
      next_status: opts.nextStatus ?? 3,
      eligible_authorizers: [],
      transfer_candidates: [],
      can_transfer: false,
    },
  };
}

async function renderScreen(d: ReturnType<typeof detail>) {
  svc.getRequestAuthorization.mockResolvedValue({ data: d });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/administrativo/autorizacao/${UUID}`]}>
          <Routes>
            <Route path="/administrativo/autorizacao/:uuid" element={<AutorizarSolicitacao />} />
            <Route path="/administrativo/autorizacao" element={<div>lista</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
  await screen.findByLabelText('justify');
  fireEvent.change(screen.getByLabelText('justify'), { target: { value: 'ok' } });
}

const click = (name: string) => fireEvent.click(screen.getByText(name));

function warnedWith(message: string) {
  return toasts.create.mock.calls.some(([arg]) => arg?.description === message);
}

const BASE_RATIO_KEYS = 'categories,centers,category_percent_values';

function pickBoth() {
  click('pick-harvest');
  click('pick-classification');
}

describe('Autorização — Safra e Classificação opcionais (D-100-22)', () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn) => fn.mockReset());
    Object.values(toasts).forEach((fn) => fn.mockReset());
    Object.values(svc).forEach((fn) => fn.mockResolvedValue({ data: {} }));
  });
  afterEach(cleanup);

  it('TF-17: Aprovar com bloco e sem Safra/Classificação aprova; corpo sem as chaves', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    click(actions.next);
    await waitFor(() => expect(svc.approveRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.approveRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      final_justification: 'ok',
      items: ['item-1'],
      quotations: [],
      categories: ['cat'],
      centers: ['ctr'],
      category_percent_values: [100],
    });
    expect(toasts.create).not.toHaveBeenCalled();
  });

  it('TF-17: Aprovar com Safra e Classificação preenchidas envia as duas', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    pickBoth();
    click(actions.next);
    await waitFor(() => expect(svc.approveRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.approveRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      final_justification: 'ok',
      items: ['item-1'],
      quotations: [],
      classification: 'C',
      harvest_uuid: 'harvest-1',
      categories: ['cat'],
      centers: ['ctr'],
      category_percent_values: [100],
    });
  });

  it('IG07: Aprovar com soma diferente de 100 continua bloqueado', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    click('break-sum');
    click(actions.next);
    expect(svc.approveRequestAuthorization).not.toHaveBeenCalled();
    expect(warnedWith(validation.ratioSumInvalid)).toBe(true);
  });

  it('TF-18: Voltar Etapa (rejeição parcial) sem Safra/Classificação posta só { justify }', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    click(actions.back);
    await waitFor(() => expect(svc.rejectPartialRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectPartialRequestAuthorization.mock.calls[0][1]).toStrictEqual({ justify: 'ok' });
  });

  it('TF-18: Voltar Etapa com Safra e Classificação preenchidas envia as duas', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    pickBoth();
    click(actions.back);
    await waitFor(() => expect(svc.rejectPartialRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectPartialRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      justify: 'ok',
      classification: 'C',
      harvest_uuid: 'harvest-1',
    });
  });

  it('Rejeitar total (Aprovação) com bloco manda só a justificativa final', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    click(actions.reject);
    await waitFor(() => expect(svc.rejectFinalRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectFinalRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      final_justification: 'ok',
    });
  });

  it('sem bloco: Voltar Etapa não leva Safra/Classificação', async () => {
    await renderScreen(detail({ first: true, requiresRatio: false }));
    click(actions.back);
    await waitFor(() => expect(svc.rejectPartialRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectPartialRequestAuthorization.mock.calls[0][1]).toStrictEqual({ justify: 'ok' });
  });

  it('sem bloco: Aprovar não leva Safra/Classificação', async () => {
    await renderScreen(detail({ first: true, requiresRatio: false }));
    click(actions.next);
    await waitFor(() => expect(svc.approveRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.approveRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      final_justification: 'ok',
      items: ['item-1'],
      quotations: [],
    });
  });

  it('TF-18: Ciência → Enviar para Autorização abre o modal sem Safra/Classificação e sem as chaves', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 3 }));
    click(actions.next);
    const dialog = await screen.findByTestId('send-dialog');
    expect(dialog.textContent).toContain(`payload:${BASE_RATIO_KEYS.split(',').sort().join(',')}`);
    expect(dialog.textContent).not.toContain('harvest_uuid');
    expect(dialog.textContent).not.toContain('classification');
    expect(svc.acknowledgeRequestAuthorization).not.toHaveBeenCalled();
  });

  it('TF-18: Enviar para Autorização com as duas preenchidas leva as chaves no payload', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 3 }));
    pickBoth();
    click(actions.next);
    const dialog = await screen.findByTestId('send-dialog');
    expect(dialog.textContent).toContain('harvest_uuid');
    expect(dialog.textContent).toContain('classification');
  });

  it('TF-18 (regressão pré-FE-03): rateio com soma 90 não abre o modal', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 3 }));
    click('break-sum');
    click(actions.next);
    expect(screen.queryByTestId('send-dialog')).toBeNull();
    expect(warnedWith(validation.ratioSumInvalid)).toBe(true);
  });

  it('TF-18: Ciência → destino 2/4 sem Safra/Classificação envia só status + justify', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    click(actions.next);
    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.acknowledgeRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      status: 4,
      justify: 'ok',
    });
  });

  it('TF-18: Ciência → destino 2/4 com as duas preenchidas envia o cabeçalho', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    pickBoth();
    click(actions.next);
    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.acknowledgeRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      status: 4,
      justify: 'ok',
      classification: 'C',
      harvest_uuid: 'harvest-1',
    });
  });

  it('TF-19: Devolver com bloco e Safra/Classificação preenchidas manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    pickBoth();
    click(actions.back);
    await waitFor(() => expect(svc.returnRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.returnRequestAuthorization.mock.calls[0][1]).toStrictEqual({ justify: 'ok' });
  });

  it('TF-19: Reprovar com bloco e Safra/Classificação preenchidas manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    pickBoth();
    click(actions.reject);
    await waitFor(() => expect(svc.rejectSecondLevelRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectSecondLevelRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      justify: 'ok',
    });
  });

  it('TF-19: Devolver com bloco e SEM Safra/Classificação manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    click(actions.back);
    await waitFor(() => expect(svc.returnRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.returnRequestAuthorization.mock.calls[0][1]).toStrictEqual({ justify: 'ok' });
  });

  it('TF-19: Reprovar com bloco e SEM Safra/Classificação manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    click(actions.reject);
    await waitFor(() => expect(svc.rejectSecondLevelRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectSecondLevelRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      justify: 'ok',
    });
  });

  it('TF-13: Ciência sem bloco — Devolver manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: false, nextStatus: 4 }));
    click(actions.back);
    await waitFor(() => expect(svc.returnRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.returnRequestAuthorization.mock.calls[0][1]).toStrictEqual({ justify: 'ok' });
  });

  it('TF-13: Ciência sem bloco — Reprovar manda só { justify }', async () => {
    await renderScreen(detail({ first: false, requiresRatio: false, nextStatus: 4 }));
    click(actions.reject);
    await waitFor(() => expect(svc.rejectSecondLevelRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.rejectSecondLevelRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      justify: 'ok',
    });
  });

  it('Ciência sem bloco: Próxima Etapa 2/4 envia só status + justify', async () => {
    await renderScreen(detail({ first: false, requiresRatio: false, nextStatus: 4 }));
    click(actions.next);
    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.acknowledgeRequestAuthorization.mock.calls[0][1]).toStrictEqual({
      status: 4,
      justify: 'ok',
    });
  });

  it('TF-21: 422 de harvest_uuid em approve marca o campo Safra do bloco', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    svc.approveRequestAuthorization.mockRejectedValue(
      Object.assign(new Error('422'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { message: 'invalid', errors: { harvest_uuid: ['inválido'] } },
        },
      })
    );
    pickBoth();
    click(actions.next);
    await waitFor(() => expect(screen.getByTestId('harvest-error').textContent).toBe('inválido'));
    expect(screen.getByTestId('classification-error').textContent).toBe('');
  });

  it('TF-21: o erro do campo some quando ele é preenchido', async () => {
    await renderScreen(detail({ first: true, requiresRatio: true }));
    svc.approveRequestAuthorization.mockRejectedValue(
      Object.assign(new Error('422'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { message: 'invalid', errors: { classification: ['inválida'] } },
        },
      })
    );
    click(actions.next);
    await waitFor(() =>
      expect(screen.getByTestId('classification-error').textContent).toBe('inválida')
    );
    click('pick-classification');
    expect(screen.getByTestId('classification-error').textContent).toBe('');
  });

  it('TF-14: 422 da promoção automática avisa (toast warning) e marca Classificação, sem autoPromoteBlocked', async () => {
    await renderScreen(detail({ first: false, requiresRatio: true, nextStatus: 4 }));
    expect(typeof autoPromote.params.onUnprocessable).toBe('function');
    act(() => {
      autoPromote.params.onUnprocessable(
        Object.assign(new Error('422'), {
          isAxiosError: true,
          response: {
            status: 422,
            data: { message: 'x', errors: { classification: ['Classificação obrigatória.'] } },
          },
        })
      );
    });
    expect(
      toasts.create.mock.calls.some(([arg]) => arg?.type === 'warning' && !!arg?.description)
    ).toBe(true);
    expect(screen.getByTestId('classification-error').textContent).toBe(
      'Classificação obrigatória.'
    );
    expect((actions as Record<string, unknown>).autoPromoteBlocked).toBeUndefined();
  });
});
