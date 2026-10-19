// src/@types/v2/Fiscal/cteManifestacao/index.d.ts
// -----------------------------------------------------------------------------
// DTOs/tipos do módulo de Manifestação de CT-e recebido (CteManifestacao —
// domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13). Mirror EXATO dos
// campos retornados por `CteManifestaListResource` (GB.Cerne.Api,
// `app/Http/Resources/V1/CteManifestaListResource.php`) — `uuid`, nunca `id`.
//
// GAP-CTE-FE-04 (registrado nesta execução, mesmo racional de GAP-CTE-FE-03):
// `GET /cte-manifestacoes` (`E16`) e `POST /cte-manifestacoes/consultar`
// (`E17`) exigem `issue_id` como PK NUMÉRICA interna do Model `Issuer`
// (`SyncCteManifestacoesRequest::rules()` → `['required','integer',
// 'exists:issues,id']`; `CteManifestacaoController::index()` →
// `(int) $request->query('issue_id', 0)`). NENHUM endpoint de lookup do SPA
// expõe esse `id` numérico — `IssuerResource`/`NfeIssuerOptionResource`/
// `listIssuers` (`GET /issuers`) devolvem só `uuid` (mirror do padrão "uuid,
// nunca id" usado em toda a stack nova). `issue_id` é tipado abaixo como
// `string` (uuid) — única fonte de dado real disponível no SPA, mesma
// decisão já validada para GAP-CTE-FE-03 (Onda 1) enquanto o backend não
// aplica a mesma correção (aceitar/resolver uuid internamente, mirror
// `CteRequest`/`CashBookRequest` já corrigidos). Ver
// `04-Gaps_Frontend_UI` / `GAP-CTE-FE-04-cte-manifestacao-issue-id-uuid-vs-integer.md`.
// -----------------------------------------------------------------------------

// ---- Enum (mirror App\Enums\CteManifestaTipo, valores literais do backend) -
export type CteManifestacaoTipo = 0 | 1;

// ---- Leitura (GET index) — CteManifestaListResource (LS10-LS16) -----------
export interface CteManifestacaoListItem {
  uuid: string;
  nome: string | null;
  documento: string | null;
  valor: number;
  data_emissao: string;
  chave: string;
  /** `App\Enums\CteManifestaTipo`: 0 = Pendente (ainda não manifestado — ação
   *  "Manifestar desacordo" visível); 1 = Desacordo (já manifestado — ações
   *  "Gerar DANFE"/"Baixar XML" visíveis). */
  tipo: CteManifestacaoTipo;
  /** Rótulo PT-BR fixo vindo do backend (`CteManifestaTipo::label()`) — o SPA
   *  usa `cteManifestacaoTipoOptions` (i18n via `languageGB`) na UI, este
   *  campo fica disponível para depuração/fallback, nunca renderizado direto. */
  tipo_label: string;
  /** `45 - diffInDays(data_emissao, hoje)`, calculado no BACKEND (`CV05`,
   *  `CteManifestaListResource::PRAZO_DIAS`) — LS15, "Prazo Manifesto". */
  prazo: number;
}

// ---- Filtro da listagem (FL04-FL08, mirror `ManifestaCteFilterData`) -------
export interface CteManifestacaoFilterForm {
  /** GAP-CTE-FE-04 — uuid (única fonte real); backend espera `integer`. */
  issue_id?: string;
  /** Filtra só `nome` (`ILIKE`), fidelidade `DV13` — NÃO expandir para `documento`. */
  search?: string;
  /** Preservado na UI por fidelidade visual — `DV13`: ENVIADO e IGNORADO pelo
   *  backend (`ManifestaCteFilterData` aceita mas nunca usa para filtrar). */
  start_date?: string;
  /** Idem `start_date` — `DV13`. */
  end_date?: string;
}

export type CteManifestacaoFilterRequest = CteManifestacaoFilterForm;

// ---- Payload de ações (E17/E18) --------------------------------------------
export interface ConsultarManifestacoesRequest {
  /** GAP-CTE-FE-04 — uuid (única fonte real); backend espera `integer`. */
  issue_id: string;
}

export interface ManifestarDesacordoRequest {
  /** Único evento suportado pelo domínio (`ManifestCteDesacordoRequest::rules()`
   *  → `in:1`) — fixo, nunca exposto como Select ao usuário (LK22). */
  evento: 1;
  justificativa: string;
}

export interface ManifestarDesacordoFormValues {
  justificativa: string;
}
