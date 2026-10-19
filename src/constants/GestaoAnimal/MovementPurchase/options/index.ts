// src/constants/GestaoAnimal/MovementPurchase/options/index.ts
// -----------------------------------------------------------------------------
// Catálogo de enum do módulo de COMPRA DE ANIMAIS (MovementPurchase) — a API
// NÃO expõe endpoint de opções para `type_payment` (mesmo racional de
// `movementSaleTypePaymentOptions`); os labels vêm do backend só junto do
// registro. Fábrica canônica `(languageGB) => Map` + `getLabel`/`options`,
// mirror EXATO de `movementSaleTypePaymentOptions`
// (`@/constants/GestaoAnimal/MovementSale/options`).
//
// Valor físico exato (`App\Enums\Nfe\NfeTypePaymentEnum`, mirror EXATO do
// catálogo já reusado por Vendas — 15 códigos SEFAZ, TASK-CP-04).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

// ============================================
// Forma de pagamento — `type_payment` (FLD-08 do cabeçalho)
// ============================================
// Achado de fidelidade (mirror `movementSaleTypePaymentOptions`) — o legado
// usava `Nfe::typesPayment()` para este mesmo Select; o
// `MovementPurchaseResource` novo expõe `type_payment` incondicionalmente
// (list E detail); `MovementPurchaseData.type_payment` é `string` livre
// (`MovementPurchaseRequest::rules()`, só `required|string|max:2`), sem
// endpoint de opções próprio — catálogo local, mesmo enum físico de Vendas
// (`App\Enums\Nfe\NfeTypePaymentEnum`).

const movementPurchaseTypePaymentLabels = (languageGB: LanguageDate): Map<string, string> => {
  const dictionary = languageGB.movementPurchases.movementPurchase.typePaymentOptions;
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

const getMovementPurchaseTypePaymentLabel = (value: string, languageGB: LanguageDate): string =>
  movementPurchaseTypePaymentLabels(languageGB).get(value) ?? value;

const movementPurchaseTypePaymentOptionsList = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(movementPurchaseTypePaymentLabels(languageGB)).map(([value, label]) => ({
    label,
    value,
  }));

export const movementPurchaseTypePaymentOptions = {
  getLabel: getMovementPurchaseTypePaymentLabel,
  options: movementPurchaseTypePaymentOptionsList,
};
