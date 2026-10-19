// @vitest-environment jsdom
// Execução 081, T-081-FE-05 — histórico da Solicitação: colunas do legado
// (Data, Responsável, Status, Tempo Gasto, Descrição/Justificativa), com o
// Responsável vindo de `movement.user` e o Tempo Gasto de `elapsed_label`
// (calculado pela API: "< 1h", "5h", "1d 6h"; o front não calcula).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageRequestPurchases } from '@/constants/languages/languagePtBr/languageRequestPurchases';

import type { RequestMovementRow } from '@/@types/v2/RequestPurchases';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: { requestPurchases: languageRequestPurchases },
  }),
}));

import { RequestMovementHistory } from './RequestMovementHistory';

function movement(partial: Partial<RequestMovementRow>): RequestMovementRow {
  return {
    uuid: 'm-1',
    status: 1,
    status_label: 'Solicitação',
    justify: null,
    created_at: '2026-09-20T10:00:00Z',
    ...partial,
  };
}

function renderHistory(movements: RequestMovementRow[]) {
  return render(
    <ChakraProvider value={system}>
      <RequestMovementHistory movements={movements} />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('RequestMovementHistory', () => {
  it('mostra as colunas do legado, na ordem', () => {
    renderHistory([movement({})]);
    const headers = ['Data', 'Responsável', 'Status', 'Tempo Gasto', 'Descrição/Justificativa'];
    const nodes = headers.map((header) => screen.getByText(header));
    for (let index = 1; index < nodes.length; index += 1) {
      expect(
        nodes[index - 1].compareDocumentPosition(nodes[index]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it('exibe Responsável e Tempo Gasto vindos da API (elapsed_label)', () => {
    renderHistory([
      movement({
        uuid: 'm-1',
        user: { uuid: 'u-1', name: 'Maria Souza' },
        elapsed_label: '1d 6h',
        justify: 'Solicitação refeita.',
      }),
      movement({
        uuid: 'm-2',
        status: 2,
        status_label: 'Cotação em Andamento',
        user: { uuid: 'u-2', name: 'João Lima' },
        elapsed_label: '< 1h',
      }),
    ]);

    expect(screen.getByText('Maria Souza')).toBeTruthy();
    expect(screen.getByText('1d 6h')).toBeTruthy();
    expect(screen.getByText('João Lima')).toBeTruthy();
    expect(screen.getByText('< 1h')).toBeTruthy();
    expect(screen.getByText('Solicitação refeita.')).toBeTruthy();
  });

  it('sem user/elapsed_label mostra "—", nunca quebra', () => {
    renderHistory([movement({ user: undefined, elapsed_label: undefined })]);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('lista vazia mostra o estado vazio', () => {
    renderHistory([]);
    expect(screen.getByText('Nenhum trâmite registrado')).toBeTruthy();
  });
});
