import type { ImageEditorStrings } from '@/components/ui/ImageEditorDialog';
// src/@types/language/module-farms/index.ts
// Interface de tradução do módulo administrativo de FAZENDAS (Farm —
// Cadastros Base, execução 024). Espelha a convenção de module-cost-centers/
// module-family-equipments. O conteúdo mora em
// src/constants/languages/{idioma}/languageFazendas.ts.
//
// TASK-FE-400 (stub estrutural) → TASK-FE-401 (list/filter) → TASK-FE-402/403
// (form, wizard 5 steps + upload de logo + centros de custo).

export interface ModuleFarms {
  farm: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** TASK-072-FE-11 — aviso exibido após o redirect do guard "contratante sem fazenda". */
      noFarmNotice: string;
      table: {
        description: string;
        city: string;
        explorationType: string;
        totalArea: string;
        tenant: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        /** "Adicionar Área" (menu da Fazenda, SURF-04) — TASK-FE-416, destino
         *  `TASK-FE-419`/`420`. */
        addArea: string;
        /** "Adicionar Múltiplas Áreas" (menu da Fazenda, SURF-05) —
         *  TASK-FE-416, destino `TASK-FE-421`. */
        addMultipleAreas: string;
      };
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
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      tenantId: string;
      tenantIdPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      steps: {
        identificacao: string;
        documentacao: string;
        endereco: string;
        /** Etapa 4/6 (GAP-FE-121 reaberto, `TASK-FE-410`) — mapa/desenho de polígono. */
        demarcacao: string;
        financeiro: string;
        configuracoes: string;
      };
      /** Título do cabeçalho de cada etapa (o stepper usa `steps`, curto). */
      stepsTitle: {
        identificacao: string;
        documentacao: string;
        endereco: string;
        demarcacao: string;
        financeiro: string;
        configuracoes: string;
      };
      /** Subtítulo de cada etapa do wizard (TASK-FE-406 — fidelidade ao `StepHeader` do `cerne`). */
      stepsSubtitle: {
        identificacao: string;
        documentacao: string;
        endereco: string;
        demarcacao: string;
        financeiro: string;
        configuracoes: string;
      };
      footer: {
        back: string;
        next: string;
        save: string;
        /** Contador de etapa do rodapé (`FarmFormShell`, TASK-FE-408 — ex.: "Etapa 2 de 5"). */
        stepCounter: {
          label: string;
          of: string;
        };
      };
      /** Label do botão "X" de fechar no cabeçalho do `FarmFormShell` (GAP-FE-128). */
      close: string;
      fields: {
        description: string;
        descriptive: string;
        nif: string;
        phone: string;
        image: string;
        tenantId: string;
        explorationType: string;
        car: string;
        nirf: string;
        ccir: string;
        cafir: string;
        caepf: string;
        stateRegistration: string;
        countryId: string;
        zipCode: string;
        city: string;
        district: string;
        number: string;
        latitude: string;
        longitude: string;
        coin: string;
        totalArea: string;
        valueHa: string;
        rate: string;
        isEnabled: string;
        useCashBook: string;
        costProcessingDate: string;
        controlSuppliesStock: string;
        note: string;
        centers: string;
      };
      placeholders: {
        description: string;
        descriptive: string;
        latitude: string;
        longitude: string;
        centersSearch: string;
      };
      hints: {
        imageAccepted: string;
        imageMaxSize: string;
        tenantIdCreateOnly: string;
        centers: string;
      };
      explorationTypeOptions: {
        individual: string;
        condominium: string;
        leased: string;
        partnership: string;
        loan: string;
        others: string;
      };
      coinOptions: {
        real: string;
      };
      yesNoOptions: {
        yes: string;
        no: string;
      };
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
        editor: ImageEditorStrings;
      };
      centersField: {
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      /** Etapa Demarcação — mapa Leaflet + `leaflet-draw` (GAP-FE-121 reaberto, `TASK-FE-411`/`TASK-FE-412`). */
      demarcacao: {
        mapHint: string;
        noPerimeter: string;
        perimeterDefinedLabel: string;
        areaUnit: string;
        importButton: string;
        importInProgress: string;
        importSuccessToast: string;
        importErrorToast: string;
        importInvalidExtension: string;
      };
      toasts: {
        createdSuccess: string;
        updatedSuccess: string;
        deletedSuccess: string;
        /** TASK-072-FE-09 — falha ao ativar a fazenda recém-criada (não bloqueia). */
        activateFailed: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        descriptiveRequired: string;
        descriptiveMaxLength: string;
        phoneRequired: string;
        countryIdRequired: string;
        zipCodeRequired: string;
        districtRequired: string;
        coinRequired: string;
        totalAreaRequired: string;
        valueHaRequired: string;
        costProcessingDateRequired: string;
        costProcessingDateRange: string;
        nifInvalid: string;
      };
    };
  };
}
