// src/@types/v2/BaseRegistrations/Parameters/index.d.ts
// Tipos do módulo de PARÂMETROS (Parameter) — API v1 do backend Laravel
// GB.Cerne, execução 031 (TASK-FE-031-40). Catálogo GLOBAL (sem farm_id/
// tenant_id, sem X-Farm-Id) — contrato-api-parametros.md §8: `name` funciona
// como chave técnica lida por 5 módulos já migrados (Categoria Financeira,
// Centro de Custo, Plano de Contas, Agrupador Contábil/Grouper) via
// `Parameter::where('name', 'X')->value('value')`.
//
// Mesmo Resource nas 3 operações de leitura (index/show/store/update) —
// mirror `HeadbandData`/`ParameterResource` (contrato de API §9): `uuid`,
// `name`, `value`, `type` (1|2|3), `type_label`, `description`, `created_at`,
// `updated_at`.
//
// ⚠️ `is_reserved` NÃO é exposto pelo `ParameterResource` hoje (achado
// registrado em contrato-front-parametros.md §"Leitura do dev" — addendum
// recomendado a GAP-BE-511, ainda não aplicado no backend). Enquanto isso, a
// proteção de nomes reservados na UI usa a constante client-side
// `RESERVED_PARAMETER_NAMES`/`isReservedParameterName` (ver
// `@/constants/reserved-parameter-names`) — NÃO um campo deste tipo.

// Valor cru do enum `type` (backed int, contrato de API §4 — `ParameterTypeEnum`
// PHP: 1=Alfanumérico, 2=Numérico, 3=Lógico). O enum de RUNTIME (com labels
// via i18n) mora em `@/constants/BaseRegistrations/parameter-type` — este
// arquivo é só o tipo estrutural, mirror `HeadbandTypeSlug`.
export type ParameterTypeValue = 1 | 2 | 3;

// ============================================
// PARAMETER (resposta da API — ParameterResource)
// ============================================

export interface ParameterListItem {
  uuid: string;
  name: string;
  value: string;
  type: ParameterTypeValue;
  type_label: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Mesmo Resource do index() e do show() (contrato de API §9) — reaproveitado,
// mirror `HeadbandData`.
export type ParameterDetail = ParameterListItem;

// ============================================
// PAYLOAD (escrita — POST/PUT, JSON — sem multipart, sem X-Farm-Id)
// ============================================

export interface ParameterPayload {
  name: string;
  value: string;
  type: ParameterTypeValue;
  description?: string | null;
}

// ============================================
// FORM (React Hook Form)
// ============================================

export interface ParameterForm {
  uuid?: string;
  name: string;
  value: string;
  type: ParameterTypeValue | null;
  description: string;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL)
// ============================================

export interface ParametersListEnvelope {
  success: boolean;
  message: string;
  data: ParameterListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page?: number;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem — só `name`, contrato §5)
// ============================================

export interface ParameterFilterForm {
  name?: string;
}
