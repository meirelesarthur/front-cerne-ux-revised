// src/@types/v2/Equipments/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo INVENTÁRIO (Equipment — Cadastros Base / Bens-Ativos,
// execução 026, TASK-FE-1001). Fundação de dados — bloco ESTÁVEL apenas
// (identificação/financeiro-depreciação/fiscal-veículo/rateio/anexos). O
// shape RHF (`EquipmentForm`, por aba) é responsabilidade de
// `TASK-FE-1005..1009` (aditivo, mesmo padrão incremental de
// `@/@types/v2/Products/index.d.ts`, que nasceu só com o bloco de dados e
// ganhou `ProductForm` depois).
//
// Fonte: Equipment-Frontend-Contrato.md (execução 026, §6/§14) +
// Equipment-contrato.md (backend, APROVADO, ciclo 3 — mesma execução) §2/§6/
// §10 + Equipment-Doc-Bruta.md §2/§7 (57 colunas físicas, 10 RN).
//
// ⚠️ Rotas `/equipments` AINDA NÃO EXISTEM no fork (`TASK-BE-700..704` em
// curso em paralelo, mesma execução) — este service/tipos são escritos
// CONTRA O CONTRATO, não contra um endpoint testável agora.
//
//   GET    /equipments              → data: EquipmentListItem[], meta com
//                                      paginação REAL, per_page default 10,
//                                      teto 100 (5 filtros, ver
//                                      EquipmentFilterRequest)
//   GET    /equipments/options      → lookup enxuto {uuid, code,
//                                      description}, sem gate de permissão
//                                      (mirror cost-centers/options) — fora
//                                      do escopo desta Tarefa (nenhum select
//                                      consome `equipments/options` no
//                                      contrato de tela; registrado aqui só
//                                      por completude do endpoint)
//   GET    /equipments/{uuid}       → data: EquipmentData
//   POST   /equipments              → payload EquipmentPayload (multipart,
//                                      por causa de `image`+`attachments[]`)
//   PUT    /equipments/{uuid}       → multipart via POST + `_method=PUT`
//                                      (method spoofing, mirror
//                                      FamilyEquipments — PUT nativo não é
//                                      parseado de forma confiável pelo
//                                      Laravel quando o corpo é multipart)
//   DELETE /equipments/{uuid}       → confirmado no contrato de API §10
//                                      (`equipments_delete`) — RN-7 (delete
//                                      em cascata de `depreciations`,
//                                      server-side)
//
// ⚠️ RECONCILIAÇÃO DE SHAPE (premissa §14 do contrato de tela): a Tarefa
// descreve o grid com campos "achatados" (`family_equipment_description`/
// `proprietary_name`), mas o contrato de API (§10, APROVADO) decide
// `EquipmentResource` aninhando `provider`/`proprietary` como `{uuid, label}`
// (mirror `ProviderOptionResource`) — mesmo padrão já usado por TODOS os
// módulos irmãos deste fork (`ProductGroupRef`/`ProductCategoryRef`/
// `FamilyEquipmentResource`, nunca campo achatado tipo `_description`/
// `_name`). Este arquivo segue o contrato de API (fonte de maior
// autoridade/mais recente) — os 2 campos citados na Tarefa viram
// `family: EquipmentFamilyRef` e `proprietary: EquipmentProprietaryRef |
// null`. Se o backend expuser diferente quando `TASK-BE-704` publicar as
// rotas reais, é ajuste mecânico de shape, não replanejamento (mesma
// cláusula de risco já registrada na Tarefa).
//
// FKs expostas como `*_uuid` (convenção universal do projeto) — exceção
// documentada: nenhuma neste módulo (diferente de `Product.ncm_id`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (FKs relacionais, mirror ProductGroupRef/ProviderOptionResource)
// ============================================

export interface EquipmentFamilyRef {
  uuid: string;
  description: string;
}

export interface EquipmentProductRef {
  uuid: string;
  description: string;
}

/** Mirror `ProviderOptionResource` (`{uuid, label}`, `label` = `people.name`). */
export interface EquipmentProviderRef {
  uuid: string;
  label: string;
}

/** Mirror `ProviderOptionResource`/`ProprietaryOptionResource` (`{uuid, label}`). */
export interface EquipmentProprietaryRef {
  uuid: string;
  label: string;
}

