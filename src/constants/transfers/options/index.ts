// src/constants/transfers/options/index.ts
// -----------------------------------------------------------------------------
// 7 catálogos de enum do módulo de ROMANEIOS — a API NÃO expõe endpoint de
// opções para nenhum deles (Decisão D7 do contrato de API, já fechada); os
// `*_label` só chegam junto do registro. Fábrica canônica
// `(languageGB) => Map` + `getLabel`/`options`, mirror
// `invoiceDocumentTypeOptions` (front-contract-romaneios.md §7.5,
// GAP-TRF-FE-13).
//
// Três armadilhas de serialização, todas confirmadas no contrato — NÃO
// normalizar nenhum dos 3 valores físicos abaixo:
//   1. `transferPaymentTypeOptions` — strings de 2 dígitos com zero à
//      esquerda ("01".."99"). Enviar `1` em vez de `"01"` reprova no
//      `Rule::enum` do servidor.
//   2. `paymentIndicatorOptions` — backed por `int` (0/1), único enum
//      NÃO-string do módulo. `Option<number>`, conversão explícita no submit.
//   3. `expenseTypeOptions` — `ExpenseTypeEnum::SERVICOS = 'serviços'`, com
//      cedilha e acento. Valor físico do enum backed no servidor.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type {
  Apropriation,
  ExpensePayer,
  ExpenseType,
  PaymentIndicator,
  TransferPaymentType,
  TransferStatus,
  TransferType,
} from '@/@types/v2/Transfers';

// ============================================
// 1. Tipo do romaneio — `V` Venda · `C` Colheita
// ============================================

const transferTypeLabels = (languageGB: LanguageDate): Map<TransferType, string> => {
  const dictionary = languageGB.transfers.transfer.typeOptions;
  return new Map([
    ['V', dictionary.sale],
    ['C', dictionary.harvest],
  ]);
};

const getTransferTypeLabel = (value: TransferType, languageGB: LanguageDate): string =>
  transferTypeLabels(languageGB).get(value) ?? String(value);

