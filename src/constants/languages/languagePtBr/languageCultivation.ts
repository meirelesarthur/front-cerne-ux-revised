// src/constants/languages/languagePtBr/languageCultivation.ts
// Tradução PT-BR do módulo de CULTURA/VARIEDADE (Cultivation — Cadastros Base).

import { ModuleCultivation } from "@/@types/language/module-cultivation";

export const languageCultivation: ModuleCultivation = {
  pageTitle: "Cultura / Variedade",
  pageSubtitle:
    "Administre a árvore de Culturas e suas Variedades vinculadas.",
  deletedToast: "Classificação de cultivo removida com sucesso",
  table: {
    name: "Nome",
    status: "Status",
    active: "Ativo",
    inactive: "Inativo",
    varietiesCount: "Variedades",
  },
  tree: {
    expand: "Expandir Variedades",
    collapse: "Recolher Variedades",
  },
  actions: {
    edit: "Editar",
    newVariety: "Nova Variedade",
    delete: "Excluir",
  },
  empty: {
    message: "Nenhuma Cultura cadastrada ainda.",
    cta: "Nova Cultura",
  },
  error: {
    message: "Não foi possível carregar a árvore de Cultura/Variedade.",
    retry: "Tentar novamente",
  },
  filter: {
    title: "Filtrar Cultura/Variedade",
    search: "Nome",
    searchPlaceholder: "Buscar por nome",
  },
  form: {
    title: {
      create: "Nova Cultura/Variedade",
      edit: "Editar Cultura/Variedade",
    },
    subtitle: {
      create:
        "Cadastre uma nova Cultura (sem pai) ou uma Variedade (selecionando uma Cultura-pai).",
      edit: "Atualize os dados desta Cultura ou Variedade.",
    },
    fields: {
      name: "Nome",
      status: "Status",
      parent: "Cultura-pai",
    },
    placeholders: {
      name: "Digite o nome",
      parent: "Nenhuma — esta é uma Cultura-raiz",
    },
    validation: {
      nameRequired: "O nome é obrigatório",
      nameMinLength: "O nome deve conter ao menos 2 caracteres",
    },
  },
};
