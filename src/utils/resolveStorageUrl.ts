// src/utils/resolveStorageUrl.ts
// -----------------------------------------------------------------------------
// Deriva a URL absoluta de um caminho de storage PÚBLICO cru devolvido pela
// API (ex.: `documents/xxx.pdf`, `MovementSaleResource.documents[].anexo`) —
// Tarefa 17.b (task-packet 17, matriz FID-G3F §3.1, achado A).
//
// Divergência real: `MovementSaleResource` devolve `anexo` como caminho
// relativo cru, diferente do padrão `DocumentResource.url` já usado no resto
// da API (que entrega URL pronta — ver `DocumentManagementAttachmentRow.
// file_url`, `@/@types/v2/Documentos`). O fork NÃO tinha helper de storage
// até esta Tarefa. Gap aditivo recomendado à API (expor `url` neste bloco,
// mirror `DocumentResource`) — registrado, não bloqueia.
//
// Regra de ouro: ZERO hardcode de host/porta. A origem do backend é SEMPRE
// derivada de `VITE_API_PHP_BACK_URL` (que aponta para a API e termina em
// `/api/v1`, ver `.env`/`.env.example`) — nunca de uma env var nova nem de
// uma string fixa. `Storage::disk('public')->url` no servidor é
// `APP_URL + /storage/{caminho}` (`config/filesystems.php`), e `APP_URL`
// compartilha a mesma origem de `VITE_API_PHP_BACK_URL` menos o sufixo
// `/api/v1` — por isso a derivação abaixo é suficiente sem env var própria.
// -----------------------------------------------------------------------------

const API_V1_SUFFIX = /\/api\/v1\/?$/;

/**
 * Resolve a ORIGEM do backend (protocolo + host + porta, SEM `/api/v1`) a
 * partir de `VITE_API_PHP_BACK_URL` — nunca hardcoded.
 * @return {string} Origem do backend (ex.: `http://localhost:8080`).
 */
export function resolveApiOrigin(): string {
  const base = (import.meta.env.VITE_API_PHP_BACK_URL as string | undefined) ?? '';
  return base.replace(API_V1_SUFFIX, '');
}

/**
 * Resolve um caminho de storage cru (ex.: `documents/xxx.pdf`, sem barra
 * inicial) para uma URL absoluta do disco público (`Storage::disk('public')`,
 * `php artisan storage:link` → `{origem}/storage/{caminho}`).
 *
 * Retorna `null` para entrada vazia — preserva o 3º estado "sem arquivo" do
 * `FileUpload` (nunca fabrica uma URL para um `anexo` ausente, SEM MOCK).
 * @param {string | null | undefined} relativePath Caminho cru devolvido pela API (`documents[].anexo`).
 * @return {string | null} URL absoluta do arquivo, ou `null` se `relativePath` for vazio.
 */
export function resolveStorageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;

  const origin = resolveApiOrigin();
  const cleanPath = relativePath.replace(/^\/+/, '');

  return `${origin}/storage/${cleanPath}`;
}
