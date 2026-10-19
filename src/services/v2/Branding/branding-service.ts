// src/services/v2/Branding/branding-service.ts
// Marca personalizada de relatório (Custom Report Branding).
// Usa api.V2 (backend PHP). Dois contextos:
//  - Usuário (plano Ultra):  /api/v2/branding[/logo]
//  - Equipe (Business/Enterprise): /api/v2/teams/{id}/branding[/logo]
// Padrão: desestruturar { data } e retornar data; tipar com Response<T>.

import type { Response } from "@/@types/response-api";
import type {
  BrandingData,
  BrandingLogoResponse,
  BrandingLogoSlot,
  UpdateBrandingRequest,
} from "@/@types/v2/Common/branding";
import api from "@/services/api";

// ============================================
// MARCA DO USUÁRIO (Ultra)
// ============================================

/** GET /api/v2/branding — retorna a marca do usuário ou `null` se ainda não existir. */
export async function getUserBranding() {
  const { data } = await api.V2.get<Response<BrandingData | null>>("/branding");
  return data;
}

/** PUT /api/v2/branding — cria/atualiza (upsert). Enviar ao menos um campo. */
export async function updateUserBranding(request: UpdateBrandingRequest) {
  const { data } = await api.V2.put<Response<BrandingData>>("/branding", request);
  return data;
}

/** DELETE /api/v2/branding — exclui a marca (e seus logos). */
export async function deleteUserBranding() {
  const { data } = await api.V2.delete("/branding");
  return data;
}

/** POST /api/v2/branding/logo?slot= — envia/substitui um logo (multipart, campo `file`). */
export async function uploadUserBrandingLogo(slot: BrandingLogoSlot, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.V2.post<Response<BrandingLogoResponse>>(
    `/branding/logo?slot=${slot}`,
    formData
  );
  return data;
}

/** DELETE /api/v2/branding/logo?slot= — exclui um logo. */
export async function deleteUserBrandingLogo(slot: BrandingLogoSlot) {
  const { data } = await api.V2.delete(
    `/branding/logo?slot=${slot}`
  );
  return data;
}

// ============================================
// MARCA DA EQUIPE (Business/Enterprise)
// ============================================

/** GET /api/v2/teams/{id}/branding */
export async function getTeamBranding(teamId: number) {
  const { data } = await api.V2.get<Response<BrandingData | null>>(
    `/teams/${teamId}/branding`
  );
  return data;
}

/** PUT /api/v2/teams/{id}/branding (upsert). */
export async function updateTeamBranding(teamId: number, request: UpdateBrandingRequest) {
  const { data } = await api.V2.put<Response<BrandingData>>(
    `/teams/${teamId}/branding`,
    request
  );
  return data;
}

/** DELETE /api/v2/teams/{id}/branding */
export async function deleteTeamBranding(teamId: number) {
  const { data } = await api.V2.delete(
    `/teams/${teamId}/branding`
  );
  return data;
}

/** POST /api/v2/teams/{id}/branding/logo?slot= (multipart, campo `file`). */
export async function uploadTeamBrandingLogo(
  teamId: number,
  slot: BrandingLogoSlot,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.V2.post<Response<BrandingLogoResponse>>(
    `/teams/${teamId}/branding/logo?slot=${slot}`,
    formData
  );
  return data;
}

/** DELETE /api/v2/teams/{id}/branding/logo?slot= */
export async function deleteTeamBrandingLogo(teamId: number, slot: BrandingLogoSlot) {
  const { data } = await api.V2.delete(
    `/teams/${teamId}/branding/logo?slot=${slot}`
  );
  return data;
}
