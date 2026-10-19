// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { MovementGeneratedObligationDraft } from '@/@types/v2/Movements';

const navigateMock = vi.fn();
const canMock = vi.fn();
const toasterCreate = vi.fn();

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: canMock }) }));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: languagePtBr.BR }),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: { create: (a: any) => toasterCreate(a) } }));

import { useObligationDraftRedirect } from './useObligationDraftRedirect';

const MOVEMENT_UUID = '019f62a6-1111-7023-8abc-0123456789ab';

function draft(type: 'expense' | 'income'): MovementGeneratedObligationDraft {
  return {
    type,
    note: 'n',
    amount: '10.00',
    provider_uuid: null,
    client_uuid: null,
    proprietary_uuid: null,
    interest: '0.00',
    dt_emission: '2026-10-15',
    movement_uuid: MOVEMENT_UUID,
  };
}

beforeEach(() => {
  navigateMock.mockReset();
  canMock.mockReset();
  toasterCreate.mockReset();
  window.sessionStorage.clear();
});

describe('useObligationDraftRedirect', () => {
  it('sem rascunho: devolve false e não navega', () => {
    canMock.mockReturnValue(true);
    const { result } = renderHook(() => useObligationDraftRedirect());
    expect(result.current.redirectIfDraft({}, { replace: true })).toBe(false);
    expect(result.current.redirectIfDraft(null, { replace: true })).toBe(false);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toasterCreate).not.toHaveBeenCalled();
  });

  it('com rascunho e permissão (tela principal): persiste, toast e navigate com replace + state', () => {
    canMock.mockReturnValue(true);
    const { result } = renderHook(() => useObligationDraftRedirect());
    const d = draft('expense');
    expect(
      result.current.redirectIfDraft({ generated_obligation_draft: d }, { replace: true })
    ).toBe(true);
    expect(canMock).toHaveBeenCalledWith('expenses_create');
    expect(
      window.sessionStorage.getItem(`gb:movement-obligation-draft:${MOVEMENT_UUID}`)
    ).not.toBeNull();
    expect(toasterCreate).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith(
      { pathname: '/financeiro/pagar/novo', search: `?fromMovement=${MOVEMENT_UUID}` },
      { replace: true, state: { movementObligationDraft: d } }
    );
  });

  it('modo OFX: navigate SEM replace (push)', () => {
    canMock.mockReturnValue(true);
    const { result } = renderHook(() => useObligationDraftRedirect());
    result.current.redirectIfDraft(
      { generated_obligation_draft: draft('income') },
      { replace: false }
    );
    expect(canMock).toHaveBeenCalledWith('incomes_create');
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/financeiro/receber/novo' }),
      expect.objectContaining({ replace: false })
    );
  });

  it('com rascunho e SEM permissão: toast de aviso, nenhuma navegação, nada persistido', () => {
    canMock.mockReturnValue(false);
    const { result } = renderHook(() => useObligationDraftRedirect());
    expect(
      result.current.redirectIfDraft(
        { generated_obligation_draft: draft('expense') },
        { replace: true }
      )
    ).toBe(false);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toasterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: languagePtBr.BR.movements.movement.form.obligationDraftGenerated.noPermission,
      })
    );
    expect(window.sessionStorage.length).toBe(0);
  });
});
