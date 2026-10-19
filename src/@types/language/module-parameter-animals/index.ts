// src/@types/language/module-parameter-animals/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo PARÂMETROS ANIMAIS (ParameterAnimal —
// Cadastros Base / Pecuária). Mirror `module-death-losses` (mesma forma
// list/form/deleteConfirm) — fundação da regeneração das telas
// (TASK-FE-1078/1079), NÃO a tela em si.
//
// Campos de negócio conforme `animal-parameter-contrato.md` v1.1 §2/§3 — os 6
// campos abaixo (`employee`, `category`, `feedingArea`, `waterConsumption`,
// `msConsumption`, `averageWeight`) são TODOS `required` no form (M4/GAP-475).
// `code` é somente leitura (RN-1, auto-gerado pelo servidor), nunca input de
// criação — por isso `form.fields.code` existe (para o modo edição, exibição
// read-only) mas NÃO tem chave em `form.validation` (sem regra de obrigatoriedade
// de input, pois nunca é editável).
//
// O conteúdo mora em
// src/constants/languages/{idioma}/languageParameterAnimal.ts.
// -----------------------------------------------------------------------------

export interface ModuleParameterAnimals {
  parameterAnimal: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        description: string;
        category: string;
        employee: string;
        averageWeight: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        titleFiltered: string;
        titleEmptyNoCreate: string;
        descriptionEmpty: string;
        descriptionFiltered: string;
        descriptionEmptyNoCreate: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
    /** Drawer de filtro — hoje só filtra por `description` (Doc Bruta/contrato §3, sem outro filtro no index). */
    filter: {
      title: string;
      description: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        code: string;
        description: string;
        employee: string;
        /** TASK-FE-1088 — só FILTRA a Categoria (Doc Bruta `_forms.blade.php:28`), NUNCA persistida (`parameter_animals` não tem coluna de espécie). */
        specie: string;
        category: string;
        feedingArea: string;
        waterConsumption: string;
        msConsumption: string;
        averageWeight: string;
      };
      placeholders: {
        description: string;
        employee: string;
        specie: string;
        category: string;
        feedingArea: string;
        waterConsumption: string;
        msConsumption: string;
        averageWeight: string;
      };
      /** TASK-FE-1088 — hint exibido no lugar do placeholder de Categoria enquanto nenhuma Espécie estiver selecionada (mirror `module-animals`). */
      hints: {
        specieRequired: string;
      };
      /** TASK-FE-1088 — aviso ao trocar a Espécie com uma Categoria já selecionada (a categoria pode não pertencer mais à nova Espécie): NUNCA zerar em silêncio. */
      warnings: {
        categoryClearedBySpecieChange: string;
      };
      /** Mensagens de validação Yup — os 6 campos de negócio + Espécie (TASK-FE-1088, obrigatória só no form, nunca no payload) são `required`. */
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        employeeRequired: string;
        specieRequired: string;
        categoryRequired: string;
        feedingAreaRequired: string;
        waterConsumptionRequired: string;
        msConsumptionRequired: string;
        averageWeightRequired: string;
      };
    };
  };
}
