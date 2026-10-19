// src/@types/v2/BaseRegistrations/tenantParameters/index.d.ts
// -----------------------------------------------------------------------------
// Parametrizações do Tenant (TenantParameter — Cadastros Base / Gerais).
// Settings-form de registro único (D3/D5 do contrato) — SEM `uuid`, SEM
// listagem, SEM `/novo`/`/:id`. O "registro" é o CONJUNTO de parâmetros do
// tenant corrente (escopo real por `tenant_id`, gate de acesso por farm ativa
// — D1 do contrato).
//
// Hoje 1 campo (`calc_icms_desonerado`). Adicionar 1 campo novo = 1
// propriedade aqui + 1 no form + 1 no schema de validação
// (tenantParameters-schema.ts) + i18n.
// -----------------------------------------------------------------------------

// Objeto TIPADO de settings (D3 do contrato) — não key-value genérico.
export interface TenantParameterData {
  calc_icms_desonerado: boolean;
}

// Payload do PUT — mesmo shape de TenantParameterData (backend aceita
// `sometimes` por campo, mas o form sempre envia o objeto completo hoje —
// só existe 1 campo, então o payload nunca é parcial na prática).
export interface TenantParameterPayload {
  calc_icms_desonerado: boolean;
}

// Form (react-hook-form) — booleano representado como string 'true'/'false'
// para alimentar o Select Sim/Não, mesmo padrão de ProductGroupFormType.is_enabled.
export interface TenantParameterForm {
  calc_icms_desonerado: 'true' | 'false';
}