/** Linha do rateio N:N com Centro de Custo (RN-8) — leitura, com o pivot
 *  `percentage` embutido (mirror `default_cost_center` de Product, mas em
 *  array por causa do N:N). */
export interface EquipmentCostCenterRow {
  uuid: string;
  code: string;
  description: string;
  percentage: number;
}

/** Anexo dinâmico (RN-9, `morphMany` novo `App\Models\Attachment`, D-EQ3) —
 *  leitura. `file_url` pronto (mirror `image_url` de `FamilyEquipment`, D-EQ
 *  correção sobre o legado — front não monta a URL). */
export interface EquipmentAttachmentRow {
  uuid: string;
  name: string;
  file_url: string | null;
}

// ============================================
// EQUIPMENT (resposta da API)
// ============================================

export interface EquipmentListItem {
  uuid: string;
  /** Gerado pelo servidor (RN-1, `GenerateEquipmentCodeAction`, sequencial
   *  por Farm) — sempre presente após a criação, nunca enviado no payload. */
  code: string;
  description: string;
  family: EquipmentFamilyRef;
  proprietary: EquipmentProprietaryRef | null;
  /** Coluna física `smallint`, NÃO cast como backed-enum (dado legado fora
   *  do domínio 1/2 quebraria a leitura) — cru aqui. */
  status: number;
  /** RN-10: `status < 4 ? label : null` (replica a mesma checagem tolerante
   *  do legado — `Equipment::opStatus()` só define 1/2). */
  status_label: string | null;
  vl_acquisition: number | null;
}

/** `GET /equipments/{uuid}` — shape de detalhe. Acrescenta os campos que a
 *  listagem não precisa exibir, mas o formulário (`TASK-FE-1005..1009`)
 *  consome. */
export interface EquipmentData extends EquipmentListItem {
  specification: string | null;
  model: string | null;
  patrimony: string | null;
  product: EquipmentProductRef | null;
  vl_time_productive: number | null;
  /** Hidden input fixo `value="0"` no legado — nunca editável pela UI nova
   *  (fidelidade ao legado, Doc Bruta §2). Presente aqui só para leitura. */
  vl_time_unproductive: number | null;
  provider: EquipmentProviderRef | null;
  dt_acquisition: string | null;
  hour_meter: number | null;
  year_mod: string | null;
  /** Sempre `true` no `store()` (hardcoded pelo servidor) — sem campo de UI
   *  para desabilitar via create/edit (Doc Bruta §2). Somente-leitura. */
  is_enabled: boolean;
  /** Calculado por `DepreciateEquipment`-equivalente (RN-4), somente-leitura
   *  — NUNCA no `EquipmentPayload`. */
  vl_depreciated: number | null;
  /** Idem acima (saldo a depreciar). */
  sd_depreciate: number | null;
  life_bens: number | null;
  depreciation: number | null;
  /** Mirror `FamilyEquipmentDepreciationType` (D-EQ4, reaproveitado — não
   *  duplicar Enum): `0`=SEM_RESIDUAL, `1`=COM_RESIDUAL. */
  depreciation_type: 0 | 1;
  residual: number | null;
  /** RN-2 (calculado CLIENT-SIDE, servidor só persiste o que veio —
   *  fidelidade ao legado): `vl_acquisition * residual/100` se
   *  `depreciation_type=1`, senão `0`. */
  vl_residual: number | null;
  /** RN-2: `vl_acquisition - vl_residual`. */
  vl_depreciate: number | null;
  /** RN-3 (congelamento) — presente no `GET` de detalhe (premissa §14.2 do
   *  contrato de tela, mirror `withCount('depreciations')` do legado).
   *  `> 0` trava os campos financeiros/depreciação no formulário. */
  depreciations_count: number;
  /** ⚠️ CORREÇÃO (TASK-FE-1005): campo ausente na entrega original da
   *  `TASK-FE-1001`, apesar de já exigido por `EquipmentPayload` (abaixo) e
   *  por `equipment-schema.ts` (`has_depreciation: yup.boolean().required()`,
   *  TASK-FE-1003) — sem ele o `GET /equipments/{uuid}` não teria como
   *  hidratar o campo no prefill de edição (Doc Bruta §2/§7 RN-4).
   *  Adicionado de forma aditiva, sem remover/renomear nada já existente. */
  has_depreciation: boolean;

