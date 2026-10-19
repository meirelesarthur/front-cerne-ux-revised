// src/@types/language/module-rastreabilidade/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo RASTREABILIDADE (Traceability +
// TraceabilityConfig — Operacional > Agricultura, F-067). Mirror
// `module-carregamentos` (2 entidades sob o mesmo módulo, mesma convenção de
// `singularLabel`/`pluralLabel`/`list`/`form`). TASK-TR-FE-02 (fundação i18n —
// consumida por TODAS as telas desta feature, `TASK-TR-05..11`).
//
// Namespace `rastreabilidade` — LIVRE, sem colisão com nenhum bloco existente.
//
// Cobre as 2 superfícies do contrato de tela
// (`CONTRATO-TELA-F067-produtos-rastreabilidade.md`):
//   - `traceability`      ("Produtos", `## 4`, 42 campos do form + listagem +
//                          galeria + etiqueta)
//   - `traceabilityConfig` ("Configuração", `## 5`, 13 campos do form + listagem)
//
// Rótulos dos CAMPOS seguem o `field_manifest` FD-01..FD-56 do contrato legado
// (`LEGACY-CONTRACT-F067-produtos-rastreabilidade.md`), com i18n real para os 6
// grupos que eram hardcoded/sem tradução no legado (name_en/es, description_en/
// es, gross_weight, barcode, campos de exportador, placeholder de
// `proprietary_id`) — MELHORIA sobre o legado, não mudança de contrato de dado
// (ficha `## Leitura do dev`, "Risco + solução").
//
// TASK-TR-PUB-FE-01 (fundação da página PÚBLICA de rastreio, F-067, `97-
// Esteiras/058`) acrescenta o 3º bloco `rastreioPublico` — sibling de
// `traceability`/`traceabilityConfig`, tela standalone fora do menu
// autenticado, tipos em `./rastreio-publico.d.ts` (`CONTRATO-TELA-F067-
// rastreio-publico.md ## 4`).
// -----------------------------------------------------------------------------

import type { RastreioPublicoLanguage } from './rastreio-publico';

export interface ModuleRastreabilidade {
  titleModule: string;

  // ============================================
  // Produtos (Traceability) — `## 4` do contrato de tela.
  // ============================================
  traceability: {
    singularLabel: string;
    pluralLabel: string;
    createTitle: string;
    editTitle: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** Colunas na ORDEM do legado (`list_manifest` LM-01..07). */
      table: {
        product: string;
        namePt: string;
        trackingCode: string;
        harvestedIn: string;
        area: string;
        producer: string;
        packing: string;
        actions: string;
      };
      /** `action_manifest` AM-01..06, 14, 15. */
      actions: {
        new: string;
        view: string;
        edit: string;
        delete: string;
        gallery: string;
        tagPt: string;
        tagEn: string;
        tagEs: string;
      };
      /** `filter_manifest` FM-01..03. */
      filter: {
        title: string;
        harvestedIn: string;
        product: string;
        trackingCode: string;
        filterButton: string;
        clearButton: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
      deleteDialog: {
        title: string;
        descriptionTemplate: string;
      };
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      /** Títulos das `FormSection` (contrato de tela `## 4.2`). */
      sections: {
        identification: string;
        aboutProduct: string;
        nutritionalInfo: string;
        exporter: string;
        areaAvailability: string;
        map: string;
      };
      /** Rótulos dos 42 campos, `field_manifest` FD-02..FD-43 (`farm_id`
       *  FD-01, `stored_areas` FD-39 e `coordinates` FD-43 NÃO têm rótulo —
       *  ausentes do contrato novo, ver divergência documentada em
       *  `@types/v2/Rastreabilidade/traceability/index.d.ts`). */
      fields: {
        product: string;
        traceabilityConfig: string;
        harvestedIn: string;
        packing: string;
        grossWeight: string;
        trackingCode: string;
        trackingCodeGeneratedPlaceholder: string;
        namePt: string;
        nameEn: string;
        nameEs: string;
        descriptionPt: string;
        descriptionEn: string;
        descriptionEs: string;
        energeticValue: string;
        energeticValuePerc: string;
        carbohydrates: string;
        carbohydratesPerc: string;
        proteins: string;
        proteinsPerc: string;
        fatTotal: string;
        fatTotalPerc: string;
        fatSaturated: string;
        fatSaturatedPerc: string;
        fatTrans: string;
        fatTransPerc: string;
        dietaryFiber: string;
        dietaryFiberPerc: string;
        sodium: string;
        sodiumPerc: string;
        barcode: string;
        exporterName: string;
        exporterAddress: string;
        exporterZipCode: string;
        exporterCity: string;
        exporterState: string;
        exporterCountry: string;
        area: string;
        lotNumber: string;
        lotNumberGeneratedPlaceholder: string;
        boxQuantity: string;
        availability: string;
        map: string;
      };
      /** ADITIVO (TASK-TR-FE-06, widget `AvailabilityMonthsPicker.tsx`,
       *  `IG-05`) — rótulos dos 12 meses do widget de Disponibilidade
       *  (`availability`). Ausentes da fundação original (TASK-TR-FE-02);
       *  extensão aditiva, sem alterar nenhuma chave existente. */
      availabilityMonths: {
        january: string;
        february: string;
        march: string;
        april: string;
        may: string;
        june: string;
        july: string;
        august: string;
        september: string;
        october: string;
        november: string;
        december: string;
      };
      /** ADITIVO (TASK-TR-FE-10, ampliado no fix de fidelidade do mapa) —
       *  widget de mapa dirigido pelo Produtor/Configuração selecionado
       *  (mirror `mapBuild()` legado: pastos + cerca + marcador). `emptyState`
       *  cobre tanto "nenhum Produtor selecionado" quanto "Produtor
       *  selecionado sem nenhum dado geográfico"; `errorState` cobre falha na
       *  busca do farm-context (`GET /traceability-configs/{uuid}/farm-
       *  context`), com retry (mirror `baseRegistrations.grazing.map.
       *  errorState`). */
      map: {
        emptyState: {
          title: string;
          description: string;
        };
        errorState: {
          title: string;
          description: string;
          retry: string;
        };
      };
      /** ADITIVO (TASK-TR-FE-06) — guarda de saída sem salvar, mirror
       *  `module-budgets`. */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      saveButton: string;
      cancelButton: string;
      businessErrorFallback: string;
      notFound: string;
    };
    /** Galeria de imagens (`.../{uuid}/galery`, `## 4.3`). */
    gallery: {
      title: string;
      uploadButton: string;
      removeButton: string;
      removeConfirm: {
        title: string;
        message: string;
      };
      emptyState: string;
      savedToast: string;
      removedToast: string;
      errorType: string;
      /** ADITIVO (TASK-TR-FE-07) — mirror `errorSizeMessage` de `ImageUpload`
       *  (`mimes:jpeg,png,jpg,gif,svg`, `max:2048` KB — `TraceabilityGaleryRequest`). */
      errorSize: string;
      /** ADITIVO (TASK-TR-FE-07) — estado de erro da query da galeria, mirror
       *  `traceability.list.error`. */
      error: {
        message: string;
        retry: string;
      };
    };
    /** Etiqueta PDF ×3 idiomas (`## 4.4`). */
    tag: {
      buttonPt: string;
      buttonEn: string;
      buttonEs: string;
    };
  };

