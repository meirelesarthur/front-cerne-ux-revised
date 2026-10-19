// src/@types/language/module-sale-contracts/index.ts
// Interface de tradução do módulo "Contratos de Venda" (SaleContract —
// Operacional / Agricultura, esteira 036, TASK-FE-036-201/207). Espelha a
// convenção de module-harvests/module-clients: chave TOP-LEVEL dedicada
// (`saleContracts`), NÃO aninhada em `ModuleBaseRegistrations` (o módulo
// vive em Operacional, não em Cadastros Base). O conteúdo mora em
// src/constants/languages/{idioma}/languageSaleContracts.ts.

export interface ModuleSaleContracts {
  saleContract: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        number: string;
        client: string;
        /** "Responsável" — coluna ausente na 1ª entrega, restaurada pelo
         *  rework de fidelidade (`SC-LST-004`). */
        responsible: string;
        product: string;
        harvest: string;
        date: string;
        deliveryEndDate: string;
        quantity: string;
        /** "Qtd. Faltante" (`quantity - total_quantity` legado, `balance`
         *  na API) — coluna ausente na 1ª entrega (`SC-LST-005`). */
        missingQuantity: string;
        status: string;
        actions: {
          /** "Visualizar" — ação read-only (item B da homologação 036fix5,
           *  mirror `sale-contracts` `show` do legado). Sempre visível para
           *  quem acessa a listagem (mesmo gate `sale-contracts_view` da
           *  página), independente de `status`/permissão de edição. */
          view: string;
          edit: string;
          delete: string;
        };
      };
      /** Rótulos do enum de status (1/2/3/4/9 — contrato §5.2). Nunca
       *  hardcoded no componente; a cor (Badge `colorPalette`) mora em
       *  `saleContractStatus.ts`, não aqui. */
      statusOptions: {
        awaitingDelivery: string;
        inProgress: string;
        nearCompletion: string;
        completed: string;
        cancelled: string;
      };
      /** Título da legenda global de status, sempre visível acima da grid
       *  (mirror `<b>Legenda:</b>` do `index.blade.php` legado, `SC-LST-010`). */
      statusLegendTitle: string;
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
      client: string;
      product: string;
      startDate: string;
      endDate: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        client: string;
        product: string;
        harvest: string;
        number: string;
        date: string;
        deliveryStartDate: string;
        deliveryEndDate: string;
        paymentDate: string;
        quantity: string;
        coin: string;
        bagWeight: string;
        price: string;
        funrural: string;
        vlFunrural: string;
        deliveryPlace: string;
        paymentMethod: string;
        note: string;
        code: string;
        status: string;
        /** "Responsável" — readonly (usuário atual em create; `responsible.name`
         *  vindo da API em edit), restaurado no formulário (`SC2-B02`, 2ª
         *  auditoria; select readonly do legado, `_forms.blade.php:14`). */
        responsible: string;
        delivered: string;
        balance: string;
      };
      placeholders: {
        client: string;
        product: string;
        harvest: string;
      };
      /** Botões contextuais criar/editar ao lado dos selects de Cliente/
       *  Produto (item B15/B16 da homologação 036fix5, mirror EXATO
       *  `CreateOrUpdateMovimento.tsx`/`CreateOrUpdateNfe.tsx`). O par de
       *  Produto fica DESABILITADO com tooltip — não existe ainda um modal
       *  genérico de Produto reusável (só a página cheia,
       *  `CreateOrUpdateProduto.tsx`, sem variante em Dialog); nenhum modal
       *  novo foi criado aqui, ver dependência reportada na entrega. */
      actions: {
        addClientAria: string;
        editClientAria: string;
        addProductAria: string;
        editProductAria: string;
        productModalUnavailable: string;
      };
      /** Rótulo da única opção fixa do Select de moeda (`coin`, sempre
       *  `BRL` — contrato §3). */
      coinOption: string;
      /** Textos do bloco de cálculo (`SaleContractCalculationFields`,
       *  TASK-FE-036-204) — rótulos dos 3 campos somente leitura
       *  derivados (sacas/valor por Kg/total) + guarda de excesso do
       *  Funrural. */
      calculation: {
        sacasLabel: string;
        valorKgLabel: string;
        totalLabel: string;
        funruralExceedsTotal: string;
      };
      validation: {
        clientRequired: string;
        productRequired: string;
        harvestRequired: string;
        numberRequired: string;
        numberMaxLength: string;
        dateRequired: string;
        deliveryStartDateRequired: string;
        deliveryEndDateRequired: string;
        deliveryEndDateBeforeStart: string;
        paymentDateRequired: string;
        quantityRequired: string;
        quantityMin: string;
        bagWeightRequired: string;
        bagWeightMin: string;
        priceRequired: string;
        priceMin: string;
        funruralRequired: string;
        funruralMin: string;
        coinRequired: string;
        deliveryPlaceRequired: string;
        deliveryPlaceMaxLength: string;
        paymentMethodRequired: string;
        paymentMethodMaxLength: string;
        noteMaxLength: string;
      };
    };
  };
}
