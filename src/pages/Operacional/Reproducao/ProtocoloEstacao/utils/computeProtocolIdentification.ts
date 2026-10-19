// src/pages/Operacional/Reproducao/ProtocoloEstacao/utils/computeProtocolIdentification.ts
// -----------------------------------------------------------------------------
// CAL-005 — cálculo client-side de `identification` (FLD-015) por linha do
// subcadastro de itens. Mirror do algoritmo do protocolo de sincronização
// hormonal legado (dia zero fixo + dias decorridos): a referência "DZERO" é a
// DATA DA PRIMEIRA LINHA do array (`items[0]`, ordem de exibição do
// `useFieldArray`) — não o mínimo global das datas. Linhas com a mesma data da
// referência recebem `"DZERO"`; linhas com data posterior recebem `"D" +
// diasDeDiferença`; linhas com data ANTERIOR à referência são inválidas
// (`invalid: true`, mirror SURF-055 "não pode ser anterior à primeira
// aplicação") — a mensagem de erro é responsabilidade do caller (i18n,
// `ProtocolSeasonItemsFieldArray.tsx`, TASK-FE-1055/1057), não desta função
// pura.
//
// Função PURA — sem dependência de React/RHF, testável isoladamente (mirror
// separação de `checkBatchDate`/hooks dedicados do sibling `LoteReproducao`).
// -----------------------------------------------------------------------------

export interface ProtocolIdentificationInput {
  date: string;
}

export interface ProtocolIdentificationResult {
  identification: string;
  /** `true` quando `date` é anterior à referência DZERO (linha 0) — inválido. */
  invalid?: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Diferença em dias inteiros entre duas datas ISO `yyyy-MM-dd`. Reusado por
 * `buildProtocolSeasonTimelinePreview.ts` (CAL-006/CAL-007, mesmo cálculo).
 *
 * @param {string} referenceDate - Data de referência (ISO `yyyy-MM-dd`).
 * @param {string} date - Data a comparar (ISO `yyyy-MM-dd`).
 * @return {number} Diferença em dias (`date - referenceDate`).
 */
export function daysBetween(referenceDate: string, date: string): number {
  const reference = new Date(`${referenceDate}T00:00:00`).getTime();
  const current = new Date(`${date}T00:00:00`).getTime();
  return Math.round((current - reference) / MS_PER_DAY);
}

export function computeProtocolIdentification(
  items: ProtocolIdentificationInput[]
): ProtocolIdentificationResult[] {
  if (items.length === 0) return [];

  const referenceDate = items[0]?.date || null;

  return items.map((item) => {
    if (!item.date || !referenceDate) {
      return { identification: '' };
    }

    if (item.date < referenceDate) {
      return { identification: '', invalid: true };
    }

    const diffDays = daysBetween(referenceDate, item.date);
    return { identification: diffDays === 0 ? 'DZERO' : `D${diffDays}` };
  });
}

export default computeProtocolIdentification;
