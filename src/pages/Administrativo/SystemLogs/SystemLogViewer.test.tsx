// @vitest-environment jsdom
// src/pages/Administrativo/SystemLogs/SystemLogViewer.test.tsx
// U-06/U-07 (execução 079) — visualizador com o service mockado: tail inicial,
// carregar mais (cursor `before` = range.start), teto atingido, arquivo vazio,
// erro em fetchNextPage preserva o conteúdo, busca no arquivo inteiro (q) e
// contexto (before = match.end), 404.

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { SystemLogChunk } from '@/@types/v2/SystemLogs';

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

const contentMock = vi.fn();
const searchMock = vi.fn();

vi.mock('@/services/v2/SystemLogs/system-logs-service', () => ({
  SYSTEM_LOG_SEARCH_MIN_CHARS: 2,
  SYSTEM_LOG_SEARCH_MAX_MATCHES: 100,
  listSystemLogDirectory: vi.fn(),
  downloadSystemLog: vi.fn(),
  getSystemLogContent: (...args: unknown[]) => contentMock(...args),
  searchSystemLog: (...args: unknown[]) => searchMock(...args),
}));

import SystemLogViewer from './SystemLogViewer';

function chunk(overrides: Partial<SystemLogChunk> = {}): SystemLogChunk {
  return {
    path: 'laravel.log',
    name: 'laravel.log',
    size: 300,
    modified_at: '2026-09-30T08:22:41-03:00',
    mode: 'tail',
    range: { start: 100, end: 300 },
    has_more_before: true,
    partial_line: false,
    content: 'linha 3\nlinha 4\n',
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderViewer(entry = '/administrativo/logs/arquivo?path=laravel.log') {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 10 } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/administrativo/logs/arquivo" element={<SystemLogViewer />} />
            <Route path="/administrativo/logs" element={<div data-testid="explorer" />} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

beforeEach(() => {
  contentMock.mockReset();
  searchMock.mockReset();
  // jsdom não implementa layout: scrollHeight fixo basta para o efeito de scroll
});

afterEach(() => cleanup());

describe('SystemLogViewer', () => {
  it('abre no fim do arquivo (sem before) e mostra o resumo carregado', async () => {
    contentMock.mockResolvedValue(chunk());
    renderViewer();

    const pages = await screen.findAllByTestId('system-logs-page');
    expect(pages).toHaveLength(1);
    expect(pages[0].textContent).toBe('linha 3\nlinha 4');
    expect(contentMock).toHaveBeenCalledWith('laravel.log', undefined);
    expect(screen.getByTestId('system-logs-loaded-summary').textContent).toContain('2 linhas');
  });

  it('carregar mais antigos usa before = range.start e coloca o bloco antigo ACIMA', async () => {
    contentMock.mockResolvedValueOnce(chunk());
    contentMock.mockResolvedValueOnce(
      chunk({
        range: { start: 0, end: 100 },
        has_more_before: false,
        content: 'linha 1\nlinha 2\n',
      })
    );
    renderViewer();
    await screen.findAllByTestId('system-logs-page');

    fireEvent.click(screen.getByTestId('system-logs-load-older'));

    await waitFor(() => expect(screen.getAllByTestId('system-logs-page')).toHaveLength(2));
    expect(contentMock).toHaveBeenLastCalledWith('laravel.log', 100);
    const pages = screen.getAllByTestId('system-logs-page');
    expect(pages[0].textContent).toBe('linha 1\nlinha 2');
    expect(pages[1].textContent).toBe('linha 3\nlinha 4');
    // sem mais blocos: aviso de início e botão some
    expect(screen.getByTestId('system-logs-start-of-file')).toBeTruthy();
    expect(screen.queryByTestId('system-logs-load-older')).toBeNull();
  });

  it('erro em fetchNextPage preserva o conteúdo e oferece retry inline', async () => {
    contentMock.mockResolvedValueOnce(chunk());
    contentMock.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 429 } }));
    renderViewer();
    await screen.findAllByTestId('system-logs-page');

    fireEvent.click(screen.getByTestId('system-logs-load-older'));

    expect(await screen.findByTestId('system-logs-load-more-error')).toBeTruthy();
    expect(screen.getAllByTestId('system-logs-page')).toHaveLength(1);
  });

  it('teto de carga atingido desabilita "carregar mais" e orienta o download', async () => {
    contentMock.mockResolvedValue(
      chunk({ size: 20_000_000, range: { start: 11_000_000, end: 20_000_000 } })
    );
    renderViewer();
    await screen.findAllByTestId('system-logs-page');

    expect(screen.getByTestId('system-logs-limit-reached')).toBeTruthy();
    expect(screen.queryByTestId('system-logs-load-older')).toBeNull();
  });

  it('arquivo vazio: estado honesto e Baixar desabilitado', async () => {
    contentMock.mockResolvedValue(
      chunk({ size: 0, range: { start: 0, end: 0 }, has_more_before: false, content: '' })
    );
    renderViewer();

    expect(await screen.findByTestId('system-logs-empty-file')).toBeTruthy();
    expect((screen.getByTestId('system-logs-viewer-download') as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('404 mostra "Arquivo não encontrado" com volta à pasta', async () => {
    contentMock.mockRejectedValue(Object.assign(new Error('nf'), { response: { status: 404 } }));
    renderViewer('/administrativo/logs/arquivo?path=inexistente.log');

    expect(await screen.findByText(/Arquivo não encontrado/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar à pasta' }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/administrativo/logs')
    );
  });

  it('busca no arquivo inteiro: q vai para a API, destaca e "abrir contexto" usa before = match.end', async () => {
    contentMock.mockResolvedValue(chunk());
    searchMock.mockResolvedValue({
      result: {
        path: 'laravel.log',
        name: 'laravel.log',
        size: 300,
        modified_at: '2026-09-30T08:22:41-03:00',
        mode: 'search',
        q: 'ERROR',
        scanned: { start: 0, end: 300 },
        has_more_before: false,
        next_before: null,
        matches: [{ start: 120, end: 180, line: '[x] local.ERROR: falhou', line_truncated: false }],
      },
      meta: { max_matches: 100, returned: 1, scan_budget_bytes: 33554432 },
    });
    renderViewer();
    await screen.findAllByTestId('system-logs-page');

    const input = screen.getByTestId('system-logs-search-input');
    fireEvent.change(input, { target: { value: 'ERROR' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const results = await screen.findByTestId('system-logs-search-results');
    expect(searchMock).toHaveBeenCalledWith('laravel.log', 'ERROR', undefined);
    expect((await within(results).findByTestId('system-logs-mark')).textContent).toBe('ERROR');
    expect(screen.getByTestId('system-logs-search-count').textContent).toContain('1 ocorrência');

    contentMock.mockResolvedValue(chunk({ range: { start: 0, end: 180 }, has_more_before: false }));
    fireEvent.click(within(results).getByTestId('system-logs-open-context'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('before=180'));
    await waitFor(() => expect(contentMock).toHaveBeenLastCalledWith('laravel.log', 180));
    expect(await screen.findByTestId('system-logs-context-notice')).toBeTruthy();
  });

  it('busca com menos de 2 caracteres não chama a API e mostra a dica', async () => {
    contentMock.mockResolvedValue(chunk());
    renderViewer();
    await screen.findAllByTestId('system-logs-page');

    const input = screen.getByTestId('system-logs-search-input');
    fireEvent.change(input, { target: { value: 'E' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Digite ao menos 2 caracteres.')).toBeTruthy();
    expect(searchMock).not.toHaveBeenCalled();
  });
});
