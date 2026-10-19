// src/@types/language/module-warehouses/index.ts
// Interface de tradução do módulo de ARMAZÉNS (Cadastros Base). Espelha a
// convenção do módulo de Centros de Custo (module-cost-centers). O conteúdo
// mora em src/constants/languages/{idioma}/languageWarehouses.ts.
//
// TASK-FE-018 (grid) preencheu `singularLabel` + `list` + `filter`. TASK-FE-019
// (formulário de criação/edição, Warehouse-contrato-frontend.md §5.2, APROVADO
// v1.1) completa a seção `form`: 3 campos de negócio (Sigla/Tipo/Descrição) +
// 1 toggle (Ativo) — sem Antecessor/Rateio/Classe (Warehouse não tem
// hierarquia nem sub-recurso, diferente de `module-cost-centers`).

export interface ModuleWarehouses {
  warehouse: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        initials: string;
        description: string;
        type: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
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
      type: string;
      typeAll: string;
      typeOptions: {
        insumos: string;
        producao: string;
        formulacao: string;
      };
      isActive: string;
      isActiveAll: string;
      activeOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição (TASK-FE-019) — 3 campos + 1 toggle, sem hierarquia/rateio. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        initials: string;
        type: string;
        description: string;
        isActive: string;
      };
      placeholders: {
        initials: string;
        description: string;
      };
      hints: {
        /** Copy ajustada (§11.5 do contrato) — NÃO sugere bloqueio operacional inexistente. */
        isActiveHelp: string;
      };
      validation: {
        initialsRequired: string;
        initialsMinLength: string;
        initialsMaxLength: string;
        typeRequired: string;
        descriptionRequired: string;
        descriptionMinLength: string;
        descriptionMaxLength: string;
      };
    };
  };
}
