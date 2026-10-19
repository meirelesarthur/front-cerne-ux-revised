// src/@types/language/module-document/index.ts
// Interface de tradução do módulo COMPARTILHADO de Documentos Anexos
// (Document) — TASK-FE-036-337/338. Namespace ISOLADO (não misturado dentro de
// `ModuleIncomes`/`ModuleExpenses`) porque é consumido pelos 2 segmentos
// (Contas a Receber E Contas a Pagar). Conteúdo mora em
// src/constants/languages/{idioma}/languageDocument.ts.

export interface ModuleDocument {
  /** Painel compartilhado (Tarefa 338) — lista + upload + remoção num único bloco. */
  panel: {
    title: string;

    list: {
      columns: {
        description: string;
        date: string;
      };
      downloadLabel: string;
      removeAction: string;
      /** Texto NEUTRO — o documento pode estar compartilhado com outro título e sobreviver ao `detach` (Tarefa 337). */
      removeConfirmTitle: string;
      removeConfirmDescription: string;
      removedToast: string;
      emptyState: {
        title: string;
        description: string;
      };
    };

    upload: {
      sectionTitle: string;
      fields: {
        description: string;
        date: string;
      };
      placeholders: {
        description: string;
      };
      submitButton: string;
      uploadedToast: string;
      /** Textos i18n do `FileUpload` (mirror `InvoiceXmlUploadModal.tsx`). */
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
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
}
