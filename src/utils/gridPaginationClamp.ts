import { PaginatedQueryProps } from '@/@types/pagination';

/**
 * Totalizadores de paginação vindos do envelope V3 (`ResponsePagination.data.pagination`).
 * Só os dois campos usados no clamp — o shape integral vive em `response-api.d.ts`.
 */
export interface GridPaginationTotals {
  total?: number;
  total_pages?: number;
}

/**
 * Aplica ao `paginatedQuery` os totalizadores retornados pela API e CLAMPA
 * `pageIndex` quando a página persistida (localStorage/URL) ficou fora do
 * intervalo válido — ex.: o usuário exclui o único registro da última página,
 * atualiza a tela, e a página guardada (2) não existe mais (`total_pages` caiu
 * para 1). Sem o clamp a API devolve uma lista vazia para uma página que não
 * existe, a grid mostra "Nenhum registro" com dados no banco, e o controle de
 * paginação some (não há como voltar para a página 1 pela UI).
 *
 * Só clampa quando `total > 0`: uma lista genuinamente vazia não tem "última
 * página válida" para onde voltar, e não é o cenário deste bug — mantém
 * `pageIndex` como está para não mascarar outros estados de UI.
 *
 * O novo `pageIndex` entra na queryKey do hook chamador, então o clamp dispara
 * o refetch da página corrigida na hora (não é preciso ação extra do usuário)
 * e, por ser o MESMO `paginatedQuery` que os hooks de paginação persistem,
 * a próxima gravação em localStorage/URL já sai com o valor corrigido.
 *
 * Idempotente: uma vez que `pageIndex` está dentro do intervalo, chamadas
 * subsequentes com os mesmos totais não alteram mais o valor — não há loop.
 *
 * @param {PaginatedQueryProps<TFilter>} prevState - Estado corrente do `paginatedQuery`.
 * @param {GridPaginationTotals | undefined} totals - `pagination` da resposta paginada da API.
 * @return {PaginatedQueryProps<TFilter>} Novo estado, com `pageIndex` corrigido se necessário.
 */
export function applyGridPaginationTotals<TFilter = any>(
  prevState: PaginatedQueryProps<TFilter>,
  totals: GridPaginationTotals | undefined
): PaginatedQueryProps<TFilter> {
  const total = totals?.total ?? 0;
  const totalPages = totals?.total_pages ?? 0;

  const pageIndex =
    total > 0 && totalPages > 0 && prevState.pageIndex > totalPages
      ? totalPages
      : prevState.pageIndex;

  return {
    ...prevState,
    pageIndex,
    pagesCount: totalPages,
    totalRecords: total,
  };
}
