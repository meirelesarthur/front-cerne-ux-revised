// src/@types/v2/SaleContracts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contratos de Venda" (SaleContract — Operacional /
// Agricultura, esteira 036, TASK-FE-036-201). Fundação de dados — nenhuma
// lógica, só shapes. Mirror estrutural do precedente arquitetural direto
// apontado pelo contrato de tela (`Financeiro/Contrato` — "Gestão de
// Contratos", `@/@types/v2/Contracts/index.d.ts`), sem o bloco de itens
// (`items[]`/`useFieldArray`) — Contratos de Venda é um formulário de
// cabeçalho único.
//
// REWORK DE FIDELIDADE (auditoria `audit-contratos-de-venda.md`,
// `SC-LST-001`/rupturas de Resource §(E) — P0): as ASSUNÇÕES abaixo, feitas
// antes da integração real, estavam ERRADAS em 2 pontos confirmados contra
// `SaleContractResource::toArray()` real:
//   1. `status` NÃO é inteiro puro — a API sempre devolve o objeto
//      `{ value, label, color }` (`SaleContractStatus`, ver abaixo). Índice
//      1/2/3/4/9 mora em `status.value`; `.label`/`.color` são texto/hex do
//      backend, mas o front NÃO os consome diretamente (mantém seu próprio
//      dicionário i18n + tokens Chakra em `saleContractStatus.ts` — evita
//      acoplamento a nomenclatura/hex do backend).
//   2. O nome real do campo "Entregue" é `delivered_quantity` (não
//      `delivered`) — confirmado tanto no `GET show` quanto na LISTAGEM (a
//      Resource anexa via subquery correlacionada, `SaleContractRepository::
//      listWithFilters()`), mesmo racional de "Qtd. Faltante" (`balance`) já
//      exibida na listagem legada.
// `client`/`product`/`harvest` como `{ uuid, label }` e os numéricos como
// `number` puro se confirmaram corretos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (FKs relacionais)
// ============================================

export interface SaleContractClientRef {
  uuid: string;
  label: string | null;
}

export interface SaleContractProductRef {
  uuid: string;
  label: string | null;
}

export interface SaleContractHarvestRef {
  uuid: string;
  label: string | null;
}

/** "Responsável" (`user_id`/`Auth::id()` legado, select readonly
 *  auto-preenchido) — `SaleContractResource::responsible`, mesma forma
 *  `{uuid,name}` de `RequestPurchaseResource::responsible`. Ausente na
 *  listagem legada só quando a relação não foi carregada (`whenLoaded`). */
export interface SaleContractResponsibleRef {
  uuid: string;
  name: string | null;
}

/** Shape REAL de `status` na API — nunca inteiro puro (`SC-LST-001` da
 *  auditoria). `value` é o código de domínio (1/2/3/4/9); `label`/`color`
 *  são texto/hex do backend, mantidos aqui só para completude do contrato —
 *  o front NÃO os usa para exibir (ver `saleContractStatus.ts`: dicionário
 *  i18n + tokens Chakra próprios, nunca hex cru da API). */
export interface SaleContractStatus {
  value: number;
  label: string;
  color: string;
}

// ============================================
// SALE CONTRACT (resposta da API)
// ============================================

export interface SaleContractListItem {
  uuid: string;
  code: string;
  number: string;
  date: string; // ISO date
  client: SaleContractClientRef | null;
  product: SaleContractProductRef | null;
  harvest: SaleContractHarvestRef | null;
  /** Só ausente quando a relação `user` não foi carregada (`whenLoaded`) —
   *  na prática, sempre presente (Repository sempre elege `user` no
   *  `EAGER_LOAD`, contrato de tela §6 / `SC-LST-004`). */
  responsible: SaleContractResponsibleRef | null;
  quantity: number;
  bag_weight: number;
  price: number;
  funrural: number;
  coin: string;
  /** 1=Aguardando Envio, 2=Em Andamento, 3=Próximo da Conclusão,
   *  4=Concluído, 9=Cancelado — contrato §5.2, contrato-api §3.2. Objeto
   *  `{value,label,color}`, NUNCA inteiro puro (`SC-LST-001`). */
  status: SaleContractStatus;
  delivery_start_date: string;
  delivery_end_date: string;
  payment_date: string;
  /** "Qtd. Faltante" do legado (`quantity - total_quantity`) — a Resource
   *  anexa via subquery correlacionada já na LISTAGEM, não só no `show`
   *  (`SC-LST-005`). */
  delivered_quantity: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

/** `GET /sale-contracts/{uuid}` — shape de detalhe. Mesmo shape da
 *  listagem, acrescido do que só o formulário de edição/view precisa
 *  (mirror `ContractData extends ContractListItem`). */
export interface SaleContractData extends SaleContractListItem {
  delivery_place: string;
  payment_method: string;
  note: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface SaleContractsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface SaleContractsListEnvelope {
  success: boolean;
  message: string;
  data: SaleContractListItem[];
  errors: Record<string, string[]> | null;
  meta: SaleContractsApiPaginationMeta | null;
}

// ============================================
// PAYLOAD (create/update)
// ============================================

/** Payload completo (store/update). SEM `code`/`status`/`delivered`/
 *  `balance`/`farm_id`/`user_id` — sempre resolvidos/gerados server-side
 *  (contrato §3). `vl_funrural` NUNCA entra aqui — helper client-side
 *  do bloco de cálculo (`TASK-FE-036-204`/`206`), nunca persistido. */
export interface SaleContractPayload {
  client_uuid: string;
  product_uuid: string;
  harvest_uuid: string;
  number: string;
  date: string;
  quantity: number;
  bag_weight: number;
  funrural: number;
  price: number;
  coin: string;
  delivery_place: string;
  delivery_start_date: string;
  delivery_end_date: string;
  payment_date: string;
  payment_method: string;
  note?: string | null;
}

// ============================================
// FILTRO (grid da listagem)
// ============================================

export interface SaleContractFilterForm {
  search?: string;
  client_uuid?: string;
  /** DISPLAY-ONLY (mesmo padrão de `OpeningBalanceFilterForm.product_label`)
   *  — label do Cliente selecionado, só para re-hidratar o
   *  `SelectAsyncPaginate` do drawer ao reabrir, sem depender de novo fetch
   *  nem de mostrar o próprio uuid como label (`SC2-A06`, 2ª auditoria).
   *  NUNCA enviado à API — `listSaleContracts` (`sale-contract-service.ts`)
   *  enumera os parâmetros explicitamente e não repassa esta chave. */
  client_label?: string;
  product_uuid?: string;
  /** DISPLAY-ONLY — mesmo racional de `client_label` acima, para o Produto
   *  selecionado (`SC2-A06`). */
  product_label?: string;
  start_date?: string;
  end_date?: string;
}

export interface SaleContractFilterRequest extends SaleContractFilterForm {}

// ============================================
// FORM (react-hook-form) — cabeçalho único, sem itens.
// ============================================

export interface SaleContractForm {
  client_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  number: string;
  date: string | null;
  quantity: number | null;
  bag_weight: number | null;
  price: number | null;
  funrural: number | null;
  coin: Option<string> | null;
  delivery_place: string;
  delivery_start_date: string | null;
  delivery_end_date: string | null;
  payment_date: string | null;
  payment_method: string;
  note: string;
}

// Reexport de conveniência (mirror `Contracts/index.d.ts`) — evita import
// direto de `@/@types/option` nas telas quando só o alias for necessário.
export type { Option };
