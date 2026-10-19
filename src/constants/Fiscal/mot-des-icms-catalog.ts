// src/constants/Fiscal/mot-des-icms-catalog.ts
// -----------------------------------------------------------------------------
// Catalogo `mot_des_icms` (motDesICMS, campo N28 do Anexo I do MOC 7.0) POR
// GRUPO DE CST (D-101-19 / plano-front-icms-c1 secao 4). O dominio NAO e unico:
// CST 30 nao aceita 3 nem 12; CST 20/70/90 aceitam so {3, 9, 12}. O valor 2
// (Deficiente Fisico) foi revogado na versao 3.10 do leiaute e NAO e oferecido.
// Labels transcritos do MOC (Anexo I, N28: pags. 28-38). Sem i18n — mesmo
// precedente dos demais catalogos fiscais (codigos/descricoes oficiais).
// Contrato da API C1 confirmado (mot_des_icms validado pela API por CST do registro).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

const MOT_20_70_90: Option<number>[] = [
  { value: 3, label: '3 - Uso na agropecuária' },
  { value: 9, label: '9 - Outros' },
  { value: 12, label: '12 - Órgão de fomento e desenvolvimento agropecuário' },
];

const MOT_30: Option<number>[] = [
  {
    value: 6,
    label:
      '6 - Utilitários e Motocicletas da Amazônia Ocidental e Áreas de Livre Comércio (Resolução 714/88 e 790/94 – CONTRAN e suas alterações)',
  },
  { value: 7, label: '7 - SUFRAMA' },
  { value: 9, label: '9 - Outros' },
];

const MOT_40_41_50: Option<number>[] = [
  { value: 1, label: '1 - Táxi' },
  { value: 3, label: '3 - Produtor Agropecuário' },
  { value: 4, label: '4 - Frotista/Locadora' },
  { value: 5, label: '5 - Diplomático/Consular' },
  {
    value: 6,
    label:
      '6 - Utilitários e Motocicletas da Amazônia Ocidental e Áreas de Livre Comércio (Resolução 714/88 e 790/94 – CONTRAN e suas alterações)',
  },
  { value: 7, label: '7 - SUFRAMA' },
  { value: 8, label: '8 - Venda a Órgão Público' },
  { value: 9, label: '9 - Outros' },
  { value: 10, label: '10 - Deficiente Condutor (Convênio ICMS 38/12)' },
  { value: 11, label: '11 - Deficiente Não Condutor (Convênio ICMS 38/12)' },
  { value: 16, label: '16 - Olimpíadas Rio 2016 (NT 2015.002)' },
  { value: 90, label: '90 - Solicitado pelo Fisco' },
];

// Dominio de `mot_des_icms` por CST (regime normal). CST ausente = sem campo.
export const MOT_DES_ICMS_BY_CST: Readonly<Record<string, ReadonlyArray<Option<number>>>> = {
  '20': MOT_20_70_90,
  '70': MOT_20_70_90,
  '90': MOT_20_70_90,
  '30': MOT_30,
  '40': MOT_40_41_50,
  '41': MOT_40_41_50,
  '50': MOT_40_41_50,
};

// Opcoes do select para o CST informado; vazio quando o CST nao admite motDesICMS.
export function getMotDesIcmsOptions(cst: string | number | null | undefined): Option<number>[] {
  if (cst === null || cst === undefined) return [];
  const options = MOT_DES_ICMS_BY_CST[String(cst).trim()];
  return options ? [...options] : [];
}

// `true` quando `value` pertence ao dominio do CST (usado para limpar valor incompativel).
export function isMotDesIcmsValidForCst(
  cst: string | number | null | undefined,
  value: number | null | undefined
): boolean {
  if (value === null || value === undefined) return true;
  return getMotDesIcmsOptions(cst).some((option) => option.value === value);
}
