// src/constants/evolutions/options/evolution-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` (formato de saída) do relatório de
// Evolução/Rebanho — padronização de botões pedida pelo dono no teste manual
// (esteira 97-Esteiras/060): troca dos 2 botões separados ("Gerar PDF" +
// "Exportar Excel") por 1 select de Formato + 1 único botão "Gerar
// relatório", mirror `AnaliseMovimentacaoLote/report-output-type-options.ts`
// (F-223). Valores 'pdf'/'excel' são só de UI — decidem qual função de
// download (`downloadEvolutionsReportPdf`/`downloadEvolutionsReportXlsx`) o
// handler da tela chama; NÃO são enviados como querystring literal (a API
// usa `type=1` para Excel, `CL-19`, preservado em `evolution-service.ts`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { EvolutionReportFormatValue } from '@/@types/v2/Evolutions';

const labels = (languageGB: LanguageDate): Map<EvolutionReportFormatValue, string> => {
  const dictionary = languageGB.evolutions.evolution.report.format;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

function getLabel(value: EvolutionReportFormatValue, languageGB: LanguageDate): string {
  return labels(languageGB).get(value)!;
}

function getOption(
  value: EvolutionReportFormatValue,
  languageGB: LanguageDate
): Option<EvolutionReportFormatValue> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<EvolutionReportFormatValue>[] {
  return Array.from(labels(languageGB), ([value, label]) => ({ label, value }));
}

export const evolutionReportFormatOptions = { getLabel, getOption, options };
