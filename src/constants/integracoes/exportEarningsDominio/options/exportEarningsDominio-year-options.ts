// src/constants/integracoes/exportEarningsDominio/options/exportEarningsDominio-year-options.ts
// Fábrica de opções do campo `year` da tela "Exportação Folha Salarial →
// Domínio" (F-117, Integrações) — padrão canônico
// (get_pwa_constants_and_mappers_pattern §3.2), adaptado: sem dependência de
// `languageGB` porque o label é o próprio ano (`String(ano)`, sem tradução —
// contrato de tela §2.1/§4). Gera dinamicamente `[corrente, corrente-1]`
// (CL-02) — o select legado só oferecia esse par.

import type { Option } from '@/@types/option';

const currentYear = (): number => new Date().getFullYear();

const years = (): number[] => {
  const year = currentYear();
  return [year, year - 1];
};

const getLabel = (value: number): string => String(value);

const getOption = (value: number): Option<number> => ({ label: getLabel(value), value });

const options = (): Option<number>[] => years().map((year) => getOption(year));

export const exportEarningsDominioYearOptions = { getLabel, getOption, options };
