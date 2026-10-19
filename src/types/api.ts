/**
 * Types - API Responses
 *
 * Tipos padronizados para respostas da API V2
 * Baseado no guia de migração da API V2
 */

/**
 * Resposta base da API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  statusCode: number;
}

/**
 * Resposta paginada da API
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  totalRecords: number;
  pagesCount: number;
}

/**
 * Estrutura de erro padronizada
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Parâmetros de ordenação
 */
export interface SortParams<T = string> {
  sortBy?: T;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parâmetros de busca/filtro
 */
export interface SearchParams {
  search?: string;
}

/**
 * Combinação completa de parâmetros de query
 */
export type QueryParams<TSortBy = string> =
  & PaginationParams
  & SortParams<TSortBy>
  & SearchParams;
