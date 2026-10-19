// @vitest-environment jsdom
// UT-000715 / T-FE-715-01 — condição de exibição da ação "Emitir NFe":
// status==5 && type==vendaSaida && nfe_uuid==null && permissão de edição.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';

import type { ModuleWeighingStatus } from '@/@types/v2/ModuleWeighing/module-weighing';

import {
  ModuleWeighingActionsMenu,
  type ModuleWeighingActionsMenuProps,
} from './ModuleWeighingActionsMenu';

const ISSUE_NFE_LABEL = 'Emitir NFe';

function buildProps(
  overrides: Partial<ModuleWeighingActionsMenuProps> = {}
): ModuleWeighingActionsMenuProps {
  return {
    status: 5 as ModuleWeighingStatus,
    type: moduleWeighingType.vendaSaida,
    nfeUuid: null,
    transferUuid: null,
    canEdit: true,
    canDelete: false,
    labels: {
      edit: 'Editar',
      nextStep: 'Próxima etapa',
      finalize: 'Finalizar',
      issueNfe: ISSUE_NFE_LABEL,
      issueTransfer: 'Emitir Romaneio',
      delete: 'Excluir',
    },
    onEdit: vi.fn(),
    onNextStep: vi.fn(),
    onFinalize: vi.fn(),
    onIssueNfe: vi.fn(),
    onIssueTransfer: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

function renderMenu(overrides: Partial<ModuleWeighingActionsMenuProps> = {}) {
  const props = buildProps(overrides);
  render(
    <ChakraProvider value={system}>
      <ModuleWeighingActionsMenu {...props} />
    </ChakraProvider>
  );
  return props;
}

async function openMenu() {
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  // O Menu do Chakra é um popover assíncrono; aguarda qualquer item aparecer ou o menu abrir.
  await new Promise((resolve) => setTimeout(resolve, 50));
}

afterEach(() => {
  cleanup();
});

describe('ModuleWeighingActionsMenu — Emitir NFe (UT-000715)', () => {
  it('mostra Emitir NFe só com status Finalizado, Venda/Saída, sem NF-e e permissão de edição', async () => {
    renderMenu();
    await openMenu();
    expect(await screen.findByText(ISSUE_NFE_LABEL)).toBeTruthy();
  });

  it('oculta Emitir NFe com status diferente de Finalizado (4)', async () => {
    renderMenu({ status: 4 as ModuleWeighingStatus });
    await openMenu();
    expect(screen.queryByText(ISSUE_NFE_LABEL)).toBeNull();
    expect(screen.getByText('Finalizar')).toBeTruthy();
  });

  it('oculta Emitir NFe com type diferente de Venda/Saída', async () => {
    renderMenu({ type: moduleWeighingType.entradaColheita });
    await openMenu();
    expect(screen.queryByText(ISSUE_NFE_LABEL)).toBeNull();
    expect(screen.getByText('Emitir Romaneio')).toBeTruthy();
  });

  it('oculta Emitir NFe quando a pesagem já tem NF-e vinculada', async () => {
    renderMenu({ nfeUuid: 'nfe-uuid-1' });
    await openMenu();
    expect(screen.queryByText(ISSUE_NFE_LABEL)).toBeNull();
    expect(screen.getByText('Emitir Romaneio')).toBeTruthy();
  });

  it('oculta Emitir NFe sem permissão de edição', async () => {
    renderMenu({ canEdit: false, canDelete: true });
    await openMenu();
    expect(screen.queryByText(ISSUE_NFE_LABEL)).toBeNull();
    expect(screen.getByText('Excluir')).toBeTruthy();
  });

  it('aceita status string vindo da API (coerção numérica) e mostra a ação', async () => {
    renderMenu({ status: '5' as unknown as ModuleWeighingStatus });
    await openMenu();
    expect(await screen.findByText(ISSUE_NFE_LABEL)).toBeTruthy();
  });

  it('Emitir NFe depende de canEdit (module-weighing_edit) e não de nfe_create — documenta o comportamento atual', async () => {
    // O menu não recebe nenhuma prop/permissão de NF-e (`nfe_create`): o gate de criação vive só na
    // rota de destino (`RequirePermission`, ver `src/router/nfe-create-route.test.tsx`). Comportamento
    // ATUAL preservado (lacuna L-715-05 do legado: `@can` do menu fica como melhoria separada).
    const props = buildProps({ canEdit: true });
    expect(Object.keys(props).some((key) => /nfe_?create|permission/i.test(key))).toBe(false);

    renderMenu({ canEdit: true });
    await openMenu();
    expect(await screen.findByText(ISSUE_NFE_LABEL)).toBeTruthy();
  });

  it('clicar em Emitir NFe chama onIssueNfe', async () => {
    const props = renderMenu();
    await openMenu();
    fireEvent.click(await screen.findByText(ISSUE_NFE_LABEL));
    expect(props.onIssueNfe).toHaveBeenCalledTimes(1);
  });
});
