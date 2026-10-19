// src/constants/Fiscal/fiscal-field-visibility.ts
// -----------------------------------------------------------------------------
// Helper PURO de visibilidade dos campos C1 (D-101-19, plano-front-icms-c1
// secao 5). Baseado no `cst_csosn` do proprio formulario (item/regra/natureza/
// produto). CSOSN (Simples, 3 digitos) e demais CST nunca exibem os campos.
// Decisoes do dono: P-F1 (mot_des_icms sempre nos CST aplicaveis) e P-F2
// (perc_fcp = 0 tratado como vazio/NULL).
// -----------------------------------------------------------------------------

import { isMotDesIcmsValidForCst } from '@/constants/Fiscal/mot-des-icms-catalog';

import { NFE_FINNFE_DEVOLUCAO } from '@/validations/schemas/Nfes/nfe-schema';

const CST_MOT_DES_ICMS = new Set(['20', '30', '40', '41', '50', '70', '90']);
const CST_PERC_DIF = new Set(['51']);
const CST_PERC_FCP = new Set(['00', '10', '20', '51', '70', '90']);

function normalizeCst(cst: string | number | null | undefined): string {
  return cst === null || cst === undefined ? '' : String(cst).trim();
}

export function isMotDesIcmsVisible(cst: string | number | null | undefined): boolean {
  return CST_MOT_DES_ICMS.has(normalizeCst(cst));
}

export function isPercDifVisible(cst: string | number | null | undefined): boolean {
  return CST_PERC_DIF.has(normalizeCst(cst));
}

export function isPercFcpVisible(cst: string | number | null | undefined): boolean {
  return CST_PERC_FCP.has(normalizeCst(cst));
}

// `perc_ipi_devol` so existe no item da NF-e e so com finalidade devolucao (finnfe = 4).
export function isPercIpiDevolVisible(finnfe: string | number | null | undefined): boolean {
  return Number(finnfe) === NFE_FINNFE_DEVOLUCAO;
}

// P-F2: vazio ou 0 => `null` (MOC 880 rejeita pFCP = 0); caso contrario o numero.
export function normalizePercFcp(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return parsed;
}

export interface FiscalC1Values {
  mot_des_icms?: number | null;
  perc_dif?: number | null;
  perc_fcp?: number | null;
}

// Ao trocar/hidratar o CST: zera (null) o que nao pertence ao novo CST, para nao persistir lixo
// oculto (plano secao 5). Mantem os valores compativeis intactos.
export function sanitizeC1ForCst(
  cst: string | number | null | undefined,
  values: FiscalC1Values
): Required<FiscalC1Values> {
  const motDes = values.mot_des_icms ?? null;
  return {
    mot_des_icms: isMotDesIcmsVisible(cst) && isMotDesIcmsValidForCst(cst, motDes) ? motDes : null,
    perc_dif: isPercDifVisible(cst) ? (values.perc_dif ?? null) : null,
    perc_fcp: isPercFcpVisible(cst) ? normalizePercFcp(values.perc_fcp) : null,
  };
}
