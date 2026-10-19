// @vitest-environment jsdom
// Execução 081, T-081-FE-01 — `Table.getRowHighlight` é ADITIVA: sem a prop a
// linha mantém a zebra de sempre; com a prop, só a linha destacada muda de
// estilo (as classes geradas pelo Chakra divergem só nela).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { TableProvider } from '@/contexts/TableContext';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: {
      defaltStrings: {
        emptyData: 'Sem dados',
        showing: 'Mostrando',
        of: 'de',
        linePerPage: 'Linhas',
        registerNoSeve: '-',
      },
      common: { errorLog: { defaultRetryLabel: 'Tentar novamente' } },
    },
  }),
}));

import { Table } from './Table';

const columns = [{ accessorKey: 'name', header: 'Nome' }];
const data = [
  { uuid: '1', type: 'U', name: 'linha-u' },
  { uuid: '2', type: 'P', name: 'linha-p' },
  { uuid: '3', type: 'U', name: 'linha-u-2' },
  { uuid: '4', type: 'P', name: 'linha-p-2' },
];

function cellClassOf(container: HTMLElement, text: string): string {
  const cell = Array.from(container.querySelectorAll('td')).find((td) =>
    td.textContent?.includes(text)
  );
  return cell?.className ?? '';
}

function renderTable(withHighlight: boolean) {
  return render(
    <ChakraProvider value={system}>
      <TableProvider data={data} columns={columns as any}>
        <Table
          getRowHighlight={
            withHighlight
              ? (row: { type: string }) => (row.type === 'U' ? 'supplyEmergencyRowBg' : undefined)
              : undefined
          }
        />
      </TableProvider>
    </ChakraProvider>
  );
}

describe('Table.getRowHighlight — execução 081, T-081-FE-01', () => {
  afterEach(() => cleanup());

  it('com a prop, só as linhas destacadas mudam de estilo; as demais ficam idênticas', () => {
    const without = renderTable(false);
    const baseline = ['linha-u', 'linha-p', 'linha-u-2', 'linha-p-2'].map((t) =>
      cellClassOf(without.container, t)
    );
    cleanup();

    const withProp = renderTable(true);
    const highlighted = ['linha-u', 'linha-p', 'linha-u-2', 'linha-p-2'].map((t) =>
      cellClassOf(withProp.container, t)
    );

    expect(highlighted[0]).not.toBe(baseline[0]);
    expect(highlighted[2]).not.toBe(baseline[2]);
    expect(highlighted[1]).toBe(baseline[1]);
    expect(highlighted[3]).toBe(baseline[3]);
  });

  it('sem a prop, as linhas do tipo U não recebem destaque algum (mesmo estilo que as demais de mesma paridade)', () => {
    const { container } = renderTable(false);
    // linhas 0 e 2 têm a mesma paridade (zebra) e, sem destaque, o mesmo estilo
    expect(cellClassOf(container, 'linha-u')).toBe(cellClassOf(container, 'linha-u-2'));
  });
});
