import { useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GridColumnDndList } from './GridColumnDndList';

import {
  createDefaultLayout,
  GridColumnOption,
  GridLayout,
  layoutFromColumnState,
} from '../../hooks/useGridSettings';
import { system } from '../../theme';

import type { ColumnOrderState, VisibilityState } from '@tanstack/react-table';

const ROW_HEIGHT = 32;

const columnOptions: GridColumnOption[] = [
  {
    id: 'select',
    label: 'Selecionar',
    hideable: false,
    orderPolicy: 'fixed-start',
    dataColumn: false,
  },
  { id: 'name', label: 'Nome', hideable: false, orderPolicy: 'movable', dataColumn: true },
  { id: 'email', label: 'E-mail', hideable: true, orderPolicy: 'movable', dataColumn: true },
  { id: 'phone', label: 'Telefone', hideable: true, orderPolicy: 'movable', dataColumn: true },
  { id: 'actions', label: 'Ações', hideable: false, orderPolicy: 'fixed-end', dataColumn: false },
];

/**
 * Double do draft do hook: reaproveita as funções puras reais de conversão
 * (`layoutFromColumnState`) para reconciliar, mas guarda o estado num useState
 * comum — não é `useGridSettings`, então o componente segue testável sem
 * storage/jsdom no hook em si.
 * @return {JSX.Element} `GridColumnDndList` conectado ao double do draft.
 */
function DraftDouble({
  initialLayout,
  onLayoutChange,
}: {
  initialLayout: GridLayout;
  onLayoutChange?: (layout: GridLayout) => void;
}) {
  const [layout, setLayout] = useState(initialLayout);

  const setDraftColumnState = (
    columnOrder: ColumnOrderState,
    columnVisibility: VisibilityState
  ) => {
    const next = layoutFromColumnState(columnOrder, columnVisibility, columnOptions);
    setLayout(next);
    onLayoutChange?.(next);
  };

  return (
    <GridColumnDndList
      columnOptions={columnOptions}
      draftLayout={layout}
      setDraftColumnState={setDraftColumnState}
    />
  );
}

function renderList(onLayoutChange?: (layout: GridLayout) => void) {
  const initialLayout = createDefaultLayout(columnOptions);
  return render(
    <ChakraProvider value={system}>
      <DraftDouble initialLayout={initialLayout} onLayoutChange={onLayoutChange} />
    </ChakraProvider>
  );
}

function renderListWith(initialLayout: GridLayout, onLayoutChange?: (layout: GridLayout) => void) {
  return render(
    <ChakraProvider value={system}>
      <DraftDouble initialLayout={initialLayout} onLayoutChange={onLayoutChange} />
    </ChakraProvider>
  );
}

function visibleList() {
  return screen.getByRole('listbox', { name: 'Colunas visíveis' });
}

function hiddenList() {
  return screen.getByRole('listbox', { name: 'Colunas ocultas' });
}

// Ordem das opções na lista de visíveis — a "grid" propriamente dita.
function optionOrder() {
  return within(visibleList())
    .getAllByRole('option')
    .map((node) => node.getAttribute('aria-label'));
}

