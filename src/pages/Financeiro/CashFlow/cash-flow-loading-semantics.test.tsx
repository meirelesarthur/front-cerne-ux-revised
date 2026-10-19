// GAP-CF-FE-02 — prova isolada da semântica TanStack Query v5 que justifica a
// correção em `index.tsx` (`isLoading = reportQuery.isFetching`, não mais
// `checkLoadingStatus([reportQuery])`/`isPending`).
//
// Não renderiza `CashFlowReportPage` inteira (fora do escopo estrito desta
// correção — a página exige mocks pesados de idioma/serviços/tema alheios ao
// bug). Em vez disso, reproduz a MESMA forma de `useQuery` usada no
// componente (`enabled:false`, sem fetch automático) via `renderHook` e prova
// o fato de runtime que o Tester documentou: `isPending` fica `true` para
// sempre enquanto a query nunca foi disparada, `isFetching` não — e só
// `isFetching` reflete corretamente "há um fetch real em andamento".
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // eslint-disable-next-line react/display-name -- wrapper de teste, sem uso em produção
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('GAP-CF-FE-02 — semântica isPending vs isFetching (useQuery enabled:false)', () => {
  it('isPending fica true e isFetching fica false quando a query nunca foi disparada (bug do checkLoadingStatus)', () => {
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['gap-cf-fe-02', 'never-fetched'],
          queryFn: () => Promise.resolve({ ok: true }),
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    // Reproduz a causa raiz do GAP-CF-FE-02: `isPending` é `true` mesmo sem
    // nenhum fetch em andamento — `checkLoadingStatus` (baseado em
    // `isLoading || isPending`) ficava preso em `true` para sempre neste
    // cenário, escondendo o empty pré-filtro.
    expect(result.current.isPending).toBe(true);
    // A correção usa exatamente este sinal: nenhum fetch real está em
    // andamento, então `isFetching` é `false` e o empty pré-filtro pode
    // renderizar imediatamente.
    expect(result.current.isFetching).toBe(false);
  });

  it('isFetching vira true durante o fetch real (refetch manual) e volta a false ao concluir — loading real preservado', async () => {
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['gap-cf-fe-02', 'manual-refetch'],
          queryFn: () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200)),
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    // Pré-condição (mirror do 1º carregamento da tela): nenhum fetch ainda.
    expect(result.current.isFetching).toBe(false);

    // Dispara o fetch manual — mirror do `refetch()` acionado pelo
    // `useEffect` de `CashFlowReportPage` ao aplicar o filtro.
    void result.current.refetch();

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.isSuccess).toBe(true);
  });
});