  // ============================================
  // Configuração (TraceabilityConfig) — `## 5` do contrato de tela.
  // ============================================
  traceabilityConfig: {
    singularLabel: string;
    pluralLabel: string;
    createTitle: string;
    editTitle: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** Colunas `list_manifest` LM-08..11 — última coluna CORRIGIDA para
       *  "Ações" (fecha D05, bug de tradução do legado, `## 5.1` do
       *  contrato de tela). */
      table: {
        name: string;
        cpfCnpj: string;
        address: string;
        city: string;
        actions: string;
      };
      actions: {
        new: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
      deleteDialog: {
        title: string;
        descriptionTemplate: string;
      };
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      /** ADITIVO (TASK-TR-FE-09) — subtítulo da casca, mirror
       *  `traceability.form.subtitle`. */
      subtitle: {
        create: string;
        edit: string;
      };
      /** ADITIVO (TASK-TR-FE-09) — título da `FormSection` única (contrato de
       *  tela `## 5.2`, "1 seção, mais simples"). */
      sections: {
        general: string;
      };
      /** Rótulos dos 13 campos, `field_manifest` FD-44..FD-56. `farm`
       *  permanece como rótulo de EXIBIÇÃO (leitura, `TraceabilityConfigData.
       *  farm`) — não é campo editável do form novo (divergência documentada
       *  em `@types/v2/Rastreabilidade/traceability-config/index.d.ts`). */
      fields: {
        farm: string;
        proprietary: string;
        name: string;
        cpfCnpj: string;
        address: string;
        number: string;
        district: string;
        city: string;
        phone: string;
        email: string;
        logo: string;
        whatsappFone: string;
        whatsappTexto: string;
      };
      /** ADITIVO (TASK-TR-FE-09) — mirror `ImageUpload` texts já usados em
       *  `Fazendas`/`FamilyEquipments` (upload de logo, `## 5.2`). */
      logoUpload: {
        hint: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      /** ADITIVO (TASK-TR-FE-09) — guarda de saída sem salvar, mirror
       *  `traceability.form.unsavedChangesDialog`. */
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
      saveButton: string;
      cancelButton: string;
      businessErrorFallback: string;
      notFound: string;
    };
  };

  // ============================================
  // Rastreio Público (página standalone, sem login) — `CONTRATO-TELA-F067-
  // rastreio-publico.md ## 4`. TASK-TR-PUB-FE-01 (fundação).
  // ============================================
  rastreioPublico: RastreioPublicoLanguage;
}
