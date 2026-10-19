// src/constants/Fiscal/mdfe-payment-options.ts
// -----------------------------------------------------------------------------
// Opções dos enums de pagamento de MDFe (mirror `MdfePaymentTypeEnum`/
// `MdfePaymentComponentTypeEnum` do backend, LK016/LK017,
// `CONTRATO-API-MDFE.md §3`) — TASK-MDFE-FE-01.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MdfePaymentComponentType, MdfePaymentType } from '@/@types/v2/Fiscal/Mdfe';

// LK016 — 0=Pago, 1=A Pagar.
function paymentTypeOptions(languageGB: LanguageDate): Option<MdfePaymentType>[] {
  const text = languageGB.mdfes.mdfe.paymentType;
  return [
    { label: text.pago, value: 0 },
    { label: text.aPagar, value: 1 },
  ];
}

function getPaymentTypeLabel(
  value: MdfePaymentType | null | undefined,
  languageGB: LanguageDate
): string {
  if (value === null || value === undefined) return '—';
  return paymentTypeOptions(languageGB).find((option) => option.value === value)?.label ?? '—';
}

export const mdfePaymentTypeOptions = { options: paymentTypeOptions, getLabel: getPaymentTypeLabel };

// LK017 — 01=Vale Pedágio, 02=Impostos/Taxas, 03=Despesas, 99=Outros.
function componentTypeOptions(languageGB: LanguageDate): Option<MdfePaymentComponentType>[] {
  const text = languageGB.mdfes.mdfe.componentType;
  return [
    { label: text.valePedagio, value: '01' },
    { label: text.impostosTaxas, value: '02' },
    { label: text.despesas, value: '03' },
    { label: text.outros, value: '99' },
  ];
}

function getComponentTypeLabel(
  value: MdfePaymentComponentType | null | undefined,
  languageGB: LanguageDate
): string {
  if (!value) return '—';
  return componentTypeOptions(languageGB).find((option) => option.value === value)?.label ?? value;
}

export const mdfePaymentComponentOptions = {
  options: componentTypeOptions,
  getLabel: getComponentTypeLabel,
};
