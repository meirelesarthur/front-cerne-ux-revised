// src/@types/language/module-farm-transfers/index.ts
// Interface de tradução do módulo "Trans. Fazendas" (FarmTransfer — Estoque,
// escrita, Tarefas 01/02/03). O conteúdo mora em
// src/constants/languages/{idioma}/languageFarmTransfers.ts. Molde
// estrutural DIRETO de `module-warehouse-transfers/index.ts`, acrescido do
// bloco `form.fields.destinationFarm` (cascata NOVA vs. o irmão) e do
// subfluxo financeiro opcional (`form.fields.financial`).
//
// `form.validation.*` — chaves usadas pelo schema Yup
// (`farm-transfer-create-schema.ts`).
//
// `filter.destinationWarehouse*` — ⚠️ o filtro `warehouse_uuid` de
// `GET /farm-transfers` filtra pelo armazém de DESTINO (confirmado por
// leitura direta de `StockMovementRepository::listPaginatedBetweenFarms()`,
// ver `@/@types/v2/FarmTransfers`) — mesmo rótulo do irmão.
export interface ModuleFarmTransfers {
  farmTransfer: {
    /** "Transferência entre Fazendas" (label do menu). */
    singularLabel: string;
    pluralLabel: string;
    list: {
      columns: {
        code: string;
        date: string;
        product: string;
        originWarehouse: string;
        originFarm: string;
        destinationWarehouse: string;
        destinationFarm: string;
        quantity: string;
        user: string;
      };
      actions: {
        view: string;
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
      /** ⚠️ É DESTINO — ver docblock do arquivo. */
      destinationWarehouse: string;
      destinationWarehousePlaceholder: string;
      dateFrom: string;
      dateTo: string;
    };
    detail: {
      title: string;
      invalidParamsToast: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      fields: {
        code: string;
        date: string;
        product: string;
        originWarehouse: string;
        originFarm: string;
        destinationWarehouse: string;
        destinationFarm: string;
        quantity: string;
        amount: string;
        costCenter: string;
        user: string;
        createdAt: string;
      };
      backButton: string;
      deleteButton: string;
    };
    form: {
      title: {
        create: string;
      };
      fields: {
        header: {
          code: string;
          user: string;
          date: string;
          type: string;
          typeValue: string;
          /** "Fazenda (origem)" — correção pós-entrega (achado do dono):
           *  antes implícita (fazenda ativa da sessão), agora exibida
           *  explicitamente no cabeçalho, readonly. */
          originFarm: string;
          originWarehouse: string;
          /** "Fazenda destino" — cascata NOVA vs. o irmão (`GAP-FARMTRANSFER-FE-02`). */
          destinationFarm: string;
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
        financial: {
          toggleLabel: string;
          vlTotal: string;
          incomeSectionTitle: string;
          incomeSectionHint: string;
          expenseSectionTitle: string;
          expenseSectionHint: string;
          category: string;
          categoryPlaceholder: string;
          costCenter: string;
          costCenterPlaceholder: string;
          value: string;
          percent: string;
          addRow: string;
          removeRow: string;
          emptyRows: string;
          sumLabel: string;
          sumHint: string;
          installmentsSectionTitle: string;
          installmentsSectionHint: string;
          installmentDate: string;
          installmentValue: string;
          addInstallment: string;
          removeInstallment: string;
          emptyInstallments: string;
          installmentsSumLabel: string;
        };
      };
      hints: {
        originWarehouseHelp: string;
        destinationFarmHelp: string;
      };
      validation: {
        dateRequired: string;
        destinationFarmRequired: string;
        destinationWarehouseRequired: string;
        originWarehouseRequired: string;
        itemsMin: string;
        itemStockRequired: string;
        itemQuantityRequired: string;
        quantityMin: string;
        numberType: string;
        vlTotalRequired: string;
        incomeCategoryRequired: string;
        incomeCenterRequired: string;
        incomeValueRequired: string;
        incomeSumMismatch: string;
        expenseCategoryRequired: string;
        expenseCenterRequired: string;
        expenseValueRequired: string;
        expenseSumMismatch: string;
        installmentsMin: string;
        installmentDateRequired: string;
        installmentValueRequired: string;
        installmentsSumMismatch: string;
      };
    };
  };
}
