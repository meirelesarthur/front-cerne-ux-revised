// src/constants/languages/languagePtBr/languageIntegrationDominios.ts
// Tradução PT-BR do módulo "Software Domínio" (IntegrationDominio —
// Integrações, F-121, 97-Esteiras/072). Rótulos pt-BR fiéis ao legado
// (`_forms.blade.php`/`index.blade.php`/`show.blade.php`, roteiro API
// `ROTEIRO-F-121-software-dominio`). "Domínio" é nome próprio do sistema
// contábil integrado — mantido INTOCADO nos 3 idiomas (mirror
// `languageIntegrations.ts`, ex.: "Exportação NFS-e (Domínio)").

import { ModuleIntegrationDominios } from '@/@types/language/module-integration-dominios';

export const languageIntegrationDominios: ModuleIntegrationDominios['integrationDominios'] = {
  singularLabel: 'Integração Domínio',
  pluralLabel: 'Integrações Domínio',
  list: {
    pageTitle: 'Software Domínio',
    pageSubtitle: 'Gerencie as integrações com o sistema contábil Domínio.',
    table: {
      issuer: 'Emissor',
      accountant: 'Contador',
      enabled: 'Ativo',
      actions: 'Ações',
    },
    actions: {
      new: 'Nova Integração',
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Excluir',
    },
    emptyState: {
      title: 'Nenhuma integração cadastrada.',
      description: 'Comece cadastrando uma nova integração com o Domínio.',
      cta: 'Nova Integração',
    },
    error: {
      message: 'Não foi possível carregar as integrações.',
      retry: 'Tentar novamente',
    },
    deleteDialog: {
      title: 'Excluir integração?',
      description: 'Você tem certeza? Essa ação não poderá ser recuperada.',
      confirm: 'Excluir',
      cancel: 'Cancelar',
      deletedToast: 'Integração excluída com sucesso.',
    },
  },
  form: {
    createTitle: 'Nova Integração Domínio',
    editTitle: 'Editar Integração Domínio',
    save: 'Salvar',
    cancel: 'Cancelar',
    fields: {
      issuer: 'Emissor',
      accountant: 'Contador',
      token: 'Token de Integração',
      enabled: 'Ativo',
    },
    enabled: {
      sim: 'Sim',
      nao: 'Não',
    },
    testConnection: {
      button: 'Testar Conexão',
      okToast: 'Conexão validada com sucesso.',
      block: {
        accountant: 'Contador',
        client: 'Cliente',
      },
      validation: {
        issuerRequired: 'Selecione o Emissor antes de testar a conexão.',
        accountantRequired: 'Selecione o Contador antes de testar a conexão.',
        tokenRequired: 'Informe o Token de Integração antes de testar a conexão.',
      },
    },
    validation: {
      issuerRequired: 'Selecione o Emissor',
      accountantRequired: 'Selecione o Contador',
      tokenRequired: 'Informe o Token de Integração',
      enabledRequired: 'Selecione se está Ativo',
    },
  },
  detail: {
    title: 'Detalhes da Integração',
    fields: {
      issuer: 'Emissor',
      accountant: 'Contador',
      token: 'Token de Integração',
      enabled: 'Ativo',
    },
  },
};
