// src/@types/language/module-warehouse-transfers/index.ts
// Interface de tradução do módulo "Trans. Armazém" (WarehouseTransfer —
// Estoque, escrita, TASK-WT-FE-01). O conteúdo mora em
// src/constants/languages/{idioma}/languageWarehouseTransfers.ts. Molde
// estrutural de `module-food-beats/index.ts`.
//
// `form.validation.*` — chaves usadas pelo schema Yup (`TASK-WT-FE-01`,
// `warehouse-transfer-create-schema.ts`/`warehouse-transfer-update-schema.ts`),
// já declaradas com o shape final nesta mesma janela de execução (evita um
// 2º ciclo de edição do mesmo arquivo pelas Tarefas de tela seguintes).
//
// `filter.destinationWarehouse*` — ⚠️ o filtro `warehouse_uuid` de
// `GET /warehouse-transfers` filtra pelo armazém de DESTINO (achado de
// leitura direta, ver `@/@types/v2/WarehouseTransfers`) — o rótulo já nasce
// correto ("Armazém Destino"), nunca copiando o `warehouse_id` ambíguo do
// Blade legado.
export interface ModuleWarehouseTransfers {
  warehouseTransfer: {
    /** "Transferência entre Armazéns" (label do menu, mirror `trad.wt_tranf_arm`). */
    singularLabel: string;
    pluralLabel: string;
    list: {
      columns: {
        code: string;
        date: string;
        product: string;
        originWarehouse: string;
        destinationWarehouse: string;
        quantity: string;
        user: string;
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
      product: string;
      productPlaceholder: string;
      /** ⚠️ É DESTINO — ver "Leitura do dev" da Tarefa e o docblock acima. */
      destinationWarehouse: string;
      destinationWarehousePlaceholder: string;
      dateFrom: string;
      dateTo: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          date: string;
          type: string;
          /** "Transferência" fixo — mirror `trad.wt_tranf`, readonly na UI. */
          typeValue: string;
          originWarehouse: string;
          destinationWarehouse: string;
        };
        item: {
          product: string;
          measurement: string;
          stockAvailable: string;
          quantity: string;
          unitValue: string;
          totalValue: string;
          costCenter: string;
          addItem: string;
          removeItem: string;
          sectionTitle: string;
          insufficientStock: string;
          duplicateStock: string;
          footerTotalLabel: string;
        };
      };
      /** Explica que o armazém origem é só filtro client-side, não é salvo
       *  (`DA-WT-12`). */
      hints: {
        originWarehouseHelp: string;
      };
      /** Mensagens de validação do schema Yup (`TASK-WT-FE-01`,
       *  `warehouse-transfer-create-schema.ts`/`warehouse-transfer-update-schema.ts`). */
      validation: {
        dateRequired: string;
        destinationWarehouseRequired: string;
        originWarehouseRequired: string;
        itemsMin: string;
        itemStockRequired: string;
        itemQuantityRequired: string;
        quantityMin: string;
        itemCostCenterRequired: string;
        numberType: string;
      };
    };
  };
}
