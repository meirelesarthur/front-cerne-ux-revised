// src/@types/language/module-food-beats/index.ts
// Interface de tradução do módulo "Batida" (FoodBeat — Fábrica, TASK-FB-FE-01).
// O conteúdo mora em src/constants/languages/{idioma}/languageFoodBeats.ts.
//
// `form.validation.*` — chaves usadas pelo schema Yup (`TASK-FB-FE-02`,
// `food-beat-schema.ts`), já declaradas com o shape final nesta mesma janela
// de execução (mesmo racional de `module-foods/index.ts`: evitar um 2º ciclo
// de edição do mesmo arquivo). Duas chaves são ADITIVAS em relação às ~14
// listadas literalmente no task-packet de `TASK-FB-FE-02`
// (`providerLotRequiredWhenHasLot`/`shelfLifeRequiredWhenHasLot`) — exigidas
// pela regra condicional de "lote/validade obrigatórios quando o produto tem
// `has_lot`" (ver `## Leitura do dev` de `TASK-FB-FE-02`) para cumprir a DoD
// "zero string hardcoded"; mesmo tratamento já usado por `module-foods`
// (`form.typeOptions`/`list.pageTitle` aditivos por Tarefas seguintes).
//
// `report.aggregated.*` — reservada para o relatório PDF agregado
// (`GET /food-beats/report`, `TASK-FB-FE-03`); nenhuma tela consome ainda
// (sem Tarefa de UI planejada nesta esteira).
//
// ADITIVO (`TASK-FB-FE-04`/`TASK-FB-FE-05`, mesmo racional já documentado
// acima para as chaves aditivas de `TASK-FB-FE-02`): `list.deletedToast`/
// `list.reportErrorToast` (mirror `languageFoods`, exigidos pela tela de
// listagem) + `formulationItem.sectionTitle`/`insufficientStock` +
// `stockItem.sectionTitle`/`insufficientStock`/`duplicateStock`/
// `footerTotalLabel` (mensagens dos 2 editores de composição/rateio) +
// `filter.productPlaceholder`/`userPlaceholder` (zero string hardcoded nos
// `SelectAsyncPaginate` do drawer de filtro). Nenhuma chave já existente foi
// removida/renomeada.
export interface ModuleFoodBeats {
  foodBeat: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      columns: {
        code: string;
        date: string;
        type: string;
        warehouse: string;
        productOrFood: string;
        quantity: string;
        user: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        report: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** ADITIVO `TASK-FB-FE-05` — toast de sucesso da exclusão (mirror
       *  `languageFoods.list.deletedToast`) e de erro do download do
       *  relatório de item (mirror `languageFoods.list.reportErrorToast`). */
      deletedToast: string;
      reportErrorToast: string;
    };
    filter: {
      title: string;
      product: string;
      user: string;
      startDate: string;
      endDate: string;
      /** ADITIVO `TASK-FB-FE-05` — placeholder dos `SelectAsyncPaginate` do drawer. */
      productPlaceholder: string;
      userPlaceholder: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      typeOptions: {
        formulation: string;
        stock: string;
      };
      fields: {
        header: {
          code: string;
          responsible: string;
          date: string;
          type: string;
          warehouse: string;
          food: string;
          product: string;
          productQuantity: string;
          measurement: string;
          quantity: string;
          providerLot: string;
          shelfLife: string;
          total: string;
        };
        formulationItem: {
          stock: string;
          feedstock: string;
          measurement: string;
          stockAvailable: string;
          percentage: string;
          quantityPredicted: string;
          quantityRealized: string;
          difference: string;
          amount: string;
          total: string;
          addItem: string;
          removeItem: string;
          /** ADITIVO `TASK-FB-FE-04` — título do card do editor (mirror
           *  `MovementAllocationEditor.text.sectionTitle`) e mensagem do
           *  `toaster.error` de `feedstock_quantity_realized` acima do saldo
           *  disponível (`onBlur`, Doc Bruta `§12.2` linha 7). */
          sectionTitle: string;
          insufficientStock: string;
        };
        stockItem: {
          warehouse: string;
          stock: string;
          measurement: string;
          stockAvailable: string;
          quantity: string;
          amount: string;
          total: string;
          addItem: string;
          removeItem: string;
          /** ADITIVO `TASK-FB-FE-04` — título do card, mensagem do
           *  `toaster.error` de `quantity` acima do saldo disponível (`onBlur`,
           *  mirror `_card-stock.blade.php:154-201`), mensagem de duplicidade
           *  de `stock_id` entre linhas (Doc Bruta `§12.3` linha 2) e rótulo
           *  do rodapé `vl_total` ("Total Geral"). */
          sectionTitle: string;
          insufficientStock: string;
          duplicateStock: string;
          footerTotalLabel: string;
        };
      };
      /** Textos auxiliares — `editReadonlyNotice` é a chave CRÍTICA da
       *  Decisão 1 (`## 9` do contrato): explica ao usuário por que só a
       *  data está editável em modo edição. */
      hints: {
        editReadonlyNotice: string;
        quantityHelp: string;
      };
      /** Mensagens de validação do schema Yup (`TASK-FB-FE-02`,
       *  `food-beat-schema.ts`) — ver nota de topo do arquivo. */
      validation: {
        warehouseRequired: string;
        dateRequired: string;
        typeRequired: string;
        foodRequired: string;
        productRequired: string;
        quantityRequired: string;
        quantityMin: string;
        providerLotMax: string;
        providerLotRequiredWhenHasLot: string;
        shelfLifeRequiredWhenHasLot: string;
        itemStockRequired: string;
        itemWarehouseRequired: string;
        itemQuantityRequired: string;
        itemAmountRequired: string;
        itemTotalRequired: string;
        itemsMin: string;
        numberType: string;
      };
    };
    report: {
      aggregated: {
        title: string;
        food: string;
        startDate: string;
        endDate: string;
        generate: string;
      };
    };
  };
}
