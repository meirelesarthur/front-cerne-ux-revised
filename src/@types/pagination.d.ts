export interface PaginationQueryParams {
  page?: number;
  per_page?: number;
  filter?: string;
  orderBy?: {
    name: string;
    ascOrDesc: string;
  };
  groupBy?: string[];
}

export interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  pagesCount: number;
  totalRecords: number;
}

export interface PaginatedQueryProps<T = any> extends PaginationProps {
  filter?: T;
  orderBy?: {
    name: string;
    ascOrDesc: string;
  };
  groupBy?: string[];
}
