// src/@types/v2/Fiscal/cte/index.d.ts
// -----------------------------------------------------------------------------
// DTOs/tipos do módulo CT-e (Cte — domínio Fiscal, execução 045, Onda 1,
// TASK-CTE-FE-01). Mirror EXATO dos campos retornados por
// `CteDetailResource`/`CteListResource` (GB.Cerne.Api) — `uuid`, nunca `id`.
//
// GAP-CTE-FE-03 (registrado nesta execução): `remetente_id`/`destinatario_id`/
// `equipment_id`/`cidade_tomador`/`municipio_envio`/`municipio_inicio`/
// `municipio_fim` são tipados aqui como `Option<string>` (uuid) — a decisão
// JÁ TOMADA pelo Arquiteto Frontend em CONTRATO-TELA-CTE.md §3.1 (mirror do
// padrão "uuid, nunca id" usado em toda a stack: `clients/options`,
// `cities/options`, `equipments/options` só devolvem uuid). O `CteRequest`
// real do backend (`api_root`, lido nesta Tarefa) valida esses 7 campos como
// `integer`/`exists:<tabela>,id` (PK numérica interna) — incompatível com o
// único valor que o SPA consegue obter. Ver
// `04-Gaps_Frontend_UI` / `GAP-CTE-FE-03-remetente-destinatario-equipment-cidade-id-vs-uuid.md`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ---- Enums (mirror App\Enums\Cte*, valores literais do backend) -----------
export type CteEstado = 'novo' | 'aprovado' | 'rejeitado' | 'cancelado';
export type CteModalCode = '01' | '02' | '03' | '04' | '05' | '06';
export type CteTomadorCode = 0 | 1 | 2 | 3;
export type CteTipoDocumentoCode = '00' | '10' | '59' | '65' | '99';

// ---- Leitura (GET show) — CteDetailResource --------------------------------
export interface CteMedidaData {
  uuid: string;
  cod_unidade: string;
  tipo_medida: string;
  quantidade_carga: number;
}

export interface CteComponenteData {
  uuid: string;
  nome: string;
  valor: number;
}

export interface CteData {
  uuid: string;
  natureza: { uuid: string; descricao: string } | null;
  globalizado: 0 | 1;
  cst: string;
  perc_icms: number;
  remetente: { uuid: string; nome: string | null } | null;
  // GAP-CTE-02 (backend, Caminho A): destinatário efetivamente gravado é
  // sempre o remetente — a tela hidrata com o que a API devolver, sem lógica
  // condicional própria (Contrato §2.6).
  destinatario: { uuid: string; nome: string | null } | null;
  chaves_nfe: string[];
  // GAP-CTE-05 (backend, já corrigido): chave de saída em camelCase.
  tpDoc: CteTipoDocumentoCode | '' | null;
  descOutros: string | null;
  nDoc: number | null;
  vDocFisc: number;
  equipment: { uuid: string; description: string } | null;
  produto_predominante: string;
  tomador: CteTomadorCode;
  valor_carga: number;
  valor_transporte: number;
  valor_receber: number;
  modal: CteModalCode;
  medidas: CteMedidaData[];
  componentes: CteComponenteData[];
  /** CL15 — nunca teve round-trip no legado, sempre `null` na resposta. */
  endereco_tomador: null;
  rua_tomador: string | null;
  numero_tomador: string | null;
  bairro_tomador: string | null;
  cep_tomador: string | null;
  cidade_tomador: { uuid: string; name: string } | null;
  data_prevista_entrega: string;
  municipio_envio: { uuid: string; name: string };
  municipio_inicio: { uuid: string; name: string };
  municipio_fim: { uuid: string; name: string };
  retira: boolean;
  detalhes_retira: string | null;
  observacao: string | null;
  sequencia_cce: number;
  cte_numero: number;
  chave: string;
  // UT-000776 (M5) — snapshot IBS/CBS (natureza -> CT-e). Opcionais/nulos:
  // CT-e anterior à M5 não traz o grupo.
  c_class_trib?: string | null;
  cst_ibs_cbs?: string | null;
  perc_ibs_uf?: number | null;
  perc_ibs_mun?: number | null;
  perc_cbs?: number | null;
  perc_reducao_aliq_ibs_uf?: number | null;
  perc_reducao_aliq_ibs_mun?: number | null;
  perc_reducao_aliq_cbs?: number | null;
  perc_dif_ibs_uf?: number | null;
  perc_dif_ibs_mun?: number | null;
  perc_dif_cbs?: number | null;
  v_ibs?: number | null;
  v_cbs?: number | null;
  estado: CteEstado;
  created_at: string;
  updated_at: string;
}

// ---- Leitura (GET index) — CteListResource (LS01-LS09) --------------------
export interface CteListItem {
  uuid: string;
  integration_status: string | null;
  remetente: string | null;
  destinatario: string | null;
  created_at: string;
  valor_carga: number;
  cte_numero: number;
  estado: CteEstado;
}

// ---- Corpo do formulário (React Hook Form) — F01-F39 -----------------------
export interface CteChaveNfeFieldValue {
  /** Sem `uuid` próprio — array 100% client-side (Contrato §2.2), a chave em
   *  si (string de 44 dígitos) É o valor. `id` só existe para o `key` do
   *  `useFieldArray` (gerado pelo RHF, nunca enviado). */
  value: string;
}

export interface CteMedidaFieldValue {
  uuid?: string;
  codUnidade: Option<string> | null;
  tipoMedida: Option<string> | null;
  quantidadeCarga: number | null;
}

export interface CteComponenteFieldValue {
  uuid?: string;
  nome: string;
  valor: number | null;
}

