// src/@types/language/module-tax-rules/index.ts
// Interface de tradução do módulo de REGRAS FISCAIS (TaxRule — Cadastros Base
// / Fiscal). Espelha a convenção do módulo de Vacinas (module-vaccines). O
// conteúdo mora em src/constants/languages/{idioma}/languageTaxRules.ts.
//
// `form` é o maior bloco de idioma do projeto (33 campos de negócio + 4
// seções visuais) — preenchido em 2 rodadas (TASK-FE-112 Fiscal Clássico,
// TASK-FE-113 Reforma Tributária/ZFM/Doação), mesmo arquivo de idioma.

export interface ModuleTaxRules {
  taxRule: {
    pluralLabel: string;
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      columns: { name: string; status: string; actions: string };
      statusActive: string;
      statusInactive: string;
      actions: { edit: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deleteConfirm: { title: string; description: string; warning: string };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      apply: string;
      clear: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      sections: {
        identification: string;
        fiscalClassic: string;
        taxReform: string;
        zfmDonation: string;
      };
      fields: {
        name: string;
        isEnabled: string;
        cfopSaidaInterno: string;
        cfopSaidaExterno: string;
        cstCsosn: string;
        cstCsosnExp: string;
        cstPis: string;
        cstCofins: string;
        cstIpi: string;
        percIcms: string;
        percPis: string;
        percCofins: string;
        percIpi: string;
        origem: string;
        cest: string;
        modalityBc: string;
        percentReduction: string;
        motDesIcms: string;
        motDesIcmsHint: string;
        percDif: string;
        percDifHint: string;
        percFcp: string;
        percFcpHint: string;
        cenqIpi: string;
        cbenef: string;
        // -- Reforma Tributária / ZFM / Doação (TASK-FE-113) --
        cClassTrib: string;
        cstIbsCbs: string;
        percIbsUf: string;
        percIbsMun: string;
        percReducaoAliqIbsUf: string;
        percReducaoAliqIbsMun: string;
        percDifIbsUf: string;
        percDifIbsMun: string;
        percCbs: string;
        percReducaoAliqCbs: string;
        percDifCbs: string;
        cstIs: string;
        percIs: string;
        percIsEspec: string;
        adRemIbs: string;
        adRemCbs: string;
        tpCredPresIbsZfm: string;
        indDoacao: string;
      };
      isEnabledOptions: { active: string; inactive: string };
      booleanOptions: { yes: string; no: string };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        requiredField: string;
        maxLength4: string;
        maxLength10: string;
        maxLength255: string;
        percentageRange: string;
        percentageRange100: string;
        nonNegative: string;
      };
    };
  };
}
