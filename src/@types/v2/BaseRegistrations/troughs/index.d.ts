// src/@types/v2/BaseRegistrations/troughs/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Cochos (Trough) — API v1 do backend Laravel GB.Cerne.
// TASK-FE-2200 (fundação de dados + listagem + criação/edição real + opções).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /troughs           → data: TroughListItem[], meta REAL
//                                (`ApiResponse::paginated`), filtro `search`.
//   GET    /troughs/{uuid}    → data: TroughData (mesmo shape do item de
//                                lista + `area`/`grazing`/`feedlot_corral`
//                                aninhados — contrato de API §1.2 item 3).
//   GET    /troughs/options   → data: TroughOptions (áreas + módulos +
//                                currais numa única chamada, contrato §6/D4).
//                                Aceita `?trough_uuid=` opcional (em edição,
//                                mantém visível o Curral HOJE vinculado a
//                                ESTE Cocho — ver `TroughController::options()`).
//   POST   /troughs           → payload TroughPayload (create).
//   PUT    /troughs/{uuid}    → payload TroughPayload (update, campos
//                                `sometimes` — mesmo shape, update parcial
//                                aceito pelo backend).
//   DELETE /troughs/{uuid}    → 204 (exclusão física, sem soft delete).
//
// ⚠️ Nomenclatura verificada por LEITURA DIRETA do backend já implementado
// (`GB.Cerne.Api/app/Http/Resources/V1/TroughResource.php` +
// `app/Actions/Trough/GetTroughOptionsAction.php` +
// `app/Http/Controllers/Api/V1/TroughController.php`, execução 029) — o
// campo aninhado é `feedlot_corral` (snake_case, singular) e o container de
// opções é `feedlot_corrals` (snake_case), DIVERGENTE do texto ilustrativo
// `feedlotCorrals`/`feedlotCorral` da Tarefa de fundação (prosa do
// architect, não o JSON real). Sibling-first (LAC-029-02): código real >
// prosa de tarefa.
//
// `feedlot_corral_uuid` — 3 ESTADOS (contrato de API §9.3, contrato de tela
// §4/D-FE-1):
//   - AUSENTE do payload (chave `undefined`, TS `?`)  → não tocar o vínculo.
//   - `null` explícito                                → desvincular.
//   - `string` (uuid)                                 → associar/trocar.
// Por isso `TroughPayload['feedlot_corral_uuid']` é `string | null`
// OPCIONAL — o service NUNCA envia a chave com `undefined` de propósito; ela
// simplesmente não entra no objeto quando o formulário não a preencheu (ver
// `CreateOrUpdateTrough.tsx`, montagem condicional do payload).
//
// `uuid` sempre; `id` sequencial nunca. Fonte: `contrato-cochos.md` (API,
// v1.0 AUTOAPROVADO) + `contrato-fe-cochos.md` (tela, v1.0), `TASK-FE-2200`
// + leitura direta do backend já implementado nesta sessão.
// -----------------------------------------------------------------------------

// ============================================
// TROUGH (resposta da API)
// ============================================

export type TroughType = 'A' | 'B';

export interface TroughAreaRef {
  uuid: string;
  description: string;
}

export interface TroughGrazingRef {
  uuid: string;
  description: string;
}

export interface TroughFeedlotCorralRef {
  uuid: string;
  identification: string;
  name: string | null;
}

export interface TroughListItem {
  uuid: string;
  code: string;
  description: string;
  type: TroughType;
  /** Rótulo já resolvido pelo backend (`ShelterTypeEnum::label()`) — SEMPRE
   *  pt-BR ("Coberto"/"Descoberto"), independente do idioma ativo da SPA.
   *  NÃO usar para renderizar a UI (quebraria en-US/es-ES) — a UI usa
   *  `troughTypeOptions.getLabel(type, languageGB)`. Mantido no tipo só
   *  por fidelidade ao envelope real. */
  type_label?: string;
  total_area: number;
  is_enabled: boolean;
  // Trio de localização — no MÁXIMO 1 entre `area`/`grazing` preenchido
  // (regra XOR, D1 do contrato de API), `feedlot_corral` independente dos 2.
  // Todos `null` é estado VÁLIDO (cocho sem localização vinculada).
  area: TroughAreaRef | null;
  grazing: TroughGrazingRef | null;
  feedlot_corral: TroughFeedlotCorralRef | null;
  created_at?: string;
  updated_at?: string;
}

// Shape do detalhe (`GET /troughs/{uuid}`) — mesmo shape do item de lista,
// já com `area`/`grazing`/`feedlot_corral` aninhados (contrato de API §1.2
// item 3) — sem campo adicional além do que a listagem já carrega.
export type TroughData = TroughListItem;

// ============================================
// FILTRO (listagem) — só `search` (contrato de tela §2, mirror `index()`
// legado: busca em código/descrição/área/módulo, texto único).
// ============================================

export interface TroughsFilterForm {
  search?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload SEMPRE completo em create/update (`TroughRequest` não diferencia
// por verbo além de `required`→`sometimes`, contrato de tela §3) — mirror
// `GrazingPayload`/`updateGrazing`. `code`/`farm_id` NUNCA aqui (server).
export interface TroughPayload {
  description: string;
  type: TroughType;
  total_area: number;
  is_enabled: boolean;
  area_uuid?: string | null;
  grazing_uuid?: string | null;
  // Optional real (TS `?`) — ver nota de cabeçalho: ausente = manter,
  // `null` = desvincular, uuid = associar/trocar.
  feedlot_corral_uuid?: string | null;
}

// ============================================
// REACT HOOK FORM (consumido por `CreateOrUpdateTrough.tsx`, TASK-FE-2202)
// ============================================

export interface TroughForm {
  uuid?: string;
  code?: string;
  type: TroughType | '';
  description: string;
  total_area: number | string;
  // `area_uuid`/`grazing_uuid` — XOR client-side (contrato de tela §3.1):
  // preencher um `setValue(outro, null)` + desabilita o `Select` do outro.
  area_uuid: string | null;
  grazing_uuid: string | null;
  // 3º estado (`removedFeedlotCorral`) NÃO mora aqui — é um `useState`
  // dedicado do componente de formulário (ação "Remover vínculo", contrato
  // §4), o RHF só guarda o valor SELECIONADO (uuid) ou `null` (nada
  // selecionado). O componente decide, na montagem do payload, se `null`
  // significa "nunca teve" (Optional, omite a chave) ou "removido agora"
  // (`null` explícito no payload).
  feedlot_corral_uuid: string | null;
  is_enabled: boolean;
}

// ============================================
// OPÇÕES (`GET /troughs/options`, contrato de API §6/D4 — 1 única chamada
// popula os 3 Selects de localização do formulário)
// ============================================

export interface TroughOptionAreaItem {
  uuid: string;
  description: string;
  troughs_count: number;
}

export interface TroughOptionGrazingItem {
  uuid: string;
  description: string;
  troughs_count: number;
}

export interface TroughOptionFeedlotCorralItem {
  uuid: string;
  identification: string;
  name: string | null;
}

export interface TroughOptions {
  areas: TroughOptionAreaItem[];
  grazings: TroughOptionGrazingItem[];
  // snake_case verificado por leitura direta de `GetTroughOptionsAction`
  // (execução 029) — NÃO `feedlotCorrals` (texto ilustrativo da Tarefa).
  feedlot_corrals: TroughOptionFeedlotCorralItem[];
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL)
// ============================================

export interface TroughsListEnvelope {
  success: boolean;
  message: string;
  data: TroughListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}
