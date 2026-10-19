import { isAxiosError } from 'axios';

import { getLanguageGB } from '@/utils/auth-token';
import { getLanguageRouter } from '@/utils/get-language-route';

import { API_ERROR_CODES, NON_FIELD_ERROR_KEYS } from '@/constants/api-error-codes';
import { languageContextTypes } from '@/constants/languages';

import { LanguageDate } from '@/@types/language';

// Padrões da mensagem de unicidade (Laravel `unique`) por idioma — usados para
// reconhecer que um erro de validação é de DUPLICIDADE e trocá-lo por um texto
// profissional em vez de expor "O campo <nome_cru> já está sendo utilizado.".
const DUPLICATE_PATTERNS = [
  'já está sendo utilizado', // pt-BR
  'already been taken', // en
  'ya está siendo utilizado', // es
  'ya ha sido', // es (variação)
];

function isDuplicateMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return DUPLICATE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

// Mensagem profissional e localizada de duplicidade, a partir do nome cru do
// campo da API (ex.: 'description' -> "Já existe um cadastro com essa descrição.").
// Campos não mapeados caem numa mensagem genérica ("...com os dados informados.").
function duplicateMessage(fieldKey: string): string {
  try {
    const languageGB = getLanguageRouter(getLanguageGB() || languageContextTypes.BR);
    const apiValidation = languageGB?.defaltStrings?.apiValidation;
    if (!apiValidation) return '';
    const fieldLabel = apiValidation.fields[fieldKey];
    return fieldLabel
      ? apiValidation.duplicate.replace('{field}', fieldLabel)
      : apiValidation.duplicateGeneric;
  } catch {
    return '';
  }
}

// Retorna a 1ª mensagem específica por campo de um erro de validação (HTTP
// 422/400), lida de `response.data.errors` — objeto `{ campo: [mensagens] }` (ou,
// em respostas legadas, um array de strings). Erros de DUPLICIDADE viram um texto
// profissional e localizado; os demais mantêm a mensagem da API.
// Retorna `undefined` quando não há erro por campo, para o chamador aplicar o
// próprio fallback (ex.: uma mensagem de negócio específica daquela tela).
export function extractApiFieldErrorMessage(error: unknown): string | undefined {
  const fieldErrors = isAxiosError(error)
    ? ((error.response?.data as any)?.errors as unknown)
    : undefined;

  if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
    for (const [fieldKey, messages] of Object.entries(fieldErrors as Record<string, unknown>)) {
      if ((NON_FIELD_ERROR_KEYS as readonly string[]).includes(fieldKey)) continue;
      const message = Array.isArray(messages)
        ? messages.find((m): m is string => typeof m === 'string')
        : typeof messages === 'string'
          ? messages
          : undefined;
      if (message) {
        return isDuplicateMessage(message) ? duplicateMessage(fieldKey) || message : message;
      }
    }
    return undefined;
  }

  if (Array.isArray(fieldErrors)) {
    return fieldErrors.find((m): m is string => typeof m === 'string');
  }
  return undefined;
}

// Mensagem amigável para um toast de erro de mutação: prioriza a mensagem
// específica/profissional por campo (validação/duplicidade) e só então cai para
// `data.message` / `data.error` e, por último, `error.message`.
export function extractApiErrorMessage(error: unknown): string | undefined {
  const specific = extractApiFieldErrorMessage(error);
  if (specific) return specific;

  const resData = isAxiosError(error) ? (error.response?.data as any) : undefined;
  if (resData?.message) {
    return typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message);
  }
  if (resData?.error) {
    return typeof resData.error === 'string' ? resData.error : JSON.stringify(resData.error);
  }
  if (error instanceof Error) return error.message;
  return undefined;
}

export interface BlockedUuids {
  uuids: string[];
  truncated: boolean;
}

// Lê o 422 da exclusão em massa de animais (095): `errors.blocked_uuids` (uuids
// do próprio pedido, até 500) e `errors.blocked_uuids_truncated`. Retorna `null`
// quando não for 422 ou a lista vier ausente/vazia.
export function extractBlockedUuids(error: unknown): BlockedUuids | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null;

  const errors = (error.response.data as any)?.errors;
  const blocked = errors?.blocked_uuids;
  if (!Array.isArray(blocked)) return null;

  const uuids = blocked.filter((u): u is string => typeof u === 'string');
  if (uuids.length === 0) return null;

  return { uuids, truncated: errors.blocked_uuids_truncated === true };
}

export interface InUseItem {
  table: string;
  count: number;
}

/**
 * Detecta o 422 estruturado `errors.in_use` e normaliza os DOIS shapes reais
 * em produção:
 *  - array: `[{ resource, table, count }]` (Addressing/Cultivation/
 *    AccountingGrouper/Client/Proprietary/Contador/...)
 *  - mapa:  `{ [table]: count }` (Fodder/Grazing/ParameterWeight/Markers/...)
 * `resource` é IGNORADO deliberadamente (string PT-BR hardcoded no backend,
 * não confiável para i18n — ver FRONT-03-InUseBlockedDialog.md, Achado
 * crítico). Retorna `null` quando não há 422 estruturado ou a lista vier
 * vazia — o chamador cai no toast genérico (`getBusinessMutationErrorMessage`),
 * mesmo comportamento de hoje.
 * @param {unknown} error Erro capturado na mutação de exclusão.
 * @return {InUseItem[] | null} Itens normalizados (`table` + `count`) ou `null` se não houver 422 estruturado.
 */
