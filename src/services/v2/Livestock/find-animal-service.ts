// src/services/v2/Livestock/find-animal-service.ts
// -----------------------------------------------------------------------------
// Find Animal Service — API v1 do backend Laravel GB.Cerne (Localizar Animal,
// F-042, TASK-FA-FE-02). Só os DOIS endpoints NOVOS desta fatia:
//
//   GET  /find-animals/{animal_uuid}                → dossiê (EP-FA-02)
//   POST /find-animals/{animal_uuid}/batch-transfer  → transferência (EP-FA-04)
//
// Os DOIS lookups reusados (EP-FA-01 `animals/options`, EP-FA-03
// `batches/options`) NÃO têm função aqui — consumir diretamente
// `listAnimalOptions` (`@/services/v2/Animals/animal-service`, órfã até esta
// Tarefa) e `listBatchOptionsForForm` (`@/services/v2/Batches/batch-service`,
// NUNCA `listBatchOptions` — essa é a variante de FILTRO que preserva a
// sentinela "Sem lote" `uuid:'0'`, contrato de tela §5.3/§6.3).
//
// Corpo do POST é EXATAMENTE `{ batch_uuid }` — nenhum outro campo
// (`farm_id`/`animal_id`/`user_id`/`date`/`code`/`employee_id`/`note` são
// derivados no servidor). `X-Farm-Id` já é injetado pelo interceptor
// genérico de `api.ts` — nunca setar manualmente aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  FindAnimalBatchTransferRequest,
  FindAnimalData,
} from '@/@types/v2/Livestock/findAnimal';

async function getFindAnimalLocation(animalUuid: string): Promise<Response<FindAnimalData>> {
  const { data } = await api.V2.get<Response<FindAnimalData>>(`/find-animals/${animalUuid}`);
  return data;
}

async function transferAnimalBatch(
  animalUuid: string,
  body: FindAnimalBatchTransferRequest
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>(
    `/find-animals/${animalUuid}/batch-transfer`,
    body
  );
  return data;
}

export { getFindAnimalLocation, transferAnimalBatch };
