// src/constants/languages/languagePtBr/languageConfiguracoes.ts
// Tradução PT-BR do módulo CONFIGURAÇÕES — entidade "Tutoriais" (Help,
// TASK-HP-06). Primeiro módulo desta árvore de tradução.

import { ModuleConfiguracoes } from '@/@types/language/module-configuracoes';

export const languageConfiguracoes: ModuleConfiguracoes = {
  help: {
    singularLabel: 'Tutorial',
    pluralLabel: 'Tutoriais',
    list: {
      pageTitle: 'Tutoriais',
      pageSubtitle: 'Administre os links de ajuda contextual vinculados às telas do sistema.',
      deletedToast: 'Tutorial removido com sucesso',
      table: {
        url: 'URL',
        screen: 'Tela',
        createdAt: 'Criado em',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        title: 'Nenhum tutorial cadastrado.',
        description: 'Comece adicionando o primeiro tutorial.',
        titleFiltered: 'Nenhum tutorial encontrado.',
        descriptionFiltered: 'Tente ajustar o filtro ou limpar a busca.',
        cta: 'Adicionar Tutorial',
      },
    },
    filter: {
      title: 'Filtrar tutoriais',
      screen: 'Tela',
      screenPlaceholder: 'Buscar por tela',
    },
    form: {
      title: {
        create: 'Novo Tutorial',
        edit: 'Editar Tutorial',
      },
      subtitle: {
        create: 'Cadastre um novo link de ajuda vinculado a uma tela do sistema.',
        edit: 'Atualize o link de ajuda deste tutorial.',
      },
      fields: {
        url: 'URL',
        screen: 'Tela',
      },
      placeholders: {
        url: 'https://...',
        screen: 'Buscar por tela',
      },
    },
    deleteDialog: {
      title: 'Excluir tutorial',
    },
  },
  // Aplicativos (App — versões de release de app móvel, TASK-APP-FE-01,
  // 2026-08-06). Bloco NOVO, ao lado de `help` (não o substitui).
  app: {
    singularLabel: 'Aplicativo',
    pluralLabel: 'Aplicativos',
    list: {
      pageTitle: 'Aplicativos',
      pageSubtitle: 'Administre as versões de release do aplicativo móvel.',
      deletedToast: 'Aplicativo removido com sucesso',
      table: {
        platform: 'Plataforma',
        version: 'Versão',
        releaseDate: 'Data de Lançamento',
        deadline: 'Data Limite',
        createdAt: 'Criado em',
      },
      actions: {
        edit: 'Editar',
        delete: 'Excluir',
      },
      emptyState: {
        title: 'Nenhum aplicativo cadastrado.',
        description: 'Comece adicionando o primeiro aplicativo.',
        titleFiltered: 'Nenhum aplicativo encontrado.',
        descriptionFiltered: 'Tente ajustar o filtro ou limpar a busca.',
        cta: 'Adicionar Aplicativo',
      },
    },
    filter: {
      title: 'Filtrar aplicativos',
      platform: 'Plataforma',
      platformPlaceholder: 'Buscar por plataforma',
      version: 'Versão',
      versionPlaceholder: 'Buscar por versão',
    },
    form: {
      title: {
        create: 'Novo Aplicativo',
        edit: 'Editar Aplicativo',
      },
      subtitle: {
        create: 'Cadastre uma nova versão de release do aplicativo móvel.',
        edit: 'Atualize esta versão de release do aplicativo móvel.',
      },
      fields: {
        platform: 'Plataforma',
        version: 'Versão',
        description: 'Descrição',
        releaseDate: 'Data de Lançamento',
        deadline: 'Data Limite',
      },
      placeholders: {
        platform: 'Ex.: android',
        version: 'Ex.: 5.4.11',
        description: 'Descrição desta versão de release',
      },
    },
    deleteDialog: {
      title: 'Excluir aplicativo',
    },
  },
  // Configuração (settings singleton de plataforma, execução 032,
  // TASK-FE-2600). Bloco NOVO, ao lado de `help`/`app` (não os substitui).
  config: {
    singularLabel: 'Configuração',
    pluralLabel: 'Configuração',
    pageTitle: 'Configuração',
    pageSubtitle: 'Parâmetros globais da plataforma.',
    sections: {
      operational: 'Prazos e Parâmetros Operacionais',
      mercadoPago: 'Mercado Pago',
      signup: 'Auto-cadastro',
      support: 'Suporte e Responsável Técnico',
      videoIntro: 'Vídeo Institucional',
    },
    fields: {
      diasTeste: 'Dias para teste',
      diasAlertaPagamento: 'Dias alerta pag.',
      diasAssinarContrato: 'Dias assinar contrato',
      contratoCertificado: 'Assinar contrato com certificado',
      minutosOnline: 'Minutos da empresa online',
      diasAlertaVencimentoCertificado: 'Dias alerta venc. certificado',
      mercadopagoPublicKey: 'Mercado Pago Public Key',
      mercadopagoAccessToken: 'Mercado Pago Access Token',
      afiliadoPadrao: 'Afiliado padrão',
      planoPadrao: 'Plano padrão',
      whatsappLinkSuporte: 'WhatsApp Link Suporte',
      respCnpj: 'CNPJ do responsável técnico',
      respNome: 'Nome do responsável técnico',
      respEmail: 'Email do responsável técnico',
      respFone: 'Telefone do responsável técnico',
    },
    secretPlaceholder: {
      configured: '•••••••• (já configurado)',
      empty: '',
    },
    videoIntro: {
      uploadCta: 'Enviar vídeo institucional',
      replaceCta: 'Substituir vídeo',
      successToast: 'Vídeo institucional atualizado com sucesso.',
    },
    booleanOptions: {
      yes: 'Sim',
      no: 'Não',
    },
    saveSuccessToast: 'Configuração atualizada com sucesso.',
    readOnlyNotice: 'Você não tem permissão para editar esta configuração.',
  },
};
