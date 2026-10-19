// -----------------------------------------------------------------------------
// Hidratação de edição da Entrada de Insumos (DD-078-03/06, T-078-FE-04).
//
// Funções PURAS: transformam os refs do `GET /input-entries/{uuid}` (agora com
// nome — T-078-API-01) em `Option { label, value }` para os Selects. Regra
// inegociável: NUNCA usar o uuid como label. Sem nome no ref, o label cai para
// `NO_LABEL_PLACEHOLDER`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  InputEntryCenterRef,
  InputEntryCultivationRef,
  InputEntryMeasurementRef,
} from '@/@types/v2/InputEntries';

export const NO_LABEL_PLACEHOLDER = '—';

/**
 * Monta uma Option cujo label nunca é o uuid.
 * @param {string} uuid - Valor da option.
 * @param {string | null | undefined} label - Nome legível (pode faltar).
 * @return {Option<string>} Option com label legível ou placeholder.
 */
export function refOption(uuid: string, label: string | null | undefined): Option<string> {
  const trimmed = label?.trim();
  return { label: trimmed ? trimmed : NO_LABEL_PLACEHOLDER, value: uuid };
}

/**
 * Option de Centro de Custo (`code — description`, mesmo formato do menu).
 * @param {InputEntryCenterRef} center - Ref do CC (inclusive sintético salvo, DD-06).
 * @return {Option<string>} Option de exibição.
 */
export function costCenterOption(center: InputEntryCenterRef): Option<string> {
  const code = center.code?.trim();
  const description = center.description?.trim();
  const label = code && description ? `${code} — ${description}` : (description ?? code);
  return refOption(center.uuid, label);
}

/**
 * Option de Classificação (Cultivo).
 * @param {InputEntryCultivationRef} cultivation - Ref de cultivo.
 * @return {Option<string>} Option de exibição.
 */
export function cultivationOption(cultivation: InputEntryCultivationRef): Option<string> {
  return refOption(cultivation.uuid, cultivation.name);
}

/**
 * Option de Unidade de Medida.
 * @param {InputEntryMeasurementRef | null | undefined} measurement - Ref da unidade.
 * @return {Option<string> | null} Option, ou `null` se não houver ref.
 */
export function measurementOption(
  measurement: InputEntryMeasurementRef | null | undefined
): Option<string> | null {
  return measurement ? refOption(measurement.uuid, measurement.description) : null;
}

/**
 * Fragmento do payload com o uuid do item existente (DD-078-07 b). Item novo
 * (sem uuid) ou criação nunca enviam `uuid`.
 * @param {string | null | undefined} itemUuid - uuid do item hidratado, se houver.
 * @param {boolean} isEditing - `true` no update.
 * @return {Record<string, string>} `{ uuid }` ou objeto vazio.
 */
export function buildItemUuidPayload(
  itemUuid: string | null | undefined,
  isEditing: boolean
): { uuid?: string } {
  return isEditing && itemUuid ? { uuid: itemUuid } : {};
}

/**
 * Extrai do 422 os erros `items.N.uuid` (ex.: troca de produto de item
 * existente, DD-078-07 b) para exibir na linha do item.
 * @param {Record<string, string[]> | undefined} fieldErrors - `errors` flat do 422.
 * @return {object[]} Lista `{ index, message }` por linha.
 */
export function extractItemUuidErrors(
  fieldErrors: Record<string, string[]> | undefined
): Array<{ index: number; message: string }> {
  if (!fieldErrors) return [];
  return Object.entries(fieldErrors).flatMap(([key, messages]) => {
    const match = /^items\.(\d+)\.uuid$/.exec(key);
    return match && messages?.[0] ? [{ index: Number(match[1]), message: messages[0] }] : [];
  });
}

/**
 * Lote/validade ficam somente leitura para item já gravado (DD-078-07 b).
 * @param {string | null | undefined} itemUuid - uuid do item no form.
 * @return {boolean} `true` se o item já existe.
 */
export function isLotLocked(itemUuid: string | null | undefined): boolean {
  return !!itemUuid;
}

/**
 * Opções do Select "Un. Medida": 1ª e 2ª unidade do produto + a unidade JÁ
 * SALVA (mesmo que não pertença mais ao produto), sem duplicar por `value`.
 * @param {Array<Option<string> | null | undefined>} productUnits - Unidades do produto.
 * @param {Option<string> | null | undefined} current - Valor atual do campo.
 * @return {Option<string>[]} Lista deduplicada.
 */
export function buildMeasurementOptions(
  productUnits: Array<Option<string> | null | undefined>,
  current: Option<string> | null | undefined
): Option<string>[] {
  return Array.from(
    new Map(
      [...productUnits, current]
        .filter((option): option is Option<string> => Boolean(option))
        .map((option) => [option.value, option])
    ).values()
  );
}
