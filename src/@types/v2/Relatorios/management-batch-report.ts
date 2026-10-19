// src/@types/v2/Relatorios/management-batch-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Manejo/Lote" (F-279, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-279-FE-01) — fan-out do canário F-298
// (`production-costing-area-report.ts`). Mirror ESTRUTURAL (flat, não
// Module/Entity aninhado), 2 selects independentes SEM cascata (contrato
// legado §6 `filter_manifest`, dimensão "cascatas" = `NAO_APLICAVEL`).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`), não adivinhados a partir do roteiro:
//   - `app/Http/Resources/V1/CategoryAnimalOptionResource.php`
//   - `app/Http/Resources/V1/BatchOptionResource.php`
//   - `app/Http/Requests/Api/V1/ManagementBatchReportRequest.php`
//   - `app/Data/Reports/ManagementBatchReport/ManagementBatchReportFilterData.php`
//
// RISCO CRÍTICO DE NOMENCLATURA (mesma classe de risco já documentada no
// canário F-298 — `areas[]` vs `area_uuids[]`): o roteiro-front-F279 descreve
// os Option Refs como `{ uuid; description }`, mas os DOIS Resources reais
// devolvem `{ uuid; label }` (`label` = alias de `description`/`code` no
// servidor, campo de EXIBIÇÃO já resolvido) — usar `description` aqui faria
// `TypeScript` aceitar em tempo de compilação (campo inexistente vira
// `undefined` silencioso) e o Select renderizaria opções vazias. Este arquivo
// segue o contrato REAL (`CategoryAnimalOptionResource::toArray()` /
// `BatchOptionResource::toArray()`), não o texto informal do roteiro.
//
// Query params reais enviados ao endpoint de download (`GET
// /management-batch-report`, `ManagementBatchReportRequest::rules()`):
// `category`/`batch` (nomes de query string do legado, CL-23) — NÃO
// `category_uuid`/`batch_uuid` (esses são só os nomes internos das
// propriedades do DTO server-side, resolvidos via `#[MapInputName('batch')]`
// / `#[MapInputName('category')]` por propriedade, não pelo `SnakeCaseMapper`
// de classe sozinho).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface ManagementBatchCategoryRef {
  uuid: string;
  label: string;
}

export interface ManagementBatchBatchRef {
  uuid: string;
  label: string;
}

export interface ManagementBatchReportOptionsData {
  /** LK-01 — categorias filtradas por centro de custo do tenant, sem AJAX. */
  categories: ManagementBatchCategoryRef[];
  /** LK-02 — lotes ATIVOS da fazenda (farm-scoped via HasFarmTenantScope), sem AJAX. */
  batches: ManagementBatchBatchRef[];
}

export interface ManagementBatchReportFilterForm {
  category: Option<string> | null;
  batch: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `ManagementBatchReportRequest::rules()`. */
export interface ManagementBatchReportParams {
  category?: string;
  batch?: string;
  start_date: string;
  end_date: string;
}
