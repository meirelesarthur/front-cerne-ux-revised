// src/constants/languages/languagePtBr/languageExamples.ts
// Tradução PT-BR do módulo de EXEMPLOS (referência de padrão CRUD).

import { ModuleExamples } from "@/@types/language/module-examples";

export const languageExamples: ModuleExamples = {
  resource: {
    singularLabel: "Recurso",
    list: {
      pageTitle: "Recursos (Exemplo)",
      pageSubtitle:
        "Módulo de referência do padrão CRUD. Não faz parte dos módulos do GB Cerne.",
      deletedToast: "Recurso removido com sucesso",
      table: {
        id: "ID",
        name: "Nome",
        code: "Código",
        description: "Descrição",
        status: "Status",
        active: "Ativo",
        inactive: "Inativo",
      },
      actions: {
        edit: "Editar",
        delete: "Excluir",
      },
    },
    filter: {
      title: "Filtrar recursos",
      name: "Nome",
      namePlaceholder: "Buscar por nome",
      status: "Status",
      includeDeleted: "Incluir removidos",
    },
    form: {
      title: { create: "Novo recurso", edit: "Editar recurso" },
      subtitle: {
        create: "Cadastre um novo recurso de exemplo.",
        edit: "Atualize os dados do recurso.",
      },
      tabs: {
        generalInfo: "Dados Gerais",
        settings: "Configurações",
      },
      fields: {
        name: "Nome",
        code: "Código",
        description: "Descrição",
        status: "Status",
        enabled: "Ativo",
      },
      placeholders: {
        name: "Ex.: Recurso de exemplo",
        code: "Ex.: REC-001",
        description: "Descrição opcional do recurso",
      },
      validation: {
        nameRequired: "O nome é obrigatório",
        nameMinLength: "O nome deve ter ao menos 2 caracteres",
        codeRequired: "O código é obrigatório",
        statusRequired: "O status é obrigatório",
      },
      settingsTitle: "Configurações",
      configTab: {
        description:
          "Aba extra de configurações — só aparece ao editar um recurso existente. Demonstra o padrão de aba em arquivo separado.",
        visibility: "Visível na listagem pública",
        visibilityHint:
          "Quando desligado, o recurso fica oculto para usuários externos.",
      },
    },
  },
};
