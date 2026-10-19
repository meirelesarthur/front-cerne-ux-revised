// src/constants/languages/languagePtBr/languageCteManifestacoes.ts
// Tradução PT-BR do módulo de Manifestação de CT-e (CteManifestacao —
// domínio Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13).

import { ModuleCteManifestacoes } from '@/@types/language/module-cte-manifestacoes';

export const languageCteManifestacoes: ModuleCteManifestacoes = {
  cteManifestacao: {
    singularLabel: 'Manifestação de CT-e',
    pluralLabel: 'Manifestações de CT-e',

    list: {
      pageTitle: 'Manifestação de CT-e',
      pageSubtitle: 'Consulte e manifeste desacordo sobre CT-es recebidos de terceiros.',
      helpLink: 'Ajuda',
      consultarButton: 'Consultar novos documentos',
      table: {
        nome: 'Fornecedor',
        documento: 'CPF/CNPJ',
        valor: 'Valor',
        dataEmissao: 'Data de emissão',
        tipo: 'Manifesto',
        prazo: 'Prazo manifesto',
      },
      prazo: {
        manifestado: 'Manifestado',
        diasRestantes: 'Restam {{days}} dias',
        encerrado: 'Encerrado',
      },
      actionsMenu: {
        manifestarDesacordo: 'Manifestar desacordo',
        gerarDanfe: 'Gerar DANFE',
        baixarXml: 'Baixar XML',
      },
      emptyState: {
        title: 'Nenhuma manifestação encontrada.',
        description: 'Use "Consultar novos documentos" para buscar CT-es recebidos na SEFAZ.',
      },
      error: {
        message: 'Não foi possível carregar as manifestações de CT-e.',
        retry: 'Tentar novamente',
      },
      danfeError: 'Não foi possível gerar o DANFE desta manifestação.',
      xmlError: 'Não foi possível baixar o XML desta manifestação.',
    },

    filter: {
      title: 'Filtrar manifestações',
      issuer: 'Emissor',
      issuerPlaceholder: 'Selecione o emissor',
      search: 'Buscar',
      searchPlaceholder: 'Nome do fornecedor',
      startDate: 'Emitido de',
      endDate: 'Emitido até',
      dateRangeInvalid: 'A data final é anterior à data inicial.',
      dateFilterNotSupportedNotice:
        'Filtro de data não suportado pela SEFAZ para este relatório — os campos abaixo não alteram o resultado.',
    },

    tipoOptions: {
      pendente: 'Pendente',
      desacordo: 'Manifestado (Desacordo)',
    },

    consultarDialog: {
      title: 'Consultar novos documentos',
      description:
        'Busca na SEFAZ novos CT-es recebidos para o emissor selecionado. Documentos já importados não são duplicados.',
      issuer: 'Emissor',
      issuerPlaceholder: 'Selecione o emissor',
      issuerRequired: 'Selecione um emissor para consultar.',
      submitButton: 'Consultar',
      cancelButton: 'Cancelar',
      errorMessage: 'Não foi possível consultar novos documentos.',
    },

    manifestarDialog: {
      title: 'Manifestar desacordo',
      description:
        'Registra a manifestação de "Prestação do Serviço em Desacordo" junto à SEFAZ para este CT-e.',
      justificativa: 'Justificativa',
      justificativaPlaceholder: 'Descreva o motivo do desacordo (mínimo 15 caracteres)',
      submitButton: 'Manifestar',
      cancelButton: 'Cancelar',
      successMessage: 'Desacordo manifestado com sucesso.',
      errorMessage: 'Não foi possível manifestar o desacordo.',
      validation: {
        justificativaRequired: 'Informe a justificativa.',
        justificativaMin: 'A justificativa deve ter no mínimo 15 caracteres.',
      },
    },
  },
};

export default languageCteManifestacoes;
