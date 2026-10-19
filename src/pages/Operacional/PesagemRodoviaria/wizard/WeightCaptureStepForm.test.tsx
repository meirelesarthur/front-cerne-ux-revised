// @vitest-environment jsdom
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

vi.mock('../hooks/useModuleWeighingScale', () => ({
  useModuleWeighingScale: () => ({
    status: 'disconnected',
    captureWeight: vi.fn(),
    markManualInput: vi.fn(),
  }),
}));

import { WeightCaptureStepForm } from './WeightCaptureStepForm';

function renderForm(initialWeight: number | null, otherWeight: number | null) {
  return render(
    <ChakraProvider value={system}>
      <WeightCaptureStepForm
        formId="f"
        fieldLabel="Tara"
        isGrossField={false}
        otherWeight={otherWeight}
        initialWeight={initialWeight}
        onSubmitWeight={vi.fn()}
        isSubmitting={false}
      />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('WeightCaptureStepForm', () => {
  it('pré-preenche o campo com a tara do equipamento e formata o preview em pt-BR', () => {
    renderForm(15000, 45000);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('15.000,00');
    expect(screen.getByText(/30\.000,00 kg/)).toBeTruthy();
  });

  it('mantém o campo vazio sem valor inicial', () => {
    renderForm(null, null);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
