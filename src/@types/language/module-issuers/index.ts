// src/@types/language/module-issuers/index.ts
// Interface de tradução do módulo de EMISSORES NFe (Issuer — Cadastros Base /
// Fiscal). Espelha a convenção de module-payment-terms/module-family-equipments,
// estendida com as seções específicas deste módulo: bloco fiscal condicional
// (§5.1/§6.2 do contrato de tela) e o fluxo dedicado de certificado digital
// (§3.4/§6.3). O conteúdo mora em
// src/constants/languages/{idioma}/languageIssuers.ts.

export interface ModuleIssuers {
  issuer: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        razaoSocial: string;
        cpfCnpj: string;
        cidade: string;
        ambiente: string;
        issuesNfe: string;
        certificado: string;
        status: string;
        active: string;
        inactive: string;
        certificadoConfigured: string;
        certificadoNotConfigured: string;
      };
      actions: { edit: string; certificate: string; delete: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: { active: string; inactive: string };
      issuesNfe: string;
      issuesNfeAll: string;
      issuesNfeOptions: { yes: string; no: string };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      sections: {
        generalInfo: string;
        address: string;
        fiscalConfig: string;
        farms: string;
        stateRegistrations: string;
        nfeSeries: string;
      };
      fields: {
        razaoSocial: string;
        nomeFantasia: string;
        cpfCnpj: string;
        ie: string;
        email: string;
        isEnabled: string;
        telefone: string;
        cep: string;
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        issuesNfe: string;
        ultimoNumeroCte: string;
        numeroSerieCte: string;
        ultimoNumeroMdfe: string;
        numeroSerieMdfe: string;
        ambiente: string;
        regime: string;
        autXml: string;
        cnae: string;
        spedProfile: string;
      };
      placeholders: {
        razaoSocial: string;
        nomeFantasia: string;
        cep: string;
        cpfCnpjCpf: string;
        cpfCnpjCnpj: string;
      };
      isEnabledOptions: { active: string; inactive: string };
      issuesNfeOptions: { yes: string; no: string };
      ambienteOptions: { producao: string; homologacao: string };
      regimeOptions: { simplesNacional: string; normal: string };
      cidade: {
        placeholder: string;
        noOptionsMessage: string;
      };
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      farms: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      stateRegistrations: {
        addItem: string;
        removeItem: string;
        placeholder: string;
        empty: string;
      };
      spedProfilePlaceholder: string;
      spedProfileOptions: { A: string; B: string; C: string };
      nfeSeries: {
        serie: string;
        ultimo: string;
        padrao: string;
        inUse: string;
        remove: string;
        removeBlocked: string;
        add: string;
        empty: string;
        defaultHint: string;
      };
      ambienteLockedHelp: string;
      ambienteConfirm: {
        title: string;
        description: string;
        confirmButtonText: string;
      };
      validation: {
        razaoSocialRequired: string;
        nomeFantasiaRequired: string;
        cpfCnpjRequired: string;
        cpfCnpjInvalid: string;
        emailRequired: string;
        emailInvalid: string;
        ruaRequired: string;
        numeroRequired: string;
        bairroRequired: string;
        telefoneRequired: string;
        cepRequired: string;
        cepMax: string;
        cidadeRequired: string;
        numbersRequired: string;
        numbersMax: string;
        regimeRequired: string;
        ambienteRequired: string;
        autXmlRequired: string;
        cnaeMax: string;
        spedInvalid: string;
        seriesRequired: string;
        seriesDefaultRequired: string;
        serieRequired: string;
        serieRange: string;
        serieDuplicated: string;
        ultimoNumeroRequired: string;
        ultimoNumeroBelowUsed: string;
        emailFieldRequired: string;
      };
    };
    certificate: {
      title: string;
      subtitle: string;
      backToList: string;
      statusCard: {
        title: string;
        notConfigured: string;
        serial: string;
        validFrom: string;
        validTo: string;
        daysRemaining: string;
        badgeExpired: string;
        badgeExpiringSoon: string;
        badgeValid: string;
      };
      upload: {
        title: string;
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        submitLabel: string;
        errorType: string;
        errorSize: string;
        passwordRequired: string;
        fileRequired: string;
      };
      remove: {
        button: string;
        confirmTitle: string;
        confirmDescription: string;
        confirmButton: string;
      };
      successUpload: string;
      successRemove: string;
    };
  };
}
