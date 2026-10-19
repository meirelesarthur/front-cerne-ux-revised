// src/services/v2/Configuracoes/Config/config-service.ts
// -----------------------------------------------------------------------------
// Config Service — API v1 do backend Laravel GB.Cerne (Configuração —
// settings singleton de plataforma, execução 032, TASK-FE-2600).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /config              → data: ConfigData (singleton, `firstOrCreate`
//                                no backend — nunca 404, contrato de tela §2).
//   PUT  /config              → payload ConfigPayload (JSON puro, SEM
//                                multipart — `video_intro` NUNCA neste
//                                payload, endpoint dedicado abaixo).
//   POST /config/video-intro  → multipart (FormData, campo `video_intro`,
//                                mirror `uploadUserBrandingLogo`) — endpoint
//                                DECOUPLED do PUT acima (TASK-FE-2602).
//
// Rota SINGULAR (sem `{uuid}` na URL) — mesmo racional D5 de
// `tenantParameters-service.ts`. Tenancy GLOBAL — sem `X-Farm-Id` exigido
// pelo backend (rota fora do grupo `farm.context`); o interceptor de
// `services/api.ts` pode anexar o header automaticamente se houver fazenda
// ativa no localStorage, mas o backend simplesmente ignora — mesma exceção
// já documentada para `Bank`/`Warehouse`/`SystemUpdate`/`Permission`. NUNCA
// setar o header manualmente aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { ConfigData, ConfigPayload } from '@/@types/v2/Configuracoes/config';

async function getConfig() {
  const { data } = await api.V2.get<Response<ConfigData>>('/config');
  return data;
}

async function updateConfig(payload: ConfigPayload) {
  const { data } = await api.V2.put<Response<ConfigData>>('/config', payload);
  return data;
}

// Upload dedicado do vídeo institucional — mirror `uploadUserBrandingLogo`
// (branding-service.ts): FormData com o campo `video_intro` (nome exato
// exigido por `ConfigVideoIntroRequest::rules()`). Retorna o `ConfigResource`
// completo (mesmo shape do GET/PUT) — a tela principal invalida
// `queryKey.configuracoes.config` no sucesso para refletir o novo
// `video_intro_url` (TASK-FE-2602).
async function uploadConfigVideoIntro(file: File) {
  const formData = new FormData();
  formData.append('video_intro', file);
  const { data } = await api.V2.post<Response<ConfigData>>('/config/video-intro', formData);
  return data;
}

export { getConfig, updateConfig, uploadConfigVideoIntro };
