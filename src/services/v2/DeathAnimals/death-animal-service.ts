// src/services/v2/DeathAnimals/death-animal-service.ts
// -----------------------------------------------------------------------------
// DeathAnimal Service — API v1 do backend Laravel GB.Cerne (`/death-animals*`,
// TASK-DA-FE-01/02). Camada `api` já materializada nesta sessão
// (`GB.Cerne.Api`, TASK-DA-02/03) — nomes de campo confirmados por leitura
// direta de `DeathAnimalController.php`/`DeathAnimalResource.php`/
// `DeathAnimalRequest.php`/`DeathAnimalCheckDateRequest.php`.
//
//   GET    /death-animals            → paginado (ApiResponse::paginated, meta REAL), death_animals_view
//   POST   /death-animals            → multipart, death_animals_create
//   GET    /death-animals/{uuid}     → detalhe completo, death_animals_view
//   PUT    /death-animals/{uuid}     → multipart, death_animals_edit
//   DELETE /death-animals/{uuid}     → 204; reverte Animal.status para ACTIVE (SFX-02)
//   GET    /death-animals/check-date → guarda não-bloqueante (checks map)
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
//
// `createDeathAnimal`/`updateDeathAnimal` SEMPRE montam `FormData` multipart
// (mirror `buildBirthAnimalFormData`/`buildAnimalFormData`) — mesmo sem foto
// nova, porque o mecanismo de foto (`ImageUpload`) é multipart-first no
// projeto e o backend aceita os 2 verbos com o mesmo Request. `update` usa
// method spoofing (`POST` + `_method=PUT`) — NUNCA `api.V2.put()` com
// `FormData` (mesmo achado real replicado de todo upload multipart do
// projeto). `animal_uuid`/`batch_uuid` são REENVIADOS no `update` (full-
// resource-replace, mirror `BirthAnimalPayload`) — `DeathAnimalRequest::rules()`
// os exige `required` em AMBOS os verbos; a `UpdateDeathAnimalAction` do
// servidor é quem os IGNORA ao montar o `update()` (imutabilidade pós-
// criação, `OQ-04`), não este service.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CheckDeathAnimalDateParams,
  CheckDeathAnimalDateResult,
  DeathAnimalDetail,
  DeathAnimalFilterRequest,
  DeathAnimalListItem,
  DeathAnimalPayload,
  DeathAnimalsListEnvelope,
} from '@/@types/v2/DeathAnimals';

export interface ListDeathAnimalsParams extends PaginationQueryParams, DeathAnimalFilterRequest {}

async function listDeathAnimals(
  params: ListDeathAnimalsParams
): Promise<ResponsePagination<DeathAnimalListItem[]>> {
  const { data } = await api.V2.get<DeathAnimalsListEnvelope>('/death-animals', {
    page: params.page,
    per_page: params.per_page,
    animal_identification: params.animal_identification || undefined,
    cause_uuid: params.cause_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listFeedlotYards`/`listBirthAnimals`. Ordenação
  // `code desc` é FIXA server-side (`DeathAnimalRepository::listWithFilters()`)
  // — este service nunca envia `orderBy`.
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

async function getDeathAnimal(uuid: string): Promise<Response<DeathAnimalDetail>> {
  const { data } = await api.V2.get<Response<DeathAnimalDetail>>(`/death-animals/${uuid}`);
  return data;
}

// Full-resource sempre (nunca um delta de `dirtyFields`) — mirror
// `buildBirthAnimalFormData`. Campos nullable/opcionais só entram no
// `FormData` quando têm valor (omissão em vez de `null` literal).
function buildDeathAnimalFormData(payload: DeathAnimalPayload): FormData {
  const fd = new FormData();

  fd.append('date', payload.date);
  fd.append('animal_uuid', payload.animal_uuid);
  fd.append('batch_uuid', payload.batch_uuid);
  fd.append('cause_uuid', payload.cause_uuid);
  if (payload.note) fd.append('note', payload.note);
  if (payload.photo) fd.append('photo', payload.photo);

  return fd;
}

async function createDeathAnimal(
  payload: DeathAnimalPayload
): Promise<Response<DeathAnimalDetail>> {
  const { data } = await api.V2.post<Response<DeathAnimalDetail>>(
    '/death-animals',
    buildDeathAnimalFormData(payload)
  );
  return data;
}

// Method spoofing — NUNCA `api.V2.put()` com `FormData` (mesmo achado real de
// `updateBirthAnimal`/`updateAnimal`).
async function updateDeathAnimal(
  uuid: string,
  payload: DeathAnimalPayload
): Promise<Response<DeathAnimalDetail>> {
  const fd = buildDeathAnimalFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<DeathAnimalDetail>>(`/death-animals/${uuid}`, fd);
  return data;
}

async function deleteDeathAnimal(uuid: string) {
  const { data } = await api.V2.delete(`/death-animals/${uuid}`);
  return data;
}

// `GET /death-animals/check-date?animal_uuid=&batch_uuid=&date=` — guarda
// NÃO-BLOQUEANTE (mirror `checkBatchBirthDate`). `animal_uuid`/`batch_uuid`
// são independentes e opcionais (`DeathAnimalCheckDateRequest::rules()`,
// ambos `sometimes|uuid`) — `checks` só traz a chave correspondente ao uuid
// que foi de fato enviado.
async function checkDeathAnimalDate(
  params: CheckDeathAnimalDateParams
): Promise<CheckDeathAnimalDateResult> {
  const { data } = await api.V2.get<Response<CheckDeathAnimalDateResult>>(
    '/death-animals/check-date',
    {
      animal_uuid: params.animal_uuid || undefined,
      batch_uuid: params.batch_uuid || undefined,
      date: params.date,
    }
  );
  return data.data ?? { valid: true, checks: {} };
}

export {
  checkDeathAnimalDate,
  createDeathAnimal,
  deleteDeathAnimal,
  getDeathAnimal,
  listDeathAnimals,
  updateDeathAnimal,
};
