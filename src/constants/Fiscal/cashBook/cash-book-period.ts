// src/constants/fiscal/cashBook/cash-book-period.ts
// Fábrica de opções do campo "Período de Escrituração" (`period`, FM-04) do
// Cadastro de CashBook (LCDPR, execução 045, TASK-LCDPR-FE-01). Domínio
// COMPLETO de `CashBookPeriodEnum` (0..2, `GB.Cerne.Api/app/Enums/
// CashBookPeriodEnum.php`).
//
// Rótulos HARDCODED (não uma chave de `languageGB`) — decisão documentada:
// são texto LEGAL fixo da Receita Federal (LCDPR é obrigação fiscal
// brasileira), e o próprio backend (`CashBookPeriodEnum::label()`) já
// devolve esse texto sem nenhuma camada de i18n. Traduzir aqui criaria uma
// 2ª fonte que poderia divergir do texto legal exigido — o Detalhe
// (TASK-LCDPR-FE-04) usa o `label` devolvido DIRETO pela API por este mesmo
// motivo; esta fábrica só existe porque o Cadastro precisa de options
// ESTÁTICAS (sem endpoint) para o `Select` ANTES do registro existir.
// Assinatura SEM `languageGB` (divergência documentada do padrão
// `(languageGB) => Map` — `@typescript-eslint/no-unused-vars` deste projeto
// não perdoa parâmetro não utilizado nem com prefixo `_`, e um parâmetro
// falso seria pior que omiti-lo).
//
// Fonte EXATA do texto (citação literal, `CONTRATO-FRONT-LCDPR.md §4.1`):
//   0 → "0 - Regular (Início no primeiro dia do ano)."
//   1 → "1 - Abertura (Início de atividades no ano-calendário)"
//   2 → "2 - Início de obrigatoriedade da escrituração no curso do ano calendário."

import type { Option } from '@/@types/option';
import type { CashBookPeriod } from '@/@types/v2/Fiscal/cashBook';

const labels = (): Map<CashBookPeriod, string> =>
  new Map<CashBookPeriod, string>([
    [0, '0 - Regular (Início no primeiro dia do ano).'],
    [1, '1 - Abertura (Início de atividades no ano-calendário)'],
    [2, '2 - Início de obrigatoriedade da escrituração no curso do ano calendário.'],
  ]);

const getLabel = (value: CashBookPeriod): string => labels().get(value)!;

const getOption = (value: CashBookPeriod): Option<CashBookPeriod> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CashBookPeriod>[] =>
  Array.from(labels()).map(([value, label]) => ({ label, value }));

export const cashBookPeriodOptions = { getLabel, getOption, options };
