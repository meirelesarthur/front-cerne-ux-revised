import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { PaginatedQueryProps } from "@/@types/pagination"; // Verifique o caminho do seu tipo

interface PaginatedQueryDefaultProps<TFilter = any> {
  pageSize?: number;
  orderBy?: {
    name: string;
    ascOrDesc: string;
  };
  filter?: TFilter; // Filtros pré-fixados/padrão
}

// Função para "reviver" dados após o parse do JSON, especialmente para datas
// Adapte esta função conforme a estrutura do seu objeto TFilter
function reviveFilterData<TFilter>(filterData: any): TFilter {
  if (!filterData) return filterData;

  const revivedData = { ...filterData }; // Cria uma cópia para evitar mutação direta

  // Exemplo para campos 'startDate' e 'endDate'
  const dateFields = ["startDate", "endDate"]; // Adicione outros campos de data se houver
  dateFields.forEach((field) => {
    if (revivedData[field] && typeof revivedData[field] === "string") {
      const date = new Date(revivedData[field]);
      // Verifica se a data é válida antes de atribuir
      if (!isNaN(date.getTime())) {
        revivedData[field] = date;
      } else {
        // Opcional: lidar com datas inválidas, talvez removendo-as ou logando um erro
        console.warn(
          `Data inválida encontrada no filtro para o campo '${field}':`,
          revivedData[field]
        );
      }
    }
  });

  // Adicione aqui lógica para outros tipos complexos se necessário
  // Ex: converter strings para números, ou reconstruir objetos específicos.

  return revivedData as TFilter;
}

export function userPaginatedQuery<TFilter = any>(
  defaultQuery?: PaginatedQueryDefaultProps<TFilter>
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const safeJsonParse = useCallback(
    <T,>(value: string | null, defaultValue: T): T => {
      if (!value) return defaultValue;
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("Falha ao parsear JSON da URL:", error, "Valor:", value);
        return defaultValue;
      }
    },
    []
  );

  // Lê os valores iniciais da URL ou usa os padrões/pré-fixados
  const getInitialState = useCallback((): PaginatedQueryProps<TFilter> => {
    const initialPageIndex = parseInt(searchParams.get("page") || "1", 10) || 1;
    const initialPageSize =
      parseInt(searchParams.get("pageSize") || "", 10) ||
      defaultQuery?.pageSize ||
      10;

    // Para orderBy e filter, primeiro tentamos da URL, depois o defaultQuery
    const orderByFromUrl = safeJsonParse(
      searchParams.get("orderBy"),
      defaultQuery?.orderBy // Fallback para defaultQuery.orderBy
    );

    const filterFromUrlRaw = safeJsonParse(
      searchParams.get("filter"),
      defaultQuery?.filter || null // Fallback para defaultQuery.filter
    );
    // Importante: "Reviver" os dados do filtro (ex: converter strings de data para objetos Date)
    const initialFilter = reviveFilterData<TFilter>(filterFromUrlRaw);

    return {
      pageIndex: initialPageIndex,
      pageSize: initialPageSize,
      pagesCount: 0, // Será definido após a primeira busca de dados
      totalRecords: 0, // Será definido após a primeira busca de dados
      orderBy: orderByFromUrl,
      filter: initialFilter,
    };
  }, [searchParams, defaultQuery, safeJsonParse]);

  const [paginatedQuery, setPaginatedQuery] =
    useState<PaginatedQueryProps<TFilter>>(getInitialState);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Efeito para atualizar a URL quando `paginatedQuery` muda
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", paginatedQuery.pageIndex.toString());
    params.set("pageSize", paginatedQuery.pageSize.toString());

    if (paginatedQuery.orderBy) {
      try {
        params.set("orderBy", JSON.stringify(paginatedQuery.orderBy));
      } catch (error) {
        console.error("Falha ao serializar 'orderBy':", error);
      }
    }

    // Somente adiciona o filtro à URL se ele não for null ou undefined
    // (ou se não for igual ao filtro padrão, se você quiser URLs mais limpas)
    if (paginatedQuery.filter !== null && paginatedQuery.filter !== undefined) {
      try {
        // Não é necessário reviver aqui, pois JSON.stringify lida com Date para ISO string
        params.set("filter", JSON.stringify(paginatedQuery.filter));
      } catch (error) {
        console.error("Falha ao serializar 'filter':", error);
      }
    }

    // Use replace: true para não poluir o histórico do navegador com cada mudança
    setSearchParams(params, { replace: true });
  }, [paginatedQuery, setSearchParams]);

  // Efeito para re-sincronizar com a URL se ela mudar externamente (botão voltar/avançar)
  useEffect(() => {
    setPaginatedQuery(getInitialState());
  }, [getInitialState]);

  const handleProcessing = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 700);
  }, []);

  const handlePaginatedQuery = useCallback(
    (
      data:
        | Partial<PaginatedQueryProps<TFilter>>
        | ((prev: PaginatedQueryProps<TFilter>) => PaginatedQueryProps<TFilter>)
    ) => {
      setPaginatedQuery((prev) =>
        typeof data === "function" ? data(prev) : { ...prev, ...data }
      );
    },
    []
  );

  const handleFilterChange = useCallback(
    (newFilter: TFilter) => {
      setPaginatedQuery((prev) => ({
        ...prev,
        pageIndex: 1, // Resetar para primeira página ao mudar filtro
        filter: newFilter,
      }));
      handleProcessing();
    },
    [handleProcessing]
  );

  const handleResetFilter = useCallback(() => {
    setPaginatedQuery((prev) => ({
      ...prev,
      pageIndex: 1,
      // Ao resetar, volta para o filtro pré-fixado/padrão do `defaultQuery`
      filter: reviveFilterData<TFilter>(defaultQuery?.filter || null),
    }));
    handleProcessing();
  }, [defaultQuery, handleProcessing]);

  const handleOrderByChange = useCallback(
    (orderBy: { name: string; ascOrDesc: string }) => {
      setPaginatedQuery((prev) => ({
        ...prev,
        orderBy,
        pageIndex: 1, // Opcional: resetar para primeira página ao mudar ordenação
      }));
      handleProcessing();
    },
    [handleProcessing]
  );

  return {
    paginatedQuery,
    isProcessing,
    handlePaginatedQuery,
    handleFilterChange,
    handleResetFilter,
    handleOrderByChange,
    handleProcessing,
  };
}
