// src/constants/languages/languagePtBr/languageRoles.ts
// Tradução PT-BR do módulo de PERFIS (Roles RBAC — Cadastros Base).

import { ModuleRoles } from "@/@types/language/module-roles";

export const languageRoles: ModuleRoles = {
  role: {
    singularLabel: "Perfil",
    list: {
      pageTitle: "Perfis",
      pageSubtitle:
        "Administre os perfis de acesso (roles) e suas permissões no sistema.",
      deletedToast: "Perfil removido com sucesso",
      table: {
        name: "Nome",
        description: "Descrição",
      },
      actions: {
        edit: "Editar",
        delete: "Excluir",
      },
    },
    filter: {
      title: "Filtrar perfis",
      search: "Nome",
      searchPlaceholder: "Buscar por nome ou descrição",
    },
    form: {
      title: { create: "Novo Perfil", edit: "Editar Perfil" },
      subtitle: {
        create: "Cadastre um novo perfil de acesso e selecione suas permissões.",
        edit: "Atualize os dados e as permissões do perfil.",
      },
      tabs: {
        generalInfo: "Dados Gerais",
        permissions: "Permissões",
      },
      fields: {
        name: "Nome",
        description: "Descrição",
        isUserVisible: "Visível ao usuário",
      },
      placeholders: {
        name: "Ex.: Gerente Operacional",
        description: "Descrição opcional do perfil",
      },
      hints: {
        isUserVisible:
          "Quando desligado, o perfil não aparece para seleção pelos usuários.",
      },
      validation: {
        nameRequired: "O nome é obrigatório",
        nameMinLength: "O nome deve ter ao menos 2 caracteres",
        descriptionRequired: "A descrição é obrigatória",
      },
      permissionsTree: {
        searchPlaceholder: "Buscar permissão por título ou descrição",
        selectedSuffix: "selecionada(s)",
        noResults: "Nenhuma permissão encontrada para a busca.",
        driftTooltip:
          "Permissão não disponível neste ambiente (sem seed) — não pode ser selecionada.",
        noAuthorityTooltip:
          "Você não pode atribuir uma permissão que não possui.",
        readOnlyHint:
          "Você não tem permissão para alterar este perfil — visualização somente leitura.",
      },
    },
  },
};
