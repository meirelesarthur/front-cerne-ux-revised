// src/@types/language/module-equipments/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo INVENTÁRIO (Equipment — Cadastros Base /
// Bens-Ativos, execução 026, TASK-FE-1002). Mirror estrutural de
// `ModuleProducts` (execução 025, precedente mais aderente ao padrão atual
// para formulário grande com abas + bloco fiscal condicional — ver
// Equipment-Frontend-Contrato.md §2).
//
// `singularLabel`/`pluralLabel` alimentam `queryKey.equipments.*`
// (TASK-FE-1001, convenção canônica derivada da tradução — NUNCA string
// literal). `list`/`filter`/`form.fields`/`form.validation` cobrem os 43+
// campos físicos do contrato (§6) organizados nas 5 abas do formulário:
// Identificação, Financeiro/Depreciação, Fiscal/Veículo, Rateio (Centro de
// Custo) e Anexos. O conteúdo mora em
// src/constants/languages/{idioma}/languageEquipments.ts.
//
// Rótulos fiéis ao legado: `trad.inventario`="Inventário"/"Inventory"/
// "Inventario" (singularLabel/pluralLabel) e `trad.iv_inventario` idem
// (heading da tela, `list.pageTitle`). Rótulo de MENU (`cad-ben-inv`) já
// existe em `languageSidebar.ts` — NÃO duplicado aqui.
// -----------------------------------------------------------------------------

export interface ModuleEquipments {
  equipment: {
    singularLabel: string;
    pluralLabel: string;

    // ============================================
    // LISTAGEM (TASK-FE-1004)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        description: string;
        family: string;
        proprietary: string;
        status: string;
        statusActive: string;
        statusInactive: string;
        vlAcquisition: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
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
      /** Guarda de fazenda ativa (`farm.context` ESTRITO, contrato §12/D-EQ.). */
      noFarmSelected: {
        title: string;
        description: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        confirmLabel: string;
        cancelLabel: string;
      };
      toasts: {
        deleteSuccess: string;
      };
    };

