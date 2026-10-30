// src/components/GuidedTour/flows.ts
// FLUXOS do tutorial: só dados. Para criar um fluxo novo, acrescente um objeto em `TOUR_FLOWS` e,
// se precisar destacar um elemento ainda sem marca, adicione `data-tour="nome"` nele (nunca dependa
// de classe CSS). Texto dos passos fica aqui, em PT-BR, como o catálogo de planos: é conteúdo de
// produto; o "chrome" do tutorial (botões, painel) vem do i18n (`languageGB.subscription.tour`).
// Guia completo: docs/ux/funcionalidades/onboarding-tour.md
//
// Origem do conteúdo: fluxos FLX-038 (nova fazenda para contratante existente), FLX-075/077
// (centro de custo) do GB Manager, família AGF-049. O cliente que acabou de criar a conta já tem
// Contratante (criado no checkout), então o roteiro é a "Variante B": Fazenda → Perfil → Usuário.
// O tutorial só existe para quem chega pelo fluxo "Criar conta" (ver `enableForNewAccount`).

import type { TourFlow } from './types';

/** Fluxo que o cliente recebe logo depois de criar a conta. */
export const FIRST_FLOW_ID = 'first-farm';

const REGISTERS = { id: 'open-registers', element: '[data-tour="nav-cadastros"]', side: 'right', advanceOn: 'click', optional: true, title: 'Comece pelos Cadastros', description: 'Clique em <b>Cadastros</b> para abrir os cadastros-base do sistema.' } as const;

