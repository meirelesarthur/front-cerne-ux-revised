// src/@types/v2/BaseRegistrations/parameterWeights/index.d.ts
// Tipos do módulo Parâmetros / Peso (ParameterWeight) — API v1 do backend
// Laravel GB.Cerne, farm-scoped (`X-Farm-Id` injetado automaticamente por
// `src/services/api.ts`, sem ação do front). Camada `api` 100% `✅ CONCLUÍDO`
// via TASK-PW-01..05 — shapes abaixo tirados por leitura direta dos
// Resources reais (`ParameterWeightListResource.php`/
// `ParameterWeightDetailResource.php`) e do DTO de filtro
// (`ParameterWeightFilterData.php`), não assumidos.
//
// `ParameterWeightData`/`ParameterWeightPayload`/`ParameterWeightForm` são
// acrescentados neste MESMO arquivo pela Tarefa irmã `TASK-PW-FE-02`
// (formulário criar/editar) — esta Tarefa (`TASK-PW-FE-01`, listagem/filtro/
// exclusão) declara só o necessário para a grid e para o 422 de guarda de FK.
//
// TASK-PW-FE-02 acrescenta abaixo: `ParameterWeightData` (GET detalhe, com
// `employee` condicional, DA-PW-16), `ParameterWeightPayload` (POST/PUT —
// SEM `code`, SEM `employee`, ambos fora do contrato de escrita, G3/contrato
// v1.3) e `ParameterWeightForm` (shape do RHF).

// ============================================
// PARAMETER WEIGHT (resposta da API — listagem)
// ============================================

export interface ParameterWeightListItem {
  uuid: string;
  code: string;
  date: string; // 'yyyy-MM-dd'
  description: string;
  initial_weight: number;
  final_weight: number;
  /** Pronto do backend (`ParameterWeightListResource.info`) — NÃO recalcular no front. */
  info: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL)
// ============================================

export interface ParameterWeightsListEnvelope {
  success: boolean;
  message: string;
  data: ParameterWeightListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page?: number;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem — search + período)
// ============================================

export interface ParameterWeightsFilterForm {
  /** Busca por `description`+`code` (param `search` do backend, ILIKE). */
  search?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// EXCLUSÃO BLOQUEADA (422 estruturado — guarda de FK `batches`)
// ============================================

// Shape CONFIRMADO por leitura direta de `DeleteParameterWeightAction.php`
// (api_root, TASK-PW-04 `✅ CONCLUÍDO`) — mapa `Record<string, number>`, mesma
// família de Action de `Marker`/`AdditionalInfo`/`NatureOperation`
// (`dependencyUsageCounts()`), não a família `hasDependents()` de `Contador`.
export interface ParameterWeightInUseError {
  errors: { in_use: Record<string, number> };
}

// ============================================
// DETALHE (GET /parameter-weights/{uuid}) — formulário criar/editar
// ============================================

// `employee` só existe no Resource de DETALHE (DA-PW-16, eager-load
// `employee.people` exclusivo de `findDetailByUuidOrFail()`); a listagem
// nunca traz esse campo. 53/167 registros reais (32%) têm o dado, nenhum
// novo terá — bloco read-only condicional na tela, nunca editável (G3).
export interface ParameterWeightData extends ParameterWeightListItem {
  employee: { uuid: string; name: string } | null;
  // `user` — TASK-PW-FE-05/DA-PW-17 (v1.4): quem CADASTROU o registro,
  // sempre presente (servidor resolve `user_id` do autenticado em toda
  // criação, imutável depois). Mesmo shape de `employee`, semântica
  // diferente — NÃO confundir: `employee` é o responsável histórico
  // (`employee_id`, descontinuado, condicional, 32% dos registros).
  // Shape confirmado por leitura direta de
  // `ParameterWeightDetailResource.php:79-92` (api_root).
  user: { uuid: string; name: string } | null;
}

// Payload de escrita (POST/PUT) — `code` NUNCA aparece aqui (gerado no
// servidor, imutável) nem `employee`/`employee_uuid` (G3, fora do contrato
// de escrita, definitivamente). `date` já é a string ISO `'yyyy-MM-dd'`
// vinda direto do RHF (`DateInput`), sem conversão em
// `CreateOrUpdateParameterWeights` desde CONTRATO-FE-CONSOLIDA-INPUTDATE.md.
export interface ParameterWeightPayload {
  date: string; // 'yyyy-MM-dd'
  initial_weight: number;
  final_weight: number;
  description: string;
}

// Shape do formulário (React Hook Form) — `date`/pesos aceitam `null` antes
// do preenchimento (guarda de estado inicial dos componentes controlados
// `DateInput`/`KgInput`); Yup garante que não chegam `null` no `onSubmit`.
// `date` é `string` ('yyyy-MM-dd') ponta-a-ponta desde
// CONTRATO-FE-CONSOLIDA-INPUTDATE.md (esteira 006) — antes era `Date`
// (conversão `parseISO`/`format` nas bordas do form, removida na
// consolidação para `DateInput`, motor nativo Chakra).
export interface ParameterWeightForm {
  uuid?: string;
  date: string | null;
  initial_weight: number | null;
  final_weight: number | null;
  description: string;
}
