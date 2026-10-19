// @vitest-environment jsdom
// UT-000776 / T-776-FE-03 — staging de CIOT: recusa código ≠ 12 dígitos, dedupe preservado,
// erro do array aparece acima da lista, 422 `ciots` é extraído.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

import { extractCiotFieldError } from './mdfe-ciot-errors';
import { CiotFieldArray } from './MdfeTabTransporte';

const lang = getLanguageRouter(languageContextTypes.BR);
const text = lang.mdfes.mdfe.ciot;

function Harness({ withError }: { withError?: boolean }) {
  const { control, setError } = useForm<any>({ defaultValues: { ciots: [] } });
  return (
    <ChakraProvider value={system}>
      {withError && (
        <button
          type="button"
          onClick={() => setError('ciots', { type: 'x', message: 'CIOT obrigatório' })}
        >
          set-error
        </button>
      )}
      <CiotFieldArray control={control} />
    </ChakraProvider>
  );
}

function fill(codigo: string, doc = '123.456.789-01') {
  const codeInput = document.querySelector('input[name="ciot-staging-codigo"]') as HTMLInputElement;
  const docInput = document.querySelector(
    'input[name="ciot-staging-cpf-cnpj"]'
  ) as HTMLInputElement;
  fireEvent.change(codeInput, { target: { value: codigo } });
  fireEvent.change(docInput, { target: { value: doc } });
}

afterEach(() => cleanup());

describe('CiotFieldArray staging', () => {
  it('recusa código com 11 dígitos e não adiciona', () => {
    render(<Harness />);
    fill('12345678901');
    fireEvent.click(screen.getByText(text.addButton));
    expect(screen.getByText(text.codeLengthError)).toBeTruthy();
    expect(screen.getByText(text.emptyText)).toBeTruthy();
  });

  it('aceita 12 dígitos e preserva o dedupe por código', () => {
    render(<Harness />);
    fill('123456789012');
    fireEvent.click(screen.getByText(text.addButton));
    expect(screen.getByText(/123456789012 —/)).toBeTruthy();
    fill('123456789012', '98.765.432/0001-10');
    fireEvent.click(screen.getByText(text.addButton));
    expect(screen.getAllByText(/123456789012 —/)).toHaveLength(1);
  });

  it('filtra não-dígitos e limita a 12 no campo do código', () => {
    render(<Harness />);
    fill('12ab3456789012345');
    const codeInput = document.querySelector(
      'input[name="ciot-staging-codigo"]'
    ) as HTMLInputElement;
    expect(codeInput.value).toMatch(/^\d{0,12}$/);
  });

  it('mostra o erro do array acima da lista', async () => {
    render(<Harness withError />);
    fireEvent.click(screen.getByText('set-error'));
    await waitFor(() => expect(screen.getByText('CIOT obrigatório')).toBeTruthy());
  });
});

describe('extractCiotFieldError', () => {
  function make422(data: unknown): AxiosError {
    return new AxiosError('x', 'ERR', {} as InternalAxiosRequestConfig, {}, {
      status: 422,
      data,
    } as AxiosResponse);
  }

  it('lê `ciots` e `ciots.N.codigo` do 422; ignora outros erros', () => {
    expect(
      extractCiotFieldError(make422({ errors: { ciots: ['Informe ao menos um CIOT'] } }))
    ).toBe('Informe ao menos um CIOT');
    expect(
      extractCiotFieldError(
        make422({ errors: { 'ciots.0.codigo': ['O CIOT deve ter 12 digitos'] } })
      )
    ).toBe('O CIOT deve ter 12 digitos');
    expect(extractCiotFieldError(make422({ errors: { condutor_cpf: ['x'] } }))).toBeUndefined();
    expect(extractCiotFieldError(new Error('boom'))).toBeUndefined();
  });
});
