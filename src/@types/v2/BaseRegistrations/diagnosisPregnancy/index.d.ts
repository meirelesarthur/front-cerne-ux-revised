// src/@types/v2/BaseRegistrations/diagnosisPregnancy/index.d.ts
// Tipos do módulo de Diagnóstico de Gestação — API v1 do backend Laravel GB.Cerne.

// ============================================
// DIAGNOSIS PREGNANCY (resposta da API)
// ============================================

export interface DiagnosisPregnancyListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Mesmo Resource do index() e do show() (contrato de API §4) — reaproveitado em
// vez de duplicado (sem FK aninhada, diferente de `SpecieData`).
export type DiagnosisPregnancyData = DiagnosisPregnancyListItem;

// ============================================
// PAYLOAD (escrita — POST/PUT)
// ============================================

export interface DiagnosisPregnancyPayload {
  description?: string;
  is_enabled?: boolean;
}

// ============================================
// FORM (React Hook Form)
// ============================================

export interface DiagnosisPregnancyForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL)
// ============================================

export interface DiagnosisPregnanciesListEnvelope {
  success: boolean;
  message: string;
  data: DiagnosisPregnancyListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page?: number;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface DiagnosisPregnanciesFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// OPTIONS (options-source do Select "Diagnóstico" do relatório Vacas
// Prenhas, `GET /diagnosis-pregnancies/options` — correção pós-Tester da
// Tarefa 45. Sem `diagnosis_pregnancies_view`, mirror `BatchOption`/
// `GET /batches/options`.)
// ============================================

export interface DiagnosisPregnancyOption {
  uuid: string;
  label: string;
}

export interface DiagnosisPregnancyOptionsListEnvelope {
  success: boolean;
  message: string;
  data: DiagnosisPregnancyOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
