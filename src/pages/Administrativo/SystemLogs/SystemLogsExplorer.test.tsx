// @vitest-environment jsdom
// src/pages/Administrativo/SystemLogs/SystemLogsExplorer.test.tsx
// U-05 (execução 079) — explorador com o service mockado (fronteira HTTP):
// loading, lista, vazio, filtro sem resultado, erro com retry, 404, clique em
// pasta altera `?path`, ordenação server-side e download.

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { SystemLogDirectoryResult } from '@/@types/v2/SystemLogs';

// jsdom sob Node recente expõe um `localStorage` sem API (mesmo contorno de
// `NoFarmOnboardingGuard.test.tsx`): storage em memória.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

const listMock = vi.fn();
const downloadMock = vi.fn();
const downloadBlobMock = vi.fn();

vi.mock('@/services/v2/SystemLogs/system-logs-service', () => ({
  SYSTEM_LOG_SEARCH_MIN_CHARS: 2,
  SYSTEM_LOG_SEARCH_MAX_MATCHES: 100,
  listSystemLogDirectory: (...args: unknown[]) => listMock(...args),
  downloadSystemLog: (...args: unknown[]) => downloadMock(...args),
  getSystemLogContent: vi.fn(),
  searchSystemLog: vi.fn(),
}));

vi.mock('@/utils/downloadBlob', () => ({
  downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
}));

import SystemLogsExplorer from './index';

function directory(
  items: SystemLogDirectoryResult['data']['items'],
  overrides: Partial<SystemLogDirectoryResult['meta']> = {},
  path = ''
): SystemLogDirectoryResult {
  return {
    data: {
      path,
      parent_path: null,
      breadcrumbs: [{ name: 'logs', path: '' }],
      items,
    },
    meta: {
      sort: 'modified_at',
      direction: 'desc',
      total: items.length,
      truncated: false,
      ...overrides,
    },
  };
}

