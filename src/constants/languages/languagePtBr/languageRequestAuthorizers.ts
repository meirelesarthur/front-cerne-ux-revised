// src/constants/languages/languagePtBr/languageRequestAuthorizers.ts
// Tradução PT-BR do módulo de AUTORIZADORES (RequestAuthorizer — Cadastros
// Base / Pessoas). SLICE 1 (Lote 06 / esteira 089, Frente C, F-141) — `list` +
// `filter`. SLICE 2 (mesmo lote/esteira, frente C) acrescenta `form`
// (criação/edição) — textos adaptados do commit revertido `99deb566`
// (referência de conteúdo i18n, não de código) com uma correção: `rules.value`
// vira campo de texto livre (placeholder), não Select fechado — fonte das
// opções fiéis ao legado não confirmada nesta rodada (contrato §10.4, UX-GAP
// não-bloqueante).

import { ModuleRequestAuthorizers } from '@/@types/language/module-request-authorizers';

export const languageRequestAuthorizers: ModuleRequestAuthorizers = {
  requestAuthorizer: {
    singularLabel: 'Autorizador',
    list: {
      pageTitle: 'Autorizadores',
      pageSubtitle: 'Administre quem pode aprovar solicitações de compra.',
      deletedToast: 'Registro deletado com sucesso.',
      createdToast: 'Registro criado com sucesso.',
      updatedToast: 'Registro atualizado com sucesso.',
      deleteConfirm: {
        title: 'Você está certo?',
        text: 'Uma vez deletado, você não poderá recuperar esse item novamente!',
      },
      table: {
        user: 'Usuário',
        maxValue: 'Valor',
        maxValueUpTo: 'até',
        createdAt: 'Dt. Cadastro',
        numberQuotes: 'Nº mín. cotações',
        expenseOrganizer: 'Ordenador de Despesas?',
        isConditional: 'Autorizador Condicional',
        isActive: 'Ativo',
        farms: 'Fazendas',
        farmsCount: 'fazenda(s)',
        active: 'Ativo',
        inactive: 'Inativo',
        yes: 'Sim',
        no: 'Não',
      },
      actions: {
        // "Visualizar" abre a tela própria (`/visualizar`, só `view`).
        view: 'Visualizar autorizador',
        edit: 'Editar autorizador',
        delete: 'Excluir autorizador',
      },
      emptyState: {
        titleEmpty: 'Nenhuma informação cadastrada.',
        descriptionEmpty: 'Comece adicionando o primeiro autorizador.',
        titleEmptyNoCreate: 'Nenhuma informação cadastrada.',
        descriptionEmptyNoCreate: 'Fale com um administrador para cadastrar um autorizador.',
        titleFiltered: 'Nenhuma informação cadastrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Autorizador',
      },
    },
    filter: {
      title: 'Filtrar autorizadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome do usuário',
    },
    form: {
      title: {
        create: 'Novo Autorizador',
        edit: 'Editar Autorizador',
        view: 'Visualizar Autorizador',
      },
      subtitle: {
        create: 'Cadastre um novo autorizador de solicitações de compra.',
        edit: 'Atualize os dados do autorizador.',
        view: 'Consulte os dados do autorizador.',
      },
      fields: {
        userUuid: 'Usuário',
        maxValue: 'Até',
        numberQuotes: 'Quantidade mínima de cotações',
        isActive: 'Ativo',
        expenseOrganizer: 'Ordenador de Despesas?',
        isConditional: 'Autorizador condicional',
        responsible: 'Responsável',
        creationDate: 'Data de Criação',
        lastUpdate: 'Última atualização',
      },
      placeholders: {
        userUuid: 'Buscar por nome',
      },
      hints: {
        maxValue: 'Informe o valor máximo que este autorizador pode aprovar',
      },
      farms: {
        sectionTitle: 'Fazendas',
        sectionHint: 'Vincule ao menos 1 fazenda e o nível de alçada do autorizador nela.',
        addRowLabel: 'Adicionar Fazenda',
        removeRowLabel: 'Remover fazenda',
        removeConfirm: {
          title: 'Você está certo?',
          text: 'Deseja remover esse item mesmo?',
        },
        incompleteRow: 'Preencha todos os campos antes de adicionar novos.',
        minOneItem: 'Você deve ter ao menos um item na lista',
        levelPlaceholder: 'Selecione',
        emptyTitle: 'Adicione ao menos 1 fazenda.',
        fields: {
          farm: 'Fazenda',
          level: 'Nível',
        },
        placeholders: {
          farm: 'Selecione',
        },
      },
      rules: {
        sectionTitle: 'Regras de Autorização',
        sectionHint: 'Restrinja quando este autorizador participa do fluxo de aprovação.',
        addRowLabel: 'Adicionar Regra',
        removeRowLabel: 'Remover regra',
        emptyTitle: 'Adicione ao menos 1 regra.',
        fields: {
          type: 'Tipo',
          value: 'Valor',
          applyOn: 'Aplica',
        },
        placeholders: {
          value: 'Selecione o tipo de solicitação',
        },
        typeOptions: {
          requestPurchase: 'Tipo de Chamado',
        },
        valueOptions: {
          all: 'Todos',
        },
        applyOnOptions: {
          before: 'Antes da Cotação',
          after: 'Depois da Cotação',
        },
      },
      validation: {
        userRequired: 'O usuário é obrigatório',
        maxValueRequired: 'O campo Até é obrigatório.',
        maxValueRange: 'A alçada deve ser maior ou igual a zero',
        numberQuotesRequired: 'A quantidade mínima de cotações é obrigatória',
        numberQuotesMin: 'A quantidade mínima de cotações deve ser ao menos 1',
        farmsRequired: 'Adicione ao menos 1 fazenda',
        farmFarmRequired: 'Selecione a fazenda',
        farmLevelRequired: 'Selecione o nível',
        farmLevelRange: 'O nível deve estar entre 1 e 4',
        rulesRequired: 'Adicione ao menos 1 regra',
        ruleTypeRequired: 'Selecione o tipo',
        ruleValueRequired: 'O valor é obrigatório',
        ruleApplyOnRequired: 'Selecione quando a regra se aplica',
      },
    },
  },
};
