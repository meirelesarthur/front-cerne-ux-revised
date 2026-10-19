// Alternância de ordenação das colunas da lista de Recebimentos (execução 081, T-081-FE-10).

// Alterna a direção da coluna ativa; coluna nova começa em ascendente.
export function nextOrderBy(
  current: { name: string; ascOrDesc: string } | undefined,
  sortKey: string
): { name: string; ascOrDesc: string } {
  if (current?.name === sortKey) {
    return { name: sortKey, ascOrDesc: current.ascOrDesc === 'asc' ? 'desc' : 'asc' };
  }
  return { name: sortKey, ascOrDesc: 'asc' };
}
