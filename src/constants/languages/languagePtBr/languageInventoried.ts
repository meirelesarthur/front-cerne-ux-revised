// src/constants/languages/languagePtBr/languageInventoried.ts
// Tradução PT-BR do módulo INVENTARIADO (Operacional → Pecuária →
// Inventariado, F-041, execução CORE_WORKSPACE/97-Esteiras/060).
//
// Rótulos de coluna/campo FIÉIS ao legado (`index.blade.php`/`show.blade.php`
// — COL-IDX-01..06, FLD-SHOW-01..05): "Data", "Quantidade de Animais", "Em
// Lote", "Fora do Lote", "Faltantes na Planilha", "Responsável", "Lote",
// "Animal", "Status". Título/subtítulo/textos do modal de import são NOVOS,
// redigidos do zero para esta feature ([PARA ANÁLISE] §7.4 do contrato de
// tela) — sem UX desenhado, feature sem create/edit (só listagem + import +
// detalhe read-only).

import { ModuleInventoried } from '@/@types/language/module-inventoried';

export const languageInventoried: ModuleInventoried = {
  inventoried: {
    singularLabel: 'Inventariado',
    pluralLabel: 'Inventariados',
    list: {
      pageTitle: 'Inventariado',
      pageSubtitle: 'Consulte os inventários de animais importados por planilha.',
      table: {
        date: 'Data',
        animalsCount: 'Quantidade de Animais',
        inBatch: 'Em Lote',
        outOfBatch: 'Fora do Lote',
        missing: 'Faltantes na Planilha',
        actions: 'Ação',
      },
      actions: {
        view: 'Visualizar',
        report: 'Relatório',
        delete: 'Excluir',
      },
      emptyState: {
        title: 'Nenhum inventário encontrado.',
        description: 'Ainda não há inventários importados para a fazenda ativa.',
      },
      deletedToast: 'Inventário excluído com sucesso',
      deleteDialog: {
        description: 'Tem certeza que deseja excluir o inventário',
        warning:
          'Esta exclusão remove o inventário e todos os animais vinculados a ele. É uma operação sem volta.',
      },
      importButtonLabel: 'Importar/Exportar',
    },
    importModal: {
      title: 'Importar Inventariado',
      subtitle: 'Baixe o modelo, preencha e envie a planilha para lançar um novo inventário.',
      downloadShortcut: 'Fazer download',
      instructions:
        'A planilha tem 2 colunas: Lote e Animal. Cada linha informa um animal e o lote em que ele foi encontrado na contagem. O import cria 1 novo inventário — não substitui nem exclui nenhum inventário já existente.',
      fileUpload: {
        label: 'Planilha (.xls ou .xlsx)',
        hint: 'Arquivo .xls ou .xlsx de até 10MB.',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDraggingTitle: 'Solte o arquivo aqui',
        changeLabel: 'Trocar arquivo',
        removeLabel: 'Remover arquivo',
        errorTypeMessage: 'Tipo de arquivo não aceito. Envie um arquivo .xls ou .xlsx.',
        errorSizeMessage: 'O arquivo excede o tamanho máximo permitido (10MB).',
      },
      rowErrors: {
        title: 'Linhas com erro',
      },
      result: {
        title: 'Inventário criado com sucesso',
        animalsCountLabel: 'Quantidade de Animais',
        inBatchLabel: 'Em Lote',
        outOfBatchLabel: 'Fora do Lote',
        missingLabel: 'Faltantes na Planilha',
      },
      cancelButton: 'Cancelar',
      submitButton: 'Importar',
      closeButton: 'Fechar',
      successToast: 'Inventário importado com sucesso',
      downloadTemplateError: 'Não foi possível baixar o modelo. Tente novamente.',
    },
    detail: {
      pageTitle: 'Inventariado',
      back: 'Voltar',
      header: {
        date: 'Data',
        responsible: 'Responsável',
      },
      animals: {
        title: 'Animais',
        batch: 'Lote',
        animal: 'Animal',
        status: 'Status',
        noBatch: 'Não Possui',
      },
      statusLabels: {
        inBatch: 'Em Lote',
        outOfBatch: 'Fora do Lote',
        missing: 'Faltantes na Planilha',
      },
      notFound: {
        title: 'Inventário não encontrado.',
        description: 'Não há inventário para o identificador informado.',
      },
      noData: '—',
    },
    report: {
      popupBlocked:
        'Não foi possível abrir o relatório. Verifique o bloqueador de pop-ups do navegador.',
      error: 'Não foi possível gerar o relatório. Tente novamente.',
    },
  },
};
