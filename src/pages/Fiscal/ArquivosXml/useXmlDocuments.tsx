// src/pages/Fiscal/ArquivosXml/useXmlDocuments.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Arquivos XML" (F-133, esteira 97-Esteiras/008,
// Tarefa 36). Convenção do fork para leitura FORA da família grid (mirror
// `CadastrosBase/Emissores/useIssuers.tsx::useIssuerCertificate`,
// `CentroCusto/useCostCenters.tsx`, `Contador/useContadores.tsx`) — esta
// tela NÃO é uma grid (AD-F10 do contrato de tela): a API não pagina, não
// ordena por parâmetro e devolve grupos, então `useCustomGridQuery`/
// `userPaginatedQuery`/`TableProvider`/`useGridSettings` NÃO se aplicam.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import {
  listXmlDocumentIssuers,
  listXmlDocuments,
} from '@/services/v2/Fiscal/xml-document-service';

import type { XmlDocumentFilterQuery } from '@/@types/v2/Fiscal/xml-document';

// Lookup de emissores (E2) — lista curta por construção (emissores
// habilitados da fazenda ativa), sem paginação/busca (AD-F09).
export function useXmlDocumentIssuers() {
  return useQuery({
    queryKey: [queryKey.xmlDocuments.issuers],
    queryFn: listXmlDocumentIssuers,
    refetchOnWindowFocus: false,
  });
}

// Consulta agregada (E1) — `enabled: appliedFilters !== null` é o que
// implementa o estado "aguardando filtros" (AD-F03): nenhuma request antes
// do submit, e os filtros DENTRO da `queryKey` é o que dispara o refetch ao
// trocar de filtro aplicado.
export function useXmlDocumentList(appliedFilters: XmlDocumentFilterQuery | null) {
  return useQuery({
    queryKey: [queryKey.xmlDocuments.list, appliedFilters],
    queryFn: () => listXmlDocuments(appliedFilters!),
    enabled: appliedFilters !== null,
    refetchOnWindowFocus: false,
  });
}
