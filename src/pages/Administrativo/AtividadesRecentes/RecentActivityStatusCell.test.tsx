// @vitest-environment jsdom
// UT-000690 / D-092-13 — renderização da célula Status.

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { RecentActivityStatusCell } from './RecentActivityStatusCell';

const languageGB: any = languagePtBr.BR;

function renderCell(item: any) {
  return render(
    <ChakraProvider value={system}>
      <RecentActivityStatusCell item={item} languageGB={languageGB} />
    </ChakraProvider>
  );
}

afterEach(cleanup);

describe('RecentActivityStatusCell', () => {
  it('domain com hex → badge com label e cor da API', () => {
    const { container } = renderCell({
      type: 'service_order',
      status: { source: 'domain', code: '3', label: 'Concluída', color: '#038F59', at: null },
    });
    expect(screen.getByText('Concluída')).toBeTruthy();
    expect(container.querySelector('[data-status-color="#038F59"]')).toBeTruthy();
  });

  it('domain com nome de cor → badge com label', () => {
    renderCell({
      type: 'pasture',
      status: { source: 'domain', code: 'O', label: 'Aberto', color: 'blue', at: null },
    });
    expect(screen.getByText('Aberto')).toBeTruthy();
  });

  it('audit → texto "Criado em ..."', () => {
    renderCell({
      type: 'weighing',
      status: {
        source: 'audit',
        code: 'created',
        label: 'Criado',
        color: null,
        at: '2026-10-05T15:30:00',
      },
    });
    expect(screen.getByText('Criado em 05/10/2026 15:30')).toBeTruthy();
  });

  it('null → "—"', () => {
    renderCell({ type: 'weighing', status: null });
    expect(screen.getByText('—')).toBeTruthy();
  });
});
