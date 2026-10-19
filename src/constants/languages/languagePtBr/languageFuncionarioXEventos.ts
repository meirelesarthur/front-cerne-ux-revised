// src/constants/languages/languagePtBr/languageFuncionarioXEventos.ts
// Tradução PT-BR do módulo "Funcionário X Eventos" (Administrativo / Gestão
// Pessoal). Bloco `list`/`filter`/`importModal`/`reportButton` (TASK-FE-FXE-01)
// + `matrix` (TASK-FE-FXE-02).

import { ModuleEmployeeEvents } from '@/@types/language/module-employee-events';

export const languageFuncionarioXEventos: ModuleEmployeeEvents = {
  employeeEvent: {
    singularLabel: 'Vínculo Funcionário x Evento',
    pluralLabel: 'Funcionário x Eventos',
    addLinkButton: 'Adicionar vínculo',
    addLinkModal: {
      title: 'Adicionar vínculo',
      description: 'Selecione o funcionário para gerenciar os vínculos de eventos dele.',
      employeeLabel: 'Funcionário',
      employeePlaceholder: 'Buscar por nome ou documento',
      cancelButton: 'Cancelar',
      confirmButton: 'Continuar',
    },
    list: {
      pageTitle: 'Funcionário x Eventos',
      pageSubtitle: 'Selecione um funcionário para gerenciar seus vínculos de eventos de folha.',
      table: {
        name: 'Nome',
        document: 'Documento',
        office: 'Cargo',
        actions: {
          manageLinks: 'Gerenciar vínculos',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhum funcionário cadastrado.',
        descriptionEmpty: 'Cadastre funcionários para gerenciar seus vínculos de eventos.',
        titleFiltered: 'Nenhum funcionário encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
      },
    },
    filter: {
      title: 'Filtrar funcionários',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome ou documento',
      startDate: 'Data de cadastro (de)',
      endDate: 'Data de cadastro (até)',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    importModal: {
      menuButtonLabel: 'Importar planilha',
      title: 'Importar Funcionário x Eventos',
      subtitle: 'Baixe o modelo, preencha e envie a planilha para sincronizar os vínculos.',
      downloadShortcut: 'Baixar modelo',
      instructions:
        'A planilha tem 5 colunas: Funcionário, Evento, Valor, Método e Habilitado. Todas as colunas são obrigatórias em cada linha.',
      warning: {
        title: 'Sincronização por funcionário',
        description:
          'A importação sincroniza os vínculos de cada funcionário presente na planilha — vínculos existentes não enviados para aquele funcionário são removidos, os enviados são criados ou atualizados (mesma regra da Matriz de Vínculos).',
      },
      fileUpload: {
        label: 'Planilha (.xlsx)',
        hint: 'Arquivo .xlsx de até 10MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito. Envie um arquivo .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Linhas com erro',
      },
      result: {
        employeesProcessedLabel: 'Funcionários processados',
        rowsProcessedLabel: 'Linhas processadas',
        createdLabel: 'Criados',
        updatedLabel: 'Atualizados',
        deletedLabel: 'Removidos',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
      importSuccessToast: 'Vínculos importados com sucesso',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
    },
    reportButton: {
      label: 'Relatório PDF',
      exportError: {
        title: 'Funcionário x Eventos',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
      },
    },
    matrix: {
      title: 'Vínculos de Eventos',
      createTitle: 'Novo vínculo',
      header: {
        employeeLabel: 'Funcionário',
        employeeSelectPlaceholder: 'Buscar por nome ou documento',
        nifLabel: 'CPF/CNPJ',
        functionLabel: 'Função',
      },
      backButton: 'Voltar',
      emptyState: {
        title: 'Nenhum vínculo cadastrado.',
        description: 'Adicione um evento para começar a configurar os vínculos deste funcionário.',
      },
      addEventButton: 'Adicionar novo',
      addEventPlaceholder: 'Selecione um evento',
      noEventsAvailable: 'Nenhum evento ativo cadastrado nesta fazenda.',
      removeRowButton: 'Remover',
      table: {
        event: 'Evento',
        condition: 'Condição',
        value: 'Valor',
        method: 'Método',
        enabled: 'Habilitado',
      },
      saveButton: 'Salvar',
      cancelButton: 'Cancelar',
      saveSuccessToast: 'Vínculos salvos com sucesso',
      saveError: {
        title: 'Vínculos de Eventos',
        description: 'Não foi possível salvar os vínculos. Tente novamente.',
      },
      invalidParamsToast: {
        title: 'Parâmetros inválidos',
        description: 'O identificador do funcionário é inválido para exibir a Matriz de Vínculos.',
      },
    },
  },
};
