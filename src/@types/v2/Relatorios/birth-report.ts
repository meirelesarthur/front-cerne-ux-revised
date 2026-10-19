// src/@types/v2/Relatorios/birth-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Nascimentos" GENÉRICO (F-236, esteira
// CORE_WORKSPACE/97-Esteiras/053, TASK-053-236-FE-01) — namespace FLAT já
// estabelecido por 11+ relatórios existentes (`management-batch-report.ts`,
// `sale-product-report.ts`, `costing-batch-report.ts`, etc.), NÃO o padrão
// de pasta dedicada por feature usado pelo irmão F-235/052
// (`BirthAnimalSisbovReport/`) — F-236 mirra o precedente estrutural mais
// próximo e mais numeroso (`ManagementBatchReport`, mesma família de
// relatórios de Pecuária com `/options`).
//
// Distinto do irmão SISBOV (F-235, execução 052): aquele é só-PDF com datas
// opcionais e sem filtro de categoria; este é PDF+Excel, datas obrigatórias,
// com Select de categoria — contrato de tela diferente.
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`, branch `feature/053-relatorios`), não
// adivinhados a partir do roteiro:
//   - `app/Http/Controllers/Api/V1/BirthReportController.php`
//   - `app/Http/Requests/Api/V1/BirthReportRequest.php`
//   - `app/Http/Resources/V1/CategoryAnimalOptionResource.php`
//   - `routes/api.php:4455-4468`
//
// RISCO DE NOMENCLATURA (mesma classe de risco já documentada no fan-out
// F-279/F-298): o param real do wire é `category_uuid`, **NÃO** `category`
// (nome usado pelo irmão estrutural `ManagementBatchReportRequest`) — o DTO
// `BirthReportFilterData` mapeia `category_uuid` 1:1, sem alias/
// `#[MapInputName]`. `CategoryAnimalOptionResource::toArray()` devolve
// `{uuid,label,is_reproductive,requires_reproductive_status}` — esta tela só
// consome `uuid`/`label` (os 2 campos extras não têm uso aqui, mas não devem
// ser removidos da interface por completude de contrato).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface BirthReportCategoryRef {
  uuid: string;
  label: string;
  is_reproductive: boolean;
  requires_reproductive_status: boolean;
}

export interface BirthReportOptionsData {
  /** Categorias `is_enabled=true` (fix CLM-10 — filtro já aplicado no servidor,
   * sem filtragem client-side adicional). */
  categories: BirthReportCategoryRef[];
}

export interface BirthReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  category_uuid: Option<string> | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `BirthReportRequest::rules()`. */
export interface BirthReportParams {
  start_date: string;
  end_date: string;
  category_uuid?: string;
  format: ReportFormat;
}
