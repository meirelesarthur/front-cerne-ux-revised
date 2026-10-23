// src/constants/languages/languagePtBr/languageMovements.ts
// Tradução PT-BR do módulo "Mov. Caixa/Bancário" (Movement — Financeiro,
// TASK-MV-FE-01). Título de tela "Mov. Caixa/Bancário" — mirror do rótulo já
// fixado em `navigationTree.ts:678`/`languageSidebar.ts` (item `fin-cai`).

import { ModuleMovements } from '@/@types/language/module-movements';

export const languageMovements: ModuleMovements = {
  movement: {
    singularLabel: 'Movimento',
    pluralLabel: 'Movimentos',
    list: {
      pageTitle: 'Mov. Caixa/Bancário',
      pageSubtitle: 'Administre os lançamentos de caixa e bancários.',
      deletedToast: 'Movimento removido com sucesso',
      table: {
        code: 'Código',
        date: 'Data',
        type: 'Tipo',
        typeCategory: 'Tp. Categoria',
        account: 'Conta',
        proprietary: 'Proprietário',
        value: 'Valor',
        totalAllocated: 'Total Rateado',
        interest: 'Juros',
      },
      actions: {
        edit: 'Editar',
        allocation: 'Editar Rateio',
        delete: 'Excluir',
        viewOpeningBalance: 'Ver em Saldo Inicial',
      },
      footer: {
        pageTotal: 'Total da página',
      },
      emptyState: {
        titleEmpty: 'Nenhum movimento cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro movimento.',
        titleFiltered: 'Nenhum movimento encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Movimento',
      },
      deleteConfirm: {
        title: 'Excluir movimento',
        description: 'Tem certeza que deseja excluir este movimento',
        cascadeTitle: 'Excluir movimento com títulos gerados',
        cascadeDescription:
          'Este movimento gerou {count} título(s) de Contas a Pagar/Receber. Ao continuar, esses títulos e as baixas deles serão apagados junto.',
        cascadeConfirm: 'Excluir mesmo assim',
      },
    },
    filter: {
      title: 'Filtrar Movimentos',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      account: 'Conta',
      accountPlaceholder: 'Buscar conta',
      proprietary: 'Proprietário',
      proprietaryPlaceholder: 'Buscar proprietário',
      type: 'Tipo',
      category: 'Categoria',
      categoryPlaceholder: 'Buscar categoria',
      harvest: 'Safra',
      harvestPlaceholder: 'Buscar safra',
      categoryType: 'Filtro Tipo Cat.',
      categoryTypePlaceholder: 'Selecione o tipo de categoria',
      categoryDisabledHint: 'Selecione o tipo de categoria primeiro',
      valueMin: 'Valor mín.',
      valueMax: 'Valor máx.',
    },
    form: {
      title: { create: 'Novo Movimento', edit: 'Editar Movimento' },
      subtitle: {
        create: 'Cadastre um novo lançamento de caixa/bancário.',
        edit: 'Altere os dados do lançamento de caixa/bancário.',
      },
      fields: {
        date: 'Dt. Movimento',
        type: 'Tipo',
        typeCategory: 'Tp. Categoria',
        account: 'Conta',
        destinationAccount: 'Conta Destino',
        originAccount: 'Conta Origem',
        farm: 'Fazenda',
        proprietary: 'Proprietário',
        client: 'Cliente',
        provider: 'Fornecedor',
        value: 'Valor R$',
        interest: 'Juros R$',
        document: 'Documento',
        note: 'Histórico',
        // TASK-MV-FE-09 (Ajuste 6) — texto EXATO do legado
        // (`agro365/resources/views/movements/_forms.blade.php:94/88`,
        // string literal, não vem de `trad.php`). Rótulos anteriores
        // ("Documento Fiscal"/"Gera Título") não batiam com o legado.
        fiscalDocument: 'Dedutível',
        generatesObligation: 'Gera Obrigação',
      },
      placeholders: {
        account: 'Buscar conta',
        destinationAccount: 'Buscar conta destino',
        originAccount: 'Buscar conta origem',
        farm: 'Buscar fazenda',
        proprietary: 'Buscar proprietário',
        client: 'Buscar cliente',
        provider: 'Buscar fornecedor',
        document: 'Número do documento',
        note: 'Observação sobre o movimento',
      },
      // TASK-MV-FE-11 — botão criar/editar Cliente ao lado do Select.
      // TASK-MV-FE-13 — botão criar/editar Fornecedor ao lado do Select.
      actions: {
        addClientAria: 'Cadastrar novo cliente',
        editClientAria: 'Editar cliente selecionado',
        addProviderAria: 'Cadastrar novo fornecedor',
        editProviderAria: 'Editar fornecedor selecionado',
      },
      // TASK-MV-FE-09 (Ajustes 4/7) — tooltips de ajuda ao lado do label,
      // mirror do mecanismo global do legado (`data-help` + `main.js`).
      hints: {
        documentTooltip:
          'Identificação do documento que está sendo cadastrado\nExemplo: Recibo, Fatura, etc...',
        fiscalDocumentTooltip:
          'Indica se este documento fiscal pode ser utilizado para dedução de tributos.',
      },
      typeOptions: {
        income: 'Entrada',
        expense: 'Saída',
      },
      typeCategoryOptions: {
        income: 'Entrada',
        expense: 'Saída',
        transfer: 'Trans. Interna',
        financing: 'Financiamento/Empréstimo',
        initialBalance: 'Saldo Inicial',
      },
      allocations: {
        sectionTitle: 'Rateio',
        sectionHint: 'Distribua o valor do movimento entre categoria e centro de custo.',
        sumLabel: 'Total rateado',
        remainingLabel: 'Faltam',
        overLabel: 'Passou',
        balancedLabel: 'Fechou',
        sumHint: 'a soma diverge do valor informado',
        emptyTitle: 'Nenhum item de rateio adicionado. Adicione ao menos um item.',
        addRowLabel: 'Adicionar Rateio',
        removeRowLabel: 'Remover rateio',
        fields: {
          category: 'Categoria',
          center: 'Centro de Custo',
          planAccount: 'Conta Contábil',
          harvest: 'Safra',
          value: 'Valor',
          percent: 'Percentual',
        },
        placeholders: {
          category: 'Buscar categoria',
          center: 'Buscar centro de custo',
          planAccount: 'Buscar conta contábil',
          harvest: 'Buscar safra',
        },
        reports: {
          categoryTooltip: 'Imprimir relatório de Categorias Financeiras',
          planAccountTooltip: 'Imprimir relatório de Plano de Contas',
          allocationTooltip: 'Imprimir rateio atual',
          allocationDocumentTitle: 'Rateio do Movimento',
          allocationColumnCategory: 'Categoria',
          allocationColumnPlanAccount: 'Conta Contábil',
          allocationColumnCenter: 'Centro de Custo',
          allocationColumnValue: 'Valor',
          allocationColumnPercent: 'Percentual',
          allocationTotalLabel: 'Total',
          allocationPlanAccountEmpty: '—',
          errorToast: 'Não foi possível gerar o relatório. Tente novamente.',
          popupBlockedToast:
            'O navegador bloqueou a janela de impressão. Libere pop-ups para este site e tente novamente.',
        },
      },
      validation: {
        dateRequired: 'Informe a data do movimento.',
        typeRequired: 'Selecione o tipo.',
        typeCategoryRequired: 'Selecione a categoria do tipo.',
        accountRequired: 'Selecione a conta.',
        destinationAccountRequired: 'Selecione a conta destino.',
        proprietaryRequired: 'Selecione o proprietário.',
        valueRequired: 'Informe o valor.',
        valueNotZero: 'O valor do movimento não pode ser 0.',
        documentMaxLength: 'Máximo de 100 caracteres.',
        noteMaxLength: 'Máximo de 600 caracteres.',
        allocationsMinLength: 'Adicione ao menos um item de rateio.',
        allocationCategoryRequired: 'Selecione a categoria.',
        allocationCenterRequired: 'Selecione o centro de custo.',
        allocationValueRequired: 'Informe o valor do item.',
        allocationValueMin: 'O valor do item deve ser maior que zero.',
        // TASK-MV-FE-08 (Ajuste 2) — texto EXATO extraído do legado
        // (`agro365/lang/pt-BR/trad.php:2125/2243`, chave 'total_rateio'),
        // mesma usada literalmente por `movements/_forms.blade.php:297` e
        // `_forms-update.blade.php:144`. Exigência explícita do task-packet
        // — não é escolha do Executor.
        allocationsSumMismatch: 'O total do rateio difere do valor total do título.',
      },
      openingBalanceNotice: 'Movimento de Saldo Inicial: edite em Cadastros Base > Saldo Inicial.',
      cascadeSave: {
        title: 'Salvar movimento com títulos gerados',
        description:
          'Este movimento gerou {count} título(s) de Contas a Pagar/Receber. Ao salvar, esses títulos e as baixas deles serão apagados e, se for o caso, um novo rascunho será gerado.',
        confirm: 'Salvar mesmo assim',
      },
      obligationDraftGenerated: {
        title: 'Título financeiro gerado',
        ofxNotice:
          'Este movimento gerou um rascunho de título financeiro. Para gerar o título em Contas a Pagar/Receber, edite o movimento em Mov. Caixa/Bancário e salve novamente.',
        navigating: 'Movimento salvo. Complete o título para vincular o financiamento.',
        noPermission:
          'Movimento salvo. Você não tem permissão para criar o título; peça a quem tem acesso a Contas a Pagar/Receber.',
      },
    },
    allocation: {
      title: 'Editar Rateio',
      subtitle: 'Ajuste a distribuição do rateio deste movimento.',
      headerValueLabel: 'Valor líquido do movimento',
      toastSuccess: 'Rateio atualizado com sucesso',
    },
  },
};
