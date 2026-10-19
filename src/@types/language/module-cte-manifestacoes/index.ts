// src/@types/language/module-cte-manifestacoes/index.ts
// Interface de tradução do módulo de Manifestação de CT-e (CteManifestacao —
// domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13). Top-level
// (mirror `ModuleCtes`/`ModuleDfes`), NÃO aninhado sob `ctes` nem `fiscal` —
// rota própria `/fiscal/cte-manifestacoes`, distinta de `/fiscal/ctes`.

export interface ModuleCteManifestacoes {
  cteManifestacao: {
    singularLabel: string;
    pluralLabel: string;

    // ============================================
    // Listagem — /fiscal/cte-manifestacoes (TASK-CTE-FE-12/13)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      helpLink: string;
      consultarButton: string;
      table: {
        nome: string;
        documento: string;
        valor: string;
        dataEmissao: string;
        tipo: string;
        prazo: string;
      };
      prazo: {
        manifestado: string;
        diasRestantes: string; // template — receber {{days}} via interpolação manual
        encerrado: string;
      };
      actionsMenu: {
        manifestarDesacordo: string;
        gerarDanfe: string;
        baixarXml: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      error: {
        message: string;
        retry: string;
      };
      danfeError: string;
      xmlError: string;
    };

    // ============================================
    // Filtro do index — FilterSideCteManifestacao (TASK-CTE-FE-12)
    // ============================================
    filter: {
      title: string;
      issuer: string;
      issuerPlaceholder: string;
      search: string;
      searchPlaceholder: string;
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
      /** `DV13` — nota visual: os campos de data acima NÃO filtram de fato. */
      dateFilterNotSupportedNotice: string;
    };

    // ============================================
    // tipo (mirror App\Enums\CteManifestaTipo) — LK22/LS14
    // ============================================
    tipoOptions: {
      pendente: string;
      desacordo: string;
    };

    // ============================================
    // Dialog "Consultar novos documentos" (TASK-CTE-FE-12, E17)
    // ============================================
    consultarDialog: {
      title: string;
      description: string;
      issuer: string;
      issuerPlaceholder: string;
      issuerRequired: string;
      submitButton: string;
      cancelButton: string;
      errorMessage: string;
    };

    // ============================================
    // Dialog "Manifestar desacordo" (TASK-CTE-FE-13, E18)
    // ============================================
    manifestarDialog: {
      title: string;
      description: string;
      justificativa: string;
      justificativaPlaceholder: string;
      submitButton: string;
      cancelButton: string;
      successMessage: string;
      errorMessage: string;
      validation: {
        justificativaRequired: string;
        justificativaMin: string;
      };
    };
  };
}
