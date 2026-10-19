// src/@types/v2/Me/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do domínio "Meu perfil" (`/me/*`) — Execução 071, TASK-071-FE-01.
// Espelha `071-API-contrato-alvo.md` §1 (GET /me/profile), §2 (PUT /me/profile)
// e §3 (PUT /me/password). Envelope `ApiResponse` (`Response<T>`, ver
// `@/@types/response-api`) — os campos abaixo são só o `data`.
//
// `UserLangApi` são os códigos do BACKEND (`pt-BR|en|es`) — NÃO confundir com
// os códigos do FRONT (`BR|US|ES`, `get_pwa_i18n_pattern §5`). O mapeamento
// entre os dois vive em `useLanguageSwitcher.tsx` (front → API) e não há
// consumidor que precise do sentido inverso nesta entrega.
// -----------------------------------------------------------------------------

export type UserLangApi = 'pt-BR' | 'en' | 'es';

/** `GET /me/profile` — contrato API §1 (campo completo, mesmo que a UI da
 *  071 só consuma `name`/`email`/`photo_url` — D1 tira telefone/cidade/
 *  endereço da tela, mas o endpoint continua devolvendo-os). */
export interface OwnProfile {
  uuid: string;
  name: string;
  email: string;
  /** Path relativo (compat) — sempre presente junto de `photo_url` quando há foto. */
  photo: string | null;
  /** Aditivo (SRF-071-15/DIV-08) — URL pública já resolvida (`Storage::url`). */
  photo_url: string | null;
  lang: UserLangApi | null;
  phone: string | null;
  address: string | null;
  number: string | null;
  district: string | null;
  zip_code: string | null;
  city: {
    uuid: string;
    name: string;
    state: { name: string; uf: string };
  } | null;
}

/** `PUT`/`POST(_method=PUT) /me/profile` — contrato API §2.2. A tela da 071
 *  (D1/D8) só envia `name` e, havendo seleção, `photo`. `email` NUNCA é
 *  enviado (readonly, P-01) e `remove_photo` NUNCA é enviado pelo front
 *  (D8) — ambos ficam fora deste payload por design, não por omissão. */
export interface UpdateOwnProfilePayload {
  name: string;
  photo?: File;
}

/** `PUT /me/password` — contrato API §3.1. */
export interface ChangeOwnPasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/** `PUT /me/preferences` — contrato API §5 (só o campo que esta tela usa). */
export interface UpdatePreferencesPayload {
  lang: UserLangApi;
}
