// src/@types/v2/BirthAnimals/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de NASCIMENTOS (BirthAnimal — Operacional > Pecuária).
//
// Fonte: `frontend-contract-nascimentos.md` §4 (shapes transcritos DIRETAMENTE
// do DTO/Resource reais lidos pelo Arquiteto Frontend no fork `GB.Cerne.Api` —
// `app/Data/BirthAnimal/*.php`, `app/Http/Resources/V1/BirthAnimal{,List}
// Resource.php`, `app/Http/Requests/Api/V1/BirthAnimal*Request.php` — NÃO é
// inferência a partir do contrato legado).
//
// `uuid` sempre, `id` NUNCA aparece no envelope.
//
// TASK-NASC-FE-01 (fundação) consome `BirthAnimalListItem`/`BirthAnimalDetail`/
// `BirthAnimalFilterForm`. `BirthAnimalForm`/`BirthAnimalIdentificationRow`/
// `BirthAnimalPayload` são consumidos pela Tarefa 19 (formulário), mas
// declarados aqui por instrução da fundação (contrato §8 — "o arquivo de
// serviço nasce aqui"). `BirthAnimalImportResult` é consumido pela Tarefa 20.
// -----------------------------------------------------------------------------

export interface BirthAnimalOption {
  uuid: string;
  label: string; // AnimalOptionResource: label = identification (já "S/ID" quando sem pivot)
}

export interface BirthAnimalListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  weight: number;
  mother?: { uuid: string; identification: string } | null;
  father_text: string | null;
  newborn?: { uuid: string; identification: string } | null;
  breed?: { uuid: string; description: string } | null;
  has_weaning: boolean; // GAP-NASC-09 — gate de UI (Editar/Excluir), NUNCA bloqueio de servidor
}

export interface BirthAnimalIdentificationRow {
  uuid?: string; // ausente em linha nova
  id_animal_uuid: { label: string; value: string } | null; // select do tipo de identificação
  identification: string; // "present|string" no servidor — pode ser '', mirror "S/ID" quando tipo = NO_IDENTIFICATION_TYPE_LABEL
}

export interface BirthAnimalDetail {
  uuid: string;
  code: string; // sempre readonly
  date: string;
  weight: number;
  mother?: { uuid: string; identification: string } | null;
  father_text: string | null;
  father_animal?: { uuid: string; identification: string } | null; // resolvido pelo SERVIDOR a partir de father_text — nunca editável diretamente
  newborn?: { uuid: string; identification: string } | null; // só existe após salvar (o bezerro é criado no store())
  breed?: { uuid: string; description: string } | null;
  category?: { uuid: string; description: string } | null;
  specie?: { uuid: string; description: string } | null;
  birth_note?: { uuid: string; description: string } | null;
  batch?: { uuid: string; description: string } | null;
  // GAP-NASC-16 (OQ7/C43): hidratar o select de transferência A PARTIR DESTE
  // campo, NUNCA de `batch` — o bug de hidratação do legado NÃO deve ser
  // replicado (correção deliberada, não preservação).
  transfer_batch?: { uuid: string; description: string } | null;
  fur_description: string | null;
  note: string | null;
  photo_url: string | null;
  id_animals: Array<{ uuid: string; description: string; identification: string }>;
  has_weaning: boolean;
  created_at: string;
  updated_at: string;
}

// Payload de escrita (store+update) — mirror BirthAnimalData/BirthAnimalRequest
// (RHF, Option-wrapped). farm_id/user_id/employee_id/quantity NUNCA presentes
// (derivados/hardcoded no servidor). Consumido pela Tarefa 19.
export interface BirthAnimalForm {
  date: string;
  breed_uuid: { label: string; value: string } | null;
  category_uuid: { label: string; value: string } | null; // 100% dependente de AJAX (specie_uuid), nasce vazio
  birth_note_uuid: { label: string; value: string } | null;
  weight: number | null; // MoneyInput pt-BR
  specie_uuid: { label: string; value: string } | null; // dispara cascata (dirige category_uuid + breed_uuid)
  mother_uuid: { label: string; value: string } | null; // nullable no servidor (GAP-NASC-12) — UI mantém obrigatório
  father_text: string | null; // texto livre — animal_father_id é resolvido pelo servidor
  batch_uuid: { label: string; value: string } | null;
  transfer_batch_uuid: { label: string; value: string } | null;
  fur_description: string | null;
  note: string | null;
  identifications: BirthAnimalIdentificationRow[]; // useFieldArray, mín. 1 linha sempre
}

export interface BirthAnimalFilterForm {
  identification?: string; // busca mãe OU bezerro (mirror FM1/repository)
  breed_uuid?: string;
  start_date?: string;
  end_date?: string;
}

export interface BirthAnimalImportResult {
  created: number;
}

export interface CheckBatchDateResult {
  valid: boolean;
  checks: Record<'batch' | 'transfer_batch', { valid: boolean; message: string | null }>;
}

export interface VerifyBirthIdentificationResult {
  exists: boolean;
  identification: string;
}

// -----------------------------------------------------------------------------
// Payload de ESCRITA (wire, resolvido — uuid strings/File) consumido pelo
// `birth-animal-service.ts` (`createBirthAnimal`/`updateBirthAnimal`).
// Campo `identifications` do form vira `id_animals` no wire — nome de chave
// EXATO de `BirthAnimalRequest::rules()` (contrato §7.2, "id_animals é
// required|array|min:1 incondicional" — confirmado por leitura direta do
// backend pelo Arquiteto Frontend). `remove_image`/`remove_photo` NUNCA
// existe neste payload (GAP-NASC-10, decisão de paridade deliberada —
// `BirthAnimalData` não suporta remoção real de foto).
//
// Demais nomes de chave (`specie_uuid`/`category_uuid`/`breed_uuid`/
// `birth_note_uuid`/`mother_uuid`/`batch_uuid`/`transfer_batch_uuid`) mirram
// 1:1 os campos do `BirthAnimalForm` acima — o Executor da Tarefa 19 confirma
// campo a campo contra `BirthAnimalRequest::rules()` antes do primeiro submit
// real (mesmo racional de reconciliação já aplicado em `AnimalPayload`/
// `GAP-FE-203`, caso o nome real divirja desta primeira leitura).
// -----------------------------------------------------------------------------
export interface BirthAnimalPayload {
  date: string;
  specie_uuid: string;
  category_uuid: string;
  breed_uuid: string | null;
  birth_note_uuid: string | null;
  weight: number;
  mother_uuid: string | null;
  father_text: string | null;
  batch_uuid: string | null;
  transfer_batch_uuid: string | null;
  fur_description: string | null;
  note: string | null;
  identifications: Array<{ id_animal_uuid: string; identification: string }>;
  photo?: File | null;
}
