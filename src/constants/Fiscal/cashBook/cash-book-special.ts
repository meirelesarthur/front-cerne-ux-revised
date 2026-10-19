// src/constants/fiscal/cashBook/cash-book-special.ts
// Fábrica de opções do campo "Situação Especial" (`special`, FM-05) do
// Cadastro de CashBook (LCDPR, execução 045, TASK-LCDPR-FE-01). Domínio
// COMPLETO de `CashBookSpecialSituationEnum` (0..3, `GB.Cerne.Api/app/Enums/
// CashBookSpecialSituationEnum.php`).
//
// Rótulos HARDCODED — mesma decisão documentada em `cash-book-period.ts`
// (texto legal fixo, sem i18n nem no backend; assinatura sem `languageGB`
// por causa do `@typescript-eslint/no-unused-vars` deste projeto).
//
// Fonte EXATA do texto (citação literal, `CONTRATO-FRONT-LCDPR.md §4.1`):
//   0 → "0 - Normal"
//   1 → "1 - Falecimento"
//   2 → "2 - Espólio"
//   3 → "3 - Saída definitiva do País"

import type { Option } from '@/@types/option';
import type { CashBookSpecial } from '@/@types/v2/Fiscal/cashBook';

const labels = (): Map<CashBookSpecial, string> =>
  new Map<CashBookSpecial, string>([
    [0, '0 - Normal'],
    [1, '1 - Falecimento'],
    [2, '2 - Espólio'],
    [3, '3 - Saída definitiva do País'],
  ]);

const getLabel = (value: CashBookSpecial): string => labels().get(value)!;

const getOption = (value: CashBookSpecial): Option<CashBookSpecial> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CashBookSpecial>[] =>
  Array.from(labels()).map(([value, label]) => ({ label, value }));

export const cashBookSpecialOptions = { getLabel, getOption, options };
