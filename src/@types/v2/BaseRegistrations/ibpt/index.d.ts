// src/@types/v2/BaseRegistrations/ibpt/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo IBPT (Tabela Fiscal de Incidência Tributária) — API v1 do
// backend Laravel GB.Cerne, execução 032, TASK-FE-2410. Catálogo GLOBAL (sem
// `farm_id`/tenancy — mesma exceção de `Bank`/`SystemUpdate`, contrato de
// tela §1/contrato de API §5).
//
// Fonte: contrato de tela `contrato-front-ibpt.md` §6.1 (CONTRATO_AUTOAPROVADO).
//
// `show === index` no shape (alias estrutural, sem agregação extra) — mesmo
// padrão de `SystemUpdateDetail`/`WarehouseDetail`.
//
// Payload de import NÃO é um DTO JSON — é `FormData` (file + uf + versao),
// ver `ibpt-service.ts`. `IbptImportFormValues` existe só para o estado do
// FORMULÁRIO (RHF), sem o campo `file` (fica em `useState` separado, o
// componente `FileUpload` não é um campo RHF registrado).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// IBPT (resposta da API)
// ============================================

export interface IbptListItem {
  uuid: string;
  /** sigla de 2 letras (Enum `Uf` do backend, serializado como string). */
  uf: string;
  versao: string;
  /** "N. Registros" — `withCount('items')`, contrato de API §8. */
  items_count: number;
  created_at: string | null;
  updated_at: string | null;
}

// show === index no shape (contrato de API §11, IbptResource) — alias estrutural.
export type IbptDetail = IbptListItem;

export interface IbptItemListItem {
  uuid: string;
  codigo: string;
  /** §17.2 do contrato de API: sempre '' /null até decisão do dev (default fiel). */
  descricao: string | null;
  /** `decimal:2` do backend serializa como string (ex.: "12.34"). */
  nacional_federal: string;
  importado_federal: string;
  estadual: string;
  municipal: string;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload de import é `FormData` (file + uf + versao) — ver `ibpt-service.ts`.
// Este tipo existe só para o estado do FORMULÁRIO (RHF), sem `file`.
export interface IbptImportFormValues {
  uf: Option<string> | null;
  versao: string;
}

// Sem IbptFilterForm — esta Listagem não tem filtro (contrato de tela §7.1,
// default omitir: dataset estruturalmente pequeno, máximo 27 linhas).

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface IbptApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface IbptsListEnvelope {
  success: boolean;
  message: string;
  data: IbptListItem[];
  errors: Record<string, string[]> | null;
  meta: IbptApiPaginationMeta | null;
}

export interface IbptItemsListEnvelope {
  success: boolean;
  message: string;
  data: IbptItemListItem[];
  errors: Record<string, string[]> | null;
  meta: IbptApiPaginationMeta | null;
}
