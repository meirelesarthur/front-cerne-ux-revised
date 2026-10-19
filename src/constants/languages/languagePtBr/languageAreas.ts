// src/constants/languages/languagePtBr/languageAreas.ts
// Módulo Áreas (Area) — PT-BR. TASK-FE-415 (fundação). Ver
// `src/@types/language/module-areas/index.ts` (contrato de tipos).

import { ModuleAreas } from '@/@types/language/module-areas';

export const languageAreas: ModuleAreas = {
  area: {
    singularLabel: 'Área',
    pluralLabel: 'Áreas',
    // Sub-lista de Áreas dentro da linha expandida de Fazenda (TASK-FE-416).
    list: {
      table: {
        description: 'Nome',
        totalArea: 'Área total (ha)',
        active: 'Ativo',
        activeLabel: 'Sim',
        inactiveLabel: 'Não',
      },
      actions: {
        view: 'Visualizar área',
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        title: 'Nenhuma área cadastrada nesta fazenda.',
        description: 'Adicione a primeira área para começar.',
      },
      errorState: {
        title: 'Não foi possível carregar as áreas.',
        description: 'Tente novamente em instantes.',
      },
      deletedToast: 'Área removida com sucesso',
    },
    typeOptions: {
      productive: 'Produtiva',
      reserve: 'Reserva',
    },
    // Mirror EXATO de `languageBaseRegistrations.grazing.colorOptions`
    // (mesmo Enum `AreaColor` do backend, mesma ordem, mesmos rótulos).
    colorOptions: {
      white: 'Branco',
      blue: 'Azul',
      black: 'Preto',
      green: 'Verde',
      yellow: 'Amarelo',
      red: 'Vermelho',
      gray: 'Cinza',
      lightGray: 'Cinza Claro',
      lightBlue: 'Azul Claro',
      darkBlue: 'Azul Escuro',
      turquoise: 'Turquesa',
      darkGreen: 'Verde Escuro',
      lightGreen: 'Verde Claro',
      orange: 'Laranja',
    },
    form: {
      validation: {
        descriptionRequired: 'Informe a descrição da área.',
        descriptionMaxLength: 'A descrição deve ter no máximo 100 caracteres.',
        registrationMaxLength: 'A matrícula deve ter no máximo 30 caracteres.',
        dateRequired: 'Informe a data de criação da área.',
        typeRequired: 'Selecione o tipo da área.',
        colorRequired: 'Selecione a cor da área.',
        coordinatesRequired: 'Demarque a área no mapa ou importe um arquivo KML.',
        totalAreaRequired: 'Informe a área total (ha).',
        productiveAreaRequired: 'Informe a área produtiva (ha).',
        unproductiveAreaRequired: 'Informe a área improdutiva (ha).',
        isEnabledRequired: 'Informe se a área está ativa.',
      },
      title: {
        create: 'Nova área',
        edit: 'Editar área',
      },
      sections: {
        map: 'Demarcação da área',
        details: 'Dados da área',
      },
      fields: {
        description: 'Descrição',
        registration: 'Matrícula',
        date: 'Data de criação',
        proprietary: 'Proprietário gestor',
        type: 'Tipo',
        activity: 'Atividade/cultura',
        recreationArea: 'Área de lazer',
        color: 'Cor da área',
        infrastructure: 'Infraestrutura',
        totalArea: 'Área (ha)',
        productiveArea: 'Área produtiva (ha)',
        unproductiveArea: 'Área improdutiva (ha)',
        isEnabled: 'Ativo',
        note: 'Observação',
      },
      placeholders: {
        description: 'Informe a descrição da área',
        registration: 'Informe a matrícula',
        proprietary: 'Selecione o proprietário gestor',
        activity: 'Selecione a atividade/cultura',
        infrastructure: 'Selecione a infraestrutura',
        note: 'Observações adicionais',
      },
      farmNotFound: {
        title: 'Fazenda não identificada.',
        description: 'Volte para a lista de fazendas e tente novamente.',
      },
    },
    mapEditor: {
      mapHint: 'Use as ferramentas no mapa para desenhar o polígono da área.',
      noPerimeter: 'Nenhum polígono demarcado — desenhe no mapa ou importe um arquivo KML.',
      perimeterDefinedLabel: 'Polígono demarcado',
      areaUnit: 'ha',
      importButton: 'Importar KML',
      importInProgress: 'Importando...',
      importSuccessToast: 'Arquivo importado com sucesso',
      importErrorToast: 'Erro ao importar KML: verifique se o arquivo contém um polígono válido.',
      importInvalidExtension: 'Envie um arquivo .kml ou .kmz.',
      importMultiplePolygonsToast:
        'O arquivo contém mais de um polígono — apenas o primeiro foi usado.',
      overlapWarningTitle: 'Sobreposição de área',
      overlapWarningDescription:
        'Este polígono sobrepõe outra área já cadastrada nesta fazenda. Ajuste o desenho antes de continuar.',
      iconOutsideAreaWarning: 'O ícone deve permanecer dentro da área demarcada.',
    },
    multiple: {
      title: 'Adicionar múltiplas áreas',
      subtitle: 'Importe um ou mais arquivos KML para criar várias áreas de uma só vez.',
      importButton: 'Importar KMLs',
      importInProgress: 'Importando arquivos...',
      emptyState: {
        title: 'Nenhum arquivo importado ainda.',
        description: 'Importe um ou mais arquivos .kml/.kmz para gerar os cards de área.',
      },
      importFileErrorToast:
        'Não foi possível importar o arquivo: verifique se ele contém um polígono válido.',
      importInvalidExtension: 'Envie apenas arquivos .kml ou .kmz.',
      cardLabelPrefix: 'Área',
      cardRemoveLabel: 'Remover área',
      submitButton: 'Salvar áreas',
      validationErrorToast: 'Corrija os campos destacados nos cards antes de salvar.',
      emptySubmitToast: 'Importe ao menos um arquivo KML antes de salvar.',
      createdSuccessToast: 'Áreas criadas com sucesso!',
    },
    detail: {
      mapAriaLabel: 'Mapa da área',
      sections: {
        map: 'Localização no mapa',
        details: 'Dados da área',
      },
      fields: {
        farm: 'Fazenda',
        farmTotalArea: 'Área da fazenda',
        manager: 'Gestor',
        city: 'Cidade',
        description: 'Descrição',
        active: 'Ativo',
        totalArea: 'Área (ha)',
        infrastructure: 'Infraestrutura',
        note: 'Observação',
      },
      notFound: {
        title: 'Área não encontrada.',
        description: 'Volte para a lista de fazendas e tente novamente.',
        back: 'Voltar',
      },
      actions: {
        edit: 'Editar',
      },
    },
  },
};
