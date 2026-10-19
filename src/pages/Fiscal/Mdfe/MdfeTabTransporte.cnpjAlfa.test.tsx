// @vitest-environment jsdom
// UT-000776 / T-776-FE-07 — MDF-e: CIOT staging aceita CPF/CNPJ alfanumérico (letras mantidas,
// caixa alta, máscara CNPJ) e o item adicionado preserva as letras.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

import { CiotFieldArray } from './MdfeTabTransporte';

const text = getLanguageRouter(languageContextTypes.BR).mdfes.mdfe.ciot;

function Harness() {
  const { control } = useForm<any>({ defaultValues: { ciots: [] } });
  return (
    <ChakraProvider value={system}>
      <CiotFieldArray control={control} />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('CiotFieldArray CNPJ alfanumérico', () => {
  it('mantém as letras no campo e no item adicionado', () => {
    render(<Harness />);
    const code = document.querySelector('input[name="ciot-staging-codigo"]') as HTMLInputElement;
    const doc = document.querySelector('input[name="ciot-staging-cpf-cnpj"]') as HTMLInputElement;
    fireEvent.change(code, { target: { value: '123456789012' } });
    fireEvent.change(doc, { target: { value: '12abc345000188' } });
    expect(doc.value).toBe('12.ABC.345/0001-88');
    fireEvent.click(screen.getByText(text.addButton));
    expect(screen.getByText(/123456789012 —/).textContent).toContain('12.ABC.345/0001-88');
  });
});
