// src/services/v2/BaseRegistrations/platformDocuments-service.ts
// -----------------------------------------------------------------------------
// Platform Document Service — API v1 do backend Laravel GB.Cerne (Termos e
// Condições, execução 032, TASK-FE-2500). Catálogo GLOBAL (sem `X-Farm-Id`),
// mesma exceção de `Bank`/`Partner`/`SystemUpdate`/`Permission`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /platform-documents                    → data: PlatformDocumentData
//   POST /platform-documents/terms-of-use        → multipart (FormData, `file`)
//   POST /platform-documents/privacy-policy      → multipart (FormData, `file`)
//
// Mirror simplificado de `partner-service.ts` (upload multipart) — SEM method
// spoofing (`_method=PUT`): os 2 endpoints já são `POST` puro, cada um
// dedicado a exatamente 1 arquivo (não há update de recurso via PUT, é
// upload dedicado por rota). Os 2 POSTs retornam o objeto COMPLETO
// (`PlatformDocumentData`) — a família não tocada permanece com seus valores
// anteriores (contrato de tela §5.1).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlatformDocumentData } from '@/@types/v2/BaseRegistrations/platformDocuments';

async function getPlatformDocuments() {
  const { data } = await api.V2.get<Response<PlatformDocumentData>>('/platform-documents');
  return data;
}

async function uploadTermsOfUse(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<PlatformDocumentData>>(
    '/platform-documents/terms-of-use',
    fd
  );
  return data;
}

async function uploadPrivacyPolicy(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<PlatformDocumentData>>(
    '/platform-documents/privacy-policy',
    fd
  );
  return data;
}

export { getPlatformDocuments, uploadPrivacyPolicy, uploadTermsOfUse };
