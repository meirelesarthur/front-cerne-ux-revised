// src/@types/language/module-opening-balances/index.d.ts
// Interface de tradução do módulo de ESTOQUE INICIAL (OpeningBalance —
// Cadastros Base / Estrutura, execução 026). TASK-FE-1040 (fundação de
// dados) entregou SÓ `singularLabel`/`pluralLabel` — o par mínimo que
// alimenta `queryKey.openingBalances.*` (convenção canônica derivada da
// tradução, NUNCA string literal, mirror `products`/`warehouses`/
// `equipments`). TASK-FE-1042 (listagem) acrescenta `list`/`filter`, mirror
// shape de `ModuleWarehouses`/`ModuleProducts` (aditivo, singular/plural
// preservados intocados). `list.table` fiel 1:1 ao legado (Blade
// `openingbalances/index.blade.php:85-104`, correção pós-entrega do
// Maestro): 7 colunas de dado (Produto/Un. Medida/Armazém/Quantidade/
// Dt. Movimento/Lote Fornecedor/Classificação) + Ações — SEM Vl. Unitário/
// Valor Total (não exibidos na listagem legado, só no formulário/detalhe).
//
// Campos futuros (ACRESCENTADOS de forma aditiva, NUNCA sobrescrevendo o que
// esta Tarefa criou):
//   - `form`/`detail`      → TASK-FE-1043/1045 (formulário/detalhe)
//   - `excel` (download/import/export) → TASK-FE-1047 (ADICIONADO abaixo)
//
// `excel` (TASK-FE-1047) — mirror shape de `ModulePlanAccounts.planAccount.
// excel`, COM 2 diferenças estruturais fiéis ao contrato real deste módulo
// (OpeningBalance-contrato.md §7.2, `ImportOpeningBalanceAction`):
//   1. `import.result` NÃO tem `deleted`/`preservedTitle` — o import de
//      Estoque Inicial é upsert puro (`updateOrCreate`, nunca exclui nada),
//      diferente do Plano de Contas (exclusão segura de contas ausentes).
//   2. `import.rowErrors.rowPrefix` é NOVO — o backend não é atômico aqui
//      (linhas anteriores à falha já foram persistidas), então os erros de
//      linha chegam no payload de SUCESSO (`OpeningBalanceImportResult.
//      errors: {row, message}[]`), não em um 422 `errors.rows: string[]`
//      como no Plano de Contas — o prefixo "Linha {row}:" é montado no
//      client a partir do número da linha.
//
// O conteúdo mora em src/constants/languages/{idioma}/languageOpeningBalances.ts.

export interface ModuleOpeningBalances {
  openingBalance: {
    singularLabel: string;
    pluralLabel: string;
    /** Listagem (grid) — TASK-FE-1042. */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        product: string;
        measurement: string;
        warehouse: string;
        quantity: string;
        movementDate: string;
        providerLot: string;
        classification: string;
        /** Fallback literal do legado (`trad.var_nao_possui`) para
         *  Lote Fornecedor/Classificação vazios — NUNCA string literal no
         *  componente (correção do Maestro, TASK-FE-1042). */
        noData: string;
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
    /** Drawer de filtro (grid) — TASK-FE-1042: `search`/`product_uuid`/`warehouse_uuid`. */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      product: string;
      productPlaceholder: string;
      warehouse: string;
      warehousePlaceholder: string;
    };
    /** Formulário Criar/Editar, Zonas 1-3 — TASK-FE-1043. Zona 4
     *  ("Classificação"/"Bebida", condicional a `requires_coffee_fields`,
     *  TASK-BE-705) acrescentada aditivamente por TASK-FE-1044 — ver
     *  `sections.coffeeInfo`/`fields.classification`/`fields.drink`/
     *  `drinkOptions`. */
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      sections: {
        identification: string;
        quantitiesValues: string;
        additionalInfo: string;
        /** Zona 4 (TASK-FE-1044) — condicional a `requires_coffee_fields`. */
        coffeeInfo: string;
      };
      fields: {
        product: string;
        warehouse: string;
        measurement: string;
        quantity: string;
        amount: string;
        totalAmount: string;
        averageCost: string;
        providerLot: string;
        expirationDate: string;
        /** Zona 4 (TASK-FE-1044) — `cultivation_uuid`, mirror da coluna
         *  `list.table.classification`. */
        classification: string;
        /** Zona 4 (TASK-FE-1044) — `drink`. */
        drink: string;
      };
      placeholders: {
        product: string;
        warehouse: string;
        providerLot: string;
        /** Zona 4 (TASK-FE-1044). */
        classification: string;
      };
      hints: {
        measurementAutoFilled: string;
        totalAmountFormula: string;
        averageCostFormula: string;
      };
      /** Zona 4 (TASK-FE-1044) — rótulos das 21 opções de `drink` (`drinkIndex`,
       *  jargão de classificação de bebida/qualidade de xícara do Café,
       *  `agro365/app/ItemInvoice.php::drinks()`). Texto IDÊNTICO nos 3 idiomas
       *  (jargão técnico não se traduz, mesma grafia do legado). */
      drinkOptions: {
        extMole: string;
        mole: string;
        duroMais: string;
        duro: string;
        duroVerde: string;
        duroSujo: string;
        duroFrtd: string;
        duro1Riada: string;
        duro2Riadas: string;
        duro3Riadas: string;
        duro4Riadas: string;
        duroRiado: string;
        riado: string;
        d1ri1rio: string;
        d1ri2rio: string;
        d2ri1rio: string;
        dRiRio: string;
        riadoRio: string;
        rio: string;
        rioZona: string;
        rioZonal: string;
      };
      validation: {
        quantityRequired: string;
        quantityMin: string;
        quantityMax: string;
        amountRequired: string;
        amountMin: string;
        amountMax: string;
        totalMax: string;
        providerLotRequired: string;
        providerLotMaxLength: string;
        expirationDateRequired: string;
      };
      duplicateAlert: {
        title: string;
        dismissAction: string;
      };
      errors: {
        invalidFields: string;
      };
    };
    /** Detalhe (view) — TASK-FE-1045. */
    detail: {
      pageTitle: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: {
        back: string;
        edit: string;
      };
    };
    /** Ações de Excel no header da listagem (TASK-FE-1047) — download de
     *  modelo + import + export, V3 blob síncrono, mirror `ModulePlanAccounts.
     *  planAccount.excel` (ver nota de topo do arquivo p/ as 2 diferenças
     *  estruturais). */
    excel: {
      downloadTemplate: string;
      export: string;
      downloadTemplateError: string;
      exportError: string;
      import: {
        menuLabel: string;
        title: string;
        subtitle: string;
        instructions: string;
        warning: {
          title: string;
          description: string;
        };
        downloadShortcut: string;
        fileUpload: {
          label: string;
          hint: string;
          dropzoneTitle: string;
          dropzoneDraggingTitle: string;
          changeLabel: string;
          removeLabel: string;
          errorTypeMessage: string;
          errorSizeMessage: string;
        };
        cancelButton: string;
        submitButton: string;
        importSuccessToast: string;
        /** Correção do Executor (2026-07-31, TASK-FE-1047): o payload real
         *  de `OpeningBalanceImportResultData.php` é `{ imported, errors }`
         *  — nunca `created`/`updated` (presunção anterior errada, mesma
         *  classe de bug das outras 8 divergências desta execução). */
        result: {
          imported: string;
        };
        rowErrors: {
          title: string;
          /** Prefixo "Linha {row}:" montado no client (`{row}` substituído pelo número real). */
          rowPrefix: string;
        };
        closeButton: string;
      };
    };
  };
}
