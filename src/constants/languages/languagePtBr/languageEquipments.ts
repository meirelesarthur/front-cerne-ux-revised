// src/constants/languages/languagePtBr/languageEquipments.ts
// Tradução pt-BR do módulo "Inventário" (Equipment — Cadastros Base /
// Bens-Ativos, execução 026, TASK-FE-1002). Rótulos fiéis ao legado
// (`trad.inventario`/`trad.iv_inventario`). Ver
// `@/@types/language/module-equipments` para o contrato completo.

import { ModuleEquipments } from '@/@types/language/module-equipments';

export const languageEquipments: ModuleEquipments = {
  equipment: {
    singularLabel: 'Inventário',
    pluralLabel: 'Inventário',

    list: {
      pageTitle: 'Inventário',
      pageSubtitle: 'Gerencie os bens e ativos físicos da fazenda.',
      table: {
        code: 'Código',
        description: 'Descrição',
        family: 'Família',
        proprietary: 'Proprietário',
        status: 'Status',
        statusActive: 'Ativo',
        statusInactive: 'Inativo',
        vlAcquisition: 'Valor de Aquisição',
      },
      actions: {
        view: 'Ver',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum item cadastrado',
        descriptionEmpty: 'Cadastre o primeiro item do Inventário.',
        titleEmptyNoCreate: 'Nenhum item cadastrado',
        descriptionEmptyNoCreate: 'Nenhum item foi cadastrado ainda.',
        titleFiltered: 'Nenhum resultado encontrado',
        descriptionFiltered: 'Ajuste os filtros para encontrar o que procura.',
        cta: 'Adicionar item',
      },
      noFarmSelected: {
        title: 'Selecione uma fazenda',
        description: 'Selecione uma fazenda ativa para visualizar o Inventário.',
      },
      deleteConfirm: {
        title: 'Excluir item do Inventário',
        description: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
      },
      toasts: {
        deleteSuccess: 'Item excluído com sucesso.',
      },
    },

    filter: {
      title: 'Filtrar Inventário',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      family: 'Família de Bens',
      familyAll: 'Todas',
      proprietary: 'Proprietário',
      proprietaryAll: 'Todos',
      startDate: 'Data inicial',
      endDate: 'Data final',
      apply: 'Filtrar',
      clear: 'Limpar filtros',
    },

    form: {
      title: {
        create: 'Novo Item de Inventário',
        edit: 'Editar Item de Inventário',
      },
      subtitle: {
        create: 'Cadastre um novo bem/ativo na fazenda.',
        edit: 'Edite os dados do bem/ativo selecionado.',
      },
      tabs: {
        identification: 'Identificação',
        financialDepreciation: 'Financeiro/Depreciação',
        fiscalVehicle: 'Fiscal/Veículo',
        costCenterApportionment: 'Rateio',
        attachments: 'Anexos',
      },
      // ⚠️ ADITIVO (correção E2E do dev, execução 026) — wizard Voltar/Próximo.
      footer: {
        back: 'Voltar',
        next: 'Próximo',
      },
      fields: {
        family: 'Família de Bens',
        description: 'Descrição',
        specification: 'Especificação',
        model: 'Modelo',
        patrimony: 'Patrimônio',
        product: 'Produto',
        status: 'Status',
        statusActive: 'Ativo',
        statusInactive: 'Inativo',
        image: 'Imagem',
        code: 'Código',
        features: 'Recursos',
        featureFuelSupply: 'Abastecimento',
        featureMaintenance: 'Manutenção',
        featureBatch: 'Batelada',
        featureAppropriation: 'Apontamento',
        equipmentType: 'Tipo de Equipamento',
        equipmentTypeOwn: 'Próprio',
        equipmentTypeOutsourced: 'Terceirizado',

        vlTimeProductive: 'Vl. Hora/Km Produtivo',
        provider: 'Fornecedor',
        dtAcquisition: 'Data de Aquisição',
        vlAcquisition: 'Valor de Aquisição',
        hourMeter: 'Horímetro/Km',
        yearMod: 'Ano/Modelo',
        hasDepreciation: 'Possui Depreciação',
        hasDepreciationYes: 'Sim',
        hasDepreciationNo: 'Não',
        lifeBens: 'Vida Útil (anos)',
        depreciationType: 'Tipo de Depreciação',
        depreciationTypeWithResidual: 'Com Valor Residual',
        depreciationTypeWithoutResidual: 'Sem Valor Residual',
        residual: 'Residual (%)',
        vlResidual: 'Valor Residual',
        vlDepreciate: 'Valor a Depreciar',
        depreciation: 'Depreciação (%)',

        useFiscal: 'Usa Dados Fiscais',
        useFiscalYes: 'Sim',
        useFiscalNo: 'Não',
        chassi: 'Chassi',
        renavam: 'Renavam',
        serie: 'Série',
        plate: 'Placa',
        color: 'Cor',
        uf: 'UF',
        brand: 'Marca',
        rntrc: 'RNTRC',
        type: 'Tipo de Veículo',
        bodyType: 'Tipo de Carroceria',
        wheelType: 'Tipo de Rodado',
        tara: 'Tara',
        capacity: 'Capacidade',
        ownerType: 'Tipo de Proprietário',
        ownerTypePhysical: 'Pessoa Física',
        ownerTypeLegal: 'Pessoa Jurídica',
        ownerDocument: 'CPF/CNPJ do Proprietário',
        ownerName: 'Nome do Proprietário',
        ownerIe: 'IE do Proprietário',
        ownerUf: 'UF do Proprietário',
        ownerTp: 'Tipo (TAC)',

        costCenter: 'Centro de Custo',
        percentage: 'Percentual (%)',

        attachmentName: 'Descrição do Anexo',
        attachmentFile: 'Arquivo',
      },
      placeholders: {
        family: 'Selecione a Família de Bens',
        product: 'Busque um produto',
        provider: 'Busque um fornecedor',
        uf: 'Selecione a UF',
        ownerUf: 'Selecione a UF',
        costCenter: 'Busque um centro de custo',
      },
      // ⚠️ ADITIVO (TASK-FE-1007) — códigos fixos do legado (agro365
      // `app/Equipment.php::opTypes/opBodyTypes/opWheelTypes/opOwnerTypes`,
      // rótulos 1:1 de `lang/pt-BR/trad.php`).
      fiscalCatalogs: {
        type: {
          '02': 'Ciclomoto',
          '03': 'Motoneta',
          '04': 'Motociclo',
          '05': 'Triciclo',
          '06': 'Automóvel',
          '07': 'Micro-ônibus',
          '08': 'Ônibus',
          '10': 'Reboque',
          '11': 'Semirreboque',
          '13': 'Camioneta',
          '14': 'Caminhão',
          '17': 'Caminhão Trator',
          '18': 'Trator Rodas',
          '19': 'Trator Esteiras',
          '20': 'Trator Misto',
          '21': 'Quadriciclo',
          '22': 'ESP / Ônibus',
          '23': 'Caminhonete',
          '24': 'Carga/Cam',
          '25': 'Utilitário',
        },
        bodyType: {
          '00': 'Não Aplicável',
          '01': 'Aberta',
          '02': 'Fechada/Baú',
          '03': 'Graneleira',
          '04': 'Porta Container',
        },
        wheelType: {
          '01': 'Truck',
          '02': 'Toco',
          '03': 'Cavalo Mecânico',
          '04': 'Van',
          '05': 'Utilitário',
          '06': 'Outros',
        },
        ownerTp: {
          0: 'TAC Agregado',
          1: 'TAC Independente',
          2: 'Outros',
        },
      },
      hints: {
        codeGeneratedByServer: 'Gerado automaticamente ao salvar',
        equipmentTypeLockedByFamily:
          'Disponível apenas para Máquinas, Implementos, Equipamentos Agrícolas ou Veículos',
        frozenByDepreciation: 'Bloqueado — já existe depreciação lançada para este item',
        fiscalBlockDisabled: 'Habilite "Usa Dados Fiscais" para editar este bloco',
      },
      // ⚠️ CORREÇÃO (TASK-FE-1005) — bloco ausente na entrega original da
      // TASK-FE-1002, mirror EXATO de familyEquipments.form.image.
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar imagem',
        removeLabel: 'Remover imagem',
        errorType: 'Formato não aceito. Envie um arquivo JPEG, PNG, JPG, GIF ou SVG.',
        errorSize: 'Arquivo excede o tamanho máximo de 2 MB.',
      },
      sections: {
        costCenterApportionmentSum: 'A soma dos percentuais deve ser 100%',
      },
      costCenterRow: {
        addButton: '+ Adicionar Centro de Custo',
        removeButton: 'Remover',
        emptyLabel: 'Nenhum centro de custo adicionado',
      },
      attachmentRow: {
        addButton: '+ Adicionar item',
        removeButton: 'Remover',
        emptyLabel: 'Nenhum anexo adicionado',
        defaultName: 'Não Informado',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDragging: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        clearFileLabel: 'Limpar seleção',
        replaceLabel: 'Substituir arquivo',
        existingFileLabel: 'Anexo atual',
        errorType: 'Formato não aceito.',
        errorSize: 'Arquivo excede o tamanho máximo de 10 MB.',
      },
      validation: {
        familyRequired: 'Família de Bens é obrigatória',
        descriptionRequired: 'Descrição é obrigatória',
        descriptionMaxLength: 'Descrição deve ter no máximo 60 caracteres',
        specificationMaxLength: 'Especificação deve ter no máximo 200 caracteres',
        modelMaxLength: 'Modelo deve ter no máximo 30 caracteres',
        patrimonyMaxLength: 'Patrimônio deve ter no máximo 40 caracteres',
        statusRequired: 'Status é obrigatório',
        vlTimeProductiveRequired: 'Vl. Hora/Km Produtivo é obrigatório',
        vlAcquisitionRequired: 'Valor de Aquisição é obrigatório',
        hasDepreciationRequired: 'Possui Depreciação é obrigatório',
        yearModRequired: 'Ano/Modelo é obrigatório',
        depreciationTypeRequired: 'Tipo de Depreciação é obrigatório',
        residualRequiredWithResidualType:
          'Residual (%) é obrigatório quando o tipo é "Com Valor Residual"',
        lifeBensRequiredWithDepreciation: 'Vida Útil (anos) é obrigatória quando há Depreciação',
        dtAcquisitionRequiredWithDepreciation:
          'Data de Aquisição é obrigatória quando há Depreciação',
        chassiMaxLength: 'Chassi deve ter no máximo 17 caracteres',
        renavamMaxLength: 'Renavam deve ter no máximo 11 caracteres',
        serieMaxLength: 'Série deve ter no máximo 40 caracteres',
        plateMaxLength: 'Placa deve ter no máximo 10 caracteres',
        plateRequiredWithFiscal: 'Placa é obrigatória quando "Usa Dados Fiscais" está ativo',
        typeRequiredWithFiscal:
          'Tipo de Veículo é obrigatório quando "Usa Dados Fiscais" está ativo',
        bodyTypeRequiredWithFiscal:
          'Tipo de Carroceria é obrigatório quando "Usa Dados Fiscais" está ativo',
        wheelTypeRequiredWithFiscal:
          'Tipo de Rodado é obrigatório quando "Usa Dados Fiscais" está ativo',
        taraRequiredWithFiscal: 'Tara é obrigatória quando "Usa Dados Fiscais" está ativo',
        capacityRequiredWithFiscal:
          'Capacidade é obrigatória quando "Usa Dados Fiscais" está ativo',
        ownerTypeRequiredWithFiscal:
          'Tipo de Proprietário é obrigatório quando "Usa Dados Fiscais" está ativo',
        ownerDocumentRequiredWithFiscal:
          'CPF/CNPJ do Proprietário é obrigatório quando "Usa Dados Fiscais" está ativo',
        ownerNameRequiredWithFiscal:
          'Nome do Proprietário é obrigatório quando "Usa Dados Fiscais" está ativo',
        ownerIeRequiredWithFiscal:
          'IE do Proprietário é obrigatória quando "Usa Dados Fiscais" está ativo',
        ownerUfRequiredWithFiscal:
          'UF do Proprietário é obrigatória quando "Usa Dados Fiscais" está ativo',
        ownerTpRequiredWithFiscal: 'Tipo (TAC) é obrigatório quando "Usa Dados Fiscais" está ativo',
        colorMaxLength: 'Cor deve ter no máximo 10 caracteres',
        rntrcMaxLength: 'RNTRC deve ter no máximo 12 caracteres',
        ownerNameMaxLength: 'Nome do Proprietário deve ter no máximo 100 caracteres',
        ownerIeMaxLength: 'IE do Proprietário deve ter no máximo 12 caracteres',
        costCenterPercentageRequired:
          'Percentual é obrigatório para cada Centro de Custo adicionado',
        costCenterPercentageSum100: 'A soma dos percentuais de rateio deve ser exatamente 100%',
        attachmentNameMaxLength: 'Descrição do Anexo deve ter no máximo 100 caracteres',
      },
      toasts: {
        createSuccess: 'Item de Inventário criado com sucesso.',
        updateSuccess: 'Item de Inventário atualizado com sucesso.',
      },
      errors: {
        frozenByDepreciationRejected:
          'Não é possível alterar campos financeiros — já existe depreciação lançada para este item.',
      },
    },

    // Detalhe (TASK-FE-1010) — ADITIVO.
    detail: {
      notFound: {
        title: 'Registro não encontrado',
        description: 'O item de Inventário solicitado não existe ou foi removido.',
        back: 'Voltar',
      },
      actions: {
        edit: 'Editar',
      },
      sections: {
        identification: 'Identificação',
        financialDepreciation: 'Financeiro/Depreciação',
        depreciationData: 'Dados de Depreciação',
        fiscalVehicle: 'Fiscal/Veículo',
        costCenterApportionment: 'Centros de Custo Vinculados',
        attachments: 'Anexos',
      },
      noData: '—',
      attachments: {
        download: 'Baixar arquivo',
        unavailable: 'Arquivo não disponível',
      },
      apportionment: {
        total: 'Total:',
      },
    },

    // Import/Export de planilha (TASK-FE-1012) — ADITIVO.
    excel: {
      downloadTemplate: 'Baixar modelo',
      export: 'Exportar',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
      exportError: 'Não foi possível exportar os dados. Tente novamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Inventário',
        subtitle: 'Baixe o modelo, preencha e envie a planilha para cadastrar itens em lote.',
        instructions:
          'A coluna Descrição e a coluna Família de Bens (buscada pela descrição) são obrigatórias em cada linha. Selecione a Família, o indicador de Depreciação, o Tipo de Depreciação e o Proprietário a partir dos dropdowns validados (abas auxiliares da planilha).',
        warning: {
          title: 'A importação apenas cria itens novos',
          description:
            'Cada linha da planilha gera um novo item de Inventário — a importação não localiza nem atualiza itens já cadastrados, mesmo que a descrição seja igual.',
        },
        downloadShortcut: 'Baixar modelo',
        fileUpload: {
          label: 'Planilha preenchida',
          hint: 'Envie o arquivo .xlsx preenchido a partir do modelo baixado.',
          dropzoneTitle: 'Arraste a planilha ou clique para selecionar',
          dropzoneDraggingTitle: 'Solte a planilha aqui',
          changeLabel: 'Trocar arquivo',
          removeLabel: 'Remover arquivo',
          errorTypeMessage: 'Formato não aceito. Envie um arquivo .xlsx.',
          errorSizeMessage: 'Arquivo excede o tamanho máximo de 10MB.',
        },
        cancelButton: 'Cancelar',
        submitButton: 'Importar',
        importSuccessToast: 'Importação do Inventário concluída com sucesso.',
        result: {
          created: 'Criados',
        },
        rowErrors: {
          title: 'Algumas linhas não puderam ser importadas — corrija e envie novamente',
        },
        closeButton: 'Fechar',
      },
    },
  },
};
