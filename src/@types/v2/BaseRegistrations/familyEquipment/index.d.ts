// src/@types/v2/BaseRegistrations/familyEquipment/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de FAMÍLIA DE BENS (FamilyEquipment) — API v1 do backend
// Laravel GB.Cerne. Fonte batida linha a linha contra `api_root` nesta
// execução (TASK-FE-FE-01/02):
//   - app/Http/Resources/V1/FamilyEquipmentResource.php (shape de saída)
//   - app/Http/Requests/Api/V1/FamilyEquipmentRequest.php (regras de entrada)
//   - app/Http/Controllers/Api/V1/FamilyEquipmentController.php (envelope
//     ApiResponse::paginated no index(), igual a CostCenter)
//   - app/Http/Responses/ApiResponse.php (`meta`: current_page/last_page/
//     per_page/total/from/to/links — IDÊNTICO ao shape de CostCenter)
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /family-equipments            → data: FamilyEquipmentListItem[] + meta paginado real
//   GET    /family-equipments/{uuid}     → data: FamilyEquipmentDetail
//   POST   /family-equipments            → multipart (FamilyEquipmentPayload)
//   PUT    /family-equipments/{uuid}     → multipart, method-spoofing (_method=PUT)
//   DELETE /family-equipments/{uuid}     → 204; 422 "está em uso" se referenciado (equipments FK)
//
// `code` NÃO existe neste contrato (confirmado — o Resource não expõe este
// campo; diferente de CostCenter). `type_depreciation`: 0=SEM_RESIDUAL,
// 1=COM_RESIDUAL (app/Enums/FamilyEquipmentDepreciationType.php, DA-FE-15,
// mapeamento confirmado/corrigido — NÃO inverter).
// -----------------------------------------------------------------------------

// ============================================
// FAMILY EQUIPMENT (resposta da API)
// ============================================

export interface FamilyEquipmentListItem {
  uuid: string;
  description: string;
  image_url: string | null;
  type_depreciation: 0 | 1;
  type_depreciation_label: string;
  life_bens: number | null;
  is_enabled: boolean;
}

// Campos adicionais só presentes em `show`/`store`/`update` (Resource sempre
// devolve o objeto completo — TASK-FE-FE-02 usa esses campos no formulário).
export interface FamilyEquipmentDetail extends FamilyEquipmentListItem {
  vl_time_productive: number | null;
  vl_time_unproductive: number | null;
  depreciation: number | null;
  residual: number | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — idêntico ao shape de CostCenter
// ============================================

export interface FamilyEquipmentsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface FamilyEquipmentsListEnvelope {
  success: boolean;
  message: string;
  data: FamilyEquipmentListItem[];
  errors: Record<string, string[]> | null;
  meta: FamilyEquipmentsApiPaginationMeta | null;
}

// ============================================
// GET /family-equipments/options (TASK-FE-652/DF-17) — lookup ENXUTO,
// UNGATED desde `GAP-BE-040 Opção B`/`TASK-BE-705` ('options' nunca entra em
// nenhum `only:` de `FamilyEquipmentController::middleware()`). Consumido
// pelo Select de "Família de Bens" do bloco de Inventário
// (`InvoiceItemEquipmentPanel.tsx`) — usuários que criam Doc.Fiscal mas não
// têm `familyequipments_view` recebiam 403 usando `listFamilyEquipments`
// (CRUD completo, gateado). Resource dedicado expõe, além de
// `{uuid,description}`, os 4 campos de autofill de depreciação — mirror do
// `FamilyEquipmentOptionResource` do backend (referência: `TASK-BE-705`).
// ============================================

export interface FamilyEquipmentOption {
  uuid: string;
  description: string;
  type_depreciation: 0 | 1;
  depreciation: number | null;
  residual: number | null;
  life_bens: number | null;
}

export interface FamilyEquipmentOptionsListEnvelope {
  success: boolean;
  message: string;
  data: FamilyEquipmentOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (store/update) — sempre montado como FormData
// (multipart), full-resource (checklist item 3: nunca um delta).
export interface FamilyEquipmentPayload {
  description: string;
  is_enabled: boolean;
  type_depreciation: 0 | 1;
  depreciation: number | null;
  life_bens: number | null;
  /** Obrigatório apenas quando `type_depreciation === 1` (COM_RESIDUAL) — validação client-side espelha o servidor. */
  residual: number | null;
  vl_time_productive: number | null;
  vl_time_unproductive: number | null;
  /** Arquivo novo selecionado nesta sessão (undefined/null = não altera a imagem atual). */
  image: File | null;
  /** Flag local — vira `remove_image=1` no FormData quando o usuário clica "Remover imagem". */
  removeImage: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface FamilyEquipmentFormType {
  description: string;
  is_enabled: boolean;
  type_depreciation: 0 | 1;
  depreciation: number | null;
  residual: number | null;
  life_bens: number | null;
  vl_time_productive: number | null;
  vl_time_unproductive: number | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface FamilyEquipmentFilterForm {
  /** Busca por descrição (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  type_depreciation?: '' | '0' | '1';
}
