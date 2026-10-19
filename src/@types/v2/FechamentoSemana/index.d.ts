// src/@types/v2/FechamentoSemana/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de FECHAMENTO SEMANA (ClosingWeek — Operacional). TASK-FE-FS-01
// (fundação) — mirror `@types/v2/Carregamentos/index.d.ts`.
//
// Fonte: leitura direta do backend real (`GB.Cerne.Api`, TASK-FS-API-01/02,
// `app/Http/Resources/V1/{ClosingWeekResource,ItemClosingWeekResource,
// ClosingWeekPreviewResource}.php`, `app/Http/Requests/Api/V1/
// {ClosingWeekIndexRequest,ClosingWeekPreviewRequest}.php`,
// `app/Actions/ClosingWeek/PreviewClosingWeekAction.php`) — não é resumo de
// terceiros. `uuid` sempre, `id` NUNCA aparece no envelope.
//
// ATUALIZAÇÃO (TASK-FE-FS-04, GAP-FS-06 — já ✅ pelo Tester) — a divergência
// registrada acima pela TASK-FE-FS-01 foi FECHADA: o
// `ClosingWeekPreviewResource::toArray()` real (`GB.Cerne.Api/app/Http/
// Resources/V1/ClosingWeekPreviewResource.php`, releitura desta Tarefa) agora
// EXPÕE `groups[].items[]` (mirror `PreviewClosingWeekAction::buildGroup()`/
// `buildItemRow()`), fiel ao legado `create.blade.php:24-104` ("Demonstrativo
// de Formação do Preço Médio" — 1 linha por `ItemCharge`). Shape confirmado
// campo a campo contra o código real (nenhum inventado): `item_uuid`, `date`
// (`transfer.dt_shipping`), `due_date` (`transfer.due_date`),
// `provider{uuid,label}|null`, `client{uuid,label}|null`, `quantity_final`
// (CV-02, mesmo do grupo mas por item), `price` (`total_amount/quantity_final`
// do item, NÃO o `amount` bruto), `total_amount`. `percent_per_item` (CV-01,
// nível de grupo) é PRESERVADO tal como estava — não removido, apenas não
// consumido nesta tela (contrato de tela §4.2 não pede a coluna de percentual
// na tabela itemizada).
// -----------------------------------------------------------------------------

// ============================================
// ENTIDADES ANINHADAS (satélites `whenLoaded`)
// ============================================

// `user` do `ClosingWeekResource` — `{uuid, name}` direto de
// `App\Models\User.name` (DEC-FS-13, fecha OQ-07/LACUNA `user->people` do
// contrato legado — NUNCA `user.people.name`).
export interface ClosingWeekUserRef {
  uuid: string;
  name: string;
}

// `cultivation` do `ItemClosingWeekResource` — `{uuid, name}`.
export interface ClosingWeekCultivationRef {
  uuid: string;
  name: string;
}

// ============================================
// ITEM DO FECHAMENTO (`ItemClosingWeekResource`) — só aparece no `show`
// (`whenLoaded('items')`, anti-N+1 — o `index` não eager-carrega itens).
// ============================================

export interface ClosingWeekItemDetail {
  uuid: string;
  cultivation: ClosingWeekCultivationRef | null;
  quality: string | null;
  amount: number;
}

// ============================================
// RECURSO PRINCIPAL — LISTAGEM (`ClosingWeekResource`, `index` eager-carrega
// só `user` — `ClosingWeekRepository::listWithFilters()`, `with('user')`,
// SEM `items`).
// ============================================

export interface ClosingWeekListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  week: number;
  /** `whenLoaded('user')` — presente no index (eager-carregado), `null`
   *  quando o `ClosingWeek` não tem responsável definido. */
  user: ClosingWeekUserRef | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// RECURSO PRINCIPAL — DETALHE (`GET /closing-weeks/{uuid}`, eager-carrega
// `items.cultivation` + `user` — `ClosingWeekRepository::findByUuidOrFail()`).
// ============================================

