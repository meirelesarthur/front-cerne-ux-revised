// src/@types/v2/Livestock/findAnimal/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Localizar Animal" (FindAnimal — Operacional > Pecuária >
// Manejo, F-042). Fiel ao contrato de tela §5.1/§5.2
// (`contrato-tela-lane-a-find-animal-frontend.md`) e ao contrato de API §6
// (`contrato-api-lane-a-find-animal.md`), campo a campo. Mirror estrutural de
// `src/@types/v2/Batches/index.d.ts` (envelope cru + sub-objetos aninhados
// tipados separadamente).
//
// Nulabilidade EXATA da tabela §5.1 do contrato de tela: todos os blocos são
// `| null` (`reproductive`, `batch`, `grazing`, `area`, `mother`) EXCETO
// `animal` (sempre presente) e `current_batches` (array, pode ser `[]`, nunca
// `null`). `uuid` sempre presente nos sub-objetos identificáveis; `id`
// sequencial NUNCA exposto.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ---- EP-FA-02 — GET /api/v1/find-animals/{animal_uuid} — dossiê ----------

/** `data.animal.category` — nunca nulo (sempre presente no bloco `animal`). */
export interface FindAnimalCategoryRef {
  uuid: string;
  label: string;
}

/** Bloco principal do dossiê — o ÚNICO obrigatório, sempre presente. */
export interface FindAnimalAnimal {
  uuid: string;
  /** Pode valer `'S/ID'` ou vir concatenada por `' - '` — exibir cru, sem reprocessar. */
  identification: string;
  /** String já formatada pela API (ex.: "2 anos, 3 meses e 10 dias"). Não recalcular, não pluralizar. */
  age: string | null;
  weight: number;
  /** Texto livre (coluna `father`, NÃO a relação `dad()`). */
  father: string | null;
  category: FindAnimalCategoryRef;
}

/** `data.reproductive.category_matrix` — `null` quando ausente. */
export interface FindAnimalCategoryMatrixRef {
  uuid: string;
  label: string;
}

/** `data.reproductive.reproductive_status` — `label: null` quando fora de `[1,2,3]`/falsy. */
export interface FindAnimalReproductiveStatusRef {
  value: number;
  label: string | null;
}

/** Bloco inteiro é `null` quando `category_id` do animal está fora de `[1,2,3]` (literal resolvido na API — o front NÃO reimplementa a condição). */
export interface FindAnimalReproductive {
  category_matrix: FindAnimalCategoryMatrixRef | null;
  reproductive_status: FindAnimalReproductiveStatusRef | null;
  /** `null` quando não houver — vira STRING VAZIA na tela, nunca "Não Informado". */
  last_semen: string | null;
}

/** Item de `data.current_batches[]` — lista read-only ("Lote Atual"), nunca `<select>`. */
export interface FindAnimalCurrentBatchRef {
  uuid: string;
  label: string;
}

/** `data.batch` — `null` quando o animal não tem lote vinculado. */
export interface FindAnimalBatch {
  uuid: string;
  description: string;
  /** String com zero-pad (ex.: `"0007"`) — exibir cru. */
  code: string;
  /** Inteiro cru, sem separador de milhar. */
  quantity_animal: number;
  /** `null` → exibir `--` (placeholder da SPA, a API nunca manda o traço). */
  employee_name: string | null;
}

/** `data.grazing.fodder` — sub-referência do módulo (Forragem). */
export interface FindAnimalFodderRef {
  uuid: string;
  label: string;
}

/** `data.grazing` — sub-bloco "Módulo", `null` quando ausente. */
export interface FindAnimalGrazing {
  uuid: string;
  description: string;
  fodder: FindAnimalFodderRef;
}

/** `data.area` — sub-bloco "Área", `null` quando ausente. `recreation_area` preserva `0`/`1` cru (D2, GAP-FE-FA-02) — nunca traduzido para Sim/Não. */
export interface FindAnimalArea {
  uuid: string;
  description: string;
  total_area: number;
  recreation_area: number;
  productive_area: number;
  unproductive_area: number;
}

/** `data.mother` — bloco "Mãe", `null` quando ausente. Vem de `birth->mother`, nunca de `animal_mother_id`. */
export interface FindAnimalMother {
  uuid: string;
  identification: string;
  age: string | null;
  weight: number;
  category: FindAnimalCategoryRef;
}

/** Envelope de dados do dossiê (`Response<FindAnimalData>['data']`). */
export interface FindAnimalData {
  animal: FindAnimalAnimal;
  reproductive: FindAnimalReproductive | null;
  /** Array — pode ser vazio, NUNCA `null`. */
  current_batches: FindAnimalCurrentBatchRef[];
  batch: FindAnimalBatch | null;
  grazing: FindAnimalGrazing | null;
  area: FindAnimalArea | null;
  mother: FindAnimalMother | null;
}

// ---- EP-FA-04 — POST /api/v1/find-animals/{animal_uuid}/batch-transfer ---

/** Corpo EXATO do POST de transferência — nenhum outro campo é aceito (nunca `farm_id`/`animal_id`/`user_id`/`date`/`code`/`employee_id`/`note`). */
export interface FindAnimalBatchTransferRequest {
  batch_uuid: string;
}

/**
 * Estado do formulário de transferência (`BatchTransferForm.tsx`, TASK-FA-FE-05)
 * — Select sob `<Controller>`, valor em `Option<string>` (padrão Lei 1). O
 * wrapper de submit (Lei 3) resolve para `{ batch_uuid: data.batch.value }`
 * antes de chamar `transferAnimalBatch`.
 */
export interface FindAnimalBatchTransferForm {
  batch: Option<string> | null;
}