export const TOUR_FLOWS: TourFlow[] = [
  {
    id: FIRST_FLOW_ID,
    title: 'Cadastre sua primeira fazenda',
    description: 'A fazenda é a base de tudo: estoque, financeiro e operação nascem dela.',
    icon: 'sprout',
    points: 100,
    minutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Cerne!',
        description: 'Em poucos minutos você cadastra sua primeira fazenda. Pode pular quando quiser; o tutorial fica sempre no ícone de ajuda, no topo, e seu progresso fica salvo.',
      },
      REGISTERS,
      { id: 'open-farms', element: '[data-tour="nav-cad-est-faz"]', side: 'right', advanceOn: 'click', optional: true, title: 'Agora, Fazendas', description: 'Em <b>Estrutura</b>, clique em <b>Fazendas</b>.' },
      { id: 'add-farm', route: '/cadastros-base/fazendas', element: '[data-tour="btn-add"]', side: 'bottom', advanceOn: 'click', optional: true, title: 'Crie a fazenda', description: 'Clique em <b>Novo</b> para abrir o cadastro. Ela já nasce vinculada ao seu contratante, sem você escolher nada.' },
      { id: 'farm-identificacao', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="identificacao"]', advanceWhen: '[data-tour="wizard"][data-tour-step="documentacao"]', side: 'bottom', title: '1. Identificação', description: 'Informe <b>Nome</b>, <b>Nome completo</b> e <b>Telefone</b>. O contratante é preenchido sozinho. Clique em <b>Continuar</b> aqui para preencher; quando terminar, use <b>Próximo</b> na parte de baixo da tela.' },
      { id: 'farm-documentacao', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="documentacao"]', advanceWhen: '[data-tour="wizard"][data-tour-step="endereco"]', side: 'bottom', title: '2. Documentação (opcional)', description: 'Registros como CAR, NIRF e CCIR são <b>opcionais</b>. Pode seguir sem preencher.' },
      { id: 'farm-endereco', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="endereco"]', advanceWhen: '[data-tour="wizard"][data-tour-step="demarcacao"]', side: 'bottom', title: '3. Endereço', description: 'Escolha <b>País</b>, <b>CEP</b>, <b>Cidade</b> e <b>Bairro</b>.' },
      { id: 'farm-demarcacao', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="demarcacao"]', advanceWhen: '[data-tour="wizard"][data-tour-step="financeiro"]', side: 'bottom', title: '4. Demarcação: pode pular', description: 'Desenhar o contorno no mapa é <b>opcional</b>. Dá para fazer depois, editando a fazenda.' },
      { id: 'farm-financeiro', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="financeiro"]', advanceWhen: '[data-tour="wizard"][data-tour-step="configuracoes"]', side: 'bottom', title: '5. Financeiro', description: 'Informe <b>Moeda</b>, <b>Área total (ha)</b>, <b>Valor por hectare</b>, se a fazenda está <b>Ativa</b> e se <b>habilita o Caixa da fazenda</b>.' },
      { id: 'farm-configuracoes', route: '/cadastros-base/fazendas/novo', element: '[data-tour="wizard"] [data-scope="steps"][data-part="content"]', showWhen: '[data-tour="wizard"][data-tour-step="configuracoes"]', side: 'bottom', title: '6. Configurações', description: 'Defina o <b>dia de fechamento de custo</b> e se <b>controla estoque de insumos</b>. Os <b>centros de custo</b> são opcionais: vincule agora ou depois.' },
      { id: 'finish', title: 'Salve e pronto!', description: 'Ao clicar em <b>Salvar</b>, na última etapa, a fazenda aparece na lista e já pode receber estoque, lançamentos e atividades.' },
    ],
  },
  {
    id: 'first-profile',
    title: 'Crie um perfil de acesso',
    description: 'O perfil define o que cada pessoa da equipe pode ver e fazer.',
    icon: 'safety',
    points: 100,
    minutes: 2,
    steps: [
      { id: 'intro', title: 'Perfis de acesso', description: 'Antes de convidar a equipe, crie um <b>perfil</b>: um conjunto de permissões que você reaproveita em todas as suas fazendas.' },
      REGISTERS,
      { id: 'open-profiles', element: '[data-tour="nav-cad-pes-per"]', side: 'right', advanceOn: 'click', optional: true, title: 'Perfil de Usuário', description: 'Em <b>Pessoas</b>, clique em <b>Perfil de Usuário</b>.' },
      { id: 'add-profile', route: '/cadastros-base/perfil', element: '[data-tour="btn-add"]', side: 'bottom', advanceOn: 'click', optional: true, title: 'Crie o perfil', description: 'Clique em <b>Novo</b>.' },
      { id: 'profile-general', route: '/cadastros-base/perfil/novo', title: 'Dados gerais', description: 'Dê um <b>nome</b> (mínimo 2 letras) e uma <b>descrição</b>, como "Operador de estoque".' },
      { id: 'profile-permissions', route: '/cadastros-base/perfil/novo', title: 'Permissões', description: 'Na aba <b>Permissões</b>, marque só o que essa pessoa precisa. Você só vê as permissões que você mesmo tem. Depois clique em <b>Salvar</b>.' },
    ],
  },
  {
    id: 'first-user',
    title: 'Convide sua equipe',
    description: 'Cadastre um usuário com fazenda, perfil e senha inicial.',
    icon: 'users',
    points: 100,
    minutes: 3,
    steps: [
      { id: 'intro', title: 'Cadastre um usuário', description: 'Cada pessoa da equipe entra com o próprio acesso, ligado a uma <b>fazenda</b> e a um <b>perfil</b>.' },
      REGISTERS,
      { id: 'open-users', element: '[data-tour="nav-cad-pes-usr"]', side: 'right', advanceOn: 'click', optional: true, title: 'Usuários', description: 'Em <b>Pessoas</b>, clique em <b>Usuários</b>.' },
      { id: 'add-user', route: '/cadastros-base/usuarios', element: '[data-tour="btn-add"]', side: 'bottom', advanceOn: 'click', optional: true, title: 'Novo usuário', description: 'Clique em <b>Novo</b>.' },
      { id: 'user-person', route: '/cadastros-base/usuarios/novo', title: 'Pessoa', description: 'Preencha <b>CPF/CNPJ</b>, <b>nome</b>, <b>e-mail</b>, <b>telefone</b>, <b>cidade</b> e <b>endereço</b>.' },
      { id: 'user-account', route: '/cadastros-base/usuarios/novo', title: 'Conta', description: 'Defina uma <b>senha inicial</b> (mínimo 6 caracteres) e confirme. Ela só aparece na criação.' },
      { id: 'user-links', route: '/cadastros-base/usuarios/novo', title: 'Vínculos', description: 'Escolha pelo menos <b>1 perfil</b> e <b>1 fazenda</b>; sem eles não dá para salvar. O <b>superior/gestor</b> é opcional. Clique em <b>Salvar</b>.' },
    ],
  },
  {
    id: 'cost-center',
    title: 'Adicione um centro de custo',
    description: 'Opcional: separe os custos da fazenda em centros próprios.',
    icon: 'layers',
    points: 50,
    minutes: 2,
    steps: [
      { id: 'intro', title: 'Centros de custo', description: 'Você já tem um centro de custo padrão. Crie outros se quiser separar custos (por exemplo, por atividade).' },
      REGISTERS,
      { id: 'open-cc', element: '[data-tour="nav-cad-est-cc"]', side: 'right', advanceOn: 'click', optional: true, title: 'Centros de Custo', description: 'Em <b>Estrutura</b>, clique em <b>Centros de Custo</b>.' },
      { id: 'cc-descendant', route: '/cadastros-base/centros-custo', title: 'Cadastrar descendente', description: 'Na linha de um centro <b>Sintético</b>, abra o menu de ações e escolha <b>Cadastrar descendente</b>. Preencha condição, descrição, ativo e tipo <b>Produtivo</b>; o código é gerado sozinho.' },
    ],
  },
];

/** Pontos mínimos de cada nível (o nome vem do i18n, na mesma ordem). */
export const LEVEL_THRESHOLDS = [0, 100, 250, 400];