export interface ClosingWeekDetail extends ClosingWeekListItem {
  items: ClosingWeekItemDetail[];
}

// ============================================
// PREVIEW (`GET /closing-weeks/preview`, `ClosingWeekPreviewResource`) —
// AC-RES-02. Ver divergência documentada no topo do arquivo: NENHUM campo
// `items[]` itemizado por grupo — só `percent_per_item` (referência do
// percentual de cada item do carregamento DENTRO do grupo, CV-01).
// ============================================

export interface ClosingWeekPreviewParams {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export interface ClosingWeekPreviewPercentPerItem {
  item_uuid: string;
  percent: number;
}

// `groups[].items[]` (GAP-FS-06, TASK-FE-FS-04) — 1 linha por `ItemCharge`,
// tabela itemizada "Demonstrativo de Formação do Preço Médio" (mirror
// `create.blade.php:24-104`, `PreviewClosingWeekAction::buildItemRow()`, lido
// campo a campo contra o Resource/Action reais). `provider`/`client` vêm
// `null` quando o `ItemCharge`/`Charge` correspondente não tem o satélite
// (dado real ausente, nunca fabricado). `price` é `total_amount/quantity_final`
// do PRÓPRIO item — NÃO o `amount` bruto do item (unidade original, não
// convertida).
export interface ClosingWeekPreviewItemRow {
  item_uuid: string;
  date: string | null; // YYYY-MM-DD (transfer.dt_shipping)
  due_date: string | null; // YYYY-MM-DD (transfer.due_date)
  provider: { uuid: string; label: string | null } | null;
  client: { uuid: string; label: string | null } | null;
  quantity_final: number;
  price: number;
  total_amount: number;
}

export interface ClosingWeekPreviewGroup {
  cultivation_uuid: string | null;
  cultivation_name: string;
  quality: string | null;
  percent_per_item: ClosingWeekPreviewPercentPerItem[];
  /** Quantidade final do grupo (CV-02, fix GAP-FS-01). */
  quantity_final: number;
  /** Despesas rateadas do grupo (CV-03, fix GAP-FS-02 — acumula). */
  expenses: number;
  /** Preço médio do grupo (CV-04). */
  amount: number;
  /** Linhas itemizadas do grupo (GAP-FS-06) — ver `ClosingWeekPreviewItemRow`. */
  items: ClosingWeekPreviewItemRow[];
}

export interface ClosingWeekPreviewData {
  /** Código sugerido (sem lock — o lock real acontece dentro de `store`,
   *  DEC-FS-08). */
  code: string;
  week: number;
  groups: ClosingWeekPreviewGroup[];
  /** Só informativo — o `store` NÃO recebe estes uuids de volta (DEC-FS-11,
   *  GAP-FS-05); ele re-executa o mesmo lookup server-side. */
  eligible_charge_uuids: string[];
}

// ============================================
// PAYLOAD DE ESCRITA (`POST /closing-weeks`, `ClosingWeekPreviewRequest`) —
// DEC-FS-11/GAP-FS-05: SOMENTE `start_date`/`end_date`. NENHUM campo do
// relatório (`cultivations[]`/`qualities[]`/`charges[]`/`amounts[]`/`week`/
// `code` do legado) é aceito — o servidor recomputa tudo de novo dentro da
// mesma transação, reutilizando a MESMA Action do preview.
// ============================================

export interface StoreClosingWeekPayload {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`) — a listagem devolve um array
// PLANO em `data`, NÃO `{data:{items,pagination}}` (mesma armadilha de
// `ChargesListEnvelope`/`TransfersListEnvelope`).
// ============================================

export interface ClosingWeeksApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  links?: Record<string, unknown>;
}

export interface ClosingWeeksListEnvelope {
  success: boolean;
  message: string;
  data: ClosingWeekListItem[];
  errors: Record<string, string[]> | null;
  meta: ClosingWeeksApiPaginationMeta | null;
}
