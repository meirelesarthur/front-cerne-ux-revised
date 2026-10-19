// src/@types/language/module-products/index.ts
// Interface de tradução do módulo de PRODUTOS (Product — Cadastros Base /
// Estrutura / "Catálogo", execução 025). TASK-FE-500 entregou
// `singularLabel`/`pluralLabel`/`form.validation.*`. TASK-FE-502 (tela de
// listagem) ACRESCENTA `list`/`filter` (aditivo, mesmo padrão incremental de
// `ModulePackages`, que nasceu só com `form` e ganhou `list`/`filter`
// depois). `form.fields`/`form.title`/etc. (identificação/estoque) seguem
// responsabilidade de `TASK-FE-503`/`504`.
// O conteúdo mora em src/constants/languages/{idioma}/languageProducts.ts.

export interface ModuleProducts {
  product: {
    singularLabel: string;
    pluralLabel: string;
    form: {
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        lasPriceRequired: string;
        lasPriceMin: string;
        activePrincipleMaxLength: string;
        secondMeasurementRequiredWithFactor: string;
        factorTypeRequiredWithFactor: string;
        factorRequiredWithSecondMeasurement: string;
        ncmRequiredForProductionGroup: string;
        cultivationRequiredForProductionGroup: string;
        qualityMaxLength: string;
        qualityOnlyForProductionGroup: string;
        /** Mensagem GENÉRICA de `max()` reutilizada por TODOS os campos
         *  string do bloco fiscal (`TASK-FE-507`, ~40 campos) — só
         *  tipo/tamanho (`GAP-BE-232`, escopo reduzido), nenhuma mensagem
         *  específica por campo (o tamanho já aparece no `maxLength` do
         *  próprio `Input`/`InputMask`, não precisa repetir aqui). */
        fiscalStringMaxLength: string;
        percentageRange100: string;
      };
      /** Casca do formulário (`CreateOrUpdateProduto.tsx`, `TASK-FE-503`/`504`/`507`)
       *  — título/subtítulo por modo + rótulo das 3 abas ("Identificação",
       *  "Estoque e Financeiro" e "Fiscal", esta última acrescentada por
       *  `TASK-FE-507`). */
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: { identification: string; stockFinancial: string; fiscal: string };
      /** Campos da Aba 1 (Identificação/Classificação) + Aba 2 (Estoque e
       *  Financeiro, `TASK-FE-504`, aditivo no MESMO objeto — convenção já
       *  usada por este arquivo, sem namespace por aba). */
      fields: {
        description: string;
        code: string;
        measurement: string;
        group: string;
        category: string;
        kind: string;
        isEnabled: string;
        isEquipment: string;
        hasLot: string;
        ncm: string;
        // -- Aba 2 (TASK-FE-504) --
        minStock: string;
        controlStock: string;
        lasPrice: string;
        averageCost: string;
        secondMeasurement: string;
        factorType: string;
        factorTypeMultiply: string;
        factorTypeDivide: string;
        factor: string;
        activePrinciple: string;
        financialCategory: string;
        defaultWarehouse: string;
        defaultCostCenter: string;
        addressing: string;
        taxRule: string;
        cultivation: string;
        quality: string;
        packages: string;
        // -- Aba 3 "Fiscal" (~40 campos, TASK-FE-507) — Fiscal Clássico --
        isFiscal: string;
        allowPointing: string;
        reference: string;
        barcode: string;
        cfopSaidaInterno: string;
        cfopSaidaExterno: string;
        cstCsosn: string;
        cstCsosnExp: string;
        cstPis: string;
        cstCofins: string;
        cstIpi: string;
        percIcms: string;
        percPis: string;
        percCofins: string;
        percIpi: string;
        percentReduction: string;
        motDesIcms: string;
        motDesIcmsHint: string;
        percDif: string;
        percDifHint: string;
        percFcp: string;
        percFcpHint: string;
        origem: string;
        cest: string;
        modalityBc: string;
        cenqIpi: string;
        cbenef: string;
        // -- Reforma Tributária (IBS/CBS/IS) --
        cClassTrib: string;
        cstIbsCbs: string;
        percIbsUf: string;
        percIbsMun: string;
        percReducaoAliqIbsUf: string;
        percReducaoAliqIbsMun: string;
        percDifIbsUf: string;
        percDifIbsMun: string;
        percCbs: string;
        percReducaoAliqCbs: string;
        percDifCbs: string;
        cstIs: string;
        percIs: string;
        percIsEspec: string;
        uTribIs: string;
        adRemIbs: string;
        adRemCbs: string;
        // -- Zona Franca de Manaus / Doação --
        tpCredPresIbsZfm: string;
        indDoacao: string;
      };
      placeholders: {
        code: string;
        description: string;
        measurement: string;
        group: string;
        category: string;
        categoryDisabledHint: string;
        kind: string;
        kindDisabledHint: string;
        ncm: string;
        // -- Aba 2 (TASK-FE-504) --
        secondMeasurement: string;
        factorType: string;
        financialCategory: string;
        defaultWarehouse: string;
        defaultCostCenter: string;
        addressing: string;
        taxRule: string;
        cultivation: string;
        quality: string;
        // -- Aba 3 "Fiscal" (TASK-FE-507) — só os Selects de catálogo --
        cstCsosn: string;
        cstCsosnExp: string;
        cstPis: string;
        cstCofins: string;
        cstIpi: string;
        origem: string;
        modalityBc: string;
        cstIbsCbs: string;
        tpCredPresIbsZfm: string;
      };
      hints: {
        ncmSearchMinLength: string;
        ncmRequiredForProductionGroup: string;
        codeGeneratedByServer: string;
        isEquipment: string;
        // -- Aba 2 (TASK-FE-504) --
        cultivationRequiredForProductionGroup: string;
        cultivationDisabledOutsideProductionGroup: string;
        qualityDisabledOutsideProductionGroup: string;
        packagesDisabledOutsideProductionGroup: string;
        averageCostReadOnly: string;
        /** Aba 3 "Fiscal" (`TASK-FE-960`) — `helperText` de `tax_rule_uuid`
         *  enquanto `is_fiscal !== true` (gate condicional). */
        taxRuleRequiresFiscalProduct: string;
        /** GAP-BE-630/DF-13 (TASK-FE-653/InvoiceItemsTab "+ Criar Produto")
         *  — hint SÓ quando a criação chegou via query param a partir de um
         *  item de XML não casado; nunca sobrescreve `ncmSearchMinLength`/
         *  `ncmRequiredForProductionGroup` quando ausente. */
        ncmXmlSuggestionPrefix: string;
        descriptionXmlOrigin: string;
      };
      /** Autofill fiscal pela Regra Fiscal (`TASK-FE-949`/`950`) — fundação
       *  criada aqui, consumida pelo `onChange` do Select `tax_rule_uuid`
       *  em `TASK-FE-950`. */
      toasts: {
        taxRuleAutofillApplied: string;
      };
      /** Idem acima — mensagem de erro do autofill fiscal. */
      errors: {
        taxRuleAutofillFailed: string;
        /** Wizard de abas (`TASK-FE-961`) — toast do `onInvalid` do submit
         *  final quando o 1º campo com erro está numa aba diferente da
         *  atual (navegação livre por clique permite chegar ao "Salvar" sem
         *  ter passado pela validação por aba do "Próximo"). */
        invalidFieldsOtherTab: string;
        /** Idem acima — variante quando o 1º campo com erro está na PRÓPRIA
         *  aba atual (`TASK-FE-995`, blindagem do `onInvalid` — sem esta
         *  chave o toast ficava mudo quando o erro só existia na aba
         *  Fiscal, única com o botão "Salvar"). */
        invalidFieldsCurrentTab: string;
      };
      /** Seções (Heading + Box com borda) da Aba 3 "Fiscal" (`TASK-FE-507`) —
       *  mirror `CreateOrUpdateRegraFiscal.tsx` (mesmo domínio de campos,
       *  reaproveitado por `Product-contrato.md` D9). */
      fiscalSections: {
        classic: string;
        taxReform: string;
        zfmDonation: string;
      };
      /** `CheckboxListField` de `product_package_uuids` (pivot Embalagens,
       *  `TASK-BE-506`/`GAP-BE-230`) — mirror `ModuleCadastrosBaseAccount`
       *  `form.farms`/`form.proprietaries`. */
      packagesField: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
    };
    /** Listagem paginada (`TASK-FE-502`) — 6 colunas + estados de UI. Sem
     *  "Tipo" (não existe em `Product`, contrato §5.2/5.3) e sem "Excluir"
     *  (`DELETE /products` não existe, contrato §3.2). */
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        description: string;
        group: string;
        category: string;
        kind: string;
        kindEmpty: string;
        minStock: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        view: string;
        edit: string;
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
      /** Guarda de fazenda ativa (`farm.context` estrito, catálogo
       *  tenant-wide) — mesmo padrão de `ModulePackages.list.noFarmSelected`. */
      noFarmSelected: {
        title: string;
        description: string;
      };
    };
    /** Drawer de filtro (`FilterSideCatalogo.tsx`) — 6 campos combináveis em
     *  AND, cascata real Grupo→Categoria→Classe. Sem filtro de Status
     *  (`is_enabled`) — diferente da referência UX, fiel ao legado (contrato
     *  §3.2). */
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      group: string;
      groupAll: string;
      category: string;
      categoryAll: string;
      categoryDisabledHint: string;
      kind: string;
      kindAll: string;
      kindDisabledHint: string;
      hasLot: string;
      hasLotAll: string;
      hasLotOptions: { yes: string; no: string };
      isEquipment: string;
      isEquipmentAll: string;
      isEquipmentOptions: { yes: string; no: string };
      isFiscal: string;
      isFiscalAll: string;
      isFiscalOptions: { yes: string; no: string };
    };
    /** Tela de DETALHE view-only (`ProdutoDetalhe.tsx`, `TASK-FE-505`) — mirror
     *  estrutural da Referência UX (`GB.Cerne.UX/.../ProdutoDetalhe.tsx`).
     *  Rótulos de campo são REAPROVEITADOS de `form.fields`/`form.tabs`
     *  (mesma estrutura visual do form, só em modo leitura) — este bloco só
     *  acrescenta o que não existe em nenhum outro lugar do bundle. */
    detail: {
      /** Prefixo do subtítulo do cabeçalho (`"${subtitlePrefix} ${code} · ${group}"`). */
      subtitlePrefix: string;
      /** Fallback de valor ausente (mirror do "Não informado" da Referência UX). */
      notInformed: string;
      /** `package_uuids` vazio (produto sem embalagem vinculada). */
      packagesEmpty: string;
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
