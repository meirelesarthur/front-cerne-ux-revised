import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginatedQueryProps } from "@/@types/pagination";

interface PaginatedQueryDefaultProps<TFilter = any> {
  pageSize?: number;
  orderBy?: {
    name: string;
    ascOrDesc: string;
  };
  filter?: TFilter;
  storageKey?: string;
}

function reviveFilterData<TFilter>(filterData: any): TFilter {
  if (!filterData) return filterData;
  const revivedData = { ...filterData };
  if (typeof revivedData.startDate === "string") {
    const date = new Date(revivedData.startDate);
    if (!isNaN(date.getTime())) {
      revivedData.startDate = date;
    }
  }
  if (typeof revivedData.endDate === "string") {
    const date = new Date(revivedData.endDate);
    if (!isNaN(date.getTime())) {
      revivedData.endDate = date;
    }
  }
  return revivedData as TFilter;
}

interface StoredPaginatedState<TFilter = any> {
  pageIndex: number;
  pageSize: number;
  orderBy?: { name: string; ascOrDesc: string };
  filter: TFilter;
}

export function userPaginatedQuery<TFilter = any>(
  defaultQueryProps?: PaginatedQueryDefaultProps<TFilter>,
) {
  const memoizedDefaultQuery = useMemo(() => {
    return {
      ...defaultQueryProps,
      storageKey: defaultQueryProps?.storageKey
        ? "storageKeyGB" + defaultQueryProps.storageKey
        : undefined,
    };
  }, [
    defaultQueryProps?.storageKey,
    defaultQueryProps?.pageSize,
    defaultQueryProps?.orderBy,
    defaultQueryProps?.filter,
  ]);
  const getInitialState = useCallback((): PaginatedQueryProps<TFilter> => {
    const currentStorageKey = memoizedDefaultQuery?.storageKey;
    const baseDefaults: PaginatedQueryProps<TFilter> = {
      pageIndex: 1,
      pageSize: memoizedDefaultQuery?.pageSize || 10,
      orderBy: memoizedDefaultQuery?.orderBy,
      filter: reviveFilterData<TFilter>(
        memoizedDefaultQuery?.filter || (null as TFilter),
      ),
      pagesCount: 0,
      totalRecords: 0,
    };

    if (currentStorageKey && typeof window !== "undefined") {
      try {
        const savedStateString = localStorage.getItem(currentStorageKey);
        if (savedStateString) {
          const savedState = JSON.parse(
            savedStateString,
          ) as StoredPaginatedState<TFilter>;
          return {
            ...baseDefaults,
            pageIndex: savedState.pageIndex,
            pageSize: savedState.pageSize,
            orderBy: savedState.orderBy,
            filter: reviveFilterData<TFilter>(savedState.filter),
          };
        }
      } catch (error) {
        console.error(
          `Erro ao ler estado do localStorage (key: ${currentStorageKey}):`,
          error,
        );
      }
    }
    return baseDefaults;
  }, [memoizedDefaultQuery]);

  const [paginatedQuery, setPaginatedQueryInternal] =
    useState<PaginatedQueryProps<TFilter>>(getInitialState);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Efeito para RECARREGAR do localStorage se a storageKey mudar
  useEffect(() => {
    // Esta função será chamada quando `getInitialState` mudar de referência,
    // o que acontece se `memoizedDefaultQuery` (e portanto `storageKey`) mudar.
    setPaginatedQueryInternal(getInitialState());
  }, [getInitialState]); // getInitialState é useCallback e depende de memoizedDefaultQuery

  // Efeito para SALVAR no localStorage quando partes relevantes de paginatedQuery mudarem
  useEffect(() => {
    const currentStorageKey = memoizedDefaultQuery?.storageKey;
    if (currentStorageKey && typeof window !== "undefined") {
      const stateToStore: StoredPaginatedState<TFilter> = {
        pageIndex: paginatedQuery.pageIndex,
        pageSize: paginatedQuery.pageSize,
        orderBy: paginatedQuery.orderBy,
        filter: paginatedQuery.filter!,
      };
      try {
        localStorage.setItem(currentStorageKey, JSON.stringify(stateToStore));
      } catch (error) {
        console.error(
          `Erro ao salvar estado no localStorage (key: ${currentStorageKey}):`,
          error,
        );
      }
    }
  }, [
    paginatedQuery.pageIndex,
    paginatedQuery.pageSize,
    paginatedQuery.orderBy,
    paginatedQuery.filter,
    memoizedDefaultQuery?.storageKey, // Inclui storageKey para salvar na chave correta se ela mudar
  ]);

  const handleProcessing = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 700);
  }, []);

  const handlePaginatedQuery = useCallback(
    (
      updater:
        | Partial<PaginatedQueryProps<TFilter>>
        | ((
            prev: PaginatedQueryProps<TFilter>,
          ) => PaginatedQueryProps<TFilter>),
    ) => {
      setPaginatedQueryInternal((prev) => {
        const newState =
          typeof updater === "function"
            ? updater(prev)
            : { ...prev, ...updater };
        return newState;
      });
    },
    [],
  );

  const handleFilterChange = useCallback(
    (newFilterData: TFilter) => {
      handlePaginatedQuery((prev) => ({
        ...prev,
        filter: newFilterData,
        pageIndex: 1,
      }));
    },
    [handlePaginatedQuery],
  );

  const handleResetFilter = useCallback(() => {
    const defaultFilterValue = reviveFilterData<TFilter>(
      memoizedDefaultQuery?.filter || (null as TFilter),
    );
    handlePaginatedQuery((prev) => ({
      ...prev,
      pageIndex: 1,
      pageSize: memoizedDefaultQuery?.pageSize || 10,
      orderBy: memoizedDefaultQuery?.orderBy,
      filter: defaultFilterValue,
    }));
  }, [memoizedDefaultQuery, handlePaginatedQuery]);

  const handleOrderByChange = useCallback(
    (newOrderBy: { name: string; ascOrDesc: string }) => {
      handlePaginatedQuery((prev) => ({
        ...prev,
        orderBy: newOrderBy,
        pageIndex: 1,
      }));
      handleProcessing();
    },
    [handlePaginatedQuery, handleProcessing],
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