  // -- Bloco Fiscal/Veículo (gate `use_fiscal`) --
  use_fiscal: boolean;
  chassi: string | null;
  renavam: string | null;
  serie: string | null;
  plate: string | null;
  color: string | null;
  uf: string | null;
  /** Fora do gate `use_fiscal` — sempre visível, fiel ao legado. */
  brand: string | null;
  rntrc: string | null;
  /** Código de tipo de veículo (`Equipment::opTypes()`, catálogo estático). */
  type: string | null;
  body_type: string | null;
  wheel_type: string | null;
  tara: number | null;
  capacity: number | null;
  /** `'f'` (física) | `'j'` (jurídica) — `EquipmentOwnerType` enum. */
  owner_type: 'f' | 'j' | null;
  owner_document: string | null;
  owner_name: string | null;
  owner_ie: string | null;
  owner_uf: string | null;
  /** `EquipmentOwnerTp` enum (0/1/2 — TAC Agregado/Independente/Outros). */
  owner_tp: 0 | 1 | 2 | null;

  /** `'P'` (Próprio, default) | `'T'` (Terceirizado) — `EquipmentType` enum.
   *  RN-5: só editável (front) quando a Família selecionada está no
   *  conjunto de 4 descrições fixas (ver contrato §6). */
  equipment_type: 'P' | 'T';

  /** `EquipmentFeature` enum (já existente no fork) — multiselect,
   *  0..4 chaves (`AB`=Abastecimento, `MA`=Manutenção, `BA`=Batelada,
   *  `AP`=Apontamento). */
  features: Array<'AB' | 'MA' | 'BA' | 'AP'>;

  /** Imagem única (RN-9) — URL pronta (mirror `FamilyEquipment.image_url`). */
  image_url: string | null;

  /** Rateio N:N com Centro de Custo (RN-8) — sempre array, mesmo vazio
   *  (rateio é opcional). */
  cost_centers: EquipmentCostCenterRow[];

  /** Anexos dinâmicos (RN-9) — sempre array, mesmo vazio. */
  attachments: EquipmentAttachmentRow[];

  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface EquipmentsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface EquipmentsListEnvelope {
  success: boolean;
  message: string;
  data: EquipmentListItem[];
  errors: Record<string, string[]> | null;
  meta: EquipmentsApiPaginationMeta | null;
}

/** `GET /equipments/options` — lookup enxuto, sem gate de permissão (mirror
 *  `cost-centers/options`). Não consumido por nenhum select desta feature
 *  (registrado por completude do endpoint, ver cabeçalho do arquivo). */
export interface EquipmentOption {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// REQUEST TYPES (create/update) — full payload, multipart (image+attachments)
// ============================================

/** Payload de escrita (store/update) — montado como `FormData`
 *  (multipart), full-resource (nunca um delta de `dirtyFields`), mirror
 *  `FamilyEquipmentPayload`/`buildFamilyEquipmentFormData`.
 *
 *  AUSENTES de propósito (somente-leitura, calculados pelo backend/RN-4):
 *  `code`, `vl_depreciated`, `sd_depreciate` (DoD explícito da Tarefa).
 *  `is_enabled` também ausente — hardcoded `true` pelo servidor no
 *  `store()`, sem campo de UI (Doc Bruta §2). `vl_residual`/`vl_depreciate`
 *  PRESENTES (RN-2: calculados client-side, servidor só persiste o que
 *  veio, fielmente). */
export interface EquipmentPayload {
  family_equipment_uuid: string;
  description: string;
  specification?: string | null;
  model?: string | null;
  patrimony?: string | null;
  product_uuid?: string | null;
  vl_time_productive: number;
  /** Sempre `0` — hidden input fixo no legado, nunca editável (Doc Bruta §2). */
  vl_time_unproductive: number;
  provider_uuid?: string | null;
  dt_acquisition?: string | null;
  vl_acquisition: number;
  status: number;
  hour_meter?: number | null;
  year_mod: string;
  has_depreciation: boolean;
  life_bens?: number | null;
  depreciation_type: 0 | 1;
  residual?: number | null;
  /** RN-2, calculado client-side — servidor só persiste (fiel). */
  vl_residual: number;
  /** RN-2, calculado client-side — servidor só persiste (fiel). */
  vl_depreciate: number;
  depreciation?: number | null;

