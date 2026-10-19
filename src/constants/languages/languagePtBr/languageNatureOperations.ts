// src/constants/languages/languagePtBr/languageNatureOperations.ts
// Tradução PT-BR do módulo de NATUREZA DE OPERAÇÃO (Cadastros Base /
// Fiscais). TASK-NO-FE-01 cobriu list + filter (listagem + exclusão
// bloqueada). TASK-NO-FE-02 adiciona a seção `form` (criação/edição —
// bloco fiscal condicional).
//
// Rótulos `cstPis`/`cstCofins` CORRIGIDOS em relação ao legado (Doc Bruta
// §11/Achado 4 da Tarefa — legado trocava os rótulos de PIS e COFINS na
// tela) — mesmos 2 textos já usados em `languageTaxRules.ts:64-65`. O
// campo/coluna real gravado no banco NÃO muda, só o texto exibido.

import { ModuleNatureOperations } from '@/@types/language/module-nature-operations';

export const languageNatureOperations: ModuleNatureOperations = {
  natureOperation: {
    pluralLabel: 'Naturezas de Operação',
    singularLabel: 'Natureza de Operação',
    list: {
      pageTitle: 'Natureza de Operação',
      pageSubtitle:
        'Administre as naturezas de operação fiscal (CFOPs padrão e classificação Entrada/Saída).',
      deletedToast: 'Natureza de Operação removida com sucesso',
      table: {
        code: 'Código',
        descricao: 'Descrição',
        tipo: 'Tipo',
        ativo: 'Status',
        active: 'Ativo',
        inactive: 'Inativo',
      },
      tipoOptions: {
        entrada: 'Entrada',
        saida: 'Saída',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhuma Natureza de Operação cadastrada.',
        descriptionEmpty: 'Cadastre a primeira natureza de operação para começar.',
        titleEmptyNoCreate: 'Nenhuma Natureza de Operação disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há naturezas de operação cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma Natureza de Operação encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Natureza de Operação',
        descriptionEmptyWithTemplates:
          'Cadastre a primeira natureza de operação ou use os modelos padrão do sistema (botão "Usar modelos").',
      },
      importDefaults: {
        button: 'Usar modelos',
        dialogTitle: 'Usar modelos padrão',
        dialogDescription:
          'Serão adicionadas a esta empresa as naturezas de operação padrão do sistema que ainda não existem. As já cadastradas não serão alteradas nem duplicadas.',
        dialogConfirm: 'Adicionar',
        toastCreated: '{count} naturezas adicionadas',
        toastAllExisting: 'Todas as naturezas padrão já estão cadastradas',
      },
    },
    filter: {
      title: 'Filtrar Naturezas de Operação',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição ou código',
      tipo: 'Tipo',
      tipoAll: 'Todos',
      tipoOptions: {
        entrada: 'Entrada',
        saida: 'Saída',
      },
      ativo: 'Status',
      ativoAll: 'Todos',
      activeOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    form: {
      title: { create: 'Nova Natureza de Operação', edit: 'Editar Natureza de Operação' },
      subtitle: {
        create: 'Cadastre uma nova natureza de operação fiscal.',
        edit: 'Atualize os dados da natureza de operação.',
      },
      sections: {
        general: 'Geral',
        fiscalClassic: 'Fiscal Clássico',
        taxReform: 'Reforma Tributária — IBS/CBS/IS',
      },
      fields: {
        code: 'Código',
        descricao: 'Descrição',
        tipo: 'Tipo',
        cfopSaidaInterno: 'CFOP Saída Interna',
        cfopSaidaExterno: 'CFOP Saída Externa/Interestadual',
        cfopSaidaExportacao: 'CFOP Saída Exportação',
        cfopEntradaInterno: 'CFOP Entrada Interna',
        cfopEntradaExterno: 'CFOP Entrada Externa/Interestadual',
        cfopEntradaExportacao: 'CFOP Entrada Exportação',
        ativo: 'Ativo',
        sobrescreveCfopProduto: 'Sobrescrever CFOP do Produto',
        overwriteProduct: 'Sobrescrever Informações do Produto',
        generateFinancial: 'Gerar Financeiro',
        automaticCalculation: 'Cálculo Automático de ICMS',
        taxRuleUuid: 'Regra Fiscal',
        additionalInfoUuid: 'Informação Complementar',
        cstCsosn: 'CST/CSOSN',
        cstPis: 'CST PIS',
        cstCofins: 'CST COFINS',
        cstIpi: 'CST IPI',
        cenqIpi: 'Enquadramento Legal IPI',
        percIcms: '% ICMS',
        percPis: '% PIS',
        percCofins: '% COFINS',
        percIpi: '% IPI',
        cest: 'CEST',
        percentReduction: '% Redução Base de Cálculo',
        motDesIcms: 'Motivo da Desoneração do ICMS',
        motDesIcmsHint:
          'Obrigatório informar ICMS desonerado (vICMSDeson > 0). Opções variam conforme o CST.',
        percDif: '% Diferimento',
        percDifHint: 'Informe 100 para diferimento total.',
        percFcp: '% FCP',
        percFcpHint: 'Opcional. Vazio ou 0 = não informado.',
        modalityBc: 'Modalidade Base de Cálculo ICMS',
        origem: 'Origem da Mercadoria',
        cstCsosnExp: 'CST/CSOSN Exportação',
        cClassTrib: 'Classificação Tributária (cClassTrib)',
        cstIbsCbs: 'CST IBS/CBS',
        percIbsUf: '% IBS Estadual (UF)',
        percIbsMun: '% IBS Municipal',
        percReducaoAliqIbsUf: '% Redução Alíquota IBS UF',
        percReducaoAliqIbsMun: '% Redução Alíquota IBS Município',
        percDifIbsUf: '% Diferimento IBS UF',
        percDifIbsMun: '% Diferimento IBS Município',
        percCbs: '% CBS',
        percReducaoAliqCbs: '% Redução Alíquota CBS',
        percDifCbs: '% Diferimento CBS',
        cstIs: 'CST Imposto Seletivo (IS)',
        percIs: '% Imposto Seletivo (IS)',
        percIsEspec: '% IS Específico',
        adRemIbs: 'Alíquota Ad Rem IBS',
        adRemCbs: 'Alíquota Ad Rem CBS',
        tpCredPresIbsZfm: 'Tipo de Crédito Presumido IBS (ZFM)',
        indDoacao: 'Indicador de Doação',
      },
      tipoOptions: {
        entrada: 'Entrada',
        saida: 'Saída',
      },
      booleanOptions: { yes: 'Sim', no: 'Não' },
      hints: { codeGenerated: 'Gerado automaticamente' },
      validation: {
        requiredField: 'Este campo é obrigatório',
        descricaoMaxLength: 'A descrição deve ter no máximo 80 caracteres',
        cfopFormat: 'Deve conter 4 dígitos numéricos',
        maxLength6: 'Deve ter no máximo 6 caracteres',
        maxLength10: 'Deve ter no máximo 10 caracteres',
        percentageRange: 'Informe um percentual entre 0 e 999,99',
        percentageRange4: 'Informe um percentual entre 0 e 999,9999',
        percentageRange100: 'Informe um percentual entre 0 e 100',
        nonNegative: 'Informe um valor maior ou igual a 0',
      },
    },
  },
};
