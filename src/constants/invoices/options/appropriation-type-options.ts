// src/constants/invoices/options/appropriation-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `items.*.appropriation_type` — `App\Enums\
// Invoice\AppropriationType` (int-backed, gap de valor 3: NENHUM=0/
// AGRICOLA=1/PASTAGEM=2/MANUTENCAO_EQUIPAMENTO=4/ABASTECIMENTO=5).
//
// GAP-528 (confirmado por leitura direta do backend): só `AGRICOLA(1)` é
// processado de fato (`AppropriationRoutingAction`); os ramos `PASTAGEM(2)`/
// `MANUTENCAO_EQUIPAMENTO(4)`/`ABASTECIMENTO(5)` passam a validação HTTP mas
// o backend responde 422 de negócio. A UI NÃO esconde essas opções (o campo
// existe e é aceito pelo `InvoiceRequest`) — apenas rotula com um sufixo
// "(indisponível nesta versão)" e o submit trata o 422 com mensagem clara
// (`InvoiceItemsTab.tsx`/`CreateOrUpdateInvoice.tsx`), nunca quebrando a UI.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { AppropriationTypeValue } from '@/@types/v2/Invoices';

export const appropriationTypeIndex = {
  NENHUM: 0,
  AGRICOLA: 1,
  PASTAGEM: 2,
  MANUTENCAO_EQUIPAMENTO: 4,
  ABASTECIMENTO: 5,
} as const satisfies Record<string, AppropriationTypeValue>;

/** Único ramo funcional no backend hoje (GAP-528). */
export const APPROPRIATION_TYPE_FUNCTIONAL_VALUES: AppropriationTypeValue[] = [
  appropriationTypeIndex.NENHUM,
  appropriationTypeIndex.AGRICOLA,
];

export function isAppropriationTypeFunctional(
  value: AppropriationTypeValue | null | undefined
): boolean {
  if (value === null || value === undefined) return true;
  return APPROPRIATION_TYPE_FUNCTIONAL_VALUES.includes(value);
}

const labels = (languageGB: LanguageDate): Map<AppropriationTypeValue, string> => {
  const dictionary = languageGB.invoices.invoice.appropriationTypeOptions;
  const suffix = ` ${dictionary.unavailableSuffix}`;
  return new Map([
    [appropriationTypeIndex.NENHUM, dictionary.none],
    [appropriationTypeIndex.AGRICOLA, dictionary.agriculture],
    [appropriationTypeIndex.PASTAGEM, `${dictionary.pasture}${suffix}`],
    [appropriationTypeIndex.MANUTENCAO_EQUIPAMENTO, `${dictionary.equipmentMaintenance}${suffix}`],
    [appropriationTypeIndex.ABASTECIMENTO, `${dictionary.fueling}${suffix}`],
  ]);
};

const getLabel = (value: AppropriationTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const options = (languageGB: LanguageDate): Option<AppropriationTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const appropriationTypeOptions = { getLabel, options };