  // -- Bloco Fiscal/Veículo --
  use_fiscal: boolean;
  chassi?: string | null;
  renavam?: string | null;
  serie?: string | null;
  plate?: string | null;
  color?: string | null;
  uf?: string | null;
  brand?: string | null;
  rntrc?: string | null;
  type?: string | null;
  body_type?: string | null;
  wheel_type?: string | null;
  tara?: number | null;
  capacity?: number | null;
  owner_type?: 'f' | 'j' | null;
  owner_document?: string | null;
  owner_name?: string | null;
  owner_ie?: string | null;
  owner_uf?: string | null;
  owner_tp?: 0 | 1 | 2 | null;

  equipment_type: 'P' | 'T';

  features: Array<'AB' | 'MA' | 'BA' | 'AP'>;

  /** Arquivo novo selecionado nesta sessão (`null`/ausente = não altera a
   *  imagem atual, mirror `FamilyEquipmentPayload.image`). */
  image?: File | null;
  /** Flag local — vira `remove_image=1` no FormData (mirror
   *  `FamilyEquipmentPayload.removeImage`). */
  removeImage?: boolean;

  /** Rateio N:N (RN-8) — array vazio permitido (campo opcional). Soma dos
   *  `percentage` deve ser exatamente 100% quando não-vazio (enforcement
   *  REAL no front — ver Equipment-Frontend-Contrato.md §7, divergência
   *  deliberada do precedente de `CostCenter`). */
  cost_centers: Array<{ cost_center_uuid: string; percentage: number }>;

  /** Anexos dinâmicos (RN-9) — `uuid` presente = mantido (possivelmente com
   *  `file` novo substituindo o antigo), `uuid` ausente/`null` = novo. */
  attachments: Array<{ uuid?: string | null; name: string; file?: File | null }>;
}

// ============================================
// FILTRO (drawer da listagem, 5 filtros — contrato §5)
// ============================================

/** Shape efetivamente PERSISTIDO em `paginatedQuery.filter`
 *  (`userPaginatedQuery<EquipmentFilterForm>`) — achatado (strings cruas),
 *  com os 2 pares `*_label` companion para re-hidratar os
 *  `Select`/`SelectAsyncPaginate` do drawer sem novo fetch ao reabrir
 *  (mirror `ProductFilterForm`). */
export interface EquipmentFilterForm {
  search?: string;
  family_equipment_uuid?: string;
  /** DISPLAY-ONLY — nunca enviado à API, só re-hidrata o label do Select. */
  family_equipment_label?: string;
  proprietary_uuid?: string;
  /** DISPLAY-ONLY — idem acima. */
  proprietary_label?: string;
  start_date?: string;
  end_date?: string;
}

/** Shape achatado efetivamente enviado à querystring de `GET /equipments`
 *  (`EquipmentFilterData`, backend). */
export interface EquipmentFilterRequest {
  search?: string;
  family_equipment_uuid?: string;
  proprietary_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// FORM (react-hook-form) — TASK-FE-1005 (âncora, todas as 5 abas de uma vez)
// ============================================
// `equipment-schema.ts` (TASK-FE-1003) já valida o schema Yup COMPLETO das 5
// abas de uma vez (mesmo achado já registrado em `product-schema.ts`/
// `ProductForm` — não fatiado por aba). Por isso este shape É ESCRITO AQUI,
// de uma vez, por `TASK-FE-1005` (âncora) — `TASK-FE-1006..1009` CONSOMEM
// (via `control`/`watch`/`errors`/`setValue` do form-pai), NUNCA editam este
// tipo (evita colisão de arquivo entre os 4 Executores em paralelo).
//
// Convenção de representação (mirror `ProductForm`):
//   - FK relacional pesquisável (`family_equipment_uuid`/`product_uuid`/
//     `provider_uuid`) → `Option<string> | null` (Select/SelectAsyncPaginate
//     mantêm o par `{label, value}`, extração `.value` só no submit).
//   - Enum/catálogo estático ou lookup "bulk" simples (`status`/
//     `equipment_type`/`depreciation_type`/`use_fiscal`/`has_depreciation`/
//     `uf`/`owner_uf`/`type`/`body_type`/`wheel_type`/`owner_type`/
//     `owner_tp`) → valor CRU (mesma convenção de
//     `FamilyEquipmentFormType.type_depreciation`) — o componente Select
//     resolve `value`/`options` via `.find()`, sem guardar o par completo.
//   - `features` (multiselect) → `string[]` CRU (mirror `EquipmentPayload`) —
//     o `Select multiple` do Chakra converte para/de `Option<string>[]`
//     inteiramente DENTRO do `render` do `Controller` (nunca no tipo).
//   - Rateio/Anexos (`cost_centers`/`attachments`) → mesmo shape RAW do
//     `EquipmentPayload`/mirror `CostCenterPayload.apportionments`
//     (`{ cost_center_uuid: string; percentage: number }[]`), NUNCA
//     `Option<string>` — o componente de linha (`TASK-FE-1008`) resolve a
//     exibição do Select internamente, mesmo padrão de
//     `ApportionmentsSection` de `CostCenter`.
export interface EquipmentForm {
  // -- Aba "Identificação" (TASK-FE-1005) --
  family_equipment_uuid: Option<string> | null;
  description: string;
  specification?: string | null;
  model?: string | null;
  patrimony?: string | null;
  product_uuid?: Option<string> | null;
  /** `1`=Ativo/`2`=Inativo (`EquipmentStatus`, D-EQ5, `Rule::in([1,2])` no
   *  contrato de API §2) — cru, catálogo estático de 2 opções. */
  status: number | null;
  /** `'P'` (Próprio, default) | `'T'` (Terceirizado) — RN-5: só editável
   *  quando a Família selecionada está no conjunto de 4 descrições fixas
   *  (ver `CreateOrUpdateEquipamento.tsx`). */
  equipment_type?: 'P' | 'T' | null;
  /** `EquipmentFeature` enum — multiselect, 0..4 chaves. */
  features: string[];

