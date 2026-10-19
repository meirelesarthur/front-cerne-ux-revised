// src/@types/v2/Fiscal/Mdfe/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo MDFe (Manifesto de Documentos Fiscais Eletrônicos — domínio
// Fiscal-Transporte, execução 045, TASK-MDFE-FE-01). Pasta física sob
// `Fiscal/` (mirror `@types/v2/Nfes`), namespace de `queryKey`/i18n é FLAT
// (`mdfes.mdfe`, NUNCA `fiscal.mdfe` — ver `src/constants/query-key.ts`).
//
// Fonte de fidelidade: `CONTRATO-API-MDFE.md §2/§5` + `CONTRATO-FRONT-MDFE.md
// §2/§5` + backend real já migrado (`app/Data/Mdfe/*.php`,
// `app/Http/Resources/V1/Mdfe{,List}Resource.php`,
// `app/Http/Requests/Api/V1/MdfeRequest.php`).
//
// GAP-MDFE-FE-05 (RESOLVIDO, execução 045) — `veiculo_tracao_id`/
// `veiculo_reboque_id`/`_2`/`_3`/`emissor_id` e `cidade_id` (2 pontos,
// `municipios_carregamento.*`/`info_descarga.*`) são validados pelo backend
// como `uuid` (`MdfeRequest::rules()` real — `Rule::exists(..., 'uuid')`),
// mirror dos 3 endpoints de options que este front consome (`GET
// /equipments/options`, `GET /cities/options`, `GET /issuers`), que só
// expõem `uuid`. Os campos de FORM tipados como `Option<string>` guardam o
// `uuid`; ver `MdfeMunicipioCarregamentoPayload`/`MdfeInfoDescargaPayload`
// abaixo para o shape de PAYLOAD (GAP-FE-245 Bug 2 — `cidade_id` nunca passa
// por `Number()` no envio).
//
// BUG-PROD (homologação, 2026-09) — o backend passou a emitir `cidade_id`
// como UUID string também no shape de LEITURA (`MdfeMunicipioCarregamentoData`/
// `MdfeInfoDescargaData` abaixo, `GET /mdfes/{uuid}`), e o `cidade` aninhado
// passou a trazer `uuid` além de `title`. Antes era o `id` bigint interno —
// a hidratação do form (`CreateOrUpdateMdfe.tsx → fillMdfeForm`) forçava
// `String(item.cidade_id)` e o Select ficava com o `id` numérico como
// `value`, nunca batendo com o `uuid` que o SUBMIT exige → 422 em edição.
//
// ⚠️ Divergência de cardinalidade vs. a literalidade da Tarefa (ajuste
// mecânico, evidência real): `unidade_carga`/`nfe_descarga`/`cte_descarga`
// são OBJETOS ÚNICOS opcionais (`MdfeUnidadeCargaData|null` etc.), NÃO
// arrays — confirmado em `app/Data/Mdfe/MdfeInfoDescargaData.php` (docblock:
// "`unidade_carga`/`nfe_descarga`/`cte_descarga` são objetos ÚNICOS
// (`Optional`), não coleções... o fluxo legado sempre cria UMA UnidadeCarga
// e NFe/CTe descarga CONDICIONAIS"). `lacre_unidade_cargas`/
// `lacre_transportes` SÃO arrays (`hasMany` real).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS (mirror App\Enums\Mdfe*, CONTRATO-API-MDFE.md §3)
// ============================================

export type MdfeEstado = 'novo' | 'aprovado' | 'rejeitado' | 'cancelado';

export type MdfeTipoCarga =
  '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11';

/** `MdfeTypeEmissionEnum`: 1=Normal, 2=Contingência (LK002). */
export type MdfeTypeEmission = 1 | 2;

/** `MdfePaymentTypeEnum`: 0=Pago, 1=A Pagar (LK016). */
export type MdfePaymentType = 0 | 1;

/** `MdfePaymentComponentTypeEnum` (LK017). */
export type MdfePaymentComponentType = '01' | '02' | '03' | '99';

// ============================================
// MDFE (resposta da API — MdfeResource shape real, GET /mdfes/{uuid})
// ============================================

export interface MdfeIssuerRef {
  uuid: string;
  razao_social: string;
  cpf_cnpj: string;
}

/** `POST /mdfes/{uuid}/emit` — emissor escolhido na emissão (D3, obrigatório). */
export interface MdfeEmitPayload {
  issuer_uuid: string;
}

/** `GET /mdfes/issuer-options` — emissores elegíveis para emitir MDF-e (lista plana). */
export interface MdfeIssuerOption {
  uuid: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  /** CNPJ/CPF normalizado (só dígitos). */
  document: string | null;
  ambiente: number | string | null;
  state_registrations: string[];
}

