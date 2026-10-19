import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GridSettingsFloatingPanel } from './GridSettingsFloatingPanel';

import {
  beginGridDraft,
  createDefaultStoredSettingsV2,
  createGridSettingsState,
  reconcileStoredGridSettingsV2,
} from '../../hooks/useGridSettings';
import { system } from '../../theme';

import type { GridSettingsFloatingPanelProps } from './GridSettingsFloatingPanel';
import type { GridColumnOption } from '../../hooks/useGridSettings';

/**
 * Testes do SHELL do painel flutuante. O primitivo `FloatingPanel` (zag-js)
 * não processa transições de estado no jsdom — só respeita o estado inicial de
 * montagem —, então aqui o painel é montado com `open` ESTÁTICO. A interação
 * real do gatilho/arraste/Escape é validada na E2E autenticada. Aqui provamos:
 * o contrato controlado, o `beginDraft` na abertura e o fechamento por
 * `onOpenChange` ao Cancelar/Aplicar.
 */
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
  { id: 'actions', label: 'Ações', hideable: false, orderPolicy: 'fixed-end', dataColumn: false },
];

function begunDraft() {
  const applied = reconcileStoredGridSettingsV2(
    createDefaultStoredSettingsV2(columnOptions),
    columnOptions
  );
  const state = beginGridDraft(
    createGridSettingsState({ settings: applied, canPersist: false, source: 'default' }, null)
  );
  return state.draft!;
}

function buildGridSettings(
  overrides: Partial<GridSettingsFloatingPanelProps['gridSettings']> = {}
): GridSettingsFloatingPanelProps['gridSettings'] {
  const draft = begunDraft();
  const noop = () => null;
  return {
    columnOptions,
    draftLayout: draft.layout,
    draftPresetId: draft.presetId,
    draftPresets: draft.presets,
    isDraftDirty: false,
    canCreatePreset: true,
    beginDraft: vi.fn(),
    cancelDraft: vi.fn(),
    applyDraft: vi.fn(),
    setDraftColumnState: noop,
    resetDraft: noop,
    selectPreset: () => null,
    createPreset: () => null,
    renamePreset: () => null,
    deletePreset: () => null,
    updatePresetFromDraft: () => null,
    ...overrides,
  };
}

function renderPanel(
  props: Partial<GridSettingsFloatingPanelProps> & {
    gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  }
) {
  return render(
    <ChakraProvider value={system}>
      <GridSettingsFloatingPanel triggerLabel="Personalizar colunas" {...props} />
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GridSettingsFloatingPanel (shell)', () => {
  it('fechado: renderiza só o gatilho, sem conteúdo do painel', () => {
    renderPanel({ gridSettings: buildGridSettings(), open: false, onOpenChange: () => {} });

    expect(screen.getByRole('button', { name: 'Personalizar colunas' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('listbox', { name: 'Colunas visíveis' })).toBeNull();
  });

  it('aberto: chama beginDraft e renderiza o conteúdo (dialog + colunas)', () => {
    const gridSettings = buildGridSettings();
    renderPanel({ gridSettings, open: true, onOpenChange: () => {} });

    expect(gridSettings.beginDraft).toHaveBeenCalledTimes(1);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('listbox', { name: 'Colunas visíveis' })).toBeTruthy();
    expect(within(dialog).getAllByRole('option', { hidden: true }).length).toBeGreaterThanOrEqual(
      4
    );
  });

  it('Cancelar chama cancelDraft e pede fechamento via onOpenChange(false)', () => {
    const gridSettings = buildGridSettings();
    const onOpenChange = vi.fn();
    renderPanel({ gridSettings, open: true, onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(gridSettings.cancelDraft).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Aplicar chama applyDraft e pede fechamento via onOpenChange(false)', () => {
    const gridSettings = buildGridSettings();
    const onOpenChange = vi.fn();
    renderPanel({ gridSettings, open: true, onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(gridSettings.applyDraft).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
