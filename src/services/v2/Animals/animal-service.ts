// src/services/v2/Animals/animal-service.ts
// -----------------------------------------------------------------------------
// Animal Service — API v1 do backend Laravel GB.Cerne (Rebanho). RECONCILIADO
// contra o backend REAL em `GAP-FE-203` (2026-08-03) — nomes de chave de
// filtro/payload conferidos contra `AnimalIndexRequest`/`AnimalRequest`
// (api_root) campo a campo.
//
//   GET    /animals            → data: AnimalListItem[] + meta (paginação
//                                 REAL). Filtros reais (`AnimalIndexRequest`):
//                                 search/category_id/batch (NÃO
//                                 `category_uuid`/`batch_uuid`, que nunca
//                                 batiam com o backend — `GAP-FE-203`).
//   GET    /animals/{uuid}     → data: AnimalData
//   POST   /animals            → payload AnimalPayload
//   PUT    /animals/{uuid}     → payload AnimalPayload — `type`/`start_weight`
//                                 IMUTÁVEIS, nunca reenviados
//   DELETE /animals/{uuid}     → 204; sem guarda de FK confirmada (RN-9
//                                 legado) — `onError` genérico
//   GET    /animals/download   → blob (planilha-modelo, 4 abas)
//   GET    /animals/export     → blob (rebanho ativo)
//   POST   /animals/import     → multipart, resultado AnimalImportResult
//
// `listAnimals` ADAPTA o envelope `ApiResponse::paginated` para o shape
// `ResponsePagination` que `useCustomGridQuery` consome — mesmo adaptador de
// `listBreeds`/`listIdentificationTypes`.
//
// FARM-SCOPED: `Animal` é tabela `farm_id`-scoped (diferente dos catálogos
// globais vizinhos Species/Breed/CategoryAnimal/CategoryMatrix/
// IdentificationType) — `X-Farm-Id` é propagado pelo interceptor genérico do
// `api.ts` (nunca hardcode manual aqui).
//
// TASK-FE-882 — `createAnimal`/`updateAnimal` PASSARAM a montar `FormData`
// multipart (`buildAnimalFormData`), não mais JSON puro: o bloco "Fotos"
// (`photo`) exige upload de arquivo, mirror EXATO de
// `buildMarkerFormData`/`buildEquipmentFormData` (`marker-service.ts`/
// `equipment-service.ts`) — `is_enabled`-like booleanos como `'1'`/`'0'`
// (N/A aqui, Animal não tem), arrays de objeto via `campo[i][subcampo]`,
// `update` via `POST` + `_method=PUT` (method spoofing, NUNCA `api.V2.put()`
// com `FormData` — achado real replicado de todo upload multipart do
// projeto). Campos nullable/opcionais só são anexados quando têm valor
// (omissão, não `null` literal — `FormData` não representa `null`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AnimalData,
  AnimalImportResult,
  AnimalListItem,
  AnimalOptionListItem,
  AnimalOptionsListEnvelope,
  AnimalPayload,
  AnimalsListEnvelope,
  DeleteAnimalsManyResult,
  TransferAnimalsBatchPayload,
  UpdateAnimalsReproductiveStatusManyPayload,
  UpdateAnimalsReproductiveStatusManyResult,
} from '@/@types/v2/Animals';

// `GAP-FE-203` Achado 4 — nomes reais de `AnimalIndexRequest::rules()` são
// `category_id`/`batch` (não `category_uuid`/`batch_uuid`, que `TASK-FE-881`
// enviava — o filtro nunca surtia efeito real no backend, que ignora
// silenciosamente uma query string desconhecida).
//
// `status`/`origin`/`reproductive_status` (Tarefa 26, FM-04/05/06) — os 3
// enviados com a MESMA convenção `|| undefined` das linhas abaixo: filtro
// vazio nunca vira query param.
export interface ListAnimalsParams extends PaginationQueryParams {
  search?: string;
  category_id?: string;
  batch?: string;
  status?: string;
  origin?: string;
  reproductive_status?: number;
}

