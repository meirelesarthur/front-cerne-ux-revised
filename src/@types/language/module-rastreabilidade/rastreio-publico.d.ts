// src/@types/language/module-rastreabilidade/rastreio-publico.d.ts
// -----------------------------------------------------------------------------
// Interface de tradução da página PÚBLICA de rastreio (consumidor final, sem
// login — F-067, `97-Esteiras/058`, TASK-TR-PUB-FE-01, fundação). Sibling de
// `traceability`/`traceabilityConfig` em `ModuleRastreabilidade`, mirror da
// convenção "um arquivo `.d.ts` por tela" (`get_pwa_i18n_pattern ## 3`).
//
// Cobre as 13 seções do contrato de tela
// (`CONTRATO-TELA-F067-rastreio-publico.md ## 4`) — nenhum dado vindo da API
// (nome/descrição/valores nutricionais/etc.) é traduzido aqui, só os RÓTULOS
// estáticos que no legado eram hardcoded/sem tradução (`CL-08` — "LOTE" — e
// os títulos de seção que não existiam no Blade original).
// -----------------------------------------------------------------------------

export interface RastreioPublicoLanguage {
  /** `## 4.1` — skeleton/`not-found`/`error` (substitui o `echo` cru do
   *  legado, `CL-04`/`OQ-03`). */
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

  /** `## 4.5` — rótulo "LOTE" TRADUZIDO (corrige `CL-08`, hardcoded PT no
   *  legado mesmo com `lang=en/es`) + rótulos auxiliares de identificação. */
  product: {
    lotLabel: string;
    trackingCodeLabel: string;
    packingLabel: string;
    imageAlt: string;
  };

  /** `## 4.6` — tabela nutricional, 8 rótulos de linha (valor+`%` mesma
   *  linha) — rótulos estáticos, NÃO vêm da API (`CL-07`). `valueColumnLabel`/
   *  `percentageColumnLabel` (aditivo TASK-TR-PUB-FE-03, cabeçalho das 2
   *  colunas numéricas — não existiam no legado, que não tinha cabeçalho de
   *  tabela HTML de verdade) mantêm o mesmo requisito de zero string
   *  hardcoded do resto da tela. */
  nutritionalTable: {
    title: string;
    energeticValue: string;
    carbohydrates: string;
    proteins: string;
    fatTotal: string;
    fatSaturated: string;
    fatTrans: string;
    dietaryFiber: string;
    sodium: string;
    valueColumnLabel: string;
    percentageColumnLabel: string;
  };

  /** `## 4.7` — grade de 12 meses (JAN..DEZ traduzidos), ordem fixa
   *  jan→dez, mirror `traceability.form.availabilityMonths` (mesmos meses,
   *  dicionário isolado — página pública não depende do módulo admin). */
  availability: {
    title: string;
    months: {
      january: string;
      february: string;
      march: string;
      april: string;
      may: string;
      june: string;
      july: string;
      august: string;
      september: string;
      october: string;
      november: string;
      december: string;
    };
  };

  /** `## 4.8` — bloco condicional de área (`FD-21`), omitido por completo
   *  quando `area` for `null`. */
  area: {
    title: string;
    hectaresLabel: string;
  };

  /** `## 4.9`/`## 7` — mapa Leaflet read-only + exibição textual acessível
   *  da coordenada (`toFixed(6)`, `## 5`); `unavailable` cobre `latlng`
   *  ausente/malformado (parse defensivo, corrige `CL-17`/`OQ-05`). */
  map: {
    title: string;
    coordinatesLabel: string;
    unavailable: string;
  };

  /** `## 4.10` — Produtor/Configuração (`FD-15..20,23,24`); `cpfLabel`/
   *  `cnpjLabel` separados — o front escolhe pelo tamanho de
   *  `config.cpf_cnpj` (`CL-27`), o rótulo em si é traduzido. `nameLabel`/
   *  `logoAlt` (aditivo TASK-TR-PUB-FE-03, mirror `product.imageAlt`) cobrem
   *  o rótulo do campo `config.name` (distinto de `title`, o título da
   *  seção) e o texto alternativo a11y do logo de `config.logo`. */
  producer: {
    title: string;
    nameLabel: string;
    cpfLabel: string;
    cnpjLabel: string;
    addressLabel: string;
    emailLabel: string;
    phoneLabel: string;
    farmLabel: string;
    cityLabel: string;
    logoAlt: string;
  };

  /** `## 4.11`/`## 8` — botão flutuante, fix do bug `CL-09`
   *  (`encodeURIComponent` no texto, montagem do link fica no front). */
  whatsapp: {
    buttonLabel: string;
  };

  /** `## 4.12` — rodapé, ano dinâmico (`{year}` interpolado pelo front). */
  footer: {
    rightsTemplate: string;
  };

  /** `## 4.13`/`## 6` — seletor local de idioma (pt-BR/en/es), sem
   *  persistência de perfil (`updateLanguageGB` direto, isolamento). */
  languageSwitcher: {
    groupLabel: string;
    pt: string;
    en: string;
    es: string;
  };
}
