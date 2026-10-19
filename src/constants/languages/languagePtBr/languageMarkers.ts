// src/constants/languages/languagePtBr/languageMarkers.ts
// Tradução PT-BR do módulo de MARCADORES (Marker — Cadastros Base).

import { ModuleMarkers } from '@/@types/language/module-markers';

export const languageMarkers: ModuleMarkers = {
  marker: {
    singularLabel: 'Marcador',
    pluralLabel: 'Marcadores',
    type: {
      activity: 'Atividade',
      infrastructure: 'Infraestrutura',
    },
    list: {
      pageTitle: 'Marcadores',
      pageSubtitle:
        'Administre o catálogo de marcadores utilizado no mapa da propriedade (Atividades e Infraestruturas).',
      deletedToast: 'Marcador removido com sucesso',
      table: {
        icon: 'Ícone',
        description: 'Descrição',
        type: 'Tipo',
        active: 'Ativo',
        activeLabel: 'Ativo',
        inactiveLabel: 'Inativo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        titleEmpty: 'Nenhum marcador cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro marcador.',
        titleFiltered: 'Nenhum marcador encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Marcador',
      },
      error: {
        message: 'Não foi possível carregar os marcadores.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar marcadores',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por descrição',
      type: 'Tipo',
      typeAll: 'Todos',
      isEnabled: 'Status',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
    },
    deleteBlocked: {
      title: 'Não é possível excluir',
      description:
        'Há registros vinculados a este marcador. Remova ou reatribua os vínculos abaixo antes de excluir',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        areas: 'Área(s) vinculada(s)',
        sectors: 'Setor(es) vinculado(s)',
        places: 'Local(is) vinculado(s)',
        subPlaces: 'Sub-local(is) vinculado(s)',
        areaInfrastructure: 'Infraestrutura de Área vinculada',
        sectorInfrastructure: 'Infraestrutura de Setor vinculada',
        placeInfrastructure: 'Infraestrutura de Local vinculada',
        subPlaceInfrastructure: 'Infraestrutura de Sub-local vinculada',
        activityCostCenters: 'Centro(s) de Custo de Atividade vinculado(s)',
        apportionmentItems: 'Rateio(s) de Atividade vinculado(s)',
      },
    },
    form: {
      title: {
        create: 'Novo Marcador',
        edit: 'Editar Marcador',
      },
      subtitle: {
        create: 'Cadastre um novo marcador para uso no mapa da propriedade.',
        edit: 'Atualize os dados do marcador.',
      },
      fields: {
        description: 'Descrição',
        type: 'Tipo',
        isEnabled: 'Ativo',
        icon: 'Ícone',
        iconNew: 'Novo ícone',
      },
      placeholders: {
        description: 'Ex.: Curral',
      },
      hints: {
        iconAccepted: 'Formatos aceitos: PNG.',
        iconMaxSize: 'Tamanho máximo: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar ícone',
        removeLabel: 'Remover ícone',
        errorType: 'Formato não aceito. Envie um arquivo PNG.',
        errorSize: 'Arquivo excede o tamanho máximo de 2 MB.',
      },
      validation: {
        descriptionMaxLength: 'A descrição deve ter no máximo 40 caracteres',
        typeRequired: 'Selecione o tipo',
        iconRequired: 'O ícone é obrigatório',
      },
    },
  },
};
