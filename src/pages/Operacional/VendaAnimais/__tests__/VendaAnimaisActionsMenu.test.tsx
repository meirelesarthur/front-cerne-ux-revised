// @vitest-environment jsdom
// UT-000719 / FE-T07 — menu de ações da lista: "Finalizar" visível somente com
// `canEdit && canFinish && onFinish` (canFinish = status P na linha). Superfícies S-719-07/S-719-17.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { languages } from '@/constants/languages';

vi.mock('@/components/Action', () => {
  const Item = ({ children, onClick, disabled }: any) => (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  const Actions = ({ children }: any) => <div role="menu">{children}</div>;
  Actions.Item = Item;
  Actions.Separator = () => <hr />;
  return { Actions };
});
vi.mock('@/components/TooLtip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
}));

import {
  VendaAnimaisActionsMenu,
  type VendaAnimaisActionsMenuProps,
} from '../VendaAnimaisActionsMenu';

const labels = languages.BR.movementSales.movementSale.list.actions;
const FINISH = labels.finish;

function renderMenu(overrides: Partial<VendaAnimaisActionsMenuProps> = {}) {
  const onFinish = vi.fn();
  const onDelete = vi.fn();
  const utils = render(
    <VendaAnimaisActionsMenu
      canView
      canEdit
      canDelete={false}
      isLocked={false}
      canFinish
      typeSale={2}
      onView={vi.fn()}
      onEdit={vi.fn()}
      onFinish={onFinish}
      onDelete={onDelete}
      labels={labels as unknown as VendaAnimaisActionsMenuProps['labels']}
      {...overrides}
    />
  );
  return { ...utils, onFinish, onDelete };
}

afterEach(cleanup);

describe('Finalizar', () => {
  it('visivel somente com canEdit && canFinish && onFinish', () => {
    // todos os requisitos => visível e dispara onFinish
    const ok = renderMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: FINISH }));
    expect(ok.onFinish).toHaveBeenCalledTimes(1);
    ok.unmount();

    // sem canEdit (mov_sale_edit)
    renderMenu({ canEdit: false }).unmount();
    expect(screen.queryByRole('menuitem', { name: FINISH })).toBeNull();

    // venda não pendente (canFinish=false: status F)
    renderMenu({ canFinish: false }).unmount();
    expect(screen.queryByRole('menuitem', { name: FINISH })).toBeNull();

    // sem handler onFinish
    renderMenu({ onFinish: undefined }).unmount();
    expect(screen.queryByRole('menuitem', { name: FINISH })).toBeNull();

    // Finalizar não reabre: nenhuma ação de "reabrir" existe no menu de uma venda finalizada
    renderMenu({ canFinish: false });
    expect(screen.queryByRole('menuitem', { name: /reabrir/i })).toBeNull();
  });
});

// UT-000719 / FE-T10 (GAP-FE-719-V3-01, S-719-08 ACTION) — "Excluir" é gateado por `canDelete`
// (mov_sale_delete) e o clique dispara `onDelete` (abre o DeleteConfirmDialog na lista).
const DELETE = labels.delete;

describe('Excluir', () => {
  it('visivel somente com canDelete; clique chama onDelete', () => {
    // com canDelete => visível e o clique chama onDelete uma vez
    const ok = renderMenu({ canDelete: true });
    fireEvent.click(screen.getByRole('menuitem', { name: DELETE }));
    expect(ok.onDelete).toHaveBeenCalledTimes(1);
    ok.unmount();

    // sem canDelete (mov_sale_delete) => ausente
    const denied = renderMenu({ canDelete: false });
    expect(screen.queryByRole('menuitem', { name: DELETE })).toBeNull();
    expect(denied.onDelete).not.toHaveBeenCalled();
  });
});
