// src/@types/language/module-nature-operations/index.ts
// Interface de tradução do módulo de NATUREZA DE OPERAÇÃO (NatureOperation —
// Cadastros Base / Fiscais). Espelha a convenção do módulo de Regras Fiscais
// (module-tax-rules) e Informações Complementares (module-additional-info).
// O conteúdo mora em
// src/constants/languages/{idioma}/languageNatureOperations.ts.
//
// TASK-NO-FE-01 cobriu list + filter (listagem + exclusão bloqueada).
// TASK-NO-FE-02 adiciona a seção `form` abaixo (criação/edição — bloco fiscal
// condicional, 49 campos, autofill de Regra Fiscal, Reforma Tributária).

export interface ModuleNatureOperations {
  natureOperation: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        descricao: string;
        tipo: string;
        ativo: string;
        active: string;
        inactive: string;
      };
      tipoOptions: {
        entrada: string;
        saida: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
        descriptionEmptyWithTemplates: string;
      };
      importDefaults: {
        button: string;
        dialogTitle: string;
        dialogDescription: string;
        dialogConfirm: string;
        toastCreated: string;
        toastAllExisting: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      tipo: string;
      tipoAll: string;
      tipoOptions: {
        entrada: string;
        saida: string;
      };
      ativo: string;
      ativoAll: string;
      activeOptions: {
        active: string;
        inactive: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      sections: {
        general: string;
        fiscalClassic: string;
        taxReform: string;
      };
      fields: {
        code: string;
        descricao: string;
        tipo: string;
        cfopSaidaInterno: string;
        cfopSaidaExterno: string;
        cfopSaidaExportacao: string;
        cfopEntradaInterno: string;
        cfopEntradaExterno: string;
        cfopEntradaExportacao: string;
        ativo: string;
        sobrescreveCfopProduto: string;
        overwriteProduct: string;
        generateFinancial: string;
        automaticCalculation: string;
        taxRuleUuid: string;
        additionalInfoUuid: string;
        cstCsosn: string;
        cstPis: string;
        cstCofins: string;
        cstIpi: string;
        cenqIpi: string;
        percIcms: string;
        percPis: string;
        percCofins: string;
        percIpi: string;
        cest: string;
        percentReduction: string;
        motDesIcms: string;
        motDesIcmsHint: string;
        percDif: string;
        percDifHint: string;
        percFcp: string;
        percFcpHint: string;
        modalityBc: string;
        origem: string;
        cstCsosnExp: string;
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
      tipoOptions: { entrada: string; saida: string };
      booleanOptions: { yes: string; no: string };
      hints: { codeGenerated: string };
      validation: {
        requiredField: string;
        descricaoMaxLength: string;
        cfopFormat: string;
        maxLength6: string;
        maxLength10: string;
        percentageRange: string;
        percentageRange4: string;
        percentageRange100: string;
        nonNegative: string;
      };
    };
  };
}
