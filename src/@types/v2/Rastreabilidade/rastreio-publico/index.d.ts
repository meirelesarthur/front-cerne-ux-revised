// src/@types/v2/Rastreabilidade/rastreio-publico/index.d.ts
// -----------------------------------------------------------------------------
// DTO da página PÚBLICA de rastreio (consumidor final, sem login — F-067,
// `97-Esteiras/058`, TASK-TR-PUB-FE-01, fundação). Superfície DISTINTA do CRUD
// admin de Produtos/Rastreabilidade (`@/@types/v2/Rastreabilidade/traceability`),
// mirror `@/@types/v2/Budgets` (`PublicBudgetData`) — sibling de `traceability/`,
// `traceability-config/`.
//
// Fonte de verdade: `PublicTraceabilityResource` real (`GB.Cerne.Api`),
// documentado 1:1 em `CONTRATO-DESTINO-F067-rastreio-publico.md ## 4`
// (produzido pelo api-architect, endpoint ENTREGUE E VALIDADO). Contrato de
// tela: `CONTRATO-TELA-F067-rastreio-publico.md ## 4`.
//
// ⚠️ DADO 100% CRU — o backend NÃO localiza (devolve `_pt`/`_en`/`_es` SEMPRE
// as 3 variantes, sem parâmetro de idioma), NÃO formata número
// (`energetic_value` etc. são `float` cru, sem `number_format`), NÃO monta
// URL de imagem/logo (`image`/`logo` são path RELATIVO, front resolve
// URL+fallback), NÃO monta link de WhatsApp (`whatsapp_fone`/`whatsapp_texto`
// crus, front monta o link — `## 8` do contrato de tela) e NÃO decide rótulo
// CPF×CNPJ (`config.cpf_cnpj` cru — front decide pelo tamanho, `CL-27`). Toda
// apresentação fica no front — mesma divisão de responsabilidade já usada
// pelos Resources internos do módulo admin (`TraceabilityResource`/
// `TraceabilityConfigResource`).
//
// NENHUM `id`/`uuid`/FK interna no shape (`config.farm`/`config.city` também
// sem `uuid` — contrato de destino exclui por desenho, `## 4` "Excluídos de
// propósito": o consumidor já possui o `code`, ecoá-lo de volta não agrega
// nada, mirror `PublicRequestQuotationResource`/`PublicBudgetData`).
// -----------------------------------------------------------------------------

/** Bloco de área — `null` quando o registro não tem `area` vinculada
 *  (`whenLoaded`, `FD-21`). `total_area` é `float` cru, sem formatação. */
export interface PublicTraceabilityArea {
  description: string;
  total_area: number;
}

/** Cidade + UF do produtor/config — `null` quando ausente (`FD-23`). */
export interface PublicTraceabilityCityRef {
  title: string;
  state: {
    letter: string;
  };
}

/** Bloco `config` (Produtor/Configuração) — `FD-15..20,23,24`. Todos os
 *  campos são CRUS: `cpf_cnpj` sem rótulo resolvido (`CL-27`),
 *  `whatsapp_fone`/`whatsapp_texto` sem urlencode/link montado (`## 8` do
 *  contrato de tela — fix do bug `CL-09` fica no front), `logo` path
 *  relativo sem fallback resolvido (mirror `image` da raiz). */
export interface PublicTraceabilityConfig {
  name: string;
  /** Cru — front decide rótulo CPF×CNPJ pelo tamanho (`strlen==14`, `CL-27`). */
  cpf_cnpj: string;
  address: string;
  number: string;
  email: string;
  phone: string;
  /** Path RELATIVO cru — `null` se ausente; front resolve URL+fallback
   *  (mesmo mecanismo do `image` da raiz). */
  logo: string | null;
  farm: {
    description: string;
  };
  city: PublicTraceabilityCityRef | null;
  /** Cru, dígitos+formatação como armazenado — front aplica
   *  `replace(/\D/g,'')` ao montar o link (`## 8` do contrato de tela). */
  whatsapp_fone: string;
  /** Cru — front aplica `encodeURIComponent()` ao montar o link (fix do bug
   *  `CL-09`, que concatenava sem `urlencode`). */
  whatsapp_texto: string;
}

/** DTO de leitura da página pública de rastreio — `GET
 *  /api/v1/public/traceability/{code}` (`PublicTraceabilityResource`, fiel
 *  1:1 a `CONTRATO-DESTINO-F067-rastreio-publico.md ## 4`). Somente-leitura
 *  (tela não tem `<form>`/submit, `CL-26`). */
export interface PublicTraceabilityData {
  // -- Produto (`FD-01`/`FD-06`) — as 3 variantes SEMPRE presentes na chave
  // `_pt`; `_en`/`_es` `null` quando o registro não tem tradução (front
  // recai para `_pt`, mirror do default `CL-06` do legado, resolvido agora
  // no cliente). --
  name_pt: string;
  name_en: string | null;
  name_es: string | null;
  description_pt: string;
  description_en: string | null;
  description_es: string | null;

  // -- Rastreio / Lote / Embalagem (`FD-02..04`) --
  tracking_code: string;
  lot_number: string;
  packing: string;

  // -- Imagem principal (`FD-05`) --
  /** Path RELATIVO cru da 1ª imagem da galeria (`galery[0]`), `null` se a
   *  galeria estiver vazia — front aplica fallback (mirror
   *  `asset('/img/noimage.png')` do legado). */
  image: string | null;

  // -- Tabela nutricional, 16 campos / 8 pares valor+percentual
  // (`FD-07..FD-14`) — `float` cru, sem `number_format`; front formata com
  // `Intl.NumberFormat('pt-BR', {minimumFractionDigits:2,
  // maximumFractionDigits:2})` (`## 5`/`## 6` do contrato de tela, formato
  // numérico fixo independente do idioma ativo). --
  energetic_value: number;
  energetic_value_perc: number;
  carbohydrates: number;
  carbohydrates_perc: number;
  proteins: number;
  proteins_perc: number;
  fat_total: number;
  fat_total_perc: number;
  fat_saturated: number;
  fat_saturated_perc: number;
  fat_trans: number;
  fat_trans_perc: number;
  dietary_fiber: number;
  dietary_fiber_perc: number;
  sodium: number;
  sodium_perc: number;

  /** Meses ativos (1-12), cru — `LM-01`, sem tradução server-side; front
   *  traduz os rótulos via i18n e testa `includes(mes)`. */
  availability: number[];

  /** String CRUA (`## 3.2` do contrato de destino) — o backend NÃO faz
   *  `json_decode`/valida o conteúdo. Front faz parse defensivo
   *  (`try/catch`) antes de desenhar o mapa Leaflet (`## 7` do contrato de
   *  tela, corrige `CL-17`/`OQ-05`). */
  latlng: string | null;

  /** `null` quando o registro não tem `area` vinculada (`FD-21`,
   *  condicional — front omite a seção por completo se ausente). */
  area: PublicTraceabilityArea | null;

  config: PublicTraceabilityConfig;
}
