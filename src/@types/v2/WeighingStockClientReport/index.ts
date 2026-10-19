// src/@types/v2/WeighingStockClientReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Pesagem/Armazém/Cliente" (F-337, execução 059,
// `CORE_WORKSPACE/97-Esteiras/059/CONTRATOS/CONTRATO-F337-pesagem-armazem-
// cliente.md`). Mirror ESTRUTURAL de `@/@types/v2/StockAbcReport` (mesma
// casca de tela download-only, SEM grid/prévia).
//
// `WeighingStockClientReportFormat` é um enum PRÓPRIO deste módulo — NUNCA
// reusar `ReportFormat` de `@/@types/v2/AccountsReports` nem
// `StockAbcReportFormat` de `@/@types/v2/StockAbcReport` (aquele é
// 'pdf'|'excel'). A API de F-337 (`WeighingStockClientReportRequest::rules()`,
// `Rule::in(['pdf','xlsx'])`) espera EXATAMENTE 'pdf'|'xlsx' sob a chave
// `format` — mesmo domínio/chave de `AccountsReports`, mas isolado aqui por
// convenção (cada relatório define seu próprio tipo, ver docblock de
// `StockAbcReportFormat`).
//
// DIVERGÊNCIA RESOLVIDA (DEC-267, esteira 060, ROTEIRO-F337-FRONT.md): os 3
// campos `product`/`client`/`warehouse` eram VALIDADOS pela API mas nunca
// aplicados como filtro na query (D-02/FUP-337-01, execução 059). O dono
// decidiu RE-ATIVAR os 3 como filtros OPCIONAIS (vazio = relatório completo)
// — a ativação do lado API é responsabilidade de ROTEIRO-F337-API.md
// (esteira 060, coordenada). Esta tela agora expõe os 3 selects; nenhum é
// obrigatório (`Option<string> | null`, omitido do payload quando vazio).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type WeighingStockClientReportFormat = 'pdf' | 'xlsx'; // chave EXATA do FormRequest da API

export interface WeighingStockClientReportFilterForm {
  product: Option<string> | null; // opcional — DEC-267
  client: Option<string> | null; // opcional — DEC-267
  warehouse: Option<string> | null; // opcional — DEC-267
  format: Option<WeighingStockClientReportFormat> | null;
}

export interface WeighingStockClientReportParams {
  product?: string; // uuid — chave EXATA do FormRequest da API; omitido quando vazio
  client?: string; // uuid — chave EXATA do FormRequest da API; omitido quando vazio
  warehouse?: string; // uuid — chave EXATA do FormRequest da API; omitido quando vazio
  format: WeighingStockClientReportFormat; // chave EXATA do FormRequest da API
}