export function extractInUseItems(error: unknown): InUseItem[] | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null;

  const inUse = (error.response.data as any)?.errors?.in_use;
  if (!inUse) return null;

  if (Array.isArray(inUse)) {
    const items = inUse
      .filter(
        (i): i is { table: string; count: number } =>
          !!i && typeof i.table === 'string' && typeof i.count === 'number'
      )
      .map((i) => ({ table: i.table, count: i.count }));
    return items.length > 0 ? items : null;
  }

  if (typeof inUse === 'object') {
    const items = Object.entries(inUse as Record<string, unknown>)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .map(([table, count]) => ({ table, count }));
    return items.length > 0 ? items : null;
  }

  return null;
}

// Mapeia `response.data.code` (422) -> mensagem i18n. `undefined` para qualquer
// outro erro/`code`, que segue o fluxo normal.
export function getCodedBusinessMessage(
  error: unknown,
  languageGB: LanguageDate
): string | undefined {
  if (!isAxiosError(error) || error.response?.status !== 422) return undefined;

  switch ((error.response.data as { code?: unknown } | undefined)?.code) {
    case API_ERROR_CODES.RECORD_HAS_ACTIVE_LINKS:
      return languageGB.defaltStrings.deletion.blocked;
    case API_ERROR_CODES.PURCHASE_CANCEL_HAS_WEIGHINGS:
      return languageGB.processamentos.processing.list.cancelBlockedByWeighings;
    default:
      return undefined;
  }
}

// Mensagem de negócio (PT-BR/EN/ES conforme languageGB) para o toast de erro de
// MUTAÇÃO (useRequest.tsx) — canônica desta trilha. Preserva sem alteração o
// caminho 422/400 por campo (extractApiFieldErrorMessage) e nunca prefixa o
// código HTTP cru nem repassa `error.message` do Axios (isso fica só no
// ErrorLogPanel, via emitAxiosError no interceptor). Ver contrato
// CORE_WORKSPACE/97-Esteiras/003/CONTRATOS/CONTRATO-FE-ERRO-MUTACAO-useRequest.md.
export function getBusinessMutationErrorMessage(error: unknown, languageGB: LanguageDate): string {
  // 095 (P5 + D7): `code` estável da API decide a mensagem — texto da PRÓPRIA i18n
  // (3 idiomas), nunca a `message` da API. Vem antes da mensagem por campo.
  const codedMessage = getCodedBusinessMessage(error, languageGB);
  if (codedMessage) return codedMessage;

  const fieldMessage = extractApiFieldErrorMessage(error);
  if (fieldMessage) return fieldMessage;

  if (!isAxiosError(error) || !error.response) {
    return languageGB.common.errorLog.networkError;
  }

  const status = error.response.status;
  const resData = error.response.data as any;
  const topMessage = typeof resData?.message === 'string' ? resData.message : undefined;

  switch (status) {
    case 403:
      return languageGB.common.errorLog.byStatus.forbidden;
    case 404:
      return languageGB.common.errorLog.byStatus.notFound;
    case 409:
      return languageGB.common.errorLog.byStatus.conflict;
    case 422:
      return topMessage || languageGB.common.errorLog.unknownError;
    case 500:
    case 502:
    case 503:
    case 504:
      return languageGB.common.errorLog.byStatus.server;
    default:
      return topMessage || languageGB.common.errorLog.unknownError;
  }
}

export interface QueryErrorPresentation {
  message: string;
  retryable: boolean;
}

// Deriva apresentação de erro para estado de QUERY (GET) em grid/listagem — usa o
// MESMO mapa de status→mensagem de `getBusinessMutationErrorMessage` (Wave 0),
// mas devolve também `retryable`: false para erros que retry nunca resolve
// (403 de permissão, 404 de recurso), true para os demais (5xx, rede/timeout,
// e qualquer status não mapeado — fallback otimista: se não sabemos, permitir
// tentar de novo é mais seguro que escondar a única saída do usuário). Ver
// contrato CORE_WORKSPACE/97-Esteiras/003/CONTRATOS/CONTRATO-FE-ERRO-GRID-403-AWARE.md.
export function getQueryErrorPresentation(
  error: unknown,
  languageGB: LanguageDate
): QueryErrorPresentation {
  if (!isAxiosError(error) || !error.response) {
    return { message: languageGB.common.errorLog.networkError, retryable: true };
  }

  const status = error.response.status;
  switch (status) {
    case 403:
      // TASK-072-FE-10 (E1, G-FE-2): SÓ o 403 marcado pelo back com o `code`
      // estável `FARM_CONTEXT_REQUIRED` (sem fazenda ativa) ganha texto próprio
      // traduzido. Qualquer outro 403 (Spatie, AccessDenied, domínio, outro
      // `code`) segue EXATAMENTE com `forbiddenList`.
      if (
        (error.response.data as { code?: unknown } | undefined)?.code ===
        API_ERROR_CODES.FARM_CONTEXT_REQUIRED
      ) {
        return {
          message: languageGB.common.errorLog.byStatus.forbiddenFarmContext,
          retryable: false,
        };
      }
      return { message: languageGB.common.errorLog.byStatus.forbiddenList, retryable: false };
    case 404:
      return { message: languageGB.common.errorLog.byStatus.notFound, retryable: false };
    case 409:
      return { message: languageGB.common.errorLog.byStatus.conflict, retryable: true };
    case 500:
    case 502:
    case 503:
    case 504:
      return { message: languageGB.common.errorLog.byStatus.server, retryable: true };
    default:
      return { message: languageGB.common.errorLog.unknownError, retryable: true };
  }
}