async function listAnimals(
  params: ListAnimalsParams
): Promise<ResponsePagination<AnimalListItem[]>> {
  const { data } = await api.V2.get<AnimalsListEnvelope>('/animals', {
    page: params.page,
    per_page: params.per_page ?? 10,
    search: params.search || undefined,
    category_id: params.category_id || undefined,
    batch: params.batch || undefined,
    status: params.status || undefined,
    origin: params.origin || undefined,
    reproductive_status: params.reproductive_status || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listBreeds/listIdentificationTypes.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getAnimalByUuid(animalUuid: string) {
  const { data } = await api.V2.get<Response<AnimalData>>(`/animals/${animalUuid}`);
  return data;
}

// GET /animals/options — implementado em TASK-FE-884/887 para o autocomplete
// de Mãe/Pai (Opção B, `GAP-BE-426`). REVERTIDO no E2E (Contrato §19,
// TASK-FE-901): `CreateOrUpdateAnimal.tsx` deixou de consumir este endpoint
// (mãe/pai voltaram a ser texto livre) — o Arquiteto decidiu MANTER o
// endpoint no backend (§19.2, sem consumidor de escrita conhecido hoje,
// candidato a reuso futuro), então esta função/serviço PERMANECE aqui,
// apenas órfã. PAGINADO de verdade (não FLAT) — `animals` tem 146.496 linhas
// reais (`AnimalRepository::listOptions()`, mirror `cost-centers/options`),
// SEM gate de permissão. `exclude_uuid` evita que o próprio animal em edição
// apareça como seu próprio pai/mãe, caso um consumidor futuro reapareça.
export interface ListAnimalOptionsParams extends PaginationQueryParams {
  search?: string;
  exclude_uuid?: string;
  /** Item 3 da execução 084 — exclusão em lote (array), serializada pelo axios
   *  como `exclude_uuids[]=<uuid>&exclude_uuids[]=<uuid>`; a `meta` de
   *  paginação devolvida pela API já reflete a exclusão (hasMore correto).
   *  `exclude_uuid` único permanece suportado. Array vazio = não envia. */
  exclude_uuids?: string[];
  /** TASK-BE-1077/TASK-FE-2780 (FID-043-02) — REVERTE DEC-LA-02: filtro
   *  OPCIONAL e ADITIVO, mirror `batch_id` do select2 legado
   *  (`resources/js/main.js:930-947`), consumido pela cascata Lote→Animal de
   *  Perdas. Ausente = todos os animais da fazenda (comportamento anterior
   *  preservado para os demais consumidores). */
  batch_uuid?: string;
  /** TASK-PES-FE-05 (contrato-api-lane-c-pesagem.md §Especificação#5, matriz
   *  FID-G3A nó 25/LK-01) — extensão ADITIVA confirmada por leitura direta
   *  de `AnimalOptionsRequest::rules()` (worktree irmão da API):
   *  `category_uuid` já é aceito pelo endpoint (`Rule::prohibitedIf` quando
   *  `batch_uuid` também vier preenchido — mutuamente exclusivos, mirror
   *  `WeighingRequest`), consumido pelo bloco de animais de Pesagem quando o
   *  cabeçalho usa Categoria em vez de Lote. Ausente = comportamento
   *  idêntico aos demais consumidores (`batch_uuid`, se presente, OU nenhum
   *  filtro). */
  category_uuid?: string;
  /** Opt-in (select de animal da Pesagem): a API devolve `last_weight` e
   *  `last_weight_date` por item. Ausente = formato enxuto `{uuid,label}`
   *  (Mãe/Pai e demais consumidores inalterados). */
  with_last_weighing?: boolean;
  /** UT-000795 (Contas a Pagar Pecuária) — opt-in: status aceitos
   *  (`statuses[]`, API default `['A']`; legado usa `A` e `P`). Ausente/vazio
   *  = não envia (demais consumidores inalterados). */
  statuses?: string[];
}

async function listAnimalOptions(
  params: ListAnimalOptionsParams
): Promise<ResponsePagination<AnimalOptionListItem[]>> {
  const { data } = await api.V2.get<AnimalOptionsListEnvelope>('/animals/options', {
    page: params.page,
    per_page: params.per_page ?? 10,
    search: params.search || undefined,
    exclude_uuid: params.exclude_uuid || undefined,
    exclude_uuids: params.exclude_uuids?.length ? params.exclude_uuids : undefined,
    batch_uuid: params.batch_uuid || undefined,
    category_uuid: params.category_uuid || undefined,
    // Laravel `boolean` aceita 1/0 (não a string "true").
    with_last_weighing: params.with_last_weighing ? 1 : undefined,
    statuses: params.statuses?.length ? params.statuses : undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// GET /animals/verify-identification — TASK-FE-931 (Animal-contrato.md §21).
// Aviso NÃO-BLOQUEANTE de identificação duplicada, disparado no `blur` do
// campo de identificação (`IdentificationRow`). Confirmado campo-a-campo
// contra `AnimalVerifyIdentificationRequest`/`AnimalController::
// verifyIdentification()` (api_root) — resposta é `{exists, identification}`
// dentro do envelope `ApiResponse::success()`, NÃO a coleção crua do legado.
// Sem gate de permissão (`farm.context` apenas, §21.3) — `exclude_uuid` só é
// enviado na EDIÇÃO, para o próprio animal não acusar duplicata de si mesmo.
export interface VerifyAnimalIdentificationParams {
  identification: string;
  exclude_uuid?: string;
}

export interface VerifyAnimalIdentificationResult {
  exists: boolean;
  identification: string;
}

async function verifyAnimalIdentification(
  params: VerifyAnimalIdentificationParams
): Promise<VerifyAnimalIdentificationResult> {
  const { data } = await api.V2.get<Response<VerifyAnimalIdentificationResult>>(
    '/animals/verify-identification',
    {
      identification: params.identification,
      exclude_uuid: params.exclude_uuid || undefined,
    }
  );
  return data.data;
}

// Full-resource sempre (nunca um delta de `dirtyFields`) — mirror
// `buildMarkerFormData`/`buildEquipmentFormData`. Campos nullable/opcionais
// só entram no `FormData` quando têm valor (omissão em vez de `null`
// literal); arrays de objeto (`identifications`, `child`) via notação
// `campo[i][subcampo]`/`campo[subcampo]` (convenção PHP/Laravel de parsing
// de multipart).
function buildAnimalFormData(payload: AnimalPayload): FormData {
  const fd = new FormData();

  fd.append('type', payload.type);
  if (payload.quantity !== undefined) fd.append('quantity', String(payload.quantity));
  // `GAP-FE-203` Achado 1 — nomes de chave EXATOS de `AnimalRequest::rules()`
  // (`specie_id`/`category_id`/`breed_id`, valor é uuid, sufixo `_id`
  // preservado do legado — mesma convenção de `category_matrice_id`).
  fd.append('specie_id', payload.specie_id);
  fd.append('category_id', payload.category_id);
  if (payload.breed_id) fd.append('breed_id', payload.breed_id);
  fd.append('entry_date', payload.entry_date);
  if (payload.birth_date) fd.append('birth_date', payload.birth_date);

  payload.identifications.forEach((item, index) => {
    fd.append(`identifications[${index}][id_animal_uuid]`, item.id_animal_uuid);
    fd.append(`identifications[${index}][identification]`, item.identification);
  });

  fd.append('weight', String(payload.weight));
  fd.append('price_kilo_alive', String(payload.price_kilo_alive));
  // `GAP-FE-203` Achado 2 — `required|numeric` em AMBOS os verbos
  // (`AnimalRequest::rules()`); omiti-los (decisão original de
  // `TASK-FE-883`) causava 422 garantido. Sempre anexados (não
  // condicionais como os campos nullable abaixo).
  fd.append('price_arroba_alive', String(payload.price_arroba_alive));
  fd.append('value_unitary', String(payload.value_unitary));
  fd.append('unity_animal_ua', String(payload.unity_animal_ua));
  if (payload.fur_description) fd.append('fur_description', payload.fur_description);
  if (payload.note) fd.append('note', payload.note);

  if (payload.photo) fd.append('photo', payload.photo);
  if (payload.remove_image) fd.append('remove_image', '1');

  // ---- TASK-FE-884 (Estágio/Status Reprodutivo + Bezerro) — nomes de
  // chave EXATOS de `AnimalRequest::rules()` (api_root), achado real
  // corrigido nesta Tarefa (o rascunho de TASK-FE-882 usava
  // `category_matrice_uuid`/`child.identification_type_uuid`, que o backend
  // real NUNCA aceitou — ver nota de reconciliação em
  // `@/@types/v2/Animals`). ----
  // Genealogia (§3.4.4) — `GAP-BE-426` REVERTIDO no E2E (Contrato §19,
  // TASK-FE-901): `mother`/`father` voltam a ser TEXTO LIVRE (`string`),
  // não mais `mother_animal_uuid`/`father_animal_uuid`.
  if (payload.mother) fd.append('mother', payload.mother);
  if (payload.father) fd.append('father', payload.father);
  if (payload.category_matrice_id) {
    fd.append('category_matrice_id', payload.category_matrice_id);
  }
  if (payload.reproductive_status != null) {
    fd.append('reproductive_status', String(payload.reproductive_status));
  }
  if (payload.birth_forecast) fd.append('birth_forecast', payload.birth_forecast);
  if (payload.child) {
    fd.append('child[category_uuid]', payload.child.category_uuid);
    fd.append('child[birth_date]', payload.child.birth_date);
    fd.append('child[weight]', String(payload.child.weight));
    fd.append('child[id_animal_uuid]', payload.child.id_animal_uuid);
    fd.append('child[identification]', payload.child.identification);
  }

  // ---- TASK-FE-885 (Depreciação) — `vl_residual`/`vl_depreciate` são
  // calculados CLIENT-SIDE mas ENVIADOS (Store/UpdateAnimalAction gravam
  // exatamente o que veio, sem recalcular — achado real, ver nota de
  // reconciliação). ----
  if (payload.depreciation_type != null) {
    fd.append('depreciation_type', String(payload.depreciation_type));
  }
  if (payload.vl_acquisition != null) fd.append('vl_acquisition', String(payload.vl_acquisition));
  if (payload.residual != null) fd.append('residual', String(payload.residual));
  if (payload.depreciation != null) fd.append('depreciation', String(payload.depreciation));
  if (payload.life_bens != null) fd.append('life_bens', String(payload.life_bens));
  if (payload.vl_residual != null) fd.append('vl_residual', String(payload.vl_residual));
  if (payload.vl_depreciate != null) fd.append('vl_depreciate', String(payload.vl_depreciate));

  return fd;
}

async function createAnimal(payload: AnimalPayload) {
  const { data } = await api.V2.post<Response<AnimalData>>(
    '/animals',
    buildAnimalFormData(payload)
  );
  return data;
}

// Method spoofing — NUNCA `api.V2.put()` com `FormData` (mesmo achado real
// de `updateMarker`/`updateFamilyEquipment`/`updateEquipment`).
async function updateAnimal(animalUuid: string, payload: AnimalPayload) {
  const fd = buildAnimalFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<AnimalData>>(`/animals/${animalUuid}`, fd);
  return data;
}

async function deleteAnimal(animalUuid: string) {
  const { data } = await api.V2.delete(`/animals/${animalUuid}`);
  return data;
}

// ---- Import/Export (Excel) — V3 blob canônico, mirror `opening-balance-service.ts` ----

async function downloadAnimalImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/animals/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function exportAnimals(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/animals/export', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function importAnimals(file: File): Promise<Response<AnimalImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<AnimalImportResult>>('/animals/import', fd);
  return data;
}

// ---- Ações em lote (Gestão Animais, feature 3596a556) ----------------------
//
// Tarefa 28 — `PATCH /animals/reproductive-status-many`. TRÊS armadilhas
// confirmadas por leitura direta do backend (contrato de tela §9.2):
// 1) rota SEM o prefixo `update-` que o contrato legado cita (a rota do
//    monólito era `update-reproductive-status-many`; a rota da API nova —
//    `routes/api.php`, `animals.reproductive-status-many` — não o tem. Usar
//    o prefixo do legado dá 404);
// 2) `AnimalReproductiveStatusManyRequest` valida `date_format:d/m/Y` — o
//    payload chega aqui já em `dd/MM/yyyy` (convertido pelo caller via
//    `formatDate`, default do util); enviar ISO produz 422;
// 3) `pregnancy_date` é campo "morto" no CRUD (`AnimalPayload`), mas vivo e
//    obrigatório aqui quando `reproductive_status === 1` — por isso o tipo
//    do payload é PRÓPRIO (`UpdateAnimalsReproductiveStatusManyPayload`) e
//    não herda de `AnimalPayload`.
async function updateAnimalsReproductiveStatusMany(
  payload: UpdateAnimalsReproductiveStatusManyPayload
): Promise<Response<UpdateAnimalsReproductiveStatusManyResult>> {
  const { data } = await api.V2.patch<Response<UpdateAnimalsReproductiveStatusManyResult>>(
    '/animals/reproductive-status-many',
    payload
  );
  return data;
}

// Tarefa 29 — `DELETE /animals/delete-many`. Armadilha confirmada:
// `api.V2.delete(endpoint, config)` — o 2º argumento é um `RequestConfig`
// (axios, `services/api.ts:211-213`), NÃO um payload. O corpo vai em
// `{ data: { uuids } }`. Precedente idêntico em produção:
// `Financeiro/Expenses/expense-service.ts` (`multipleDestroyExpenses`).
// Passar `{ uuids }` direto como 2º argumento envia uma requisição SEM
// corpo → 422 "uuids required", sem erro de tipo que denuncie.
async function deleteAnimalsMany(uuids: string[]): Promise<Response<DeleteAnimalsManyResult>> {
  // `api.V2.delete` (services/api.ts) não é genérico — o tipo de retorno é
  // fixado no cast do `data`, mesmo padrão de `deleteAnimal`/`multipleDestroyExpenses`.
  const { data } = await api.V2.delete('/animals/delete-many', {
    data: { uuids },
  });
  return data as Response<DeleteAnimalsManyResult>;
}

// Tarefa 30 — `POST /animals/batch-transfer`. Endpoint COMPARTILHADO com a
// feature Animais/Lote (`426be835`, `DEC-028`) — não duplicar. A resposta
// traz `data: []` (`AnimalController:324`) — SEM contagem do servidor; o
// caller usa `selectedAnimals.length` para o toast (único dos 3 diálogos em
// que a contagem local é correta, por ausência de contrapartida do backend).
async function transferAnimalsBatch(payload: TransferAnimalsBatchPayload): Promise<Response<[]>> {
  const { data } = await api.V2.post<Response<[]>>('/animals/batch-transfer', payload);
  return data;
}

export {
  buildAnimalFormData,
  createAnimal,
  deleteAnimal,
  deleteAnimalsMany,
  downloadAnimalImportTemplate,
  exportAnimals,
  getAnimalByUuid,
  importAnimals,
  listAnimalOptions,
  listAnimals,
  transferAnimalsBatch,
  updateAnimal,
  updateAnimalsReproductiveStatusMany,
  verifyAnimalIdentification,
};