const FILES = [
  {
    name: 'jobs',
    path: 'jobs',
    type: 'dir' as const,
    size: null,
    modified_at: '2026-09-30T07:35:10-03:00',
  },
  {
    name: 'laravel-2026-09-30.log',
    path: 'laravel-2026-09-30.log',
    type: 'file' as const,
    size: 3_460_000,
    modified_at: '2026-09-30T08:22:41-03:00',
  },
  {
    name: 'queue.log',
    path: 'queue.log',
    type: 'file' as const,
    size: 390,
    modified_at: '2026-09-29T08:11:02-03:00',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderExplorer(initialEntry = '/administrativo/logs') {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 10 } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/administrativo/logs" element={<SystemLogsExplorer />} />
            <Route path="/administrativo/logs/arquivo" element={<div data-testid="viewer" />} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

beforeEach(() => {
  listMock.mockReset();
  downloadMock.mockReset();
  downloadBlobMock.mockReset();
});

afterEach(() => cleanup());

describe('SystemLogsExplorer', () => {
  it('lista pastas e arquivos com tamanho legível e data', async () => {
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();

    const rows = await screen.findAllByTestId('system-logs-row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('laravel-2026-09-30.log')).toBeTruthy();
    expect(within(rows[1]).getByText('3,3 MB')).toBeTruthy();
    expect(within(rows[1]).getByText('30/09/2026 - 08:22')).toBeTruthy();
    // pasta: tamanho "—"
    expect(within(rows[0]).getByText('—')).toBeTruthy();
    expect(listMock).toHaveBeenCalledWith({ path: '', sort: 'modified_at', direction: 'desc' });
  });

  it('mostra o estado de pasta vazia', async () => {
    listMock.mockResolvedValue(directory([]));
    renderExplorer();

    expect(await screen.findByText('Esta pasta está vazia')).toBeTruthy();
  });

  it('filtra por nome sem diferenciar caixa/acento; sem resultado mostra o estado de busca e limpar restaura', async () => {
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();
    await screen.findAllByTestId('system-logs-row');

    const input = screen.getByTestId('system-logs-filter');
    fireEvent.change(input, { target: { value: 'QUEUE' } });
    await waitFor(() => expect(screen.getAllByTestId('system-logs-row')).toHaveLength(1));

    fireEvent.change(input, { target: { value: 'inexistente' } });
    expect(await screen.findByText('Nenhum item encontrado')).toBeTruthy();

    // duas ações de limpar (X do campo e botão do estado vazio): ambas restauram
    const clearButtons = screen.getAllByRole('button', { name: 'Limpar filtro' });
    expect(clearButtons).toHaveLength(2);
    fireEvent.click(clearButtons[1]);
    await waitFor(() => expect(screen.getAllByTestId('system-logs-row')).toHaveLength(3));
  });

  it('avisa quando a listagem foi cortada no limite da API', async () => {
    listMock.mockResolvedValue(directory(FILES, { truncated: true }));
    renderExplorer();

    expect(await screen.findByTestId('system-logs-truncated')).toBeTruthy();
  });

  it('erro de rede: mostra o estado de erro e "Tentar novamente" refaz a chamada', async () => {
    listMock.mockRejectedValueOnce(new Error('rede')).mockRejectedValueOnce(new Error('rede'));
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();

    const retry = await screen.findByRole(
      'button',
      { name: 'Tentar novamente' },
      { timeout: 4000 }
    );
    fireEvent.click(retry);

    expect(await screen.findAllByTestId('system-logs-row')).toHaveLength(3);
  });

  it('404 mostra "Pasta não encontrada" com ação de voltar à raiz', async () => {
    listMock.mockRejectedValueOnce(Object.assign(new Error('nf'), { response: { status: 404 } }));
    renderExplorer('/administrativo/logs?path=inexistente');

    expect(await screen.findByText('Pasta não encontrada')).toBeTruthy();

    listMock.mockResolvedValue(directory(FILES));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para logs' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/administrativo/logs')
    );
  });

  it('clicar em pasta altera ?path (Voltar do navegador sobe de nível via histórico)', async () => {
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();
    const rows = await screen.findAllByTestId('system-logs-row');

    fireEvent.click(within(rows[0]).getByTestId('system-logs-entry-link'));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/administrativo/logs?path=jobs')
    );
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith({
        path: 'jobs',
        sort: 'modified_at',
        direction: 'desc',
      })
    );
  });

  it('clicar em arquivo abre o visualizador com o path', async () => {
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();
    const rows = await screen.findAllByTestId('system-logs-row');

    fireEvent.click(within(rows[2]).getByTestId('system-logs-entry-link'));

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe(
        '/administrativo/logs/arquivo?path=queue.log'
      )
    );
  });

  it('ordenação é server-side: nome asc, alterna desc e volta a Modificado em desc', async () => {
    listMock.mockResolvedValue(directory(FILES));
    renderExplorer();
    await screen.findAllByTestId('system-logs-row');

    fireEvent.click(screen.getByTestId('system-logs-sort-name'));
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith({ path: '', sort: 'name', direction: 'asc' })
    );

    fireEvent.click(screen.getByTestId('system-logs-sort-name'));
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith({ path: '', sort: 'name', direction: 'desc' })
    );

    fireEvent.click(screen.getByTestId('system-logs-sort-size'));
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith({ path: '', sort: 'size', direction: 'desc' })
    );

    fireEvent.click(screen.getByTestId('system-logs-sort-modified_at'));
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith({
        path: '',
        sort: 'modified_at',
        direction: 'desc',
      })
    );
  });

  it('download pela lista: chama o service com o path, entrega o blob com o nome recebido', async () => {
    listMock.mockResolvedValue(directory(FILES));
    const blob = new Blob(['conteudo']);
    downloadMock.mockResolvedValue({ blob, filename: 'queue.log' });
    renderExplorer();
    const rows = await screen.findAllByTestId('system-logs-row');

    // pasta não tem botão de download
    expect(within(rows[0]).queryByTestId('system-logs-download')).toBeNull();

    fireEvent.click(within(rows[2]).getByTestId('system-logs-download'));

    await waitFor(() => expect(downloadBlobMock).toHaveBeenCalledWith(blob, 'queue.log'));
    expect(downloadMock.mock.calls[0][0]).toBe('queue.log');
  });
});
