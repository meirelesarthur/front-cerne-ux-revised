// src/constants/languages/languagePtBr/languageHarvests.ts
// Tradução PT-BR do módulo de SAFRAS (Cadastros Base).

import { ModuleHarvests } from '@/@types/language/module-harvests';

export const languageHarvests: ModuleHarvests = {
  harvest: {
    singularLabel: 'Safra',
    list: {
      pageTitle: 'Safras',
      pageSubtitle: 'Administre os períodos agrícolas de referência da fazenda.',
      deletedToast: 'Safra removida com sucesso',
      table: {
        description: 'Descrição',
        startDate: 'Dt. Início',
        endDate: 'Dt. Fim',
        active: 'Status',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
        weeks: 'Semanas',
        weeksSuffix: 'sem.',
      },
      actions: {
        view: 'Visualizar safra',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma safra cadastrada.',
        descriptionEmpty: 'Comece adicionando a primeira safra.',
        titleFiltered: 'Nenhuma safra encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Safra',
      },
    },
    filter: {
      title: 'Filtrar safras',
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
        create: 'Nova Safra',
        edit: 'Editar Safra',
      },
      subtitle: {
        create: 'Cadastre uma nova safra para organizar os períodos agrícolas da fazenda.',
        edit: 'Atualize os dados da safra.',
      },
      fields: {
        description: 'Descrição',
        startDate: 'Data de Início',
        endDate: 'Data de Fim',
        isEnabled: 'Ativo',
        herdControl: 'Controle de Rebanho',
        autoEvolution: 'Evolução Automática de Rebanho',
        firstMonth: '1º Semestre inicia em',
        secondMonth: '2º Semestre inicia em',
      },
      placeholders: {
        description: 'Ex.: Safra 2026/2027',
      },
      herdControlOptions: {
        individual: 'Individual',
        lote: 'Lote',
      },
      monthOptions: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ],
      weeks: {
        sectionTitle: 'Semanas da Safra',
        sectionHint:
          'Geradas automaticamente a partir do período informado. Clique ou arraste sobre as semanas para pintar com a cor selecionada.',
        weeksCountSuffix: 'semanas',
        emptyTitle:
          'Nenhuma semana gerada. Ajuste as datas de início e fim para gerar as semanas da safra.',
        emptyCta: 'Ir para as datas',
        toolbarLabel: 'Pintar com:',
        resetCycleButton: 'Reiniciar ciclo de cores',
        resetCycleDialogTitle: 'Reiniciar ciclo de cores?',
        resetCycleDialogDescription:
          'Isso substitui todas as cores pintadas manualmente pelo ciclo padrão de cores. Esta ação não pode ser desfeita.',
        resetCycleDialogConfirm: 'Reiniciar',
        overviewLabel: 'Visão geral — como aparecerá nos relatórios e calendários',
        distributionLabel: 'Distribuição:',
        distributionUnitSuffix: 'sem.',
        gridAriaLabelEditable:
          'Grade de semanas — navegue com as setas e pinte com Enter ou Espaço',
        gridAriaLabelReadOnly: 'Grade de semanas',
        tileAriaLabel: {
          prefix: 'Semana',
          rangeSeparator: 'a',
          colorPrefix: 'cor',
          currentSuffix: 'semana atual',
          paintHint: 'Enter ou Espaço pinta com',
        },
        colorLabels: {
          amarelo: 'Amarelo',
          azulClaro: 'Azul claro',
          azulEscuro: 'Azul escuro',
          azulMarinho: 'Azul marinho',
          branco: 'Branco',
          marrom: 'Marrom',
          palha: 'Palha',
          preto: 'Preto',
          rosa: 'Rosa',
        },
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres',
        startDateRequired: 'A data de início é obrigatória',
        endDateRequired: 'A data de fim é obrigatória',
        dateInvalid: 'Informe uma data válida',
        endDateBeforeStart: 'A data de fim deve ser posterior ou igual à de início.',
        herdControlRequired: 'Selecione o controle de rebanho',
        monthRange: 'Selecione um mês válido',
        weeksRequired: 'Gere ao menos uma semana informando um período válido',
        weekDateRange: 'A data de fim da semana deve ser posterior ou igual à de início',
        weekColorInvalid: 'Selecione uma cor válida da paleta',
      },
    },
    detail: {
      weeksReadOnlyHint: 'Código visual das semanas da safra (somente leitura).',
      subtitle: {
        herdControlPrefix: 'Rebanho',
        autoEvolutionPrefix: 'Evolução',
      },
      stats: {
        weeksLabel: 'Semanas',
        herdControlLabel: 'Controle de Rebanho',
        autoEvolutionLabel: 'Evolução Automática',
        autoEvolutionEnabled: 'Habilitada',
        autoEvolutionDisabled: 'Desabilitada',
        durationLabel: 'Duração',
        durationUnit: 'meses',
        currentWeekLabel: 'Semana Vigente',
        currentWeekEmpty: 'Sem semana vigente para hoje',
      },
      generalData: {
        title: 'Dados Gerais',
      },
      actions: {
        edit: 'Editar',
      },
      notFound: {
        title: 'Safra não encontrada',
        description: 'A safra solicitada não existe, foi removida ou pertence a outra fazenda.',
        back: 'Voltar para Safras',
      },
    },
  },
};
