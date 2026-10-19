// @vitest-environment jsdom
// Hidratação do MDF-e: CIOT vindo cru da API é formatado (mesma função usada em CreateOrUpdateMdfe).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';
import { formatCpfCnpjProgressive } from '@/utils/masks/document';

import { languageContextTypes } from '@/constants/languages';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

import { CiotFieldArray } from './MdfeTabTransporte';

const apiCiots = [
  { codigo: '123456789012', cpf_cnpj: '60806083000132' },
  { codigo: '210987654321', cpf_cnpj: '12ABC34501DE35' },
];

function Harness() {
  const { control } = useForm<any>({
    defaultValues: {
      ciots: apiCiots.map((i) => ({
        codigo: i.codigo,
        cpf_cnpj: formatCpfCnpjProgressive(i.cpf_cnpj),
      })),
    },
  });
  return (
    <ChakraProvider value={system}>
      <CiotFieldArray control={control} />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('MDF-e hidratação formatada', () => {
  it('exibe CIOT com CNPJ numérico e alfanumérico formatados', () => {
    render(<Harness />);
    expect(screen.getByText(/123456789012 —/).textContent).toContain('60.806.083/0001-32');
    expect(screen.getByText(/210987654321 —/).textContent).toContain('12.ABC.345/01DE-35');
  });
});