function hiddenOrder() {
  return within(hiddenList())
    .queryAllByRole('option')
    .map((node) => node.getAttribute('aria-label'));
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    // `this` é o elemento em que `getBoundingClientRect` foi chamado — é assim
    // que o jsdom/vitest expõem o alvo aqui, sem parâmetro explícito.
    // eslint-disable-next-line no-invalid-this
    const siblings = Array.from(this.parentElement?.children ?? []);
    // eslint-disable-next-line no-invalid-this
    const index = siblings.indexOf(this);
    return {
      top: index * ROW_HEIGHT,
      bottom: index * ROW_HEIGHT + ROW_HEIGHT,
      height: ROW_HEIGHT,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: index * ROW_HEIGHT,
      toJSON: () => ({}),
    } as DOMRect;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GridColumnDndList', () => {
  it('renders columns in the layout order with fixed anchors at both ends', () => {
    renderList();
    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'E-mail', 'Telefone', 'Ações']);
  });

  it('reordena colunas movíveis via teclado (grab, mover, soltar)', () => {
    renderList();
    const email = screen.getByRole('option', { name: 'E-mail' });
    email.focus();

    fireEvent.keyDown(email, { key: 'Enter' });
    expect(email.getAttribute('aria-grabbed')).toBe('true');

    fireEvent.keyDown(email, { key: 'ArrowDown' });
    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'Telefone', 'E-mail', 'Ações']);

    fireEvent.keyDown(email, { key: 'Enter' });
    expect(email.getAttribute('aria-grabbed')).toBe('false');
  });

  it('Home/End movem o item pego para os extremos da faixa movível', () => {
    renderList();
    const phone = screen.getByRole('option', { name: 'Telefone' });
    phone.focus();

    fireEvent.keyDown(phone, { key: 'Enter' });
    fireEvent.keyDown(phone, { key: 'Home' });

    expect(optionOrder()).toEqual(['Selecionar', 'Telefone', 'Nome', 'E-mail', 'Ações']);
  });

  it('Escape cancela o arrasto em andamento e restaura a ordem original', () => {
    renderList();
    const email = screen.getByRole('option', { name: 'E-mail' });
    email.focus();

    fireEvent.keyDown(email, { key: 'Enter' });
    fireEvent.keyDown(email, { key: 'ArrowDown' });
    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'Telefone', 'E-mail', 'Ações']);

    fireEvent.keyDown(email, { key: 'Escape' });
    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'E-mail', 'Telefone', 'Ações']);
    expect(email.getAttribute('aria-grabbed')).toBe('false');
  });

  it('reordena colunas movíveis via ponteiro (drag simulado por posição)', () => {
    renderList();
    const email = screen.getByRole('option', { name: 'E-mail' });

    fireEvent.pointerDown(email, { pointerId: 1, clientY: ROW_HEIGHT * 2 });
    fireEvent.pointerMove(email, { pointerId: 1, clientY: ROW_HEIGHT * 3 + ROW_HEIGHT / 2 });
    fireEvent.pointerUp(email, { pointerId: 1, clientY: ROW_HEIGHT * 3 + ROW_HEIGHT / 2 });

    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'Telefone', 'E-mail', 'Ações']);
  });

  it('bloqueia reordenação de colunas fixed-start/fixed-end pelo teclado', () => {
    renderList();
    const select = screen.getByRole('option', { name: 'Selecionar' });
    select.focus();

    fireEvent.keyDown(select, { key: 'Enter' });
    expect(select.getAttribute('aria-grabbed')).not.toBe('true');
    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'E-mail', 'Telefone', 'Ações']);
  });

  it('bloqueia reordenação de colunas fixed-start/fixed-end pelo ponteiro', () => {
    renderList();
    const actions = screen.getByRole('option', { name: 'Ações' });

    fireEvent.pointerDown(actions, { pointerId: 2, clientY: ROW_HEIGHT * 4 });
    fireEvent.pointerMove(actions, { pointerId: 2, clientY: 0 });
    fireEvent.pointerUp(actions, { pointerId: 2, clientY: 0 });

    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'E-mail', 'Telefone', 'Ações']);
  });

  it('coluna non-hideable mostra indicador "sempre visível" desabilitado, não toggle', () => {
    renderList();
    // Não-ocultável: indicador com o MESMO footprint do toggle (simetria), porém
    // desabilitado — sinaliza "sempre visível" sem permitir ocultar.
    const name = screen.getByRole('option', { name: 'Nome' });
    const nameBtn = within(name).getByRole('button', { name: /sempre visível/i });
    expect((nameBtn as HTMLButtonElement).disabled).toBe(true);

    // Ocultável: toggle interativo (habilitado).
    const email = screen.getByRole('option', { name: 'E-mail' });
    const emailBtn = within(email).getByRole('button', { name: /coluna E-mail/i });
    expect((emailBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('alterna visibilidade de coluna hideable via double do draft', () => {
    const layouts: GridLayout[] = [];
    renderList((layout) => {
      layouts.push(layout);
    });

    const email = screen.getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(email).getByRole('button'));

    const latestLayout = layouts[layouts.length - 1];
    expect(latestLayout.hiddenColumnIds).toContain('email');
    expect(latestLayout.visibleColumnIds).not.toContain('email');
  });

  it('anuncia a nova posição via região aria-live', () => {
    const { container } = renderList();
    const email = screen.getByRole('option', { name: 'E-mail' });
    email.focus();

    fireEvent.keyDown(email, { key: 'Enter' });
    fireEvent.keyDown(email, { key: 'ArrowDown' });

    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/E-mail/);
  });

  it('renderiza duas listas rotuladas; ocultas começa vazia com afordância', () => {
    renderList();
    expect(visibleList()).toBeTruthy();
    expect(hiddenList()).toBeTruthy();
    expect(hiddenOrder()).toEqual([]);
    expect(within(hiddenList()).getByText(/Arraste colunas para cá/i)).toBeTruthy();
  });

  it('ocultar via botão move a coluna de Visíveis para Ocultas', () => {
    renderList();

    const emailRow = within(visibleList()).getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(emailRow).getByRole('button', { name: 'Ocultar coluna E-mail' }));

    expect(optionOrder()).toEqual(['Selecionar', 'Nome', 'Telefone', 'Ações']);
    expect(hiddenOrder()).toEqual(['E-mail']);
    // Na lista de ocultas a afordância inverte: agora é "Exibir".
    const hiddenEmail = within(hiddenList()).getByRole('option', { name: 'E-mail' });
    expect(within(hiddenEmail).getByRole('button', { name: 'Exibir coluna E-mail' })).toBeTruthy();
  });

  it('exibir via botão devolve a coluna de Ocultas para Visíveis', () => {
    const initial = layoutFromColumnState(
      ['select', 'name', 'email', 'phone', 'actions'],
      { email: false, phone: true },
      columnOptions
    );
    renderListWith(initial);

    expect(hiddenOrder()).toEqual(['E-mail']);

    const hiddenEmail = within(hiddenList()).getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(hiddenEmail).getByRole('button', { name: 'Exibir coluna E-mail' }));

    expect(hiddenOrder()).toEqual([]);
    expect(optionOrder()).toContain('E-mail');
  });

  it('Delete oculta a coluna visível ocultável em foco (teclado)', () => {
    renderList();
    const email = within(visibleList()).getByRole('option', { name: 'E-mail' });
    email.focus();

    fireEvent.keyDown(email, { key: 'Delete' });

    expect(hiddenOrder()).toEqual(['E-mail']);
    expect(optionOrder()).not.toContain('E-mail');
  });

  it('Enter em coluna oculta a exibe de volta (teclado)', () => {
    const initial = layoutFromColumnState(
      ['select', 'name', 'email', 'phone', 'actions'],
      { email: false, phone: true },
      columnOptions
    );
    renderListWith(initial);

    const hiddenEmail = within(hiddenList()).getByRole('option', { name: 'E-mail' });
    hiddenEmail.focus();

    fireEvent.keyDown(hiddenEmail, { key: 'Enter' });

    expect(hiddenOrder()).toEqual([]);
    expect(optionOrder()).toContain('E-mail');
  });

  it('coluna não-ocultável não expõe botão de ocultar nem oculta por Delete', () => {
    renderList();
    const name = within(visibleList()).getByRole('option', { name: 'Nome' });

    expect(within(name).queryByRole('button', { name: 'Ocultar coluna Nome' })).toBeNull();

    name.focus();
    fireEvent.keyDown(name, { key: 'Delete' });
    expect(hiddenOrder()).toEqual([]);
    expect(optionOrder()).toContain('Nome');
  });
});
