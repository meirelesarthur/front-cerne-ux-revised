// @vitest-environment jsdom
// Execução 081, T-081-FE-07 — colunas de Rejeitados/Cancelados (contrato 04,
// RC01..RC09): ordem do legado, "Descrição/Chamado" vinda de `description`,
// bolinha de status acessível e coluna de ação oculta sem permissão.
import { ChakraProvider } from '@chakra-ui/react';
import { flexRender } from '@tanstack/react-table';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { system } from '@/theme';

import { languageRequestPurchases } from '@/constants/languages/languagePtBr/languageRequestPurchases';

import type { RequestPurchaseListItem } from '@/@types/v2/RequestPurchases';

import { buildRejectedColumns } from './rejectedColumns';

const text = languageRequestPurchases.requestPurchase;

function columns(overrides: { canView?: boolean; canSla?: boolean } = {}) {
  return buildRejectedColumns({
    text,
    canView: overrides.canView ?? true,
    canSla: overrides.canSla ?? true,
    onView: () => undefined,
    onSlaReport: () => undefined,
  });
}

const item = {
  uuid: 'u-1',
  code: '0042',
  type: 'P',
  type_label: 'Produto',
  status: 5,
  status_label: 'Pedido Não Aprovado',
  priority: 1,
  priority_label: 'Média',
  request_date: '2026-09-10',
  justification: 'JUSTIFICATIVA INTERNA',
  description: 'Descrição do chamado',
  duration_label: '3 dias',
  user: { uuid: 'r', name: 'Maria Solicitante' },
  farm: { uuid: 'f', description: 'Fazenda Boa Vista' },
  responsible: { uuid: 'x', name: 'João Responsável' },
  created_at: '2026-09-10T10:00:00Z',
} as unknown as RequestPurchaseListItem;

function renderCell(columnId: string) {
  const column = columns().find(
    (candidate) =>
      (candidate.id ?? (candidate as { accessorKey?: string }).accessorKey) === columnId
  );
  if (!column) throw new Error(`coluna ${columnId} não encontrada`);
  const context = { row: { original: item }, getValue: () => undefined } as never;
  return render(<ChakraProvider value={system}>{flexRender(column.cell, context)}</ChakraProvider>);
}

afterEach(cleanup);

describe('buildRejectedColumns', () => {
  it('segue a ordem de colunas do legado, com Ação por último', () => {
    const headers = columns()
      .map((column) => column.header)
      .filter((header) => typeof header === 'string' && header !== '');
    expect(headers.slice(0, 7)).toEqual([
      'Código',
      'Dt. Pedido',
      'Descrição/Chamado',
      'Duração',
      'Solicitante',
      'Responsável Atual',
      'Fazenda',
    ]);
    const all = columns();
    expect(all[0].id).toBe('statusDot');
    expect(all[all.length - 1].id).toBe('acoes');
  });

  it('Descrição/Chamado mostra `description`, não a justificativa', () => {
    renderCell('description');
    expect(screen.getByText('Descrição do chamado')).toBeTruthy();
    expect(screen.queryByText('JUSTIFICATIVA INTERNA')).toBeNull();
  });

  it('mostra Solicitante, Responsável Atual e Fazenda da linha', () => {
    renderCell('requester');
    expect(screen.getByText('Maria Solicitante')).toBeTruthy();
    cleanup();
    renderCell('responsible');
    expect(screen.getByText('João Responsável')).toBeTruthy();
    cleanup();
    renderCell('farm');
    expect(screen.getByText('Fazenda Boa Vista')).toBeTruthy();
  });

  it('bolinha de status tem nome acessível do status', () => {
    renderCell('statusDot');
    expect(screen.getByRole('img', { name: 'Pedido Não Aprovado' })).toBeTruthy();
  });

  it('Responsável vazio mostra travessão', () => {
    const column = columns().find((candidate) => candidate.id === 'responsible')!;
    const context = { row: { original: { ...item, responsible: null } } } as never;
    render(<ChakraProvider value={system}>{flexRender(column.cell, context)}</ChakraProvider>);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('sem Visualizar nem Relatório SLA a célula de ação fica vazia', () => {
    const column = columns({ canView: false, canSla: false }).find(
      (candidate) => candidate.id === 'acoes'
    )!;
    const context = { row: { original: item } } as never;
    const { container } = render(
      <ChakraProvider value={system}>{flexRender(column.cell, context)}</ChakraProvider>
    );
    expect(container.textContent).toBe('');
  });
});
