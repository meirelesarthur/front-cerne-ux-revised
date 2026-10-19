// @vitest-environment jsdom
// UT-000776 / T-776-FE-07 — Config `resp_cnpj`: MaskedInput kind="cnpj" aceita letras (CNPJ
// alfanumérico), exibe em caixa alta com máscara e o schema valida o DV alfanumérico.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Controller, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import { system } from '@/theme';

import { MaskedInput } from '@/components/Form/MaskedInput';

import { isValidCpfCnpj } from '@/utils/validateCpfCnpj';

let last = '';

function Harness() {
  const { control } = useForm<{ resp_cnpj: string }>({ defaultValues: { resp_cnpj: '' } });
  return (
    <ChakraProvider value={system}>
      <Controller
        name="resp_cnpj"
        control={control}
        render={({ field }) => (
          <MaskedInput
            kind="cnpj"
            label="CNPJ"
            name={field.name}
            value={field.value ?? ''}
            onChange={(event) => {
              last = event.target.value;
              field.onChange(event);
            }}
            onBlur={field.onBlur}
          />
        )}
      />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('Config resp_cnpj alfanumérico', () => {
  it('aceita letras, formata em caixa alta e o DV alfanumérico é válido', () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input[name="resp_cnpj"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12abc345000188' } });
    expect(input.value).toBe('12.ABC.345/0001-88');
    expect(last).toBe('12.ABC.345/0001-88');
    expect(isValidCpfCnpj(last)).toBe(true);
  });
});
