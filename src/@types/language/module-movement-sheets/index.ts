// src/@types/language/module-movement-sheets/index.ts
// Interface de tradução do módulo "Importação Mov. Bancários" (MovementSheet —
// Financeiro, F-112, 97-Esteiras/064). Mirror estrutural de
// `module-correcao-estoque` (mesmo mode_matrix: index+show+import, SEM
// create/edit/delete unitário). O conteúdo mora em
// src/constants/languages/{idioma}/languageMovementSheets.ts.
//
// TASK-064-MOV-FE-01 (listagem + filtro + roteamento) cobre `list` + `filter`.
// TASK-064-MOV-FE-02 ACRESCENTA `importModal`, TASK-064-MOV-FE-03 ACRESCENTA
// `detail` — sem reescrever o que já existir.
//
// `detail` é mirror de `ModuleCorrecaoEstoque.stockCorrection.detail`, SEM
// `sections.items`/`table.*`/`itemsEmpty.*` — `MovementSheetResource` não
// expõe array de itens, então não há seção equivalente (não fabricar uma
// seção vazia por simetria com o precedente, decisão do roteiro §Tarefas
// TASK-064-MOV-FE-03).

export interface ModuleMovementSheets {
  movementSheet: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      /** Rótulo do botão que abre o modal de import (`HeaderTable`). O
       *  CONTEÚDO do modal (`importModal.*`) é acrescentado na TASK-064-MOV-FE-02. */
      importButtonLabel: string;
      table: {
        code: string;
        /** Rótulo CORRETO (decisão 2, CLM-19 corrigida) — vinculado ao campo `date`, nunca ao usuário. */
        date: string;
        /** Rótulo CORRETO (decisão 2, CLM-19 corrigida) — vinculado ao campo `user.name`, nunca à data. */
        user: string;
        createdAt: string;
        actions: {
          viewDetail: string;
        };
      };
      /** Sem CTA de criação — não existe rota de cadastro unitário, único ponto de criação é a importação de planilha. */
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
    };
    filter: {
      title: string;
      startDate: string;
      endDate: string;
      dateRangeInvalid: string;
    };
    /** Modal de importação de planilha (ABORT-ALL) — mirror
     *  `ModuleCorrecaoEstoque.stockCorrection.importModal`/`languageRainfalls.rainfall.import`.
     *  Resultado (`result.*`) mostra `imported` (contagem) + `movementSheet.code` (recibo do
     *  lote gerado) — NÃO os 3 blocos created/updated/deleted/preserved (não existem neste
     *  contrato) nem `rows_processed` (StockCorrection não se aplica aqui). */
    importModal: {
      title: string;
      subtitle: string;
      downloadShortcut: string;
      instructions: string;
      warning: {
        title: string;
        description: string;
      };
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
      rowErrors: {
        title: string;
      };
      result: {
        importedLabel: string;
        movementSheetCodeLabel: string;
      };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      importSuccessToast: string;
      downloadTemplateError: string;
    };
    /** Detalhe read-only (TASK-064-MOV-FE-03) — mirror
     *  `ModuleCorrecaoEstoque.stockCorrection.detail`, SEM seção de itens
     *  (Resource não expõe array de itens nesta feature). */
    detail: {
      sections: {
        identification: string;
      };
      fields: {
        code: string;
        date: string;
        user: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
      noData: string;
      backButton: string;
    };
  };
}
