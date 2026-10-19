// src/@types/language/module-integration-dominios/index.ts
// Interface de tradução do módulo "Software Domínio" (IntegrationDominio —
// Integrações, F-121, 97-Esteiras/072, TASK-F121-FE-01). Mirror estrutural de
// `module-sharings` (instância simples: um único arquivo, sem decomposição
// por tela). Chave raiz `integrationDominios`. O conteúdo mora em
// src/constants/languages/{idioma}/languageIntegrationDominios.ts.
//
// CRUD-pai da área Integrações (3 telas: Lista/Cadastro/Detalhe) + fluxo
// exclusivo "Testar Conexão" que destrava o Salvar (contrato de tela §2.2).

export interface ModuleIntegrationDominios {
  integrationDominios: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        issuer: string;
        accountant: string;
        enabled: string;
        actions: string;
      };
      actions: {
        new: string;
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        title: string;
        description: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        confirm: string;
        cancel: string;
        deletedToast: string;
      };
    };
    form: {
      createTitle: string;
      editTitle: string;
      save: string;
      cancel: string;
      fields: {
        issuer: string;
        accountant: string;
        token: string;
        enabled: string;
      };
      enabled: {
        sim: string;
        nao: string;
      };
      testConnection: {
        button: string;
        okToast: string;
        block: {
          accountant: string;
          client: string;
        };
        validation: {
          issuerRequired: string;
          accountantRequired: string;
          tokenRequired: string;
        };
      };
      validation: {
        issuerRequired: string;
        accountantRequired: string;
        tokenRequired: string;
        enabledRequired: string;
      };
    };
    detail: {
      title: string;
      fields: {
        issuer: string;
        accountant: string;
        token: string;
        enabled: string;
      };
    };
  };
}
