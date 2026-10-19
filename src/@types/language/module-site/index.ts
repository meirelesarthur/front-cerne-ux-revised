// src/@types/language/module-site/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Site" (configuração única do site/fazenda
// — Site.edit/Site.update, 97-Esteiras/061, TASK-SITE-04). Namespace
// TOP-LEVEL `site` — módulo PRÓPRIO, NÃO aninhado em `configuracoes`
// (mirror `chargeBillExpenses`/`markers`, decisão de tela G-FE-02 do
// contrato `03-ARQUITETURA-frontend-site.md`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageSite.ts`.
//
// Tela SINGLETON (upsert 1 registro Site por fazenda, SEM listagem) — mirror
// estrutural de `config`/`tenantParameters` (settings-form de registro
// único), NÃO o mirror de `chargeBillExpenses` (que tem list/detail/form de
// CRUD paginado). 8 campos na ordem exata do contrato de tela §3: banner,
// published, [link "Ver Site" condicional], instagram, facebook, twitter,
// youtube, whatsapp, about.
//
// DESVIO DELIBERADO da convenção `namespace-plural.entidade-singular`
// (`markers.marker`/`parameters.parameter`/`chargeBillExpenses.
// chargeBillExpense`): "Site" não tem um nome de container plural distinto
// do nome da própria entidade (diferente de `configuracoes`→`config`,
// palavras diferentes). Autoreferenciar (`site.site.*`) seria só ruído —
// `index.d.ts` consome `ModuleSite['site']` (achatado 1 nível) para o campo
// raiz `site: {...}` do `LanguageDate`, e os 3 `languageSite.ts` exportam
// diretamente esse shape interno (mirror do já-achatado `text =
// languageGB.configuracoes.config` em `Config/index.tsx`/`TenantParameters`).
//
// TASK-SITE-09 (97-Esteiras/061, fundação da página PÚBLICA) acrescenta
// `site.publico` — sibling do form admin dentro do MESMO namespace achatado
// `site` (não um módulo novo), tipos em `./site-publico.d.ts`, mirror da
// convenção `rastreioPublico` de `module-rastreabilidade/index.ts` (F-067).
// -----------------------------------------------------------------------------

import type { SitePublicoLanguage } from './site-publico';

export interface ModuleSite {
  site: {
    singularLabel: string;
    pluralLabel: string;
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      banner: string;
      published: string;
      instagram: string;
      facebook: string;
      twitter: string;
      youtube: string;
      whatsapp: string;
      about: string;
    };
    placeholders: {
      instagram: string;
      facebook: string;
      twitter: string;
      youtube: string;
      whatsapp: string;
      about: string;
    };
    /** Textos da dropzone `ImageUpload` (campo `banner`, SEM `onRemove` —
     *  SEM-001 do contrato legado, sem operação de remoção isolada). */
    image: {
      hint: string;
      dropzoneTitle: string;
      dropzoneDragging: string;
      changeLabel: string;
      errorType: string;
      errorSize: string;
    };
    /** Link condicional "Ver Site" (SUR-005/G-FE-01) — só renderiza quando
     *  `published && slug`. */
    viewSiteLink: string;
    saveSuccessToast: string;
    readOnlyNotice: string;
    /** Guard de "sem fazenda ativa" (mirror `TenantParameters`, D1/CL-017 —
     *  Site é farm-scoped via `X-Farm-Id`). */
    noFarmSelected: {
      title: string;
      description: string;
    };
    /** Página PÚBLICA `/site/:slug` (TASK-SITE-09+, `05-CONTRATO-TELA-
     *  pagina-publica-site.md ## 6`) — ver nota de cabeçalho de
     *  `./site-publico.d.ts` para o desenho `menu`×`content`. */
    publico: SitePublicoLanguage;
  };
}