    // ============================================
    // FILTRO (drawer, 5 campos — §5)
    // ============================================
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      family: string;
      familyAll: string;
      proprietary: string;
      proprietaryAll: string;
      startDate: string;
      endDate: string;
      apply: string;
      clear: string;
    };

    // ============================================
    // FORMULÁRIO (5 abas, TASK-FE-1005..1009)
    // ============================================
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: {
        identification: string;
        financialDepreciation: string;
        fiscalVehicle: string;
        costCenterApportionment: string;
        attachments: string;
      };
      /** ⚠️ ADITIVO (correção E2E do dev, execução 026) — wizard
       *  Voltar/Próximo no rodapé do formulário (mirror `ModuleFarms.
       *  farm.form.footer`/`ModulePeople.person.form.footer`, só os 2
       *  campos que este arquivo usa — "Salvar" continua vindo de
       *  `languageGB.defaltStrings.save`, comportamento pré-existente,
       *  não duplicado aqui). */
      footer: {
        back: string;
        next: string;
      };
      fields: {
        // -- Aba 1: Identificação --
        family: string;
        description: string;
        specification: string;
        model: string;
        patrimony: string;
        product: string;
        status: string;
        statusActive: string;
        statusInactive: string;
        image: string;
        code: string;
        features: string;
        featureFuelSupply: string;
        featureMaintenance: string;
        featureBatch: string;
        featureAppropriation: string;
        equipmentType: string;
        equipmentTypeOwn: string;
        equipmentTypeOutsourced: string;

        // -- Aba 2: Financeiro/Depreciação --
        vlTimeProductive: string;
        provider: string;
        dtAcquisition: string;
        vlAcquisition: string;
        hourMeter: string;
        yearMod: string;
        hasDepreciation: string;
        hasDepreciationYes: string;
        hasDepreciationNo: string;
        lifeBens: string;
        depreciationType: string;
        depreciationTypeWithResidual: string;
        depreciationTypeWithoutResidual: string;
        residual: string;
        vlResidual: string;
        vlDepreciate: string;
        depreciation: string;

        // -- Aba 3: Fiscal/Veículo --
        useFiscal: string;
        useFiscalYes: string;
        useFiscalNo: string;
        chassi: string;
        renavam: string;
        serie: string;
        plate: string;
        color: string;
        uf: string;
        brand: string;
        rntrc: string;
        type: string;
        bodyType: string;
        wheelType: string;
        tara: string;
        capacity: string;
        ownerType: string;
        ownerTypePhysical: string;
        ownerTypeLegal: string;
        ownerDocument: string;
        ownerName: string;
        ownerIe: string;
        ownerUf: string;
        ownerTp: string;

        // -- Aba 4: Rateio Centro de Custo --
        costCenter: string;
        percentage: string;

        // -- Aba 5: Anexos --
        attachmentName: string;
        attachmentFile: string;
      };
      placeholders: {
        family: string;
        product: string;
        provider: string;
        uf: string;
        ownerUf: string;
        costCenter: string;
      };
      /** ⚠️ ADITIVO (TASK-FE-1007) — labels dos 4 catálogos estáticos do bloco
       *  Fiscal/Veículo (`Equipment::opTypes()`/`opBodyTypes()`/
       *  `opWheelTypes()`/`opOwnerTypes()`, códigos fixos do legado, `agro365`
       *  `app/Equipment.php` linhas 168-248). Chaves = código cru persistido
       *  (mesma convenção do valor RAW em `EquipmentForm.type`/`body_type`/
       *  `wheel_type`/`owner_tp`) — consumido só pelas fábricas de opções em
       *  `@/constants/cadastrosBase/equipment/equipment-fiscal-catalogs.ts`
       *  (mirror `markerTypeOptions`). NÃO editar os barris (`index.d.ts`/
       *  `languageXxYy/index.ts`) — só este arquivo/módulo, aditivo. */
      fiscalCatalogs: {
        type: Record<
          | '02'
          | '03'
          | '04'
          | '05'
          | '06'
          | '07'
          | '08'
          | '10'
          | '11'
          | '13'
          | '14'
          | '17'
          | '18'
          | '19'
          | '20'
          | '21'
          | '22'
          | '23'
          | '24'
          | '25',
          string
        >;
        bodyType: Record<'00' | '01' | '02' | '03' | '04', string>;
        wheelType: Record<'01' | '02' | '03' | '04' | '05' | '06', string>;
        ownerTp: Record<0 | 1 | 2, string>;
      };
      hints: {
        codeGeneratedByServer: string;
        equipmentTypeLockedByFamily: string;
        frozenByDepreciation: string;
        fiscalBlockDisabled: string;
      };
      /** ⚠️ CORREÇÃO (TASK-FE-1005): bloco ausente na entrega original da
       *  `TASK-FE-1002` — necessário para `@/components/Form/ImageUpload`
       *  (campo `image`, RN-9, contrato §6/§8), mirror EXATO de
       *  `languageGB.familyEquipments.familyEquipment.form.image` (mesmo
       *  componente, mesmas 6 chaves). Adicionado de forma aditiva. */
      image: {
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        removeLabel: string;
        errorType: string;
        errorSize: string;
      };
      /** Cascas de seção (Heading + Box) das abas 3/4/5. */
      sections: {
        costCenterApportionmentSum: string;
      };
      costCenterRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
      };
      attachmentRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        defaultName: string;
        /** ⚠️ ADITIVO (TASK-FE-1009) — textos do `FileUpload` por linha de
         *  anexo (3 estados: vazio/novo-arquivo/já-existente, mirror
         *  `FileUpload.tsx`). `clearFileLabel` é DISTINTO de `removeButton`
         *  (que remove a LINHA inteira do `useFieldArray`): limpa só o
         *  arquivo recém-selecionado desta sessão, sem descartar a linha. */
        dropzoneTitle: string;
        dropzoneDragging: string;
        changeLabel: string;
        clearFileLabel: string;
        replaceLabel: string;
        existingFileLabel: string;
        errorType: string;
        errorSize: string;
      };
      validation: {
        familyRequired: string;
        descriptionRequired: string;
        descriptionMaxLength: string;
        specificationMaxLength: string;
        modelMaxLength: string;
        patrimonyMaxLength: string;
        statusRequired: string;
        vlTimeProductiveRequired: string;
        vlAcquisitionRequired: string;
        hasDepreciationRequired: string;
        yearModRequired: string;
        depreciationTypeRequired: string;
        residualRequiredWithResidualType: string;
        lifeBensRequiredWithDepreciation: string;
        dtAcquisitionRequiredWithDepreciation: string;
        chassiMaxLength: string;
        renavamMaxLength: string;
        serieMaxLength: string;
        plateMaxLength: string;
        plateRequiredWithFiscal: string;
        typeRequiredWithFiscal: string;
        bodyTypeRequiredWithFiscal: string;
        wheelTypeRequiredWithFiscal: string;
        taraRequiredWithFiscal: string;
        capacityRequiredWithFiscal: string;
        ownerTypeRequiredWithFiscal: string;
        ownerDocumentRequiredWithFiscal: string;
        ownerNameRequiredWithFiscal: string;
        ownerIeRequiredWithFiscal: string;
        ownerUfRequiredWithFiscal: string;
        ownerTpRequiredWithFiscal: string;
        colorMaxLength: string;
        rntrcMaxLength: string;
        ownerNameMaxLength: string;
        ownerIeMaxLength: string;
        costCenterPercentageRequired: string;
        costCenterPercentageSum100: string;
        attachmentNameMaxLength: string;
      };
      toasts: {
        createSuccess: string;
        updateSuccess: string;
      };
      errors: {
        frozenByDepreciationRejected: string;
      };
    };

    // ============================================
    // DETALHE (TASK-FE-1010) — ADITIVO
    // ============================================
    detail: {
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: {
        edit: string;
      };
      sections: {
        identification: string;
        financialDepreciation: string;
        depreciationData: string;
        fiscalVehicle: string;
        costCenterApportionment: string;
        attachments: string;
      };
      noData: string;
      attachments: {
        download: string;
        unavailable: string;
      };
      apportionment: {
        total: string;
      };
    };

    // ============================================
    // IMPORT/EXPORT DE PLANILHA (TASK-FE-1012) — ADITIVO, mirror shape de
    // `ModuleOpeningBalances.openingBalance.excel`/`ModulePlanAccounts.
    // planAccount.excel`. Máquina de estados ABORT-ALL (mirror
    // PlanAccountImportModal.tsx, não o upsert não-atômico de
    // OpeningBalance): linha inválida → 422 `errors.rows: string[]`, nada é
    // gravado — por isso `import.result` só tem `created` (Equipment-Doc-
    // Bruta.md §10: `EquipmentImport` é INSERT puro, sem upsert por chave
    // natural, sem exclusão de ausentes — nenhum `updated`/`deleted`/
    // `preserved` a exibir, divergência deliberada dos 2 mirrors). Gate dos
    // 3 endpoints é `equipments_report` (Equipment-contrato.md linha 208-210,
    // D-EQ6), NÃO `equipments_view`/`equipments_create`.
    // ============================================
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
        /** INSERT puro (§10 Doc Bruta) — só `created` (sem `updated`/
         *  `deleted`/`preserved`, ver nota de topo do bloco `excel`). */
        result: {
          created: string;
        };
        rowErrors: {
          title: string;
          /** `errors.rows[]` já vem como string pronta (ABORT-ALL, mirror
           *  PlanAccount) — SEM prefixo "Linha {row}:" montado no client
           *  (isso é só do padrão não-atômico de OpeningBalance). */
        };
        closeButton: string;
      };
    };
  };
}
