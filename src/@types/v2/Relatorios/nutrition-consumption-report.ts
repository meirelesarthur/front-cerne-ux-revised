// src/@types/v2/Relatorios/nutrition-consumption-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Nutrição/Lote" (F-288, esteira
// CORE_WORKSPACE/97-Esteiras/053, TASK-288-FE-01) — mirror ESTRUTURAL de
// `management-batch-report.ts` (F-279, flat, não Module/Entity aninhado), 2
// selects independentes SEM cascata (contrato legado §6 `filter_manifest`,
// dimensão "cascatas" = `NAO_APLICAVEL`, roteiro-front-F288-nutricao.md
// FID-G3F).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`, commit `d7e5d3ddd`), não adivinhados a
// partir do roteiro:
//   - `app/Http/Resources/V1/CategoryAnimalOptionResource.php`
//     ({uuid,label,is_reproductive,requires_reproductive_status} — front só
//     lê `uuid`/`label`, mesmo tratamento que `ManagementBatchCategoryRef`/
//     F-279 já dá ao MESMO Resource)
//   - `app/Http/Resources/V1/BatchOptionResource.php` ({uuid,label})
//   - `app/Http/Requests/Api/V1/NutritionConsumptionReportRequest.php`
//
// Tipos NOVOS e nomeados (`NutritionConsumption*`), mesmo shape
// `{uuid,label}` dos irmãos `ManagementBatchCategoryRef`/
// `ManagementBatchBatchRef` (F-279) — SEM import cross-feature (mesma
// disciplina já seguida por todas as telas da esteira 053).
//
// Query params reais enviados ao endpoint de download (`GET
// /nutrition-consumption-report`,
// `NutritionConsumptionReportRequest::rules()`): `batch`/`category` (nomes
// de query string preservados do legado, CL-23) — NÃO `batch_uuid`/
// `category_uuid`. `format` reusa o catálogo GLOBAL `ReportFormat` de
// `@/@types/v2/AccountsReports` (achado decisivo do roteiro-front-F288:
// `LoteFornecedor`, domínio Estoque, já reusa o mesmo tipo/catálogo fora de
// Financeiro — nenhum catálogo de formato próprio por domínio).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface NutritionConsumptionCategoryRef {
  uuid: string;
  label: string;
}

export interface NutritionConsumptionBatchRef {
  uuid: string;
  label: string;
}

export interface NutritionConsumptionReportOptionsData {
  /** categorias do catálogo global (`category_animals`, sem tenant-scope próprio), sem AJAX. */
  categories: NutritionConsumptionCategoryRef[];
  /** lotes da fazenda ativa (`batches`, tenant-scoped via farm), sem AJAX. */
  batches: NutritionConsumptionBatchRef[];
}

export interface NutritionConsumptionReportFilterForm {
  category: Option<string> | null;
  batch: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `NutritionConsumptionReportRequest::rules()`. */
export interface NutritionConsumptionReportParams {
  category?: string;
  batch?: string;
  start_date: string;
  end_date: string;
  format: ReportFormat;
}
