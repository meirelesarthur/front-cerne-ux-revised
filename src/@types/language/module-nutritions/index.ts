// src/@types/language/module-nutritions/index.ts
// Interface de tradução do módulo "Nutrição" (Nutrition — Operacional /
// Consumo de Ração, TASK-NT-FE-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageNutritions.ts.
//
// Mirror estrutural de `module-food-beats` (módulo com item dinâmico) — chave
// TOP-LEVEL `nutrition` (singular, mirror `foodBeat`/`warehouseTransfer`).
//
// `form.fields.item.*` cobre o card dinâmico de item (FLD-05..14) e
// `form.fields.employee.*` cobre a aba condicional "Controle de Horas"
// (FLD-16..19, só quando `time_control=true`) — nenhuma tela consome ainda
// (Tarefa de fundação, `TASK-NT-FE-01`); as chaves já nascem com o shape
// final para não reabrir este arquivo nas Tarefas seguintes (mesmo racional
// já usado por `module-food-beats`/`module-bull-seed-season`).
//
// `form.validation.*` — nomes 1:1 com as chaves referenciadas em
// `nutrition-schema.ts` (`TASK-NT-FE-01`), fonte única das mensagens Yup
// (nunca string literal no schema).
//
// `options.*` — rótulos consumidos pelas fábricas `func-type-options.ts`/
// `time-control-options.ts` (`src/constants/operational/nutrition/options/`).
export interface ModuleNutritions {
  nutrition: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      columns: {
        code: string;
        date: string;
        employeeOrUser: string;
        areasGrazings: string;
        batches: string;
        products: string;
        quantity: string;
        timeControl: string;
        actions: string;
      };
      actions: {
        view: string;
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
      deletedToast: string;
    };
    filter: {
      title: string;
      startDate: string;
      endDate: string;
      product: string;
      productPlaceholder: string;
      batch: string;
      batchPlaceholder: string;
      /** FLT-03 — filtro preservado na API mesmo sem `<select>` confirmado na
       *  view legada (`CLM-08`, LACUNA de UI); decisão de exibir/ocultar o
       *  campo na tela é da `TASK-NT-FE-02` (aqui só a tradução). */
      employee: string;
      employeePlaceholder: string;
    };
    /** `detail.back` — botão "Voltar" da tela de visualização (SRF-07,
     *  `TASK-NT-FE-05`), mirror `module-feedlot-sectors::detail.actions.back`. */
    detail: {
      back: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
        /** Título da tela de visualização read-only (SRF-07). */
        view: string;
      };
      fields: {
        header: {
          code: string;
          date: string;
          user: string;
          timeControl: string;
        };
        item: {
          sectionTitle: string;
          warehouse: string;
          /** Sufixo do rótulo de armazém excluído logicamente (edição). */
          warehouseDeletedSuffix: string;
          product: string;
          dietBeat: string;
          um: string;
          stock: string;
          quantity: string;
          area: string;
          grazing: string;
          trough: string;
          note: string;
          costCenter: string;
          batches: string;
          /** `CheckboxListField` (TASK-NT-FE-03) — busca/contador do picker de
           *  Lotes por item (`batches` acima é o rótulo do campo). */
          batchesSearchPlaceholder: string;
          batchesSelectedCountLabel: string;
          addItem: string;
          removeItem: string;
          insufficientStock: string;
        };
        /** Aba "Controle de Horas" — condicional a `time_control=true`
         *  (FLD-16..19). */
        employee: {
          sectionTitle: string;
          funcType: string;
          funcExecutor: string;
          funcUm: string;
          funcTotalQuantity: string;
          addEmployee: string;
          removeEmployee: string;
        };
      };
      /** Mensagens de validação do schema Yup (`nutrition-schema.ts`) — nomes
       *  1:1 com as chaves usadas em cada regra. */
      validation: {
        dateRequired: string;
        numberType: string;
        quantityMin: string;
        itemTroughRequired: string;
        itemQuantityRequired: string;
        itemProductOrDietRequired: string;
        itemWarehouseRequired: string;
        itemBatchesMin: string;
        itemsMin: string;
        employeeFuncTypeRequired: string;
        employeeFuncExecutorRequired: string;
        employeeFuncUmRequired: string;
        employeeFuncTotalRequired: string;
      };
    };
    /** Rótulos das options factories (`DA-NT-07` — func_type; mirror
     *  `booleanOptions` — time_control). */
    options: {
      funcType: {
        employee: string;
        function: string;
        provider: string;
      };
      timeControl: {
        yes: string;
        no: string;
      };
    };
  };
}
