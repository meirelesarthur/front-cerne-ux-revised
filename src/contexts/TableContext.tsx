import { ChangeEvent, createContext, Dispatch, ReactNode, SetStateAction, useEffect } from 'react';

import {
  ColumnDef,
  ColumnOrderState,
  getCoreRowModel,
  getExpandedRowModel,
  OnChangeFn,
  Row,
  RowSelectionState,
  Table,
  TableOptions,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import { PaginationProps } from '@/@types/pagination';

interface TableProviderProps extends Omit<
  TableOptions<any>,
  'data' | 'columns' | 'getCoreRowModel'
> {
  children: ReactNode;
  data: any[] | undefined;
  columns: ColumnDef<any, any>[];
  pagination?: PaginationProps;
  setPagination?: Dispatch<SetStateAction<any>>;
  hasFooter?: boolean;
  getRowCanExpand?: (row: Row<any>) => boolean;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: Dispatch<SetStateAction<VisibilityState>>;
  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  rowSelection?: RowSelectionState;
  options?: Omit<TableOptions<any>, 'data' | 'columns' | 'getCoreRowModel' | 'pageCount'>;
}

interface TableContextProps {
  table: Table<any>;
  pagination?: PaginationProps;
  onSelectPage: (event: ChangeEvent<HTMLSelectElement>) => void;
  hasFooter?: boolean;
}

const TableContext = createContext({} as TableContextProps);

function TableProvider({
  children,
  data = [],
  columns,
  pagination,
  setPagination,
  hasFooter = false,
  columnVisibility,
  setColumnVisibility,
  columnOrder,
  onColumnOrderChange,
  rowSelection,
  options,
  ...rest
}: TableProviderProps) {
  const table = useReactTable({
    data,
    columns,
    pageCount: pagination?.pagesCount ? pagination.pagesCount + 1 : -1,

    state: {
      ...options?.state,
      pagination: {
        pageIndex: pagination?.pageIndex ?? 0,
        pageSize: pagination?.pageSize ?? (data.length || 10),
      },
      columnVisibility,
      columnOrder,
      // Só controla a seleção quando a tela passa `rowSelection`; passar
      // `undefined` a tornaria controlada e quebraria `getSelectedRowModel()`.
      ...(rowSelection !== undefined ? { rowSelection } : {}),
    },
    ...options,
    ...rest,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: onColumnOrderChange,
    onPaginationChange: setPagination ? setPagination : undefined,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: !!pagination,
    autoResetPageIndex: false,
  });
  const pageIndex = table.getState().pagination.pageIndex;

  function handleSelectPage(event: ChangeEvent<HTMLSelectElement>) {
    const newPageSize = Number(event.target.value);
    const newPageCount =
      pagination?.totalRecords && Math.ceil(pagination?.totalRecords / newPageSize);
    let newPageIndex = pageIndex;
    if (newPageCount && pageIndex >= newPageCount) {
      newPageIndex = newPageCount - 1 === 0 ? 1 : newPageCount - 1;
    }
    if (setPagination) {
      table.setPageSize(newPageSize);
      setPagination({
        pageSize: newPageSize,
        pageIndex: newPageIndex,
      });
      table.setPageIndex(newPageIndex);
    }
  }

  useEffect(() => {
    table.resetRowSelection();
  }, [(pagination as any)?.filter]);

  return (
    <TableContext.Provider
      value={{
        table,
        pagination,
        onSelectPage: handleSelectPage,
        hasFooter,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

export { TableContext, TableProvider };