export interface MdfeEquipmentRef {
  uuid: string;
  code: string;
  description: string;
}

export interface MdfeCidadeRef {
  id: number;
  /** BUG-PROD homologação 2026-09 — uuid da cidade, mesmo valor de `cidade_id` abaixo. */
  uuid: string;
  title: string;
}

export interface MdfeMunicipioCarregamentoData {
  /** BUG-PROD homologação 2026-09 — uuid string (era `id` bigint). */
  cidade_id: string;
  cidade: MdfeCidadeRef | null;
}

export interface MdfeCiotData {
  cpf_cnpj: string;
  codigo: string;
}

export interface MdfePercursoData {
  uf: string;
}

export interface MdfeValePedagioData {
  cnpj_fornecedor: string;
  cnpj_fornecedor_pagador: string;
  numero_compra: string;
  valor: number;
}

export interface MdfeUnidadeCargaData {
  id_unidade_carga: string;
  quantidade_rateio: number;
}

/** Shape compartilhado por `lacre_unidade_cargas[]` e `lacre_transportes[]`. */
export interface MdfeLacreData {
  numero: string;
}

export interface MdfeNfeDescargaData {
  chave: string;
  seg_cod_barras: string;
}

export interface MdfeCteDescargaData {
  chave: string;
  seg_cod_barras: string;
}

export interface MdfeInfoDescargaData {
  /** BUG-PROD homologação 2026-09 — uuid string (era `id` bigint). */
  cidade_id: string;
  cidade: MdfeCidadeRef | null;
  tp_unid_transp: number;
  id_unid_transp: string;
  quantidade_rateio: number;
  /** Objeto único (`hasOne` real) — GAP-MDFE-08/divergência de cardinalidade acima. */
  unidade_carga: MdfeUnidadeCargaData | null;
  lacre_unidade_cargas: MdfeLacreData[];
  /** GAP-MDFE-08 (backend, `[AGUARDANDO APROVAÇÃO]`) — carregado mas hoje não
   *  persistido pelo backend; a UI preserva o comportamento observado do legado. */
  lacre_transportes: MdfeLacreData[];
  /** Objeto único, condicional (ou este ou `cte_descarga`, nunca ambos exigidos). */
  nfe_descarga: MdfeNfeDescargaData | null;
  cte_descarga: MdfeCteDescargaData | null;
}

export interface MdfePaymentData {
  payment_type: MdfePaymentType;
  component_type: MdfePaymentComponentType;
  responsible_cpf_cnpj: string | null;
  responsible_name: string | null;
  amount: number;
  additional_info: string | null;
  bank_code: string | null;
  agency_code: string | null;
  cnpj_ipef: string | null;
  pix_key: string | null;
}

export interface MdfeData {
  uuid: string;
  uf_inicio: string;
  uf_fim: string;
  encerrado: boolean;
  data_inicio_viagem: string; // yyyy-MM-dd
  carga_posterior: boolean;
  cnpj_contratante: string;
  estado: MdfeEstado;
  mdfe_numero: number;
  chave: string;
  protocolo: string;
  seguradora_nome: string;
  seguradora_cnpj: string;
  numero_apolice: string;
  numero_averbacao: string;
  valor_carga: number;
  quantidade_carga: number;
  info_complementar: string;
  info_adicional_fisco: string;
  condutor_nome: string;
  condutor_cpf: string;
  lac_rodo: string;
  tp_emit: number;
  tp_transp: number;
  produto_pred_nome: string;
  produto_pred_ncm: string;
  produto_pred_cod_barras: string;
  cep_carrega: string;
  cep_descarrega: string;
  tp_carga: MdfeTipoCarga;
  latitude_carregamento: string;
  longitude_carregamento: string;
  latitude_descarregamento: string;
  longitude_descarregamento: string;
  type_emission: MdfeTypeEmission;
  /** Só `P` confirmado hoje (GAP backend) — string validada, nunca enum fechado. */
  integration_status: string;
  code_number: string | null;
  date_send_sefaz: string | null;
  issue: MdfeIssuerRef | null;
  veiculo_tracao: MdfeEquipmentRef | null;
  veiculo_reboque: MdfeEquipmentRef | null;
  veiculo_reboque2: MdfeEquipmentRef | null;
  veiculo_reboque3: MdfeEquipmentRef | null;
  municipios_carregamento: MdfeMunicipioCarregamentoData[];
  ciots: MdfeCiotData[];
  percursos: MdfePercursoData[];
  vales_pedagio: MdfeValePedagioData[];
  info_descarga: MdfeInfoDescargaData[];
  payments: MdfePaymentData[];
  created_at: string;
  updated_at: string;
}

