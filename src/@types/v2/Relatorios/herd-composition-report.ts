// src/@types/v2/Relatorios/herd-composition-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Composição Rebanho" (F-269, lote 079,
// F-269-plano-frontend.md §6 TASK-F269-FE-01) — mirror ESTRUTURAL de
// `nutrition-consumption-report.ts` (F-288, flat, não Module/Entity
// aninhado) para o par `options()`, e de `DeathAnimalReport`/`AccountsReports`
// (`ReportColumnsField` + `order`/`order_direction`/`report_type`) para o
// bloco de colunas/ordenação/formato.
//
// Nomes de campo CONFIRMADOS por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`, TASK-F269-BE-03 concluída) — NÃO os nomes
// assumidos no plano (`batch_id`/`breed_id`/`category_id`):
//   - `app/Http/Requests/Api/V1/HerdCompositionReportRequest.php::rules()`:
//     `batch` (uuid OU literal `"0"` = "Sem lote", NUNCA `batch_id`),
//     `gender`, `breed_uuid` (NUNCA `breed_id`), `category_uuid` (NUNCA
//     `category_id`), `start_date`, `end_date`, `weight_min`, `weight_max`,
//     `status`, `columns` (`required|array|min:1`), `order`, `order_direction`,
//     `report_type` (enum `pdf|excel` — NUNCA `type_report`/`format`, CL-24).
//   - `app/Http/Resources/V1/{Batch,Breed,CategoryAnimal}OptionResource.php`:
//     todos `{uuid,label}` (`CategoryAnimalOptionResource` acrescenta
//     `is_reproductive`/`requires_reproductive_status`, não consumidos aqui).
//   - `app/Enums/Reports/HerdCompositionReportColumn.php`: 18 chaves (CL-14)
//     + `sortableValues()` (10 chaves, CL-16).
//   - `app/Enums/Reports/HerdCompositionReportOutputType.php`: `pdf|excel`.
//
// `batch`/`breed`/`category` no FORM são `Option<string>|null` — o VALOR
// (`.value`) já é o `uuid` esperado pela API; `gender`/`status` reaproveitam
// os enums GLOBAIS já existentes (`CategoryAnimalGender`/`AnimalStatusValue`,
// mesmos tipos consumidos por `genderOptions`/`animalStatusOptions`).
// `order_direction` usa union PRÓPRIA (`asc`/`desc`) — NUNCA reusa
// `ReportOrderDirection`/`reportOrderDirectionOptions` de
// `@/@types/v2/AccountsReports` (cross-feature import, domínio distinto,
// mesma disciplina de `death-animal-report-format-options.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { AnimalStatusValue } from '@/@types/v2/Animals';
import type { CategoryAnimalGender } from '@/@types/v2/CategoryAnimals';

export interface HerdCompositionBatchRef {
  uuid: string;
  label: string;
}

export interface HerdCompositionBreedRef {
  uuid: string;
  label: string;
}

export interface HerdCompositionCategoryRef {
  uuid: string;
  label: string;
}

export interface HerdCompositionReportOptionsData {
  /** Lotes ACTIVE da fazenda ativa (`BatchRepository::listOptionsForFarm`, LK-01). */
  batches: HerdCompositionBatchRef[];
  /** Raças `is_enabled` do catálogo GLOBAL (`BreedRepository::listOptions`, LK-02). */
  breeds: HerdCompositionBreedRef[];
  /** Categorias do TENANT ativo (`CategoryAnimalRepository::listOptionsForTenantCostCenter`, LK-03). */
  categories: HerdCompositionCategoryRef[];
}

/** As 18 colunas de saída (CL-14/LM-01..LM-18), ordem = ordem do contrato. */
export type HerdCompositionReportColumnKey =
  | 'identification'
  | 'father'
  | 'category_description'
  | 'breed_description'
  | 'batch'
  | 'farm'
  | 'gender'
  | 'birth_date'
  | 'age'
  | 'weight'
  | 'start_weight'
  | 'last_weighing'
  | 'gmd'
  | 'nutrition'
  | 'sanitary_total'
  | 'status'
  | 'entry_date'
  | 'note';

/** As 10 chaves sortable (`HerdCompositionReportColumn::sortableValues()`, CL-16). */
export type HerdCompositionReportOrderKey =
  | 'identification'
  | 'category_description'
  | 'breed_description'
  | 'gender'
  | 'birth_date'
  | 'weight'
  | 'last_weighing'
  | 'gmd'
  | 'status'
  | 'entry_date';

export type HerdCompositionReportOrderDirection = 'asc' | 'desc';

/** Mirror `HerdCompositionReportOutputType` — enum PRÓPRIO, NUNCA reusar `ReportFormat` de AccountsReports (domínios distintos). */
export type HerdCompositionReportFormat = 'pdf' | 'excel';

/** Forma INTERNA do form (Option-based, react-select) — NÃO o payload final do service. */
export interface HerdCompositionReportFilterForm {
  batch: Option<string> | null;
  gender: Option<CategoryAnimalGender> | null;
  breed: Option<string> | null;
  category: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  weight_min: number | null;
  weight_max: number | null;
  status: Option<AnimalStatusValue> | null;
  columns: HerdCompositionReportColumnKey[];
  order: Option<HerdCompositionReportOrderKey> | null;
  order_direction: Option<HerdCompositionReportOrderDirection> | null;
  /** Campo do FORM chama-se `format` (mirror UX dos irmãos); o parâmetro real enviado é `report_type`. */
  format: Option<HerdCompositionReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `HerdCompositionReportRequest::rules()`. */
export interface HerdCompositionReportParams {
  batch?: string;
  gender?: CategoryAnimalGender;
  breed_uuid?: string;
  category_uuid?: string;
  start_date?: string;
  end_date?: string;
  weight_min?: number;
  weight_max?: number;
  status?: AnimalStatusValue;
  columns: HerdCompositionReportColumnKey[];
  order?: HerdCompositionReportOrderKey;
  order_direction?: HerdCompositionReportOrderDirection;
  report_type?: HerdCompositionReportFormat;
}
