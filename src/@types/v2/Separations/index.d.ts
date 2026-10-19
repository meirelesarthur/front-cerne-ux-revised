// src/@types/v2/Separations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de APARTAÇÃO (Separation — Operacional > Pecuária).
//
// Fonte: `frontend-contract-apartacao.md` §4 — shapes transcritos do
// DTO/Resource *desenhados* pelo Arquiteto de API (`api-contract-apartacao.md`
// §5/§8), ainda em codagem no momento deste planejamento. O Executor confirma
// os nomes exatos de campo contra o Resource real (`SeparationListResource`/
// `SeparationResource`, fork `GB.Cerne.Api`) assim que as Tarefas 21/22
// fecharem — checklist de fechamento, não bloqueante.
//
// `uuid` sempre, `id` NUNCA aparece no envelope. `code` sempre gerado pelo
// servidor (`GAP-APART-01`) — nunca enviado pelo cliente em nenhum verbo.
//
// TASK-APART-FE-01 (fundação) consome `SeparationListItem`/`SeparationBatch`/
// `SeparationDetail`/`SeparationFilterForm`/`SeparationFilterRequest`.
// `SeparationForm`/`CreateOrUpdateSeparationRequest`/
// `CheckSeparationDateInvalidBatch`/`CheckSeparationDateResult` são
// consumidos pela Tarefa 25 (formulário), mas declarados aqui por instrução
// da fundação (contrato §8 — "o arquivo de serviço nasce aqui").
// -----------------------------------------------------------------------------

export interface SeparationListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  employee_name: string; // employee?.name ?? user?.name (mirror LM-employee, COALESCE)
  batch_count: number;
  animal_count: number; // CV-03, via view animal_batch_histories
  finished_processing: boolean;
}

export interface SeparationBatch {
  uuid: string;
  description: string;
}

export interface SeparationDetail {
  uuid: string;
  code: string;
  date: string;
  employee_name: string;
  user_name: string;
  batches: SeparationBatch[];
  finished_processing: boolean;
  created_at: string;
  updated_at: string;
}

// Form (React Hook Form) — `batches` é array de Option<string> (uuid), nunca
// string direta. Consumido pela Tarefa 25.
export interface SeparationForm {
  date: string;
  batches: Array<{ label: string; value: string }>; // Option<string>[]
}

// Payload de escrita (store+update) — unwrap de Option<string>[] para
// string[] de uuids. Consumido pela Tarefa 25. `employee_id`/`user_id`/
// `farm_id` NUNCA presentes (derivados/contexto do servidor).
export interface CreateOrUpdateSeparationRequest {
  date: string;
  batches: string[]; // uuids
}

export interface SeparationFilterForm {
  batch: { label: string; value: string } | null; // Option<string> | null
}

export interface SeparationFilterRequest {
  batch_uuid?: string;
}

export interface CheckSeparationDateInvalidBatch {
  uuid: string;
  description: string;
  date: string;
}

export interface CheckSeparationDateResult {
  valid: boolean;
  invalid_batches: CheckSeparationDateInvalidBatch[];
}
