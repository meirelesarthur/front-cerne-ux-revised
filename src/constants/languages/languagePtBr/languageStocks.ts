// src/constants/languages/languagePtBr/languageStocks.ts
// Tradução PT-BR do módulo de SALDO DE ESTOQUE (Administrativo — Estoque).

import { ModuleStocks } from '@/@types/language/module-stocks';

export const languageStocks: ModuleStocks = {
  stock: {
    singularLabel: 'Saldo de Estoque',
    pluralLabel: 'Saldos de Estoque',
    list: {
      pageTitle: 'Saldo de Estoque',
      pageSubtitle: 'Consulte o saldo atual de estoque por produto e armazém.',
      report: 'Relatório',
      table: {
        product: 'Produto',
        warehouse: 'Armazém',
        quantity: 'Quantidade',
        lot: 'Lote',
        expirationDate: 'Validade',
        averageCost: 'Custo Médio',
        total: 'Total',
        info: 'Info',
        actions: {
          viewDetail: 'Ver Detalhe',
        },
      },
      emptyState: {
        titleEmpty: 'Nenhum saldo de estoque encontrado.',
        descriptionEmpty: 'Ainda não há estoque registrado para a fazenda ativa.',
        titleFiltered: 'Nenhum saldo de estoque encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
      },
    },
    filter: {
      title: 'Filtrar saldo de estoque',
      search: 'Pesquisar',
      searchPlaceholder: 'Pesquisar por produto ou lote',
      product: 'Produto',
      productPlaceholder: 'Selecione um produto',
      warehouse: 'Armazém',
      warehousePlaceholder: 'Selecione um armazém',
    },
    detail: {
      sections: {
        identification: 'Identificação',
        balance: 'Saldo Consolidado',
        lots: 'Lotes',
        addressing: 'Endereçamento',
      },
      fields: {
        product: 'Produto',
        warehouse: 'Armazém',
        quantity: 'Quantidade',
        total: 'Total',
        addressingType: 'Tipo',
      },
      table: {
        lot: 'Lote',
        providerLot: 'Lote do Fornecedor',
        expirationDate: 'Validade',
        quantity: 'Quantidade',
        averageCost: 'Custo Médio',
        total: 'Total',
      },
      lotsEmpty: {
        title: 'Nenhum lote encontrado.',
        description: 'Este saldo não possui lotes individuais registrados.',
      },
      notFound: {
        title: 'Saldo não encontrado.',
        description: 'Não há saldo de estoque para o produto e armazém informados.',
        back: 'Voltar à listagem',
      },
      invalidParamsToast: {
        title: 'Parâmetros inválidos',
        description: 'Produto e armazém são obrigatórios para exibir o detalhe do saldo.',
      },
      noData: 'Não Possui',
    },
    report: {
      title: 'Relatório de Saldo de Estoque',
      subtitle:
        'Gere um PDF ou exporte um XLSX com os filtros atuais — sem filtro, exporta todos os saldos da fazenda.',
      exportPdf: 'Gerar PDF',
      exportXlsx: 'Exportar XLSX',
      exportPdfError: {
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório em PDF. Tente novamente.',
      },
      exportXlsxError: {
        title: 'Erro ao exportar XLSX',
        description: 'Não foi possível exportar a planilha. Tente novamente.',
      },
    },
    consolidation: {
      groupButton: 'Agrupar',
      alertTitle: 'Agrupar Estoque',
      selectAtLeastTwoAlert: 'Selecione ao menos dois itens.',
      differentUnitAlert: 'Os itens devem ter a mesma unidade de medida.',
      modalTitle: 'Agrupar Estoque',
      modalPrimaryLabel: 'Selecione o produto que irá ser o principal.',
      confirmButton: 'Agrupar',
      cancelButton: 'Cancelar',
      successToast: 'Estoques agrupados com sucesso.',
      previewErrorTitle: 'Não foi possível agrupar',
      previewErrorToast: 'Não foi possível carregar a prévia do agrupamento. Tente novamente.',
      columns: {
        product: 'Produto',
        warehouse: 'Armazém',
        quantity: 'Quantidade',
        lot: 'Lote',
        expirationDate: 'Validade',
      },
    },
  },
};
