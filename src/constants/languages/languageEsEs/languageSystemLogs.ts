// src/constants/languages/languageEsEs/languageSystemLogs.ts
// Traducción es-ES del Visor de Logs (ejecución 079). Ver
// `@/@types/language/module-system-logs` para el contrato completo.

import { ModuleSystemLogs } from '@/@types/language/module-system-logs';

export const languageSystemLogs: ModuleSystemLogs = {
  systemLog: {
    singularLabel: 'Log del Sistema',
    pluralLabel: 'Logs del Sistema',
    titleModule: 'Logs del Sistema',

    explorer: {
      pageTitle: 'Logs del Sistema',
      pageSubtitle:
        'Navegue por los archivos de log de la plataforma, ábralos para leer las últimas líneas o descargue el archivo completo.',
      breadcrumbAriaLabel: 'Ruta de la carpeta',
      breadcrumbRoot: 'logs',
      table: {
        name: 'Nombre',
        size: 'Tamaño',
        modifiedAt: 'Modificado el',
        actions: 'Acciones',
        folder: 'Carpeta',
        file: 'Archivo',
        sortBy: 'Ordenar por',
      },
      actions: {
        open: 'Abrir',
        download: 'Descargar',
        refresh: 'Actualizar',
      },
      filter: {
        placeholder: 'Filtrar por nombre',
        ariaLabel: 'Filtrar archivos y carpetas por nombre',
        clear: 'Limpiar filtro',
      },
      truncatedNotice:
        'El listado fue cortado en el límite de la API. Use el filtro por nombre para localizar el archivo deseado.',
      emptyState: {
        title: 'Esta carpeta está vacía',
        description: 'No hay archivos ni carpetas de log en este lugar.',
      },
      noResultsState: {
        title: 'Ningún elemento encontrado',
        description: 'Ningún archivo o carpeta coincide con el filtro indicado.',
        clear: 'Limpiar filtro',
      },
      notFoundState: {
        title: 'Carpeta no encontrada',
        description: 'La carpeta indicada no existe o fue eliminada.',
        back: 'Volver a logs',
      },
      error: {
        message: 'No fue posible cargar el listado de logs.',
        retry: 'Intentar de nuevo',
      },
    },

    viewer: {
      pageTitle: 'Archivo de log',
      pageSubtitle:
        'Mostrando las últimas líneas. Cargue fragmentos más antiguos según la necesidad.',
      fields: { size: 'Tamaño', modifiedAt: 'Modificado el' },
      actions: {
        refresh: 'Actualizar',
        download: 'Descargar',
        backToFolder: 'Volver a la carpeta',
        loadOlder: 'Cargar más antiguos',
        wrapLines: 'Ajustar líneas',
        backToEnd: 'Volver al final del archivo',
        retry: 'Intentar de nuevo',
      },
      contentAriaLabel: 'Contenido del archivo de log',
      emptyFile: 'Archivo vacío',
      startOfFile: 'Inicio del archivo',
      loadedSummary: 'Cargado: {lines} líneas · {size}',
      limitReached: 'Límite de visualización alcanzado — descargue el archivo para ver el resto.',
      lineTruncated: '…(línea truncada en la visualización)',
      partialLine:
        'Hay una línea mayor que el bloque de lectura, mostrada parcialmente. Descargue el archivo para ver la línea completa.',
      sizeChangedWarning:
        'El archivo disminuyó de tamaño (rotación o truncamiento). El contenido se recargó desde el final.',
      contextNotice: 'Mostrando el contexto de una coincidencia de la búsqueda.',
      loadMoreError: 'No fue posible cargar más líneas. El contenido ya cargado se conservó.',
      error: { message: 'No fue posible cargar el contenido del archivo.' },
      notFoundState: {
        title: 'Archivo no encontrado o eliminado (rotación)',
        description:
          'El archivo puede haber sido rotado o borrado. Vuelva a la carpeta y abra otro archivo.',
        back: 'Volver a la carpeta',
      },
      binaryState: {
        title: 'Archivo binario',
        description: 'Este archivo no puede mostrarse como texto. Use la descarga.',
      },
      invalidCursorState: {
        title: 'El archivo cambió desde la última lectura',
        description:
          'El punto de lectura quedó más allá del tamaño actual del archivo. Recargue para ver el final.',
        action: 'Recargar desde el final',
      },
      missingPathState: {
        title: 'Archivo no indicado',
        description: 'Abra un archivo desde el listado de logs.',
        back: 'Volver a logs',
      },
    },

    search: {
      placeholder: 'Buscar en todo el archivo',
      ariaLabel: 'Buscar texto en todo el archivo',
      submit: 'Buscar',
      clear: 'Limpiar búsqueda',
      scopeNote:
        'La búsqueda recorre todo el archivo, de las líneas más recientes a las más antiguas. Presione Enter para buscar.',
      minChars: 'Escriba al menos {min} caracteres.',
      resultsTitle: 'Resultados de la búsqueda',
      resultCount: '{count} coincidencia(s) cargada(s)',
      noResults: 'Ninguna coincidencia encontrada en el tramo buscado.',
      loadMore: 'Seguir buscando en fragmentos más antiguos',
      moreAvailable: 'Hay partes más antiguas del archivo aún no buscadas.',
      openContext: 'Abrir contexto',
      lineTruncated: '(línea truncada)',
      error: 'No fue posible buscar en el archivo.',
    },

    download: {
      success: 'Descarga completada.',
      error: 'No fue posible descargar el archivo.',
      progress: 'Descargando… {percent}%',
      inProgress: 'Descargando…',
      ariaLabel: 'Descargar {name}',
    },
  },
};
