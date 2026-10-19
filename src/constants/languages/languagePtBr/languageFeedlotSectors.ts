// src/constants/languages/languagePtBr/languageFeedlotSectors.ts
// Tradução PT-BR do módulo OPERACIONAL — Setor (FeedlotSector) — domínio
// próprio, TASK-FS-FE-01/02. Mirror `languageFeedlotYards`, com o bloco
// extra de FK visível (`feedlotYard`, select de Pátio).

import { ModuleFeedlotSectors } from '@/@types/language/module-feedlot-sectors';

export const languageFeedlotSectors: ModuleFeedlotSectors = {
  feedlotSector: {
    singularLabel: 'Setor',
    pluralLabel: 'Setores',
    list: {
      pageTitle: 'Setores',
      pageSubtitle: 'Cadastro dos setores de confinamento.',
      deletedToast: 'Setor removido com sucesso',
      table: {
        code: 'Código',
        name: 'Nome',
        feedlotYard: 'Pátio',
        area: 'Área (m²)',
        createdAt: 'Criado em',
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
        titleEmpty: 'Nenhum setor cadastrado.',
        descriptionEmpty: 'Comece adicionando seu primeiro setor.',
        titleEmptyNoCreate: 'Nenhum setor cadastrado.',
        descriptionEmptyNoCreate: 'Você não tem permissão para cadastrar um novo setor.',
        titleFiltered: 'Nenhum setor encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Setor',
      },
    },
    filter: {
      title: 'Filtrar setores',
      code: 'Código',
      codePlaceholder: 'Buscar por código',
      name: 'Nome',
      namePlaceholder: 'Buscar por nome',
      feedlotYard: 'Pátio',
      feedlotYardPlaceholder: 'Buscar por pátio',
      isActive: 'Status',
      isActiveAll: 'Todos',
    },
    detail: {
      generalData: { title: 'Dados Gerais' },
      fields: {
        code: 'Código',
        name: 'Nome',
        feedlotYard: 'Pátio',
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
        title: 'Setor não encontrado.',
        description: 'Verifique o link acessado ou volte para a listagem.',
        back: 'Voltar para a listagem',
      },
    },
    form: {
      title: { create: 'Novo Setor', edit: 'Editar Setor' },
      fields: {
        code: 'Código',
        name: 'Nome',
        feedlotYard: 'Pátio',
        width: 'Largura (m)',
        length: 'Comprimento (m)',
        area: 'Área Total (m²)',
        isActive: 'Status',
        observation: 'Observação',
      },
      placeholders: {
        feedlotYard: 'Selecione o pátio',
        width: 'Largura em metros',
        length: 'Comprimento em metros',
      },
      hints: {
        codeGenerated: 'Gerado automaticamente',
      },
      validation: {
        nameRequired: 'O nome é obrigatório.',
        nameMaxLength: 'O nome deve ter no máximo 120 caracteres.',
        feedlotYardRequired: 'O pátio é obrigatório.',
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
        message: 'Não foi possível carregar os dados deste setor.',
        retry: 'Tentar novamente',
      },
    },
  },
};
