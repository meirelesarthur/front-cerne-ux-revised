// src/utils/resolveGridState.ts
// -----------------------------------------------------------------------------
// Esteira 003, Onda 5 (CONTRATO-FE-GRID-QUERY-STATE-COMPONENTE.md, §3.2).
// Função pura que extrai a decisão de precedência de estado da grid
// (erro > vazio > dados), hoje duplicada inline em cada tela de listagem
// (`isError ? <QueryErrorState/> : isEmpty ? <EmptyState/> : <Table/>`).
//
// Puxa a mesma estratégia já usada por `extractApiErrorMessage.test.ts`
// (função pura testável em vitest node-env, sem jsdom) — ver achado de
// memória do domínio: hook React não é testável sem jsdom; aqui não é um
// hook, é uma função que recebe 3 booleans e devolve uma string.
//
// NÃO importa React/Chakra/TanStack — mantém-se agnóstica ao shape de
// `data.data.items` e à origem de `isLoading`/`isEmpty` (a tela calcula e
// passa esses 2 campos já resolvidos, exatamente como faz hoje).
// -----------------------------------------------------------------------------

export type GridState = 'error' | 'empty' | 'data';

export interface ResolveGridStateInput {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}

/**
 * Precedência FIXA: erro > vazio > dados.
 *
 * `isLoading` não é um ramo próprio — o loading é delegado ao `children`
 * (o `<Table isLoading=.../>` já mostra seu próprio Skeleton internamente).
 * Ele entra na assinatura só para o caso `isLoading && isEmpty`: evita
 * mostrar a EmptyState de "cadastre o primeiro" enquanto a primeira carga
 * ainda não terminou (`isEmpty` calculado pela tela como
 * `items?.length ?? 0 === 0` também é `true` durante o loading inicial,
 * antes de `items` existir).
 *
 * @return {GridState} o estado a renderizar: `'error'` | `'empty'` | `'data'`.
 */
export function resolveGridState({
  isLoading,
  isError,
  isEmpty,
}: ResolveGridStateInput): GridState {
  if (isError) return 'error';
  if (!isLoading && isEmpty) return 'empty';
  return 'data';
}
