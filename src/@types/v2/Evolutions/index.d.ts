// src/@types/v2/Evolutions/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de EVOLUÇÃO/REBANHO (Evolution — Operacional > Pecuária >
// Transferências / Relatórios > Pecuária), `spa-contract-evolucao-rebanho.md`
// §6, Tarefas 26 (fundação + listagem) e 27 (relatório).
//
// 100% somente-leitura — sem `create`/`update`/`delete`. Fonte real:
// `EvolutionResource` (`GB.Cerne.Api/app/Http/Resources/V1/EvolutionResource.php`,
// já entregue) — `date` é `->toDateString()` (SEM fuso, mirror
// `SeparationResource`, `GAP-EVO-FE-05` resolvido no backend) e `animal`
// carrega `birth_date` (aditivo `GAP-EVO-FE-03` já aplicado no Resource) —
// por isso a 5ª coluna do legado ("Data de Nascimento") entra normalmente,
// sem N+1 e sem gate extra de permissão.
//
// `uuid` sempre, `id` nunca.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface EvolutionListItem {
  uuid: string;
  date: string; // YYYY-MM-DD (`EvolutionResource::date`, sem fuso)
  category_old: { uuid: string; description: string } | null; // LEFT JOIN — nullable
  category_next: { uuid: string; description: string };
  animal: {
    uuid: string;
    identification: string;
    // Aditivo `GAP-EVO-FE-03` (já aplicado no `EvolutionResource`) —
    // `animals.birth_date`, nullable no Model. Renderizado com o mesmo
    // `formatDate(value.slice(0, 10))` defensivo das demais datas.
    birth_date: string | null;
  };
  created_at: string;
}

// Forma do drawer de filtro (Tarefa 26 §4.4) — `animal` é `Option<string> |
// null` (uuid), `animal_label` companion display-only vive só no
// `EvolutionFilterRequest` achatado (nunca aqui).
export interface EvolutionFilterForm {
  animal: { label: string; value: string } | null; // Option<string> | null
  start_date: string | null;
  end_date: string | null;
}

// Querystring real de `GET /evolutions` — `animal_label` é companion
// DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate` (mirror
// `batch_label` de `SeparationFilterRequest`), excluído de `filtersApplied`
// e NUNCA enviado à API.
export interface EvolutionFilterRequest {
  animal_uuid?: string;
  animal_label?: string;
  start_date?: string;
  end_date?: string;
}

// `format` decide qual das 2 funções de download o handler da tela chama
// (`downloadEvolutionsReportPdf`/`downloadEvolutionsReportXlsx`) — só de UI,
// NUNCA enviado como querystring literal (mirror
// `AnimalMovementAnalysisReportOutputType`, mas aqui a API real usa
// `type=1` para Excel, `CL-19`, preservado em `evolution-service.ts`).
export type EvolutionReportFormatValue = 'pdf' | 'excel';

// Forma do formulário de página cheia do relatório (Tarefa 27 §5.3, unificado
// esteira 060 — ajuste UX do dono: 1 select de Formato + 1 botão "Gerar
// relatório", em vez de 2 botões separados). `start_date`/`end_date`/
// `format` obrigatórios no schema Yup (`end_date >= start_date`).
export interface EvolutionReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  format: Option<EvolutionReportFormatValue> | null;
}

// Querystring real de `GET /evolutions/report` — `type=1` vira `.xlsx`;
// ausente (ou qualquer outro valor) vira `.pdf` (mirror `CL-19`).
export interface EvolutionReportParams {
  start_date: string;
  end_date: string;
  type?: 1;
}
