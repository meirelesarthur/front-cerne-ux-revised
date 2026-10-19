// src/@types/language/module-stocks/index.ts
// Interface de tradução do módulo de SALDO DE ESTOQUE (Stock, Administrativo
// → Estoque, TASK-STK-FE-01). Módulo 100% leitura — sem `form` (não existe
// create/edit). O conteúdo mora em
// src/constants/languages/{idioma}/languageStocks.ts.
//
// `pluralLabel` existe (diferente de `module-warehouses`) porque a chave de
// query (`queryKey.stocks.stocks`) é DERIVADA do par singular/plural da
// tradução (mirror `openingBalances`/`requestPurchases`), nunca string
// literal.

export interface ModuleStocks {
  stock: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      report: string;
      table: {
        product: string;
        warehouse: string;
        quantity: string;
        lot: string;
        expirationDate: string;
        averageCost: string;
        total: string;
        info: string;
        actions: {
          viewDetail: string;
        };
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      product: string;
      productPlaceholder: string;
      warehouse: string;
      warehousePlaceholder: string;
    };
    /** Tela de Detalhe agrupado (TASK-STK-FE-02) — 100% leitura, sem edição. */
    detail: {
      sections: {
        identification: string;
        balance: string;
        lots: string;
        addressing: string;
      };
      fields: {
        product: string;
        warehouse: string;
        quantity: string;
        total: string;
        addressingType: string;
      };
      table: {
        lot: string;
        providerLot: string;
        expirationDate: string;
        quantity: string;
        averageCost: string;
        total: string;
      };
      lotsEmpty: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      /** Guarda de entrada — `product_uuid`/`warehouse_uuid` ausentes/inválidos. */
      invalidParamsToast: {
        title: string;
        description: string;
      };
      noData: string;
    };
    /**
     * Tela de Relatório/Export (TASK-STK-FE-03) — mesmos filtros da
     * Listagem (`filter`, acima) + 2 exports (PDF/XLSX) sempre habilitados,
     * fiel ao legado: sem filtro, exporta todos os saldos da fazenda.
     * Sem prévia — removida (crash de runtime; decisão do dono).
     */
    report: {
      title: string;
      subtitle: string;
      exportPdf: string;
      exportXlsx: string;
      exportPdfError: {
        title: string;
        description: string;
      };
      exportXlsxError: {
        title: string;
        description: string;
      };
    };
    /**
     * "Agrupar" / Consolidação de Estoque (TASK-STK-FE-04) — única ação de
     * ESCRITA da família Saldo de Estoque. Botão + checkboxes de seleção
     * múltipla na Listagem, prévia e modal de escolha do "principal".
     * Todas as mensagens client-side (contagem mínima, mesma unidade) e os
     * rótulos dos botões vêm daqui — NUNCA string literal no componente.
     */
    consolidation: {
      /** Rótulo do botão "Agrupar" do HeaderTable e do botão de confirmação. */
      groupButton: string;
      /** Título dos toasts de alerta client-side (contagem/unidade). */
      alertTitle: string;
      /** Clique em "Agrupar" com < 2 selecionados. */
      selectAtLeastTwoAlert: string;
      /** 2ª seleção de unidade de medida diferente da já selecionada. */
      differentUnitAlert: string;
      /** Título do modal de agrupamento. */
      modalTitle: string;
      /** Legenda acima da lista do modal (escolha do produto principal). */
      modalPrimaryLabel: string;
      /** Rótulo do botão de confirmação do modal (fiel ao legado). */
      confirmButton: string;
      /** Rótulo do botão de cancelamento do modal. */
      cancelButton: string;
      /** Toast de sucesso do POST de consolidação. */
      successToast: string;
      /** Toast de erro ao carregar a prévia (GET). */
      previewErrorTitle: string;
      previewErrorToast: string;
      /** Cabeçalhos das colunas da lista dentro do modal. */
      columns: {
        product: string;
        warehouse: string;
        quantity: string;
        lot: string;
        expirationDate: string;
      };
    };
  };
}
