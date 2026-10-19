// src/@types/language/module-areas/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo Áreas (Area — subdivisão geoespacial da
// Fazenda, F-348/UT-000446, esteira 067). TASK-FE-415 (fundação) — só o
// necessário para o query-key (singular/plural), o schema Yup
// (`validation.*`) e as fábricas de options (`typeOptions`/`colorOptions`)
// compilarem. Mirror estrutural de `module-farms`/`module-base-registrations`
// (bloco `grazing`, TASK-GZ-FE-01): o bloco `list`/`filter`/`form.fields` (UI
// de tela) é adicionado pelas Tarefas 416/419/420 — não inventado aqui.
//
// O conteúdo mora em `src/constants/languages/{idioma}/languageAreas.ts`.
//
// TASK-FE-416 (Lista de Áreas dentro de Fazendas, SURF-01/02/03) — adiciona o
// bloco `list` (colunas/estados/ações da sub-lista embutida na linha da
// Fazenda), previsto e deixado em aberto pela fundação (TASK-FE-415).
// -----------------------------------------------------------------------------

export interface ModuleAreas {
  area: {
    singularLabel: string;
    pluralLabel: string;

    /** Sub-lista de Áreas dentro da linha expandida de Fazenda
     *  (`AreasSubList.tsx`, TASK-FE-416, SURF-01/02/03). */
    list: {
      table: {
        description: string;
        totalArea: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      /** Menu de ação da ÁREA (SURF-03) — Visualizar/Editar/Excluir, gated
       *  por `farms_view`/`farms_edit`/`farms_delete` (DEC-006). */
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      errorState: {
        title: string;
        description: string;
      };
      deletedToast: string;
    };

    /** Fábrica do enum `AreaType` (`constants/areas/area/areas-status.ts`) —
     *  1 Produtiva, 2 Reserva. */
    typeOptions: {
      productive: string;
      reserve: string;
    };

    /** Fábrica da paleta FECHADA de 14 cores (`AreaColor`,
     *  `constants/areas/area/areas-status.ts`) — mirror EXATO de
     *  `colorOptions` de `baseRegistrations.grazing` (mesmo Enum de backend,
     *  mesma ordem, rótulos idênticos). */
    colorOptions: {
      white: string;
      blue: string;
      black: string;
      green: string;
      yellow: string;
      red: string;
      gray: string;
      lightGray: string;
      lightBlue: string;
      darkBlue: string;
      turquoise: string;
      darkGreen: string;
      lightGreen: string;
      orange: string;
    };

    /** Mensagens de validação do schema Yup (`area-schema.ts`,
     *  `src/validations/schemas/Areas/`) — fundação compartilhada por
     *  TASK-FE-415. O bloco `form.fields`/`form.placeholders` completo (UI)
     *  é adicionado pelas Tarefas 419/420 (editor single). */
    form: {
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        registrationMaxLength: string;
        dateRequired: string;
        typeRequired: string;
        colorRequired: string;
        coordinatesRequired: string;
        totalAreaRequired: string;
        productiveAreaRequired: string;
        unproductiveAreaRequired: string;
        isEnabledRequired: string;
      };

      /** Editor single (`CreateOrUpdateArea.tsx`, TASK-FE-420) — título,
       *  rótulos/placeholders dos 14 campos e mensagens de estado. */
      title: {
        create: string;
        edit: string;
      };

      sections: {
        /** Cabeçalho da seção do mapa (embute `AreaMapEditor`, TASK-FE-419). */
        map: string;
        /** Cabeçalho da seção dos 14 campos. */
        details: string;
      };

      fields: {
        description: string;
        registration: string;
        date: string;
        proprietary: string;
        type: string;
        activity: string;
        recreationArea: string;
        color: string;
        infrastructure: string;
        totalArea: string;
        productiveArea: string;
        unproductiveArea: string;
        isEnabled: string;
        note: string;
      };

      placeholders: {
        description: string;
        registration: string;
        proprietary: string;
        activity: string;
        infrastructure: string;
        note: string;
      };

      /** Rota aninhada sem `farmId` válido na URL (guarda defensiva — a rota
       *  real só nasce na TASK-FE-422, mas o componente já protege contra
       *  navegação direta/URL malformada). */
      farmNotFound: {
        title: string;
        description: string;
      };
    };

    /** Painel de mapa do editor de Área (`AreaMapEditor.tsx`, TASK-FE-419,
     *  SURF-04a/04b) — toolbar de desenho/KML, status do perímetro e avisos
     *  de sobreposição/ícone fora da área. Consumido pelo editor single
     *  (TASK-FE-420) e pelo fluxo de múltiplas Áreas (TASK-FE-421, 1
     *  instância por card). */
    mapEditor: {
      /** Dica de uso da toolbar (mirror `demarcacao.mapHint` de Fazenda). */
      mapHint: string;
      /** Nenhum polígono ainda — mapa "vazio" (estado de UI da Tarefa). */
      noPerimeter: string;
      perimeterDefinedLabel: string;
      areaUnit: string;
      importButton: string;
      importInProgress: string;
      importSuccessToast: string;
      importErrorToast: string;
      importInvalidExtension: string;
      /** KML com mais de 1 polígono — só o primeiro é usado (Área = 1
       *  Feature, `AreaCoordinates`, nunca `FeatureCollection`). */
      importMultiplePolygonsToast: string;
      /** CLM-24 preservado (aviso client-side, sem revalidação server) —
       *  sobreposição com outra Área já cadastrada na mesma Fazenda. */
      overlapWarningTitle: string;
      overlapWarningDescription: string;
      /** Marcador de atividade/infraestrutura arrastado para fora do
       *  polígono da Área — volta ao centro (fiel ao legado, `maps.js:991-
       *  1020`). */
      iconOutsideAreaWarning: string;
    };

    /** "Adicionar Múltiplas Áreas" (`CreateMultipleAreas.tsx`/`AreaCard.tsx`,
     *  TASK-FE-421, SURF-05/UX-GAP-02) — página cheia: importar N KMLs → N
     *  cards editáveis (reuso de `form.fields`/`form.placeholders`/
     *  `mapEditor.*` acima, 1 instância de `AreaMapEditor` por card) → 1
     *  submit `POST /areas/batch` all-or-nothing. */
    multiple: {
      title: string;
      subtitle: string;
      importButton: string;
      importInProgress: string;
      /** Nenhum card ainda — CTA para importar o primeiro KML. */
      emptyState: {
        title: string;
        description: string;
      };
      /** KML aceito pelo backend (GeoJSON com polígono) mas sem nenhuma
       *  geometria de Polígono/MultiPolígono utilizável — card não é criado. */
      importFileErrorToast: string;
      /** Extensão de arquivo inválida (mirror `mapEditor.importInvalidExtension`,
       *  aplicado por arquivo no loop de import múltiplo). */
      importInvalidExtension: string;
      /** Rótulo do card N (`"Área {n}"`, `n` concatenado pelo componente). */
      cardLabelPrefix: string;
      cardRemoveLabel: string;
      /** Botão de submissão do lote (plural, distinto do single `title.create`). */
      submitButton: string;
      /** Algum card tem erro de validação client-side (Yup) — bloqueia o submit. */
      validationErrorToast: string;
      /** Nenhum card importado ainda — bloqueia o submit. */
      emptySubmitToast: string;
      /** Sucesso do lote — plural (distinto do toast singular do editor single). */
      createdSuccessToast: string;
    };

    /** "Visualizar Área" (`DetalheArea.tsx`, TASK-FE-417, SURF-07) —
     *  read-only, subconjunto de campos fiel ao legado (CLM-26,
     *  `CONTRATO-tela-frontend-area.md §6` UX-GAP-03). Mirror estrutural de
     *  `costCenters.costCenter.detail` (`DetalheCentroCusto.tsx`). */
    detail: {
      /** `aria-label` do mapa read-only (`FarmAreasMap`). */
      mapAriaLabel: string;
      sections: {
        /** Cabeçalho da seção do mapa (mirror `form.sections.map`, texto
         *  distinto — tela de leitura, não de demarcação). */
        map: string;
        /** Cabeçalho da seção dos campos (mirror `form.sections.details`). */
        details: string;
      };
      /** Rótulos do subconjunto legado (CLM-26) — `farm`/`farmTotalArea`/
       *  `manager`/`city` NÃO existem em `form.fields` (telas de escrita não
       *  os exibem); os demais reaproveitariam `form.fields`, mas ficam
       *  próprios aqui para a tela de leitura não depender do namespace do
       *  formulário (evita acoplamento entre as 2 telas). */
      fields: {
        farm: string;
        /** `farm.total_area` (hectares da FAZENDA, não da Área — legado
         *  `areas/show.blade.php:60-62`, `money($farm->total_area)`). */
        farmTotalArea: string;
        /** `area.proprietary.label` (legado: `proprietary->people->name`). */
        manager: string;
        /** `farm.town.name` (legado: `farm->city`, string crua). */
        city: string;
        description: string;
        active: string;
        /** `area.total_area` (hectares da PRÓPRIA Área). */
        totalArea: string;
        infrastructure: string;
        note: string;
      };
      /** Área não encontrada (uuid inválido/404) — mirror
       *  `costCenters.costCenter.detail.notFound`. */
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      actions: {
        edit: string;
      };
    };
  };
}
