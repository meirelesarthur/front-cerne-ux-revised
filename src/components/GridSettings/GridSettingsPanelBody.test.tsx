import { useRef, useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GridSettingsPanelBody } from './GridSettingsPanelBody';

import {
  applyGridDraft,
  beginGridDraft,
  cancelGridDraft,
  createDefaultStoredSettingsV2,
  createDeterministicPresetId,
  createGridDraftPreset,
  createGridSettingsState,
  deleteGridDraftPreset,
  GridColumnOption,
  GridPresetError,
  GridSettingsState,
  isGridDraftDirty,
  layoutFromColumnState,
  MAX_GRID_PRESETS,
  reconcileStoredGridSettingsV2,
  renameGridDraftPreset,
  resetGridDraftLayout,
  selectGridDraftPreset,
  setGridDraftLayout,
  updateGridDraftPresetFromLayout,
} from '../../hooks/useGridSettings';
import { system } from '../../theme';

import type { GridPreset } from '../../hooks/useGridSettings';
import type { ColumnOrderState, VisibilityState } from '@tanstack/react-table';

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

function buildInitialState(seedPresets: GridPreset[] = []): GridSettingsState {
  const defaults = createDefaultStoredSettingsV2(columnOptions);
  const applied = reconcileStoredGridSettingsV2(
    { ...defaults, presets: seedPresets },
    columnOptions
  );
  return createGridSettingsState({ settings: applied, canPersist: false, source: 'default' }, null);
}

interface HarnessProps {
  seedPresets?: GridPreset[];
}

/**
 * Double do hook `useGridSettings`: opera sobre o MESMO estado transacional
 * puro (funções exportadas pelo hook), guardado num `useState` comum, sem
 * storage. O rascunho já nasce ABERTO (`beginGridDraft`) porque o
 * `GridSettingsPanelBody` é o conteúdo já aberto do painel — a abertura em si
 * (shell `FloatingPanel`) é validada na E2E. O espelho síncrono via `useRef`
 * reproduz o motivo do próprio hook: mutações de preset devolvem erro na hora.
 * @return {JSX.Element} O corpo do painel conectado ao double do hook.
 */
