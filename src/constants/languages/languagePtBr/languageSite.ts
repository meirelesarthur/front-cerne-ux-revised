// src/constants/languages/languagePtBr/languageSite.ts
// Tradução PT-BR do módulo "Site" (configuração única do site/fazenda —
// Site.edit/Site.update, 97-Esteiras/061, TASK-SITE-04). Namespace `site` —
// LIVRE, módulo TOP-LEVEL, NÃO aninhado em `configuracoes` (G-FE-02).

import { ModuleSite } from '@/@types/language/module-site';

export const languageSite: ModuleSite['site'] = {
  singularLabel: 'Site',
  pluralLabel: 'Site',
  pageTitle: 'Site',
  pageSubtitle: 'Configure as informações públicas do site da fazenda.',
  fields: {
    banner: 'Banner',
    published: 'Publicar?',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    youtube: 'Youtube',
    whatsapp: 'Whatsapp',
    about: 'Sobre a Fazenda',
  },
  placeholders: {
    instagram: 'https://instagram.com/...',
    facebook: 'https://facebook.com/...',
    twitter: 'https://twitter.com/...',
    youtube: 'https://youtube.com/...',
    whatsapp: '(00) 00000-0000',
    about: 'Descreva a fazenda...',
  },
  image: {
    hint: 'Formatos aceitos: JPEG, PNG, JPG, GIF, SVG. Tamanho máximo: 2MB.',
    dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
    dropzoneDragging: 'Solte a imagem aqui',
    changeLabel: 'Trocar Imagem',
    errorType: 'Formato de arquivo não suportado.',
    errorSize: 'O arquivo excede o tamanho máximo permitido.',
  },
  viewSiteLink: 'Ver Site',
  saveSuccessToast: 'Site atualizado com sucesso.',
  readOnlyNotice: 'Você não tem permissão para editar o site.',
  noFarmSelected: {
    title: 'Nenhuma fazenda selecionada',
    description: 'Selecione uma fazenda ativa para configurar o site.',
  },
  publico: {
    menu: {
      sobre: 'Sobre',
      softwares: 'Softwares',
      tutoriais: 'Tutoriais',
      sejaParceiro: 'Seja Parceiro',
      contato: 'Contato',
      languageSwitcher: {
        groupLabel: 'Selecionar idioma',
        pt: 'Português',
        en: 'Inglês',
        es: 'Espanhol',
      },
    },
    content: {
      states: {
        loading: 'Carregando site...',
        notFound: {
          title: 'Site não encontrado',
          description: 'Este site não existe ou não está disponível no momento.',
        },
        error: {
          title: 'Não foi possível carregar o site',
          description: 'Ocorreu um erro ao carregar as informações. Tente novamente.',
          retry: 'Tentar novamente',
        },
      },
      about: {
        sectionTitle: 'Quem Somos',
      },
      products: {
        sectionTitle: 'Nossos Produtos',
        viewProductButton: 'Ver Produto',
        emptyState: {
          title: 'Nenhum produto cadastrado',
          description: 'Esta fazenda ainda não cadastrou produtos de rastreabilidade.',
        },
      },
      contact: {
        sectionTitle: 'Contato',
        cpfLabel: 'CPF',
        cnpjLabel: 'CNPJ',
        emailLabel: 'E-mail',
        phoneLabel: 'Telefone',
        coordinatesLabel: 'Coordenadas',
        cityLabel: 'Cidade',
      },
      map: {
        unavailable: 'Localização indisponível.',
      },
      whatsapp: {
        buttonLabel: 'Fale conosco pelo WhatsApp',
      },
      footer: {
        rightsTemplate: '© {year} GB Cerne. Todos os direitos reservados.',
      },
    },
  },
};
