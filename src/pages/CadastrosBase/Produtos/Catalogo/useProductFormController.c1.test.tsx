// @vitest-environment jsdom
// FE-C1-04 — payload do Produto: C1 oculto pelo CST sai null (nunca 0), FCP 0 -> null, 422 por
// campo vira erro do campo. `tryPersistProduct` real via `useRequest` capturado.
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const captured = vi.hoisted(() => ({ persist: null as null | ((d: any) => Promise<unknown>) }));
const createMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: (o: { asyncFunction: (d: any) => Promise<unknown> }) => {
    captured.persist = o.asyncFunction;
    return { mutateAsync: o.asyncFunction, isPending: false };
  },
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('./useProducts', () => ({
  useProductForm: () => ({ data: undefined, isLoading: false, isFetching: false }),
}));
vi.mock('@/services/v2/Products/product-service', () => ({
  createProduct: (...a: unknown[]) => createMock(...a),
  updateProduct: vi.fn(),
}));

import { useProductFormController } from './useProductFormController';

const base = {
  description: 'Milho',
  measurement_uuid: { label: 'KG', value: 'm-1' },
  group_uuid: { label: 'G', value: 'g-1' },
  category_uuid: { label: 'C', value: 'c-1' },
};

function mount() {
  return renderHook(() => useProductFormController({ isEditing: false, canSave: true }), {
    wrapper: MemoryRouter,
  });
}

afterEach(() => {
  createMock.mockReset();
  captured.persist = null;
});

describe('useProductFormController — payload C1 (FE-C1-04)', () => {
  it('CST 20: envia mot_des_icms/perc_fcp; perc_dif null', async () => {
    createMock.mockResolvedValue({ data: {} });
    mount();
    await captured.persist!({
      ...base,
      cst_csosn: '20',
      mot_des_icms: 3,
      perc_dif: 40,
      perc_fcp: 2,
    });
    const payload = createMock.mock.calls[0][0];
    expect([payload.mot_des_icms, payload.perc_dif, payload.perc_fcp]).toEqual([3, null, 2]);
  });

  it('vazio nao vira 0: sem CST, os 3 saem null; FCP 0 -> null', async () => {
    createMock.mockResolvedValue({ data: {} });
    mount();
    await captured.persist!({
      ...base,
      cst_csosn: null,
      mot_des_icms: 3,
      perc_dif: 1,
      perc_fcp: 0,
    });
    await captured.persist!({ ...base, cst_csosn: '00', perc_fcp: 0 });
    for (const [payload] of createMock.mock.calls) {
      expect([payload.mot_des_icms, payload.perc_dif, payload.perc_fcp]).toEqual([
        null,
        null,
        null,
      ]);
    }
  });

  it('422 por campo vira erro do campo e propaga o erro (toast generico preservado)', async () => {
    const err = new AxiosError('422');
    (err as any).response = {
      status: 422,
      data: { errors: { mot_des_icms: ['Motivo invalido para o CST informado.'] } },
    };
    createMock.mockRejectedValue(err);
    const { result } = mount();
    await act(async () => {
      await expect(captured.persist!({ ...base, cst_csosn: '20', mot_des_icms: 9 })).rejects.toBe(
        err
      );
    });
    await waitFor(() =>
      expect(result.current.errors.mot_des_icms?.message).toBe(
        'Motivo invalido para o CST informado.'
      )
    );
  });
});
