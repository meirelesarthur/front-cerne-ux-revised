// @vitest-environment jsdom
// Execução 081, T-081-FE-05 — histórico da Solicitação, em linha do tempo
// (25/11): um evento por movimento, do mais recente para o mais antigo, com a
// situação, a data, o Responsável (`movement.user`), o Tempo Gasto
// (`elapsed_label`, calculado pela API: "< 1h", "5h", "1d 6h"; o front não
// calcula) e a justificativa.
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

function isBefore(first: Node, second: Node) {
  return !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

afterEach(cleanup);

describe('RequestMovementHistory', () => {
  it('mostra os eventos do mais recente para o mais antigo', () => {
    renderHistory([
      movement({ uuid: 'm-1', status_label: 'Solicitação', created_at: '2026-09-20T10:00:00Z' }),
      movement({
        uuid: 'm-2',
        status: 2,
        status_label: 'Cotação em Andamento',
        created_at: '2026-09-22T10:00:00Z',
      }),
    ]);
    expect(
      isBefore(screen.getByText('Cotação em Andamento'), screen.getByText('Solicitação'))
    ).toBe(true);
  });

  it('exibe Responsável, Tempo Gasto (elapsed_label) e justificativa', () => {
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
    expect(screen.getByText(/1d 6h/)).toBeTruthy();
    expect(screen.getByText('João Lima')).toBeTruthy();
    expect(screen.getByText(/< 1h/)).toBeTruthy();
    expect(screen.getByText('Solicitação refeita.')).toBeTruthy();
  });

  it('sem user mostra "—" e sem elapsed_label omite o tempo, nunca quebra', () => {
    renderHistory([movement({ user: undefined, elapsed_label: undefined })]);
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByText(/Tempo Gasto/)).toBeNull();
  });

  it('lista vazia mostra o estado vazio', () => {
    renderHistory([]);
    expect(screen.getByText('Nenhum trâmite registrado')).toBeTruthy();
  });
});
