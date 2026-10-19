// @vitest-environment jsdom
// Execução 081, T-081-FE-03 — MoneyInput: default de 2 casas inalterado e prop
// aditiva `fractionDigits` (4 casas no preço unitário do fornecedor).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { MoneyInput } from './MoneyInput';

afterEach(cleanup);

function setup(props: Partial<React.ComponentProps<typeof MoneyInput>> = {}) {
  const onValueChange = vi.fn();
  render(
    <ChakraProvider value={system}>
      <MoneyInput name="valor" label="Valor" onValueChange={onValueChange} {...props} />
    </ChakraProvider>
  );
  return { input: screen.getByRole('textbox') as HTMLInputElement, onValueChange };
}

describe('MoneyInput', () => {
  it('default: 2 casas, exibição e saída inalteradas', () => {
    const { input, onValueChange } = setup({ value: 1234.56 });
    expect(input.value).toBe('R$ 1.234,56');
    expect(input.placeholder).toBe('R$ 0,00');
    fireEvent.change(input, { target: { value: 'R$ 12.345,67' } });
    expect(onValueChange).toHaveBeenCalledWith(12345.67);
  });

  it('default: valor pequeno completa com zeros à esquerda', () => {
    expect(setup({ value: 0.05 }).input.value).toBe('R$ 0,05');
  });

  it('4 casas: exibe e devolve o valor com 4 casas', () => {
    const { input, onValueChange } = setup({ value: 12.3456, fractionDigits: 4 });
    expect(input.value).toBe('R$ 12,3456');
    expect(input.placeholder).toBe('R$ 0,0000');
    fireEvent.change(input, { target: { value: 'R$ 12,34567' } });
    expect(onValueChange).toHaveBeenCalledWith(123.4567);
  });

  it('4 casas: valor pequeno e milhar', () => {
    expect(setup({ value: 0.0005, fractionDigits: 4 }).input.value).toBe('R$ 0,0005');
    cleanup();
    expect(setup({ value: 1234.5678, fractionDigits: 4 }).input.value).toBe('R$ 1.234,5678');
  });
});
