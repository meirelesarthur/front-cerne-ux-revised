// src/@types/v2/BaseRegistrations/headband/index.d.ts
// Tipos do módulo de Testeiras (Headband) — API v1 do backend Laravel GB.Cerne.
// Catálogo GLOBAL (sem farm_id/tenant_id, sem X-Farm-Id) — Headband-contrato.md DA-HB-03.
//
// ⚠️ CORREÇÃO DE CONTRATO recebida DEPOIS da ficha `TASK-HB-FE-01` (2026-08-05,
// decisão do dev — ver `Headband-contrato.md ## 12`, 2ª exceção do gate,
// revisada): a ficha original dizia que `partner_id` nunca seria enviado pelo
// front (`GAP-UX-HB-01`, decisão default do Arquiteto, motivada por
// `PartnerResource` só expor `uuid`, nunca o `id` interno sequencial). Isso foi
// SUPERADO — a API passou a expor/aceitar `partner_uuid` (string, uuid),
// resolvendo `uuid → id` no servidor (`HeadbandRequest`/`StoreHeadbandAction`/
// `UpdateHeadbandAction`, confirmado por leitura direta do `api_root`). O
// campo agora é legível E gravável pelo front, sem violar a Lei de nunca
// expor `id` sequencial.

export type HeadbandTypeSlug = 'c' | 'p';

// ============================================
// HEADBAND (resposta da API — HeadbandResource)
// ============================================

// `partners` (pivot `headband_partner`, N:N) é o vínculo múltiplo — não
// confundir com `partner_uuid` (coluna direta `partner_id`, vínculo ÚNICO).
// São DUAS entradas/leituras independentes (Headband-contrato.md ## 12,
// DA-HB-11 — exceção híbrida): mexer numa não afeta a outra.
export interface HeadbandPartnerRef {
  uuid: string;
  name: string;
}

export interface HeadbandListItem {
  uuid: string;
  description: string;
  link: string;
  position: number;
  type: HeadbandTypeSlug;
  type_label: string;
  image_url: string | null;
  /**
   * Vínculo ÚNICO com Afiliado (coluna direta `partner_id` no backend) —
   * `null` quando a coluna está vazia. Exposto na leitura em `index`,
   * `show`, `store` e `update` (`HeadbandResource::toArray()`, condicionado
   * a `whenLoaded('partner')`). Independente de `partners` (pivot) abaixo.
   */
  partner_uuid: string | null;
  partners: HeadbandPartnerRef[];
  created_at?: string;
  updated_at?: string;
}

// Mesmo Resource do index() e do show() (contrato §4.5) — reaproveitado,
// mirror `DiagnosisPregnancyData`.
export type HeadbandData = HeadbandListItem;

// ============================================
// PAYLOAD (escrita — POST/PUT, multipart)
// ============================================
//
// SEM `remove_image` (fora do contrato, GAP-HB-03 — a imagem nunca é
// removida, só trocada; a coluna `headbands.image` é NOT NULL).
export interface HeadbandPayload {
  description: string;
  link: string;
  position: number;
  type: HeadbandTypeSlug;
  /** Novo arquivo selecionado nesta sessão — `undefined` no update quando o usuário não trocou a imagem. */
  image?: File;
  /**
   * Vínculo ÚNICO com Afiliado (coluna direta `partner_id`, traduzida de
   * `uuid → id` no servidor) — semântica TRI-ESTADO testada no backend
   * (`HeadbandTest.php`, "GAP-HB-01"/"DA-HB-11"), distinta de simplesmente
   * `undefined`/`null`:
   *
   *   1. Chave AUSENTE do objeto (`'partner_uuid' in payload === false`) →
   *      `headband-service.ts` NÃO anexa o campo ao FormData → o backend
   *      recebe a chave ausente (`HeadbandData->partner_uuid` resolve para
   *      `Spatie\LaravelData\Optional`) → PRESERVA o valor atual no update
   *      (na criação, resolve para `null`, mesmo estado de não enviar).
   *   2. Chave presente com `null` explícito → anexada como string vazia →
   *      o middleware `ConvertEmptyStringsToNull` (ativo em
   *      `bootstrap/app.php`) converte para `null` ANTES da validação → o
   *      backend recebe `null` explícito → ZERA o vínculo.
   *   3. Chave presente com um `uuid` de Partner → grava o vínculo.
   *
   * **NUNCA declare esta chave com valor `undefined` explícito** em um
   * objeto literal (`{ ...payload, partner_uuid: undefined }`) — o serviço
   * usa `'partner_uuid' in payload` (presença da CHAVE, não do valor) para
   * decidir se anexa o campo; um `undefined` explícito ainda deixaria a
   * chave presente e seria enviado como string vazia (= zera), contrariando
   * a intenção de "preservar". Para preservar, OMITA a chave por completo.
   */
  partner_uuid?: string | null;
  /**
   * Lista de uuids de Partner a sincronizar na pivot `headband_partner`
   * (vínculo N:N) — `undefined` = não tocar a pivot. Entrada INDEPENDENTE
   * de `partner_uuid` (coluna direta) — DA-HB-11, exceção híbrida.
   */
  partner_uuids?: string[];
}

// ============================================
// FORM (React Hook Form)
// ============================================

export interface HeadbandForm {
  uuid?: string;
  description: string;
  link: string;
  position: number | null;
  type: HeadbandTypeSlug | null;
  /**
   * Vínculo ÚNICO com Afiliado — no FORM (diferente do `HeadbandPayload`),
   * é sempre um valor concreto (`string | null`, nunca "ausente"): a tela
   * de edição pré-popula com o `partner_uuid` lido da API, e um Select
   * "sem afiliado" mapeia para `null`. A distinção tri-estado
   * (omitir × null explícito) é resolvida na camada de SERVIÇO (submit),
   * não no estado do formulário — ver `HeadbandPayload`.
   */
  partner_uuid: string | null;
  partner_uuids: string[];
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL)
// ============================================

export interface HeadbandsListEnvelope {
  success: boolean;
  message: string;
  data: HeadbandListItem[];
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

export interface HeadbandsFilterForm {
  type?: HeadbandTypeSlug | '';
  /**
   * Filtro ADMINISTRATIVO opcional por Afiliado, via QUERY STRING do
   * `index` — filtra pela PIVOT (`whereHas('partners', ...)`,
   * `HeadbandFilterData->partner_uuid`, Headband-contrato.md §11). Mesmo
   * nome de campo do vínculo único de escrita (`HeadbandPayload.partner_uuid`),
   * mas semântica DIFERENTE (filtro de listagem × coluna de vínculo) — não
   * é o escopo automático de sessão de Afiliado (DA-HB-12/13, backend).
   */
  partner_uuid?: string;
}
