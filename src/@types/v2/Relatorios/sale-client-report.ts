// src/@types/v2/Relatorios/sale-client-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Cliente/Produto" (F-313, esteira
// CORE_WORKSPACE/97-Esteiras/054, roteiro-front-F313-cliente-produto.md).
// Mirror ESTRUTURAL de `sale-product-report.ts` (F-315, irmão em produção),
// acrescentando `client_uuid` — mesmo casco "Dre-style" (download-only, SEM
// prévia).
//
// Shapes confirmados por leitura DIRETA do contrato de API já materializado
// (roteiro-api-F313-cliente-produto.md §Tarefa 1 / §Endpoint):
//   - `GET /api/v1/sales-client-report` — binário `application/pdf`/`xlsx`
//   - `type: int` (`0`=PDF default | `1`=Excel), mirror `SaleReportFilterData`
//
// DECISÃO DE TIPO (mirror roteiro-front-F315 §"Decisão de tipo"): `type` é
// `0 | 1` (`number`), NÃO `'pdf' | 'xlsx'` (`string`).
//
// `client_uuid`/`product_uuid` reusam `Option<string>` (os lookups em si são
// `listClientOptions`/`ClientOptionItem`
// (`@/services/v2/CadastrosBase/Client/client-service.ts`) e
// `listProductOptions`/`ProductOptionItem`
// (`@/services/v2/Products/product-service.ts`) já existentes — nenhum tipo
// de Ref duplicado aqui).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface SaleClientReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  client_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  /** `0` = PDF (default) | `1` = Excel — mirror `SaleReportFilterData.type`. */
  type: 0 | 1;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `SaleReportRequest::rules()`. */
export interface SaleClientReportParams {
  start_date: string;
  end_date: string;
  client_uuid?: string;
  product_uuid?: string;
  type: 0 | 1;
}
