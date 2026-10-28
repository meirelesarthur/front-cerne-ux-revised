// src/constants/languages/languagePtBr/languagePlanAccounts.ts
// Tradução PT-BR do módulo de PLANO DE CONTAS (Cadastros Base).

import { ModulePlanAccounts } from '@/@types/language/module-plan-accounts';

export const languagePlanAccounts: ModulePlanAccounts = {
  planAccount: {
    singularLabel: 'Conta Contábil',
    list: {
      pageTitle: 'Plano de Contas',
      pageSubtitle:
        'Administre a árvore de contas contábeis utilizada nos lançamentos financeiros.',
      deletedToast: 'Conta contábil removida com sucesso',
      statusUpdatedToast: 'Status atualizado com sucesso',
      table: {
        code: 'Código',
        class: 'Classe',
        condition: 'Condição',
        description: 'Descrição',
        type: 'Tipo',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        viewSubaccounts: 'Ver subcontas',
        createDescendant: 'Criar descendente',
        deactivate: 'Inativar',
        activate: 'Ativar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Sua fazenda ainda não tem um plano de contas próprio.',
        descriptionEmpty:
          'Nenhuma conta contábil foi cadastrada para este tenant ainda. Comece adicionando a primeira conta.',
        titleEmptyNoCreate: 'Nenhuma conta contábil disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há contas contábeis vinculadas à sua fazenda. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma conta encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Conta',
      },
      helpButton: 'Saiba mais',
      helpTitle: 'Plano de Contas',
      helpIntro:
        'O plano de contas organiza os lançamentos financeiros da fazenda em uma estrutura hierárquica. Conheça os conceitos principais desta tela:',
      helpItems: {
        synthetic: {
          term: 'Conta Sintética:',
          description:
            'agrupa outras contas (possui subcontas) e serve para totalizar valores — não recebe lançamentos diretamente.',
        },
        analytical: {
          term: 'Conta Analítica:',
          description:
            'é a conta final da hierarquia (sem subcontas) — é nela que os lançamentos financeiros são registrados.',
        },
        condition: {
          term: 'Condição:',
          description:
            'define a natureza contábil da conta — Devedora, Credora ou Ambos, usada nos relatórios financeiros.',
        },
        deactivate: {
          term: 'Inativar:',
          description:
            'oculta a conta de novos lançamentos sem excluí-la — o histórico já registrado permanece intacto e a conta pode ser reativada a qualquer momento.',
        },
      },
      helpUnderstood: 'Entendido',
    },
    filter: {
      title: 'Filtrar plano de contas',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por código ou descrição',
      condition: 'Condição',
      conditionAll: 'Todas',
      conditionOptions: {
        debtor: 'Devedor',
        creditor: 'Credor',
        both: 'Ambos',
      },
      class: 'Classe',
      classAll: 'Todas',
      classOptions: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      type: 'Tipo',
      typeAll: 'Todos',
      typeOptions: {
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      parentUuid: 'Conta-pai',
      parentUuidPlaceholder: 'Buscar por código ou descrição',
    },
    form: {
      title: {
        create: 'Nova Conta Contábil',
        edit: 'Editar Conta Contábil',
        createDescendant: 'Nova Subconta',
      },
      subtitle: {
        create: 'Cadastre uma nova conta no plano de contas.',
        edit: 'Atualize os dados da conta contábil.',
        createDescendant: 'A nova conta será vinculada como subconta da conta selecionada.',
      },
      sectionAccount: 'Dados da conta',
      fields: {
        description: 'Descrição',
        condition: 'Condição',
        isEnabled: 'Ativo',
        type: 'Tipo',
        parentUuid: 'Conta-pai',
        code: 'Código',
        class: 'Classe',
        categories: 'Categorias Financeiras',
      },
      placeholders: {
        description: 'Digite a descrição da conta',
        parentUuid: 'Buscar por código ou descrição',
        categoriesSearch: 'Buscar categoria financeira por código ou descrição',
      },
      hints: {
        parentUuidImmutable: 'A conta-pai não pode ser alterada após a criação.',
        parentUuidCreate:
          'Esta conta será criada como raiz. Para criar subcontas, use "Criar descendente" na listagem.',
        parentUuidFixedDescendant: 'Conta-pai fixada — esta conta será criada como subconta dela.',
        codeGenerated: 'Gerado automaticamente',
        classPreviewBadge: 'prévia',
      },
      classLabels: {
        synthetic: 'Sintético',
        analytical: 'Analítico',
      },
      categories: {
        empty: 'Nenhuma categoria financeira vinculada.',
        removeLabel: 'Remover categoria',
      },
      categoriesTree: {
        expandAll: 'Expandir Tudo',
        collapseAll: 'Recolher Tudo',
        selectAll: 'Marcar Todos',
        deselectAll: 'Desmarcar Todos',
        emptyGroup: 'Nenhuma categoria neste grupo',
        noCategories: 'Nenhuma categoria financeira disponível.',
      },
      parentPreview: {
        loading: 'Carregando conta-pai...',
        errorTitle: 'Não foi possível carregar a conta-pai.',
        errorDescription: 'Verifique se o registro ainda existe e tente novamente.',
      },
      validation: {
        descriptionRequired: 'A descrição é obrigatória.',
        descriptionMaxLength: 'A descrição deve ter no máximo 150 caracteres.',
        conditionRequired: 'A condição é obrigatória.',
      },
    },
    excel: {
      downloadTemplate: 'Baixar modelo',
      export: 'Exportar',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
      exportError: 'Não foi possível exportar os dados. Tente novamente.',
      import: {
        menuLabel: 'Importar',
        title: 'Importar Plano de Contas',
        subtitle: 'Baixe o modelo, preencha e envie a planilha para sincronizar o plano de contas.',
        instructions:
          'As colunas Código, Descrição, Condição e Classe são obrigatórias em cada linha. A hierarquia é definida pelos segmentos do próprio Código (ex.: 1.1 é subconta de 1) — a conta-pai precisa já existir ou estar em uma linha anterior da mesma planilha.',
        warning: {
          title: 'Exclusão segura das contas ausentes',
          description:
            'Contas ausentes desta planilha serão excluídas — exceto as que já têm lançamentos, categorias ou subcontas vinculadas, que serão preservadas e listadas ao final da importação.',
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
        importSuccessToast: 'Importação do plano de contas concluída com sucesso.',
        result: {
          created: 'Criadas',
          updated: 'Atualizadas',
          deleted: 'Excluídas',
          preservedTitle: '{count} conta(s) preservada(s) — já estão em uso',
        },
        rowErrors: {
          title: 'Não foi possível importar — corrija as linhas abaixo e envie novamente',
        },
        closeButton: 'Fechar',
      },
    },
    report: {
      tooltip: 'Imprimir relatório',
      documentTitle: 'Plano de Contas',
      metaCountSingular: 'conta contábil',
      metaCountPlural: 'contas contábeis',
      errorToast: 'Não foi possível gerar o relatório. Tente novamente.',
      popupBlockedToast:
        'O navegador bloqueou a janela de impressão. Libere pop-ups para este site e tente novamente.',
    },
  },
};
