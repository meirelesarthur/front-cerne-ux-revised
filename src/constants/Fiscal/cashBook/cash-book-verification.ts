// src/constants/fiscal/cashBook/cash-book-verification.ts
// Fábrica de opções do campo "Forma de Apuração" (`verification`, FM-07) do
// Cadastro de CashBook (LCDPR, execução 045, TASK-LCDPR-FE-01). Domínio
// COMPLETO de `CashBookVerificationEnum` (1..2, `GB.Cerne.Api/app/Enums/
// CashBookVerificationEnum.php`).
//
// Rótulos HARDCODED — mesma decisão documentada em `cash-book-period.ts`
// (texto legal fixo, sem i18n nem no backend; assinatura sem `languageGB`
// por causa do `@typescript-eslint/no-unused-vars` deste projeto).
//
// Fonte EXATA do texto (citação literal, `CONTRATO-FRONT-LCDPR.md §4.1`):
//   1 → "1 - Livro Caixa"
//   2 → "2 - Apuração do lucro pelo disposto no art. 5º da Lei nº 8.023, de 1990"

import type { Option } from '@/@types/option';
import type { CashBookVerification } from '@/@types/v2/Fiscal/cashBook';

const labels = (): Map<CashBookVerification, string> =>
  new Map<CashBookVerification, string>([
    [1, '1 - Livro Caixa'],
    [2, '2 - Apuração do lucro pelo disposto no art. 5º da Lei nº 8.023, de 1990'],
  ]);

const getLabel = (value: CashBookVerification): string => labels().get(value)!;

const getOption = (value: CashBookVerification): Option<CashBookVerification> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CashBookVerification>[] =>
  Array.from(labels()).map(([value, label]) => ({ label, value }));

export const cashBookVerificationOptions = { getLabel, getOption, options };
