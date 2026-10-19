// src/constants/languages/languagePtBr/languagePlannings.ts
// Tradução PT-BR do módulo OPERACIONAL/Agricultura — Planejamentos (Planning)
// — domínio próprio, TASK-FE-PLAN-01 (execução `97-Esteiras/007`, fatia
// LISTAGEM).

import { ModulePlannings } from '@/@types/language/module-plannings';

export const languagePlannings: ModulePlannings = {
  planning: {
    singularLabel: 'Planejamento',
    pluralLabel: 'Planejamentos',
    list: {
      pageTitle: 'Planejamentos',
      pageSubtitle: 'Planejamento de Cultura/Variedade por safra.',
      deletedToast: 'Planejamento removido com sucesso',
      duplicatedToast: 'Planejamento duplicado com sucesso',
      reportErrorToast: 'Não foi possível gerar o relatório do planejamento.',
      statusLabels: {
        pending: 'Pendente',
        released: 'Liberado',
        closed: 'Encerrado',
      },
      table: {
        status: 'Status',
        code: 'Código',
        harvest: 'Safra',
        responsible: 'Responsável',
        planningTotal: 'Vl. Planejado',
        planningArea: 'Vl./área',
      },
      actions: {
        edit: 'Editar',
        duplicate: 'Duplicar',
        print: 'Imprimir',
        delete: 'Excluir',
      },
      deleteConfirm: {
        header: 'Excluir Planejamento',
        body: 'Tem certeza que deseja excluir este planejamento? Esta ação não pode ser desfeita.',
      },
      emptyState: {
        title: 'Nenhum planejamento cadastrado.',
        description: 'Comece criando seu primeiro planejamento.',
        cta: 'Novo Planejamento',
      },
    },
    form: {
      title: {
        create: 'Novo Planejamento',
        edit: 'Editar Planejamento',
      },
      subtitle: {
        create: 'Planejamento de Cultura/Variedade por safra.',
        edit: 'Planejamento de Cultura/Variedade por safra.',
      },
      fields: {
        code: 'Código',
        codeGeneratedPlaceholder: 'Gerado automaticamente ao salvar',
        responsible: 'Responsável',
        harvest: 'Safra',
        createdAt: 'Data de cadastro',
        area: 'Área',
        areaTotal: 'Área Total (ha)',
        plantedArea: 'Área Plantada (ha)',
        availableArea: 'Área Disponível (ha)',
        status: 'Status',
        commercialDollar: 'Cotação Dólar (US$)',
        realSc: 'R$/sc',
        planningTotal: 'Vl. Planejado',
        planningArea: 'Vl./área',
      },
      placeholders: {
        harvest: 'Selecione a safra',
        area: 'Selecione a área',
        status: 'Selecione o status',
      },
      errors: {
        required: 'Campo obrigatório',
      },
      unsavedChangesDialog: {
        title: 'Sair sem salvar?',
        description: 'Existem alterações não salvas neste formulário que serão perdidas',
        confirmButton: 'Sair sem salvar',
      },
    },
    tree: {
      title: 'Cultura/Variedade',
      empty: {
        title: 'Nenhum cultivo cadastrado ainda.',
        description:
          'Adicione uma Cultura/Variedade para começar a montar a árvore do planejamento.',
      },
      error: {
        title: 'Não foi possível carregar a árvore.',
        description: 'Ocorreu um erro ao buscar os cultivos deste planejamento.',
      },
      cultivation: {
        singularLabel: 'Cultura/Variedade',
        actions: {
          new: 'Nova Cultura/Variedade',
          edit: 'Editar',
          delete: 'Excluir',
        },
        deletedToast: 'Cultura/variedade removida com sucesso',
        deleteConfirm: {
          header: 'Excluir Cultura/Variedade',
          body: 'Tem certeza que deseja excluir esta cultura/variedade? As operações já vinculadas também serão removidas.',
        },
        dialog: {
          title: {
            create: 'Nova Cultura/Variedade',
            edit: 'Editar Cultura/Variedade',
          },
          fields: {
            cultivation: 'Cultura',
            variety: 'Variedade',
            // GAP-PLAN-FE-03 (item 5) — rótulos alinhados à forma abreviada
            // do legado real (`agro365/resources/js/components/
            // ModalCultivation/index.js:171,182,193`: "Dt. Início"/"Dt.
            // Fim"/"Dt. Início Plantio"), mesma convenção já majoritária nas
            // telas-irmãs (`languageMovements.ts`, `languageCarregamentos.ts`,
            // `languageWeaning.ts`). Mapeamento campo→rótulo já estava
            // semanticamente correto — só a nomenclatura mudou. NÃO tocar em
            // `tree.operation.dialog.fields` (mesmas chaves, diálogo
            // "Definir Período", fora do escopo deste achado).
            startDate: 'Dt. Início',
            endDate: 'Dt. Fim',
            startPlantingDate: 'Dt. Início Plantio',
            cycle: 'Ciclo (dias)',
            forecast: 'Previsão de colheita',
          },
          placeholders: {
            cultivation: 'Selecione a cultura',
            variety: 'Selecione a variedade',
            varietyNoCultivation: 'Selecione a cultura primeiro',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          createdToast: 'Cultura/variedade criada com sucesso',
          updatedToast: 'Cultura/variedade atualizada com sucesso',
        },
      },
      operation: {
        singularLabel: 'Operação',
        actions: {
          new: 'Criar Operação',
          definePeriod: 'Definir Período',
          delete: 'Excluir',
        },
        deletedToast: 'Operação removida com sucesso',
        empty: {
          title: 'Nenhuma operação cadastrada ainda.',
          description: 'Crie uma operação manualmente para começar.',
        },
        deleteConfirm: {
          header: 'Excluir Operação',
          body: 'Tem certeza que deseja excluir esta operação? Esta ação não pode ser desfeita.',
        },
        dialog: {
          title: {
            create: 'Criar Operação',
            definePeriod: 'Definir Período',
          },
          fields: {
            operation: 'Operação',
            startDate: 'Data de início',
            endDate: 'Data de fim',
          },
          placeholders: {
            operation: 'Selecione a operação',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          actions: {
            definePeriodSubmit: 'Salvar período',
          },
          createdToast: 'Operação criada com sucesso',
          updatedToast: 'Período da operação atualizado com sucesso',
        },
      },
      production: {
        singularLabel: 'Produção',
        rowLabel: '1. Produção',
        actions: {
          edit: 'Definir Produção',
        },
        dialog: {
          title: 'Definir Produção',
          fields: {
            cultivation: 'Cultura/Variedade',
            productionQuantity: 'Quantidade de produção (por ha)',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          updatedToast: 'Produção atualizada com sucesso',
        },
      },
      activity: {
        singularLabel: 'Atividade',
        actions: {
          new: 'Nova Atividade',
          edit: 'Editar',
          delete: 'Excluir',
        },
        deletedToast: 'Atividade removida com sucesso',
        empty: {
          title: 'Nenhuma atividade cadastrada ainda.',
          description: 'Adicione uma atividade para começar.',
        },
        deleteConfirm: {
          header: 'Excluir Atividade',
          body: 'Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.',
        },
        dialog: {
          title: {
            create: 'Nova Atividade',
            edit: 'Editar Atividade',
          },
          fields: {
            activity: 'Atividade',
            startDate: 'Data de início',
            endDate: 'Data de fim',
          },
          placeholders: {
            activity: 'Selecione a atividade',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          createdToast: 'Atividade criada com sucesso',
          updatedToast: 'Atividade atualizada com sucesso',
        },
      },
      otherActivity: {
        singularLabel: 'Outra Atividade',
        actions: {
          new: 'Adicionar Atividade',
          delete: 'Excluir',
        },
        deletedToast: 'Atividade removida com sucesso',
        empty: {
          title: 'Nenhuma outra atividade cadastrada ainda.',
          description: 'Adicione uma atividade ao grupo "Outros" deste cultivo.',
        },
        deleteConfirm: {
          header: 'Excluir Atividade',
          body: 'Tem certeza que deseja excluir esta atividade do grupo "Outros"? Esta ação não pode ser desfeita.',
        },
        dialog: {
          title: 'Adicionar Atividade',
          fields: {
            activity: 'Atividade',
            quantity: 'Qtd./ha',
            amount: 'Vl. Unitário (R$)',
            total: 'Vl. Total (R$)',
          },
          placeholders: {
            activity: 'Selecione a atividade',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          totalHelperText:
            'Calculado automaticamente (Qtd./ha × Vl. Unitário × Área Plantada). O servidor sempre recalcula o valor final.',
          createdToast: 'Atividade adicionada com sucesso',
        },
      },
      product: {
        singularLabel: 'Insumo',
        actions: {
          new: 'Novo Insumo',
          edit: 'Editar',
          delete: 'Excluir',
        },
        deletedToast: 'Insumo removido com sucesso',
        empty: {
          title: 'Nenhum insumo cadastrado ainda.',
          description: 'Adicione um insumo para começar.',
        },
        deleteConfirm: {
          header: 'Excluir Insumo',
          body: 'Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita.',
        },
        dialog: {
          title: {
            create: 'Novo Insumo',
            edit: 'Editar Insumo',
          },
          fields: {
            warehouse: 'Armazém',
            product: 'Produto',
            measurement: 'Unidade',
            stock: 'Estoque',
            quantity: 'Qtd./ha',
            amount: 'Vl. Unitário (R$)',
            total: 'Vl. Total (R$)',
          },
          placeholders: {
            warehouse: 'Selecione o armazém',
            product: 'Selecione o produto',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          stockHelperText: 'Saldo disponível no armazém selecionado — apenas informativo.',
          totalHelperText:
            'Calculado automaticamente (Qtd./ha × Vl. Unitário × Área Plantada). O servidor sempre recalcula o valor final.',
          createdToast: 'Insumo adicionado com sucesso',
          updatedToast: 'Insumo atualizado com sucesso',
        },
      },
      equipment: {
        singularLabel: 'Equipamento',
        actions: {
          new: 'Novo Equipamento',
          edit: 'Editar',
          delete: 'Excluir',
        },
        deletedToast: 'Equipamento removido com sucesso',
        empty: {
          title: 'Nenhum equipamento cadastrado ainda.',
          description: 'Adicione um equipamento para começar.',
        },
        deleteConfirm: {
          header: 'Excluir Equipamento',
          body: 'Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.',
        },
        dialog: {
          title: {
            create: 'Novo Equipamento',
            edit: 'Editar Equipamento',
          },
          fields: {
            equipment: 'Equipamento',
            measurement: 'Unidade',
            quantity: 'Qtd./ha',
            amount: 'Vl. Unitário (R$)',
            total: 'Vl. Total (R$)',
          },
          placeholders: {
            equipment: 'Selecione o equipamento',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          totalHelperText:
            'Calculado automaticamente (Qtd./ha × Vl. Unitário × Área Plantada). O servidor sempre recalcula o valor final.',
          createdToast: 'Equipamento adicionado com sucesso',
          updatedToast: 'Equipamento atualizado com sucesso',
        },
      },
      function: {
        singularLabel: 'MO/Serviço',
        actions: {
          new: 'Novo Serviço',
          edit: 'Editar',
          delete: 'Excluir',
        },
        deletedToast: 'Serviço removido com sucesso',
        empty: {
          title: 'Nenhum serviço cadastrado ainda.',
          description: 'Adicione um serviço para começar.',
        },
        deleteConfirm: {
          header: 'Excluir Serviço',
          body: 'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
        },
        employeeAssignedBadge: 'funcionário vinculado',
        dialog: {
          title: {
            create: 'Novo Serviço',
            edit: 'Editar Serviço',
          },
          fields: {
            executor: 'Função/Executor',
            employee: 'Funcionário',
            measurement: 'Unidade',
            quantity: 'Qtd./ha',
            amount: 'Vl. Unitário (R$)',
            total: 'Vl. Total (R$)',
          },
          placeholders: {
            executor: 'Selecione a função',
            employee: 'Selecione o funcionário',
          },
          errors: {
            required: 'Campo obrigatório',
          },
          totalHelperText:
            'Calculado automaticamente (Qtd./ha × Vl. Unitário × Área Plantada). O servidor sempre recalcula o valor final.',
          employeeUnresolvedLabel: 'Funcionário selecionado',
          createdToast: 'Serviço adicionado com sucesso',
          updatedToast: 'Serviço atualizado com sucesso',
        },
      },
    },
  },
};
