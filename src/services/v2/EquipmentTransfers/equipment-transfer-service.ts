// src/services/v2/EquipmentTransfers/equipment-transfer-service.ts
// -----------------------------------------------------------------------------
// Equipment Transfer Service — API v1 do backend Laravel GB.Cerne
// (Transferência de Máquinas, F-101, 97-Esteiras/005, TASK-ETR-FE-01).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /equipment-transfers                → data: EquipmentTransferListItem[], meta REAL
//                                                 (paginação Laravel, 10/página default).
//                                                 Filtros: SOMENTE `start_date`/`end_date`
//                                                 (`FI-01`/`FI-02`) + `page`/`per_page`.
//   GET    /equipment-transfers/{uuid}         → data: EquipmentTransferDetail
//   GET    /equipment-transfers/next-code      → data: { code } — shape NÃO declarado no
//                                                 contrato de API (fid-g3f §5.1, DEC-FE-ETR-01).
//                                                 Leitura DEFENSIVA abaixo.
//   GET    /equipment-transfers/destination-farms → data: EquipmentTransferRef[], SEM
//                                                 paginação (já exclui a fazenda ativa
//                                                 no servidor — LK-01, não filtrar de novo).
//   POST   /equipment-transfers                → multipart (create) — SEMPRE POST, nunca
//                                                 `_method=PUT`.
//   POST   /equipment-transfers/{uuid}/receive → multipart (receive) — idem, SEMPRE POST.
//   DELETE /equipment-transfers/{uuid}         → 204 SEM CORPO (cancelar — SE-03/CL-08:
//                                                 vira status=3, NÃO remove o registro).
//
// `listEquipmentTransfers` ADAPTA o envelope `ApiResponse::paginated` (meta
// REAL) para o shape `ResponsePagination` que `useCustomGridQuery` consome —
// mesmo adaptador estrutural de `listScheduledReviews`/`listStates`
// (contrato-tela §FE-04, fid-g3f §3.1/RK-FE-ETR-01).
//
// Multipart com notação de colchete (`equipment_uuids[]`,
// `attachments[i][name]`, `attachments[i][file]`) — mirror
// `buildEquipmentFormData` (equipment-service.ts). Linhas de anexo SEM
// `file` são descartadas ANTES de montar o `FormData` (fid-g3f §3.3 — uma
// linha vazia gera 422 porque `attachments.*.file` é `required` na API).
// `farm_id`/`tenant_id`/`user_id`/`status` NUNCA vão no payload.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  EquipmentTransferAttachmentForm,
  EquipmentTransferDetail,
  EquipmentTransferListItem,
  EquipmentTransferRef,
  EquipmentTransfersListEnvelope,
} from '@/@types/v2/EquipmentTransfers';

// Params aceitos pela listagem — SOMENTE período + paginação real
// (`API-REQ-03` tem exatamente 4 parâmetros, contrato-tela §FE-05/§8.1).
export type ListEquipmentTransfersParams = Pick<PaginationQueryParams, 'page' | 'per_page'> & {
  start_date?: string;
  end_date?: string;
};