const transferTypeOptionsList = (languageGB: LanguageDate): Option<TransferType>[] =>
  Array.from(transferTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const transferTypeOptions = {
  getLabel: getTransferTypeLabel,
  options: transferTypeOptionsList,
};

// ============================================
// 2. Status do romaneio — `P` Pendente · `F` Finalizada
// ============================================

const transferStatusLabels = (languageGB: LanguageDate): Map<TransferStatus, string> => {
  const dictionary = languageGB.transfers.transfer.statusOptions;
  return new Map([
    ['P', dictionary.pending],
    ['F', dictionary.finished],
  ]);
};

const getTransferStatusLabel = (value: TransferStatus, languageGB: LanguageDate): string =>
  transferStatusLabels(languageGB).get(value) ?? String(value);

const transferStatusOptionsList = (languageGB: LanguageDate): Option<TransferStatus>[] =>
  Array.from(transferStatusLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const transferStatusOptions = {
  getLabel: getTransferStatusLabel,
  options: transferStatusOptionsList,
};

// ============================================
// 3. Tipo de pagamento — 15 códigos fiscais, string com zero à esquerda.
//    ⚠️ NUNCA normalizar para número — `Rule::enum` do servidor valida a
//    string exata.
// ============================================

const transferPaymentTypeIndex = {
  CASH: '01',
  CHECK: '02',
  CREDIT_CARD: '03',
  DEBIT_CARD: '04',
  STORE_CREDIT: '05',
  FOOD_VOUCHER: '10',
  MEAL_VOUCHER: '11',
  GIFT_VOUCHER: '12',
  FUEL_VOUCHER: '13',
  TRADE_BILL: '14',
  BANK_SLIP: '15',
  BANK_DEPOSIT: '16',
  PIX: '17',
  NO_PAYMENT: '90',
  OTHER: '99',
} as const satisfies Record<string, TransferPaymentType>;

const transferPaymentTypeLabels = (languageGB: LanguageDate): Map<TransferPaymentType, string> => {
  const dictionary = languageGB.transfers.transfer.paymentTypeOptions;
  return new Map([
    [transferPaymentTypeIndex.CASH, dictionary.cash],
    [transferPaymentTypeIndex.CHECK, dictionary.check],
    [transferPaymentTypeIndex.CREDIT_CARD, dictionary.creditCard],
    [transferPaymentTypeIndex.DEBIT_CARD, dictionary.debitCard],
    [transferPaymentTypeIndex.STORE_CREDIT, dictionary.storeCredit],
    [transferPaymentTypeIndex.FOOD_VOUCHER, dictionary.foodVoucher],
    [transferPaymentTypeIndex.MEAL_VOUCHER, dictionary.mealVoucher],
    [transferPaymentTypeIndex.GIFT_VOUCHER, dictionary.giftVoucher],
    [transferPaymentTypeIndex.FUEL_VOUCHER, dictionary.fuelVoucher],
    [transferPaymentTypeIndex.TRADE_BILL, dictionary.tradeBill],
    [transferPaymentTypeIndex.BANK_SLIP, dictionary.bankSlip],
    [transferPaymentTypeIndex.BANK_DEPOSIT, dictionary.bankDeposit],
    [transferPaymentTypeIndex.PIX, dictionary.pix],
    [transferPaymentTypeIndex.NO_PAYMENT, dictionary.noPayment],
    [transferPaymentTypeIndex.OTHER, dictionary.other],
  ]);
};

const getTransferPaymentTypeLabel = (
  value: TransferPaymentType,
  languageGB: LanguageDate
): string => transferPaymentTypeLabels(languageGB).get(value) ?? String(value);

const transferPaymentTypeOptionsList = (languageGB: LanguageDate): Option<TransferPaymentType>[] =>
  Array.from(transferPaymentTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const transferPaymentTypeOptions = {
  getLabel: getTransferPaymentTypeLabel,
  options: transferPaymentTypeOptionsList,
};

// ============================================
// 4. Indicador de pagamento — ÚNICO enum backed por `int` do módulo.
//    ⚠️ `Option<number>` — nunca string ("0"/"1" reprova no servidor).
// ============================================

const paymentIndicatorLabels = (languageGB: LanguageDate): Map<PaymentIndicator, string> => {
  const dictionary = languageGB.transfers.transfer.paymentIndicatorOptions;
  return new Map([
    [0, dictionary.cash],
    [1, dictionary.term],
  ]);
};

const getPaymentIndicatorLabel = (value: PaymentIndicator, languageGB: LanguageDate): string =>
  paymentIndicatorLabels(languageGB).get(value) ?? String(value);

const paymentIndicatorOptionsList = (languageGB: LanguageDate): Option<PaymentIndicator>[] =>
  Array.from(paymentIndicatorLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const paymentIndicatorOptions = {
  getLabel: getPaymentIndicatorLabel,
  options: paymentIndicatorOptionsList,
};

// ============================================
// 5. Tipo de despesa acessória — ⚠️ `serviços` com cedilha e acento, valor
//    físico do enum backed (`ExpenseTypeEnum::SERVICOS`). Não normalizar.
// ============================================

const expenseTypeIndex = {
  REVERSAL: 'receitas',
  SUPPLIES: 'insumos',
  SERVICES: 'serviços',
} as const satisfies Record<string, ExpenseType>;

const expenseTypeLabels = (languageGB: LanguageDate): Map<ExpenseType, string> => {
  const dictionary = languageGB.transfers.transfer.expenseTypeOptions;
  return new Map([
    [expenseTypeIndex.REVERSAL, dictionary.reversal],
    [expenseTypeIndex.SUPPLIES, dictionary.supplies],
    [expenseTypeIndex.SERVICES, dictionary.services],
  ]);
};

const getExpenseTypeLabel = (value: ExpenseType, languageGB: LanguageDate): string =>
  expenseTypeLabels(languageGB).get(value) ?? String(value);

const expenseTypeOptionsList = (languageGB: LanguageDate): Option<ExpenseType>[] =>
  Array.from(expenseTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseTypeOptions = {
  getLabel: getExpenseTypeLabel,
  options: expenseTypeOptionsList,
};

// ============================================
// 6. Quem paga a despesa acessória
// ============================================

const expensePayerLabels = (languageGB: LanguageDate): Map<ExpensePayer, string> => {
  const dictionary = languageGB.transfers.transfer.expensePayerOptions;
  return new Map([
    ['fornecedor', dictionary.provider],
    ['empresa', dictionary.company],
    ['cliente', dictionary.client],
    ['rateio', dictionary.apportionment],
  ]);
};

const getExpensePayerLabel = (value: ExpensePayer, languageGB: LanguageDate): string =>
  expensePayerLabels(languageGB).get(value) ?? String(value);

const expensePayerOptionsList = (languageGB: LanguageDate): Option<ExpensePayer>[] =>
  Array.from(expensePayerLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const expensePayerOptions = {
  getLabel: getExpensePayerLabel,
  options: expensePayerOptionsList,
};

// ============================================
// 7. Apropriação da despesa acessória — `S` Sim · `N` Não
// ============================================

const apropriationLabels = (languageGB: LanguageDate): Map<Apropriation, string> => {
  const dictionary = languageGB.transfers.transfer.apropriationOptions;
  return new Map([
    ['S', dictionary.yes],
    ['N', dictionary.no],
  ]);
};

const getApropriationLabel = (value: Apropriation, languageGB: LanguageDate): string =>
  apropriationLabels(languageGB).get(value) ?? String(value);

const apropriationOptionsList = (languageGB: LanguageDate): Option<Apropriation>[] =>
  Array.from(apropriationLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const apropriationOptions = {
  getLabel: getApropriationLabel,
  options: apropriationOptionsList,
};
