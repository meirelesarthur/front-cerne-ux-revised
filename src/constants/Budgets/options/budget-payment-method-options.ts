// src/constants/Budgets/options/budget-payment-method-options.ts
// Fábrica de opções do enum `payment_method` (BudgetPaymentMethod) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `request-quotation-payment-method-options.ts`). SEM chamada de rede —
// catálogo estático (14 chaves, SEFAZ), mirror `Nfe::typesPayment()`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { budgetPaymentMethod, BudgetPaymentMethod } from '../budget-payment-method';

const labels = (languageGB: LanguageDate): Map<BudgetPaymentMethod, string> => {
  const text = languageGB.budgets.budget.paymentMethodOptions;
  return new Map([
    [budgetPaymentMethod.dinheiro, text.dinheiro],
    [budgetPaymentMethod.cheque, text.cheque],
    [budgetPaymentMethod.cartaoCredito, text.cartaoCredito],
    [budgetPaymentMethod.cartaoDebito, text.cartaoDebito],
    [budgetPaymentMethod.creditoLoja, text.creditoLoja],
    [budgetPaymentMethod.valeAlimentacao, text.valeAlimentacao],
    [budgetPaymentMethod.valeRefeicao, text.valeRefeicao],
    [budgetPaymentMethod.valePresente, text.valePresente],
    [budgetPaymentMethod.valeCombustivel, text.valeCombustivel],
    [budgetPaymentMethod.duplicataMercantil, text.duplicataMercantil],
    [budgetPaymentMethod.boletoBancario, text.boletoBancario],
    [budgetPaymentMethod.depositoBancario, text.depositoBancario],
    [budgetPaymentMethod.pix, text.pix],
    [budgetPaymentMethod.semPagamento, text.semPagamento],
    [budgetPaymentMethod.outros, text.outros],
  ]);
};

const getLabel = (value: BudgetPaymentMethod, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: BudgetPaymentMethod,
  languageGB: LanguageDate
): Option<BudgetPaymentMethod> => ({
  label: getLabel(value, languageGB),
  value,
});

// SEM chamada de rede (DoD da Tarefa) — Map construído 100% a partir da
// tradução + do enum estático, nunca de um endpoint de lookup.
const options = (languageGB: LanguageDate): Option<BudgetPaymentMethod>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const budgetPaymentMethodOptions = { getLabel, getOption, options };
