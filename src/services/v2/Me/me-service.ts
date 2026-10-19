// src/services/v2/Me/me-service.ts
// -----------------------------------------------------------------------------
// Me Service — API v1 do backend Laravel GB.Cerne, endpoints `/me/*` que a
// tela "Meu perfil" consome (Execução 071, TASK-071-FE-01). Contrato-alvo:
// `071-API-contrato-alvo.md` §1-§5.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /me/profile      → data: OwnProfile
//   PUT  /me/profile      → sem foto, JSON { name }
//   POST /me/profile      → com foto, multipart FormData { _method:'PUT', name, photo }
//                            (method spoofing — mirror `partner-service.ts`/
//                            `farm-admin-service.ts`: um PUT nativo multipart
//                            NÃO popula $_FILES no PHP, contrato API §2.1/DIV-13)
//   PUT  /me/password     → JSON { current_password, password, password_confirmation }
//   PUT  /me/preferences  → JSON { lang } (substitui o `PATCH /auth/profile`
//                            morto — contrato API §5, DIV-09)
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  ChangeOwnPasswordPayload,
  OwnProfile,
  UpdateOwnProfilePayload,
  UpdatePreferencesPayload,
} from '@/@types/v2/Me';

/** `GET /api/v1/me/profile`. */
async function getOwnProfile(): Promise<Response<OwnProfile>> {
  const { data } = await api.V2.get<Response<OwnProfile>>('/me/profile');
  return data;
}

/**
 * `PUT`/`POST(_method=PUT) /api/v1/me/profile` — contrato API §2. Payload
 * SEMPRE só `name` (+ `photo` quando há seleção nova). NUNCA envia `email`
 * nem `remove_photo` (D1/D8, P-01) — a tela nunca constrói esse payload.
 *
 * Sem `photo`: `PUT` JSON (transporte mais simples, sem method spoofing).
 * Com `photo`: `POST` + `_method=PUT` multipart — um `PUT` nativo multipart
 * não popula `$_FILES` no PHP (contrato API §2.1, mirror `partner-service.ts`).
 */
async function updateOwnProfile({
  name,
  photo,
}: UpdateOwnProfilePayload): Promise<Response<OwnProfile>> {
  if (photo) {
    const fd = new FormData();
    fd.append('_method', 'PUT');
    fd.append('name', name);
    fd.append('photo', photo);
    const { data } = await api.V2.post<Response<OwnProfile>>('/me/profile', fd);
    return data;
  }
  const { data } = await api.V2.put<Response<OwnProfile>>('/me/profile', { name });
  return data;
}

/** `PUT /api/v1/me/password` — contrato API §3. */
async function changeOwnPassword(payload: ChangeOwnPasswordPayload): Promise<Response<null>> {
  const { data } = await api.V2.put<Response<null>>('/me/password', payload);
  return data;
}

/**
 * `PUT /api/v1/me/preferences` — contrato API §5. Único campo desta entrega:
 * `lang` (`pt-BR|en|es`). Substitui o `PATCH /auth/profile` morto que
 * `useLanguageSwitcher` chamava antes (rota inexistente, DIV-09).
 */
async function updatePreferences(
  payload: UpdatePreferencesPayload
): Promise<Response<{ lang: string }>> {
  const { data } = await api.V2.put<Response<{ lang: string }>>('/me/preferences', payload);
  return data;
}

export { changeOwnPassword, getOwnProfile, updateOwnProfile, updatePreferences };
