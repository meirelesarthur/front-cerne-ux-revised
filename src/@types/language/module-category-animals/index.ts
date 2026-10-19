// src/@types/language/module-category-animals/index.ts
// Interface de tradução do módulo "Categorias Animais" (CategoryAnimal —
// Cadastros Base / Pecuários, execução 025). Arquivo NOVO e independente —
// mirror estrutural de `module-providers`/`module-breeds` (i18n modular por
// módulo). O conteúdo mora em
// src/constants/languages/{idioma}/languageCategoriaAnimal.ts.
//
// TASK-FE-540 cobre a camada de infra (singular/plural para queryKey,
// opções do enum `gender`, mensagens de validação do schema Yup) + stub de
// `list`/`filter`. TASK-FE-541 completa o conteúdo de `list`/`filter` (copy
// real da tela de listagem). `form.fields`/`form.tabs` (TASK-FE-542/543)
// ficam para as Tarefas seguintes, mesmo padrão incremental já usado em
// `module-providers`/`module-kinds`.

export interface ModuleCategoryAnimals {
  categoryAnimal: {
    singularLabel: string;
    pluralLabel: string;

    /** Rótulos do enum `gender` (backend, M/F/A). */
    genderOptions: {
      male: string;
      female: string;
      both: string;
    };

    /** Tela de LISTAGEM (grid) — TASK-FE-541. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        specie: string;
        specieEmpty: string;
        gender: string;
        ageRange: string;
        /** "—" quando `start_month`/`end_month` são ambos nulos. */
        ageRangeEmpty: string;
        /** Template `{months}` — só `start_month` presente. */
        ageRangeFrom: string;
        /** Template `{months}` — só `end_month` presente. */
        ageRangeTo: string;
        /** Template `{start}`/`{end}` — ambos presentes. */
        ageRangeBetween: string;
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
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };

    /** Drawer de FILTRO da listagem — TASK-FE-541. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      specie: string;
      specieAll: string;
      gender: string;
      genderAll: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };

    /**
     * Formulário de criação/edição (TASK-FE-542) — 7 campos: description,
     * is_enabled, specie_uuid, gender, start_month, end_month,
     * next_category_uuid. `product_uuid` reservado para `TASK-FE-543` (sem
     * chaves de copy aqui ainda).
     */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        specie: string;
        gender: string;
        startMonth: string;
        endMonth: string;
        /** Self-FK (evolução de categoria) — rótulo fiel ao contrato §3.5. */
        nextCategory: string;
      };
      placeholders: {
        description: string;
        specie: string;
        nextCategory: string;
      };
      hints: {
        specieRequired: string;
      };
      /** Mensagens de validação do schema Yup (`category-animal-schema.ts`) — TASK-FE-540. */
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        specieRequired: string;
        genderRequired: string;
        startMonthMin: string;
        endMonthMin: string;
      };
    };
  };
}
