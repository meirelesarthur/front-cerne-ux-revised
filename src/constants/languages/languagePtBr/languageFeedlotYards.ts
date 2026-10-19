// src/constants/languages/languagePtBr/languageFeedlotYards.ts
// Tradução PT-BR do módulo OPERACIONAL — Pátio (FeedlotYard) — domínio
// próprio, TASK-PT-FE-01/02 (execução 046). Label exato do legado
// (`CLM-34`: `trad.var_patio`).

import { ModuleFeedlotYards } from '@/@types/language/module-feedlot-yards';

export const languageFeedlotYards: ModuleFeedlotYards = {
  feedlotYard: {
    singularLabel: 'Pátio',
    pluralLabel: 'Pátios',
    list: {
      pageTitle: 'Pátios',
      pageSubtitle: 'Cadastro dos pátios de confinamento.',
      deletedToast: 'Pátio removido com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
        area: 'Área (m²)',
        active: 'Status',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        view: 'Visualizar',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum pátio cadastrado.',
        descriptionEmpty: 'Comece adicionando seu primeiro pátio.',
        titleEmptyNoCreate: 'Nenhum pátio cadastrado.',
        descriptionEmptyNoCreate: 'Você não tem permissão para cadastrar um novo pátio.',
        titleFiltered: 'Nenhum pátio encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Pátio',
      },
    },
    filter: {
      title: 'Filtrar pátios',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      name: 'Nome',
      namePlaceholder: 'Buscar por nome',
      isActive: 'Status',
      isActiveAll: 'Todos',
    },
    detail: {
      generalData: { title: 'Dados Gerais' },
      fields: {
        code: 'Código',
        name: 'Nome',
        priority: 'Ordem',
        width: 'Largura',
        length: 'Comprimento',
        area: 'Área (m²)',
        observation: 'Observação',
        active: 'Status',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      actions: { edit: 'Editar', back: 'Voltar' },
      notFound: {
        title: 'Pátio não encontrado.',
        description: 'Verifique o link acessado ou volte para a listagem.',
        back: 'Voltar para a listagem',
      },
    },
    form: {
      title: { create: 'Novo Pátio', edit: 'Editar Pátio' },
      fields: {
        code: 'Código',
        name: 'Nome',
        width: 'Largura',
        length: 'Comprimento',
        area: 'Área (m²)',
        isActive: 'Ativo',
        observation: 'Observação',
      },
      placeholders: {
        name: 'Informe o nome do pátio',
        width: 'Largura em metros',
        length: 'Comprimento em metros',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
      },
      validation: {
        nameRequired: 'O nome é obrigatório.',
        nameMaxLength: 'O nome deve ter no máximo 120 caracteres.',
        widthRequired: 'A largura é obrigatória.',
        widthMin: 'A largura não pode ser negativa.',
        lengthRequired: 'O comprimento é obrigatório.',
        lengthMin: 'O comprimento não pode ser negativo.',
        isActiveRequired: 'O status é obrigatório.',
        observationMaxLength: 'A observação deve ter no máximo 600 caracteres.',
      },
    },
    status: {
      active: 'Ativo',
      inactive: 'Inativo',
    },
    dialog: {
      noChangesToast: 'Nada para salvar — nenhuma alteração foi feita.',
      loadError: {
        message: 'Não foi possível carregar os dados deste pátio.',
        retry: 'Tentar novamente',
      },
    },
  },
};
