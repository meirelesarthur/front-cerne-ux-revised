// src/@types/v2/Relatorios/costing-livestock-area-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Custeio/Área Pecuária" (F-251,
// CusteioAreaPecuaria-contrato-api.md §4/§5/§7, lote 076). Mirror ESTRUTURAL
// de `production-costing-area-report.ts` (F-298, precedente estrutural mais
// próximo — mesma cascata client-side IG-01, mesmo par produção_cycle/
// areas), ACRESCIDO do 3º universo de options desta tela: `grazings`
// (Módulo de Pastejo), que NÃO participa da cascata (contrato §5c —
// `ProductionCycleOptionResource::areas` não embute `grazings`).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`):
//   - `app/Http/Resources/V1/ProductionCycleOptionResource.php` (LK-03,
//     reusado sem alteração — `uuid`/`code`/`start_date`/`end_date`/`areas[]`)
//   - `app/Http/Resources/V1/AreaOptionResource.php` (LK-01 —
//     `uuid`/`description`/`productive_area`)
//   - `app/Http/Resources/V1/GrazingOptionResource.php` (LK-02 —
//     `uuid`/`description`)
//   - `app/Http/Requests/Api/V1/CostingLivestockAreaReportRequest.php`
//     (`start_date`/`end_date` obrigatórios; `production_cycle_uuid`/
//     `area_uuids[]`/`grazing_uuids[]` opcionais)
//
// RISCO CRÍTICO DE NOMENCLATURA (mirror do irmão F-298): a Request real usa
// `production_cycle_uuid`/`area_uuids[]`/`grazing_uuids[]` — NÃO
// `production_cycle`/`areas`/`grazings` como o texto informal do task-packet
// nomeia os campos pela EXIBIÇÃO. `production_cycle_uuid` é aceito e
// IGNORADO em silêncio pela Action server-side (fidelidade ao legado, IG-01
// — o ciclo só alimenta a cascata CLIENT-SIDE de datas/áreas antes do
// submit); a SPA ainda o envia para reconciliação de contrato/telemetria
// futura.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface CostingLivestockAreaRef {
  uuid: string;
  description: string;
  productive_area: number;
}

export interface CostingLivestockGrazingRef {
  uuid: string;
  description: string;
}

export interface CostingLivestockProductionCycleOptionRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata IG-01 100% client-side, sem
   *  endpoint dedicado. NÃO inclui `grazings` (contrato §5c). */
  areas: { uuid: string; description: string }[];
}

export interface CostingLivestockAreaReportOptionsData {
  productionCycles: CostingLivestockProductionCycleOptionRef[];
  /** Universo COMPLETO (LK-01) — carregado inteiro, sem paginação/busca no servidor. */
  areas: CostingLivestockAreaRef[];
  /** Universo COMPLETO (LK-02) — carregado inteiro, sem paginação/busca no
   *  servidor. NÃO participa da cascata IG-01 (contrato §5c). */
  grazings: CostingLivestockGrazingRef[];
}

export interface CostingLivestockAreaReportFilterForm {
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  grazings: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `CostingLivestockAreaReportRequest::rules()`. */
export interface CostingLivestockAreaReportParams {
  production_cycle_uuid?: string;
  area_uuids?: string[];
  grazing_uuids?: string[];
  start_date: string;
  end_date: string;
}
