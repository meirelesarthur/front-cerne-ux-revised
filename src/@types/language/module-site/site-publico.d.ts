// src/@types/language/module-site/site-publico.d.ts
// -----------------------------------------------------------------------------
// Interface de tradução da página PÚBLICA do Site (visitante final, sem login
// — 97-Esteiras/061, TASK-SITE-09, fundação). Sibling de `site` (form admin)
// em `ModuleSite`, mirror da convenção "um arquivo `.d.ts` por tela"
// (`get_pwa_i18n_pattern ## 3`) e do precedente real
// `module-rastreabilidade/rastreio-publico.d.ts` (F-067).
//
// Duas fontes de texto DELIBERADAMENTE SEPARADAS (`05-CONTRATO-TELA-pagina-
// publica-site.md ## 6`, rationale completo na "Leitura do dev" item 2):
//   - `menu.*`    — os 5 rótulos do menu + rótulos do seletor, GENUINAMENTE
//                   3-idiomas. Consumidos por ESTADO LOCAL (`useState<'BR'|
//                   'US'|'ES'>`), lendo os 3 módulos de idioma diretamente —
//                   NUNCA `useLanguage()`/`updateLanguageGB()` (isolamento do
//                   `localStorage` GLOBAL compartilhado com a sessão admin no
//                   mesmo domínio, ajuste #4 do dono).
//   - `content.*` — títulos de seção/rótulos de apresentação, populados nos
//                   3 idiomas por PARIDADE ESTRUTURAL obrigatória do
//                   `LanguageDate` (mesma convenção testada por grep pelo
//                   Tester em `TASK-SITE-06`) — mas a PÁGINA consome SOMENTE
//                   a fatia `BR` (import direto de `languagePtBr/
//                   languageSite.ts`, nunca comutada pelo seletor de menu).
//                   Decisão explícita do dono: "NÃO recarrega nem re-traduz
//                   o conteúdo".
//
// Dado vindo da API (`about`, `farm.description`, nome/descrição de produto)
// NUNCA passa por este dicionário — mesma regra de F-067 (a API do Site não
// devolve variantes `_pt/_en/_es`, só PT-BR cru).
// -----------------------------------------------------------------------------

export interface SitePublicoLanguage {
  /** 5 itens do menu (ajuste #5 do dono — SOMENTE estes, sem `Site`/`Teste
   *  grátis`/`Cursos` do legado) + seletor de idioma local. Itens são
   *  placeholders INERTES por ora (ajuste #3 — links a definir, sem
   *  `href`/`onClick`, `aria-disabled="true"`), mas os RÓTULOS já são
   *  genuinamente traduzidos. */
  menu: {
    sobre: string;
    softwares: string;
    tutoriais: string;
    sejaParceiro: string;
    contato: string;
    languageSwitcher: {
      groupLabel: string;
      pt: string;
      en: string;
      es: string;
    };
  };

  /** Títulos de seção/rótulos estáticos — só a fatia `BR` é consumida pela
   *  página (ver nota de cabeçalho). Cobre as 7 seções do contrato de tela
   *  (`## 1`): header/menu ficam em `menu.*` acima; banner não tem rótulo
   *  próprio (`<Image>` puro); as demais 5 (Quem Somos/Nossos Produtos/
   *  Mapa+Contato/Footer/WhatsApp) + os 4 estados de UI ficam aqui. */
  content: {
    /** `get_spa_ux_fidelity_pattern` — loading/not-found/error da casca da
     *  página (`slug` inexistente OU `published=false`, MESMA mensagem —
     *  não vazar qual dos dois, `## 5` do contrato de tela). */
    states: {
      loading: string;
      notFound: {
        title: string;
        description: string;
      };
      error: {
        title: string;
        description: string;
        retry: string;
      };
    };

    /** Quem Somos (`## 1` linha 3, `AboutSection`). */
    about: {
      sectionTitle: string;
    };

    /** Nossos Produtos (`## 1` linha 4, `ProductsSection`). */
    products: {
      sectionTitle: string;
      viewProductButton: string;
      emptyState: {
        title: string;
        description: string;
      };
    };

    /** Mapa + Contato (`## 1` linha 5, `ContactSection`) — `cpfLabel`/
     *  `cnpjLabel` separados, o front escolhe pelo tamanho de `farm.nif`
     *  (mirror `CL-27` de F-067). */
    contact: {
      sectionTitle: string;
      cpfLabel: string;
      cnpjLabel: string;
      emailLabel: string;
      phoneLabel: string;
      coordinatesLabel: string;
      cityLabel: string;
    };

    /** `SitePublicoMap` — estado `unavailable` quando `coordinates`
     *  ausente/malformado (mirror `RastreioMap`, nunca lança exceção). */
    map: {
      unavailable: string;
    };

    /** Botão flutuante do WhatsApp — condicional a `site.whatsapp`
     *  (SEM-002: sem texto pré-setado no link, ver `PublicSiteInfo.
     *  whatsapp`). */
    whatsapp: {
      buttonLabel: string;
    };

    /** Footer — copyright GB Cerne (ajuste #2, nunca "© AGRO365"), ano
     *  dinâmico interpolado pelo front (`{year}`). */
    footer: {
      rightsTemplate: string;
    };
  };
}