export interface CteForm {
  // GAP-SEC-09 P0-B — uuid de `nature_operations` (FK real tenant-scoped),
  // NÃO o `Option<number>` estático 1/2/3 do legado (NT-01/DV08 REVOGADO).
  natureza: Option<string> | null;
  globalizado: Option<'0' | '1'> | null;
  cst: Option<string> | null;
  percIcms: number | null;
  // UT-000776 (M5) — IBS/CBS (opcionais; preenchidos pela natureza, editáveis).
  cClassTrib: string;
  cstIbsCbs: Option<string> | null;
  percIbsUf: number | null;
  percIbsMun: number | null;
  percCbs: number | null;
  percReducaoAliqIbsUf: number | null;
  percReducaoAliqIbsMun: number | null;
  percReducaoAliqCbs: number | null;
  percDifIbsUf: number | null;
  percDifIbsMun: number | null;
  percDifCbs: number | null;
  remetente: Option<string> | null;
  destinatario: Option<string> | null;
  chavesNfe: CteChaveNfeFieldValue[];
  tpDoc: Option<CteTipoDocumentoCode> | null;
  descOutros: string;
  nDoc: number | null;
  vDocFisc: number | null;
  equipment: Option<string> | null;
  produtoPredominante: string;
  tomador: Option<CteTomadorCode> | null;
  valorCarga: number | null;
  modal: Option<CteModalCode> | null;
  medidas: CteMedidaFieldValue[];
  componentes: CteComponenteFieldValue[];
  enderecoTomador: Option<'0' | '1'> | null;
  ruaTomador: string;
  numeroTomador: string;
  bairroTomador: string;
  cepTomador: string;
  cidadeTomador: Option<string> | null;
  dataPrevistaEntrega: string;
  valorTransporte: number | null;
  valorReceber: number | null;
  municipioEnvio: Option<string> | null;
  municipioInicio: Option<string> | null;
  municipioFim: Option<string> | null;
  retira: Option<'0' | '1'> | null;
  detalhesRetira: string;
  observacao: string;
}

// ---- Filtro da listagem (FL01-FL03) ----------------------------------------
export interface CteFilterForm {
  estado?: string;
  start_date?: string;
  end_date?: string;
}

export type CteFilterRequest = CteFilterForm;

// ---- Payload de escrita (POST/PUT) — wire snake_case + 4 camelCase (F11-14,
// GAP-CTE-05) — mirror EXATO de `CteRequest::rules()`/`CteData` do api_root.
// -----------------------------------------------------------------------------
export interface CteMedidaRequest {
  cod_unidade: string;
  tipo_medida: string;
  quantidade_carga: number;
}

export interface CteComponenteRequest {
  nome: string;
  valor: number;
}

export interface CreateCteRequest {
  /** GAP-SEC-09 P0-B — uuid de `nature_operations` (FK real tenant-scoped,
   *  `GET /nature-operations/active`), NÃO mais o `1|2|3` estático do
   *  legado (NT-01/DV08 REVOGADO). */
  natureza_id: string;
  globalizado: 0 | 1;
  cst: string;
  perc_icms: number;
  // UT-000776 (M5) — opcionais; omitidos quando vazios (a API copia da natureza).
  c_class_trib?: string;
  cst_ibs_cbs?: string;
  perc_ibs_uf?: number;
  perc_ibs_mun?: number;
  perc_cbs?: number;
  perc_reducao_aliq_ibs_uf?: number;
  perc_reducao_aliq_ibs_mun?: number;
  perc_reducao_aliq_cbs?: number;
  perc_dif_ibs_uf?: number;
  perc_dif_ibs_mun?: number;
  perc_dif_cbs?: number;
  /** GAP-CTE-FE-03 — enviado como uuid (único valor disponível no SPA); o
   *  `CteRequest` real exige `integer,exists:clients,id`. */
  remetente_id: string;
  destinatario_id: string;
  chaves_nfe: string[];
  tpDoc?: CteTipoDocumentoCode;
  descOutros?: string;
  nDoc?: number;
  vDocFisc?: number;
  /** GAP-CTE-FE-03 — idem `remetente_id` (uuid vs. `exists:equipments,id`). */
  equipment_id: string;
  produto_predominante: string;
  tomador: CteTomadorCode;
  valor_carga: number;
  valor_transporte: number;
  valor_receber: number;
  modal: CteModalCode;
  medidas: CteMedidaRequest[];
  componentes: CteComponenteRequest[];
  endereco_tomador?: '0' | '1';
  rua_tomador: string;
  numero_tomador: string;
  bairro_tomador: string;
  cep_tomador: string;
  /** GAP-CTE-FE-03 — idem (uuid vs. `exists:cities,id`). */
  cidade_tomador: string;
  data_prevista_entrega: string;
  municipio_envio: string;
  municipio_inicio: string;
  municipio_fim: string;
  retira?: 0 | 1;
  detalhes_retira?: string;
  observacao?: string;
}

// `update()` reenvia o payload COMPLETO (mirror `IG08`/Contrato §2.1 item 4 —
// form nunca faz PATCH parcial neste módulo).
export type UpdateCteRequest = CreateCteRequest;

// ---- Options — lookups locais/AJAX (contrato §3.1, mirror dos Resources
// reais do api_root: `ClientOptionResource`/`CityOptionResource`/
// `EquipmentCatalogOptionResource`). --------------------------------------
export interface CteClientOptionItem {
  uuid: string;
  name: string | null;
}

export interface CteCityOptionItem {
  uuid: string;
  title: string;
  state?: { letter: string | null } | null;
}

export interface CteEquipmentOptionItem {
  uuid: string;
  code: string;
  description: string;
}
