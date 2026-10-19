// src/services/v2/BreedingMating/pregnancy-diagnosis-service.ts
// -----------------------------------------------------------------------------
// Pregnancy Diagnosis Service — API v1 do backend Laravel GB.Cerne
// (Diagnóstico de Gestação, sub-árvore aninhada de Acasalamento, F-016,
// 97-Esteiras/001, Tarefa 02). Cobre `EP-PD-01`…`EP-PD-05` (contrato de API
// §6.2). Todas as rotas são ANINHADAS sob
// `/breeding-matings/{breedingMatingUuid}/pregnancy-diagnoses[/{uuid}]` — a
// assinatura de cada função recebe os dois uuids, na ordem pai → filho.
//
//   GET    .../pregnancy-diagnoses                       → EP-PD-01
//   GET    .../pregnancy-diagnoses/form-context           → EP-PD-02
//   POST   .../pregnancy-diagnoses                        → EP-PD-03
//   GET    .../pregnancy-diagnoses/{uuid}                 → EP-PD-04
//   DELETE .../pregnancy-diagnoses/{uuid}                 → EP-PD-05
//
// NÃO existe `updatePregnancyDiagnosis` — o modo editar é `NAO_APLICAVEL`
// comprovado (`->except(['edit','update'])` no legado, contrato de tela §2).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreatePregnancyDiagnosisRequest,
  PregnancyDiagnosesListEnvelope,
  PregnancyDiagnosisData,
  PregnancyDiagnosisFilterRequest,
  PregnancyDiagnosisFormContext,
  PregnancyDiagnosisListItem,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

const basePath = (breedingMatingUuid: string) =>
  `/breeding-matings/${breedingMatingUuid}/pregnancy-diagnoses`;

// Params aceitos pela listagem — paginação real + filtro do backend
// (contrato de tela §5.4): `start_date`/`end_date`/`user_uuid`.
export interface ListPregnancyDiagnosesParams
  extends PaginationQueryParams, PregnancyDiagnosisFilterRequest {}

async function listPregnancyDiagnoses(
  breedingMatingUuid: string,
  params: ListPregnancyDiagnosesParams
): Promise<ResponsePagination<PregnancyDiagnosisListItem[]>> {
  const { data } = await api.V2.get<PregnancyDiagnosesListEnvelope>(basePath(breedingMatingUuid), {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    user_uuid: params.user_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listBreedingMatings`.
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

// `GET .../pregnancy-diagnoses/form-context` — `eligible_animals` depende de
// `type`/`launch_type` do Acasalamento pai (CLM-PD-010); em `follow_up`
// exclui os já diagnosticados como não-prenhe (CLM-PD-009).
async function getPregnancyDiagnosisCreateContext(
  breedingMatingUuid: string
): Promise<Response<PregnancyDiagnosisFormContext>> {
  const { data } = await api.V2.get<Response<PregnancyDiagnosisFormContext>>(
    `${basePath(breedingMatingUuid)}/form-context`
  );
  return data;
}

async function createPregnancyDiagnosis(
  breedingMatingUuid: string,
  payload: CreatePregnancyDiagnosisRequest
): Promise<Response<PregnancyDiagnosisData>> {
  const { data } = await api.V2.post<Response<PregnancyDiagnosisData>>(
    basePath(breedingMatingUuid),
    payload
  );
  return data;
}

// `GET .../pregnancy-diagnoses/{uuid}` — legado NÃO reaplica a checagem
// `breeding_mating.status == 2` neste verbo (CLM-PD-002); fidelidade, não
// descuido — o backend também não reaplica.
async function getPregnancyDiagnosis(
  breedingMatingUuid: string,
  uuid: string
): Promise<Response<PregnancyDiagnosisData>> {
  const { data } = await api.V2.get<Response<PregnancyDiagnosisData>>(
    `${basePath(breedingMatingUuid)}/${uuid}`
  );
  return data;
}

// `DELETE .../pregnancy-diagnoses/{uuid}` — só o ÚLTIMO diagnóstico pode ser
// excluído (`can_delete`, CLM-PD-024); `422` fora dessa condição traz a
// mensagem literal do legado no envelope — o front exibe `message`, não
// duplica o texto (contrato de tela §8, regra 2 da Tarefa).
async function deletePregnancyDiagnosis(breedingMatingUuid: string, uuid: string) {
  const { data } = await api.V2.delete(`${basePath(breedingMatingUuid)}/${uuid}`);
  return data;
}

export {
  createPregnancyDiagnosis,
  deletePregnancyDiagnosis,
  getPregnancyDiagnosis,
  getPregnancyDiagnosisCreateContext,
  listPregnancyDiagnoses,
};
