// src/contexts/AuthContext/mapUser.ts
// -----------------------------------------------------------------------------
// Extraído de `AuthContext/index.tsx` (Execução 071, TASK-071-FE-02,
// FE02-T01) para ser testável isoladamente. Converte o perfil do backend GB
// Cerne ({ uuid, name, email, photo_url, ... }) para o formato `User` que o
// contexto/UI consomem ({ user_id, email, username, photoUrl }). Não há id
// numérico exposto (a API usa uuid) — usamos 0 como placeholder.
//
// `uuid` (lote 2, Execução 027 — TASK-FE-805): o backend SEMPRE devolve
// `uuid` em `/auth/me` mas nenhum tipo de front o capturava até aqui —
// achado durante a implementação da grid de Usuários, que precisa comparar
// `row.original.uuid` com o uuid do usuário LOGADO. Adição aditiva: `mapUser`
// é o ÚNICO funil de construção de `User` no projeto (grep confirmado).
//
// `photoUrl` (Execução 071, SRF-071-12/15): aditivo — `profile?.photo_url`
// vem de `MeResource`/`ProfileResource` (contrato API §1/§4), `null` sem
// foto. Reflete o valor salvo depois de qualquer `PUT /me/profile`, porque
// `refreshProfile()` rechama `/auth/me` e este funil roda de novo.
// -----------------------------------------------------------------------------

import type { User } from "@/@types/auth";

export function mapUser(profile: any): User {
  return {
    user_id: profile?.user_id ?? 0,
    uuid: profile?.uuid ?? '',
    email: profile?.email,
    username: profile?.name ?? profile?.username ?? profile?.email,
    photoUrl: profile?.photo_url ?? null,
  };
}

export default mapUser;