// ============================================
// GRID (MdfeListResource real — GAP-MDFE-FE-06: campos que o Resource ainda
// não expõe, marcados abaixo, renderizam '—' na Listagem/Não Encerrados)
// ============================================

export interface MdfeListItem {
  uuid: string;
  mdfe_numero: number;
  estado: MdfeEstado;
  encerrado: boolean;
  data_inicio_viagem: string;
  uf_inicio: string;
  uf_fim: string;
  veiculo_tracao_placa: string | null;
  issue_razao_social: string | null;
  // ---- GAP-MDFE-FE-06 — ausentes no MdfeListResource real hoje ----
  integration_status?: string;
  cnpj_contratante?: string;
  quantidade_carga?: number;
  valor_carga?: number;
  chave?: string;
  protocolo?: string;
  created_at?: string;
}

export interface MdfesListEnvelope {
  success: boolean;
  message: string;
  data: MdfeListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// FILTRO (Listagem + Não Encerrados — MdfeFilterData real EXIGE chaves
// CAMEL-CASE na querystring, sem mapeamento automático snake_case→camelCase
// confirmado por leitura direta de `config/data.php` — ver `mdfe-service.ts`).
// Este é o MESMO shape enviado como `filter` ao `useCustomGridQuery`
// (`TASK-MDFE-FE-02`), por isso já nasce nas chaves reais da API — não um
// shape "de UI" convertido depois.
// ============================================

export interface MdfeFilterForm {
  estado?: MdfeEstado;
  encerrado?: boolean;
  dataInicioViagemDe?: string;
  dataInicioViagemAte?: string;
  /** uuid do Emissor — GAP-MDFE-FE-05 (API espera `emissorId` bigint). */
  emissorId?: string;
  /** uuid do veículo (tração ou qualquer reboque) — GAP-MDFE-FE-05. */
  veiculoId?: string;
}

// ============================================
// FORM (React Hook Form — selects como Option<T>, mirror CreateOrUpdateNfe)
// ============================================

export interface MunicipioCarregamentoForm {
  cidade_id: Option<string> | null;
}

export interface PercursoForm {
  uf: Option<string> | null;
}

export interface CiotForm {
  codigo: string;
  cpf_cnpj: string;
}

export interface ValePedagioForm {
  cnpj_fornecedor: string;
  cnpj_fornecedor_pagador: string;
  numero_compra: string;
  valor: number | null;
}

export interface PaymentForm {
  responsible_name: string;
  responsible_cpf_cnpj: string;
  payment_type: Option<MdfePaymentType> | null;
  component_type: Option<MdfePaymentComponentType> | null;
  amount: number | null;
  bank_code: Option<string> | null;
  agency_code: string;
  cnpj_ipef: string;
  pix_key: string;
  additional_info: string;
}

export interface UnidadeCargaForm {
  id_unidade_carga: string;
  quantidade_rateio: number | null;
}

export interface LacreForm {
  numero: string;
}

export interface InfoDescargaForm {
  tp_unid_transp: Option<number> | null;
  id_unid_transp: string;
  quantidade_rateio: number | null;
  cidade_id: Option<string> | null;
  chave_nfe: string;
  seg_cod_nfe: string;
  chave_cte: string;
  seg_cod_cte: string;
  unidade_carga: UnidadeCargaForm | null;
  lacre_unidade_cargas: LacreForm[];
  lacre_transportes: LacreForm[];
}

export interface MdfeForm {
  // ---- Aba 0 — Geral ----
  uf_inicio: Option<string> | null;
  uf_fim: Option<string> | null;
  data_inicio_viagem: string | null;
  carga_posterior: Option<boolean> | null;
  type_emission: Option<MdfeTypeEmission> | null;
  cnpj_contratante: string;
  quantidade_carga: number | null;
  valor_carga: number | null;
  produto_pred_nome: string;
  produto_pred_ncm: string;
  produto_pred_cod_barras: string;
  cep_carrega: string;
  cep_descarrega: string;
  latitude_carregamento: string;
  longitude_carregamento: string;
  latitude_descarregamento: string;
  longitude_descarregamento: string;
  tp_carga: Option<MdfeTipoCarga> | null;
  seguradora_nome: string;
  seguradora_cnpj: string;
  numero_apolice: string;
  numero_averbacao: string;
  info_complementar: string;
  info_adicional_fisco: string;
  municipios_carregamento: MunicipioCarregamentoForm[];
  percursos: PercursoForm[];

