// @vitest-environment jsdom
// D5 (DEF02-02B) — campo de IE do cliente: dígitos OU a palavra ISENTO.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { stringMaskSource } from '@/utils/masks/maskSource';

import { isValidStateRegistration } from '@/validations/schemas/CadastrosBase/client-schema';

import { MaskedInput } from './MaskedInput';

afterEach(cleanup);

function setup(kind: 'digitsOrIsento' | 'digits') {
  const onChange = vi.fn();
  render(
    <ChakraProvider value={system}>
      <MaskedInput kind={kind} name="ie" label="IE" onChange={onChange} />
    </ChakraProvider>
  );
  return { input: screen.getByRole('textbox') as HTMLInputElement, onChange };
}

describe('MaskedInput kind="digitsOrIsento"', () => {
  it('digitar "isento" resulta em "ISENTO" e passa no schema', () => {
    const { input } = setup('digitsOrIsento');
    fireEvent.change(input, { target: { value: 'isento' } });
    expect(input.value).toBe('ISENTO');
    expect(isValidStateRegistration(input.value)).toBe(true);
  });

  it('dígitos continuam sem pontuação e passam no schema', () => {
    const { input } = setup('digitsOrIsento');
    fireEvent.change(input, { target: { value: '12.345-6' } });
    expect(input.value).toBe('123456');
    expect(isValidStateRegistration(input.value)).toBe(true);
  });

  it('digitação progressiva de ISENTO é aceita', () => {
    const f = stringMaskSource.digitsOrIsento.format;
    expect(['i', 'is', 'ise', 'isen', 'isent', 'isento'].map(f)).toEqual([
      'I',
      'IS',
      'ISE',
      'ISEN',
      'ISENT',
      'ISENTO',
    ]);
  });

  it('letras além de ISENTO são filtradas', () => {
    const f = stringMaskSource.digitsOrIsento.format;
    expect(f('abc')).toBe('');
    expect(f('ISX')).toBe('IS');
    expect(f('ISENTOS')).toBe('ISENTO');
    expect(f('12ab3')).toBe('123');
    expect(f('ISEN1')).toBe('ISEN');
  });

  it('kind="digits" permanece só-dígitos (inalterado)', () => {
    const { input } = setup('digits');
    fireEvent.change(input, { target: { value: 'isento12' } });
    expect(input.value).toBe('12');
  });
});
