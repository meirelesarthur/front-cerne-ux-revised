// @vitest-environment jsdom
// src/hooks/useLanguageSwitcher.test.tsx
// Execução 071, TASK-071-FE-01 (FE01-T05) — prova AD-FE-06: a troca local
// (`updateLanguageGB`) é síncrona e SEMPRE roda primeiro; a persistência
// (`PUT /me/preferences`) é best-effort — falha NUNCA reverte a troca local,
// só avisa (toaster warning) e loga.

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const updateLanguageGB = vi.fn();
const updatePreferences = vi.fn();
const toasterCreate = vi.fn();

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: {
      common: {
        accountMenu: {
          languagePersistWarning:
            'Idioma alterado neste dispositivo, mas não foi possível salvá-lo na sua conta.',
        },
      },
    },
    updateLanguageGB,
  }),
}));

vi.mock('@/services/v2/Me/me-service', () => ({
  updatePreferences: (...args: any[]) => updatePreferences(...args),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => toasterCreate(...args),
  },
}));

import { useLanguageSwitcher } from './useLanguageSwitcher';

describe('useLanguageSwitcher — FE01-T05', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['BR', 'pt-BR'],
    ['US', 'en'],
    ['ES', 'es'],
  ] as const)(
    'mapeia %s → %s em updatePreferences, e updateLanguageGB roda antes do PUT',
    async (uiCode, apiCode) => {
      const { result } = renderHook(() => useLanguageSwitcher());

      const callOrder: string[] = [];
      updateLanguageGB.mockImplementationOnce(() => callOrder.push('local'));
      updatePreferences.mockImplementationOnce(async (...args) => {
        callOrder.push('put');
        return { data: { success: true, data: args[0] } };
      });

      act(() => {
        result.current.handleLanguageChange(uiCode);
      });

      expect(updateLanguageGB).toHaveBeenCalledWith(uiCode);
      expect(updatePreferences).toHaveBeenCalledWith({ lang: apiCode });

      await waitFor(() => expect(callOrder).toEqual(['local', 'put']));
    }
  );

  it('PUT rejeitado NÃO reverte a troca local e avisa via toaster warning', async () => {
    updatePreferences.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useLanguageSwitcher());

    act(() => {
      result.current.handleLanguageChange('US');
    });

    expect(updateLanguageGB).toHaveBeenCalledWith('US');
    expect(updateLanguageGB).toHaveBeenCalledTimes(1); // nunca chamado 2x (sem reversão)

    await waitFor(() => {
      expect(toasterCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          description:
            'Idioma alterado neste dispositivo, mas não foi possível salvá-lo na sua conta.',
        })
      );
    });
  });
});
