// src/constants/languages/languagePtBr/languagePastures.ts
// Tradução PT-BR do módulo OPERACIONAL — Pastagem (Pasture) — domínio
// próprio, TASK-PAST-FE-00..08 (execução 041).

import { ModulePastures } from '@/@types/language/module-pastures';

export const languagePastures: ModulePastures = {
  pasture: {
    singularLabel: 'Pastagem',
    pluralLabel: 'Pastagens',
    list: {
      pageTitle: 'Pastagens',
      pageSubtitle: 'Lançamentos de custeio de pastagem por área/lote/atividade.',
      deletedToast: 'Pastagem removida com sucesso',
      statusLegend: {
        opened: 'Aberto',
        finished: 'Finalizado',
        appropriated: 'Apropriado',
      },
      table: {
        status: 'Status',
        code: 'Código',
        date: 'Dt. Pastagem',
        requester: 'Requisitante',
        warehouse: 'Armazém',
        createdAt: 'Dt. Criação',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Finalizar/Editar',
        appropriate: 'Apropriar',
        delete: 'Excluir',
        helpVideo: 'Ajuda (vídeo)',
        helpVideoComingSoon: 'Disponível em breve',
      },
      filter: {
        title: 'Filtrar pastagens',
        requester: 'Requisitante',
        requesterPlaceholder: 'Buscar requisitante',
        startDate: 'Dt. início',
        endDate: 'Dt. fim',
      },
      emptyState: {
        title: 'Nenhuma pastagem cadastrada.',
        description: 'Comece adicionando sua primeira pastagem.',
        titleFiltered: 'Nenhuma pastagem encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Adicionar Novo',
      },
    },
    form: {
      title: {
        create: 'Nova Pastagem',
        edit: 'Editar Pastagem',
      },
      subtitle: {
        create: 'Cadastre uma nova pastagem.',
        edit: 'Atualize os dados da pastagem.',
      },
      fields: {
        code: 'Código',
        date: 'Data',
        requester: 'Requisitante',
        operation: 'Operação',
        activity: 'Atividade',
        area: 'Área',
        grazing: 'Módulo de Pastejo',
        batch: 'Lote',
        animal: 'Animal',
        inputsWarehouse: 'Armazém de Insumos',
        productionsWarehouse: 'Armazém de Produção',
      },
      placeholders: {
        requester: 'Buscar requisitante',
        operation: 'Buscar operação',
        activity: 'Buscar atividade',
        area: 'Buscar área',
        grazing: 'Buscar módulo de pastejo',
        batch: 'Buscar lote',
        animal: 'Buscar animal',
        inputsWarehouse: 'Buscar armazém',
        productionsWarehouse: 'Buscar armazém',
      },
      tabs: {
        general: 'Geral',
        equipments: 'Máq/Implementos',
        services: 'MO/Serviços',
        inputs: 'Produtos/Insumos',
        occurrences: 'Ocorrências',
        productions: 'Produção',
      },
      addItem: '+ Adicionar Item',
      removeItem: 'Remover item',
      emptyRow: 'Nenhum item adicionado.',
      errors: {
        invalidFields: 'Existem campos inválidos no formulário. Revise as abas.',
        areaOrGrazingRequired: 'Informe Área ou Módulo de Pastejo (exclusivo).',
        checkDateUnavailable:
          'Validação automática de data indisponível nesta versão (GAP-PAST-FE-01).',
        occurrenceRecommendationRequired:
          'Preencha a Recomendação para salvar a ocorrência (imagem/diagnóstico não são salvos sem recomendação).',
      },
      equipments: {
        fields: {
          equipment: 'Equipamento',
          measurement: 'Un. Medida',
          startHourMeter: 'Horímetro Inicial',
          endHourMeter: 'Horímetro Final',
          note: 'Observação',
        },
        placeholders: {
          equipment: 'Buscar equipamento',
          measurement: 'Buscar unidade',
        },
        readonlyHint: 'Campo travado na edição.',
      },
      services: {
        fields: {
          funcType: 'Tipo',
          executor: 'Executor',
          measurement: 'Un. Medida',
          quantity: 'Quantidade',
          totalQuantity: 'Qtd Total',
        },
        placeholders: {
          funcType: 'Selecione o tipo',
          executor: 'Buscar executor',
          measurement: 'Buscar unidade',
        },
        funcTypeOptions: {
          employee: 'Funcionário',
          function: 'Função',
          provider: 'Prestador de Serviço',
        },
        readonlyHint: 'Campo travado na edição.',
      },
      inputs: {
        fields: {
          stock: 'Produto (Estoque)',
          measurement: 'Un. Medida',
          quantity: 'Quantidade',
          quantityUnitary: 'Qtd. Unitária',
          totalQuantity: 'Qtd Total',
        },
        placeholders: {
          stock: 'Buscar produto',
          measurement: 'Buscar unidade',
        },
        readonlyHint: 'Campo travado na edição.',
        stockWarningInsufficient: 'Estoque insuficiente para a quantidade informada.',
        stockWarningBelowMinimum: 'Estoque abaixo do mínimo recomendado.',
      },
      productions: {
        fields: {
          product: 'Produto',
          measurement: 'Un. Medida',
          stock: 'Estoque',
          quantity: 'Quantidade',
          note: 'Observação',
        },
        placeholders: {
          product: 'Buscar produto',
          measurement: 'Buscar unidade',
        },
        readonlyHint: 'Campo travado na edição.',
        newProductButton: '+ Novo Produto',
      },
      occurrences: {
        fields: {
          diagnosis: 'Diagnóstico',
          recommendation: 'Recomendações',
          priority: 'Prioridade',
        },
        placeholders: {
          diagnosis: 'Descreva o diagnóstico',
          recommendation: 'Descreva as recomendações',
        },
        priorityOptions: {
          low: 'Baixa',
          medium: 'Média',
          high: 'Alta',
        },
        images: {
          title: 'Imagens',
          addButton: 'Adicionar imagem',
          changeButton: 'Trocar',
          removeButton: 'Remover',
          maxHint: 'Até 3 imagens',
        },
      },
    },
    show: {
      title: 'Detalhe da Pastagem',
      tabs: {
        services: 'MO/Serviços',
        equipments: 'Máq/Implementos',
        inputs: 'Insumos',
        productions: 'Produção',
        occurrences: 'Ocorrências',
      },
      emptySection: 'Nenhum item lançado nesta aba.',
      backAction: 'Voltar',
      notFound: {
        title: 'Pastagem não encontrada.',
        description: 'Verifique o link acessado ou volte para a listagem.',
        back: 'Voltar para a listagem',
      },
    },
    appropriation: {
      title: 'Apropriação da Pastagem',
      subtitle: 'Defina o centro de custo e a classe de cada item lançado.',
      headerTitle: 'Dados da Pastagem',
      itemsEmptyHint: 'Sem custos lançados — a pastagem foi apropriada automaticamente.',
      fields: {
        costCenter: 'Centro de Custo',
        class: 'Classe',
        vlTime: 'Vl./Hora',
      },
      placeholders: {
        costCenter: 'Selecione o centro de custo',
      },
      classOptions: {
        custeio: 'Custeio',
        investimento: 'Investimento',
      },
      submit: 'Salvar Apropriação',
      cancel: 'Cancelar',
      back: 'Voltar',
      appropriatedToast: 'Pastagem apropriada com sucesso',
      autoAppropriatedToast: 'Pastagem apropriada automaticamente (sem custos lançados)',
    },
  },
};
