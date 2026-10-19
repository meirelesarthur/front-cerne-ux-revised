// src/@types/language/module-contadores/index.ts
// Interface de tradução do módulo CONTADOR (Escritório de Contabilidade —
// Cadastros Base, domínio Fiscal/Contábil). Espelha a convenção dos demais
// módulos (module-plan-accounts, module-addressing). O conteúdo mora em
// src/constants/languages/{idioma}/languageContadores.ts.
//
// TASK-CT-03a cobre `list`/`filter`/`deleteBlocked`. TASK-CT-03b adiciona a
// seção `form` (formulário create/edit), sem alterar o que já existia.

export interface ModuleContadores {
  contador: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string;
        city: string;
        fone: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        /** Variação sem CTA para quem não pode criar Contador (não tem `ctdr_create`). */
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    /** Diálogo de exclusão bloqueada (422 `errors.in_use[]`, molde de
     *  `ModuleAddressing.deleteBlocked`, migrado para o `InUseBlockedDialog`
     *  genérico — TASK-CT-03c). */
    deleteBlocked: {
      title: string;
      description: string;
      /** Template `"{resource} ({count})"` — `.replace()`, sem lib de
       *  interpolação (mesmo padrão do projeto). O backend já devolve
       *  `resource` como frase PT-BR completa (ex.: "Emissor(es) Fiscal(is)
       *  vinculado(s)"), exibida literalmente. */
      resourceLabel: string;
      /** Dicionário `table -> rótulo traduzido`, consumido por
       *  `contadorInUseTableLabels.getLabel` (`table` físico estável:
       *  `contador_issue`/`cash_books`/`integration_dominios` — ver
       *  `ContadorRepository::hasDependents()`). */
      tableLabels: {
        contador_issue: string;
        cash_books: string;
        integration_dominios: string;
      };
    };
    /** Formulário de criação/edição (TASK-CT-03b) — 12 campos + endereço +
     *  cidade (SelectAsyncPaginate) + Emissores Fiscais (CheckboxListField,
     *  min. 1) + envio automático (Switch). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        razaoSocial: string;
        nomeFantasia: string;
        cnpj: string;
        ie: string;
        rua: string;
        numero: string;
        bairro: string;
        cep: string;
        fone: string;
        email: string;
        cidadeUuid: string;
        issueUuids: string;
        autoSend: string;
      };
      placeholders: {
        razaoSocial: string;
        nomeFantasia: string;
        ie: string;
        rua: string;
        numero: string;
        bairro: string;
        email: string;
        cidadeUuid: string;
      };
      issuesField: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      /** Toasts graciosos do autofill de CEP (ViaCEP + resolução de Cidade
       *  por IBGE, TASK-CT-FIX-03) — nenhum bloqueia o formulário. */
      cepAutofill: {
        notFound: { title: string; description: string };
        cityNotResolved: { title: string; description: string };
        networkError: { title: string; description: string };
      };
      validation: {
        razaoSocialRequired: string;
        razaoSocialMaxLength: string;
        nomeFantasiaRequired: string;
        nomeFantasiaMaxLength: string;
        cnpjRequired: string;
        ieRequired: string;
        invalidFields: string;
        ieMaxLength: string;
        ruaRequired: string;
        numeroRequired: string;
        bairroRequired: string;
        cepRequired: string;
        foneRequired: string;
        emailRequired: string;
        emailInvalid: string;
        cidadeRequired: string;
        issuesRequired: string;
      };
    };
  };
}