  // ---- Aba 1 — Transporte ----
  /** uuid do veículo (GAP-MDFE-FE-05). */
  veiculo_tracao_id: Option<string> | null;
  veiculo_reboque_id: Option<string> | null;
  veiculo_reboque2_id: Option<string> | null;
  veiculo_reboque3_id: Option<string> | null;
  tp_emit: Option<number> | null;
  tp_transp: Option<number> | null;
  lac_rodo: string;
  ciots: CiotForm[];
  vale_pedagios: ValePedagioForm[];
  payments: PaymentForm[];

  // ---- Aba 2 — Descarga ----
  condutor_nome: string;
  condutor_cpf: string;
  info_descarga: InfoDescargaForm[];
}

// ============================================
// PAYLOAD (desempacotado — Option<T> -> valor primitivo). CreateMdfeRequest
// e UpdateMdfeRequest têm o MESMO shape full-resource (CONTRATO-FRONT-MDFE.md
// §5.6) — nunca Partial<>.
//
// GAP-FE-245 (Bug 2) — `cidade_id` no PAYLOAD (POST/PUT) é sempre a UUID
// string do Select (mirror `veiculo_tracao_id`/`_reboque*`/`emissor_id`,
// `MdfeRequest::rules()` valida `municipios_carregamento.*.cidade_id`/
// `info_descarga.*.cidade_id` como `uuid`). Desde o BUG-PROD homologação
// 2026-09, o shape de LEITURA (`MdfeMunicipioCarregamentoData`/
// `MdfeInfoDescargaData` acima) TAMBÉM é uuid string — os 2 payload types
// abaixo continuam declarados à parte só por não reaproveitarem `cidade`
// aninhado (o payload nunca envia o objeto `cidade`, sempre `null`).
// ============================================

export interface MdfeMunicipioCarregamentoPayload {
  cidade_id: string;
  cidade: null;
}

// GAP-MDFE-FE-07 — `unidade_carga`/`nfe_descarga`/`cte_descarga` são
// `sometimes|array` em `MdfeRequest::rules()`: a regra só é dispensada
// quando a CHAVE está AUSENTE do payload (`sometimes`), nunca quando ela
// está presente com `null` (`array` rejeita `null`). O shape de LEITURA
// (`MdfeInfoDescargaData`) modela estes 3 campos como `T | null` porque a
// API sempre os devolve; o shape de ESCRITA precisa distinguir "ausente"
// de "nulo" — por isso são `?:` (opcionais, omitidos quando vazios) aqui,
// nunca `| null`. `tryPersistMdfe` (`CreateOrUpdateMdfe.tsx`) faz spread
// condicional para NUNCA emitir a chave com valor `null`.
export interface MdfeInfoDescargaPayload extends Omit<
  MdfeInfoDescargaData,
  'cidade_id' | 'unidade_carga' | 'nfe_descarga' | 'cte_descarga'
> {
  cidade_id: string;
  unidade_carga?: MdfeUnidadeCargaData;
  nfe_descarga?: MdfeNfeDescargaData;
  cte_descarga?: MdfeCteDescargaData;
}

export interface MdfePayload {
  uf_inicio: string;
  uf_fim: string;
  data_inicio_viagem: string;
  carga_posterior: boolean;
  type_emission: MdfeTypeEmission;
  cnpj_contratante: string;
  quantidade_carga: number;
  valor_carga: number;
  produto_pred_nome: string;
  produto_pred_ncm: string;
  produto_pred_cod_barras: string;
  cep_carrega: string;
  cep_descarrega: string;
  latitude_carregamento: string;
  longitude_carregamento: string;
  latitude_descarregamento: string;
  longitude_descarregamento: string;
  tp_carga: MdfeTipoCarga;
  seguradora_nome: string;
  seguradora_cnpj: string;
  numero_apolice: string;
  numero_averbacao: string;
  info_complementar: string;
  info_adicional_fisco: string;
  municipios_carregamento: MdfeMunicipioCarregamentoPayload[];
  percursos: MdfePercursoData[];
  /** `veiculo_tracao_id`/reboques — uuid (`MdfeRequest::rules()` valida `uuid`). */
  veiculo_tracao_id: string;
  veiculo_reboque_id: string | null;
  veiculo_reboque2_id: string | null;
  veiculo_reboque3_id: string | null;
  tp_emit: number;
  tp_transp: number;
  lac_rodo: string;
  ciots: MdfeCiotData[];
  vale_pedagios: MdfeValePedagioData[];
  payments: MdfePaymentData[];
  condutor_nome: string;
  condutor_cpf: string;
  info_descarga: MdfeInfoDescargaPayload[];
}

export type CreateMdfeRequest = MdfePayload;
export type UpdateMdfeRequest = MdfePayload;

// ============================================
// COTA MENSAL (GET /mdfes/quota — GAP-MDFE-06 backend)
// ============================================

export interface MdfeQuota {
  used: number;
  limit: number;
  blocked: boolean;
}