  // -- Aba "Financeiro/Depreciação" (TASK-FE-1006) --
  vl_time_productive: number | null;
  provider_uuid?: Option<string> | null;
  dt_acquisition?: string | null;
  vl_acquisition: number | null;
  hour_meter?: number | null;
  year_mod: string;
  has_depreciation: boolean;
  life_bens?: number | null;
  /** Mirror `FamilyEquipmentDepreciationType` (D-EQ4, reaproveitado). */
  depreciation_type: 0 | 1;
  residual?: number | null;
  /** RN-2 — calculado CLIENT-SIDE (`watch`/`useEffect`, `TASK-FE-1006`). */
  vl_residual: number;
  /** RN-2 — idem acima. */
  vl_depreciate: number;
  depreciation?: number | null;

  // -- Aba "Fiscal/Veículo" (TASK-FE-1007, gate `use_fiscal`) --
  use_fiscal: boolean;
  chassi?: string | null;
  renavam?: string | null;
  serie?: string | null;
  plate?: string | null;
  color?: string | null;
  /** UF (2 letras) — cru, `Select` bulk via `/states/options`. */
  uf?: string | null;
  /** Fora do gate `use_fiscal` — sempre visível, fiel ao legado. */
  brand?: string | null;
  rntrc?: string | null;
  /** Código de tipo de veículo — cru, catálogo estático (`opTypes()`). */
  type?: string | null;
  body_type?: string | null;
  wheel_type?: string | null;
  tara?: number | null;
  capacity?: number | null;
  /** `'f'` (física) | `'j'` (jurídica) — cru. */
  owner_type?: 'f' | 'j' | null;
  owner_document?: string | null;
  owner_name?: string | null;
  owner_ie?: string | null;
  owner_uf?: string | null;
  /** `EquipmentOwnerTp` enum (0/1/2) — cru. */
  owner_tp?: 0 | 1 | 2 | null;

  // -- Aba "Rateio — Centro de Custo" (TASK-FE-1008, RN-8) --
  cost_centers: Array<{ cost_center_uuid: string | null; percentage: number | null }>;

  // -- Aba "Anexos" (TASK-FE-1009, RN-9) --
  attachments: Array<{ uuid?: string | null; name: string; file?: File | null }>;
}

// Reexport de conveniência (mirror `ProductRefLabel`-like consumo por
// Selects do formulário, `TASK-FE-1005..1009`) — evita import direto de
// `@/@types/option` nas telas quando só o alias for necessário.
export type { Option };
