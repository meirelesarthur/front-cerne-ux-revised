// src/@types/v2/BirthAnimalSisbovReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Nascimentos/SISBOV" (F-235, esteira 97-Esteiras/052,
// TASK-052-235-FE-01). Mirror estrutural de `@/@types/v2/Dre` — tela de
// filtro + download binário, SEM grid/prévia. Diferente de `Dre`, esta tela
// não tem NENHUM select adicional (só o par de datas) e é DOWNLOAD-ONLY SÓ
// PDF — sem `format`/`ReportFormat` (roteiro-front-F235-nascimentos-sisbov.md
// §"Contrato de tela").
//
// Ambas as datas são NULLABLE (fidelidade adjudicada DEC-225 §7.3 — o legado
// só validava `required` no HTML, sem regra server-side; a API nova
// (`BirthAnimalSisbovReportRequest`) rejeita só entrada malformada/invertida,
// nunca a ausência).
// -----------------------------------------------------------------------------

export interface BirthAnimalSisbovReportFilterForm {
  start_date: string | null;
  end_date: string | null;
}

export interface BirthAnimalSisbovReportParams {
  start_date?: string;
  end_date?: string;
}
