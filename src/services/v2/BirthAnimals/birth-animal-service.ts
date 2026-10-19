// src/services/v2/BirthAnimals/birth-animal-service.ts
// -----------------------------------------------------------------------------
// BirthAnimal Service — API v1 do backend Laravel GB.Cerne (`/birth-animals*`,
// api-contract-nascimentos.md, frontend-contract-nascimentos.md §3, TASK-NASC-FE-01).
//
// Fundação desta Tarefa: `listBirthAnimals`/`getBirthAnimalByUuid`/
// `deleteBirthAnimal`. `createBirthAnimal`/`updateBirthAnimal` são consumidos
// pela Tarefa 19 (formulário); `listCandidateMothers`/`listCandidateFathers`/
// `verifyBirthIdentification`/`checkBatchBirthDate` idem; `downloadBirthAnimalTemplate`/
// `importBirthAnimals` são consumidos pela Tarefa 20 (import/export) — todos
// declarados aqui por instrução da fundação (contrato §8).
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listTransfers`/`listMovementSales`: a API devolve `{ data: [array plano],
// meta: { current_page, last_page, per_page, total } }`, o
// `useCustomGridQuery` espera `ResponsePagination<T>` (`data.items`/
// `data.pagination`). Adaptação feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// TASK-FE-882 (mirror `animal-service.ts`) — `createBirthAnimal`/
// `updateBirthAnimal` montam `FormData` multipart (`buildBirthAnimalFormData`):
// arrays de objeto via `campo[i][subcampo]`, `update` via `POST` + `_method=PUT`
// (method spoofing, NUNCA `api.V2.put()` com `FormData`). Campos
// nullable/opcionais só são anexados quando têm valor (omissão, não `null`
// literal). `remove_image`/`remove_photo` NUNCA é enviado (GAP-NASC-10).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BirthAnimalDetail,
  BirthAnimalFilterForm,
  BirthAnimalImportResult,
  BirthAnimalListItem,
  BirthAnimalOption,
  BirthAnimalPayload,
  CheckBatchDateResult,
  VerifyBirthIdentificationResult,
} from '@/@types/v2/BirthAnimals';

export interface ListBirthAnimalsParams extends PaginationQueryParams, BirthAnimalFilterForm {}

interface BirthAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface BirthAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: BirthAnimalListItem[];
  errors: Record<string, string[]> | null;
  meta: BirthAnimalsApiPaginationMeta | null;
}

