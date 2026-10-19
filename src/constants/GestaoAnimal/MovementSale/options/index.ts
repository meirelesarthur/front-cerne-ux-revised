// src/constants/GestaoAnimal/MovementSale/options/index.ts
// -----------------------------------------------------------------------------
// Catálogos de enum do módulo de VENDA DE ANIMAIS (MovementSale) — a API NÃO
// expõe endpoint de opções para nenhum deles (mesmo racional de
// `transfers/options`); os labels vêm do backend só junto do registro
// (`*_label` no Resource). Fábrica canônica `(languageGB) => Map` +
// `getLabel`/`options`, mirror `transferTypeOptions`.
//
// Valores físicos exatos (`app/Enums/MovementSale/*.php`, TASK-VD-FE-01):
//   MovementSaleTypeEnum        — 1=Recria, 2=Abate (backing int)
//   MovementSaleStatusEnum      — 'P'=Pendente, 'F'=Finalizada (backing string)
//   MovementSalePricingTypeEnum — 1=Kg/Arroba, 2=Cabeça (backing int)
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type {
  MovementSalePricingType,
  MovementSaleStatus,
  MovementSaleType,
} from '@/@types/v2/MovementSales';

// ============================================
// 1. Tipo de venda — 1=Recria, 2=Abate
// ============================================

const movementSaleTypeLabels = (languageGB: LanguageDate): Map<MovementSaleType, string> => {
  const dictionary = languageGB.movementSales.movementSale.typeOptions;
  return new Map([
    [1, dictionary.rearing],
    [2, dictionary.slaughter],
  ]);
};

const getMovementSaleTypeLabel = (value: MovementSaleType, languageGB: LanguageDate): string =>
  movementSaleTypeLabels(languageGB).get(value) ?? String(value);

const movementSaleTypeOptionsList = (languageGB: LanguageDate): Option<MovementSaleType>[] =>
  Array.from(movementSaleTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const movementSaleTypeOptions = {
  getLabel: getMovementSaleTypeLabel,
  options: movementSaleTypeOptionsList,
};

// ============================================
// 2. Status — 'P'=Pendente, 'F'=Finalizada
// ============================================

const movementSaleStatusLabels = (languageGB: LanguageDate): Map<MovementSaleStatus, string> => {
  const dictionary = languageGB.movementSales.movementSale.statusOptions;
  return new Map([
    ['P', dictionary.pending],
    ['F', dictionary.finished],
  ]);
};

const getMovementSaleStatusLabel = (value: MovementSaleStatus, languageGB: LanguageDate): string =>
  movementSaleStatusLabels(languageGB).get(value) ?? String(value);

const movementSaleStatusOptionsList = (languageGB: LanguageDate): Option<MovementSaleStatus>[] =>
  Array.from(movementSaleStatusLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const movementSaleStatusOptions = {
  getLabel: getMovementSaleStatusLabel,
  options: movementSaleStatusOptionsList,
};

// ============================================
// 3. Forma de precificação — 1=Kg/Arroba, 2=Cabeça
// ============================================

const movementSalePricingTypeLabels = (
  languageGB: LanguageDate
): Map<MovementSalePricingType, string> => {
  const dictionary = languageGB.movementSales.movementSale.pricingTypeOptions;
  return new Map([
    [1, dictionary.kgArroba],
    [2, dictionary.head],
  ]);
};

const getMovementSalePricingTypeLabel = (
  value: MovementSalePricingType,
  languageGB: LanguageDate
): string => movementSalePricingTypeLabels(languageGB).get(value) ?? String(value);

const movementSalePricingTypeOptionsList = (
  languageGB: LanguageDate
): Option<MovementSalePricingType>[] =>
  Array.from(movementSalePricingTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const movementSalePricingTypeOptions = {
  getLabel: getMovementSalePricingTypeLabel,
  options: movementSalePricingTypeOptionsList,
};

// ============================================
// 4. Forma de pagamento — `type_payment` (contrato de tela §7.1, F15)
// ============================================
// Achado de fidelidade (TASK-VD-FE-02) — o legado usava `Nfe::typesPayment()`
// para este mesmo Select (`legacy-contract-vendas.yaml` L9, "nenhum select
// estático hardcoded relevante além... e Nfe::typesPayment()"); o
// `MovementSaleResource` novo NÃO expõe `type_payment` na leitura (nenhuma
// chave no Resource, ver docblock de `@/@types/v2/MovementSales`) e não há
// endpoint de opções próprio confirmado para este campo — `MovementSaleData.
// type_payment` é `string` livre (`MovementSaleRequest::rules()`, só
// `required|string`, sem `Rule::enum`). Mirror EXATO dos valores/labels de
// `App\Enums\Nfe\NfeTypePaymentEnum` (mesmo catálogo real que o legado já
// reaproveitava para esta tela) — catálogo local (sem endpoint, mesmo
// racional de `movementSaleTypeOptions` acima), não uma decisão de UX nova.

const movementSaleTypePaymentLabels = (languageGB: LanguageDate): Map<string, string> => {
  const dictionary = languageGB.movementSales.movementSale.typePaymentOptions;
  return new Map([
    ['01', dictionary.cash],
    ['02', dictionary.check],
    ['03', dictionary.creditCard],
    ['04', dictionary.debitCard],
    ['05', dictionary.storeCredit],
    ['10', dictionary.foodVoucher],
    ['11', dictionary.mealVoucher],
    ['12', dictionary.giftVoucher],
    ['13', dictionary.fuelVoucher],
    ['14', dictionary.commercialInvoice],
    ['15', dictionary.bankSlip],
    ['16', dictionary.bankDeposit],
    ['17', dictionary.pix],
    ['90', dictionary.noPayment],
    ['99', dictionary.other],
  ]);
};

const getMovementSaleTypePaymentLabel = (value: string, languageGB: LanguageDate): string =>
  movementSaleTypePaymentLabels(languageGB).get(value) ?? value;

const movementSaleTypePaymentOptionsList = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(movementSaleTypePaymentLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const movementSaleTypePaymentOptions = {
  getLabel: getMovementSaleTypePaymentLabel,
  options: movementSaleTypePaymentOptionsList,
};

// ============================================
// 5. Documento Fiscal — UT-000719 (D-097-12) — Sim/Não (boolean)
// ============================================
// Campo `financial.fiscal_document` da Finalização de Venda de Abate
// (individual e lote). Rótulos Sim/Não vêm de `defaltStrings.yes/no`.

const movementSaleFiscalDocumentLabels = (languageGB: LanguageDate): Map<boolean, string> =>
  new Map([
    [true, languageGB.defaltStrings.yes],
    [false, languageGB.defaltStrings.no],
  ]);

const getMovementSaleFiscalDocumentLabel = (value: boolean, languageGB: LanguageDate): string =>
  movementSaleFiscalDocumentLabels(languageGB).get(value) ?? String(value);

const movementSaleFiscalDocumentOptionsList = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(movementSaleFiscalDocumentLabels(languageGB)).map(([value, label]) => ({
    label,
    value,
  }));

const getMovementSaleFiscalDocumentOption = (
  value: boolean | null | undefined,
  languageGB: LanguageDate
): Option<boolean> | null =>
  movementSaleFiscalDocumentOptionsList(languageGB).find((option) => option.value === !!value) ??
  null;

export const movementSaleFiscalDocumentOptions = {
  getLabel: getMovementSaleFiscalDocumentLabel,
  options: movementSaleFiscalDocumentOptionsList,
  getOption: getMovementSaleFiscalDocumentOption,
};