async function listEquipmentTransfers(
  params: ListEquipmentTransfersParams
): Promise<ResponsePagination<EquipmentTransferListItem[]>> {
  const { data } = await api.V2.get<EquipmentTransfersListEnvelope>('/equipment-transfers', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL
  // do backend, mirror `listScheduledReviews`/`listStates` (RK-FE-ETR-01).
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

async function getEquipmentTransfer(uuid: string): Promise<Response<EquipmentTransferDetail>> {
  const { data } = await api.V2.get<Response<EquipmentTransferDetail>>(
    `/equipment-transfers/${uuid}`
  );
  return data;
}

// DEC-FE-ETR-01 — shape não declarado no plano de API (fid-g3f §5.1).
// Default assumido: `data.data = { code: string }`. Leitura DEFENSIVA:
// tolera também `data.data = string` (contrato-tela §FE-11). Se o Executor
// de API materializar shape diferente, o ajuste é de uma linha aqui — ver
// `Histórico` da Tarefa.
async function getNextEquipmentTransferCode(): Promise<string> {
  const { data } = await api.V2.get<Response<{ code: string } | string>>(
    '/equipment-transfers/next-code'
  );
  const payload = data.data as unknown;
  return typeof payload === 'string' ? payload : (payload as { code: string }).code;
}

// LK-01 — já exclui a fazenda ativa no servidor; SEM paginação
// (contrato-tela §FE-11). Shape defensivo (DEC-FE-ETR-01): tolera envelope
// `Response<EquipmentTransferRef[]>` OU um array cru.
async function listDestinationFarms(): Promise<EquipmentTransferRef[]> {
  const { data } = await api.V2.get<Response<EquipmentTransferRef[]> | EquipmentTransferRef[]>(
    '/equipment-transfers/destination-farms'
  );
  return Array.isArray(data) ? data : data.data;
}

// Monta o `FormData` de anexos com notação de colchete — descarta linhas
// sem `file` (fid-g3f §3.3/§3.14). Compartilhado por `create`/`receive`.
function appendAttachments(fd: FormData, attachments: EquipmentTransferAttachmentForm[]): void {
  attachments
    .filter((row) => !!row.file)
    .forEach((row, index) => {
      fd.append(`attachments[${index}][name]`, row.name ?? '');
      fd.append(`attachments[${index}][file]`, row.file as File);
    });
}

export interface CreateEquipmentTransferPayload {
  code: string;
  farm_out_uuid: string;
  date: string;
  equipment_uuids: string[];
  attachments: EquipmentTransferAttachmentForm[];
}

// `code` PRESERVADO client-controlled (OD-003) — SEMPRE enviado (o campo é
// `readOnly`, nunca `disabled`). NUNCA enviar `farm_id`/`tenant_id`/
// `user_id`/`status`.
async function createEquipmentTransfer(
  payload: CreateEquipmentTransferPayload
): Promise<Response<EquipmentTransferDetail>> {
  const fd = new FormData();
  fd.append('code', payload.code);
  fd.append('farm_out_uuid', payload.farm_out_uuid);
  fd.append('date', payload.date);
  payload.equipment_uuids.forEach((uuid, index) => {
    fd.append(`equipment_uuids[${index}]`, uuid);
  });
  appendAttachments(fd, payload.attachments);

  const { data } = await api.V2.post<Response<EquipmentTransferDetail>>('/equipment-transfers', fd);
  return data;
}

export interface ReceiveEquipmentTransferPayload {
  employee_uuid: string;
  receipt_date: string;
  attachments: EquipmentTransferAttachmentForm[];
}

async function receiveEquipmentTransfer(
  uuid: string,
  payload: ReceiveEquipmentTransferPayload
): Promise<Response<EquipmentTransferDetail>> {
  const fd = new FormData();
  fd.append('employee_uuid', payload.employee_uuid);
  fd.append('receipt_date', payload.receipt_date);
  appendAttachments(fd, payload.attachments);

  const { data } = await api.V2.post<Response<EquipmentTransferDetail>>(
    `/equipment-transfers/${uuid}/receive`,
    fd
  );
  return data;
}

// `DELETE` responde 204 SEM CORPO — NÃO ler `data` (SE-03/CL-08: vira
// status=3, "Cancelar", NUNCA "Excluir"; o registro CONTINUA na listagem).
async function cancelEquipmentTransfer(uuid: string): Promise<void> {
  await api.V2.delete(`/equipment-transfers/${uuid}`);
}

export {
  cancelEquipmentTransfer,
  createEquipmentTransfer,
  getEquipmentTransfer,
  getNextEquipmentTransferCode,
  listDestinationFarms,
  listEquipmentTransfers,
  receiveEquipmentTransfer,
};
