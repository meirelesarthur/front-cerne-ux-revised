// src/@types/v2/IdentificationAnimalSisbovReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Identificação/SISBOV" (F-270, esteira 97-Esteiras/078,
// TASK-F270-F01, CONTRATOS/F-270-contrato-legado.md). Mirror ESTRUTURAL de
// `@/@types/v2/BirthAnimalSisbovReport` (F-235, mesma família SISBOV) — tela
// de filtro + download binário, SEM grid/prévia, SEM select, SÓ PDF (sem
// `report_type`/`format`).
//
// Diferente do irmão `BirthAnimalSisbovReport`, AMBAS as datas são
// OBRIGATÓRIAS aqui (contrato F-270 §Decisões — FormRequest com datas
// `required`, fidelidade ao legado C-005) — NÃO clonar o `string | null`
// nullable do F-235.
// -----------------------------------------------------------------------------

export interface IdentificationAnimalSisbovReportFilterForm {
  start_date: string | null;
  end_date: string | null;
}

export interface IdentificationAnimalSisbovReportParams {
  start_date: string;
  end_date: string;
}
