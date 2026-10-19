// src/constants/languages/languageEsEs/languageAreas.ts
// Módulo Áreas (Area) — ES-ES. TASK-FE-415 (fundación). Ver
// `src/@types/language/module-areas/index.ts` (contrato de tipos).

import { ModuleAreas } from '@/@types/language/module-areas';

export const languageAreas: ModuleAreas = {
  area: {
    singularLabel: 'Área',
    pluralLabel: 'Áreas',
    // Sub-lista de Áreas dentro de la fila expandida de Finca (TASK-FE-416).
    list: {
      table: {
        description: 'Nombre',
        totalArea: 'Área total (ha)',
        active: 'Activo',
        activeLabel: 'Sí',
        inactiveLabel: 'No',
      },
      actions: {
        view: 'Ver área',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        title: 'Ninguna área registrada en esta finca.',
        description: 'Agregue la primera área para comenzar.',
      },
      errorState: {
        title: 'No fue posible cargar las áreas.',
        description: 'Intente nuevamente en unos instantes.',
      },
      deletedToast: 'Área eliminada con éxito',
    },
    typeOptions: {
      productive: 'Productiva',
      reserve: 'Reserva',
    },
    // Espejo EXACTO de `languageBaseRegistrations.grazing.colorOptions`
    // (mismo Enum `AreaColor` del backend, mismo orden, mismas etiquetas).
    colorOptions: {
      white: 'Blanco',
      blue: 'Azul',
      black: 'Negro',
      green: 'Verde',
      yellow: 'Amarillo',
      red: 'Rojo',
      gray: 'Gris',
      lightGray: 'Gris Claro',
      lightBlue: 'Azul Claro',
      darkBlue: 'Azul Oscuro',
      turquoise: 'Turquesa',
      darkGreen: 'Verde Oscuro',
      lightGreen: 'Verde Claro',
      orange: 'Naranja',
    },
    form: {
      validation: {
        descriptionRequired: 'Ingrese la descripción del área.',
        descriptionMaxLength: 'La descripción debe tener como máximo 100 caracteres.',
        registrationMaxLength: 'La matrícula debe tener como máximo 30 caracteres.',
        dateRequired: 'Ingrese la fecha de creación del área.',
        typeRequired: 'Seleccione el tipo de área.',
        colorRequired: 'Seleccione el color del área.',
        coordinatesRequired: 'Demarque el área en el mapa o importe un archivo KML.',
        totalAreaRequired: 'Ingrese el área total (ha).',
        productiveAreaRequired: 'Ingrese el área productiva (ha).',
        unproductiveAreaRequired: 'Ingrese el área improductiva (ha).',
        isEnabledRequired: 'Indique si el área está activa.',
      },
      title: {
        create: 'Nueva área',
        edit: 'Editar área',
      },
      sections: {
        map: 'Demarcación del área',
        details: 'Datos del área',
      },
      fields: {
        description: 'Descripción',
        registration: 'Matrícula',
        date: 'Fecha de creación',
        proprietary: 'Propietario gestor',
        type: 'Tipo',
        activity: 'Actividad/cultivo',
        recreationArea: 'Área de recreo',
        color: 'Color del área',
        infrastructure: 'Infraestructura',
        totalArea: 'Área (ha)',
        productiveArea: 'Área productiva (ha)',
        unproductiveArea: 'Área improductiva (ha)',
        isEnabled: 'Activo',
        note: 'Observación',
      },
      placeholders: {
        description: 'Ingrese la descripción del área',
        registration: 'Ingrese la matrícula',
        proprietary: 'Seleccione el propietario gestor',
        activity: 'Seleccione la actividad/cultivo',
        infrastructure: 'Seleccione la infraestructura',
        note: 'Observaciones adicionales',
      },
      farmNotFound: {
        title: 'Finca no identificada.',
        description: 'Vuelva a la lista de fincas e intente nuevamente.',
      },
    },
    mapEditor: {
      mapHint: 'Use las herramientas en el mapa para dibujar el polígono del área.',
      noPerimeter: 'Ningún polígono demarcado — dibuje en el mapa o importe un archivo KML.',
      perimeterDefinedLabel: 'Polígono demarcado',
      areaUnit: 'ha',
      importButton: 'Importar KML',
      importInProgress: 'Importando...',
      importSuccessToast: 'Archivo importado con éxito',
      importErrorToast:
        'Error al importar KML: verifique que el archivo contenga un polígono válido.',
      importInvalidExtension: 'Envíe un archivo .kml o .kmz.',
      importMultiplePolygonsToast:
        'El archivo contiene más de un polígono — solo se usó el primero.',
      overlapWarningTitle: 'Superposición de área',
      overlapWarningDescription:
        'Este polígono se superpone a otra área ya registrada en esta finca. Ajuste el dibujo antes de continuar.',
      iconOutsideAreaWarning: 'El ícono debe permanecer dentro del área demarcada.',
    },
    multiple: {
      title: 'Agregar múltiples áreas',
      subtitle: 'Importe uno o más archivos KML para crear varias áreas a la vez.',
      importButton: 'Importar KMLs',
      importInProgress: 'Importando archivos...',
      emptyState: {
        title: 'Ningún archivo importado todavía.',
        description: 'Importe uno o más archivos .kml/.kmz para generar las tarjetas de área.',
      },
      importFileErrorToast:
        'No fue posible importar el archivo: verifique que contenga un polígono válido.',
      importInvalidExtension: 'Envíe solo archivos .kml o .kmz.',
      cardLabelPrefix: 'Área',
      cardRemoveLabel: 'Eliminar área',
      submitButton: 'Guardar áreas',
      validationErrorToast: 'Corrija los campos destacados en las tarjetas antes de guardar.',
      emptySubmitToast: 'Importe al menos un archivo KML antes de guardar.',
      createdSuccessToast: '¡Áreas creadas con éxito!',
    },
    detail: {
      mapAriaLabel: 'Mapa del área',
      sections: {
        map: 'Ubicación en el mapa',
        details: 'Datos del área',
      },
      fields: {
        farm: 'Finca',
        farmTotalArea: 'Área de la finca',
        manager: 'Gestor',
        city: 'Ciudad',
        description: 'Descripción',
        active: 'Activo',
        totalArea: 'Área (ha)',
        infrastructure: 'Infraestructura',
        note: 'Observación',
      },
      notFound: {
        title: 'Área no encontrada.',
        description: 'Vuelva a la lista de fincas e intente nuevamente.',
        back: 'Volver',
      },
      actions: {
        edit: 'Editar',
      },
    },
  },
};
