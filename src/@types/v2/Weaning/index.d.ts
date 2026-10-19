// src/@types/v2/Weaning/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de DESMAMA (Weaning — Operacional > Pecuária > Manejo).
//
// Fonte: leitura DIRETA do fork `GB.Cerne.Api` (TASK-WN-FE-01/02/03/04) —
// `app/Http/Resources/V1/WeaningResource.php`, `app/Http/Requests/Api/V1/
// WeaningRequest.php`, `app/Data/Weaning/{WeaningData,WeaningFilterData}.php`,
// `app/Actions/Weaning/*.php` — NÃO é inferência do contrato legado nem do
// roteiro `02-arquitetura-frontend-desmama.md` (o roteiro assumiu alguns
// nomes de campo que o código real corrige, ver notas abaixo).
//
// `uuid` sempre, `id` NUNCA aparece no envelope.
//
// Correções confirmadas contra o código real da API (divergem do roteiro):
//   - Resource devolve `type_label` (string, já traduzido no servidor) além
//     de `type` (número 1|2, `WeaningTypeEnum`).
//   - `responsible` (NÃO `user`) é o nome do campo do responsável.
//   - Filtro é `responsible_uuid` (`WeaningFilterData`), NÃO `user_uuid`.
//   - `animal_uuids` (form/payload) são uuids de `App\Models\Animal` — a MÃE
//     selecionada para a desmama, NÃO o bezerro (`WeaningData` real,
//     `LookupAnimalsForWeaningAction`).
//   - `animals[]` do Resource (detalhe) é a lista de vínculos
//     `animals_weanings` (bezerro), cada item com `uuid` do BirthAnimal +
//     `mother`/`newborn` resumidos — NÃO é a mesma coisa que `animal_uuids`.
//     Para re-hidratar o multi-select de `animal_uuids` em modo editar, usa-se
//     `animals[].mother.uuid`/`.identification` (a MÃE), nunca `animals[].uuid`.
//   - `animals`/`movement_sale` só vêm preenchidos no DETALHE
//     (`WeaningRepository::DETAIL_RELATIONS`) — a LISTAGEM não carrega essas
//     relações (`whenLoaded` omite a chave inteira, não devolve `null`).
//     Por isso são opcionais aqui (`?`), nunca assumir presentes na grid.
//   - `WeaningRequest::rules()` real NÃO usa PATCH parcial: `date`/
//     `batch_uuid`/`animal_uuids` são `required` também no update (só `type`/
//     `code` são imutáveis) — `UpdateWeaningRequest` reflete isso.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `WeaningTypeEnum` (backend, backed int) — 1=Recria, 2=Venda. */
export type WeaningTypeValue = 1 | 2;

/** Status do Processing vinculado (aditivo da API, esteira 126). */
export type WeaningProcessingStatus = 'PENDING' | 'FINISHED' | null;

export interface WeaningPersonRef {
  uuid: string;
  name: string;
}

export interface WeaningBatchRef {
  uuid: string;
  description: string;
}

/** Item de `animals[]` do Resource — vínculo `animals_weanings` (BirthAnimal),
 *  NÃO o `animal_uuids` do form/payload (esse é o uuid da MÃE). */
export interface WeaningAnimalWeaningItem {
  uuid: string; // uuid do BirthAnimal (bezerro), não da mãe
  mother: { uuid: string; identification: string } | null;
  newborn: { uuid: string; identification: string; category: string | null } | null;
}

export interface WeaningMovementSaleRef {
  uuid: string;
  code: string;
}

export interface WeaningData {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  type: WeaningTypeValue;
  type_label: string;
  responsible: WeaningPersonRef | null;
  employee: WeaningPersonRef | null;
  batch: WeaningBatchRef | null;
  transfer_batch: WeaningBatchRef | null;
  /** Só presente no DETALHE (`getWeaningByUuid`) — ausente na listagem. */
  animals?: WeaningAnimalWeaningItem[];
  /** Só presente no DETALHE — ausente na listagem. */
  movement_sale?: WeaningMovementSaleRef | null;
  finished_processing: boolean;
  /** `PENDING`/`FINISHED` do Processing; `null` = sem Processing (ex.: Venda). */
  processing_status?: WeaningProcessingStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WeaningForm {
  date: string | null;
  /** Obrigatório e editável só no criar; `InputReadOnly` no editar (nunca
   *  enviado no update, `WeaningRequest` real não aceita `type` em PUT). */
  type: Option<WeaningTypeValue> | null;
  batch_uuid: Option<string> | null;
  transfer_batch_uuid: Option<string> | null;
  /** uuid do `Animal` (mãe) — SelectAsyncPaginate isMulti, cascata IG-01
   *  (recarrega ao trocar `batch_uuid`, mirror `useCascadesPastagem`). */
  animal_uuids: Option<string>[];
}

export interface WeaningFilterForm {
  responsible_uuid?: string;
  /** Companion DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
   *  (mesma convenção de `breed_label` em `BirthAnimalFilterForm`) — nunca
   *  enviado ao servidor. */
  responsible_label?: string;
}

export interface WeaningFilterRequest {
  responsible_uuid?: string;
}

export interface CreateWeaningRequest {
  date: string;
  type: WeaningTypeValue;
  batch_uuid: string;
  transfer_batch_uuid?: string;
  animal_uuids: string[];
}

/** `WeaningRequest::rules()` real exige `date`/`batch_uuid`/`animal_uuids`
 *  também no update (sem `sometimes`) — payload é SEMPRE completo, mirror
 *  `BirthAnimalPayload` (nunca um delta de `dirtyFields`). `type`/`code`
 *  NUNCA aceitos (imutáveis, corrige OQ-07). */
export interface UpdateWeaningRequest {
  date: string;
  batch_uuid: string;
  transfer_batch_uuid?: string | null;
  animal_uuids: string[];
}

export interface WeaningLookupAnimalOption {
  uuid: string;
  identification: string;
  category: string | null;
}
