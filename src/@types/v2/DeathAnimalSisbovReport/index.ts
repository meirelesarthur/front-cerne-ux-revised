// src/@types/v2/DeathAnimalSisbovReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Mortes/SISBOV" (F-253, esteira 97-Esteiras/054,
// TASK-054-253-FE-01). Mirror estrutural EXATO de `@/@types/v2/
// BirthAnimalSisbovReport` (irmão F-235) — tela de filtro + download
// binário, SEM grid/prévia, SEM select adicional (só o par de datas) e
// DOWNLOAD-ONLY SÓ PDF — sem `format`/`ReportFormat` (roteiro-front-F253-
// mortes-sisbov.md §"Contrato de tela").
//
// Ambas as datas são NULLABLE (mirror F-235, mesmo racional de fidelidade
// — o contrato de tela é idêntico ao irmão, só nomes/endpoint trocam).
// -----------------------------------------------------------------------------

export interface DeathAnimalSisbovReportFilterForm {
  start_date: string | null;
  end_date: string | null;
}

export interface DeathAnimalSisbovReportParams {
  start_date?: string;
  end_date?: string;
}
