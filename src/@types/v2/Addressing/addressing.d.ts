// src/@types/v2/Addressing/addressing.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ENDEREÇAMENTO FÍSICO DE ESTOQUE (Addressing) — API v1 do
// backend Laravel GB.Cerne.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta } —
// Addressing-contrato.md Seção 5):
//   GET    /addressings/tree     → data: AddressingTreeNode[] (árvore completa
//                                   dos 4 níveis fixos — Setor→Corredor→
//                                   Prateleira→Nível —, não-paginada,
//                                   tenant-scoped — DA-AD-16, TASK-AD-03a)
//   GET    /addressings/{uuid}   → data: AddressingData (TASK-AD-03b)
//   POST   /addressings          → data: AddressingData (TASK-AD-03b)
//   PUT    /addressings/{uuid}   → data: AddressingData (TASK-AD-03b)
//   DELETE /addressings/{uuid}   → 204; 422 `errors.in_use[]` se houver
//                                   endereçamentos-filhos e/ou `products`
//                                   vinculados (TASK-AD-03b)
//
// `type` é COMPUTADO pela API a partir do `parent_uuid` resolvido
// (`type = parent.type + 1 ?? 1`) — nunca aceito do payload, nunca enviado de
// volta em nenhum payload de escrita (Addressing-contrato.md DA-AD-02).
//
// `type_label` (PT-BR fixo, `AddressingType::label()` do backend) é
// reservado só para log/debug — o front NUNCA usa `type_label` para exibição
// (quebraria i18n EN/ES). O rótulo de nível exibido na UI é SEMPRE computado
// localmente via `languageGB.addressing.levels[type]` — ver "Achado técnico"
// em TASK-AD-03a.
// -----------------------------------------------------------------------------

// ============================================
// LISTAGEM PAGINADA (`GET /addressings`, aditivo TASK-FE-500 — consumido
// como catálogo de apoio/Select pelo módulo de Produtos, `listAddressings`
// em `addressing-service.ts`). Rota `index()` já existe no backend
// (`AddressingController::index`, `ApiResponse::paginated`) — só não tinha
// função de frontend ainda (o módulo próprio de Addressing usa só `/tree`).
// Sem `parent`/`children_count` (relações não eager-loaded no `index()`).
// ============================================

export interface AddressingListItem {
  uuid: string;
  description: string;
  type: 1 | 2 | 3 | 4;
  /** Reservado para debug/log — NUNCA usar para exibição, ver nota acima. */
  type_label: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddressingsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface AddressingsListEnvelope {
  success: boolean;
  message: string;
  data: AddressingListItem[];
  errors: Record<string, string[]> | null;
  meta: AddressingsApiPaginationMeta | null;
}

// ============================================
// GET /addressings/options (TASK-BE-508, aditivo TASK-FE-504) — lookup
// ENXUTO consumido pelo campo `addressing_uuid` de Produtos (Aba 2). Resource
// dedicado (`AddressingOptionResource`, uuid+description+type), SEM gate de
// `addressings_view`. FLAT (`ApiResponse::success`, `meta` sempre `null` —
// catálogo pequeno, 24 linhas totais, Product-contrato.md §17.2).
// `type` (1-4, `AddressingType` enum) é usado SÓ para montar o prefixo
// "— " por nível no `label` da option (Doc Bruta §3.3 do contrato de tela) —
// NUNCA `type_label` do backend (i18n, mesma regra do resto do módulo).
// ============================================

export interface AddressingOption {
  uuid: string;
  description: string;
  type: 1 | 2 | 3 | 4;
}

export interface AddressingOptionsListEnvelope {
  success: boolean;
  message: string;
  data: AddressingOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface AddressingTreeNode {
  uuid: string;
  description: string;
  /** 1=Setor,2=Corredor,3=Prateleira,4=Nível — computado no servidor,
   *  NUNCA enviado de volta em payload de escrita. */
  type: 1 | 2 | 3 | 4;
  /** Reservado para debug/log — NUNCA usar para exibição (é PT-BR fixo do
   *  backend, quebraria i18n EN/ES). Ver "Achado técnico" em TASK-AD-03a. */
  type_label: string;
  /** Ausente (não só `0`) nos nós do último nível eager-carregado por
   *  `/tree` (`with(['children.children.children'])` — a relação `children`
   *  do Nível não é carregada). Ler sempre via
   *  `node.children?.length ?? node.children_count ?? 0`. */
  children_count?: number;
  children?: AddressingTreeNode[];
}

// ============================================
// FILTRO (busca client-side por descrição — /tree não é paginado)
// ============================================

export interface AddressingFilterForm {
  search?: string;
}

// ============================================
// FORMULÁRIO (TASK-AD-03b — criar/editar Endereçamento; pai SEMPRE read-only)
// ============================================

/** Referência mínima ao pai — Addressing-contrato.md Seção 4 (Resource): o
 *  GET de detalhe expõe `parent` ANINHADO (objeto ou `null`), NUNCA um
 *  `parent_uuid` plano. Um pai nunca é um Nível (`type` 1-3 apenas — um
 *  Nível nunca é pai de ninguém). `type_label` reservado — nunca usar em UI,
 *  ver TASK-AD-03a. */
export interface AddressingParentRef {
  uuid: string;
  description: string;
  type: 1 | 2 | 3;
  type_label: string;
}

/** `GET /addressings/{uuid}` — shape de leitura (`AddressingResource`). */
export interface AddressingData {
  uuid: string;
  description: string;
  type: 1 | 2 | 3 | 4;
  type_label: string;
  /** `null` = é um Setor-raiz. Preenchido = é Corredor/Prateleira/Nível. */
  parent: AddressingParentRef | null;
  children_count?: number;
  created_at?: string;
  updated_at?: string;
}

/** `POST /addressings` — payload de criação. `type` NUNCA é enviado (é
 *  computado pela API a partir de `parent_uuid`). O pai nunca é escolhido
 *  pelo usuário nesta UI — ver "PONTO DE MODELAGEM DE UI" em TASK-AD-03b. */
export interface CreateAddressingRequest {
  description: string;
  /** `null`/omitido = cria um Setor-raiz. Preenchido = cria o próximo nível
   *  sob o pai indicado (sempre resolvido por contexto de navegação —
   *  `?parentUuid=` — nunca por escolha do usuário). */
  parent_uuid?: string | null;
}

/** `PUT /addressings/{uuid}` — payload de atualização. Esta Tarefa NUNCA
 *  envia `parent_uuid` (o formulário não permite reparentar — ver Leitura
 *  do dev de TASK-AD-03b). `description` sempre enviado. Confirmado em
 *  `UpdateAddressingAction::attributesFromData` (backend, TASK-AD-02): a
 *  chave `parent_uuid` omitida é tratada como `Optional` — o pai atual é
 *  preservado, `type` não é recalculado. */
export interface UpdateAddressingRequest {
  description: string;
}

/** Estado do `react-hook-form` — só o campo editável. */
export interface AddressingForm {
  description: string;
}

/** Shape do 422 estruturado de exclusão bloqueada (Addressing-contrato.md
 *  Seção 3/DA-AD-05/DA-AD-07) — usado só no `catch`/`onError` da mutação de
 *  exclusão (na listagem, TASK-AD-03a/03b). */
export interface AddressingInUseError {
  success: false;
  message: string;
  errors: {
    in_use: Array<{ resource: string; table: string; count: number }>;
  };
}
