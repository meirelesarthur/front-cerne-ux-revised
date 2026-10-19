// src/constants/languages/languageEsEs/languageSite.ts
// Traducción ES del módulo "Site" (configuración única del sitio/finca —
// Site.edit/Site.update, 97-Esteiras/061, TASK-SITE-04). Namespace `site` —
// LIBRE, módulo TOP-LEVEL, NO anidado en `configuracoes` (G-FE-02).

import { ModuleSite } from '@/@types/language/module-site';

export const languageSite: ModuleSite['site'] = {
  singularLabel: 'Sitio',
  pluralLabel: 'Sitio',
  pageTitle: 'Sitio',
  pageSubtitle: 'Configure la información pública del sitio de la finca.',
  fields: {
    banner: 'Banner',
    published: '¿Publicar?',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'Youtube',
    whatsapp: 'Whatsapp',
    about: 'Sobre la Finca',
  },
  placeholders: {
    instagram: 'https://instagram.com/...',
    facebook: 'https://facebook.com/...',
    twitter: 'https://twitter.com/...',
    youtube: 'https://youtube.com/...',
    whatsapp: '(00) 00000-0000',
    about: 'Describa la finca...',
  },
  image: {
    hint: 'Formatos aceptados: JPEG, PNG, JPG, GIF, SVG. Tamaño máximo: 2MB.',
    dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
    dropzoneDragging: 'Suelte la imagen aquí',
    changeLabel: 'Cambiar Imagen',
    errorType: 'Formato de archivo no compatible.',
    errorSize: 'El archivo excede el tamaño máximo permitido.',
  },
  viewSiteLink: 'Ver Sitio',
  saveSuccessToast: 'Sitio actualizado con éxito.',
  readOnlyNotice: 'No tiene permiso para editar el sitio.',
  noFarmSelected: {
    title: 'Ninguna finca seleccionada',
    description: 'Seleccione una finca activa para configurar el sitio.',
  },
  publico: {
    menu: {
      sobre: 'Sobre Nosotros',
      softwares: 'Software',
      tutoriais: 'Tutoriales',
      sejaParceiro: 'Sea Socio',
      contato: 'Contacto',
      languageSwitcher: {
        groupLabel: 'Seleccionar idioma',
        pt: 'Portugués',
        en: 'Inglés',
        es: 'Español',
      },
    },
    content: {
      states: {
        loading: 'Cargando sitio...',
        notFound: {
          title: 'Sitio no encontrado',
          description: 'Este sitio no existe o no está disponible en este momento.',
        },
        error: {
          title: 'No se pudo cargar el sitio',
          description: 'Ocurrió un error al cargar la información. Inténtelo de nuevo.',
          retry: 'Intentar de nuevo',
        },
      },
      about: {
        sectionTitle: 'Quiénes Somos',
      },
      products: {
        sectionTitle: 'Nuestros Productos',
        viewProductButton: 'Ver Producto',
        emptyState: {
          title: 'Ningún producto registrado',
          description: 'Esta finca aún no ha registrado productos de trazabilidad.',
        },
      },
      contact: {
        sectionTitle: 'Contacto',
        cpfLabel: 'CPF',
        cnpjLabel: 'CNPJ',
        emailLabel: 'Correo electrónico',
        phoneLabel: 'Teléfono',
        coordinatesLabel: 'Coordenadas',
        cityLabel: 'Ciudad',
      },
      map: {
        unavailable: 'Ubicación no disponible.',
      },
      whatsapp: {
        buttonLabel: 'Hable con nosotros por WhatsApp',
      },
      footer: {
        rightsTemplate: '© {year} GB Cerne. Todos los derechos reservados.',
      },
    },
  },
};
