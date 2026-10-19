// src/constants/languages/languageEsEs/languageConfiguracoes.ts
// Traducción ES-ES del módulo CONFIGURACIONES — entidad "Tutoriales" (Help,
// TASK-HP-06). Primer módulo de este árbol de traducción.

import { ModuleConfiguracoes } from '@/@types/language/module-configuracoes';

export const languageConfiguracoes: ModuleConfiguracoes = {
  help: {
    singularLabel: 'Tutorial',
    pluralLabel: 'Tutoriales',
    list: {
      pageTitle: 'Tutoriales',
      pageSubtitle:
        'Administre los enlaces de ayuda contextual vinculados a las pantallas del sistema.',
      deletedToast: 'Tutorial eliminado con éxito',
      table: {
        url: 'URL',
        screen: 'Pantalla',
        createdAt: 'Creado el',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        title: 'Ningún tutorial registrado.',
        description: 'Comience agregando el primer tutorial.',
        titleFiltered: 'Ningún tutorial encontrado.',
        descriptionFiltered: 'Intente ajustar el filtro o borrar la búsqueda.',
        cta: 'Agregar Tutorial',
      },
    },
    filter: {
      title: 'Filtrar tutoriales',
      screen: 'Pantalla',
      screenPlaceholder: 'Buscar por pantalla',
    },
    form: {
      title: {
        create: 'Nuevo Tutorial',
        edit: 'Editar Tutorial',
      },
      subtitle: {
        create: 'Registre un nuevo enlace de ayuda vinculado a una pantalla del sistema.',
        edit: 'Actualice el enlace de ayuda de este tutorial.',
      },
      fields: {
        url: 'URL',
        screen: 'Pantalla',
      },
      placeholders: {
        url: 'https://...',
        screen: 'Buscar por pantalla',
      },
    },
    deleteDialog: {
      title: 'Eliminar tutorial',
    },
  },
  // Aplicaciones (App — versiones de release de la app móvil,
  // TASK-APP-FE-01, 2026-08-06). Bloque NUEVO, junto a `help` (no lo
  // reemplaza).
  app: {
    singularLabel: 'Aplicación',
    pluralLabel: 'Aplicaciones',
    list: {
      pageTitle: 'Aplicaciones',
      pageSubtitle: 'Administre las versiones de release de la aplicación móvil.',
      deletedToast: 'Aplicación eliminada con éxito',
      table: {
        platform: 'Plataforma',
        version: 'Versión',
        releaseDate: 'Fecha de Lanzamiento',
        deadline: 'Fecha Límite',
        createdAt: 'Creado el',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        title: 'Ninguna aplicación registrada.',
        description: 'Comience agregando la primera aplicación.',
        titleFiltered: 'Ninguna aplicación encontrada.',
        descriptionFiltered: 'Intente ajustar el filtro o borrar la búsqueda.',
        cta: 'Agregar Aplicación',
      },
    },
    filter: {
      title: 'Filtrar aplicaciones',
      platform: 'Plataforma',
      platformPlaceholder: 'Buscar por plataforma',
      version: 'Versión',
      versionPlaceholder: 'Buscar por versión',
    },
    form: {
      title: {
        create: 'Nueva Aplicación',
        edit: 'Editar Aplicación',
      },
      subtitle: {
        create: 'Registre una nueva versión de release de la aplicación móvil.',
        edit: 'Actualice esta versión de release de la aplicación móvil.',
      },
      fields: {
        platform: 'Plataforma',
        version: 'Versión',
        description: 'Descripción',
        releaseDate: 'Fecha de Lanzamiento',
        deadline: 'Fecha Límite',
      },
      placeholders: {
        platform: 'Ej.: android',
        version: 'Ej.: 5.4.11',
        description: 'Descripción de esta versión de release',
      },
    },
    deleteDialog: {
      title: 'Eliminar aplicación',
    },
  },
  // Configuración (settings singleton de plataforma, execución 032,
  // TASK-FE-2600). Bloque NUEVO, junto a `help`/`app` (no los reemplaza).
  config: {
    singularLabel: 'Configuración',
    pluralLabel: 'Configuración',
    pageTitle: 'Configuración',
    pageSubtitle: 'Parámetros globales de la plataforma.',
    sections: {
      operational: 'Plazos y Parámetros Operativos',
      mercadoPago: 'Mercado Pago',
      signup: 'Auto-registro',
      support: 'Soporte y Responsable Técnico',
      videoIntro: 'Video Institucional',
    },
    fields: {
      diasTeste: 'Días de prueba',
      diasAlertaPagamento: 'Días alerta de pago',
      diasAssinarContrato: 'Días para firmar contrato',
      contratoCertificado: 'Firmar contrato con certificado',
      minutosOnline: 'Minutos de la empresa en línea',
      diasAlertaVencimentoCertificado: 'Días alerta vencimiento certificado',
      mercadopagoPublicKey: 'Mercado Pago Public Key',
      mercadopagoAccessToken: 'Mercado Pago Access Token',
      afiliadoPadrao: 'Afiliado predeterminado',
      planoPadrao: 'Plan predeterminado',
      whatsappLinkSuporte: 'Enlace de WhatsApp de Soporte',
      respCnpj: 'CNPJ del responsable técnico',
      respNome: 'Nombre del responsable técnico',
      respEmail: 'Email del responsable técnico',
      respFone: 'Teléfono del responsable técnico',
    },
    secretPlaceholder: {
      configured: '•••••••• (ya configurado)',
      empty: '',
    },
    videoIntro: {
      uploadCta: 'Enviar video institucional',
      replaceCta: 'Sustituir video',
      successToast: 'Video institucional actualizado con éxito.',
    },
    booleanOptions: {
      yes: 'Sí',
      no: 'No',
    },
    saveSuccessToast: 'Configuración actualizada con éxito.',
    readOnlyNotice: 'No tiene permiso para editar esta configuración.',
  },
};
