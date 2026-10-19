// src/utils/guid.ts
// Validação e geração de GUID/UUID — padrão da empresa para projetos novos.
//
// Aceita qualquer UUID v1-v8 (o dígito de versão pode ser 1..8 e o de variante
// 8/9/a/b): cobre `crypto.randomUUID()` (v4) E os UUIDs ORDENADOS v7 que o
// backend GB.Cerne emite via `HasUuids` do Laravel (ex.: "019f62a6-...-7023-...").
// ⚠️ Não restrinja a v1-v5: quebraria o modo edição de TODAS as telas cujo id
// vem do backend (o hook cai silenciosamente no modo "criar"). Reutilizado
// pelos hooks `useCustomFormQueryByGuid` e `useCustomGridQueryByGuid`.

import { v4 as uuidv4 } from 'uuid';

export const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Retorna `true` se `value` for um GUID/UUID (v1-v8) válido.
 * @param {string | undefined | null} value - Valor a validar.
 * @return {boolean} `true` quando `value` casa com o formato GUID/UUID v1-v8.
 */
export function isValidGuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return GUID_REGEX.test(value);
}

// -----------------------------------------------------------------------------
// generateClientId — id client-side ESTÁVEL, seguro em contexto INSEGURO (HTTP).
//
// `crypto.randomUUID` só existe em *secure context* (HTTPS ou `localhost`).
// Em homologação servida por HTTP puro (`http://193.123.110.42:5173`) ele é
// `undefined` e chamá-lo lança `TypeError: crypto.randomUUID is not a
// function` — era exatamente o que quebrava a importação de múltiplos KMLs em
// `CreateMultipleAreas.tsx` e a fila de pendências em `PendencyQueueContext`
// (local funcionava, pois `localhost` é secure context).
//
// O fallback usa `uuid` v4 (`crypto.getRandomValues` por baixo), que continua
// disponível em contexto inseguro — mesma dependência (`uuid@^10`) já usada
// por `NotificationQueueContext`/`ErrorLogContext`. Mesmo racional de guarda
// de `createGridPresetId` (`src/hooks/useGridSettings.ts`), consolidado aqui
// como utilitário único para não duplicar a checagem em cada chamador.
// -----------------------------------------------------------------------------

/**
 * Gera um id client-side (UUID v4) mesmo em contexto inseguro (HTTP/homolog).
 * @return {string} UUID v4 — via `crypto.randomUUID()` quando disponível
 *   (contexto seguro), senão via `uuid` v4 (fallback contexto inseguro).
 */
export function generateClientId(): string {
  const cryptoRef: Crypto | undefined =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }

  return uuidv4();
}
