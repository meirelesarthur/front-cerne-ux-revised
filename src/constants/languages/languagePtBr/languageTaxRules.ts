// src/constants/languages/languagePtBr/languageTaxRules.ts
// Tradução PT-BR do módulo de REGRAS FISCAIS (Cadastros Base / Fiscal).
//
// Rótulos `cstPis`/`cstCofins` CORRIGIDOS em relação ao legado (Doc Bruta
// §11 — legado trocava os rótulos de PIS e COFINS na tela) — o campo/dado
// gravado não muda, só o texto exibido.

import { ModuleTaxRules } from '@/@types/language/module-tax-rules';

export const languageTaxRules: ModuleTaxRules = {
  taxRule: {
    pluralLabel: 'Regras Fiscais',
    singularLabel: 'Regra Fiscal',
    list: {
      pageTitle: 'Regras Fiscais',
      pageSubtitle: 'Administre as regras de tributação aplicadas aos produtos.',
      columns: { name: 'Nome', status: 'Status', actions: 'Ações' },
      statusActive: 'Ativo',
      statusInactive: 'Inativo',
      actions: { edit: 'Editar', delete: 'Excluir' },
      emptyState: {
        titleEmpty: 'Nenhuma Regra Fiscal cadastrada.',
        descriptionEmpty: 'Cadastre a primeira regra fiscal para começar.',
        titleEmptyNoCreate: 'Nenhuma Regra Fiscal disponível.',
        descriptionEmptyNoCreate:
          'Ainda não há regras fiscais cadastradas. Entre em contato com o administrador da plataforma.',
        titleFiltered: 'Nenhuma Regra Fiscal encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Nova Regra Fiscal',
      },
      deleteConfirm: {
        title: 'Excluir Regra Fiscal',
        description: 'Tem certeza que deseja excluir a regra fiscal',
        warning:
          'Esta exclusão é definitiva e não pode ser desfeita — a regra fiscal não utiliza exclusão reversível (sem lixeira).',
      },
    },
    filter: {
      title: 'Filtrar Regras Fiscais',
      search: 'Nome',
      searchPlaceholder: 'Buscar por nome',
      apply: 'Aplicar filtros',
      clear: 'Limpar filtros',
    },
    form: {
      title: { create: 'Nova Regra Fiscal', edit: 'Editar Regra Fiscal' },
      subtitle: {
        create: 'Cadastre uma nova regra de tributação.',
        edit: 'Atualize os dados da regra fiscal.',
      },
      sections: {
        identification: 'Identificação',
        fiscalClassic: 'Fiscal Clássico',
        taxReform: 'Reforma Tributária — IBS/CBS/IS',
        zfmDonation: 'Zona Franca de Manaus / Doação',
      },
      fields: {
        name: 'Nome',
        isEnabled: 'Status',
        cfopSaidaInterno: 'CFOP Saída Interna',
        cfopSaidaExterno: 'CFOP Saída Externa/Interestadual',
        cstCsosn: 'CST/CSOSN',
        cstCsosnExp: 'CST/CSOSN Exportação',
        cstPis: 'CST PIS',
        cstCofins: 'CST COFINS',
        cstIpi: 'CST IPI',
        percIcms: '% ICMS',
        percPis: '% PIS',
        percCofins: '% COFINS',
        percIpi: '% IPI',
        origem: 'Origem da Mercadoria',
        cest: 'CEST',
        modalityBc: 'Modalidade Base de Cálculo ICMS',
        percentReduction: '% Redução Base de Cálculo',
        motDesIcms: 'Motivo da Desoneração do ICMS',
        motDesIcmsHint:
          'Obrigatório informar ICMS desonerado (vICMSDeson > 0). Opções variam conforme o CST.',
        percDif: '% Diferimento',
        percDifHint: 'Informe 100 para diferimento total.',
        percFcp: '% FCP',
        percFcpHint: 'Opcional. Vazio ou 0 = não informado.',
        cenqIpi: 'Enquadramento Legal IPI',
        cbenef: 'Código de Benefício Fiscal (cBenef)',
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
      isEnabledOptions: { active: 'Ativo', inactive: 'Inativo' },
      booleanOptions: { yes: 'Sim', no: 'Não' },
      validation: {
        nameRequired: 'O nome é obrigatório',
        nameMaxLength: 'O nome deve ter no máximo 100 caracteres',
        requiredField: 'Este campo é obrigatório',
        maxLength4: 'Deve ter no máximo 4 caracteres',
        maxLength10: 'Deve ter no máximo 10 caracteres',
        maxLength255: 'Deve ter no máximo 255 caracteres',
        percentageRange: 'Informe um percentual entre 0 e 999,99',
        percentageRange100: 'Informe um percentual entre 0 e 100',
        nonNegative: 'Informe um valor maior ou igual a 0',
      },
    },
  },
};
