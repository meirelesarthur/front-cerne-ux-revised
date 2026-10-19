// src/@types/v2/Site/publico/index.d.ts
// -----------------------------------------------------------------------------
// DTO da página PÚBLICA do Site (visitante final, sem login — 97-Esteiras/061,
// TASK-SITE-09, fundação). Superfície DISTINTA do CRUD admin de Site
// (`@/@types/v2/Site`), mirror `@/@types/v2/Rastreabilidade/rastreio-publico`
// (`PublicTraceabilityData`) — sibling isolado, NUNCA reaproveita `SiteData`
// (que carrega `slug`/`banner_url` no nível raiz, formato distinto).
//
// Fonte de verdade: `PublicSiteResource`/`PublicSiteProductResource` REAIS
// (`GB.Cerne.Api`, lidos integralmente — `061/CONTRATOS/05-ARQUITETURA-
// endpoint-publico-site.md ## 3`, endpoint ENTREGUE). O shape REAL diverge do
// provisório em `05-CONTRATO-TELA-pagina-publica-site.md ## 2` em 2 pontos —
// gate GATE-PUB-API do roteiro determina que o real vale, ajustado aqui:
//   1. Envelope com 3 blocos no NÍVEL RAIZ (`site`/`farm`/`products`), não os
//      campos de `site` achatados direto na raiz do DTO.
//   2. `farm.city` é OBJETO `{ title, state: { letter } | null } | null`
//      (mirror `PublicTraceabilityCityRef`), não `string` cru.
//
// ⚠️ DADO 100% CRU — sem formatação/URL pré-montada de apresentação além do
// que o backend já resolve (`banner_url`/`logo_url`/`image_url` via
// `Storage::disk('public')->url()`, contrato §3). `about`/`description` são
// HTML/texto cru — `about` SEMPRE via `RichTextContent` (nunca
// `dangerouslySetInnerHTML` direto), `description` truncada NO FRONT
// (`## 12` do roteiro — o backend devolve completo, sem `substr()`).
// `farm.coordinates` é STRING crua (`{lat,lng}` JSON ou `null`) — parse
// defensivo obrigatório no consumidor (mirror `latlng` de
// `PublicTraceabilityData`, `RastreioMap::parseLatLng`).
//
// NENHUM `id`/`uuid`/FK interna no shape (`site.farm_id`, `farm.id`,
// `farm.uuid`, `farm.tenant_id`, `farm.city_id`, `traceability.id` etc. —
// todos excluídos de propósito pelo Resource real, contrato §3
// "Excluídos de propósito").
// -----------------------------------------------------------------------------

/** Cidade + UF da fazenda — `null` quando `farm.town` ausente; `state`
 *  independentemente `null` quando a cidade não tem UF vinculada (mirror
 *  `PublicSiteResource::publicCity()`). */
export interface PublicSiteCityRef {
  title: string;
  state: {
    letter: string;
  } | null;
}

/** Bloco `farm` — dados públicos da fazenda dona do site. `email` incluído
 *  de propósito (divergência deliberada de `FarmDetailResource`, consumidor
 *  admin distinto — contrato §1 EV-P05). */
export interface PublicSiteFarm {
  description: string;
  logo_url: string | null;
  /** Cru — front decide rótulo CPF×CNPJ pelo tamanho (mirror `CL-27` de
   *  F-067, `strlen === 14` → CNPJ). `null` observado em produção (97-
   *  Esteiras/061, fix de runtime) — linha de CPF/CNPJ é OMITIDA quando
   *  ausente (mirror `strlen(null) === 0` do legado, nunca `.length` em
   *  `null`). */
  nif: string | null;
  email: string | null;
  phone: string | null;
  /** Exibição textual direta (mirror do legado, sem formatação adicional). */
  latitude: string | null;
  longitude: string | null;
  /** JSON cru `{lat,lng}` ou `null` — mesmo contrato de `latlng` em
   *  `PublicTraceabilityData`; parse defensivo obrigatório (mirror
   *  `RastreioMap::parseLatLng`). SEM decode/cast no backend. */
  coordinates: string | null;
  city: PublicSiteCityRef | null;
}

/** Bloco `site` — configuração pública do site em si (não a fazenda). */
export interface PublicSiteInfo {
  slug: string;
  banner_url: string | null;
  /** HTML rich-text cru — SEMPRE via `RichTextContent` (`sanitizeHtml`/
   *  DOMPurify), nunca `dangerouslySetInnerHTML` direto. */
  about: string;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  /** Só telefone — SEM-002 (`061/CONTRATOS/05-CONTRATO-TELA-pagina-publica-
   *  site.md ## Riscos`): sem campo de texto pré-setado para o WhatsApp,
   *  diferente de `whatsapp_texto` de `PublicTraceabilityConfig`. Montagem
   *  do link (`https://api.whatsapp.com/send?phone=55{digits}`, SEM
   *  `text=`) é responsabilidade do front. */
  whatsapp: string | null;
  /** SEMPRE `true` na resposta — o backend só serve quando
   *  `site.published === true` (404 genérico indiferenciado caso contrário,
   *  mirror contrato §2 "regra NOVA"). Mantido no shape por fidelidade 1:1
   *  ao Resource real; não há caso de UI que precise checar `false` aqui. */
  published: boolean;
}

/** Item do grid "Nossos Produtos" — mirror `PublicSiteProductResource`. */
export interface PublicSiteProduct {
  /** Chave de roteamento para `/rastreio?code={hash}` (rota SPA já
   *  existente, F-067). */
  hash: string;
  /** = `name_pt`, cru — conteúdo NÃO é re-traduzido por locale (decisão do
   *  dono, ajuste #4). */
  name: string;
  /** = `description_pt`, COMPLETA — truncagem (200 chars, mirror legado
   *  corrigido) é responsabilidade do front, nunca do backend. `null`
   *  observado em produção (97-Esteiras/061, fix de runtime) — front trata
   *  como vazio antes de truncar. */
  description: string | null;
  /** 1ª foto da galeria por `id` crescente, `null` se galeria vazia — front
   *  decide o placeholder (`ImageWithFallback`, reuso de F-067). */
  image_url: string | null;
}

/** DTO de leitura da página pública do Site — `GET /api/v1/public/site/
 *  {slug}` (`PublicSiteResource`, fiel 1:1 ao endpoint real). Somente-leitura
 *  (tela não tem `<form>`/submit). */
export interface PublicSiteData {
  site: PublicSiteInfo;
  farm: PublicSiteFarm;
  products: PublicSiteProduct[];
}
