// src/@types/language/module-foods/index.ts
// Interface de tradução do módulo "Formulação" (Food — Fábrica/Ração,
// TASK-FOOD-FE-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageFoods.ts.
//
// `form.validation.*` — chaves definidas NESTA Tarefa (TASK-FOOD-FE-01) já
// com o shape final que `TASK-FOOD-FE-02` (schema Yup) consome; decisão
// documentada: declarar o shape completo de uma vez (em vez de reservar um
// placeholder vazio e reeditar este mesmo arquivo na Tarefa seguinte) evita
// um 2º ciclo de edição do mesmo arquivo de interface — as STRINGS de
// tradução (nos 3 `languageFoods.ts`) também já foram escritas nesta mesma
// janela de execução, não deixadas vazias. Nenhuma chave foi escolhida à
// revelia da Tarefa dona: os 9 nomes vêm literalmente de
// `TASK-FOOD-FE-02.md` ("Arquivos Afetados").
//
// `form.typeOptions.*` — NÃO listado explicitamente no task-packet de
// `TASK-FOOD-FE-01`, adicionado para cumprir a exigência EXPLÍCITA da
// própria Tarefa de que `foodTypeLabel()` seja "não hardcoded — via i18n"
// (mirror `movements.movement.form.typeOptions.income/expense`).
//
// `list.pageTitle`/`pageSubtitle`/`activeLabel`/`inactiveLabel`/`emptyState`/
// `*Toast` + o bloco `filter` — NÃO listados explicitamente no task-packet de
// `TASK-FOOD-FE-01` (que só reservou `list.columns`/`list.actions`),
// adicionados aqui por `TASK-FOOD-FE-05` (grid/filtro/ações de linha) pelo
// mesmo racional já documentado no topo deste arquivo: texto de UI SEMPRE via
// i18n, nunca string literal — mirror `ModuleWarehouses` (`list.pageTitle`/
// `emptyState`/`filter.*`).
export interface ModuleFoods {
  food: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      duplicatedToast: string;
      reportErrorToast: string;
      columns: {
        code: string;
        product: string;
        date: string;
        quantity: string;
        measurement: string;
        type: string;
        status: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        edit: string;
        delete: string;
        duplicate: string;
        report: string;
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
      product: string;
      productPlaceholder: string;
      status: string;
      statusAll: string;
      statusOptions: {
        active: string;
        inactive: string;
      };
      type: string;
      typeAll: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        responsible: string;
        date: string;
        status: string;
        product: string;
        quantity: string;
        measurement: string;
        type: string;
        feedstocks: string;
        feedstockProduct: string;
        feedstockMeasurement: string;
        feedstockPercentageP: string;
        feedstockPercentageU: string;
        total: string;
        addFeedstock: string;
        removeFeedstock: string;
      };
      /** Labels das opções do enum `FoodType` (fábrica `foodTypeLabel`,
       *  `@/constants/foods/food-type.ts`) — ver nota de topo do arquivo. */
      typeOptions: {
        percentage: string;
        unit: string;
      };
      /** Textos auxiliares (mirror `data-help` do legado) — chave adicionada
       *  por `TASK-FOOD-FE-06` (`_forms.blade.php:32-37`, campo `quantity`),
       *  renomeada de `quantityHelp` para `quantityTooltip` na
       *  `TASK-FOOD-FE-08` (feedback de homologação: o texto saiu de
       *  `helperText` abaixo do campo para `tooltip` na label
       *  "Quantidade*"). */
      hints: {
        quantityTooltip: string;
      };
      /** Mensagens de validação do schema Yup (`TASK-FOOD-FE-02`,
       *  `food-schema.ts`) — ver nota de topo do arquivo. */
      validation: {
        productRequired: string;
        dateRequired: string;
        quantityMin: string;
        measurementRequired: string;
        typeRequired: string;
        feedstocksMin: string;
        feedstockProductRequired: string;
        percentageMin: string;
        percentageSumMustBe100: string;
      };
    };
  };
}
