// src/constants/languages/languagePtBr/languageSystemLogs.ts
// Tradução pt-BR do Visualizador de Logs (execução 079). Ver
// `@/@types/language/module-system-logs` para o contrato completo.

import { ModuleSystemLogs } from '@/@types/language/module-system-logs';

export const languageSystemLogs: ModuleSystemLogs = {
  systemLog: {
    singularLabel: 'Log do Sistema',
    pluralLabel: 'Logs do Sistema',
    titleModule: 'Logs do Sistema',

    explorer: {
      pageTitle: 'Logs do Sistema',
      pageSubtitle:
        'Navegue pelos arquivos de log da plataforma, abra para ler as últimas linhas ou baixe o arquivo completo.',
      breadcrumbAriaLabel: 'Caminho da pasta',
      breadcrumbRoot: 'logs',
      table: {
        name: 'Nome',
        size: 'Tamanho',
        modifiedAt: 'Modificado em',
        actions: 'Ações',
        folder: 'Pasta',
        file: 'Arquivo',
        sortBy: 'Ordenar por',
      },
      actions: {
        open: 'Abrir',
        download: 'Baixar',
        refresh: 'Atualizar',
      },
      filter: {
        placeholder: 'Filtrar por nome',
        ariaLabel: 'Filtrar arquivos e pastas por nome',
        clear: 'Limpar filtro',
      },
      truncatedNotice:
        'A listagem foi cortada no limite da API. Use o filtro por nome para localizar o arquivo desejado.',
      emptyState: {
        title: 'Esta pasta está vazia',
        description: 'Não há arquivos nem pastas de log neste local.',
      },
      noResultsState: {
        title: 'Nenhum item encontrado',
        description: 'Nenhum arquivo ou pasta corresponde ao filtro informado.',
        clear: 'Limpar filtro',
      },
      notFoundState: {
        title: 'Pasta não encontrada',
        description: 'A pasta informada não existe ou foi removida.',
        back: 'Voltar para logs',
      },
      error: {
        message: 'Não foi possível carregar a listagem de logs.',
        retry: 'Tentar novamente',
      },
    },

    viewer: {
      pageTitle: 'Arquivo de log',
      pageSubtitle:
        'Exibindo as últimas linhas. Carregue trechos mais antigos conforme a necessidade.',
      fields: { size: 'Tamanho', modifiedAt: 'Modificado em' },
      actions: {
        refresh: 'Atualizar',
        download: 'Baixar',
        backToFolder: 'Voltar à pasta',
        loadOlder: 'Carregar mais antigos',
        wrapLines: 'Quebrar linhas',
        backToEnd: 'Voltar ao fim do arquivo',
        retry: 'Tentar novamente',
      },
      contentAriaLabel: 'Conteúdo do arquivo de log',
      emptyFile: 'Arquivo vazio',
      startOfFile: 'Início do arquivo',
      loadedSummary: 'Carregado: {lines} linhas · {size}',
      limitReached: 'Limite de visualização atingido — baixe o arquivo para ver o restante.',
      lineTruncated: '…(linha truncada na visualização)',
      partialLine:
        'Há uma linha maior que o bloco de leitura, exibida parcialmente. Baixe o arquivo para ver a linha inteira.',
      sizeChangedWarning:
        'O arquivo diminuiu de tamanho (rotação ou truncamento). O conteúdo foi recarregado desde o fim.',
      contextNotice: 'Exibindo o contexto de uma ocorrência da busca.',
      loadMoreError:
        'Não foi possível carregar mais linhas. O conteúdo já carregado foi preservado.',
      error: { message: 'Não foi possível carregar o conteúdo do arquivo.' },
      notFoundState: {
        title: 'Arquivo não encontrado ou removido (rotação)',
        description:
          'O arquivo pode ter sido rotacionado ou apagado. Volte à pasta e abra outro arquivo.',
        back: 'Voltar à pasta',
      },
      binaryState: {
        title: 'Arquivo binário',
        description: 'Este arquivo não pode ser exibido como texto. Use o download.',
      },
      invalidCursorState: {
        title: 'O arquivo mudou desde a última leitura',
        description:
          'O ponto de leitura ficou além do tamanho atual do arquivo. Recarregue para ver o fim.',
        action: 'Recarregar do fim',
      },
      missingPathState: {
        title: 'Arquivo não informado',
        description: 'Abra um arquivo a partir da listagem de logs.',
        back: 'Voltar para logs',
      },
    },

    search: {
      placeholder: 'Buscar no arquivo inteiro',
      ariaLabel: 'Buscar texto no arquivo inteiro',
      submit: 'Buscar',
      clear: 'Limpar busca',
      scopeNote:
        'A busca percorre o arquivo inteiro, das linhas mais recentes para as mais antigas. Pressione Enter para buscar.',
      minChars: 'Digite ao menos {min} caracteres.',
      resultsTitle: 'Resultados da busca',
      resultCount: '{count} ocorrência(s) carregada(s)',
      noResults: 'Nenhuma ocorrência encontrada no trecho pesquisado.',
      loadMore: 'Continuar buscando em trechos mais antigos',
      moreAvailable: 'Há trechos mais antigos do arquivo ainda não pesquisados.',
      openContext: 'Abrir contexto',
      lineTruncated: '(linha truncada)',
      error: 'Não foi possível buscar no arquivo.',
    },

    download: {
      success: 'Download concluído.',
      error: 'Não foi possível baixar o arquivo.',
      progress: 'Baixando… {percent}%',
      inProgress: 'Baixando…',
      ariaLabel: 'Baixar {name}',
    },
  },
};