async function listBirthAnimals(
  params: ListBirthAnimalsParams
): Promise<ResponsePagination<BirthAnimalListItem[]>> {
  const { data } = await api.V2.get<BirthAnimalsListEnvelope>('/birth-animals', {
    page: params.page,
    per_page: params.per_page,
    // 4 campos do filtro (contrato §5.2) — `identification` busca mãe OU
    // bezerro (mirror FM1/repository), `breed_uuid` sem `specie_uuid`
    // (mirror legado FM2, diferente do select do formulário).
    identification: params.identification || undefined,
    breed_uuid: params.breed_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getBirthAnimalByUuid(uuid: string): Promise<Response<BirthAnimalDetail>> {
  const { data } = await api.V2.get<Response<BirthAnimalDetail>>(`/birth-animals/${uuid}`);
  return data;
}

// `DELETE /birth-animals/{uuid}` — sem envelope de corpo relevante (204).
// Servidor permanece permissivo mesmo com `has_weaning=true` (GAP-NASC-09,
// decisão de paridade já tomada) — o gate `has_weaning` é SÓ de UI (§5.3/§6),
// nunca replicado como bloqueio client-side desta chamada.
async function deleteBirthAnimal(uuid: string): Promise<void> {
  await api.V2.delete(`/birth-animals/${uuid}`);
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 19 (formulário criar/editar) — declarados aqui por
// instrução da fundação (contrato §8).
// -----------------------------------------------------------------------------

// Full-resource sempre (nunca um delta de `dirtyFields`, contrato §3) — mirror
// `buildAnimalFormData`. Campos nullable/opcionais só entram no `FormData`
// quando têm valor (omissão em vez de `null` literal); array de identificações
// via notação `id_animals[i][subcampo]` (nome de chave wire, contrato §7.2 —
// NÃO `identifications`, esse é só o nome do campo no `BirthAnimalForm`
// client-side).
function buildBirthAnimalFormData(payload: BirthAnimalPayload): FormData {
  const fd = new FormData();

  fd.append('date', payload.date);
  fd.append('specie_uuid', payload.specie_uuid);
  fd.append('category_uuid', payload.category_uuid);
  if (payload.breed_uuid) fd.append('breed_uuid', payload.breed_uuid);
  if (payload.birth_note_uuid) fd.append('birth_note_uuid', payload.birth_note_uuid);
  fd.append('weight', String(payload.weight));
  if (payload.mother_uuid) fd.append('mother_uuid', payload.mother_uuid);
  if (payload.father_text) fd.append('father_text', payload.father_text);
  if (payload.batch_uuid) fd.append('batch_uuid', payload.batch_uuid);
  if (payload.transfer_batch_uuid) fd.append('transfer_batch_uuid', payload.transfer_batch_uuid);
  if (payload.fur_description) fd.append('fur_description', payload.fur_description);
  if (payload.note) fd.append('note', payload.note);

  payload.identifications.forEach((item, index) => {
    fd.append(`id_animals[${index}][id_animal_uuid]`, item.id_animal_uuid);
    fd.append(`id_animals[${index}][identification]`, item.identification);
  });

  // GAP-NASC-10 — `BirthAnimalData` NÃO tem campo `remove_photo`/`remove_image`
  // (diferente de Animal). Nunca enviar flag de remoção; se não houver
  // `photo` novo, a foto persistida permanece inalterada (mirror fiel do
  // comportamento real, decisão explícita do dono/API).
  if (payload.photo) fd.append('photo', payload.photo);

  return fd;
}

async function createBirthAnimal(
  payload: BirthAnimalPayload
): Promise<Response<BirthAnimalDetail>> {
  const { data } = await api.V2.post<Response<BirthAnimalDetail>>(
    '/birth-animals',
    buildBirthAnimalFormData(payload)
  );
  return data;
}

// Method spoofing — NUNCA `api.V2.put()` com `FormData` (mesmo achado real de
// `updateAnimal`/`updateMarker`/`updateEquipment`).
async function updateBirthAnimal(
  uuid: string,
  payload: BirthAnimalPayload
): Promise<Response<BirthAnimalDetail>> {
  const fd = buildBirthAnimalFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<BirthAnimalDetail>>(`/birth-animals/${uuid}`, fd);
  return data;
}

// `GET /birth-animals/candidate-mothers?search=` — select2 assíncrono do
// campo Mãe (contrato §3/§7.1, TASK-NASC-FE-02). Resposta é um array simples
// (Actions de leitura, sem paginação real) — ADAPTADO para o shape
// `ResponsePagination` que `SelectAsyncPaginate` consome como `service`
// (achado real desta Tarefa: a assinatura original da fundação devolvia
// `Response<T[]>` flat, incompatível com o contrato de `service` do
// componente — mesmo adaptador estrutural de `listBatchOptions`/
// `listSpecies`, meta sempre `null`, 1 única "página" com o array inteiro).
export interface ListCandidateMothersParams extends PaginationQueryParams {
  search?: string;
}

async function listCandidateMothers(
  params: ListCandidateMothersParams
): Promise<ResponsePagination<BirthAnimalOption[]>> {
  const { data } = await api.V2.get<Response<BirthAnimalOption[]>>(
    '/birth-animals/candidate-mothers',
    { search: params.search || undefined }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `GET /birth-animals/candidate-fathers?search=&specie_uuid=` — select2
// assíncrono do campo Pai, filtrado pela espécie selecionada (contrato §3/§7.1).
// Mesma adaptação de `listCandidateMothers` acima — NÃO consumido pela tela
// de formulário desta Tarefa (`father_text` implementado como `Input` texto
// livre, disclosure no cabeçalho de `CreateOrUpdateBirthAnimal.tsx`, contrato
// §7.1 tabela de campos), mas corrigido/mantido pronto para um satélite
// futuro que queira usá-lo como autocomplete sobre o texto livre.
export interface ListCandidateFathersParams extends PaginationQueryParams {
  search?: string;
  specie_uuid?: string;
}

async function listCandidateFathers(
  params: ListCandidateFathersParams
): Promise<ResponsePagination<BirthAnimalOption[]>> {
  const { data } = await api.V2.get<Response<BirthAnimalOption[]>>(
    '/birth-animals/candidate-fathers',
    { search: params.search || undefined, specie_uuid: params.specie_uuid || undefined }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `GET /birth-animals/verify-identification?identification=&exclude_uuid=` —
// aviso NÃO-BLOQUEANTE de identificação duplicada (contrato §7.3, IG3).
// `exclude_uuid` só é enviado na EDIÇÃO, para o próprio registro não acusar
// duplicata de si mesmo. `is_birth` já implícito no endpoint — não enviado.
async function verifyBirthIdentification(params: {
  identification: string;
  exclude_uuid?: string;
}): Promise<VerifyBirthIdentificationResult> {
  const { data } = await api.V2.get<Response<VerifyBirthIdentificationResult>>(
    '/birth-animals/verify-identification',
    {
      identification: params.identification,
      exclude_uuid: params.exclude_uuid || undefined,
    }
  );
  return data.data;
}

// `GET /birth-animals/check-batch-date?batch_uuid=&transfer_batch_uuid=&date=`
// — aviso NÃO-BLOQUEANTE de consistência de data do lote (contrato §7.4,
// IG5/IG6). Ambos os uuids são opcionais e independentes.
async function checkBatchBirthDate(params: {
  batch_uuid?: string;
  transfer_batch_uuid?: string;
  date: string;
}): Promise<CheckBatchDateResult> {
  const { data } = await api.V2.get<Response<CheckBatchDateResult>>(
    '/birth-animals/check-batch-date',
    {
      batch_uuid: params.batch_uuid || undefined,
      transfer_batch_uuid: params.transfer_batch_uuid || undefined,
      date: params.date,
    }
  );
  return data.data;
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 20 (import/export de planilha) — declarados aqui por
// instrução da fundação (contrato §8). V3 blob canônico, mirror
// `downloadAnimalImportTemplate`/`importAnimals`.
// -----------------------------------------------------------------------------

async function downloadBirthAnimalTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/birth-animals/download-template', undefined, {
    responseType: 'blob',
  });
  return data;
}

async function importBirthAnimals(file: File): Promise<Response<BirthAnimalImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<BirthAnimalImportResult>>(
    '/birth-animals/import',
    fd
  );
  return data;
}

export {
  buildBirthAnimalFormData,
  checkBatchBirthDate,
  createBirthAnimal,
  deleteBirthAnimal,
  downloadBirthAnimalTemplate,
  getBirthAnimalByUuid,
  importBirthAnimals,
  listBirthAnimals,
  listCandidateFathers,
  listCandidateMothers,
  updateBirthAnimal,
  verifyBirthIdentification,
};