function Harness({ seedPresets }: HarnessProps) {
  const [state, setState] = useState<GridSettingsState>(() =>
    beginGridDraft(buildInitialState(seedPresets))
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const commit = (next: GridSettingsState) => {
    stateRef.current = next;
    setState(next);
  };

  const runPresetMutation = (
    mutation: (current: GridSettingsState) => {
      state: GridSettingsState;
      error: GridPresetError | null;
    }
  ): GridPresetError | null => {
    const result = mutation(stateRef.current);
    commit(result.state);
    return result.error;
  };

  const draft = state.draft;

  return (
    <ChakraProvider value={system}>
      <GridSettingsPanelBody
        gridSettings={{
          columnOptions,
          draftLayout: draft?.layout ?? null,
          draftPresetId: draft?.presetId ?? null,
          draftPresets: draft?.presets ?? null,
          isDraftDirty: draft !== null && isGridDraftDirty(stateRef.current),
          canCreatePreset: draft !== null && draft.presets.length < MAX_GRID_PRESETS,
          beginDraft: () => commit(beginGridDraft(stateRef.current)),
          cancelDraft: () => commit(cancelGridDraft(stateRef.current)),
          applyDraft: () => commit(applyGridDraft(stateRef.current, columnOptions)),
          setDraftColumnState: (columnOrder: ColumnOrderState, columnVisibility: VisibilityState) =>
            commit(
              setGridDraftLayout(
                stateRef.current,
                layoutFromColumnState(columnOrder, columnVisibility, columnOptions),
                columnOptions
              )
            ),
          resetDraft: () => commit(resetGridDraftLayout(stateRef.current, columnOptions)),
          selectPreset: (presetId) =>
            runPresetMutation((current) => selectGridDraftPreset(current, presetId, columnOptions)),
          createPreset: (name) =>
            runPresetMutation((current) =>
              createGridDraftPreset(current, name, createDeterministicPresetId)
            ),
          renamePreset: (presetId, name) =>
            runPresetMutation((current) => renameGridDraftPreset(current, presetId, name)),
          deletePreset: (presetId) =>
            runPresetMutation((current) => deleteGridDraftPreset(current, presetId)),
          updatePresetFromDraft: (presetId) =>
            runPresetMutation((current) => updateGridDraftPresetFromLayout(current, presetId)),
        }}
        onCancel={() => commit(cancelGridDraft(stateRef.current))}
        onApply={() => commit(applyGridDraft(stateRef.current, columnOptions))}
      />
      <div data-testid="applied-hidden">
        {state.applied.appliedLayout.hiddenColumnIds.join(',')}
      </div>
      <div data-testid="applied-revision">{state.applied.revision}</div>
    </ChakraProvider>
  );
}

function presetButton(name: string) {
  return screen.getByRole('button', { name: `Selecionar preset ${name}` });
}

function visibleList() {
  return screen.getByRole('listbox', { name: 'Colunas visíveis' });
}

function hiddenList() {
  return screen.getByRole('listbox', { name: 'Colunas ocultas' });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GridSettingsPanelBody', () => {
  it('renderiza as duas listas a partir do draftLayout', () => {
    render(<Harness />);
    // Layout padrão: todas as colunas visíveis; ocultas vazia.
    expect(within(visibleList()).getAllByRole('option')).toHaveLength(5);
    expect(within(hiddenList()).queryAllByRole('option')).toHaveLength(0);
  });

  it('ocultar via botão move para Ocultas no rascunho sem tocar o applied', () => {
    render(<Harness />);

    expect(screen.getByTestId('applied-hidden').textContent).toBe('');
    expect(screen.getByTestId('applied-revision').textContent).toBe('0');

    const emailRow = within(visibleList()).getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(emailRow).getByRole('button', { name: 'Ocultar coluna E-mail' }));

    // Rascunho mudou: E-mail migra para Ocultas com a afordância "Exibir"; o
    // applied global segue intocado.
    expect(within(visibleList()).queryByRole('option', { name: 'E-mail' })).toBeNull();
    const hiddenEmail = within(hiddenList()).getByRole('option', { name: 'E-mail' });
    expect(within(hiddenEmail).getByRole('button', { name: 'Exibir coluna E-mail' })).toBeTruthy();
    expect(screen.getByTestId('applied-hidden').textContent).toBe('');
    expect(screen.getByTestId('applied-revision').textContent).toBe('0');
  });

  it('seleciona um preset existente e reflete o layout no rascunho', () => {
    const compact: GridPreset = {
      id: 'preset-1',
      name: 'Compacta',
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: false },
        columnOptions
      ),
    };
    render(<Harness seedPresets={[compact]} />);

    fireEvent.click(presetButton('Compacta'));

    expect(presetButton('Compacta').getAttribute('aria-pressed')).toBe('true');
    // O preset oculta Telefone: ela deve aparecer na lista de Ocultas.
    const phoneRow = within(hiddenList()).getByRole('option', { name: 'Telefone' });
    expect(within(phoneRow).getByRole('button', { name: 'Exibir coluna Telefone' })).toBeTruthy();
  });

  it('cria um preset com nome válido', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar como novo preset' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome do novo preset' }), {
      target: { value: 'Minha visão' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar criação do preset' }));

    expect(presetButton('Minha visão')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('criar preset com nome vazio exibe erro do hook, sem engolir', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar como novo preset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar criação do preset' }));

    expect(screen.getByRole('alert').textContent).toBe('Informe um nome para o preset.');
  });

  it('criar preset com nome duplicado exibe erro do hook', () => {
    const existing: GridPreset = {
      id: 'preset-1',
      name: 'Padrão time',
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: true },
        columnOptions
      ),
    };
    render(<Harness seedPresets={[existing]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar como novo preset' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome do novo preset' }), {
      target: { value: 'padrão time' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar criação do preset' }));

    expect(screen.getByRole('alert').textContent).toBe('Já existe um preset com esse nome.');
  });

  it('criar preset além do teto de 8 desabilita o botão de salvar', () => {
    const seedPresets: GridPreset[] = Array.from({ length: MAX_GRID_PRESETS }, (_, index) => ({
      id: `preset-${index + 1}`,
      name: `Preset ${index + 1}`,
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: true },
        columnOptions
      ),
    }));
    render(<Harness seedPresets={seedPresets} />);

    expect(
      (screen.getByRole('button', { name: 'Salvar como novo preset' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('renomeia um preset e Escape cancela sem chamar o hook', () => {
    const preset: GridPreset = {
      id: 'preset-1',
      name: 'Original',
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: true },
        columnOptions
      ),
    };
    render(<Harness seedPresets={[preset]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Renomear preset Original' }));
    const renameInput = screen.getByRole('textbox', { name: 'Novo nome do preset Original' });
    fireEvent.change(renameInput, { target: { value: 'Descartado' } });
    fireEvent.keyDown(renameInput, { key: 'Escape' });

    expect(presetButton('Original')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Selecionar preset Descartado' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Renomear preset Original' }));
    const renameInputAgain = screen.getByRole('textbox', { name: 'Novo nome do preset Original' });
    fireEvent.change(renameInputAgain, { target: { value: 'Renomeado' } });
    fireEvent.keyDown(renameInputAgain, { key: 'Enter' });

    expect(presetButton('Renomeado')).toBeTruthy();
  });

  it('exclui o preset ativo e a seleção volta a nula', () => {
    const preset: GridPreset = {
      id: 'preset-1',
      name: 'Compacta',
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: false },
        columnOptions
      ),
    };
    render(<Harness seedPresets={[preset]} />);

    fireEvent.click(presetButton('Compacta'));
    expect(presetButton('Compacta').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir preset Compacta' }));

    expect(screen.queryByTestId('preset-row-preset-1')).toBeNull();
  });

  it('Cancelar descarta o rascunho sem tocar o applied', () => {
    render(<Harness />);

    const emailRow = within(visibleList()).getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(emailRow).getByRole('button', { name: 'Ocultar coluna E-mail' }));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Rascunho descartado (listas somem) e applied permanece intocado.
    expect(screen.queryByRole('listbox', { name: 'Colunas visíveis' })).toBeNull();
    expect(screen.getByTestId('applied-hidden').textContent).toBe('');
    expect(screen.getByTestId('applied-revision').textContent).toBe('0');
  });

  it('Aplicar persiste o rascunho no applied uma única vez', () => {
    render(<Harness />);

    const emailRow = within(visibleList()).getByRole('option', { name: 'E-mail' });
    fireEvent.click(within(emailRow).getByRole('button', { name: 'Ocultar coluna E-mail' }));

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(screen.getByTestId('applied-hidden').textContent).toBe('email');
    expect(screen.getByTestId('applied-revision').textContent).toBe('1');
  });

  it('todos os controles interativos expõem rótulo acessível não vazio', () => {
    const preset: GridPreset = {
      id: 'preset-1',
      name: 'Compacta',
      layout: layoutFromColumnState(
        ['select', 'name', 'email', 'phone', 'actions'],
        { email: true, phone: true },
        columnOptions
      ),
    };
    render(<Harness seedPresets={[preset]} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const accessibleName = button.getAttribute('aria-label') ?? button.textContent ?? '';
      expect(accessibleName.trim().length).toBeGreaterThan(0);
    });

    // A seleção de preset agora é por clique na linha (botão), não mais um select.
    expect(presetButton('Compacta').getAttribute('aria-label')).toBe('Selecionar preset Compacta');
  });
});
