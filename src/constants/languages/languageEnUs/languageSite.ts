// src/constants/languages/languageEnUs/languageSite.ts
// English translation of the "Site" module (single farm/site configuration —
// Site.edit/Site.update, 97-Esteiras/061, TASK-SITE-04). Namespace `site` —
// FREE, TOP-LEVEL module, NOT nested under `configuracoes` (G-FE-02).

import { ModuleSite } from '@/@types/language/module-site';

export const languageSite: ModuleSite['site'] = {
  singularLabel: 'Site',
  pluralLabel: 'Site',
  pageTitle: 'Site',
  pageSubtitle: "Configure the farm's public site information.",
  fields: {
    banner: 'Banner',
    published: 'Publish?',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'Youtube',
    whatsapp: 'Whatsapp',
    about: 'About the Farm',
  },
  placeholders: {
    instagram: 'https://instagram.com/...',
    facebook: 'https://facebook.com/...',
    twitter: 'https://twitter.com/...',
    youtube: 'https://youtube.com/...',
    whatsapp: '(00) 00000-0000',
    about: 'Describe the farm...',
  },
  image: {
    hint: 'Accepted formats: JPEG, PNG, JPG, GIF, SVG. Maximum size: 2MB.',
    dropzoneTitle: 'Drag an image or click to select',
    dropzoneDragging: 'Drop the image here',
    changeLabel: 'Change Image',
    errorType: 'Unsupported file format.',
    errorSize: 'The file exceeds the maximum allowed size.',
  },
  viewSiteLink: 'View Site',
  saveSuccessToast: 'Site updated successfully.',
  readOnlyNotice: 'You do not have permission to edit the site.',
  noFarmSelected: {
    title: 'No farm selected',
    description: 'Select an active farm to configure the site.',
  },
  publico: {
    menu: {
      sobre: 'About',
      softwares: 'Software',
      tutoriais: 'Tutorials',
      sejaParceiro: 'Become a Partner',
      contato: 'Contact',
      languageSwitcher: {
        groupLabel: 'Select language',
        pt: 'Portuguese',
        en: 'English',
        es: 'Spanish',
      },
    },
    content: {
      states: {
        loading: 'Loading site...',
        notFound: {
          title: 'Site not found',
          description: 'This site does not exist or is not currently available.',
        },
        error: {
          title: 'Unable to load the site',
          description: 'An error occurred while loading the information. Please try again.',
          retry: 'Try again',
        },
      },
      about: {
        sectionTitle: 'About Us',
      },
      products: {
        sectionTitle: 'Our Products',
        viewProductButton: 'View Product',
        emptyState: {
          title: 'No products registered',
          description: 'This farm has not registered any traceability products yet.',
        },
      },
      contact: {
        sectionTitle: 'Contact',
        cpfLabel: 'CPF',
        cnpjLabel: 'CNPJ',
        emailLabel: 'Email',
        phoneLabel: 'Phone',
        coordinatesLabel: 'Coordinates',
        cityLabel: 'City',
      },
      map: {
        unavailable: 'Location unavailable.',
      },
      whatsapp: {
        buttonLabel: 'Contact us on WhatsApp',
      },
      footer: {
        rightsTemplate: '© {year} GB Cerne. All rights reserved.',
      },
    },
  },
};
