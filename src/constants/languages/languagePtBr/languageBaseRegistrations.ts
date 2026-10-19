// src/constants/languages/languagePtBr/languageBaseRegistrations.ts
// Tradução PT-BR do módulo agregador Cadastros Base.

import { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

import { languageDocumentManagements } from './languageDocumentManagements';

export const languageBaseRegistrations: ModuleBaseRegistrations = {
  titleModule: 'Cadastros Base',
  documentManagements: languageDocumentManagements,
  diagnosisPregnancy: {
    singularLabel: 'Diagnóstico de Gestação',
    pluralLabel: 'Diagnósticos de Gestação',
    list: {
      pageTitle: 'Diagnóstico Gestação',
      pageSubtitle:
        'Administre os resultados de diagnóstico de gestação utilizados no manejo reprodutivo.',
      deletedToast: 'Diagnóstico de gestação removido com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum diagnóstico de gestação cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro resultado de diagnóstico.',
        titleFiltered: 'Nenhum diagnóstico encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Diagnóstico',
      },
    },
    filter: {
      title: 'Filtrar diagnósticos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Novo Diagnóstico',
        edit: 'Editar Diagnóstico',
      },
      subtitle: {
        create: 'Cadastre um novo resultado de diagnóstico de gestação.',
        edit: 'Atualize os dados do diagnóstico de gestação.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Prenhe',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },

  // Escore Corporal (BodyScore, TASK-BS-FE-01) — mirror `diagnosisPregnancy`
  // + FK de Espécie. Rótulo de `is_enabled` = "Habilitado" (GAP-BS-FE-01,
  // [AVALIADO] — decisão do dono via AskUserQuestion do Maestro, fiel ao
  // Blade legado; SUPERA a decisão anterior "Status"/"Ativo"/"Inativo" que
  // constava nesta ficha antes da resolução do Gap). Representação booleana
  // "Sim"/"Não" — textos exatos do `<select>` do legado
  // (`00-Documentacao_Bruta/BodyScore/01-BodyScore.md ## 6`, item 3:
  // `trad.var_at_sim`/`trad.var_at_nao`) — NÃO "Ativo"/"Inativo".
  bodyScore: {
    singularLabel: 'Escore Corporal',
    pluralLabel: 'Escores Corporais',
    list: {
      pageTitle: 'Escore Corporal',
      pageSubtitle: 'Administre os escores corporais utilizados no manejo do rebanho.',
      deletedToast: 'Escore corporal removido com sucesso',
      table: {
        description: 'Descrição',
        specie: 'Espécie',
        isEnabled: 'Habilitado',
        yes: 'Sim',
        no: 'Não',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum escore corporal cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro escore corporal.',
        titleFiltered: 'Nenhum escore corporal encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Escore Corporal',
      },
    },
    filter: {
      title: 'Filtrar escores corporais',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      specie: 'Espécie',
      specieAll: 'Todas',
    },
    form: {
      title: {
        create: 'Novo Escore Corporal',
        edit: 'Editar Escore Corporal',
      },
      subtitle: {
        create: 'Cadastre um novo escore corporal utilizado no manejo do rebanho.',
        edit: 'Atualize os dados do escore corporal.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Habilitado',
        specie: 'Espécie',
      },
      placeholders: {
        description: 'Ex.: 3.5',
        specie: 'Selecione a espécie',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        specieRequired: 'A espécie é obrigatória',
      },
    },
  },

  accountingGroupers: {
    singularLabel: 'Agrupador Contábil',
    pluralLabel: 'Agrupador Contábils',
    list: {
      pageTitle: 'Agrupadores Contábeis',
      pageSubtitle: 'Administre a árvore de agrupadores contábeis (DRE).',
      deletedToast: 'Agrupador contábil removido com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
        order: 'Ordem',
        isEnabled: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
        actions: 'Ações',
      },
      actions: {
        edit: 'Editar',
        addChild: 'Criar descendente',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum agrupador contábil cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro agrupador contábil.',
        titleFiltered: 'Nenhum agrupador contábil encontrado.',
        descriptionFiltered: 'Tente ajustar a busca.',
        cta: 'Novo Agrupador Contábil',
      },
      error: {
        message: 'Não foi possível carregar a árvore de Agrupadores Contábeis.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar agrupadores contábeis',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código ou nome',
    },
    form: {
      title: {
        create: 'Novo Agrupador Contábil',
        createChild: 'Novo Agrupador Contábil (descendente)',
        edit: 'Editar Agrupador Contábil',
      },
      subtitle: {
        create: 'Cadastre um novo agrupador contábil.',
        edit: 'Atualize os dados do agrupador contábil.',
      },
      fields: {
        code: 'Código',
        name: 'Nome',
        isEnabled: 'Status',
        order: 'Ordem',
        parent: 'Antecessor',
      },
      placeholders: {
        name: 'Ex.: Receita Bruta',
      },
      parentPlaceholder: {
        root: 'Raiz (sem antecessor)',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente ao salvar',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 60 caracteres',
        isEnabledRequired: 'O status é obrigatório',
        orderRequired: 'A ordem é obrigatória',
        orderMin: 'A ordem deve ser maior ou igual a 1',
      },
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Há registros vinculados a este agrupador contábil. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{count} vínculo(s) em {resource}',
      tableLabels: {
        accounting_groupers: 'Agrupador(es) contábil(is) filho(s)',
        financial_categories: 'Categoria(s) financeira(s) vinculada(s)',
      },
    },
  },
  additionalInfo: {
    singularLabel: 'Informação Complementar',
    pluralLabel: 'Informação Complementars',
    list: {
      pageTitle: 'Informações Complementares',
      pageSubtitle: 'Administre as informações complementares utilizadas na Natureza de Operação.',
      deletedToast: 'Informação Complementar removida com sucesso',
      table: {
        description: 'Descrição',
        info: 'Informação',
        isActive: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma informação complementar cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira informação complementar.',
        titleEmptyNoCreate: 'Nenhuma informação complementar cadastrada.',
        descriptionEmptyNoCreate:
          'Fale com um administrador para cadastrar uma informação complementar.',
        titleFiltered: 'Nenhuma informação complementar encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Informação Complementar',
      },
    },
    filter: {
      title: 'Filtrar informações complementares',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isActive: 'Status',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Nova Informação Complementar',
        edit: 'Editar Informação Complementar',
      },
      subtitle: {
        create: 'Cadastre uma nova informação complementar para uso na Natureza de Operação.',
        edit: 'Atualize os dados da informação complementar.',
      },
      fields: {
        description: 'Descrição',
        info: 'Informação',
        isActive: 'Status',
      },
      placeholders: {
        description: 'Ex.: ICMS Substituição Tributária',
        info: 'Descreva o detalhamento desta informação complementar',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        infoRequired: 'A informação é obrigatória',
        infoMaxLength: 'A informação deve ter no máximo 1000 caracteres',
      },
    },
  },
  addressing: {
    singularLabel: 'Endereçamentos',
    pluralLabel: 'Endereçamentoss',
    pageTitle: 'Endereçamentos',
    pageSubtitle: 'Administre a árvore de Endereçamentos (Setor, Corredor, Prateleira e Nível).',
    deletedToast: 'Endereçamento removido com sucesso',
    levels: {
      1: 'Setor',
      2: 'Corredor',
      3: 'Prateleira',
      4: 'Nível',
    },
    table: {
      description: 'Descrição',
      level: 'Nível',
      childrenCount: 'Filhos',
    },
    tree: {
      expand: 'Expandir',
      collapse: 'Recolher',
    },
    actions: {
      edit: 'Editar',
      addChild: 'Adicionar {level}',
      delete: 'Excluir',
    },
    empty: {
      message: 'Nenhum Endereçamento cadastrado ainda.',
      cta: 'Novo Endereçamento',
    },
    error: {
      message: 'Não foi possível carregar a árvore de Endereçamentos.',
      retry: 'Tentar novamente',
    },
    filter: {
      title: 'Filtrar Endereçamentos',
      search: 'Descrição',
      searchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Novo {level}',
        edit: 'Editar {level}',
      },
      subtitle: {
        create: 'Cadastre um novo endereçamento.',
        edit: 'Atualize a descrição deste endereçamento.',
      },
      fields: {
        description: 'Descrição',
        parentInfo: 'Endereçamento pai',
      },
      parentInfo: {
        noParent: 'Este será um Setor (raiz) — sem endereçamento pai.',
      },
      placeholders: {
        description: 'Digite a descrição',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
      },
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Há registros vinculados a este endereçamento. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{count} vínculo(s) em {resource}',
      tableLabels: {
        addressings: 'Endereçamento(s) filho(s)',
        products: 'Produto(s) vinculado(s)',
      },
    },
  },
  // Rateio - Categoria Financeira (Apportionment, TASK-AP-FE-02) — vincula 1
  // Categoria Financeira sintética à distribuição fixa das atividades
  // produtivas da fazenda, com detalhamento opcional por Centro de Custo.
  apportionment: {
    singularLabel: 'Rateio',
    pluralLabel: 'Rateios',
    list: {
      pageTitle: 'Rateios / Categorias',
      pageSubtitle:
        'Administre o rateio fixo de cada Categoria Financeira entre as atividades produtivas da fazenda.',
      deletedToast: 'Rateio removido com sucesso',
      table: {
        financialCategory: 'Categoria Financeira',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
        actions: 'Ações',
      },
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhum rateio cadastrado.',
        descriptionEmpty: 'Comece vinculando uma Categoria Financeira ao rateio das atividades.',
        titleFiltered: 'Nenhum rateio encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Rateio',
      },
    },
    filter: {
      title: 'Filtrar rateios',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por Categoria Financeira',
    },
    form: {
      title: { create: 'Novo Rateio', edit: 'Editar Rateio' },
      subtitle: {
        create: 'Vincule uma Categoria Financeira ao rateio das atividades produtivas.',
        edit: 'Atualize o rateio das atividades produtivas.',
      },
      fields: {
        financialCategory: 'Categoria Financeira',
        activity: 'Atividade',
        ha: 'Área Produtiva (ha)',
        percentage: 'Área Produtiva (%)',
        costCentersSectionTitle: 'Centros de Custo',
        costCenter: 'Centro de Custo',
        unsetedHa: 'Ha Disponível',
        costCenterHa: 'Ha a Alocar',
        costCenterHaPercentage: 'Percentual',
        totalHa: 'Total (ha)',
        totalPercentage: 'Total (%)',
      },
      placeholders: {
        financialCategory: 'Selecione a Categoria Financeira',
        costCenter: 'Selecione o Centro de Custo',
      },
      validation: {
        financialCategoryRequired: 'A Categoria Financeira é obrigatória',
        itemsMinLength: 'É necessário haver ao menos uma atividade produtiva cadastrada na fazenda',
        centerRequired: 'Selecione um Centro de Custo',
        haRequired: 'O valor de Ha é obrigatório',
        haMin: 'O valor de Ha não pode ser negativo',
        haExceedsAvailable: 'O valor de Ha não pode exceder o disponível para esta atividade',
        haPercentageMax: 'O percentual não pode exceder 100%',
        haPercentageExceedsRemaining:
          'O percentual não pode exceder o restante disponível entre os Centros de Custo desta atividade',
      },
      addCenterRowLabel: 'Adicionar Centro de Custo',
      removeCenterRowLabel: 'Remover Centro de Custo',
    },
  },
  bank: {
    singularLabel: 'Banco',
    pluralLabel: 'Bancos',
    list: {
      pageTitle: 'Bancos',
      pageSubtitle: 'Consulte o catálogo de instituições financeiras (código e nome).',
      deletedToast: 'Banco excluído com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      search: {
        placeholder: 'Buscar por código ou nome',
      },
      emptyState: {
        titleEmpty: 'Nenhum banco cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro banco.',
        titleEmptyNoCreate: 'Nenhum banco disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há bancos cadastrados. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhum banco encontrado.',
        descriptionFiltered: 'Tente ajustar a busca por código ou nome.',
        cta: 'Novo Banco',
      },
      deleteConfirm: {
        title: 'Excluir banco',
        message: 'Tem certeza que deseja excluir o banco',
        warning:
          'Esta exclusão é definitiva. Se o banco estiver vinculado a um fornecedor, a exclusão pode falhar.',
      },
    },
    form: {
      title: {
        create: 'Novo Banco',
        edit: 'Editar Banco',
      },
      subtitle: {
        create: 'Cadastre um novo banco no catálogo de instituições financeiras.',
        edit: 'Atualize os dados do banco.',
      },
      fields: {
        code: 'Código',
        name: 'Nome',
      },
      placeholders: {
        code: 'Ex.: 001',
        name: 'Ex.: Banco do Brasil S.A.',
      },
      validation: {
        codeRequired: 'O código é obrigatório',
        codeMaxLength: 'O código deve ter no máximo 4 caracteres',
        codeDuplicate:
          'Já existe um banco com este código. Os principais bancos já vêm cadastrados.',
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 100 caracteres',
      },
    },
  },

  headband: {
    singularLabel: 'Testeira',
    pluralLabel: 'Testeiras',
    type: {
      central: 'Central',
      partnerLogo: 'Logo Parceiros',
    },
    list: {
      pageTitle: 'Testeiras',
      pageSubtitle: 'Administre os banners exibidos no topo do sistema.',
      deletedToast: 'Testeira removida com sucesso',
      table: {
        position: 'Posição',
        description: 'Descrição',
        type: 'Tipo',
        partners: 'Afiliados',
        partnersNone: 'Nenhum afiliado vinculado',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma testeira cadastrada.',
        descriptionEmpty: 'Comece adicionando o primeiro banner.',
        titleFiltered: 'Nenhuma testeira encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros.',
        cta: 'Nova Testeira',
      },
    },
    filter: {
      title: 'Filtrar testeiras',
      type: 'Tipo',
      typeAll: 'Todos',
      partner: 'Afiliado',
      partnerPlaceholder: 'Buscar afiliado',
    },
    form: {
      title: {
        create: 'Nova Testeira',
        edit: 'Editar Testeira',
      },
      subtitle: {
        create: 'Cadastre um novo banner.',
        edit: 'Atualize os dados da testeira.',
      },
      fields: {
        description: 'Descrição',
        link: 'Link',
        position: 'Posição',
        type: 'Tipo',
        image: 'Imagem',
        partner: 'Afiliado (único)',
        partners: 'Afiliados vinculados',
      },
      placeholders: {
        description: 'Ex.: Campanha de verão',
        link: 'https://...',
        position: 'Ex.: 1',
      },
      hints: {
        imageAccepted: 'Formatos aceitos: PNG, JPG, JPEG, GIF.',
        imageMaxSize: 'Tamanho máximo: 2MB.',
      },
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar imagem',
        errorType: 'Tipo de arquivo não aceito.',
        errorSize: 'Arquivo excede o tamanho máximo.',
      },
      partnersChecklist: {
        searchPlaceholder: 'Buscar afiliado',
        selectAllLabel: 'Marcar todos',
        deselectAllLabel: 'Desmarcar todos',
        selectedCountLabel: 'Nº de afiliados selecionados',
        emptyLabel: 'Nenhum afiliado encontrado.',
        errorLabel: 'Erro ao carregar a lista de afiliados.',
        retryLabel: 'Tentar novamente',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 40 caracteres',
        linkRequired: 'O link é obrigatório',
        linkMaxLength: 'O link deve ter no máximo 200 caracteres',
        positionRequired: 'A posição é obrigatória',
        positionMin: 'A posição deve ser no mínimo 1',
        positionMax: 'A posição deve ser no máximo 127',
        typeRequired: 'O tipo é obrigatório',
      },
      businessRule: {
        limitReached: 'Limite de 7 testeiras atingido para este tipo.',
        svgNotAccepted: 'Arquivo SVG não é aceito. Use PNG, JPG, JPEG ou GIF.',
      },
    },
  },

  birthNote: {
    singularLabel: 'Observação de Nascimento',
    pluralLabel: 'Observação de Nascimentos',
    list: {
      pageTitle: 'Observação Nascimento',
      pageSubtitle: 'Administre as observações de nascimento utilizadas nos animais.',
      deletedToast: 'Observação de nascimento removida com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma observação de nascimento cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira observação de nascimento.',
        titleFiltered: 'Nenhuma observação de nascimento encontrada.',
        descriptionFiltered: 'Tente ajustar a busca.',
        cta: 'Nova Observação de Nascimento',
      },
    },
    filter: {
      title: 'Filtrar observações de nascimento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Nova Observação de Nascimento',
        edit: 'Editar Observação de Nascimento',
      },
      subtitle: {
        create: 'Cadastre uma nova observação de nascimento utilizada nos animais.',
        edit: 'Atualize os dados da observação de nascimento.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Nascimento assistido',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  categoryType: {
    singularLabel: 'Tipo de Categoria',
    pluralLabel: 'Tipo de Categorias',
    list: {
      pageTitle: 'Tipos de Categoria',
      pageSubtitle: 'Administre os tipos utilizados nas categorias financeiras.',
      deletedToast: 'Tipo de categoria removido com sucesso',
      table: {
        description: 'Descrição',
        isEnabled: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum tipo de categoria cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro tipo de categoria.',
        titleEmptyNoCreate: 'Nenhum tipo de categoria cadastrado.',
        descriptionEmptyNoCreate: 'Fale com um administrador para cadastrar um tipo de categoria.',
        titleFiltered: 'Nenhum tipo de categoria encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Tipo de Categoria',
      },
    },
    filter: {
      title: 'Filtrar tipos de categoria',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Novo Tipo de Categoria',
        edit: 'Editar Tipo de Categoria',
      },
      subtitle: {
        create: 'Cadastre um novo tipo para uso nas categorias financeiras.',
        edit: 'Atualize os dados do tipo de categoria.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Receitas Operacionais',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  diagnosticTechnique: {
    singularLabel: 'Técnica Diagnóstico',
    pluralLabel: 'Técnica Diagnósticos',
    list: {
      pageTitle: 'Técnicas Diagnóstico',
      pageSubtitle: 'Administre as técnicas utilizadas no diagnóstico de gestação.',
      deletedToast: 'Técnica diagnóstico removida com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma técnica diagnóstico cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira técnica diagnóstico.',
        titleFiltered: 'Nenhuma técnica diagnóstico encontrada.',
        descriptionFiltered: 'Tente ajustar a busca.',
        cta: 'Nova Técnica Diagnóstico',
      },
    },
    filter: {
      title: 'Filtrar técnicas diagnóstico',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
    },
    form: {
      title: {
        create: 'Nova Técnica Diagnóstico',
        edit: 'Editar Técnica Diagnóstico',
      },
      subtitle: {
        create: 'Cadastre uma nova técnica utilizada no diagnóstico de gestação.',
        edit: 'Atualize os dados da técnica diagnóstico.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Ultrassonografia',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  // ============================================
  // Administrativo — Gestão Documentos — Tipo Documento (DocumentType,
  // TASK-DT-FE-01). Label EXATO do legado — `singularLabel: 'Tipo Documento'`
  // (não "Tipo de Documento"), mirror do item de menu (fidelidade estrita,
  // ver `[[DocumentType-contrato-tela]] §8`). Esta Tarefa cobre só
  // `list`/`filter` — `form.*` completa em TASK-DT-FE-02.
  // ============================================
  documentTypes: {
    singularLabel: 'Tipo Documento',
    pluralLabel: 'Tipos de Documento',
    list: {
      pageTitle: 'Tipos de Documento',
      pageSubtitle: 'Administre a árvore de tipos de documento.',
      deletedToast: 'Tipo de documento removido com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
        order: 'Ordem',
        isEnabled: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
        actions: 'Ações',
      },
      actions: {
        edit: 'Editar',
        addChild: 'Criar descendente',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum tipo de documento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro tipo de documento.',
        titleFiltered: 'Nenhum tipo de documento encontrado.',
        descriptionFiltered: 'Tente ajustar a busca.',
        cta: 'Novo Tipo de Documento',
      },
      error: {
        message: 'Não foi possível carregar a árvore de Tipos de Documento.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar tipos de documento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código ou nome',
    },
    form: {
      title: {
        create: 'Novo Tipo de Documento',
        createChild: 'Novo Tipo de Documento (descendente)',
        edit: 'Editar Tipo de Documento',
      },
      subtitle: {
        create: 'Cadastre um novo tipo de documento.',
        edit: 'Atualize os dados do tipo de documento.',
      },
      fields: {
        code: 'Código',
        name: 'Nome',
        isEnabled: 'Status',
        order: 'Ordem',
        parent: 'Antecessor',
      },
      placeholders: {
        name: 'Ex.: CNH',
      },
      parentPlaceholder: {
        root: 'Raiz (sem antecessor)',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente ao salvar',
      },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 60 caracteres',
        isEnabledRequired: 'O status é obrigatório',
        orderRequired: 'A ordem é obrigatória',
      },
    },
  },
  familyEquipment: {
    singularLabel: 'Família de Bens',
    pluralLabel: 'Família de Benss',
    list: {
      pageTitle: 'Família de Bens',
      pageSubtitle:
        'Administre o catálogo de parâmetros de equipamentos utilizado por inventário e depreciação.',
      deletedToast: 'Família de bens removida com sucesso',
      table: {
        image: 'Imagem',
        description: 'Descrição',
        typeDepreciation: 'Tipo de depreciação',
        lifeBens: 'Vida útil (anos)',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma família de bens cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira família de bens.',
        titleFiltered: 'Nenhuma família de bens encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Família de Bens',
      },
    },
    filter: {
      title: 'Filtrar família de bens',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      typeDepreciation: 'Tipo de depreciação',
      typeDepreciationAll: 'Todos',
      typeDepreciationOptions: {
        semResidual: 'Sem valor residual',
        comResidual: 'Com valor residual',
      },
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: {
        create: 'Nova Família de Bens',
        edit: 'Editar Família de Bens',
      },
      subtitle: {
        create: 'Cadastre uma nova família de bens para uso em inventário e depreciação.',
        edit: 'Atualize os dados da família de bens.',
      },
      fields: {
        description: 'Descrição',
        typeDepreciation: 'Tipo de depreciação',
        depreciation: 'Depreciação (%)',
        residual: 'Valor residual (%)',
        lifeBens: 'Vida útil (anos)',
        vlTimeProductive: 'Tempo produtivo',
        vlTimeUnproductive: 'Tempo improdutivo',
        isEnabled: 'Ativo',
        image: 'Imagem',
      },
      placeholders: {
        description: 'Ex.: Trator de esteira',
      },
      hints: {
        residualConditional: 'Obrigatório quando o tipo de depreciação é "Com valor residual".',
        imageAccepted: 'Formatos aceitos: JPEG, PNG, JPG, GIF, SVG.',
        imageMaxSize: 'Tamanho máximo: 2 MB.',
      },
      typeDepreciationOptions: {
        semResidual: 'Sem valor residual',
        comResidual: 'Com valor residual',
      },
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar imagem',
        removeLabel: 'Remover imagem',
        errorType: 'Formato não aceito. Envie um arquivo JPEG, PNG, JPG, GIF ou SVG.',
        errorSize: 'Arquivo excede o tamanho máximo de 2 MB.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        typeDepreciationRequired: 'Selecione o tipo de depreciação',
        depreciationRange: 'A depreciação deve estar entre 0 e 100',
        residualRequired: 'O valor residual é obrigatório para este tipo de depreciação',
        residualRange: 'O valor residual deve estar entre 0 e 100',
        lifeBensPositive: 'A vida útil deve ser um número inteiro maior que zero',
        vlTimeMin: 'O valor deve ser maior ou igual a zero',
      },
    },
  },
  fodder: {
    singularLabel: 'Forragem',
    pluralLabel: 'Forragens',
    list: {
      pageTitle: 'Forragem',
      pageSubtitle: 'Administre os cadastros de forragem utilizados no pastejo do rebanho.',
      deletedToast: 'Forragem removida com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma forragem cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira forragem.',
        cta: 'Nova Forragem',
      },
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Esta forragem está vinculada a registros de pastejo. Remova o vínculo abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        grazings: 'Pastejo(s) vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Nova Forragem',
        edit: 'Editar Forragem',
      },
      subtitle: {
        create: 'Cadastre uma nova forragem utilizada no pastejo do rebanho.',
        edit: 'Atualize os dados da forragem.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Capim-elefante',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  grazing: {
    singularLabel: 'Pastejo',
    pluralLabel: 'Pastejos',
    list: {
      pageTitle: 'Módulo Pastejo',
      pageSubtitle: 'Administre os pastejos utilizados na rotação de piquetes do rebanho.',
      deletedToast: 'Pastejo removido com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        fodder: 'Forragem',
        date: 'Data',
        color: 'Cor',
        controlProductivity: 'Controla Produtividade',
        areasCount: 'Piquetes',
        areasSum: 'Área Total (ha)',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum pastejo cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro pastejo.',
        cta: 'Novo Pastejo',
      },
    },
    controlProductivityOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    colorOptions: {
      white: 'Branco',
      blue: 'Azul',
      black: 'Preto',
      green: 'Verde',
      yellow: 'Amarelo',
      red: 'Vermelho',
      gray: 'Cinza',
      lightGray: 'Cinza Claro',
      lightBlue: 'Azul Claro',
      darkBlue: 'Azul Escuro',
      turquoise: 'Turquesa',
      darkGreen: 'Verde Escuro',
      lightGreen: 'Verde Claro',
      orange: 'Laranja',
    },
    form: {
      title: {
        create: 'Novo Pastejo',
        edit: 'Editar Pastejo',
      },
      subtitle: {
        create: 'Cadastre um novo pastejo para a rotação de piquetes do rebanho.',
        edit: 'Atualize os dados do pastejo.',
      },
      fields: {
        description: 'Descrição',
        fodder: 'Forragem',
        date: 'Data',
        code: 'Código',
        color: 'Cor',
        controlProductivity: 'Controla Produtividade',
        responsible: 'Responsável',
        areas: 'Piquetes',
      },
      placeholders: {
        description: 'Informe a descrição do pastejo',
        fodder: 'Selecione a forragem',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
        // TASK-GZ-FE-03: mapa de seleção de piquetes já existe — texto
        // atualizado de "disponível na próxima etapa" para a dica de uso
        // real, exibida acima do mapa (mirror `demarcacaoText.mapHint`).
        areasPlaceholder: 'Clique em um piquete no mapa para selecioná-lo ou desmarcá-lo.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        fodderRequired: 'A forragem é obrigatória',
        dateRequired: 'A data é obrigatória',
        colorFormat: 'Selecione uma cor válida da paleta disponível',
        colorRequired: 'A cor é obrigatória',
        areasMin: 'Selecione ao menos um piquete',
        areasRequired: 'Os piquetes são obrigatórios',
      },
      invalidFieldsToast: 'Verifique os campos destacados no formulário.',
    },
    map: {
      loading: 'Carregando piquetes...',
      noActiveFarm: 'Selecione uma fazenda ativa para ver os piquetes disponíveis.',
      errorState: {
        title: 'Não foi possível carregar os piquetes',
        description: 'Ocorreu um erro ao buscar as Áreas da fazenda ativa.',
        retry: 'Tentar novamente',
      },
      emptyState: {
        title: 'Nenhum piquete cadastrado nesta fazenda',
        description: 'Cadastre Áreas no módulo de Fazenda/Área para poder selecioná-las aqui.',
      },
      selectedCountLabel: '{count} piquete(s) selecionado(s)',
      areaSumPreviewLabel: 'Área somada (preview): {value} ha',
      conflictToast: {
        title: 'Piquete indisponível',
        description: '{description} ({code}) já está vinculado a outro Pastejo.',
      },
      validateErrorToast:
        'Não foi possível verificar a disponibilidade deste piquete. Tente novamente.',
    },
  },
  ibpt: {
    singularLabel: 'Tabela IBPT',
    pluralLabel: 'Tabelas IBPT',
    list: {
      pageTitle: 'IBPT',
      pageSubtitle: 'Administre as tabelas fiscais de incidência tributária por UF.',
      deletedToast: 'Tabela IBPT removida com sucesso',
      table: { uf: 'UF', versao: 'Versão', itemsCount: 'N. Registros' },
      actions: { view: 'Visualizar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhuma tabela IBPT cadastrada.',
        descriptionEmpty: 'Importe a primeira tabela fiscal por UF.',
        cta: 'Nova Tabela',
      },
    },
    import: {
      title: { create: 'Nova Tabela IBPT' },
      subtitle: { create: 'Importe uma tabela fiscal por UF a partir de um arquivo CSV.' },
      fields: { uf: 'UF', versao: 'Versão', file: 'Arquivo CSV' },
      fileUpload: {
        label: 'Arquivo CSV',
        hint: 'Formatos aceitos: .csv, .txt — até 10MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Formato de arquivo não aceito.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo.',
      },
      warning: {
        title: 'Atenção: substituição total da tabela',
        description:
          'Reimportar uma UF que já tem tabela cadastrada substitui a tabela anterior por completo ' +
          '(cabeçalho e linhas). Não há histórico de versões.',
      },
      rowErrors: { title: 'O arquivo CSV contém linhas inválidas:' },
      validation: {
        ufRequired: 'A UF é obrigatória',
        versaoRequired: 'A versão é obrigatória',
        versaoMaxLength: 'A versão deve ter no máximo 30 caracteres',
        fileRequired: 'Selecione um arquivo CSV',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Salvar',
      importSuccessToast: 'Tabela IBPT importada com sucesso',
    },
    detail: {
      pageTitle: 'IBPT {uf}',
      itemsLabel: 'Registros',
      fields: { uf: 'UF', versao: 'Versão', itemsCount: 'N. Registros' },
      table: {
        codigo: 'Código',
        nacionalFederal: 'Nac. Federal',
        importadoFederal: 'Imp. Federal',
        estadual: 'Estadual',
        municipal: 'Municipal',
      },
      notFound: {
        title: 'Tabela IBPT não encontrada',
        description: 'A tabela solicitada não existe ou foi removida.',
        back: 'Voltar',
      },
    },
  },
  identificationType: {
    singularLabel: 'Tipo de Identificação',
    pluralLabel: 'Tipo de Identificaçãos',
    list: {
      pageTitle: 'Tipos de Identificação',
      pageSubtitle: 'Administre os tipos de identificação utilizados nos animais.',
      deletedToast: 'Tipo de identificação removido com sucesso',
      table: {
        description: 'Descrição',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum tipo de identificação cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro tipo de identificação.',
        cta: 'Novo Tipo de Identificação',
      },
    },
    form: {
      title: {
        create: 'Novo Tipo de Identificação',
        edit: 'Editar Tipo de Identificação',
      },
      subtitle: {
        create: 'Cadastre um novo tipo de identificação utilizado nos animais.',
        edit: 'Atualize os dados do tipo de identificação.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Brinco',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  indexer: {
    singularLabel: 'Indexador',
    pluralLabel: 'Indexadors',
    list: {
      pageTitle: 'Indexadores',
      pageSubtitle: 'Administre os indexadores utilizados nos contratos financeiros.',
      deletedToast: 'Indexador removido com sucesso',
      table: {
        description: 'Descrição',
        descriptive: 'Descritivo',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum indexador cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro indexador.',
        titleFiltered: 'Nenhum indexador encontrado.',
        descriptionFiltered: 'Tente ajustar a busca.',
        cta: 'Novo Indexador',
      },
    },
    filter: {
      title: 'Filtrar indexadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição ou descritivo',
    },
    form: {
      title: {
        create: 'Novo Indexador',
        edit: 'Editar Indexador',
      },
      subtitle: {
        create: 'Cadastre um novo indexador utilizado nos contratos financeiros.',
        edit: 'Atualize os dados do indexador.',
      },
      fields: {
        description: 'Descrição',
        descriptive: 'Descritivo',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: IGPM',
        descriptive: 'Ex.: Índice Geral de Preços do Mercado',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        descriptiveRequired: 'O descritivo é obrigatório',
        descriptiveMaxLength: 'O descritivo deve ter no máximo 100 caracteres',
      },
    },
  },
  issueDfeSyncTime: {
    singularLabel: 'Sincronização DFe',
    pluralLabel: 'Sincronização DFes',
    list: {
      pageTitle: 'Sincronização DFe',
      pageSubtitle: 'Administre os horários de sincronização de DFe por Emissor Fiscal.',
      deletedToast: 'Sincronização removida com sucesso',
      table: {
        issuer: 'Emissor',
        syncHour: 'Hora da Sincronização',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma sincronização cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira sincronização de DFe.',
        titleEmptyNoCreate: 'Nenhuma sincronização cadastrada.',
        descriptionEmptyNoCreate: 'Fale com um administrador para cadastrar uma sincronização.',
        cta: 'Nova Sincronização',
      },
      error: {
        message: 'Não foi possível carregar as sincronizações.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: { create: 'Nova Sincronização', edit: 'Editar Sincronização' },
      subtitle: {
        create: 'Cadastre um novo horário de sincronização de DFe para um Emissor Fiscal.',
        edit: 'Atualize o horário de sincronização de DFe.',
      },
      fields: {
        issue: 'Emissor',
        syncHour: 'Hora da Sincronização',
      },
      placeholders: {
        issue: 'Buscar emissor fiscal...',
      },
      validation: {
        issueRequired: 'Selecione um Emissor Fiscal',
        syncHourRequired: 'Selecione a hora da sincronização',
      },
    },
  },
  lowReason: {
    singularLabel: 'Motivo de Baixa',
    pluralLabel: 'Motivo de Baixas',
    list: {
      pageTitle: 'Motivos de Baixa',
      pageSubtitle: 'Administre os motivos utilizados nas baixas de animais.',
      deletedToast: 'Motivo de baixa removido com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        doMovement: 'Movimenta',
        isEnabled: 'Status',
        doMovementYes: 'Sim',
        doMovementNo: 'Não',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum motivo de baixa cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro motivo de baixa.',
        titleEmptyNoCreate: 'Nenhum motivo de baixa cadastrado.',
        descriptionEmptyNoCreate: 'Fale com um administrador para cadastrar um motivo de baixa.',
        titleFiltered: 'Nenhum motivo de baixa encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Motivo de Baixa',
      },
    },
    filter: {
      title: 'Filtrar motivos de baixa',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      doMovement: 'Movimenta',
      doMovementAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      movementOptions: {
        yes: 'Sim',
        no: 'Não',
      },
    },
    form: {
      title: {
        create: 'Novo Motivo de Baixa',
        edit: 'Editar Motivo de Baixa',
      },
      subtitle: {
        create: 'Cadastre um novo motivo para uso nas baixas de animais.',
        edit: 'Atualize os dados do motivo de baixa.',
      },
      fields: {
        code: 'Código',
        description: 'Descrição',
        doMovement: 'Movimenta',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Morte, Venda, Furto',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente ao salvar',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
    detail: {
      sections: {
        generalData: 'Dados Gerais',
      },
      fields: {
        code: 'Código',
        description: 'Descrição',
        doMovement: 'Movimenta',
        isEnabled: 'Status',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Motivo de baixa não encontrado',
        description: 'O motivo de baixa que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
  measurement: {
    singularLabel: 'Unidade de Medida',
    pluralLabel: 'Unidade de Medidas',
    list: {
      pageTitle: 'Un. de Medida',
      pageSubtitle: 'Administre as unidades de medida utilizadas nos cadastros do sistema.',
      deletedToast: 'Unidade de medida removida com sucesso',
      table: {
        name: 'Sigla',
        description: 'Descrição',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma unidade de medida cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira unidade de medida.',
        titleEmptyNoCreate: 'Nenhuma unidade de medida disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há unidades de medida cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma unidade de medida encontrada.',
        descriptionFiltered: 'Tente ajustar ou limpar a busca.',
        cta: 'Nova Un. de Medida',
      },
      deleteConfirm: {
        title: 'Excluir unidade de medida',
        description: 'Tem certeza que deseja excluir a unidade de medida',
        warning: 'Esta exclusão é definitiva e não pode ser desfeita.',
      },
    },
    filter: {
      title: 'Buscar Un. de Medida',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por sigla ou descrição',
    },
    form: {
      title: {
        create: 'Nova Un. de Medida',
        edit: 'Editar Un. de Medida',
      },
      subtitle: {
        create: 'Cadastre uma nova unidade de medida.',
        edit: 'Atualize os dados da unidade de medida.',
      },
      fields: {
        name: 'Sigla',
        description: 'Descrição',
      },
      placeholders: {
        name: 'Ex.: KG',
        description: 'Ex.: Quilograma',
      },
      validation: {
        nameRequired: 'A sigla é obrigatória',
        nameMaxLength: 'A sigla deve ter no máximo 8 caracteres',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
      },
    },
  },
  nfse: {
    singularLabel: 'NFS-e Recebida',
    pluralLabel: 'NFS-e Recebidas',
    list: {
      pageTitle: 'NFSe Recebidas',
      pageSubtitle: 'Consulte as notas fiscais de serviço recebidas pelo Emissor.',
      table: {
        prestador: 'Prestador',
        cpfCnpj: 'CPF/CNPJ',
        numero: 'Número',
        valor: 'Valor',
        dtEmissao: 'Dt. Emissão',
        competencia: 'Competência',
        lancada: 'Lançada',
        ibs: 'IBS',
        cbs: 'CBS',
      },
      badges: {
        launched: 'Lançada',
        notLaunched: 'Não lançada',
      },
      actions: {
        launchExpense: 'Lançar NFe Despesa',
        generateDanfe: 'Gerar DANFE',
        downloadXml: 'Baixar XML',
      },
      emptyState: {
        titleNoIssuer: 'Selecione o Emissor',
        descriptionNoIssuer: 'Selecione o Emissor para filtrar e listar as NFS-e recebidas.',
        titleEmpty: 'Nenhuma NFS-e sincronizada ainda.',
        descriptionEmpty: 'Use "Buscar DFe" para sincronizar os documentos deste Emissor.',
        titleFiltered: 'Nenhuma NFS-e encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou o período informado.',
      },
      error: {
        message: 'Não foi possível carregar as NFS-e recebidas.',
        retry: 'Tentar novamente',
      },
      downloadXmlError: 'Não foi possível baixar o XML desta NFS-e.',
      downloadXmlSuccess: 'XML baixado com sucesso',
      generateDanfeError: 'Não foi possível gerar o DANFE desta NFS-e.',
    },
    filter: {
      title: 'Filtrar NFSe Recebidas',
      issuer: 'Selecione o Emissor',
      issuerPlaceholder: 'Buscar emissor fiscal...',
      issuerRequired: 'Obrigatório para listar',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por prestador ou CPF/CNPJ',
      dateFrom: 'Dt. Início',
      dateTo: 'Dt. Fim',
      dateRangeInvalid: 'A data final é anterior à data inicial.',
      launched: 'Lançada',
      launchedAll: 'Todas',
      launchedOptions: {
        yes: 'Sim',
        no: 'Não',
      },
    },
    syncScreen: {
      pageTitle: 'Buscar DFe',
      pageSubtitle: 'Consulte os documentos fiscais eletrônicos recebidos deste Emissor.',
      issuer: 'Selecione o Emissor',
      issuerPlaceholder: 'Buscar emissor fiscal...',
      issuerRequired: 'Selecione um Emissor Fiscal',
      submitButton: 'Consultar DF-e',
      loadingMessage:
        'Consultando o webservice nacional... isso pode levar alguns segundos ou minutos.',
      successToast: 'documento(s) sincronizado(s)',
      errorToast: 'Não foi possível consultar os DF-e deste Emissor.',
      certificateMissingError:
        'Este Emissor não possui certificado digital A1 cadastrado. Cadastre o certificado para consultar DF-e.',
      certificateMissingLink: 'Ir para o certificado do Emissor',
      emptyIssuerState: 'Selecione um Emissor para consultar os DF-e.',
      successNone: 'nenhuma NFS-e nova',
      environmentHomologation: '(homologação)',
      retryButton: 'Tentar novamente',
      issuerLink: 'Ver cadastro do emissor',
      timeoutError: 'Não foi possível concluir a consulta no tempo esperado. Tente novamente.',
    },
    expenseDraft: {
      successMessage: 'Rascunho de despesa calculado com sucesso',
      noPermissionReason: 'Você precisa da permissão de criar despesas para lançar esta NFS-e.',
    },
  },
  parameterWeight: {
    singularLabel: 'Parâmetro de Peso',
    pluralLabel: 'Parâmetros de Peso',
    list: {
      pageTitle: 'Parâmetros / Peso',
      pageSubtitle: 'Administre as faixas de peso utilizadas no manejo do rebanho.',
      deletedToast: 'Parâmetro de peso removido com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        date: 'Data',
        info: 'Variação de Peso',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum parâmetro de peso cadastrado.',
        descriptionEmpty: 'Comece adicionando a primeira faixa de peso.',
        titleFiltered: 'Nenhum parâmetro encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Parâmetro de Peso',
      },
    },
    filter: {
      title: 'Filtrar parâmetros de peso',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição ou código',
      dateFrom: 'De',
      dateTo: 'Até',
      dateRangeInvalid: 'A data final deve ser igual ou posterior à data inicial',
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Há registros vinculados a este parâmetro de peso. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        batches: 'Lote(s) vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Novo Parâmetro de Peso',
        edit: 'Editar Parâmetro de Peso',
      },
      subtitle: {
        create: 'Cadastre uma nova faixa de peso para o manejo do rebanho.',
        edit: 'Atualize os dados da faixa de peso.',
      },
      fields: {
        description: 'Descrição',
        date: 'Data',
        initialWeight: 'Peso Inicial',
        finalWeight: 'Peso Final',
        code: 'Código',
        employee: 'Responsável',
        responsible: 'Responsável',
      },
      placeholders: {
        description: 'Ex.: Bezerro - Desmame',
      },
      hints: {
        codeAutoGenerated: 'O código será gerado automaticamente ao salvar.',
        employeeHistoric: 'Responsável (histórico): {name}',
      },
      validation: {
        dateInvalid: 'Informe uma data válida',
        dateRequired: 'A data é obrigatória',
        dateOutOfRange: 'A data deve estar entre 01/01/1900 e 31/12/2100',
        weightInvalid: 'Informe um peso válido',
        weightRequired: 'O peso é obrigatório',
        weightMin: 'O peso não pode ser negativo',
        finalWeightMustBeGreater: 'O peso final deve ser maior que o peso inicial',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 40 caracteres',
      },
    },
  },
  paymentTerm: {
    singularLabel: 'Condição de Pagamento',
    pluralLabel: 'Condição de Pagamentos',
    list: {
      pageTitle: 'Condições de Pagamento',
      pageSubtitle:
        'Administre as condições de pagamento utilizadas em contas a pagar e a receber.',
      deletedToast: 'Condição de pagamento removida com sucesso',
      table: {
        description: 'Descrição',
        condition: 'Condição',
        type: 'Tipo',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhuma condição de pagamento cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira condição de pagamento.',
        titleFiltered: 'Nenhuma condição de pagamento encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Condição de Pagamento',
      },
    },
    filter: {
      title: 'Filtrar condições de pagamento',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Ativo', inactive: 'Inativo' },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: { purchase: 'Compra', sale: 'Venda', both: 'Ambos' },
    },
    form: {
      title: { create: 'Nova Condição de Pagamento', edit: 'Editar Condição de Pagamento' },
      subtitle: {
        create: 'Cadastre uma nova condição de pagamento para uso em contas a pagar e a receber.',
        edit: 'Atualize os dados da condição de pagamento.',
      },
      fields: {
        description: 'Descrição',
        condition: 'Condição (dias)',
        type: 'Tipo',
        isEnabled: 'Status',
        outDay: 'Fora dia',
      },
      placeholders: { description: 'Ex.: 30/60/90 dias', condition: 'Ex.: 10,20,30' },
      typeOptions: { purchase: 'Compra', sale: 'Venda', both: 'Ambos' },
      outDayOptions: { yes: 'Sim', no: 'Não' },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        conditionRequired: 'A condição é obrigatória',
        conditionMaxLength: 'A condição deve ter no máximo 100 caracteres',
        conditionInvalid: 'Favor seguir o padrão de dias separados por vírgula: 10,20,30.',
        typeRequired: 'O tipo é obrigatório',
      },
    },
  },
  // Cadastros Base — Configurações — Permissões (Permission, execução 032,
  // TASK-FE-2400/2404). 4 telas: Listagem (busca opcional, contrato §7.2) +
  // Criação/Edição (2 campos) + Visualização (4 campos, fiel ao
  // `show.blade.php`).
  permission: {
    singularLabel: 'Permissão',
    pluralLabel: 'Permissões',
    list: {
      pageTitle: 'Permissões',
      pageSubtitle: 'Administre o catálogo de permissões do sistema.',
      deletedToast: 'Permissão removida com sucesso',
      table: { name: 'Nome', description: 'Descrição' },
      actions: { view: 'Visualizar', edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhuma permissão cadastrada.',
        descriptionEmpty: 'Comece cadastrando a primeira permissão.',
        titleFiltered: 'Nenhuma permissão encontrada.',
        descriptionFiltered: 'Tente ajustar os termos da busca.',
        cta: 'Nova Permissão',
      },
      search: { placeholder: 'Buscar por nome ou descrição...' },
    },
    form: {
      title: { create: 'Nova Permissão', edit: 'Editar Permissão' },
      subtitle: {
        create: 'Cadastre uma nova permissão.',
        edit: 'Atualize os dados da permissão.',
      },
      fields: { name: 'Nome', description: 'Descrição' },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 60 caracteres',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 191 caracteres',
      },
    },
    detail: {
      pageTitle: 'Permissão',
      fields: {
        name: 'Nome',
        description: 'Descrição',
        createdAt: 'Dt. Criação',
        updatedAt: 'Dt. Atualização',
      },
      actions: { edit: 'Editar' },
      notFound: {
        title: 'Permissão não encontrada',
        description: 'A permissão solicitada não existe ou foi removida.',
        back: 'Voltar',
      },
    },
  },
  // Cadastros Base — Configurações — Termos e Condições (PlatformDocument,
  // execução 032, TASK-FE-2500/2501/2502). Tela ÚNICA (settings-form de
  // registro singleton, SEM lista, SEM `/novo`/`:uuid`) — 2 cards
  // independentes ("Termos de Uso AGRO365" / "Políticas de Privacidade
  // AGRO365"), cada um com upload + metadado + botão "Salvar" próprios.
  platformDocuments: {
    singularLabel: 'Termos e Condições',
    page: {
      title: 'Termos e Condições',
      subtitle: 'Gerencie os documentos institucionais PDF exibidos aos usuários.',
    },
    cards: {
      termsOfUse: {
        title: 'Termos de Uso AGRO365',
        uploadHint: 'Anexar em formato PDF. Tam. Até 2MB.',
        uploadedAt: 'Enviado em {date}',
        uploadedAtWithAuthor: 'Enviado em {date} por {author}',
        emptyState: 'Nenhum documento enviado ainda.',
      },
      privacyPolicy: {
        title: 'Políticas de Privacidade AGRO365',
        uploadHint: 'Anexar em formato PDF. Tam. Até 2MB.',
        uploadedAt: 'Enviado em {date}',
        uploadedAtWithAuthor: 'Enviado em {date} por {author}',
        emptyState: 'Nenhum documento enviado ainda.',
      },
    },
    errors: {
      loadFailed: {
        title: 'Não foi possível carregar os documentos',
        description: 'Tente novamente em alguns instantes.',
      },
    },
  },
  reversalExpense: {
    singularLabel: 'Estorno',
    pluralLabel: 'Estornos',
    list: {
      pageTitle: 'Estorno',
      pageSubtitle:
        'Administre os tipos de estorno utilizados para classificar despesas acessórias de Cobrança e Transferência.',
      deletedToast: 'Estorno removido com sucesso',
      table: {
        description: 'Descrição',
        useKg: 'Usa Kg',
        isEnabled: 'Status',
        value: 'Valor',
        active: 'Ativo',
        inactive: 'Inativo',
        yes: 'Sim',
        no: 'Não',
      },
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhum estorno cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro estorno.',
        titleFiltered: 'Nenhum estorno encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Estorno',
      },
    },
    filter: {
      title: 'Filtrar estornos',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Ativo', inactive: 'Inativo' },
    },
    form: {
      title: { create: 'Novo Estorno', edit: 'Editar Estorno' },
      subtitle: {
        create: 'Cadastre um novo tipo de estorno.',
        edit: 'Atualize os dados do estorno.',
      },
      fields: { description: 'Descrição', isEnabled: 'Status', value: 'Valor', useKg: 'Usa Kg' },
      placeholders: { description: 'Ex.: Estorno de DARF' },
      useKgOptions: { yes: 'Sim', no: 'Não' },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 30 caracteres',
        valueRequired: 'O valor é obrigatório',
        valueInvalid: 'Informe um valor numérico válido',
        valueMin: 'O valor não pode ser negativo',
      },
    },
  },
  serviceExpense: {
    singularLabel: 'Serviço',
    pluralLabel: 'Serviços',
    list: {
      pageTitle: 'Serviços',
      pageSubtitle:
        'Administre os tipos de serviço utilizados para classificar despesas acessórias de Cobrança e Transferência.',
      deletedToast: 'Serviço removido com sucesso',
      table: {
        description: 'Descrição',
        useKg: 'Usa Kg',
        isEnabled: 'Status',
        payTeam: 'Pagamento de Equipe',
        hasCommission: 'Tem Comissão',
        value: 'Valor',
        active: 'Ativo',
        inactive: 'Inativo',
        yes: 'Sim',
        no: 'Não',
      },
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhum serviço cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro serviço.',
        titleFiltered: 'Nenhum serviço encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Serviço',
      },
    },
    filter: {
      title: 'Filtrar serviços',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: { active: 'Ativo', inactive: 'Inativo' },
    },
    form: {
      title: { create: 'Novo Serviço', edit: 'Editar Serviço' },
      subtitle: {
        create: 'Cadastre um novo tipo de serviço.',
        edit: 'Atualize os dados do serviço.',
      },
      fields: {
        description: 'Descrição',
        isEnabled: 'Status',
        value: 'Vl. Referência',
        useKg: 'Usa Kg',
        payTeam: 'Pagamento de Equipe',
        hasCommission: 'Tem Comissão',
        commission: 'Comissão(%)',
      },
      placeholders: { description: 'Ex.: Poda de árvores' },
      useKgOptions: { yes: 'Sim', no: 'Não' },
      payTeamOptions: { yes: 'Sim', no: 'Não' },
      hasCommissionOptions: { yes: 'Sim', no: 'Não' },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 30 caracteres',
        valueRequired: 'O valor é obrigatório',
        valueInvalid: 'Informe um valor numérico válido',
        valueMin: 'O valor não pode ser negativo',
        commissionRequired: 'A comissão é obrigatória',
        commissionInvalid: 'Informe um valor numérico válido',
        commissionMin: 'A comissão não pode ser negativa',
      },
    },
  },
  systemUpdate: {
    singularLabel: 'Atualização do Sistema',
    pluralLabel: 'Atualizações do Sistema',
    list: {
      pageTitle: 'Atualizações do Sistema',
      pageSubtitle: 'Administre os comunicados e o changelog exibidos aos usuários.',
      deletedToast: 'Atualização do sistema removida com sucesso',
      table: {
        releaseDate: 'Dt. Lançamento',
        description: 'Descrição',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma atualização do sistema cadastrada.',
        descriptionEmpty: 'Comece adicionando o primeiro comunicado.',
        cta: 'Nova Atualização',
      },
    },
    form: {
      title: { create: 'Nova Atualização', edit: 'Editar Atualização' },
      subtitle: {
        create: 'Cadastre um novo comunicado do sistema.',
        edit: 'Atualize os dados do comunicado.',
      },
      fields: {
        releaseDate: 'Dt. Lançamento',
        description: 'Descrição',
      },
      placeholders: {
        description: 'Descreva a atualização...',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
      },
    },
    detail: {
      pageTitle: 'Atualização do Sistema',
      fields: {
        releaseDate: 'Dt. Lançamento',
        description: 'Descrição',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Atualização não encontrada',
        description: 'A atualização do sistema solicitada não existe ou foi removida.',
        back: 'Voltar',
      },
    },
    pendingModal: {
      title: 'Atualização do Sistema',
      dismiss: 'Fechar',
    },
  },
  // Contratantes (Tenant, TASK-TN-FE-01/02) — CRUD completo, fidelidade ao
  // formulário legado `agro365/resources/views/tenants/_forms.blade.php`
  // (labels reais: `trad.var_rsocial`/`var_cpf`/`var_nomefan`/etc.).
  tenant: {
    singularLabel: 'Contratante',
    pluralLabel: 'Contratantes',
    list: {
      pageTitle: 'Contratantes',
      pageSubtitle: 'Gerencie os contratantes (clientes) da plataforma.',
      deletedToast: 'Contratante removido com sucesso',
      table: {
        nickname: 'Razão Social',
        nif: 'CPF/CNPJ',
        status: 'Status',
        dueDate: 'Vencimento',
        dueDateIndeterminate: 'Indeterminado',
      },
      actions: {
        edit: 'Editar',
        view: 'Visualizar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum contratante cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro contratante.',
        titleFiltered: 'Nenhum contratante encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Contratante',
      },
      deleteConfirm: {
        title: 'Excluir contratante',
        description: 'Tem certeza que deseja excluir o contratante',
        warning:
          'Esta ação é irreversível: as fazendas e todos os dados vinculados a este contratante também serão removidos.',
      },
    },
    filter: {
      title: 'Filtrar contratantes',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome, razão social ou CPF/CNPJ',
      searchMaxLength: 'A busca aceita no máximo 60 caracteres.',
      status: 'Status',
      statusAll: 'Todos',
      signature: 'Assinatura',
      signatureAll: 'Todas',
      dueMonth: 'Mês de vigência',
      dueMonthAll: 'Todos',
      dueDay: 'Dia de vencimento',
      dueDayAll: 'Todos',
      dtAccession: 'Data de adesão',
      startDate: 'Cadastrado a partir de',
      endDate: 'Cadastrado até',
      role: 'Atribuição',
      roleAll: 'Todas',
      plan: 'Plano',
      planAll: 'Todos',
      months: {
        january: 'Janeiro',
        february: 'Fevereiro',
        march: 'Março',
        april: 'Abril',
        may: 'Maio',
        june: 'Junho',
        july: 'Julho',
        august: 'Agosto',
        september: 'Setembro',
        october: 'Outubro',
        november: 'Novembro',
        december: 'Dezembro',
      },
    },
    status: {
      active: 'Habilitado',
      defaulting: 'Inadimplente',
      suspended: 'Suspenso',
      cancelled: 'Cancelado',
    },
    signature: {
      trial: 'Trial',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
      biannual: 'Bianual',
      undetermined: 'Indeterminado',
    },
    dueDay: {
      dayPrefix: 'Dia',
    },
    form: {
      title: {
        create: 'Novo Contratante',
        edit: 'Editar Contratante',
        view: 'Visualizar Contratante',
      },
      subtitle: {
        create: 'Cadastre um novo contratante da plataforma.',
        edit: 'Atualize os dados do contratante.',
      },
      fields: {
        countryId: 'País',
        nif: 'CPF/CNPJ',
        nickname: 'Razão Social',
        name: 'Nome Fantasia',
        email: 'Email',
        phone: 'Telefone',
        cellphone: 'Celular',
        roleId: 'Atribuição',
        planUuid: 'Plano',
        listAllFarms: 'Listar Todas as Fazendas',
        qtdFarms: 'Qtd. Fazendas',
        qtdUsers: 'Qtd. Usuários',
        exportXls: 'Exportar XLS',
        zipCode: 'CEP',
        address: 'Endereço',
        city: 'Cidade',
        contact: 'Contato',
        contactPhone: 'Tel. do Contato',
        status: 'Status',
        usesCashBook: 'Utiliza Livro Caixa',
        useFiscal: 'Fiscal/Não Fiscal',
        signature: 'Assinatura',
        dtAccession: 'Dt. Adesão',
        dueDate: 'Dt. Vigência Assinatura',
        dueDay: 'Dia de Vencimento',
        value: 'Valor',
        generateFinancial: 'Gera Financeiro NFe',
        generateTicket: 'Gera Boleto/Remessa',
        cancellationReason: 'Motivo do Cancelamento',
        centers: 'Centros de Custo',
        qtdIssuers: 'Qtd. Emissores',
        qtdNfe: 'Qtd. NF-e',
        qtdCte: 'Qtd. CT-e',
        qtdMdfe: 'Qtd. MDF-e',
      },
      placeholders: {
        countryId: 'Selecione o país',
        roleId: 'Selecione a atribuição',
        planUuid: 'Selecione o plano',
        city: 'Selecione a cidade',
        status: 'Selecione o status',
        signature: 'Selecione a assinatura',
        dueDay: 'Selecione o dia',
        centersSearch: 'Buscar centro de custo',
        zipCode: '00000-000',
      },
      booleanOptions: {
        yes: 'Sim',
        no: 'Não',
      },
      centersField: {
        selectAll: 'Marcar todos',
        deselectAll: 'Desmarcar todos',
        selectedCount: 'Selecionados',
        empty: 'Nenhum centro de custo encontrado.',
      },
      cepAutofill: {
        invalidFormat: {
          title: 'Formato de CEP inválido.',
          description: 'Informe o CEP completo no formato 00000-000.',
        },
        notFound: {
          title: 'CEP não encontrado.',
          description: 'Preencha o endereço manualmente.',
        },
        cityNotResolved: {
          title: 'Cidade não localizada',
          description:
            'Endereço preenchido, mas a cidade não foi identificada — selecione-a manualmente.',
        },
        networkError: {
          title: 'Falha ao consultar o CEP',
          description: 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.',
        },
      },
      nifAutofill: {
        alreadyTenant: {
          title: 'Pessoa já é contratante',
          description:
            'Esta pessoa já está cadastrada como contratante. Os dados foram preenchidos; confira antes de salvar.',
        },
        cnpjNotFound: {
          title: 'CNPJ não encontrado.',
          description:
            'A Receita não retornou dados para este CNPJ. Preencha os dados manualmente.',
        },
        cnpjUnavailable: {
          title: 'Consulta de CNPJ indisponível',
          description: 'Não foi possível consultar a Receita agora. Preencha os dados manualmente.',
        },
        rateLimited: {
          title: 'Muitas consultas seguidas',
          description: 'Aguarde alguns instantes antes de consultar outro CPF/CNPJ.',
        },
        networkError: {
          title: 'Falha ao consultar o CPF/CNPJ',
          description: 'Não foi possível buscar os dados agora. Preencha os dados manualmente.',
        },
      },
      validation: {
        countryIdRequired: 'O país é obrigatório',
        nifRequired: 'O CPF/CNPJ é obrigatório',
        nifInvalid: 'CPF/CNPJ inválido',
        nicknameRequired: 'A razão social é obrigatória',
        nicknameMaxLength: 'A razão social deve ter no máximo 60 caracteres',
        nameRequired: 'O nome fantasia é obrigatório',
        nameMaxLength: 'O nome fantasia deve ter no máximo 30 caracteres',
        emailRequired: 'O e-mail é obrigatório',
        emailInvalid: 'E-mail inválido',
        emailMaxLength: 'O e-mail deve ter no máximo 89 caracteres',
        zipCodeMaxLength: 'O CEP deve ter no máximo 9 caracteres',
        cellphoneMaxLength: 'O celular deve ter no máximo 15 caracteres',
        contactPhoneMaxLength: 'O telefone do contato deve ter no máximo 15 caracteres',
        phoneRequired: 'O telefone é obrigatório',
        phoneMaxLength: 'O telefone deve ter no máximo 15 caracteres',
        roleIdRequired: 'Selecione uma atribuição',
        planRequired: 'Selecione um plano',
        qtdFarmsRequired: 'A quantidade de fazendas é obrigatória',
        qtdFarmsInvalid: 'Quantidade inválida',
        qtdFarmsMin: 'A quantidade deve ser de no mínimo 1',
        qtdUsersRequired: 'A quantidade de usuários é obrigatória',
        qtdUsersInvalid: 'Quantidade inválida',
        qtdUsersMin: 'A quantidade deve ser de no mínimo 1',
        exportXlsRequired: 'Selecione uma opção',
        addressRequired: 'O endereço é obrigatório',
        addressMaxLength: 'O endereço deve ter no máximo 120 caracteres',
        cityRequired: 'Selecione uma cidade',
        contactMaxLength: 'O contato deve ter no máximo 120 caracteres',
        statusRequired: 'Selecione um status',
        useFiscalRequired: 'Selecione uma opção',
        signatureRequired: 'Selecione uma assinatura',
        dtAccessionRequired: 'A data de adesão é obrigatória',
        dueDateRequired: 'A data de vigência é obrigatória',
        dueDayRequired: 'Selecione o dia de vencimento',
        valueRequired: 'O valor é obrigatório',
        valueInvalid: 'Valor inválido',
        valueMin: 'O valor não pode ser negativo',
        generateFinancialRequired: 'Selecione uma opção',
        generateTicketRequired: 'Selecione uma opção',
        cancellationReasonRequired: 'O motivo do cancelamento é obrigatório',
        centersRequired: 'Selecione ao menos um centro de custo',
        qtdIssuersRequired: 'A quantidade de emissores é obrigatória',
        qtdIssuersInvalid: 'Quantidade inválida',
        qtdIssuersMin: 'A quantidade deve ser de no mínimo 1',
        qtdNfeRequired: 'A quantidade de NF-e é obrigatória',
        qtdNfeInvalid: 'Quantidade inválida',
        qtdNfeMin: 'A quantidade deve ser de no mínimo 1',
        qtdCteRequired: 'A quantidade de CT-e é obrigatória',
        qtdCteInvalid: 'Quantidade inválida',
        qtdCteMin: 'A quantidade deve ser de no mínimo 1',
        qtdMdfeRequired: 'A quantidade de MDF-e é obrigatória',
        qtdMdfeInvalid: 'Quantidade inválida',
        qtdMdfeMin: 'A quantidade deve ser de no mínimo 1',
      },
    },
  },
  tenantParameters: {
    singularLabel: 'Parametrizações',
    pluralLabel: 'Parametrizaçõess',
    form: {
      title: 'Parametrizações',
      subtitle: 'Configure os parâmetros gerais do tenant.',
      sections: {
        fiscais: 'Fiscais',
      },
      fields: {
        calcIcmsDesonerado: 'Cálculo e dedução de ICMS desonerado',
      },
      booleanOptions: {
        yes: 'Sim',
        no: 'Não',
      },
      validation: {
        calcIcmsDesoneradoRequired: 'Selecione uma opção',
      },
      noFarmSelected: {
        title: 'Selecione uma fazenda',
        description:
          'As parametrizações são compartilhadas por todas as fazendas do tenant, mas o acesso exige uma fazenda ativa selecionada.',
      },
      savedToast: 'Parametrizações atualizadas com sucesso.',
    },
  },
  typeTitle: {
    singularLabel: 'Tipo de Título',
    pluralLabel: 'Tipo de Títulos',
    list: {
      pageTitle: 'Tipos de Título',
      pageSubtitle: 'Administre os tipos de título utilizados em lançamentos financeiros.',
      deletedToast: 'Tipo de título removido com sucesso',
      table: {
        description: 'Descrição',
        type: 'Tipo',
        factor: 'Fator',
        status: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum tipo de título cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro tipo de título.',
        titleFiltered: 'Nenhum tipo de título encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Tipo de Título',
      },
    },
    filter: {
      title: 'Filtrar tipos de título',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        payable: 'Pagar',
        receivable: 'Receber',
        both: 'Ambas',
      },
    },
    form: {
      title: {
        create: 'Novo Tipo de Título',
        edit: 'Editar Tipo de Título',
      },
      subtitle: {
        create: 'Cadastre um novo tipo de título para uso em lançamentos financeiros.',
        edit: 'Atualize os dados do tipo de título.',
      },
      fields: {
        description: 'Descrição',
        type: 'Tipo',
        factor: 'Fator',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'Ex.: Boleto, Duplicata, Cheque',
      },
      typeOptions: {
        payable: 'Pagar',
        receivable: 'Receber',
        both: 'Ambas',
      },
      factorOptions: {
        add: 'Soma',
        subtract: 'Diminui',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        typeRequired: 'O tipo é obrigatório',
        factorRequired: 'O fator é obrigatório',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Módulo (BatchGrazing, execução 029,
  // TASK-FE-2000) — vínculo N:N Lote×Módulo Pastejo, SEM edição (API sem
  // PUT/PATCH, D1 do contrato de API) — ação de linha é Visualizar+Excluir.
  // Exclusão NÃO-DESTRUTIVA (D3/D12 do contrato de API — encerra o vínculo
  // com registro de saída, nunca apaga histórico), mirror
  // `contrato-fe-convencoes-chokepoints.md §5.1`.
  // ============================================
  batchGrazing: {
    singularLabel: 'Lote / Módulo',
    pluralLabel: 'Lotes / Módulo',
    list: {
      pageTitle: 'Lote / Módulo',
      pageSubtitle: 'Administre os vínculos entre lotes de animais e módulos de pastejo.',
      deletedToast: 'Vínculo de Lote/Módulo encerrado com sucesso',
      table: {
        code: 'Código',
        grazing: 'Módulo',
        batches: 'Lotes Vinculados',
        date: 'Data',
        employee: 'Responsável',
        animalQuantity: 'Quant/Animais',
        uaQuantity: 'Quant/UA',
        stockingRate: 'Taxa Lotação/UA',
      },
      actions: {
        view: 'Visualizar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum vínculo de Lote/Módulo cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro vínculo.',
        cta: 'Novo Lote/Módulo',
      },
    },
    deleteDialog: {
      title: 'Encerrar vínculo',
      description:
        'O vínculo será encerrado e um registro de saída será mantido no histórico — nenhum dado é apagado',
      warningText:
        'Esta ação não é destrutiva: o histórico de saída permanece disponível no registro',
      confirm: 'Encerrar vínculo',
    },
    removeBatchDialog: {
      title: 'Remover lote do vínculo',
      description:
        'Este lote sai do vínculo, mas o histórico de saída é mantido — nenhum dado é apagado',
      warningText:
        'Esta ação não é destrutiva: o histórico de saída permanece disponível no registro',
      confirm: 'Remover lote',
    },
    form: {
      title: {
        create: 'Novo Lote / Módulo',
      },
      subtitle: {
        create: 'Vincule um ou mais lotes a um módulo de pastejo.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        employee: 'Responsável',
        grazing: 'Módulo',
        batches: 'Lote',
        hectares: 'Hectares',
        animalQuantity: 'Quant/Animais',
        uaQuantity: 'Quant/UA',
        stockingRate: 'Taxa Lotação/UA',
      },
      placeholders: {
        code: 'Gerado automaticamente',
        grazing: 'Selecione o módulo de pastejo',
        batches: 'Selecione um ou mais lotes',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
        metricsPending: 'Calculado após salvar',
      },
      validation: {
        dateRequired: 'A data é obrigatória',
        grazingRequired: 'O módulo é obrigatório',
        batchesRequired: 'Os lotes são obrigatórios',
        batchesMin: 'Selecione ao menos um lote',
      },
    },
    detail: {
      sections: {
        generalData: 'Dados Gerais',
        metrics: 'Métricas',
        batchesLinked: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        grazing: 'Módulo',
        date: 'Data',
        employee: 'Responsável',
        hectares: 'Hectares',
        animalQuantity: 'Quant/Animais',
        uaQuantity: 'Quant/UA',
        stockingRate: 'Taxa Lotação/UA',
      },
      actions: {
        removeBatch: 'Remover',
        deleteLink: 'Excluir vínculo',
      },
      notFound: {
        title: 'Vínculo não encontrado',
        description: 'O vínculo de Lote/Módulo que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Lote/Área (BatchArea, execução 029,
  // TASK-FE-2100) — irmã estrutural de BatchGrazing (mesma anatomia,
  // trocando Módulo por Área). "UA/Suporte" existe aqui (ao contrário de
  // Lote/Módulo) e é exibida LITERAL (cabeças/hectare, D9 do contrato de
  // API) — tooltip de nota de unidade em `hints.uaSupportTooltip`.
  // ============================================
  batchArea: {
    singularLabel: 'Lote / Área',
    pluralLabel: 'Lotes / Área',
    list: {
      pageTitle: 'Lote / Área',
      pageSubtitle: 'Administre os vínculos entre lotes de animais e áreas.',
      deletedToast: 'Vínculo de Lote/Área encerrado com sucesso',
      table: {
        code: 'Código',
        area: 'Área',
        batches: 'Lotes Vinculados',
        date: 'Data',
        employee: 'Responsável',
        animalQuantity: 'Quant/Animais',
        uaQuantity: 'Quant/UA',
        stockingRate: 'Taxa Lotação/UA',
      },
      actions: {
        view: 'Visualizar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum vínculo de Lote/Área cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro vínculo.',
        cta: 'Novo Lote/Área',
      },
      filter: {
        title: 'Filtros',
        batch: 'Lote',
        batchPlaceholder: 'Selecione o lote',
        area: 'Área',
        areaPlaceholder: 'Selecione a área',
      },
    },
    deleteDialog: {
      title: 'Encerrar vínculo',
      description:
        'O vínculo será encerrado e um registro de saída será mantido no histórico — nenhum dado é apagado',
      warningText:
        'Esta ação não é destrutiva: o histórico de saída permanece disponível no registro',
      confirm: 'Encerrar vínculo',
    },
    removeBatchDialog: {
      title: 'Remover lote do vínculo',
      description:
        'Este lote sai do vínculo, mas o histórico de saída é mantido — nenhum dado é apagado',
      warningText:
        'Esta ação não é destrutiva: o histórico de saída permanece disponível no registro',
      confirm: 'Remover lote',
    },
    form: {
      title: {
        create: 'Novo Lote / Área',
      },
      subtitle: {
        create: 'Vincule um ou mais lotes a uma área.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        employee: 'Responsável',
        area: 'Área',
        batches: 'Lote',
        hectares: 'Hectares',
        uaSupport: 'UA/Suporte',
        animalQuantity: 'Quant/Animais',
        uaQuantity: 'Quant/UA',
        stockingRate: 'Taxa Lotação/UA',
      },
      placeholders: {
        code: 'Gerado automaticamente',
        area: 'Selecione a área',
        batches: 'Selecione um ou mais lotes',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
        metricsPending: 'Calculado após salvar',
        uaSupportTooltip:
          'Calculado como cabeças ÷ hectare, não UA — mantido por decisão do responsável.',
      },
      validation: {
        dateRequired: 'A data é obrigatória',
        areaRequired: 'A área é obrigatória',
        batchesRequired: 'Os lotes são obrigatórios',
        batchesMin: 'Selecione ao menos um lote',
      },
    },
    detail: {
      sections: {
        generalData: 'Dados Gerais',
        metrics: 'Métricas',
        batchesLinked: 'Lotes Vinculados',
      },
      fields: {
        code: 'Código',
        area: 'Área',
        date: 'Data',
        employee: 'Responsável',
        animalQuantity: 'Quant/Animais',
        totalWeight: 'Peso Total (kg)',
        averageWeight: 'Peso Médio (kg)',
        averageUaPerBatch: 'Total UA/Lote',
        hectares: 'Hectares',
      },
      hints: {
        averageUaPerBatchTooltip: 'Média de UA por animal, agregada.',
      },
      actions: {
        removeBatch: 'Remover',
        deleteLink: 'Excluir vínculo',
      },
      notFound: {
        title: 'Vínculo não encontrado',
        description: 'O vínculo de Lote/Área que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Cochos (Trough, execução 029, TASK-FE-2200)
  // — CRUD completo (criação/edição real, API TEM PUT) + visualização NOVA
  // (cards). Trio de localização Área/Módulo Pastejo/Curral com regra XOR
  // (client-side) e semântica "manter vs. desvincular" do Curral (D-FE-1 do
  // contrato de tela — botão explícito "Remover vínculo").
  // ============================================
  trough: {
    singularLabel: 'Cocho',
    pluralLabel: 'Cochos',
    list: {
      pageTitle: 'Cochos',
      pageSubtitle: 'Administre os cochos utilizados na alimentação do rebanho.',
      deletedToast: 'Cocho removido com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        type: 'Tipo',
        location: 'Localização',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum cocho cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro cocho.',
        titleFiltered: 'Nenhum cocho encontrado.',
        descriptionFiltered: 'Ajuste os filtros de busca e tente novamente.',
        cta: 'Novo Cocho',
      },
    },
    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Busque por código, descrição, área ou módulo',
    },
    typeOptions: {
      covered: 'Coberto',
      uncovered: 'Descoberto',
    },
    activeOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    form: {
      title: {
        create: 'Novo Cocho',
        edit: 'Editar Cocho',
      },
      subtitle: {
        create: 'Cadastre um novo cocho para a alimentação do rebanho.',
        edit: 'Atualize os dados do cocho.',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descrição',
        totalArea: 'Área (Cm)',
        grazing: 'Módulo Pastejo',
        area: 'Área',
        feedlotCorral: 'Curral',
        active: 'Ativo',
      },
      placeholders: {
        type: 'Selecione o tipo',
        description: 'Informe a descrição do cocho',
        totalArea: 'Informe a área em cm',
        grazing: 'Selecione o módulo de pastejo',
        area: 'Selecione a área',
        feedlotCorral: 'Selecione o curral',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
        locationExclusive:
          'Área e Módulo Pastejo são mutuamente exclusivos — selecionar um limpa o outro.',
        feedlotCorralKeep: 'Deixe em branco para manter o curral atual.',
      },
      actions: {
        removeFeedlotCorral: 'Remover vínculo',
      },
      validation: {
        typeRequired: 'O tipo é obrigatório',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        totalAreaRequired: 'A área é obrigatória',
        totalAreaMin: 'A área deve ser maior ou igual a zero',
        activeRequired: 'O status é obrigatório',
      },
    },
    detail: {
      sections: {
        generalData: 'Dados Gerais',
        location: 'Localização',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descrição',
        totalArea: 'Área (Cm)',
        area: 'Área',
        grazing: 'Módulo Pastejo',
        feedlotCorral: 'Curral',
      },
      emptyLocation: 'Nenhuma localização vinculada',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Cocho não encontrado',
        description: 'O cocho que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
  // ============================================
  // Cadastros Base — Pecuários — Bebedouros (DrinkingFountain, execução 029,
  // TASK-FE-2300) — DELTA sobre Trough (mesma anatomia): rótulo "Volume(L)"
  // no lugar de "Área(Cm)" (mesma coluna física `total_area`) + campo extra
  // `length`/"Comprimento(cm)" opcional. Item de menu NOVO (ver
  // navigationTree.ts/navigationPermissions.ts/languageSidebar.ts,
  // `contrato-fe-convencoes-chokepoints.md §7`).
  // ============================================
  drinkingFountain: {
    singularLabel: 'Bebedouro',
    pluralLabel: 'Bebedouros',
    list: {
      pageTitle: 'Bebedouros',
      pageSubtitle: 'Administre os bebedouros utilizados na alimentação do rebanho.',
      deletedToast: 'Bebedouro removido com sucesso',
      table: {
        code: 'Código',
        description: 'Descrição',
        type: 'Tipo',
        location: 'Localização',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum bebedouro cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro bebedouro.',
        titleFiltered: 'Nenhum bebedouro encontrado.',
        descriptionFiltered: 'Ajuste os filtros de busca e tente novamente.',
        cta: 'Novo Bebedouro',
      },
    },
    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Busque por código, descrição, área ou módulo',
    },
    typeOptions: {
      covered: 'Coberto',
      uncovered: 'Descoberto',
    },
    activeOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    form: {
      title: {
        create: 'Novo Bebedouro',
        edit: 'Editar Bebedouro',
      },
      subtitle: {
        create: 'Cadastre um novo bebedouro para a alimentação do rebanho.',
        edit: 'Atualize os dados do bebedouro.',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descrição',
        totalArea: 'Volume (L)',
        length: 'Comprimento (cm)',
        grazing: 'Módulo Pastejo',
        area: 'Área',
        feedlotCorral: 'Curral',
        active: 'Ativo',
      },
      placeholders: {
        type: 'Selecione o tipo',
        description: 'Informe a descrição do bebedouro',
        totalArea: 'Informe o volume em litros',
        length: 'Informe o comprimento em cm (opcional)',
        grazing: 'Selecione o módulo de pastejo',
        area: 'Selecione a área',
        feedlotCorral: 'Selecione o curral',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
        locationExclusive:
          'Área e Módulo Pastejo são mutuamente exclusivos — selecionar um limpa o outro.',
        feedlotCorralKeep: 'Deixe em branco para manter o curral atual.',
      },
      actions: {
        removeFeedlotCorral: 'Remover vínculo',
      },
      validation: {
        typeRequired: 'O tipo é obrigatório',
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        totalAreaRequired: 'O volume é obrigatório',
        totalAreaMin: 'O volume deve ser maior ou igual a zero',
        lengthMin: 'O comprimento deve ser maior ou igual a zero',
        activeRequired: 'O status é obrigatório',
      },
    },
    detail: {
      sections: {
        generalData: 'Dados Gerais',
        location: 'Localização',
      },
      fields: {
        code: 'Código',
        type: 'Tipo',
        description: 'Descrição',
        totalArea: 'Volume (L)',
        length: 'Comprimento (cm)',
        area: 'Área',
        grazing: 'Módulo Pastejo',
        feedlotCorral: 'Curral',
      },
      emptyLocation: 'Nenhuma localização vinculada',
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Bebedouro não encontrado',
        description: 'O bebedouro que você procura não existe ou foi removido.',
        back: 'Voltar',
      },
    },
  },
};
