// src/config/v2/navigationTree.ts
// Árvore de navegação COMPLETA do GB Cerne, portada 1:1 de
// `MCPs/cerne/src/data/menuData.ts` (fonte de verdade do design system).
//
// Por que um arquivo novo em vez de estender `mainMenu.ts`:
// `mainMenu.ts` modelava só uma lista FLAT de 10 módulos (`MainMenuItem`), sem
// suporte a grupos/sub-itens. A árvore real do cerne tem 3 níveis (módulo →
// grupo (opcional) → item) e alguns módulos usam `flatItems` em vez de
// `groups`. Reaproveitar a interface antiga exigiria overloads confusos; um
// arquivo dedicado com o shape `NavModule/NavGroup/NavSubItem` (idêntico ao
// cerne) mantém o porte fiel e fácil de auditar linha a linha contra a fonte.
//
// Ícones: papéis do registry do DS (`@/design/icons`, família HugeIcons) — a árvore não
// importa biblioteca de ícone; quem renderiza usa `<Icon name={item.icon}>`.
//
// `mainMenu.ts` continua existindo (outros pontos do código podem referenciar
// `MainMenuItem`), mas o Sidebar/SecondaryNav/Header/Router passam a consumir
// exclusivamente esta árvore.

import type { IconName } from '@/components/ui/Icon';

export interface NavSubItem {
  id: string;
  label: string;
  path: string;
  /**
   * Ícone do item-folha (3º nível) e de filhos de 3º nível. OPCIONAL e
   * ADITIVO — item sem `icon` continua renderizando igual a antes (mudança
   * puramente visual, sem alterar a árvore de navegação nem seu consumo).
   */
  icon?: IconName;
  children?: Omit<NavSubItem, 'children'>[];
}

export interface NavGroup {
  id: string;
  label: string;
  icon: IconName;
  items: NavSubItem[];
}

export interface NavModule {
  id: string;
  label: string;
  emoji: string;
  icon: IconName;
  path?: string;
  groups?: NavGroup[];
  flatItems?: NavSubItem[];
}

export const menuModules: NavModule[] = [
  { id: 'painel', label: 'Home', emoji: '🏠', icon: 'dashboard', path: '/home' },
  {
    id: 'favoritos',
    label: 'Favoritos',
    emoji: '⭐',
    icon: 'star',
    flatItems: [
      { id: 'fav-dfe', label: 'DFe Recebidas', path: '/favoritos/dfe', icon: 'inbox' },
      { id: 'fav-pagar', label: 'C. a Pagar', path: '/favoritos/pagar', icon: 'trend-up' },
      {
        id: 'fav-receber',
        label: 'C. a Receber',
        path: '/favoritos/receber',
        icon: 'trend-down',
      },
      { id: 'fav-caixa', label: 'Mov. Caixa/Bancário', path: '/favoritos/caixa', icon: 'wallet' },
      { id: 'fav-ofx', label: 'Importação OFX', path: '/favoritos/ofx', icon: 'document-import' },
    ],
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    emoji: '📈',
    icon: 'trend-up',
    flatItems: [
      {
        id: 'dash-overview',
        label: 'Visão Geral',
        path: '/dashboards/visao-geral',
        icon: 'dashboard',
      },
      { id: 'dash-fin', label: 'Financeiros', path: '/dashboards/financeiro', icon: 'wallet' },
      { id: 'dash-sup', label: 'Suprimentos', path: '/dashboards/suprimentos', icon: 'cart' },
      { id: 'dash-pec', label: 'Pecuária de Corte', path: '/dashboards/pecuaria', icon: 'cattle' },
      {
        id: 'dash-dep',
        label: 'Depreciações',
        path: '/dashboards/depreciacoes',
        icon: 'trend-down',
      },
      { id: 'dash-ati', label: 'Ativos', path: '/dashboards/ativos', icon: 'package' },
      { id: 'dash-usr', label: 'Análise de Usuários', path: '/dashboards/usuarios', icon: 'users' },
      { id: 'dash-plu', label: 'Pluviometria', path: '/dashboards/pluviometria', icon: 'rain' },
      { id: 'dash-lcx', label: 'Livro Caixa', path: '/dashboards/livro-caixa', icon: 'book' },
      {
        id: 'dash-cur',
        label: 'Lotação de Currais',
        path: '/dashboards/lotacao-currais',
        icon: 'warehouse',
      },
      {
        id: 'dash-des',
        label: 'Desempenho de Lotes',
        path: '/dashboards/desempenho-lotes',
        icon: 'activity',
      },
      {
        id: 'dash-nut',
        label: 'Estoque Nutrição',
        path: '/dashboards/estoque-nutricao',
        icon: 'package-alt',
      },
      { id: 'dash-rac', label: 'Consumo de Ração', path: '/dashboards/consumo-racao', icon: 'grain' },
      {
        id: 'dash-cco',
        label: 'Custos do Confinamento',
        path: '/dashboards/custos-confinamento',
        icon: 'receipt',
      },
      // Programa ABC Corte (execução 046, TASK-DASH-FE-05 — fundação).
      // UX-GAP-046-01: não existe página equivalente em
      // `ux_root/src/pages/dashboards/` — decisão do dono (`DEC-183`):
      // seguir-pelo-padrão (composta pelo kit `DashboardGrid` + padrões
      // MCP, sem layout inventado). Rota registrada aqui só como destino de
      // menu; o componente da tela é da lane `TASK-ABC-FE-*` (CHK-1).
      // Ícone `BarChart3` (já importado acima) — reaproveitado, sem
      // import novo.
      {
        id: 'dash-abc',
        label: 'Programa ABC Corte',
        path: '/dashboards/abc-indicators',
        icon: 'chart-bar',
      },
    ],
  },
  {
    id: 'cadastros',
    label: 'Cadastros Base',
    emoji: '🗂️',
    icon: 'layers',
    groups: [
      {
        id: 'cad-estrutura',
        label: 'Estrutura',
        icon: 'layers',
        items: [
          {
            id: 'cad-est-cc',
            label: 'Centros de Custo',
            path: '/cadastros-base/centros-custo',
            icon: 'layers',
          },
          {
            id: 'cad-est-faz',
            label: 'Fazendas',
            path: '/cadastros-base/fazendas',
            icon: 'building',
          },
          { id: 'cad-est-saf', label: 'Safras', path: '/cadastros-base/safras', icon: 'calendar' },
          // "Produtos" deixou de ser submenu recolhível (pedido do dono): Produtos, Embalagens,
          // Endereçamentos, Armazéns, Saldo Inicial e a taxonomia (Grupos/Categorias/Classes/Un. de
          // Medida) são itens diretos de "Estrutura". Rotas e permissões inalteradas.
          {
            id: 'cad-est-pro-lista',
            label: 'Produtos',
            path: '/cadastros-base/produtos',
            icon: 'package-alt',
          },
          {
            id: 'cad-est-emb',
            label: 'Embalagens',
            path: '/cadastros-base/embalagens',
            icon: 'package',
          },
          {
            id: 'cad-est-end',
            label: 'Endereçamentos',
            path: '/cadastros-base/enderecos',
            icon: 'location',
          },
          {
            id: 'cad-est-arm',
            label: 'Armazéns',
            path: '/cadastros-base/armazens',
            icon: 'warehouse',
          },
          {
            id: 'cad-est-sal-ini',
            label: 'Saldo Inicial',
            path: '/cadastros-base/estoques-iniciais',
            icon: 'wallet',
          },
          {
            id: 'cad-est-pro-gru',
            label: 'Grupos',
            path: '/cadastros-base/produtos/grupos',
            icon: 'stock',
          },
          {
            id: 'cad-est-pro-cat',
            label: 'Categorias',
            path: '/cadastros-base/produtos/categorias',
            icon: 'tag',
          },
          {
            id: 'cad-est-pro-cla',
            label: 'Classes',
            path: '/cadastros-base/produtos/classes',
            icon: 'layers',
          },
          {
            id: 'cad-est-med',
            label: 'Un. de Medida',
            path: '/cadastros-base/unidade-medida',
            icon: 'ruler',
          },
          // TASK-AP-FE-09: item novo "Rateios / Categorias" (Apportionment) —
          // posicionamento confirmado por 2 fontes independentes convergentes
          // (PermissionTree.php real do backend + GB.Cerne.UX/menuData.ts:183,
          // ambas último item do grupo "Estrutura"). Ícone reaproveitado
          // (Percent, já importado — sem import novo).
          {
            id: 'cad-est-rat',
            label: 'Rateios / Categorias',
            path: '/cadastros-base/rateios-categorias',
            icon: 'percent',
          },
        ],
      },
      {
        id: 'cad-pessoas',
        label: 'Pessoas',
        icon: 'users',
        items: [
          {
            id: 'cad-pes-per',
            label: 'Perfil de Usuário',
            path: '/cadastros-base/perfil',
            icon: 'user-settings',
          },
          { id: 'cad-pes-uni', label: 'Pessoas', path: '/cadastros-base/pessoas', icon: 'users' },
          // TASK-PY-FE-02: item NOVO "Proprietários", separado de "Pessoas"
          // (mesmo racional de coexistência de `Provider`). Posição espelha
          // o legado (app/Support/PermissionTree.php:424-459, "Proprietários"
          // vem ANTES de "Funcionários"/"Fornecedores") — por isso fica ANTES
          // de `cad-for-lis` abaixo.
          {
            id: 'cad-pes-prp',
            label: 'Proprietários',
            path: '/cadastros-base/proprietarios',
            icon: 'contact',
          },
          // TASK-EMP-FE-02: item NOVO "Funcionários" — fecha literalmente o
          // comentário antigo deste bloco ("Funcionários ainda não tem
          // página própria nesta SPA"). Posição espelha o legado
          // (app/Support/PermissionTree.php:424-459: Proprietários →
          // Funcionários → Fornecedores → Clientes), decisão TÉCNICA
          // registrada em Employee-FrontEnd-contrato.md `## 5`. Ícone
          // `IdCard` — `Briefcase` já está em uso por "Funções"/"Serviços"
          // (grupos diferentes, mas conceito próximo, evita duplicar).
          {
            id: 'cad-pes-fun',
            label: 'Funcionários',
            path: '/cadastros-base/funcionarios',
            icon: 'safety',
          },
          // TASK-PR-FE-02: item NOVO, separado de "Pessoas" (decisão do
          // dono: COEXISTIR — Provider-FrontEnd-contrato.md `## 11` item 1).
          // Posição espelha o legado (agro365/resources/views/layouts/
          // navbars/sidebar.blade.php:172-178, `providers_view` logo após
          // `employees_view` — item de menu próprio agora existe, ver
          // `cad-pes-fun` acima, TASK-EMP-FE-02).
          {
            id: 'cad-for-lis',
            label: 'Fornecedores',
            path: '/cadastros-base/fornecedores',
            icon: 'truck',
          },
          // TASK-CL-FE-02: item NOVO "Clientes" — SCAFFOLD ADIANTADO POR
          // ESPELHAMENTO (ver nota de topo de Clientes/index.tsx), escrito
          // ANTES de `Client-contrato.md`/backend existirem. Posição espelha
          // o legado (app/Support/PermissionTree.php:399-469, "Clientes"
          // logo após "Fornecedores" — "Funcionários" ainda não tem página
          // própria nesta SPA).
          {
            id: 'cad-pes-cli',
            label: 'Clientes',
            path: '/cadastros-base/clientes',
            icon: 'handshake',
          },
          {
            id: 'cad-pes-usr',
            label: 'Usuários',
            path: '/cadastros-base/usuarios',
            icon: 'user-check',
          },
          {
            id: 'cad-pes-aut',
            label: 'Autorizadores',
            path: '/cadastros-base/autorizadores',
            icon: 'shield-check',
          },
          {
            id: 'cad-pes-afi',
            label: 'Afiliados',
            path: '/cadastros-base/pessoas/afiliados',
            icon: 'users',
          },
          // Contratantes (Tenant, TASK-TN-FE-02) MOVIDO de `cad-gerais`
          // (homologação do dono, 2026-08-13): entidade irmã de Afiliados na
          // hierarquia Partner→Tenant, por isso posicionado ao lado dela.
          // `id` renomeado de `cad-ger-contr` para `cad-pes-contr` (convenção
          // de prefixo deste grupo) — ver espelho em navigationPermissions.ts.
          // Permissão (`tenants_view`) e `path`
          // (`/cadastros-base/contratantes`) inalterados.
          {
            id: 'cad-pes-contr',
            label: 'Contratantes',
            path: '/cadastros-base/contratantes',
            icon: 'building',
          },
        ],
      },
      {
        id: 'cad-financeiros',
        label: 'Financeiros',
        icon: 'credit-card',
        items: [
          {
            id: 'cad-fin-bco',
            label: 'Contas Bancárias',
            path: '/cadastros-base/contas-bancarias',
            icon: 'bank',
          },
          {
            id: 'cad-fin-sal',
            label: 'Saldo Inicial',
            path: '/cadastros-base/saldo-inicial',
            icon: 'wallet',
          },
          {
            id: 'cad-fin-cnd',
            label: 'Condições de Pagamento',
            path: '/cadastros-base/condicoes-pagamento',
            icon: 'credit-card',
          },
          // TASK-FE-032: posição confirmada no legado (agro365/resources/views/layouts/navbars/sidebar.blade.php)
          // — "Agrupadores" (`groupers_view`) vem logo após "Condições de Pagamento" e ANTES de
          // "Agrup. Contábeis" (`AccountingGrouper`, módulo IRMÃO — TASK-ACG-01 fecha essa lacuna,
          // antes fora de escopo) e "Categorias Financeiras".
          {
            id: 'cad-fin-agr',
            label: 'Agrupadores',
            path: '/cadastros-base/agrupadores',
            icon: 'list-tree',
          },
          {
            id: 'cad-fin-acg',
            label: 'Agrupadores Contábeis',
            path: '/cadastros-base/agrupadores-contabeis',
            icon: 'list-tree',
          },
          {
            id: 'cad-fin-cat',
            label: 'Categorias Financeiras',
            path: '/cadastros-base/categorias',
            icon: 'tag',
          },
          // TASK-CTY-01: posição exata confirmada no backend
          // (PermissionTree.php:585-612) — "Tipos de Categoria" vem
          // imediatamente depois de "Categorias Financeiras" e antes de
          // "Tipos de Título".
          {
            id: 'cad-fin-cty',
            label: 'Tipos de Categoria',
            path: '/cadastros-base/tipos-de-categoria',
            icon: 'tag',
          },
          {
            id: 'cad-fin-tt',
            label: 'Tipos de Título',
            path: '/cadastros-base/tipos-titulo',
            icon: 'document-type',
          },
          // TASK-BANK-FE-01: posição confirmada no legado (agro365/resources/views/layouts/navbars/
          // sidebar.blade.php:388-401) — ordem real `typetitles_view` → `banks_view` → `lowreasons_view`.
          // "Bancos" (`Bank`, catálogo de instituições financeiras) é feature DISTINTA de "Contas
          // Bancárias" (`BankAccount`/`cad-fin-bco`, acima), não confundir (DEC-020).
          { id: 'cad-fin-bnk', label: 'Bancos', path: '/cadastros-base/bancos', icon: 'bank' },
          {
            id: 'cad-fin-mba',
            label: 'Motivos de Baixa',
            path: '/cadastros-base/motivos-de-baixa',
            icon: 'error',
          },
          // TASK-FE-213: posição confirmada no backend (PermissionTree.php:649-659, D7 do
          // Indexer-contrato §5) — 11ª/última posição do grupo "Financeiros", imediatamente após
          // "Motivos de Baixa".
          {
            id: 'cad-fin-idx',
            label: 'Indexadores',
            path: '/cadastros-base/indexadores',
            icon: 'percent',
          }, // NOVO
        ],
      },
      {
        id: 'cad-fiscais',
        label: 'Fiscais',
        icon: 'scale',
        items: [
          {
            id: 'cad-fis-emi',
            label: 'Emissores NFe',
            path: '/cadastros-base/emissores',
            icon: 'document',
          },
          {
            id: 'cad-fis-sin',
            label: 'Sincronização DFe',
            path: '/cadastros-base/sincronizacao-dfe',
            icon: 'refresh',
          },
          {
            id: 'cad-fis-nfse',
            label: 'NFSe Recebidas',
            path: '/cadastros-base/nfse-recebidas',
            icon: 'refresh',
          },
          {
            id: 'cad-fis-reg',
            label: 'Regras Fiscais',
            path: '/cadastros-base/regras-fiscais',
            icon: 'scale',
          },
          {
            id: 'cad-fis-cnt',
            label: 'Contador',
            path: '/cadastros-base/contador',
            icon: 'calculator',
          },
          {
            id: 'cad-fis-nat',
            label: 'Natureza de Operação',
            path: '/cadastros-base/natureza-operacao',
            icon: 'git-branch',
          },
          {
            id: 'cad-fis-inf',
            label: 'Informações Complementares',
            path: '/cadastros-base/info-complementares',
            icon: 'info',
          },
          // CORREÇÃO (2026-07-20): "Plano de Contas" pertence a este grupo,
          // não a "Financeiros". Lastro no legado agro365
          // (resources/views/layouts/navbars/sidebar.blade.php:488) — o item
          // @can('plan-accounts_view') vive DENTRO do collapse cujo cabeçalho
          // é @lang('trad.fiscais') = "Fiscais". A TASK-PA-03a havia colocado
          // em "Financeiros" por afinidade temática; decisão do dev
          // will.lwcyano (2026-07-20) reverteu para fidelidade ao legado.
          {
            id: 'cad-fis-pla',
            label: 'Plano de Contas',
            path: '/cadastros-base/plano-de-contas',
            icon: 'list-tree',
          },
        ],
      },
      {
        id: 'cad-agricolas',
        label: 'Agrícolas',
        icon: 'grain',
        items: [
          {
            id: 'cad-agr-ope',
            label: 'Operações',
            path: '/cadastros-base/operacoes',
            icon: 'settings-sliders',
          },
          {
            id: 'cad-agr-ati',
            label: 'Atividades',
            path: '/cadastros-base/atividades',
            icon: 'clipboard-list',
          },
          {
            id: 'cad-agr-cul',
            label: 'Cultura / Variedade',
            path: '/cadastros-base/cultura',
            icon: 'sprout',
          },
          {
            id: 'cad-agr-cic',
            label: 'Ciclo de Produção',
            path: '/cadastros-base/ciclo-producao',
            icon: 'rotate',
          },
        ],
      },
      {
        id: 'cad-pecuarios',
        label: 'Pecuários',
        icon: 'cattle',
        items: [
          {
            id: 'cad-pec-esp',
            label: 'Espécies',
            path: '/cadastros-base/especies',
            icon: 'cattle',
          },
          { id: 'cad-pec-rac', label: 'Raças', path: '/cadastros-base/racas', icon: 'lab' },
          { id: 'cad-pec-vac', label: 'Vacinas', path: '/cadastros-base/vacinas', icon: 'safety' },
          // "Categorias" (animais) — presente só no nosso lado (feat(025),
          // commit 9f99743, ainda não mesclado em `develop` no momento deste
          // merge). Ícone Tag por consistência com os demais itens
          // "Categorias*" da árvore (cad-est-pro-cat, cad-fin-cat).
          {
            id: 'cad-pec-cat',
            label: 'Categorias',
            path: '/cadastros-base/categorias-animais',
            icon: 'tag',
          },
          {
            id: 'cad-pec-cmp',
            label: 'Causa Morte/Perda',
            path: '/cadastros-base/causa-morte-perda',
            icon: 'warning',
          },
          {
            id: 'cad-pec-est',
            label: 'Estágio Reprodutivo',
            path: '/cadastros-base/estagio-reprodutivo',
            icon: 'heart',
          },
          {
            id: 'cad-pec-dtc',
            label: 'Técnicas de Diagnóstico',
            path: '/cadastros-base/tecnicas-diagnostico',
            icon: 'safety',
          },
          {
            id: 'cad-pec-tid',
            label: 'Tipos de Identificação',
            path: '/cadastros-base/tipos-identificacao',
            icon: 'tag',
          },
          {
            id: 'cad-pec-obn',
            label: 'Observação Nascimento',
            path: '/cadastros-base/observacao-nascimento',
            icon: 'cattle',
          }, // NOVO — vizinho de Tipos de Identificação (BirthNote-contrato.md §16)
          {
            id: 'cad-pec-par',
            label: 'Parâmetros / Peso',
            path: '/cadastros-base/parametros-peso',
            icon: 'scale',
          },
          {
            id: 'cad-pec-pan',
            label: 'Parâmetros Animais',
            path: '/parameter-animals',
            icon: 'scale',
          },
          { id: 'cad-pec-for', label: 'Forragem', path: '/cadastros-base/forragem', icon: 'grain' },
          { id: 'cad-pec-reb', label: 'Rebanho', path: '/cadastros-base/rebanho', icon: 'cattle' },
          {
            id: 'cad-pec-mod',
            label: 'Módulo Pastejo',
            path: '/cadastros-base/modulo-pastejo',
            icon: 'map',
          },
          { id: 'cad-pec-coc', label: 'Cochos', path: '/cadastros-base/cochos', icon: 'package-alt' },
          // NOVO (execução 029, TASK-FE-2304 — chokepoint de FUNDAÇÃO):
          // "Bebedouros" — posicionado imediatamente após "Cochos", mesma
          // vizinhança do legado (Cochos/Bebedouros sempre lado a lado no
          // menu do Agro365, `contrato-fe-convencoes-chokepoints.md §7`).
          {
            id: 'cad-pec-beb',
            label: 'Bebedouros',
            path: '/cadastros-base/bebedouros',
            icon: 'water',
          },
          { id: 'cad-pec-lot', label: 'Lotes Animais', path: '/batches', icon: 'layers' },
          {
            id: 'cad-pec-lmo',
            label: 'Lote / Módulo',
            path: '/cadastros-base/lote-modulo',
            icon: 'stock',
          },
          {
            id: 'cad-pec-lar',
            label: 'Lote / Área',
            path: '/cadastros-base/lote-area',
            icon: 'location',
          },
          // NOVO (cf1803e, módulo BaseRegistrations): "Diagnóstico Gestação"
          // — ícone Stethoscope por afinidade semântica com o grupo de
          // diagnóstico já existente (cad-pec-dtc, "Técnicas de Diagnóstico").
          {
            id: 'cad-pec-dia',
            label: 'Diagnóstico Gestação',
            path: '/cadastros-base/diagnostico-gestacao',
            icon: 'safety',
          },
          // NOVO (TASK-BS-FE-03, módulo BaseRegistrations): "Escore Corporal"
          // — ícone Gauge (medição/escala), coerente com o ícone do legado
          // (icons/pecuaria/escores.svg); vizinho de Diagnóstico Gestação
          // (mesma frente BaseRegistrations).
          {
            id: 'cad-pec-esc',
            label: 'Escore Corporal',
            path: '/cadastros-base/escore-corporal',
            icon: 'gauge',
          },
        ],
      },
      {
        id: 'cad-bens',
        label: 'Bens / Ativos',
        icon: 'package',
        items: [
          {
            id: 'cad-ben-fam',
            label: 'Família de Bens',
            path: '/cadastros-base/familia-de-bens',
            icon: 'stock',
          },
          {
            id: 'cad-ben-inv',
            label: 'Inventário',
            path: '/cadastros-base/inventario',
            icon: 'clipboard-list',
          },
          {
            id: 'cad-ben-dep',
            label: 'Depreciação Mensal',
            path: '/cadastros-base/depreciacao-mensal',
            icon: 'trend-down',
          },
          // NOVO (execução 055, DECISÃO DO DONO "navegação fiel ao
          // legado"): item PRÓPRIO, adjacente a "Depreciação Mensal" —
          // rota STANDALONE `/cadastros-base/depreciacao-animal` (mesmo
          // componente, mode="animal", ver router/index.tsx). Ícone Beef
          // (já importado, mesmo usado em "Rebanho"/dashboards de
          // Pecuária) para distinguir do TrendingDown de Equipamento.
          {
            id: 'cad-ben-dep-ani',
            label: 'Depreciação Animal',
            path: '/cadastros-base/depreciacao-animal',
            icon: 'cattle',
          },
          {
            id: 'cad-ben-pre',
            label: 'Previsão de Depreciação',
            path: '/cadastros-base/previsao-depreciacao',
            icon: 'chart-line',
          },
        ],
      },
      {
        id: 'cad-gerais',
        label: 'Gerais',
        icon: 'filter-advanced',
        items: [
          { id: 'cad-ger-cid', label: 'Cidades', path: '/cadastros-base/cidades', icon: 'location' },
          { id: 'cad-ger-est', label: 'Estados', path: '/cadastros-base/estados', icon: 'undo' },
          {
            id: 'cad-ger-svc',
            label: 'Serviços',
            path: '/cadastros-base/servicos',
            icon: 'briefcase',
          }, // NOVO (ServiceExpense-contrato.md §15)
          { id: 'cad-ger-rev', label: 'Estorno', path: '/cadastros-base/estorno', icon: 'transfer' },
          {
            id: 'cad-ger-par',
            label: 'Parametrizações do sistema',
            path: '/cadastros-base/parametrizacoes',
            icon: 'settings',
          },
          // Contratantes (Tenant, TASK-TN-FE-02) MOVIDO para `cad-pessoas`
          // (homologação do dono, 2026-08-13): a nota anterior deste bloco
          // fixava o item aqui em `cad-gerais` (id `cad-ger-contr`) por
          // decisão de contrato do mesmo dia (2026-08-13); em homologação, no
          // mesmo dia, o dono pediu o item ao lado de Afiliados/
          // Proprietários/Fornecedores — entidade irmã na hierarquia
          // Partner→Tenant. Ver `cad-pes-contr` no grupo `cad-pessoas` acima.
          // `id` renomeado (prefixo `cad-pes-*`, convenção do grupo) —
          // permissão (`tenants_view`) e `path`
          // (`/cadastros-base/contratantes`) inalterados.
          // Marcadores e Testeiras MOVIDOS para o módulo de topo
          // `configuracoes` (97-Esteiras/019, decisão do dono 2026-08-05,
          // que reverte deliberadamente a realização anterior aqui em
          // `cad-gerais`). Ver o histórico completo da decisão junto aos
          // itens `cfg-mrc`/`cfg-tst`, no módulo `configuracoes` logo abaixo
          // de `administrativo`. Só a posição no menu mudou — nenhum `path`
          // foi alterado.
        ],
      },
    ],
  },
  {
    id: 'administrativo',
    label: 'Administrativo',
    emoji: '🏢',
    icon: 'building',
    groups: [
      {
        id: 'adm-suprimentos',
        label: 'Suprimentos',
        icon: 'cart',
        items: [
          { id: 'adm-sup-sla', label: 'Parâmetros SLA', path: '/administrativo/sla', icon: 'timer' },
          {
            id: 'adm-sup-meu',
            label: 'Meus Processos',
            path: '/administrativo/meus-processos',
            icon: 'list-checks',
          },
          {
            id: 'adm-sup-sol',
            label: 'Solicitação',
            path: '/administrativo/solicitacao',
            icon: 'document-add',
          },
          {
            id: 'adm-sup-rej',
            label: 'Rejeitados / Cancelados',
            path: '/administrativo/rejeitados',
            icon: 'error',
          },
          {
            id: 'adm-sup-cot',
            label: 'Cotações',
            path: '/administrativo/cotacoes',
            icon: 'document-search',
          },
          {
            id: 'adm-sup-aut',
            label: 'Autorização',
            path: '/administrativo/autorizacao',
            icon: 'shield-check',
          },
          {
            id: 'adm-sup-com',
            label: 'Compras',
            path: '/administrativo/compras',
            icon: 'cart',
          },
          {
            id: 'adm-sup-rec',
            label: 'Recebimentos',
            path: '/administrativo/recebimentos',
            icon: 'package-check',
          },
        ],
      },
      {
        id: 'adm-estoque',
        label: 'Estoque',
        icon: 'warehouse',
        items: [
          // Doc. Fiscal/Entrada (Invoice) — localização CANÔNICA (mirror 1:1
          // do legado, `sidebar.blade.php`, grupo único "Estoque"). Rota
          // real (InvoicesList) declarada em `router/index.tsx` ANTES do
          // catch-all `/administrativo/*` — CORREÇÃO de E2E do dono: antes
          // caía no `RoutePlaceholder` e havia um 2º item duplicado sob
          // "Gestão Fiscal" (`fis-entrada-docs`, removido).
          {
            id: 'adm-est-dfe',
            label: 'Doc. Fiscal / Entrada',
            path: '/administrativo/doc-fiscal',
            icon: 'document-import',
          },
          {
            id: 'adm-est-dfe2',
            label: 'DFe Recebidas',
            // Path CORRIGIDO (execução 044, TASK-DFE-FE-11): apontava para
            // `/administrativo/dfe-recebidas` (placeholder pré-existente sem
            // tela real — `RoutePlaceholder`); a rota REAL é `/fiscal/dfes`
            // (mirror `fis-nfe-dfe`, mesma tela, permissão diferente —
            // `CLM-DFe-049`, 2 dos 3 locais de menu do legado apontando para
            // o mesmo índice).
            path: '/fiscal/dfes',
            icon: 'inbox',
          },
          // Entrada de Insumos (InputEntry) — esteira 037. GAP DE MENU achado
          // nesta esteira: `adm-est-dfe` é o módulo Invoice/NFe (feature
          // diferente, tabela `invoices`), NÃO `input_entries` — item NOVO.
          {
            id: 'adm-est-eis',
            label: 'Entrada de Insumos',
            path: '/administrativo/entrada-insumos',
            icon: 'package-open',
          },
          {
            id: 'adm-est-bai',
            label: 'Baixa de Estoque',
            path: '/administrativo/baixa-estoque',
            icon: 'package-minus',
          },
          {
            id: 'adm-est-req',
            label: 'Requisição / Saída',
            path: '/administrativo/requisicao',
            icon: 'package-open',
          },
          {
            id: 'adm-est-dev',
            label: 'Devolução / Entrada',
            path: '/administrativo/devolucao',
            icon: 'undo',
          },
          {
            id: 'adm-est-cor',
            label: 'Correção de Estoque',
            path: '/administrativo/correcao',
            icon: 'wrench',
          },
          {
            id: 'adm-est-trm',
            label: 'Transferência entre Armazéns',
            path: '/administrativo/transf-armazens',
            icon: 'arrow-left-right',
          },
          {
            id: 'adm-est-trf',
            label: 'Transferência entre Fazendas',
            path: '/administrativo/transf-fazendas',
            icon: 'repeat',
          },
          {
            id: 'adm-est-sal',
            label: 'Saldo de Estoque',
            path: '/administrativo/saldo-estoque',
            icon: 'chart-bar',
          },
          // Fábrica (TASK-FB-FE-07 v2.0, decisão do dono 2026-08-12): item-folha
          // reestruturado em grupo pai com 2 filhos — "Formulação" (Food) e
          // "Batida" (FoodBeat), antes tratadas como funcionalidade única.
          // Padrão idêntico ao já especificado pelo design system `cerne`
          // (`src/data/menuData.ts:315-321`), só com os `path` dos filhos
          // ajustados para as rotas reais já implementadas no FrontEnd.
          {
            id: 'adm-est-fab',
            label: 'Fábrica',
            path: '/administrativo/fabrica',
            icon: 'factory',
            children: [
              {
                id: 'adm-est-fab-for',
                label: 'Formulação',
                path: '/administrativo/fabrica/formulacao',
                icon: 'lab',
              },
              {
                id: 'adm-est-fab-bat',
                label: 'Batida',
                path: '/administrativo/fabrica/batidas',
                icon: 'blend',
              },
            ],
          },
        ],
      },
      {
        id: 'adm-gestao-pessoal',
        label: 'Gestão Pessoal',
        icon: 'user-check',
        items: [
          { id: 'adm-gp-eve', label: 'Eventos', path: '/administrativo/eventos', icon: 'calendar' },
          { id: 'adm-gp-fun', label: 'Funções', path: '/administrativo/funcoes', icon: 'briefcase' },
          { id: 'adm-gp-equ', label: 'Equipes', path: '/administrativo/equipes', icon: 'users' },
          {
            id: 'adm-gp-fal',
            label: 'Registro de Faltas',
            path: '/administrativo/faltas',
            icon: 'calendar-off',
          },
          {
            id: 'adm-gp-adi',
            label: 'Adiantamento Salarial',
            path: '/administrativo/adiantamento',
            icon: 'currency',
          },
          {
            id: 'adm-gp-reg',
            label: 'Registro de Eventos',
            path: '/administrativo/registro-eventos',
            icon: 'clipboard-list',
          },
          {
            id: 'adm-gp-fxe',
            label: 'Funcionário x Eventos',
            path: '/administrativo/func-eventos',
            icon: 'user-settings',
          },
          {
            id: 'adm-gp-apu',
            label: 'Apuração Mensal',
            path: '/administrativo/apuracao',
            icon: 'calculator',
          },
        ],
      },
      {
        id: 'adm-gestao-doc',
        label: 'Gestão Documentos',
        icon: 'documents',
        items: [
          {
            id: 'adm-gd-tip',
            label: 'Tipo Documento',
            path: '/administrativo/tipos-documento',
            icon: 'document-type',
          },
          {
            id: 'adm-gd-doc',
            label: 'Documentos',
            path: '/administrativo/documentos',
            icon: 'document',
          },
        ],
      },
      {
        // Atividades Recentes (UT-000690 / F-349, DP-FE-01): grupo próprio, gate
        // `recent-activities_view` (todas as roles exceto `Gestor_Plataf`).
        id: 'adm-atividades',
        label: 'Atividades',
        icon: 'clock',
        items: [
          {
            id: 'adm-atv-rec',
            label: 'Atividades Recentes',
            path: '/administrativo/atividades-recentes',
            icon: 'clock',
          },
        ],
      },
      {
        // Logs do Sistema (execução 079): só Gestor_Plataf (papel + permissão
        // `system-logs_view`, ver navigationPermissions.ts).
        id: 'adm-sistema',
        label: 'Sistema',
        icon: 'wrench',
        items: [
          {
            id: 'adm-sis-log',
            label: 'Logs do Sistema',
            path: '/administrativo/logs',
            icon: 'document',
          },
        ],
      },
    ],
  },
  {
    // Módulo "Configurações" (97-Esteiras/019, decisão do dono 2026-08-05):
    // fidelidade ao menu do legado (sidebar.blade.php, ícone fa-cogs),
    // posicionado logo abaixo de Administrativo. Continha, a princípio, só os
    // dois itens que o dono pediu explicitamente (Testeiras e Marcadores); os
    // demais itens do grupo "Configurações" do legado (Tutoriais, Parâmetros,
    // Termos e Condições, Fazendas Online, Contratantes) ficavam FORA de
    // escopo daquela tarefa — não movidos, não inventados ali.
    // ATUALIZAÇÃO (execução 031, TASK-FE-031-43): "Parâmetros" (Parameter)
    // fecha uma das lacunas anotadas acima — item NOVO. Termos e Condições,
    // Fazendas Online e Contratantes CONTINUAM fora de escopo — não movidos,
    // não inventados aqui.
    // ATUALIZAÇÃO 2026-08-06 (correção de homologação, packet do Maestro):
    // homologação em browser constatou que Tutoriais (tela já ✅ validada em
    // src/pages/Configuracoes/Help/, rota /configuracoes/helps já registrada
    // em router/index.tsx) não tinha item de menu — só alcançável por URL
    // direta, quebra de paridade com o legado (presente em 2 sidebars:
    // sidebar.blade.php:3276-3282 e sidebar_gratuito.blade.php:1143). O dono
    // pediu explicitamente a inclusão. Item "Tutoriais" adicionado abaixo,
    // fiel à ordem do legado (Testeiras → Marcadores → Tutoriais dentro do
    // mesmo grupo `configs`). Termos e Condições, Fazendas Online e
    // Contratantes CONTINUAM fora de escopo — não tocados.
    // ATUALIZAÇÃO 2026-08-06 (TASK-APP-FE-01): "Aplicativos" (App — versões
    // de release de app móvel) entrou neste grupo. No legado o item vive no
    // MESMO `#configs` collapse de Testeiras/Marcadores/Tutoriais, entre
    // "Config" (`config_view`) e "Atualizações" (`system_updates_view`),
    // rótulo literal `<p>Aplicativos</p>` (sidebar.blade.php:3345-3350, sem
    // `@lang()` — texto hardcoded no Blade legado; ausente de
    // sidebar_gratuito.blade.php). Item de menu incluído desde a primeira
    // versão da ficha desta Tarefa (lição direta do precedente Tutoriais
    // acima). Termos e Condições, Fazendas Online e Contratantes CONTINUAM
    // fora de escopo — não tocados.
    id: 'configuracoes',
    label: 'Configurações',
    emoji: '🔧',
    icon: 'wrench',
    flatItems: [
      // Testeiras (Headband, TASK-HB-FE-04) — histórico: a nota anterior
      // (97-Esteiras/019, decisão do dono 2026-08-05, mesma janela de
      // execução) fixava este item em `cad-gerais`, com id de prefixo
      // `cad-ger-` (mesmo padrão de Cidades/Estados/Serviços), e marcava a
      // convenção de id como "não reabrir". SUPERADA: o próprio dono reabriu
      // ao pedir o módulo "Configurações" de topo de fato. `id` renomeado
      // para o prefixo do novo módulo. `path` NÃO mais mantido: instrução
      // literal do dono em 2026-08-05 ("a url ficou errada, deve ser
      // .../configuracoes/testeiras") migrou também a URL, do slug antigo em
      // Cadastros Base para o path atual acima, em `configuracoes`
      // (97-Esteiras/019, packet próprio pós-menu). Ver router/index.tsx e
      // as telas de Headbands para o restante da migração.
      { id: 'cfg-tst', label: 'Testeiras', path: '/configuracoes/testeiras', icon: 'tag' },
      // Marcadores (Marker, TASK-MK-FE-01) — histórico: nota original
      // (2026-07-30, via coordenador de sessão, ver Marker-FrontEnd-
      // contrato.md §5) fixava o item em `cad-gerais`, fidelidade ao grupo
      // "Configurações" do legado (sidebar.blade.php) NAQUELE momento —
      // "não reabrir" era sobre a alternativa `cad-estrutura`, considerada e
      // recusada, e que continua recusada. SUPERADA em 2026-08-05: o dono
      // reverteu deliberadamente aquela realização para criar o módulo
      // "Configurações" de topo de verdade, abaixo de Administrativo. `path`
      // mantido; `id` renomeado para `cfg-mrc`.
      { id: 'cfg-mrc', label: 'Marcadores', path: '/cadastros-base/marcadores', icon: 'star' },
      // Tutoriais (Help, TASK-HP-06) — tela e rota já existiam e já estavam
      // ✅ validadas; faltava só o item de menu (correção de homologação,
      // 2026-08-06, packet do Maestro — não passou pelo Arquiteto por ser
      // 1 entrada de navegação). Rótulo fiel ao legado (`@lang('trad.tutoriais')`
      // → "Tutoriais", sidebar.blade.php:3280 e lang/pt-BR/trad.php:1481).
      // Posição: 3º item do grupo, mesma ordem do legado (Testeiras →
      // Marcadores → Tutoriais dentro de `configs`, sidebar.blade.php:3260-
      // 3283). Gate de permissão em navigationPermissions.ts (`cfg-hlp` →
      // `helpers_view`, mesmo padrão de `cfg-tst`/`cfg-mrc`) — permissão já
      // existente em permissionsCatalog.json:479 e já usada no gate de rota
      // (`RequirePermission permission="helpers_view"`, router/index.tsx:1319).
      { id: 'cfg-hlp', label: 'Tutoriais', path: '/configuracoes/helps', icon: 'help' },
      // Configuração (Config, execução 032, TASK-FE-2603) — item NOVO,
      // preenche a lacuna já apontada pelo comentário deste grupo acima
      // ("Config" (`config_view`) e "Atualizações" (`system_updates_view`),
      // com "Aplicativos" entre os dois, sidebar.blade.php:3345-3350) — não é
      // escolha nova, é a posição exata já documentada. Gate de permissão em
      // navigationPermissions.ts (`cfg-cnf` → `config_view`, mesmo padrão de
      // `cfg-tst`/`cfg-mrc`/`cfg-hlp` acima).
      { id: 'cfg-cnf', label: 'Configuração', path: '/configuracoes/config', icon: 'wrench' },
      // Aplicativos (App, TASK-APP-FE-01) — tela e rota NOVAS nesta Tarefa
      // (item de menu incluído desde o início, não em correção posterior —
      // ver histórico do grupo acima). Rótulo fiel ao legado (texto literal
      // "Aplicativos", sidebar.blade.php:3348 — NÃO é `@lang()`, é hardcoded
      // no próprio Blade, confirmado por leitura direta; sem entrada em
      // sidebar_gratuito.blade.php). Posição: 4º item do grupo, logo após
      // Tutoriais (no legado o item vem depois de "Config", mas aqui entra
      // ao final do grupo `configuracoes` por não haver item "Config"
      // equivalente já migrado). Gate de permissão em
      // navigationPermissions.ts (`cfg-app` → `apps_view`, mesmo padrão de
      // `cfg-tst`/`cfg-mrc`/`cfg-hlp`) — permissão já existente
      // (`apps_view`/`apps_create`/`apps_edit`/`apps_delete`,
      // App-contrato.md Seção 3) e já usada no gate de rota
      // (`RequirePermission permission="apps_view"`, router/index.tsx).
      { id: 'cfg-app', label: 'Aplicativos', path: '/configuracoes/apps', icon: 'blocks' },
      // Parâmetros (Parameter, execução 031, TASK-FE-031-43) — item NOVO,
      // nunca existiu antes neste menu; fecha a lacuna anotada acima
      // (execução 019 marcava "Parâmetros" como fora de escopo). `path`
      // limpo, sem migração de URL (contrato-front-parametros.md §3).
      { id: 'cfg-par', label: 'Parâmetros', path: '/configuracoes/parametros', icon: 'wrench' },
      // CORREÇÃO PÓS-E2E (rodada 1, C4 — correcoes-e2e-dev-rodada-1.md):
      // "Atualizações do Sistema" (SystemUpdate, execução 031, TASK-FE-1104)
      // REPOSICIONADO de "Cadastros Base" (`cad-estrutura`) para cá — o dev
      // apontou o grupo errado no E2E; o legado já agrupava este item em
      // "Configurações" (contrato-front-atualizacoes-sistema.md §1.2), mesmo
      // grupo de "Parâmetros" acima. Só a posição mudou: `id`/`path`/`icon`
      // inalterados, nenhuma outra entrada deste grupo foi reordenada.
      {
        id: 'cad-est-sis',
        label: 'Atualizações do Sistema',
        path: '/cadastros-base/atualizacoes-sistema',
        icon: 'message',
      },
      // Permissões (Permission, execução 032, TASK-FE-2404) — item NOVO,
      // nunca existiu antes neste menu. Grupo "Configurações" por default do
      // contrato de tela §7.1 (mesma família dos módulos-irmãos desta
      // execução — Configuração/Parâmetros, IBPT, Termos e Condições — e de
      // `SystemUpdate`/`Testeiras`/`Marcadores`/`Tutoriais`/`Aplicativos`),
      // não "Cadastros Base > Pessoas" (onde `Perfil`/Role já vive) —
      // Permissão é catálogo técnico de sistema, não dado de pessoa.
      // Posicionado após "Atualizações do Sistema" (mesmo grupo, ordem não
      // normativa). Gate de permissão em navigationPermissions.ts
      // (`cfg-per` → `permissions_view`, mesmo padrão de `cfg-tst`/`cfg-mrc`/
      // `cfg-par` acima).
      {
        id: 'cfg-per',
        label: 'Permissões',
        path: '/cadastros-base/permissoes',
        icon: 'key',
      },
      // IBPT (Ibpt — Tabela Fiscal de Incidência Tributária, execução 032,
      // TASK-FE-2414) — item NOVO, nunca existiu antes neste menu. Grupo
      // "Configurações" por default do contrato de tela §1.2 (mesma família
      // dos módulos-irmãos desta execução — Parâmetros/Permissões/Termos e
      // Condições — e de `SystemUpdate`/`Testeiras`/`Marcadores`).
      // Posicionado após "Permissões" (mesmo grupo, ordem não normativa).
      // Gate de permissão em navigationPermissions.ts (`cfg-ibp` →
      // `ibpts_view`, mesmo padrão de `cfg-tst`/`cfg-mrc`/`cfg-par`/`cfg-per`
      // acima). `Receipt` já importado no topo deste arquivo (ícone
      // sugerido pelo contrato de tela).
      {
        id: 'cfg-ibp',
        label: 'IBPT',
        path: '/cadastros-base/ibpt',
        icon: 'receipt',
      },
      // Termos e Condições (PlatformDocument, execução 032, TASK-FE-2502) —
      // item NOVO, nunca existiu antes neste menu. Grupo "Configurações" por
      // default do contrato de tela §7.1 (mesma família dos módulos-irmãos
      // desta execução — Parâmetros/Permissões/IBPT — e de
      // `SystemUpdate`/`Testeiras`/`Marcadores`/`Tutoriais`/`Aplicativos`).
      // Posicionado após "IBPT" (mesmo grupo, ordem não normativa). Gate de
      // permissão em navigationPermissions.ts (`cfg-trm` → `terms_view`,
      // mesmo padrão de `cfg-tst`/`cfg-mrc`/`cfg-par`/`cfg-per`/`cfg-ibp`
      // acima). `FileText` já importado no topo deste arquivo.
      {
        id: 'cfg-trm',
        label: 'Termos e Condições',
        path: '/cadastros-base/termos-condicoes',
        icon: 'document',
      },
      // CORREÇÃO PÓS-E2E (rodada 1, C7 — correcoes-e2e-dev-rodada-1.md):
      // "Mercado Pago" (FinanceMp, execução 031, TASK-FE-031-46)
      // REPOSICIONADO de "Financeiro" (`fin-principal`) para cá — mesmo
      // racional de C4 (item de configuração administrativa, não uma tela
      // financeira operacional do dia a dia). Só a posição mudou: `id`/
      // `path`/`icon` inalterados, `fin-principal` preserva as demais
      // entradas na mesma ordem.
      { id: 'fin-mp', label: 'Mercado Pago', path: '/financeiro/mercado-pago', icon: 'credit-card' },
      // AJUSTE DE NAVEGAÇÃO (packet do Maestro, 2026-08-07): "Planos"
      // (PlanRole, TASK-FE-2704) só era alcançável pelo ícone dedicado do
      // NavRail (Gem, ver NavRail.tsx:15/33/325) — não tinha item aqui, então
      // não aparecia na busca do menu (que varre só este `navigationTree`).
      // Item ADITIVO: o ícone/atalho do NavRail continua intacto, isto só
      // fecha a lacuna de busca. Grupo "Configurações" por ser a mesma
      // família de administrativo de plataforma dos demais itens deste
      // `flatItems` (Configuração/Parâmetros/Permissões/IBPT/Termos e
      // Condições/Mercado Pago) — Planos (PlanRole) é módulo de
      // gerenciamento/SaaS, não uma tela operacional de fazenda. Gate de
      // permissão em navigationPermissions.ts (`cfg-pln` → `plan_view`,
      // mesma permissão já usada no guard da rota `/planos`,
      // router/index.tsx).
      {
        id: 'cfg-pln',
        label: 'Planos',
        path: '/planos',
        icon: 'gem',
      },
      // Contratar/alterar plano (simulador de assinatura). Sem regra em navigationPermissions:
      // visível a qualquer usuário autenticado (a permissão definitiva depende do backend).
      {
        id: 'cfg-contratar',
        label: 'Contratar plano',
        path: '/planos/contratar',
        icon: 'crown',
      },
    ],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    emoji: '⚙️',
    icon: 'gauge',
    groups: [
      {
        id: 'ope-agricultura',
        label: 'Agricultura',
        icon: 'grain',
        items: [
          {
            id: 'ope-agr-pla',
            label: 'Planejamentos',
            path: '/operacional/planejamentos',
            icon: 'clipboard-list',
          },
          {
            id: 'ope-agr-apo',
            label: 'Apontamentos',
            path: '/operacional/apontamentos',
            icon: 'edit-line',
          },
          { id: 'ope-agr-rom', label: 'Romaneios', path: '/operacional/romaneios', icon: 'document' },
          // Colheita de Frutas (HarvestProduct, F-040, execução 040,
          // HarvestProduct-contrato-arquitetural.md §7.9): item de menu NOVO,
          // filho de "Agricultura" ao lado de "Romaneios"/"Marcação" — grupo
          // correto por domínio (ticket de colheita com peso em caixas é
          // análogo a Romaneio), não "Reprodução"/Pecuária nem o módulo
          // `Harvest`/Safra já existente (Cadastros Base, período, não
          // operação de campo). Ícone `Boxes` (já importado) — afinidade
          // semântica com o subcadastro central da tela (caixas).
          {
            id: 'ope-agr-col',
            label: 'Colheita de Frutas',
            path: '/operacional/colheita-frutas',
            icon: 'sprout',
          },
          // Marcação (Marking, TASK-MC-FE-09, esteira 97-Esteiras/044) — FIX
          // de placement (bug reportado pelo dono): a entrega original
          // colocou este nó em Pecuária → Manejo (`ope-pec-man-mar`),
          // espelhando Desmama/Weaning (que É pecuária); Marcação é
          // AGRÍCOLA — confirmado pelo legado (`agro365/app/Permission.php`,
          // grupo "Agricultura" → "Marcação", `markings.index`) e pelo
          // design system (`GB.Cerne.UX/src/data/menuData.ts:364`,
          // `ope-agr-mar` entre Romaneios e Carregamento, mesmo ícone
          // `Tag`). Movido para item-folha de `ope-agricultura` (mirror dos
          // irmãos `ope-agr-*`, sem filhos — diferente do padrão
          // item-pai-com-filhos usado em "Manejo"). Gate de permissão em
          // navigationPermissions.ts (`ope-agr-mar` → `markings_view`,
          // mesma permissão legada — nenhuma permissão nova cunhada).
          { id: 'ope-agr-mar', label: 'Marcação', path: '/operacional/marcacao', icon: 'tag' },
          // "Carregamento" reestruturado de item-folha único para item-pai
          // com filhos (homologação do dono, 2026-08-25): o menu não expunha
          // "Fechamento Semana" (rota `/operacional/fechamento-semana` e
          // permissão `closing_weeks_view` já existiam, só faltava o nó de
          // menu) e o dono pediu a hierarquia Agricultura → Carregamento →
          // {Carregamentos, Fechamento Semana}. Mirror EXATO do padrão já
          // aprovado para "Manejo"/"Reprodução" (ver `ope-pec-man`/
          // `ope-pec-rep` abaixo): `path`/`icon` do próprio "Carregamento"
          // PRESERVADOS (clique no item-pai continua indo para a listagem de
          // Carregamentos, sem mudança de comportamento); os 2 filhos
          // cobrem a mesma feature de antes (Carregamentos) + a nova
          // (Fechamento Semana). Gate de permissão dos filhos em
          // navigationPermissions.ts (`ope-agr-car-car` → `charge_view`,
          // mesma permissão mínima já usada na rota; `ope-agr-car-fec` →
          // `closing_weeks_view`, permissão já existente, nenhuma nova
          // cunhada) — a regra do PAI (`ope-agr-car`, `anyOf`) já cobria
          // ambos os conjuntos de permissões (`charge_*` e `closing_weeks_*`)
          // e permanece inalterada.
          {
            id: 'ope-agr-car',
            label: 'Carregamento',
            path: '/operacional/carregamento',
            icon: 'truck',
            children: [
              {
                id: 'ope-agr-car-car',
                label: 'Carregamentos',
                path: '/operacional/carregamento',
                icon: 'truck',
              },
              {
                id: 'ope-agr-car-fec',
                label: 'Fechamento Semana',
                path: '/operacional/fechamento-semana',
                icon: 'calendar-check',
              },
              // Contas a Receber (ChargeBillIncome, F-026, domínio PRÓPRIO —
              // TASK-CBI-FE-01, esteira 97-Esteiras/059): 3º filho de
              // "Carregamento", fiel ao legado (EV-21, `app/Permission.php`
              // — "Contas a Receber" vive sob o menu "Carregamento",
              // permissões `charge_income_*`, DISTINTO do "Contas a Receber"
              // de Financeiro/`Income`, permissões `incomes_*`). O `anyOf` do
              // PAI (`ope-agr-car`, `navigationPermissions.ts`) já cobria
              // `charge_income_*` ANTES desta Tarefa (preparado quando o
              // grupo virou item-pai, 2026-08-25) — nenhuma edição no `anyOf`
              // do pai necessária, só este nó de menu + a entrada dedicada do
              // filho.
              {
                id: 'ope-agr-car-cbi',
                label: 'Contas a Receber',
                path: '/operacional/carregamento/contas-a-receber',
                icon: 'truck',
              },
              // Contas a Pagar (ChargeBillExpense, domínio PRÓPRIO —
              // TASK-CBE-07, esteira 97-Esteiras/062): 4º filho de
              // "Carregamento", fiel ao legado (sidebar 'Carregamento' →
              // 'C. a Pagar', mesma família de "Contas a Receber" acima,
              // permissões `charge_expense_*`, DISTINTO do "Contas a Pagar"
              // de Financeiro/`Expense`, permissões `expenses_*`). O `anyOf`
              // do PAI (`ope-agr-car`, `navigationPermissions.ts`) já cobria
              // `charge_expense_*` ANTES desta Tarefa (preparado junto com
              // `charge_income_*`) — nenhuma edição no `anyOf` do pai
              // necessária, só este nó de menu + a entrada dedicada do filho.
              {
                id: 'ope-agr-car-cbe',
                label: 'Contas a Pagar',
                path: '/operacional/carregamento/contas-a-pagar',
                icon: 'truck',
              },
            ],
          },
          // "Rastreabilidade" reestruturado de item-folha STUB (sem rota/tela
          // real) para item-pai com 2 filhos (F-067, TASK-TR-FE-11, esteira
          // 97-Esteiras/058) — mirror EXATO do padrão já homologado para
          // "Carregamento" acima (2026-08-25): `icon` do item-pai
          // PRESERVADO (`Route`, inalterado); `path` do item-pai atualizado
          // de `/operacional/rastreabilidade` (stub sem tela) para
          // `/operacional/rastreabilidade/produtos` — mesma rota do filho
          // "Produtos", para que o clique DIRETO no pai (sem expandir)
          // continue levando à feature real, mirror do comportamento do pai
          // "Carregamento" (que aponta para a mesma rota do filho
          // "Carregamentos"). GAP-UX informativo registrado (`## 9.4` do
          // contrato de tela): o design system `cerne` (`menuData.ts:366`)
          // ainda não replicou esta estrutura pai+filhos — não bloqueia esta
          // fatia (default ratificado pelo Maestro sob diretriz do dono,
          // 2026-08-26). Gate de permissão dos filhos em
          // `navigationPermissions.ts` (`ope-agr-ras-pro` → `traceab_view`
          // `anyOf` create/edit/delete; `ope-agr-ras-cfg` → `tracconfig_view`,
          // único slug — nenhuma permissão nova cunhada, DEC-006) — o `anyOf`
          // do PAI (`ope-agr-ras`, `navigationPermissions.ts`) permanece
          // INALTERADO (já cobria `traceab_*`/`tracconfig_*`).
          //
          // Site (Site, esteira 97-Esteiras/061) — 3º filho `ope-agr-ras-site`,
          // REPOSICIONADO para dentro de "Rastreabilidade" por decisão do
          // dono na homologação (2026-08-27): "Não encontrei a funcionalidade
          // Site dentro de Operacional -> Agricultura -> Rastreabilidade ->
          // Site, ajuste" — REVERTE a escolha default G-FE-02 anterior (nó
          // próprio em `configuracoes.flatItems`, ao lado de "Configuração").
          // `icon` reaproveitado de `Globe` (mesmo ícone do nó antigo
          // `cfg-site`, já importado neste arquivo). Gate dedicado em
          // `navigationPermissions.ts` (`ope-agr-ras-site` →
          // `{ permission: 'site_edit' }`); `anyOf` do PAI (`ope-agr-ras`)
          // JÁ cobria `site_edit` (deixado pronto na TASK-SITE-07 original),
          // sem alteração adicional aqui.
          {
            id: 'ope-agr-ras',
            label: 'Rastreabilidade',
            path: '/operacional/rastreabilidade/produtos',
            icon: 'route',
            children: [
              {
                id: 'ope-agr-ras-pro',
                label: 'Produtos',
                path: '/operacional/rastreabilidade/produtos',
                icon: 'route',
              },
              {
                id: 'ope-agr-ras-cfg',
                label: 'Configuração',
                path: '/operacional/rastreabilidade/configuracao',
                icon: 'wrench',
              },
              {
                id: 'ope-agr-ras-site',
                label: 'Site',
                path: '/operacional/rastreabilidade/site',
                icon: 'globe',
              },
            ],
          },
          // Descontos/Classificação (DiscountTable, F-032, TASK-DT-FE-04) —
          // item JÁ EXISTIA como placeholder (`path: '/operacional/
          // descontos'`); `path` corrigido para `/operacional/discount-
          // tables` (fiel à rota real registrada em `router/index.tsx`,
          // contrato de tela §2) — `id`/`label`/`icon` INALTERADOS.
          // Permissão (`ope-agr-des` → `discount-tables_view`) em
          // `navigationPermissions.ts` já estava correta.
          {
            id: 'ope-agr-des',
            label: 'Descontos / Classificação',
            path: '/operacional/discount-tables',
            icon: 'percent',
          },
          // Pesagem Rodoviária (ModuleWeighing, F-045, execução 044,
          // TASK-MWG-FE-13) — `path` CORRIGIDO: o item já existia
          // pré-wireado com `id`/`label`/permissão corretos (`ope-agr-pes` →
          // `module-weighing_view`, `navigationPermissions.ts`), mas
          // apontava para o placeholder stale `/operacional/pesagem`
          // (rota REAL da pesagem ANIMAL, F-071, `ope-pec-man-pes` →
          // `weighing_view` — feature IRMÃ, já em produção, NUNCA tocada
          // aqui). Rota real desta feature é `/operacional/pesagem-rodoviaria`
          // (`router/index.tsx`, `CONTRATO-TELA-PESAGEM-FE §5`). `id`/
          // `label`/`icon` INALTERADOS — nenhum novo slug de menu criado.
          {
            id: 'ope-agr-pes',
            label: 'Pesagem Rodoviária',
            path: '/operacional/pesagem-rodoviaria',
            icon: 'scale',
          },
          {
            id: 'ope-agr-con',
            label: 'Contratos de Venda',
            path: '/operacional/contratos-venda',
            icon: 'signature',
          },
        ],
      },
      {
        id: 'ope-pecuaria',
        label: 'Pecuária',
        icon: 'cattle',
        items: [
          {
            // Gestão Animais ganhou tela dedicada nesta reversão de SD-01
            // (execução 017, reverte a absorção por Rebanho decidida em
            // 006/FID-G3F §8, motivada pela rejeição AF de 2026-08-24: "ao
            // clicar em Gestão Animais, vai para Cadastro Base Rebanho").
            // Rota própria `/operacional/gestao-animais`, reaproveitando o
            // MESMO núcleo de tela (`AnimalListScreen`, Tarefa 53) que
            // `/cadastros-base/rebanho` — ver contrato de tela
            // 97-Esteiras/017/CONTRATOS/contrato-tela-gestao-animais-
            // dedicada.md. Permissão do nó (`animals-management_view`) e
            // label ("Gestão Animais"/"Animal Management") INALTERADOS — só
            // o `path` muda.
            id: 'ope-pec-ges',
            label: 'Gestão Animais',
            path: '/operacional/gestao-animais',
            icon: 'cattle',
          },
          {
            id: 'ope-pec-inv',
            label: 'Inventariado',
            path: '/operacional/inventariado',
            icon: 'clipboard-check',
          },
          {
            id: 'ope-pec-pla',
            label: 'Planejamento Pecuário',
            path: '/operacional/planejamento-pecuario',
            icon: 'clipboard-list',
          },
          // "Transferências" reestruturado de item-folha único para
          // item-pai com filhos (Tarefas 26/27, spa-contract-evolucao-
          // rebanho.md §3.1) — mirror EXATO do mesmo padrão já aprovado
          // para "Manejo"/"Pastagem" (2026-08-19) e "Reprodução"/"Touros"
          // (2026-08-20): `path`/`icon` do próprio "Transferências"
          // PRESERVADOS; único filho adicionado é "Evolução/Rebanho",
          // apontando para a rota NOVA `/operacional/evolucao-rebanho`
          // (Tarefa 26). Gate de permissão do filho em
          // navigationPermissions.ts (`ope-pec-tra-evo` →
          // `evolutions_view`, mesmo slug já pré-provisionado no `anyOf`
          // do pai) — a regra do PAI (`ope-pec-tra`) permanece inalterada.
          {
            id: 'ope-pec-tra',
            label: 'Transferências',
            path: '/operacional/transferencias',
            icon: 'arrow-left-right',
            children: [
              // Correção de bug de menu (Execução 041, packet do Maestro,
              // 2026-08-25): "Transferências" virou grupo (children) ao
              // ganhar os filhos Evolução/Rebanho, Animais/Lote e Lote/
              // Fazenda abaixo — `SecondaryNav.tsx` trata todo nó com
              // `children` como só-expansível, nunca navega ao `path` do
              // pai. Resultado: a LISTA ABC em si (`TransferAbcBatch`, rota
              // `/operacional/transferencias` já registrada em
              // router/index.tsx:7072) ficou órfã, sem item-folha clicável.
              // Correção mínima ADITIVA: item-folha próprio para a lista
              // ABC, primeiro filho (é a lista principal do grupo), mesmo
              // `path` do pai. `path`/`icon`/`anyOf` do pai (`ope-pec-tra`)
              // e os demais filhos permanecem intocados.
              {
                id: 'ope-pec-tra-abc',
                label: 'Transferência ABC',
                path: '/operacional/transferencias',
                icon: 'transfer',
              },
              {
                id: 'ope-pec-tra-evo',
                label: 'Evolução/Rebanho',
                path: '/operacional/evolucao-rebanho',
                icon: 'trend-up',
              },
              // Segundo filho de "Transferências" (TASK-LOTE-FE-01, feature
              // Animais/Lote `426be835`, frontend-contract-animais-lote.md
              // §3) — mesmo padrão do irmão `ope-pec-tra-evo` acima: `path`/
              // `icon` do PAI preservados, filho aponta para a rota NOVA
              // `/operacional/transferencia-animais-lote`. Gate de permissão
              // do filho em navigationPermissions.ts (`ope-pec-tra-anl` →
              // `transference_animal_batch`, já presente no `anyOf` do pai,
              // linha 288) — o `anyOf` do PAI permanece intocado.
              {
                id: 'ope-pec-tra-anl',
                label: 'Transferência Animais/Lote',
                path: '/operacional/transferencia-animais-lote',
                icon: 'transfer',
              },
              // Terceiro filho de "Transferências" (97-Esteiras/041,
              // TASK-FE-041-LF-01, TransferBatchFarm — transferência de
              // Lote ENTRE FAZENDAS, domínio DIFERENTE de `ope-pec-tra-anl`
              // acima, que é intra-fazenda). Mesmo padrão dos irmãos:
              // `path`/`icon` do PAI preservados, filho aponta para a rota
              // NOVA `/operacional/lote-fazenda/transferencias`. Gate de
              // permissão do filho em navigationPermissions.ts
              // (`ope-pec-tra-lf` → `transfer_batch_farms_view`, adicionado
              // ao `anyOf` do pai) — o `anyOf` do PAI permanece com os
              // demais itens intocado.
              {
                id: 'ope-pec-tra-lf',
                label: 'Lote/Fazenda',
                path: '/operacional/lote-fazenda/transferencias',
                icon: 'transfer',
              },
              // Quarto filho de "Transferências" (execução 042,
              // TASK-FE-042-306, GrouperBatch — Agrupar/Lotes). Mesmo padrão
              // aditivo dos irmãos acima: `path`/`icon` do PAI preservados,
              // filho aponta para a rota NOVA `/operacional/agrupar-lotes`.
              // Gate de permissão do filho em navigationPermissions.ts
              // (`ope-pec-tra-ag` → `grouper_batches`, já presente no
              // `anyOf` do pai) — o `anyOf` do PAI permanece intocado.
              {
                id: 'ope-pec-tra-ag',
                label: 'Agrupar Lotes',
                path: '/operacional/agrupar-lotes',
                icon: 'layers',
              },
              // Quarto filho de "Transferências" (97-Esteiras/042,
              // TASK-FE-042-102, TransferAnimalFarm — transferência de
              // ANIMAIS entre fazendas, domínio DIFERENTE de
              // `ope-pec-tra-lf` acima, que transfere LOTES inteiros).
              // Mesmo padrão dos irmãos: `path`/`icon` do PAI preservados,
              // filho aponta para a rota NOVA
              // `/operacional/animal-fazenda/transferencias`. Gate de
              // permissão do filho em navigationPermissions.ts
              // (`ope-pec-tra-af` → `transfer_animal_farms_view`, adicionado
              // ao `anyOf` do pai) — o `anyOf` do PAI permanece com os
              // demais itens intocado.
              {
                id: 'ope-pec-tra-af',
                label: 'Animal/Fazenda',
                path: '/operacional/animal-fazenda/transferencias',
                icon: 'transfer',
              },
              // Quinto filho de "Transferências" (97-Esteiras/070,
              // TASK-LMA-FE-02, BatchModuleAreaTransfer — Lote/Módulo/Área,
              // domínio DIFERENTE de `ope-pec-tra-lf`/`ope-pec-tra-af` acima
              // (transfere Módulo/Área/Curral DENTRO da mesma fazenda, não
              // entre fazendas). Mesmo padrão aditivo dos irmãos: `path`/
              // `icon` do PAI preservados, filho aponta para a rota NOVA
              // `/operacional/lote-modulo-area/transferencias`. Gate de
              // permissão do filho em navigationPermissions.ts
              // (`ope-pec-tra-lma` → `batch_module_area_transfers_view`,
              // adicionado ao `anyOf` do pai) — o `anyOf` do PAI permanece
              // com os demais itens intocado.
              {
                id: 'ope-pec-tra-lma',
                label: 'Lote/Módulo/Área',
                path: '/operacional/lote-modulo-area/transferencias',
                icon: 'transfer',
              },
            ],
          },
          // "Movimentações" (`ope-pec-mov`) reestruturado de item-folha único
          // (LEAF morto/placeholder — a rota `/operacional/movimentacoes`
          // nunca existiu em `router/index.tsx`) para item-pai com filhos —
          // decisão do dono na homologação (2026-08-24): MOVER "Mortes" para
          // dentro deste subgrupo (Operacional → Pecuária → Movimentações →
          // Mortes). Mirror EXATO do padrão já aprovado para "Transferências"
          // (`ope-pec-tra`, acima) e "Manejo"/"Fábrica": `path`/`icon` do
          // próprio PAI PRESERVADOS (`NavSubItem.path` é campo obrigatório do
          // shape, não opcional — todo subgrupo desta árvore, incluindo
          // `ope-pec-tra`, mantém seu próprio `path` mesmo tendo `children`).
          // `id`/`label`/`icon` do pai inalterados.
          //
          // ATUALIZAÇÃO (homologação do dono, 2026-09-22): os 5 itens abaixo
          // (Nascimentos, Venda de Animais, Processamentos, Perdas, Compras)
          // eram irmãos DIRETOS de "Pecuária" — comentários anteriores nesta
          // árvore justificavam mantê-los fora de "Movimentações" por rótulo
          // "genérico demais". A decisão do dono na homologação de hoje
          // SOBRESCREVE esse racional: os 5 foram MOVIDOS para dentro de
          // "Movimentações", junto de "Mortes" (ordem mostrada pelo dono:
          // Mortes, Nascimentos, Venda de Animais, Processamentos, Perdas,
          // Compras). `id`/`label`/`path`/`icon` de cada um PRESERVADOS
          // EXATAMENTE — só a posição no menu mudou, nenhuma rota foi
          // alterada. Gate de permissão do PAI em `navigationPermissions.ts`
          // (`ope-pec-mov`) ampliado para `anyOf` com a permissão de VIEW dos
          // 6 filhos; os gates próprios de cada filho (por `id`) permanecem
          // inalterados.
          {
            id: 'ope-pec-mov',
            label: 'Movimentações',
            path: '/operacional/movimentacoes',
            icon: 'repeat',
            children: [
              // Mortes (DeathAnimal, TASK-DA-FE-01, execução 049) — MOVIDO de
              // filho DIRETO de "Pecuária" para filho de "Movimentações"
              // (homologação do dono, 2026-08-24). `id`/`path`/`icon`/rota
              // (`/operacional/mortes`) e permissão (`navigationPermissions.ts`,
              // `death_animals_view`) INALTERADOS — só a posição no menu mudou.
              { id: 'ope-pec-mor', label: 'Mortes', path: '/operacional/mortes', icon: 'alert' },
              // Nascimentos (TASK-NASC-FE-01, frontend-contract-nascimentos.md
              // §2.1, GAP-NASCIMENTOS-FE-02) — MOVIDO de irmão DIRETO de
              // "Pecuária" para filho de "Movimentações" (homologação do
              // dono, 2026-09-22, ver comentário do PAI acima). `id`/`path`/
              // `icon`/rota (`/operacional/nascimentos`) e permissão
              // (`navigationPermissions.ts`, `birth_animals_view`)
              // INALTERADOS — só a posição no menu mudou. Ícone `Baby`
              // reaproveitado de `cad-pec-obn` (Observação Nascimento —
              // mesma afinidade semântica).
              {
                id: 'ope-pec-nas',
                label: 'Nascimentos',
                path: '/operacional/nascimentos',
                icon: 'cattle',
              },
              // Venda de Animais (TASK-VD-FE-01, frontend-contract-vendas.md
              // §2.1) — MOVIDO de irmão DIRETO de "Pecuária" para filho de
              // "Movimentações" (homologação do dono, 2026-09-22, ver
              // comentário do PAI acima). Rótulo "Venda de Animais" (não
              // "Vendas") continua evitando colisão com o item comercial
              // `ope-ven-ven` (`/operacional/vendas`, outro módulo).
              // `id`/`path`/`icon`/rota (`/operacional/venda-animais`) e
              // permissão (`navigationPermissions.ts`, `mov_sale_view`)
              // INALTERADOS — só a posição no menu mudou.
              {
                id: 'ope-pec-ven',
                label: 'Venda de Animais',
                path: '/operacional/venda-animais',
                icon: 'shopping-bag',
              },
              // Processamentos (correção de lacuna, execução 039,
              // TASK-FE-039-PROC-*) — MOVIDO de irmão DIRETO de "Pecuária"
              // para filho de "Movimentações" (homologação do dono,
              // 2026-09-22, ver comentário do PAI acima). `id`/`path`/`icon`/
              // rota (`/operacional/processamentos`) e permissão
              // (`navigationPermissions.ts`, `anyOf` processing_*)
              // INALTERADOS — só a posição no menu mudou.
              {
                id: 'ope-pec-pro',
                label: 'Processamentos',
                path: '/operacional/processamentos',
                icon: 'stock',
              },
              // Perdas (F-043 Perdas/LossAnimal, execução 040, contrato de
              // tela §7.5.4) — MOVIDO de irmão DIRETO de "Pecuária" para
              // filho de "Movimentações" (homologação do dono, 2026-09-22,
              // ver comentário do PAI acima). `id`/`path`/`icon`/rota
              // (`/operacional/perdas`) e permissão (`navigationPermissions.ts`,
              // `loss_animals_view`) INALTERADOS — só a posição no menu
              // mudou. Ícone `TrendingDown` reaproveitado (mesma afinidade
              // semântica de perda/queda usada em outros pontos do arquivo).
              {
                id: 'ope-pec-per',
                label: 'Perdas',
                path: '/operacional/perdas',
                icon: 'trend-down',
              },
              // Compras (TASK-CP-04, contrato-frontend-compras-movimento.md
              // §4.3) — MOVIDO de irmão DIRETO de "Pecuária" para filho de
              // "Movimentações" (homologação do dono, 2026-09-22, ver
              // comentário do PAI acima). Rótulo "Compras" continua evitando
              // colisão com o item administrativo `adm-sup-com` ("Compras",
              // `ShoppingCart`) por estar em ramo diferente da árvore
              // (`operacional` vs `administrativo`), e com `ope-pec-ven`
              // ("Venda de Animais", `ShoppingBag`). `id`/`path`/`icon`/rota
              // (`/operacional/compra-animais`) e permissão
              // (`navigationPermissions.ts`, `mov_purchase_view`)
              // INALTERADOS — só a posição no menu mudou.
              {
                id: 'ope-pec-com',
                label: 'Compras',
                path: '/operacional/compra-animais',
                icon: 'banknote',
              },
            ],
          },
          // "Manejo" reestruturado de item-folha único para item-pai com
          // filhos (mesmo padrão de "Fábrica"/`adm-est-fab`, acima, e do
          // NavSubItem.children documentado no topo deste arquivo) — packet
          // de homologação do dono (2026-08-19): "Pastagem" (Pasture,
          // TASK-PAST-FE-08, execução 041) faltava no menu, dono não achava
          // a tela. `path`/`icon` do próprio "Manejo" preservados; único
          // filho adicionado é "Pastagem", apontando para a rota já
          // existente (`/operacional/pastagem`, ver router/index.tsx). Gate
          // de permissão do filho em navigationPermissions.ts
          // (`ope-pec-man-pas` → `pastures_view`, mesmo slug já usado nas 4
          // rotas de leitura de Pastagem) — a regra do PAI (`ope-pec-man`,
          // `anyOf` com todas as permissões da família "Manejo", já inclui
          // `pastures_view`) permanece inalterada.
          {
            id: 'ope-pec-man',
            label: 'Manejo',
            path: '/operacional/manejo',
            icon: 'settings-sliders',
            children: [
              {
                id: 'ope-pec-man-pas',
                label: 'Pastagem',
                path: '/operacional/pastagem',
                icon: 'map',
              },
              // Desmama (Weaning, TASK-WN-FE-06, esteira 97-Esteiras/043) —
              // mirror EXATO da estrutura de `ope-pec-man-pas` (único filho
              // anterior). Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-man-des` →
              // `weaning_view`) — a regra do PAI (`ope-pec-man`, `anyOf`
              // já inclui `weaning_view`) permanece inalterada.
              {
                id: 'ope-pec-man-des',
                label: 'Desmama',
                path: '/operacional/desmame',
                icon: 'cattle',
              },
              // Localizar Animal (Find Animal, TASK-FA-FE-06, F-042,
              // contrato-tela-lane-a-find-animal-frontend.md §6.1/§9) —
              // mirror EXATO da estrutura de `ope-pec-man-des`/`ope-pec-man-pas`
              // (filhos anteriores). `MapPin` já importado neste arquivo
              // (nenhum import novo). Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-man-loc` →
              // `find-animal_view`) — a regra do PAI (`ope-pec-man`, `anyOf`
              // já inclui `find-animal_view`/`find-animal_create`/
              // `find-animal_edit`/`find-animal_delete`) permanece inalterada.
              {
                id: 'ope-pec-man-loc',
                label: 'Localizar Animal',
                path: '/operacional/localizar-animal',
                icon: 'location',
              },
              // Sanitário (Sanitary, TASK-SAN-FE-09, F-062, contrato-tela-
              // lane-c-sanitario-frontend.md §9) — mirror EXATO da estrutura
              // de `ope-pec-man-loc`/`ope-pec-man-des`/`ope-pec-man-pas`
              // (filhos anteriores), adicionado AO FINAL da lista, sem
              // reordenar os existentes. Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-man-san` →
              // `sanitary_view`) — a regra do PAI (`ope-pec-man`, `anyOf`)
              // já inclui `sanitary_view/create/edit/delete` (linhas
              // acima), permanece inalterada. Nenhum item de menu para o
              // relatório (`san-screen-report`) — entra pelo hub de
              // Relatórios > Pecuária, gateado só na rota (router/index.tsx).
              {
                id: 'ope-pec-man-san',
                label: 'Sanitário',
                path: '/operacional/sanitario',
                icon: 'shield',
              },
              // Pesagem (Weighing, TASK-PES-FE-08, F-071, contrato-tela-
              // lane-c-pesagem-frontend.md §9) — mirror EXATO da estrutura
              // de `ope-pec-man-san`/`-loc`/`-des`/`-pas` (filhos
              // anteriores), adicionado AO FINAL da lista, sem reordenar os
              // existentes. Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-man-pes` →
              // `weighing_view`) — a regra do PAI (`ope-pec-man`, `anyOf`)
              // já inclui `weighing_view/create/edit/delete/stock` (linhas
              // acima), permanece inalterada. Nenhum item de menu para o
              // relatório individual (`pes-action-report`) — é ação de
              // linha, download direto, sem tela própria. Ícone `Scale`
              // (balança/peso) REUSADO do import já existente no topo do
              // arquivo (usado em vários itens de "Gestão Fiscal") — nenhum
              // import novo cunhado, evitando o `Duplicate identifier`.
              {
                id: 'ope-pec-man-pes',
                label: 'Pesagem',
                path: '/operacional/pesagem',
                icon: 'scale',
              },
              // Nutrição (Nutrition, F-050, esteira 066, TASK-NT-FE-02) —
              // mirror EXATO da estrutura de `ope-pec-man-pes`/`-san`/`-loc`/
              // `-des`/`-pas` (filhos anteriores), adicionado AO FINAL da
              // lista, sem reordenar os existentes. Gate de permissão do
              // filho em navigationPermissions.ts (`ope-pec-man-nut` →
              // `nutrition_view`) — a regra do PAI (`ope-pec-man`, `anyOf`)
              // já inclui `nutrition_view/create/edit/delete`, permanece
              // inalterada. Ícone `Wheat` REUSADO (já usado para o conceito
              // "Consumo de Ração" no dashboard, `dash-rac` acima) — nenhum
              // import novo.
              {
                id: 'ope-pec-man-nut',
                label: 'Nutrição',
                path: '/operacional/nutricao',
                icon: 'grain',
              },
            ],
          },
          // "Reprodução" reestruturado de item-folha único para item-pai
          // com filhos (`GAP-BSS-FE-01`, 97-Esteiras/005 Tarefa 24) — mirror
          // EXATO do mesmo padrão já aprovado para "Manejo"/"Pastagem"
          // acima (2026-08-19): `path`/`icon` do próprio "Reprodução"
          // PRESERVADOS (clique no item-pai continua indo para Estação de
          // Monta, sem mudança); único filho adicionado é "Touros/Sêmen/
          // Embrião", apontando para a rota já registrada em
          // router/index.tsx (`/operacional/touros-semen-embriao`). Gate de
          // permissão do filho em navigationPermissions.ts
          // (`ope-pec-rep-bss` → `bull-seed-season_view`, mesmo slug já
          // pré-provisionado no `anyOf` do pai) — a regra do PAI
          // (`ope-pec-rep`, já inclui `bull-seed-season_*`) permanece
          // inalterada.
          {
            id: 'ope-pec-rep',
            label: 'Reprodução',
            path: '/operacional/reproducao',
            icon: 'heart',
            children: [
              // Estação de Monta (BreedingSeason, reportado pelo dono —
              // ausência de item clicável no submenu) — mirror EXATO do
              // padrão já aprovado para os filhos irmãos abaixo: `path`/
              // `icon` do item-pai "Reprodução" PRESERVADOS, filho novo
              // apontando para a MESMA rota do pai, já registrada em
              // router/index.tsx (`/operacional/reproducao`, componente
              // real `EstacaoDeMontaList`). Posição PRIMEIRA da lista,
              // espelhando a ordem do legado (agro365/app/Permission.php)
              // onde "Estação de Monta" vem antes de Touros/Lotes/
              // Protocolos. Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-rep-bs` →
              // `breeding-seasons_view`, mesmo slug já pré-provisionado no
              // `anyOf` do pai). Ícone `CalendarClock` reusado (já
              // importado, afinidade semântica com agendamento de estação),
              // sem import novo.
              {
                id: 'ope-pec-rep-bs',
                label: 'Estação de Monta',
                path: '/operacional/reproducao',
                icon: 'calendar-clock',
              },
              {
                id: 'ope-pec-rep-bss',
                label: 'Touros/Sêmen/Embrião',
                path: '/operacional/touros-semen-embriao',
                icon: 'lab',
              },
              // Lotes/Reprodução (BreedingBatch, 97-Esteiras/048 Tarefa 07,
              // contrato de tela §2) — mirror EXATO do padrão já aprovado
              // para o filho irmão "Touros/Sêmen/Embrião" acima: `path`/
              // `icon` do item-pai "Reprodução" PRESERVADOS, filho novo
              // adicionado apontando para a rota já registrada em
              // router/index.tsx (`/operacional/lotes-reproducao`). Gate de
              // permissão do filho em navigationPermissions.ts
              // (`ope-pec-rep-lb` → `breeding-batch_view`, mesmo slug já
              // pré-provisionado no `anyOf` do pai). Ícone `Layers` reusado
              // (já usado para "Lotes Animais", `cad-pec-lot` — mesma
              // afinidade semântica de "lote"), sem import novo.
              {
                id: 'ope-pec-rep-lb',
                label: 'Lotes/Reprodução',
                path: '/operacional/lotes-reproducao',
                icon: 'layers',
              },
              // Protocolos/Estação (ProtocolSeason, F-057, execução 040,
              // contrato de tela §4.7) — mirror EXATO do padrão já aprovado
              // para os filhos irmãos acima: `path`/`icon` do item-pai
              // "Reprodução" PRESERVADOS, filho novo apontando para a rota
              // já registrada em router/index.tsx
              // (`/operacional/protocolos-estacao`). Gate de permissão do
              // filho em navigationPermissions.ts (`ope-pec-rep-pse` →
              // `protocols-season_view`, slug já pré-provisionado no
              // `anyOf` do pai). Ícone `ClipboardList` reusado — já
              // importado, mesma afinidade semântica de "protocolo", sem
              // import novo. Posição reordenada a pedido do dono (2026-09-22):
              // entre "Lotes/Reprodução" e "Acasalamento".
              {
                id: 'ope-pec-rep-pse',
                label: 'Protocolos/Estação',
                path: '/operacional/protocolos-estacao',
                icon: 'clipboard-list',
              },
              // Acasalamento (BreedingMating, TASK-BM-FE-09, contrato-tela-
              // lane-b-breeding-mating-frontend.md §3/§9) — mirror EXATO do
              // padrão já aprovado para os filhos irmãos acima: `path`/
              // `icon` do item-pai "Reprodução" PRESERVADOS, filho novo
              // apontando para a rota já registrada em router/index.tsx
              // (`/operacional/acasalamento`). Diagnóstico de Gestação NÃO
              // ganha item de menu próprio (OWN-DEC-001, `NavSubItem.
              // children` é `Omit<NavSubItem,'children'>[]` — 3º nível
              // estruturalmente impossível) — alcançado só por dentro das
              // telas de Acasalamento. Gate de permissão do filho em
              // navigationPermissions.ts (`ope-pec-rep-bm` →
              // `breeding-matings_view`, slug já pré-provisionado no
              // `anyOf` do pai). Ícone `Heart` reusado (mesmo já usado pelo
              // pai "Reprodução" e por "Estágio Reprodutivo", afinidade
              // semântica direta com o domínio), sem import novo.
              {
                id: 'ope-pec-rep-bm',
                label: 'Acasalamento',
                path: '/operacional/acasalamento',
                icon: 'heart',
              },
              // Gerenciamento Avançado (AdvancedReproductive, F-011,
              // 97-Esteiras/056 TASK-AR-FE-03) — mirror EXATO do padrão já
              // aprovado para os filhos irmãos "Touros/Sêmen/Embrião"/
              // "Lotes/Reprodução" acima: `path`/`icon` do item-pai
              // "Reprodução" PRESERVADOS, filho novo adicionado apontando
              // para a rota já registrada em router/index.tsx
              // (`/operacional/gerenciamento-avancado`). Gate de permissão
              // do filho em navigationPermissions.ts (`ope-pec-rep-adv` →
              // `advanced-reproductive_view`, mesmo slug já pré-provisionado
              // no `anyOf` do pai, linha 537). Ícone `ClipboardList` reusado
              // (já importado/usado alhures neste arquivo), sem import novo.
              {
                id: 'ope-pec-rep-adv',
                label: 'Gerenciamento Avançado',
                path: '/operacional/gerenciamento-avancado',
                icon: 'clipboard-list',
              },
            ],
          },
          // Confinamento (pedido do dono, homologação Dieta, 2026-08-20):
          // caminho ALVO pedido era Pecuária → Confinamento → Nutrição →
          // Dieta → {Dietas, Batidas} (6 segmentos) — CONFIRMADO
          // INVIÁVEL no renderer atual (`SecondaryNav.tsx`): `NavGroup`
          // só expande 2 níveis por item (`NavItemButton` renderiza
          // `item.children` como botões PLANOS, sem chevron/expand
          // próprio, e sem chamar `NavItemButton` recursivamente); o
          // próprio tipo `NavSubItem.children` é
          // `Omit<NavSubItem, "children">[]` — um filho NUNCA pode ter
          // filho (bloqueio de TIPO, não só de renderer). Path pedido
          // precisa de 3 níveis novos (Confinamento/Nutrição/Dieta) entre
          // o grupo "Pecuária" e as folhas Dietas/Batidas; só 1 cabe.
          //
          // Opção aplicada (mais próxima que RENDERIZA de fato, pendente
          // de confirmação do dono — reportado ao Maestro): fundir
          // Confinamento+Nutrição+Dieta neste ÚNICO item (rótulo
          // "Confinamento", o mais externo pedido), preservando 100% os
          // filhos-folha (`ope-pec-die-die`/`ope-pec-die-bat`, mesmos
          // ids/labels/paths/ícones de antes — nenhuma tela nem rota
          // muda). Alternativa igualmente válida, NÃO aplicada: usar
          // "Nutrição" (ícone `Package2`, já usado para o conceito em
          // `dash-nut`) em vez de "Confinamento" como rótulo único —
          // decisão de nomenclatura do dono, não do Executor.
          // Mirror estrutural (2 níveis) preservado do padrão "Fábrica"
          // (Food/FoodBeat, navigationTree.ts:481-486) e do antigo
          // "Dieta" que este item substitui.
          {
            id: 'ope-pec-conf',
            label: 'Confinamento',
            path: '/operacional/dietas',
            icon: 'warehouse',
            children: [
              { id: 'ope-pec-die-die', label: 'Dietas', path: '/operacional/dietas', icon: 'nutrition' },
              {
                id: 'ope-pec-die-bat',
                label: 'Batidas',
                path: '/operacional/dietas/batidas',
                icon: 'blend',
              },
              // Pátios (FeedlotYard, TASK-PT-FE-01, execução 046) — 3º
              // item-folha do grupo, único que RENDERIZA sob o limite de 2
              // níveis do SecondaryNav (ver comentário acima sobre a fusão
              // Confinamento+Nutrição+Dieta). Ícone `Warehouse` reaproveitado
              // do próprio grupo pai (sem ícone lucide-react mais específico
              // já importado neste arquivo para "pátio de confinamento") —
              // decisão mecânica, default aplicado, sinalizada para
              // confirmação rápida do dono (contrato de tela §"Leitura do
              // dev" item 1).
              {
                id: 'ope-pec-die-pat',
                label: 'Pátios',
                path: '/operacional/patios',
                icon: 'warehouse',
              },
              // Setores (FeedlotSector, TASK-FS-FE-01) — 4º item-folha do
              // grupo, ao lado de Pátios (mirror exato do precedente
              // acima). Ícone `Warehouse` reaproveitado do grupo pai/de
              // "Pátios" (sem ícone lucide-react mais específico já
              // importado neste arquivo para "subdivisão/setor") — decisão
              // mecânica, default aplicado (contrato de tela §"Leitura do
              // dev" item 2).
              {
                id: 'ope-pec-die-set',
                label: 'Setores',
                path: '/operacional/setores',
                icon: 'warehouse',
              },
              // Currais (FeedlotCorral, MANUTENÇÃO FRONT — rota
              // `/operacional/currais` já existia em router/index.tsx
              // (`FeedlotCorralList`, permissão `feedlot-corrals_view`) sem
              // entrada de menu correspondente, GAP DE MENU. Mirror exato de
              // Pátios/Setores acima (mesmo grupo, mesmo ícone reaproveitado
              // `Warehouse` — sem ícone lucide-react mais específico já
              // importado neste arquivo para "curral"). Posicionado
              // imediatamente após Setores, mesma vizinhança temática
              // (subdivisões físicas do confinamento: Pátios → Setores →
              // Currais).
              {
                id: 'ope-pec-die-cur',
                label: 'Currais',
                path: '/operacional/currais',
                icon: 'warehouse',
              },
              // Mapa de Confinamento (FeedlotMap, TASK-FE-042-200, execução
              // 042) — 5º item-folha do grupo, ao lado de Pátios/Setores.
              // Ícone `Map` (já importado neste arquivo, ver `dash-nut`) —
              // afinidade semântica direta com a árvore espacial da tela.
              {
                id: 'ope-pec-mapa',
                label: 'Mapa de Confinamento',
                path: '/operacional/mapa',
                icon: 'map',
              },
              // Fases de Alimentação (FeedingPhase, F-034, TASK-FP-FE-04) —
              // 5º item-folha do grupo, default proposto pelo contrato de
              // tela §7 (folha irmã de Dietas/Batidas no mesmo grupo de
              // Nutrição/Confinamento — mesma limitação de profundidade do
              // renderer já documentada acima, sem 3 níveis novos
              // disponíveis). Ícone `CalendarClock` (já importado acima,
              // reusado de `fro-rev`) — afinidade semântica com fases
              // programadas por dias/peso.
              {
                id: 'ope-pec-die-fas',
                label: 'Fases de Alimentação',
                path: '/operacional/fases-alimentacao',
                icon: 'calendar-clock',
              },
            ],
          },
          // Item NOVO (97-Esteiras/005 Tarefa 24, frontend-contract-apartacao.md
          // §2.1, GAP-APARTACAO-FE-01) — item PRÓPRIO irmão de
          // `ope-pec-nas`/`ope-pec-ven`/`ope-pec-man`, inserido AO FINAL do
          // array (após `ope-pec-conf`) para minimizar sobreposição de diff
          // com a feature irmã Touros/Sêmen/Embrião, que também toca este
          // bloco (`ope-pec-rep`, acima).
          { id: 'ope-pec-apa', label: 'Apartação', path: '/operacional/apartacao', icon: 'git-branch' },
        ],
      },
      {
        id: 'ope-pluviometria',
        label: 'Pluviometria',
        icon: 'rain',
        items: [
          {
            id: 'ope-plu',
            label: 'Pluviometria',
            path: '/operacional/pluviometria',
            icon: 'rain',
          },
        ],
      },
      {
        id: 'ope-vendas',
        label: 'Vendas',
        icon: 'shopping-bag',
        items: [
          {
            id: 'ope-ven-orc',
            label: 'Orçamentos',
            path: '/operacional/orcamentos',
            icon: 'calculator',
          },
          {
            id: 'ope-ven-ped',
            label: 'Pedidos',
            path: '/operacional/pedidos',
            icon: 'clipboard-list',
          },
          { id: 'ope-ven-ven', label: 'Vendas', path: '/operacional/vendas', icon: 'shopping-bag' },
        ],
      },
      {
        id: 'ope-ordens',
        label: 'Ordens de Serviço',
        icon: 'clipboard-check',
        items: [
          {
            id: 'ope-os-min',
            label: 'Minhas OS',
            path: '/operacional/minhas-os',
            icon: 'clipboard-check',
          },
          {
            id: 'ope-os-lis',
            label: 'Lista de OS',
            path: '/operacional/lista-os',
            icon: 'list-checks',
          },
          {
            id: 'ope-os-mon',
            label: 'Monitoramento',
            path: '/operacional/monitoramento',
            icon: 'activity',
          },
          { id: 'ope-os-ava', label: 'Avaliações', path: '/operacional/avaliacoes', icon: 'star' },
        ],
      },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    emoji: '💰',
    icon: 'wallet',
    groups: [
      {
        id: 'fin-principal',
        label: 'Financeiro',
        icon: 'wallet',
        items: [
          {
            id: 'fin-pag',
            label: 'Contas a Pagar',
            path: '/financeiro/pagar',
            icon: 'arrow-up-circle',
          },
          {
            id: 'fin-rec',
            label: 'Contas a Receber',
            path: '/financeiro/receber',
            icon: 'arrow-down-circle',
          },
          {
            id: 'fin-cai',
            label: 'Mov. Caixa / Bancário',
            path: '/financeiro/caixa',
            icon: 'wallet',
          },
          { id: 'fin-flu', label: 'Fluxo Bancário', path: '/financeiro/fluxo', icon: 'bank' },
          {
            id: 'fin-con',
            label: 'Gestão de Contratos',
            path: '/financeiro/contratos',
            icon: 'signature',
          },
          {
            id: 'fin-pre',
            label: 'Prev. Orçamentária',
            path: '/financeiro/previsao',
            icon: 'chart-line',
          },
          {
            id: 'fin-cng',
            label: 'Congelamentos Financeiros',
            path: '/financeiro/congelamentos',
            icon: 'lock',
          },
          {
            id: 'fin-imp',
            label: 'Importação Mov. Bancários',
            path: '/financeiro/importacao',
            icon: 'upload',
          },
        ],
      },
      {
        id: 'fin-conciliacao',
        label: 'Conciliação',
        icon: 'git-merge',
        items: [
          { id: 'fin-cnc-ofx', label: 'Importação OFX', path: '/financeiro/ofx', icon: 'upload' },
          {
            id: 'fin-cnc-mes',
            label: 'Meses Conciliados',
            path: '/financeiro/meses-conciliados',
            icon: 'calendar-check',
          },
        ],
      },
    ],
  },
  {
    id: 'frota',
    label: 'Gestão de Frota',
    emoji: '🚜',
    icon: 'truck',
    flatItems: [
      { id: 'fro-man', label: 'Manutenções', path: '/frota/manutencoes', icon: 'wrench' },
      { id: 'fro-aba', label: 'Abastecimentos', path: '/frota/abastecimentos', icon: 'fuel' },
      {
        id: 'fro-pre',
        label: 'Manutenções Preventivas',
        path: '/frota/preventivas',
        icon: 'shield-check',
      },
      { id: 'fro-rev', label: 'Revisões Agendadas', path: '/frota/revisoes', icon: 'calendar-clock' },
      {
        id: 'fro-tra',
        label: 'Transferência de Máquinas',
        path: '/frota/transferencias',
        icon: 'arrow-left-right',
      },
    ],
  },
  {
    id: 'fiscal',
    label: 'Gestão Fiscal',
    emoji: '📄',
    icon: 'receipt',
    groups: [
      {
        id: 'fis-nfe',
        label: 'NF-e',
        icon: 'document',
        items: [
          {
            id: 'fis-nfe-emi',
            label: 'NFe Emitidas',
            path: '/fiscal/nfe-emitidas',
            icon: 'document-check',
          },
          { id: 'fis-nfe-xml', label: 'Arquivos XML', path: '/fiscal/xml', icon: 'document-code' },
          // Path CORRIGIDO (execução 044, TASK-DFE-FE-11): apontava para
          // `/fiscal/dfe` (singular, placeholder pré-existente sem tela
          // real por trás — caía no `RoutePlaceholder`); a rota REAL desta
          // Tarefa é `/fiscal/dfes` (plural, `router/index.tsx`).
          { id: 'fis-nfe-dfe', label: 'DFe Recebidas', path: '/fiscal/dfes', icon: 'inbox' },
        ],
      },
      {
        id: 'fis-cte',
        label: 'CT-e',
        icon: 'truck',
        items: [
          // Path CORRIGIDO (execução 045): apontava para `/fiscal/cte-lista`/
          // `/fiscal/cte-nova` (placeholders pré-existentes sem tela real
          // por trás — caíam no `RoutePlaceholder`); as rotas REAIS desta
          // Tarefa são `/fiscal/ctes`/`/fiscal/ctes/create`
          // (`router/index.tsx`, mesmo path hardcoded internamente pelos
          // `navigate()` de `Cte/index.tsx`/`Cte/HeaderTable.tsx`).
          { id: 'fis-cte-lis', label: 'Lista de CTe', path: '/fiscal/ctes', icon: 'list-checks' },
          { id: 'fis-cte-nov', label: 'Nova CTe', path: '/fiscal/ctes/create', icon: 'document-add' },
          {
            id: 'fis-cte-man',
            label: 'Manifestar CTe',
            path: '/fiscal/cte-manifestar',
            icon: 'signature',
          },
        ],
      },
      {
        id: 'fis-mdfe',
        label: 'MDF-e',
        icon: 'documents',
        items: [
          {
            id: 'fis-mdf-lis',
            label: 'Lista de MDFe',
            path: '/fiscal/mdfe-lista',
            icon: 'list-checks',
          },
          { id: 'fis-mdf-nov', label: 'Nova MDFe', path: '/fiscal/mdfe-nova', icon: 'document-add' },
        ],
      },
      {
        id: 'fis-outros',
        label: 'Outros',
        icon: 'more-horizontal',
        items: [
          // Path CORRIGIDO (execução 045): apontava para `/fiscal/lcdpr`
          // (placeholder pré-existente sem tela real por trás — caía no
          // `RoutePlaceholder`); a rota REAL desta Tarefa é
          // `/fiscal/livro-caixa` (`router/index.tsx`, mesmo path
          // hardcoded internamente pelos `navigate()` de `CashBook/*.tsx`).
          // SEM dashboard do LCDPR — excluído desta Tarefa (decisão de
          // escopo).
          {
            id: 'fis-lcd',
            label: 'LCDPR — Livro Caixa Digital',
            path: '/fiscal/livro-caixa',
            icon: 'book',
          },
          {
            id: 'fis-par',
            label: 'Partida Dobrada',
            path: '/fiscal/partida-dobrada',
            icon: 'git-compare',
          },
        ],
      },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    emoji: '📋',
    icon: 'chart-column',
    flatItems: [
      // "Bens / Ativo" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (F-260, TASK-INV-FE-02, esteira 075) — mirror
      // EXATO do mesmo padrão já aprovado para "Agricultura"/"Pecuária"/
      // "Financeiro"/"Gestão Fiscal" abaixo: `path`/`icon` do próprio "Bens /
      // Ativo" PRESERVADOS (cai no RoutePlaceholder de `/relatorios/*`,
      // mesmo comportamento de hoje — nenhuma tela própria no nível do
      // grupo); único filho adicionado é "Inventário", apontando para a
      // rota NOVA `/relatorios/bens/inventario`. Gate de permissão do filho
      // em navigationPermissions.ts (`rel-ben-inventario` →
      // `equipments_report`, já no `anyOf` do pai).
      {
        id: 'rel-ben',
        label: 'Bens / Ativo',
        path: '/relatorios/bens',
        icon: 'package',
        children: [
          {
            id: 'rel-ben-inventario',
            label: 'Inventário',
            path: '/relatorios/bens/inventario',
            icon: 'clipboard-list',
          },
          // Depreciação Acumulada (F-216, execução 059,
          // CONTRATO-F216-depreciacao-acumulada.md §6) — mirror EXATO do
          // padrão `rel-ben-inventario` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-ben-depreciacao-acumulada` →
          // `accumulateddepreciationreport_view`, JÁ no `anyOf` do pai
          // `rel-ben` — nenhuma edição adicional lá). Ícone `TrendingDown`
          // (semântica de depreciação/valor decrescente, já importado neste
          // arquivo) — LIVRE dentro do grupo `rel-ben` (só usa `ClipboardList`
          // até aqui).
          {
            id: 'rel-ben-depreciacao-acumulada',
            label: 'Depreciação Acumulada',
            path: '/relatorios/bens/depreciacao-acumulada',
            icon: 'trend-down',
          },
        ],
      },
      // "Agricultura" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (Tarefa 46, frontend-contract-apontamento-
      // maquina.md §2) — mirror EXATO do mesmo padrão já aprovado para
      // "Pecuária"/"Financeiro"/"Gestão Fiscal" abaixo: `path`/`icon` do
      // próprio "Agricultura" PRESERVADOS (cai no RoutePlaceholder de
      // `/relatorios/*`, mesmo comportamento de hoje — nenhuma tela própria
      // no nível do grupo); único filho adicionado é "Apontamento Máquina",
      // apontando para a rota NOVA `/relatorios/agricultura/apontamento-
      // maquina`. Gate de permissão do filho em navigationPermissions.ts
      // (`rel-agr-apo` → `appropriation_equipments_report`, já no `anyOf`
      // do pai). Este bucket reserva ~38 relatórios futuros de Agricultura —
      // só o filho desta feature é adicionado aqui.
      {
        id: 'rel-agr',
        label: 'Agricultura',
        path: '/relatorios/agricultura',
        icon: 'grain',
        children: [
          {
            id: 'rel-agr-apo',
            label: 'Apontamento Máquina',
            path: '/relatorios/agricultura/apontamento-maquina',
            icon: 'truck',
          },
          // Ocorrências Talhões (F-232, Tarefa 50, esteira
          // CORE_WORKSPACE/97-Esteiras/015): 2º filho de "Agricultura"
          // (`rel-agr-ocor`), logo após `rel-agr-apo` (mesmo domínio de
          // Apropriação/Agricultura). Gate de permissão em
          // navigationPermissions.ts (`rel-agr-ocor` →
          // `appropriation-occurrences-report_view`, já no `anyOf` do pai
          // `rel-agr` acima — nenhuma edição lá). Ícone `AlertTriangle` já
          // importado, LIVRE dentro do grupo `rel-agr`.
          {
            id: 'rel-agr-ocor',
            label: 'Ocorrências Talhões',
            path: '/relatorios/agricultura/ocorrencias-talhoes',
            icon: 'warning',
          },
          // Prev. Área/Receita (F-280, TASK-MFA-FE-03, esteira 075): 2º
          // filho de "Agricultura" (`rel-agr-prev`). Gate de permissão em
          // navigationPermissions.ts (`markings_prev_area_view`, já no
          // `anyOf` do pai `rel-agr` — nenhuma edição lá).
          {
            id: 'rel-agr-prev',
            label: 'Prev. Área/Receita',
            path: '/relatorios/agricultura/previsao-area-receita',
            icon: 'trend-up',
          },
          // Pesagem Rodoviária (F-284, ajuste do lote 075): 3º filho de
          // "Agricultura", mirror EXATO do padrão de `rel-agr-prev` acima.
          // A tela (`ModuleWeighingRelatorio`) já existe e é reusada — só
          // ganha um 2º ponto de entrada, agora também em Relatórios →
          // Agricultura (continua acessível de dentro de Operacional em
          // `/operacional/pesagem-rodoviaria/relatorio`, sem alteração ali).
          // Ícone `Scale` mirror do mesmo usado para "Pesagem Rodoviária"
          // em Operacional (linha ~1524) — já importado, sem colisão. Gate
          // de permissão em navigationPermissions.ts (`rel-agr-pesagem-
          // rodoviaria` → `module-weighings_report`, já no `anyOf` do pai
          // `rel-agr` — nenhuma edição lá).
          {
            id: 'rel-agr-pesagem-rodoviaria',
            label: 'Pesagem Rodoviária',
            path: '/relatorios/agricultura/pesagem-rodoviaria',
            icon: 'scale',
          },
          // Produção/Custeio/Área (F-298, esteira 051, TASK-298-FE-03) —
          // CANÁRIO da tela de relatório em código para o fan-out (F-279/
          // F-238/F-315/F-326), mirror EXATO do padrão `rel-agr-apo` acima.
          // Rótulo do MENU ("Produção/Custo/Área") DIVERGE de propósito do
          // título da tela/PDF ("Produção/Custeio/Área", C-13 — fidelidade
          // ao legado, os 2 textos nunca foram sincronizados). Gate de
          // permissão em navigationPermissions.ts (`rel-agr-pca` →
          // `production_cost_area_view`, já no `anyOf` do pai `rel-agr`).
          {
            id: 'rel-agr-pca',
            label: 'Produção/Custo/Área',
            path: '/relatorios/agricultura/producao-custeio-area',
            icon: 'calculator',
          },
          // Custeio/Área (F-252, lote 079, F-252-plano-frontend.md
          // TASK-252-FE-03) — tela NOVA, distinta de `rel-agr-pca` acima
          // (F-298, rota/controller/permissão diferentes, §0 do roteiro).
          // Rótulo mirror do texto legado `trad.custeio_area` = "Custeio/
          // Área" (confirmado por leitura direta de
          // `agro365/lang/pt-BR/trad.php:139`). `Calculator` já está tomado
          // pelo irmão `rel-agr-pca` dentro do MESMO grupo — `Coins` (já
          // importado, usado hoje só no grupo `rel-pec`) confirmado sem
          // colisão visual dentro de `rel-agr`, afinidade semântica com
          // custeio. Gate de permissão em navigationPermissions.ts
          // (`rel-agr-cus` → `cost_area_view`, já no `anyOf` do pai
          // `rel-agr`, linha ~896 — NENHUMA edição lá).
          {
            id: 'rel-agr-cus',
            label: 'Custeio/Área',
            path: '/relatorios/agricultura/custeio-area',
            icon: 'banknote',
          },
          // Prod./Área (F-299, 97-Esteiras/012, Tarefa 47,
          // frontend-contract-prod-area.md §2.2) — irmão de
          // "Apontamento Máquina", mesma estrutura. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-pro` → `prod_area_view`, já
          // no `anyOf` do pai `rel-agr`). Rótulo "Prod./Área" — decisão
          // registrada (`C-06`/`C-18`, DF-03): nome da feature no seed
          // legado e no backlog F-299; título da tela é "Produção por Área".
          {
            id: 'rel-agr-pro',
            label: 'Prod./Área',
            path: '/relatorios/agricultura/producao-por-area',
            icon: 'fence',
          },
          // Pesagens/Colheita (F-335, execução 053, roteiro-front-F335-
          // pesagens-colheita.md) — irmão de "Prod./Área", mesma estrutura.
          // Gate de permissão em navigationPermissions.ts (`rel-agr-pes` →
          // `weighing-harvest_report`, já no `anyOf` do pai `rel-agr` acima
          // — sem edição no `anyOf`). Ícone `Scale` já importado neste
          // arquivo (usado em outros grupos para itens de pesagem) — LIVRE
          // dentro do grupo `rel-agr`, sem colisão com
          // `Tractor`/`Calculator`/`LandPlot` já usados aqui.
          {
            id: 'rel-agr-pes',
            label: 'Pesagens/Colheita',
            path: '/relatorios/agricultura/pesagens-colheita',
            icon: 'scale',
          },
          // Romaneio/Vendas/Contrato (F-331, 97-Esteiras/008, TASK-RVC-FE-02)
          // — irmão de "Pesagens/Colheita", posicionado logo após (espelha a
          // vizinhança legada). Gate de permissão em
          // navigationPermissions.ts (`rel-agr-rvc` →
          // `transfer-sales-contract_report`, já no `anyOf` do pai `rel-agr`
          // acima — sem edição no `anyOf`). Ícone `FileText` já importado
          // neste arquivo, sem colisão com `Tractor`/`Calculator`/
          // `LandPlot`/`Scale`/`LineChart` já usados neste grupo.
          {
            id: 'rel-agr-rvc',
            label: 'Romaneio/Vendas/Contrato',
            path: '/relatorios/agricultura/romaneio-vendas-contrato',
            icon: 'document',
          },
          // Previsão Fazenda/Receita (F-281, esteira 97-Esteiras/055) —
          // mirror EXATO do padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-pfr` →
          // `markings_prev_farm_view`, JÁ no `anyOf` do pai `rel-agr` —
          // nenhuma edição adicional lá). Ícone `LineChart` já importado —
          // não colide com `Tractor`/`Calculator`/`LandPlot`/`Scale` já em
          // uso NESTE grupo.
          {
            id: 'rel-agr-pfr',
            label: 'Prev. Fazenda/Receita',
            path: '/relatorios/agricultura/previsao-fazenda-receita',
            icon: 'chart-line',
          },
          // Romaneio Cliente (F-332, esteira 97-Esteiras/058,
          // FRONT-F332-plano.md §2.1) — mirror EXATO do padrão dos irmãos
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-agr-romaneio-cliente` → `transfers_view`,
          // permissão NOVA dedicada — incluída no `anyOf` do pai `rel-agr`
          // abaixo). Ícone `FileText` — não usado ainda em `rel-agr`
          // (grupo já usa `Tractor`/`TrendingUp`/`Scale`/`Calculator`/
          // `LandPlot`/`LineChart`), já importado neste arquivo, sem
          // colisão de import.
          {
            id: 'rel-agr-romaneio-cliente',
            label: 'Romaneio Cliente',
            path: '/relatorios/agricultura/romaneio-cliente',
            icon: 'document',
          },
          // Pesagem Entrada/Saída (F-336, esteira 97-Esteiras/058,
          // FRONT-F336-plano.md §2.1) — mirror EXATO do padrão dos irmãos
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-agr-pesagem-entrada-saida` → `weighing-in-out_report`, já
          // no `anyOf` do pai `rel-agr` acima — não duplicar). Ícone `Scale`
          // já importado neste arquivo (usado 2× no grupo para
          // "Pesagem Rodoviária"/"Pesagens/Colheita"), sem colisão.
          {
            id: 'rel-agr-pesagem-entrada-saida',
            label: 'Pesagem Entrada/Saída',
            path: '/relatorios/agricultura/pesagem-entrada-saida',
            icon: 'scale',
          },
          // Rentabilidade/Cultura (F-302, esteira 077, F-302-plano-front.md
          // §6) — mirror EXATO do padrão dos irmãos acima. Gate de permissão
          // em navigationPermissions.ts (`rel-agr-ren` →
          // `profitability-by-crop_report`, JÁ no `anyOf` do pai `rel-agr`
          // acima — nenhuma edição adicional lá). Ícone `Percent` já
          // importado neste arquivo (usado em outros grupos) — LIVRE dentro
          // do grupo `rel-agr`, sem colisão com
          // `Tractor`/`TrendingUp`/`Scale`/`Calculator`/`LandPlot`/`LineChart`
          // já em uso NESTE grupo.
          {
            id: 'rel-agr-ren',
            label: 'Rentabilidade/Cultura',
            path: '/relatorios/agricultura/rentabilidade-cultura',
            icon: 'percent',
          },
          // Descarte Romaneio (F-256, esteira 078, F-256-plano-frontend.md)
          // — mirror EXATO do padrão dos irmãos acima. Evidência legada
          // (`sidebar.blade.php:2202`, `route('discards.report')`) prova que
          // este item vive dentro de `#productionReport` (Relatórios de
          // Produção), irmão imediato de "Pesagem Rodoviária" — por isso
          // Agricultura (`rel-agr`), NÃO Estoque. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-descarte-romaneio` →
          // `discards_report`, JÁ no `anyOf` do pai `rel-agr` acima —
          // nenhuma edição adicional lá). Ícone `Recycle` já importado neste
          // arquivo — LIVRE dentro do grupo `rel-agr`, sem colisão com os
          // demais ícones já em uso NESTE grupo.
          {
            id: 'rel-agr-descarte-romaneio',
            label: 'Descarte Romaneio',
            path: '/relatorios/agricultura/descarte-romaneio',
            icon: 'repeat',
          },
          // Romaneio/Diferença (Tarefa 49, esteira 97-Esteiras/014,
          // front-architecture-romaneio-diferenca.md §2) — mirror EXATO do
          // padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-rom-dif` →
          // `transfer_difference_report`, JÁ no `anyOf` do pai `rel-agr`
          // acima — nenhuma edição adicional lá). Rota da API SEM gate
          // (`GAP-RMD-02`/`DEC-043`, preservado AS-IS) — só o item de MENU é
          // gateado (mirror `rel-pec-evo`/`GAP-EVO-01`). Ícone
          // `ArrowLeftRight` já importado neste arquivo — LIVRE dentro do
          // grupo `rel-agr`, sem colisão com os ícones já usados aqui.
          {
            id: 'rel-agr-rom-dif',
            label: 'Romaneio/Diferença',
            path: '/relatorios/agricultura/romaneio-diferenca',
            icon: 'transfer',
          },
          // Prod./Colaborador (F-300, esteira 97-Esteiras/079,
          // F-300-plano-frontend.md TASK-300-FE-03) — mirror EXATO do padrão
          // dos irmãos acima. Gate de permissão em navigationPermissions.ts
          // (`rel-agr-poc` → `prod_employee_view`, JÁ no `anyOf` do pai
          // `rel-agr` acima — nenhuma edição adicional lá). Ícone `Users` já
          // importado neste arquivo (usado em outros grupos) — LIVRE dentro
          // do grupo `rel-agr`, sem colisão com os demais ícones já em uso
          // NESTE grupo.
          {
            id: 'rel-agr-poc',
            label: 'Prod./Colaborador',
            path: '/relatorios/agricultura/producao-colaborador',
            icon: 'users',
          },
          // Previsão Colheita/Área (F-282, esteira 059,
          // CONTRATO-F282-previsao-colheita-area.md §5) — mirror EXATO do
          // padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-prev-colheita-area` →
          // `markings_prev_farm_view`, JÁ no `anyOf` do pai `rel-agr` acima —
          // MESMA permissão de `rel-agr-pfr`, nenhuma edição adicional lá).
          // Ícone `Sprout` (semântica de colheita/safra, já importado neste
          // arquivo) — LIVRE dentro do grupo `rel-agr`.
          {
            id: 'rel-agr-prev-colheita-area',
            label: 'Previsão Colheita/Área',
            path: '/relatorios/agricultura/previsao-colheita-area',
            icon: 'sprout',
          },
          // Aplicação/Manejo Talhões (F-220, execução 059,
          // CONTRATO-F220-aplicacao-manejo-talhoes.md) — mirror EXATO do
          // padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-agr-aplicacao-manejo-talhoes` →
          // `agriculture-application-management-report_view`, JÁ no `anyOf`
          // do pai `rel-agr` acima — nenhuma edição adicional lá). Ícone
          // `ClipboardList` (semântica de manejo/aplicação, já importado
          // neste arquivo) — LIVRE dentro do grupo `rel-agr`.
          {
            id: 'rel-agr-aplicacao-manejo-talhoes',
            label: 'Aplicação/Manejo Talhões',
            path: '/relatorios/agricultura/aplicacao-manejo-talhoes',
            icon: 'clipboard-list',
          },
        ],
      },
      // "Pecuária" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (Tarefa 27, spa-contract-evolucao-rebanho.md
      // §3.1) — mirror EXATO do mesmo padrão já aprovado para "Manejo"/
      // "Pastagem" e "Reprodução"/"Touros" em Operacional (acima):
      // `path`/`icon` do próprio "Pecuária" PRESERVADOS; único filho
      // adicionado é "Evolução/Rebanho", apontando para a rota NOVA
      // `/relatorios/pecuaria/evolucao-rebanho` (Tarefa 27). Gate de
      // permissão do filho em navigationPermissions.ts (`rel-pec-evo` →
      // `evolution-animal-report_view`, já no `anyOf` do pai) — mirror
      // EXATO do gate que o próprio legado aplicava no MENU
      // (`GAP-EVO-FE-04`). Este bucket reserva ~38 relatórios futuros de
      // Pecuária — só o filho desta feature é adicionado aqui.
      {
        id: 'rel-pec',
        label: 'Pecuária',
        path: '/relatorios/pecuaria',
        icon: 'cattle',
        children: [
          {
            id: 'rel-pec-evo',
            label: 'Evolução/Rebanho',
            path: '/relatorios/pecuaria/evolucao-rebanho',
            icon: 'trend-up',
          },
          // Vacas Prenhas (Tarefa 46, frontend-contract-vacas-prenhas.md
          // §2.2) — preserva o item de MENU dedicado que o legado tinha
          // (SR-2), mirror EXATO do padrão `rel-pec-evo` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-pec-vac` →
          // `pregnancy-diagnosis_view`, já no `anyOf` do pai `rel-pec`).
          // Ícone `HeartPulse` (não `Baby`/`Stethoscope` — já usados em
          // Nascimentos/Diagnóstico Gestação, evita duplicar ícone na árvore).
          {
            id: 'rel-pec-vac',
            label: 'Vacas Prenhas',
            path: '/relatorios/pecuaria/vacas-prenhas',
            icon: 'activity',
          },
          // Performance Animal (F-234, TASK-FE-PA-01, Tarefa 57) — mirror
          // EXATO do padrão `rel-pec-evo`/`rel-pec-vac` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-pec-pfa` →
          // `batch-profitability-report_view`, já presente no `anyOf` do pai
          // `rel-pec`, nenhuma alteração necessária ali). Ícone `DollarSign`
          // (não `TrendingUp`/`HeartPulse` — já usados pelos 2 irmãos acima,
          // evita duplicar ícone nesta subárvore).
          {
            id: 'rel-pec-pfa',
            label: 'Performance Animal',
            path: '/relatorios/pecuaria/performance-animal',
            icon: 'currency',
          },
          // Manejo/Lote (F-279, esteira 051, TASK-279-FE-03) — fan-out do
          // canário `rel-agr-pca` (F-298), mirror EXATO do padrão
          // `rel-pec-vac` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-man` →
          // `management-batch-report_view`, já no `anyOf` do pai `rel-pec`).
          // Ícone `ClipboardList` (não `TrendingUp`/`HeartPulse`, já usados
          // neste grupo) — afinidade semântica com o domínio (relatório de
          // manejo agrupado por categoria/lote).
          {
            id: 'rel-pec-man',
            label: 'Manejo/Lote',
            path: '/relatorios/pecuaria/manejo-lote',
            icon: 'clipboard-list',
          },
          // Pesagem/Lote (Tarefa 49, esteira CORE_WORKSPACE/97-Esteiras/014)
          // — item de MENU novo, mirror EXATO do padrão `rel-pec-man` acima.
          // Gate de permissão em navigationPermissions.ts (`rel-pec-pes` →
          // `accumulated-weighing-batch-report_view`, já no `anyOf` do pai
          // `rel-pec`). Ícone `Scale` — já importado neste arquivo, usado em
          // itens de pesagem de outros grupos, NENHUM irmão dentro de
          // `rel-pec` usa este ícone (sem colisão).
          {
            id: 'rel-pec-pes',
            label: 'Pesagem/Lote',
            path: '/relatorios/pecuaria/pesagem-lote',
            icon: 'scale',
          },
          // Animais por Lote (Tarefa 51, esteira
          // CORE_WORKSPACE/97-Esteiras/015) — item de MENU novo, mirror
          // EXATO do padrão `rel-pec-pes` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-apl` →
          // `animals-per-batch-report_view`, já no `anyOf` do pai
          // `rel-pec`, linha 1052). Ícone `Boxes` — já importado neste
          // arquivo, sem colisão com nenhum irmão dentro de `rel-pec`.
          {
            id: 'rel-pec-apl',
            label: 'Animais por Lote',
            path: '/relatorios/pecuaria/animais-por-lote',
            icon: 'stock',
          },
          // Ficha Animal (F-225, 97-Esteiras/012, Tarefa 47,
          // frontend-contract-ficha-animal.md §2.2) — preserva o item de
          // MENU dedicado que o legado tinha (`EV-26`,
          // sidebar.blade.php:2898-2904), mirror EXATO do padrão
          // `rel-pec-vac` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-fic` →
          // `animal-record-report_view`, já no `anyOf` do pai `rel-pec`).
          // Ícone `FileText` — não `HeartPulse`/`TrendingUp` (já em uso no
          // mesmo bucket).
          {
            id: 'rel-pec-fic',
            label: 'Ficha Animal',
            path: '/relatorios/pecuaria/ficha-animal',
            icon: 'document',
          },
          // Histórico Reprodutivo (execução 074,
          // historico-reprodutivo-contrato-front.md §6) — mirror EXATO do
          // padrão `rel-pec-vac` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-hist` →
          // `reproductive-history-report_view`, já no `anyOf` do pai
          // `rel-pec`, linha 959 — nenhum workaround necessário, diferente
          // do sibling `rel-pec-vac`/`GAP-VACAS-01`).
          {
            id: 'rel-pec-hist',
            label: 'Histórico Reprodutivo',
            path: '/relatorios/pecuaria/historico-reprodutivo',
            icon: 'clock',
          },
          // Custeio/Lote (execução 074, custeio-lote-contrato-front.md §6)
          // — mirror EXATO do padrão `rel-pec-vac`/`rel-pec-hist` acima.
          // Gate de permissão em navigationPermissions.ts (`rel-pec-cus` →
          // `costing-batch-report_view`, JÁ no `anyOf` do pai `rel-pec`,
          // linha 954 — nenhum workaround necessário, diferente do sibling
          // `rel-pec-vac`/`GAP-VACAS-01`). Rótulo/agrupamento conferidos
          // contra o legado (`sidebar.blade.php:2962-2969`, submenu
          // "Relatórios" de "Pecuária", ao lado de "Sanitário/Lote"/
          // "Custeio/Área").
          {
            id: 'rel-pec-cus',
            label: 'Custeio/Lote',
            path: '/relatorios/pecuaria/custeio-lote',
            icon: 'banknote',
          },
          // Custeio/Animal (F-248, esteira 075,
          // CusteioAnimal-contrato-front.md §6) — mirror EXATO do padrão
          // `rel-pec-cus` acima, agrupamento "Custeio" contíguo. Gate de
          // permissão em navigationPermissions.ts (`rel-pec-cus-an` →
          // `costing-animal-report_view`, JÁ no `anyOf` do pai `rel-pec`,
          // linha 956 — nenhum workaround necessário).
          {
            id: 'rel-pec-cus-an',
            label: 'Custeio/Animal',
            path: '/relatorios/pecuaria/custeio-animal',
            icon: 'banknote',
          },
          // Custeio/Área (F-251, CusteioAreaPecuaria-contrato-api.md,
          // lote 076) — mirror EXATO do padrão `rel-pec-cus`/`rel-pec-cus-an`
          // acima, agrupamento "Custeio" contíguo (legado, sidebar.blade.php,
          // ao lado de "Custeio/Lote"). Gate de permissão em
          // navigationPermissions.ts (`rel-pec-cus-area` →
          // `cust-area-pec-report_view`, JÁ no `anyOf` do pai `rel-pec`,
          // linha 977 — nenhum workaround necessário). Ícone `HandCoins`
          // (sem colisão com `Coins`/`PiggyBank` já usados NESTE grupo).
          {
            id: 'rel-pec-cus-area',
            label: 'Custeio/Área',
            path: '/relatorios/pecuaria/custeio-area-pecuaria',
            icon: 'banknote',
          },
          // Custeio/Módulo (F-250, esteira 080,
          // Custeio-Modulo-Contrato-Front.md §2) — mirror EXATO do padrão
          // `rel-pec-cus`/`rel-pec-cus-an`/`rel-pec-cus-area` acima,
          // agrupamento "Custeio" contíguo. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-cus-md` →
          // `costing-grazing-report_view`, JÁ no `anyOf` do pai `rel-pec`,
          // linha 1117 — nenhum workaround necessário). Ícone `Map` reusado
          // (mesmo ícone do CRUD "Módulo Pastejo", `cad-pec-mod`, associa
          // visualmente o relatório ao cadastro que ele consulta — sem
          // import novo de ícone).
          {
            id: 'rel-pec-cus-md',
            label: 'Custeio/Módulo',
            path: '/relatorios/pecuaria/custeio-modulo',
            icon: 'map',
          },
          // Desempenho Pesagem Confinamento (F-263, lote 076,
          // `FeedlotWeighingPerformanceReport-contrato-api.md`) — mirror
          // EXATO do padrão `rel-pec-cus`/`rel-pec-cus-an`/`rel-pec-cus-area`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-desempenho-pesagem-confinamento` →
          // `feedlot-weighing-performance-report_view`, JÁ no `anyOf` do pai
          // `rel-pec`, linha 980 — nenhum workaround necessário). Ícone
          // `Gauge` (GMD/desempenho, sem colisão com `Coins`/`PiggyBank`/
          // `HandCoins` já usados NESTE grupo).
          {
            id: 'rel-pec-desempenho-pesagem-confinamento',
            label: 'Desempenho Pesagem Confinamento',
            path: '/relatorios/pecuaria/desempenho-pesagem-confinamento',
            icon: 'gauge',
          },
          // Custo Total de Reprodução (F-328, esteira 97-Esteiras/008,
          // TASK-FE-CTR-02) — inserido logo após `rel-pec-cus-an`, mesma
          // vizinhança do legado, que põe "Custo Total de Reprodução" logo
          // depois de "Custeio/Animal" (`sidebar.blade.php:2978-2993`),
          // mantendo contíguo o agrupamento "Custeio". Gate de permissão em
          // navigationPermissions.ts (`rel-pec-cus-rep` →
          // `total-cost-of-reproduction-report_view`, JÁ no `anyOf` do pai
          // `rel-pec`, linha 1019 — não duplicar). Rótulo literal do legado
          // (`sidebar.blade.php:2986-2993`). Ícone `Calculator` (já
          // importado) — sem colisão no bucket `rel-pec`
          // (TrendingUp/HeartPulse/ClipboardList/FileText/History/Coins/
          // PiggyBank/Baby/Skull/PawPrint/Wheat/Beef/Dna/DollarSign/Wallet).
          {
            id: 'rel-pec-cus-rep',
            label: 'Custo Total de Reprodução',
            path: '/relatorios/pecuaria/custo-total-reproducao',
            icon: 'calculator',
          },
          // Nascimentos/SISBOV (F-235, esteira 97-Esteiras/052,
          // TASK-052-235-FE-02, roteiro-front-F235-nascimentos-sisbov.md) —
          // mirror EXATO do padrão `rel-pec-vac`/`rel-pec-hist`/`rel-pec-cus`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-nascimentos-sisbov` → `birth-animals-sisbovs-
          // report_view`, JÁ no `anyOf` do pai `rel-pec` — nenhuma edição
          // adicional lá). Ícone `Baby` já importado (reaproveitado de
          // `ope-pec-nas`/`cad-pec-obn`) — não colide com os ícones já em
          // uso NESTE grupo (TrendingUp/HeartPulse/ClipboardList/FileText/
          // History/Coins).
          {
            id: 'rel-pec-nascimentos-sisbov',
            label: 'Nascimentos/SISBOV',
            path: '/relatorios/pecuaria/nascimentos-sisbov',
            icon: 'cattle',
          },
          // Mortes/SISBOV (F-253, esteira 97-Esteiras/054,
          // TASK-054-253-FE-02, roteiro-front-F253-mortes-sisbov.md) — mirror
          // EXATO do padrão `rel-pec-nascimentos-sisbov` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-pec-mortes-sisbov` →
          // `death-animals-sisbovs-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` — nenhuma edição adicional lá). Ícone `Skull` já
          // importado (reaproveitado de `ope-pec-mor`) — não colide com os
          // ícones já em uso NESTE grupo.
          {
            id: 'rel-pec-mortes-sisbov',
            label: 'Mortes/SISBOV',
            path: '/relatorios/pecuaria/mortes-sisbov',
            icon: 'alert',
          },
          // Identificação/SISBOV (F-270, esteira 97-Esteiras/078,
          // CONTRATOS/F-270-contrato-legado.md) — mirror EXATO do padrão
          // `rel-pec-nascimentos-sisbov`/`rel-pec-mortes-sisbov` acima. Gate
          // de permissão em navigationPermissions.ts
          // (`rel-pec-identificacao-sisbov` →
          // `identification-animals-sisbovs-report_view`, JÁ no `anyOf` do
          // pai `rel-pec` — nenhuma edição adicional lá). Ícone
          // `ScanBarcode` (não colide com `Baby`/`Skull` dos irmãos SISBOV,
          // ver comentário do import acima).
          {
            id: 'rel-pec-identificacao-sisbov',
            label: 'Identificação/SISBOV',
            path: '/relatorios/pecuaria/identificacao-sisbov',
            icon: 'hash',
          },
          // Mortes GENÉRICO (F-254, esteira 97-Esteiras/077,
          // CONTRATOS/front/F-254-plano-front.md) — mirror EXATO do padrão
          // `rel-pec-mortes-sisbov` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-mor` → `death-animals-
          // report_view`, JÁ no `anyOf` do pai `rel-pec` — nenhuma edição
          // adicional lá). Ícone `Biohazard` (não colide com `Skull` do
          // irmão SISBOV, ver comentário do import acima).
          {
            id: 'rel-pec-mor',
            label: 'Mortes',
            path: '/relatorios/pecuaria/mortes',
            icon: 'alert',
          },
          // Nascimentos GENÉRICO (F-236, esteira 97-Esteiras/053,
          // TASK-053-236-FE-02, roteiro-front-F236-nascimentos.md) — mirror
          // EXATO do padrão `rel-pec-vac`/`rel-pec-hist`/`rel-pec-cus`/
          // `rel-pec-nascimentos-sisbov` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-nascimentos` →
          // `birth-report_view`, JÁ no `anyOf` do pai `rel-pec` — nenhuma
          // edição adicional lá). Ícone `PawPrint` já importado (usado 1x
          // fora deste grupo) — não colide com os ícones já em uso NESTE
          // grupo (TrendingUp/HeartPulse/ClipboardList/FileText/History/
          // Coins/Baby); `Baby` já está reservado ao irmão SISBOV acima.
          {
            id: 'rel-pec-nascimentos',
            label: 'Nascimentos',
            path: '/relatorios/pecuaria/nascimentos',
            icon: 'cattle',
          },
          // Nutrição/Lote (F-288, esteira 97-Esteiras/053, TASK-288-FE-01,
          // roteiro-front-F288-nutricao.md §"Menu/Rota/Permissão") — mirror
          // EXATO do padrão `rel-pec-vac`/`rel-pec-hist`/`rel-pec-cus`/
          // `rel-pec-nascimentos-sisbov`/`rel-pec-nascimentos` acima. Gate
          // de permissão em navigationPermissions.ts (`rel-pec-nut` →
          // `nutrition-consumption-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` — correção da entrada STALE `nutrition_report` na
          // mesma Tarefa, nenhuma edição adicional lá). Label preserva o
          // texto do menu legado (`sidebar.blade.php:2822`, "Nutrição/
          // Lote"). Ícone `Wheat` já importado (reaproveitado de
          // `ope-pec-man-nut`/`dash-rac`) — não colide com os ícones já em
          // uso NESTE grupo (TrendingUp/HeartPulse/ClipboardList/FileText/
          // History/Coins/Baby/PawPrint).
          {
            id: 'rel-pec-nut',
            label: 'Nutrição/Lote',
            path: '/relatorios/pecuaria/nutricao-consumo-lote',
            icon: 'grain',
          },
          // Registro Genealógico (F-222, esteira 97-Esteiras/055) — mirror
          // EXATO do padrão `rel-pec-vac`/`rel-pec-hist`/`rel-pec-cus` acima.
          // Gate de permissão em navigationPermissions.ts (`rel-pec-arv` →
          // `animal-family-tree-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` — nenhuma edição adicional lá). Ícone `Dna` já
          // importado (reaproveitado de `cad-pec-rac`, grupo diferente) —
          // não colide com os ícones já em uso NESTE grupo
          // (TrendingUp/HeartPulse/ClipboardList/FileText/History/Coins/
          // Baby/Skull/PawPrint/Wheat).
          {
            id: 'rel-pec-arv',
            label: 'Registro Genealógico',
            path: '/relatorios/pecuaria/registro-genealogico',
            icon: 'lab',
          },
          // Histórico de Animais/Lote (F-221, esteira 97-Esteiras/058,
          // FRONT-F221-plano.md §2.1) — mirror EXATO do padrão
          // `rel-pec-arv`/`rel-pec-hist` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-hal` →
          // `animal-batch-history-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` — nenhuma edição adicional lá). Id `rel-pec-hal` (não
          // `rel-pec-hist` — já ocupado por "Histórico Reprodutivo", feature
          // distinta). Ícone `ListTree` já importado (reaproveitado, 0
          // ocorrências prévias neste arquivo) — não colide com os ícones já
          // em uso NESTE grupo (TrendingUp/HeartPulse/DollarSign/
          // ClipboardList/FileText/History/Coins/PiggyBank/Baby/Skull/
          // PawPrint/Wheat/Dna).
          {
            id: 'rel-pec-hal',
            label: 'Histórico de Animais/Lote',
            path: '/relatorios/pecuaria/historico-animais-lote',
            icon: 'list-tree',
          },
          // Movimentação/Rebanho (F-224, lote 076,
          // `AnimalMovementReport-contrato.md`) — mirror EXATO do padrão
          // `rel-pec-vac`/`rel-pec-hist`/`rel-pec-cus` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-pec-mov` →
          // `animal-movements-report_view`, JÁ no `anyOf` do pai `rel-pec`,
          // linha 998 — nenhum workaround necessário). Ícone
          // `ArrowLeftRight` (entradas/saídas do rebanho) já importado
          // (reaproveitado de outros grupos) — não colide com os ícones já
          // em uso NESTE grupo (TrendingUp/HeartPulse/ClipboardList/
          // FileText/History/Coins/PiggyBank/HandCoins/Gauge/Baby/Skull/
          // PawPrint/Wheat/Dna).
          // Aplicação/Manejo (F-230, esteira 97-Esteiras/077,
          // F-230-plano-front.md §7) — mirror EXATO do padrão
          // `rel-pec-cus-area`/`rel-pec-mov` acima, posicionado conforme o
          // agrupamento do legado (sidebar.blade.php: "Estoque/Rebanho" →
          // "Aplicação/Manejo" → "Movimentação/Rebanho"). Gate de permissão
          // em navigationPermissions.ts (`rel-pec-am` →
          // `application-management-report_view`, JÁ no `anyOf` do pai
          // `rel-pec`, linha 997 — nenhum workaround necessário). Ícone
          // `Sprout` (aplicação de insumos/manejo agronômico) já importado
          // (reaproveitado de outro grupo deste arquivo) — não colide com os
          // ícones já em uso NESTE grupo (TrendingUp/HeartPulse/DollarSign/
          // ClipboardList/FileText/History/Coins/PiggyBank/HandCoins/Gauge/
          // Baby/Skull/PawPrint/Wheat/Dna/ArrowLeftRight/Tags).
          {
            id: 'rel-pec-am',
            label: 'Aplicação/Manejo',
            path: '/relatorios/pecuaria/aplicacao-manejo',
            icon: 'sprout',
          },
          {
            id: 'rel-pec-mov',
            label: 'Movimentação/Rebanho',
            path: '/relatorios/pecuaria/movimentacao-rebanho',
            icon: 'transfer',
          },
          // Estq. Animais/Categoria (F-242, esteira 97-Esteiras/077,
          // F-242-plano-front.md) — mirror EXATO do padrão `rel-pec-mov`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-cat` → `category-animal-report_view`, JÁ no `anyOf`
          // do pai `rel-pec`, linha 994 — nenhum workaround necessário).
          // Ícone `Tags` (afinidade semântica com "categoria") — `Tag`
          // (singular) já em uso por outros grupos deste arquivo; `Tags`
          // confirmado sem colisão de import NESTE grupo (TrendingUp/
          // HeartPulse/DollarSign/ClipboardList/FileText/History/Coins/
          // PiggyBank/HandCoins/Gauge/Baby/Skull/PawPrint/Wheat/Dna/
          // ArrowLeftRight).
          {
            id: 'rel-pec-cat',
            label: 'Estq. Animais/Categoria',
            path: '/relatorios/pecuaria/estoque-animais-categoria',
            icon: 'tag',
          },
          // Transf/Lote/Módulo/Área (F-329, esteira 97-Esteiras/077,
          // F-329-plano-front.md) — mirror EXATO do padrão `rel-pec-cat`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-tba` → `transfer-batch-module-area-report_view`, JÁ no
          // `anyOf` do pai `rel-pec`, linha 1003 — nenhum workaround
          // necessário). Inserido logo APÓS `rel-pec-cat` e ANTES de
          // `rel-pec-vda` — mirror EXATO da ordem do legado
          // (sidebar.blade.php:2833-2849: "Manejo/Lote" → "Animais/
          // Categoria" → "Transf. Área/Módulo"). Ícone `Repeat` (semântica de
          // transferência/repetição de local, distinto de `ArrowLeftRight`
          // já usado por "Movimentação/Rebanho") — já importado neste
          // arquivo, sem colisão DENTRO deste grupo `rel-pec` (confirmado
          // por grep).
          {
            id: 'rel-pec-tba',
            label: 'Transf/Lote/Módulo/Área',
            path: '/relatorios/pecuaria/transferencia-lote-modulo-area',
            icon: 'transfer',
          },
          // Vendas/Animais (F-227, esteira 97-Esteiras/077,
          // F-227-plano-front.md) — mirror EXATO do padrão `rel-pec-cat`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-vda` → `animals-sales-report_view`, JÁ no `anyOf` do
          // pai `rel-pec`, linha 1010 — nenhum workaround necessário).
          // Ícone `Handshake` (afinidade semântica com venda/negociação) —
          // já importado, usado em outro grupo (linha 512), sem colisão
          // DENTRO deste grupo `rel-pec` (confirmado por grep).
          {
            id: 'rel-pec-vda',
            label: 'Vendas/Animais',
            path: '/relatorios/pecuaria/vendas-animais',
            icon: 'handshake',
          },
          // Análise de Movimentação de Lote (F-223, esteira 059,
          // CONTRATO-F223-analise-mov-lote.md §3/§5) — mirror EXATO do
          // padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-analise-mov-lote` →
          // `animal-movement-analysis-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` acima — nenhuma edição adicional lá). Ícone
          // `BarChart3` (semântica de análise, já importado neste arquivo)
          // — LIVRE dentro do grupo `rel-pec` (não colide com
          // `ArrowLeftRight`/`ListTree` já usados por movimentação/
          // histórico).
          {
            id: 'rel-pec-analise-mov-lote',
            label: 'Análise de Movimentação de Lote',
            path: '/relatorios/pecuaria/analise-movimentacao-lote',
            icon: 'chart-bar',
          },
          // Pesagem/Animal (F-334, execução 059,
          // CONTRATO-F334-pesagem-animal.md) — mirror EXATO do padrão dos
          // irmãos acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-pesagem-animal` → `weighing-batch-report_view`, JÁ no
          // `anyOf` do pai `rel-pec` acima — nenhuma edição adicional lá).
          // Ícone `Ruler` (semântica de pesagem, já importado neste
          // arquivo) — LIVRE dentro do grupo `rel-pec` (`Scale` já usado por
          // `rel-pec-pes` "Pesagem/Lote", evita duplicar ícone).
          {
            id: 'rel-pec-pesagem-animal',
            label: 'Pesagem/Animal',
            path: '/relatorios/pecuaria/pesagem-animal',
            icon: 'ruler',
          },
          // Desmamas (F-333, esteira 97-Esteiras/060,
          // ROTEIRO-F333-FRONT-desmamas-tela.md §6, TASK-F333-FRONT-01) —
          // sai do modal em Operacional > Desmama e ganha item de MENU
          // dedicado aqui, mirror EXATO do padrão `rel-pec-pesagem-animal`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-des` → `weaning-report_view`, JÁ no `anyOf` do pai
          // `rel-pec` acima, linha 1053 — nenhuma edição adicional lá).
          // Ícone `Split` (já importado neste arquivo, reaproveitado de
          // `ope-pec-apa`/Apartação em outro grupo) — LIVRE dentro de
          // `rel-pec` (`Baby` já está em uso NESTE mesmo grupo por
          // `rel-pec-nascimentos-sisbov`, evita colisão).
          {
            id: 'rel-pec-des',
            label: 'Desmamas',
            path: '/relatorios/pecuaria/desmamas',
            icon: 'git-branch',
          },
          // Estoque/Rebanho (F-228, execução 97-Esteiras/078,
          // F-228-plano-frontend.md) — mirror EXATO do padrão `rel-pec-cat`/
          // `rel-pec-vda` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-estoque-rebanho` →
          // `animals-report_view`, JÁ no `anyOf` do pai `rel-pec` — nenhuma
          // edição adicional lá). Evidência legada confirma grupo Pecuária
          // (`sidebar.blade.php:2858`, submenu `#pecuariarelatorio`), NÃO
          // Estoque/Agricultura. Ícone `Warehouse` (afinidade semântica com
          // "estoque") — sem colisão DENTRO deste grupo `rel-pec`
          // (confirmado por grep: TrendingUp/HeartPulse/DollarSign/
          // ClipboardList/FileText/History/Coins/PiggyBank/HandCoins/Gauge/
          // Baby/Skull/Biohazard/PawPrint/Wheat/Dna/ArrowLeftRight/Sprout/
          // Tags/Repeat/Handshake).
          {
            id: 'rel-pec-estoque-rebanho',
            label: 'Estoque/Rebanho',
            path: '/relatorios/pecuaria/estoque-rebanho',
            icon: 'warehouse',
          },
          // Sanitário/Lote (F-318, execução 97-Esteiras/078,
          // F-318-plano-frontend.md, TASK-F318-F04) — RE-ALINHAMENTO: a
          // tela JÁ EXISTIA (rota `/relatorios/pecuaria/sanitario-lote`)
          // mas SEM item de menu (só acessível pelo hub de Relatórios >
          // Pecuária) — checklist item 4 (descobribilidade) incompleto.
          // Mirror EXATO do padrão `rel-pec-estoque-rebanho`/`rel-pec-vda`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-pec-sanitario-lote` → `sanitaries-batch-report_view`, JÁ
          // no `anyOf` do pai `rel-pec`, linha 1009 — nenhum slug novo
          // cunhado). Ícone `Stethoscope` já importado (reaproveitado de
          // outros grupos, `Syringe` já em uso por "Vacinas") — sem colisão
          // DENTRO deste grupo `rel-pec` (confirmado por grep: TrendingUp/
          // HeartPulse/DollarSign/ClipboardList/FileText/History/Coins/
          // PiggyBank/HandCoins/Gauge/Baby/Skull/Biohazard/PawPrint/Wheat/
          // Dna/ArrowLeftRight/Sprout/Tags/Repeat/Handshake/Warehouse).
          {
            id: 'rel-pec-sanitario-lote',
            label: 'Sanitário/Lote',
            path: '/relatorios/pecuaria/sanitario-lote',
            icon: 'safety',
          },
          // Prod. Receptora (F-307, lote 079, F-307-plano-frontend.md §5
          // TASK-F307-FE-03) — mirror EXATO do padrão `rel-pec-hist` acima.
          // Gate de permissão em navigationPermissions.ts (`rel-pec-recept`
          // → `receiver-cow-productivity-report_view`, JÁ no `anyOf` do pai
          // `rel-pec`, linha 1072 — nenhum slug novo cunhado). Ícone
          // `Droplet` (tema sêmen/embrião do domínio reprodutivo) — já
          // importado neste arquivo (reaproveitado de outro grupo), SEM
          // colisão DENTRO de `rel-pec` (confirmado por grep na lista de
          // ícones já usados neste bucket, comentário `rel-pec-sanitario-
          // lote` acima).
          {
            id: 'rel-pec-recept',
            label: 'Produtividade/Receptora',
            path: '/relatorios/pecuaria/produtividade-receptora',
            icon: 'water',
          },
          // Composição Rebanho (F-269, lote 079, F-269-plano-frontend.md §6
          // TASK-F269-FE-03) — mirror EXATO do padrão `rel-pec-recept`/
          // `rel-pec-sanitario-lote` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-pec-composicao-rebanho` →
          // `herd-composition-report_view`, JÁ no `anyOf` do pai `rel-pec`
          // — fundação parcial já semeada, ver §0 do plano, nenhum slug
          // novo cunhado). Ícone `PieChart` (afinidade semântica com
          // "composição") — sem colisão DENTRO deste grupo `rel-pec`
          // (confirmado por grep).
          {
            id: 'rel-pec-composicao-rebanho',
            label: 'Composição Rebanho',
            path: '/relatorios/pecuaria/composicao-rebanho',
            icon: 'chart-pie',
          },
        ],
      },
      // "Financeiro" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (F-259/F-258, esteira 97-Esteiras/049,
      // TASK-DRE-FE-02/04) — mirror EXATO do mesmo padrão já aprovado para
      // "Pecuária"/"Gestão Fiscal" acima: `path`/`icon` do próprio
      // "Financeiro" PRESERVADOS (cai no RoutePlaceholder de
      // `/relatorios/*`, mesmo comportamento de hoje — nenhuma tela própria
      // no nível do grupo); filhos adicionados são "DRE" (TASK-DRE-FE-02) e
      // "DRE Anual" (TASK-DRE-FE-04), apontando para as rotas NOVAS
      // `/relatorios/financeiro/dre` e `/relatorios/financeiro/dre-anual`.
      // `anyOf` do pai INALTERADO (navigationPermissions.ts) — já contém
      // `dre_view`/`dre_annual_view` desde antes desta feature; a
      // visibilidade do grupo continua resolvida pela regra do PRÓPRIO item
      // pai (`useMenuModules.ts::pruneItems`), não por agregação dos
      // filhos — mesmo mecanismo já em uso por `rel-pec`/`rel-gfi`.
      {
        id: 'rel-fin',
        label: 'Financeiro',
        path: '/relatorios/financeiro',
        icon: 'wallet',
        children: [
          {
            id: 'rel-fin-dre',
            label: 'DRE',
            path: '/relatorios/financeiro/dre',
            icon: 'document',
          },
          {
            id: 'rel-fin-dre-annual',
            label: 'DRE Anual',
            path: '/relatorios/financeiro/dre-anual',
            icon: 'document',
          },
          {
            id: 'rel-fin-contas-a-pagar',
            label: 'Contas a Pagar',
            path: '/relatorios/financeiro/contas-a-pagar',
            icon: 'document',
          },
          {
            id: 'rel-fin-contas-pagas',
            label: 'Contas Pagas',
            path: '/relatorios/financeiro/contas-pagas',
            icon: 'document',
          },
          {
            id: 'rel-fin-contas-a-receber',
            label: 'Contas a Receber',
            path: '/relatorios/financeiro/contas-a-receber',
            icon: 'document',
          },
          {
            id: 'rel-fin-contas-recebidas',
            label: 'Contas Recebidas',
            path: '/relatorios/financeiro/contas-recebidas',
            icon: 'document',
          },
          // Pagamento Previsto × Real (F-289, esteira 97-Esteiras/054,
          // TASK-289-FE-02) — mirror EXATO do padrão dos irmãos "Contas a
          // Pagar"/"Contas Pagas" acima. Gate de permissão em
          // navigationPermissions.ts (`rel-fin-pag-prev-real` →
          // `pag_prev_report`, JÁ no `anyOf` do pai `rel-fin` — nenhuma
          // edição adicional lá). Distinto do irmão `rel-fin-prev-real`
          // (F-238, lado Recebimentos) — id/rota/label nunca colidem.
          {
            id: 'rel-fin-pag-prev-real',
            label: 'Pagamento Previsto × Real',
            path: '/relatorios/financeiro/pagamento-previsto-real',
            icon: 'document',
          },
          // Recebimento Previsto × Real (F-297, esteira 97-Esteiras/079,
          // TASK-079-297-FE-02) — mirror EXATO do padrão do irmão
          // "Pagamento Previsto × Real" acima (lado Receita). Gate de
          // permissão em navigationPermissions.ts (`rel-fin-rec-prev-real` →
          // `rec_prev_report`, JÁ no `anyOf` do pai `rel-fin` — nenhuma
          // edição adicional lá). `id`/label DELIBERADAMENTE distintos do
          // irmão `rel-fin-prev-real` (F-238, Planejamento Orçamentário,
          // feature DIFERENTE) — plano-frontend §Risco 1.
          {
            id: 'rel-fin-rec-prev-real',
            label: 'Recebimento Previsto × Real',
            path: '/relatorios/financeiro/recebimento-previsto-real',
            icon: 'document',
          },
          {
            id: 'rel-fin-juros-pagos',
            label: 'Juros Pagos',
            path: '/relatorios/financeiro/juros-pagos',
            icon: 'document',
          },
          // Relatórios → Financeiro → Juros Recebidos (esteira
          // 97-Esteiras/014, Tarefa 49) — filho NOVO do grupo `rel-fin`,
          // mirror EXATO de `rel-fin-juros-pagos` acima. Gate de permissão
          // em navigationPermissions.ts (`rel-fin-juros-recebidos` →
          // `received_interest_report`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá).
          {
            id: 'rel-fin-juros-recebidos',
            label: 'Juros Recebidos',
            path: '/relatorios/financeiro/juros-recebidos',
            icon: 'document',
          },
          {
            id: 'rel-fin-apuracao-custo',
            label: 'Apuração de Custo',
            path: '/relatorios/financeiro/apuracao-de-custo',
            icon: 'document',
          },
          {
            id: 'rel-fin-custo-producao',
            label: 'Custo de Produção',
            path: '/relatorios/financeiro/custo-de-producao',
            icon: 'document',
          },
          // Relatórios → Financeiro → Previsto × Realizado (F-238,
          // HOMOLOGAÇÃO/correção 2026-09-05) — item de menu FALTANTE: a
          // rota `/financeiro/previsao/relatorio-previsto-realizado` e a
          // página `BudgetPlanningPredictedReport` já existiam (F-106), mas
          // nenhum item da árvore apontava para ela, deixando o relatório
          // inalcançável pela busca/navegação. FILHO novo em mirror EXATO
          // de `rel-fin-dre`/`rel-fin-custo-producao` acima. `label` segue
          // o padrão literal dos irmãos (sem o prefixo "Relatório", já
          // implícito no grupo), não a string completa do
          // `menuLabel` de `languageFinancialBudgetPlanning.ts`.
          {
            id: 'rel-fin-prev-real',
            label: 'Previsto × Realizado',
            path: '/financeiro/previsao/relatorio-previsto-realizado',
            icon: 'document',
          },
          // Relatórios → Financeiro → Centro de Custo (F-247, esteira
          // 97-Esteiras/052, TASK-052-247-FE-02) — filho NOVO do grupo
          // `rel-fin`, mirror EXATO de `rel-fin-apuracao-custo`/
          // `rel-fin-custo-producao` acima. `anyOf` do pai INALTERADO — já
          // contém `cost_centers_report` desde antes desta esteira.
          {
            id: 'rel-fin-centro-custo',
            label: 'Centro de Custo',
            path: '/relatorios/financeiro/centro-de-custo',
            icon: 'document',
          },
          // Relatórios → Financeiro → Livro Razão (F-274, esteira
          // 97-Esteiras/008, TASK-FE-LR-03) — filho NOVO do grupo `rel-fin`,
          // mirror EXATO de `rel-fin-centro-custo` acima. `label` segue o
          // padrão literal dos irmãos (sem prefixo "Relatório").
          //
          // GAP-LR-05, obrigatório: fica em Relatórios → Financeiro (NÃO em
          // Gestão Fiscal, `rel-gfi`) e usa "Livro Razão" (NÃO "Razão
          // Geral"/"Partida Dobrada" — nome já ocupado pela feature IRMÃ
          // `rel-gfi-partida-dobrada`).
          {
            id: 'rel-fin-livro-razao',
            label: 'Livro Razão',
            path: '/relatorios/financeiro/livro-razao',
            icon: 'document',
          },
          // Relatórios → Financeiro → Consolidado (Pagar/Receber) (F-214,
          // esteira 97-Esteiras/052, TASK-052-214-FE-02) — filho NOVO do
          // grupo `rel-fin`, mirror EXATO de `rel-fin-centro-custo`/
          // `rel-fin-apuracao-custo` acima. `anyOf` do pai INALTERADO — já
          // contém `accounts_payable_receivable_report` desde antes desta
          // esteira.
          {
            id: 'rel-fin-consolidado',
            label: 'Consolidado (Pagar/Receber)',
            path: '/relatorios/financeiro/consolidado-pagar-receber',
            icon: 'document',
          },
          // Relatórios → Financeiro → Fluxo de Caixa Mensal (F-240, esteira
          // 97-Esteiras/053, TASK-053-240-FE-03) — filho NOVO do grupo
          // `rel-fin`, mirror EXATO de `rel-fin-centro-custo`/
          // `rel-fin-consolidado` acima. `anyOf` do pai INALTERADO — já
          // contém `cashflow_by_category_report` desde antes desta esteira.
          {
            id: 'rel-fin-cashflow-por-categoria',
            label: 'Fluxo de Caixa Mensal',
            path: '/relatorios/financeiro/fluxo-de-caixa-mensal',
            icon: 'document',
          },
          // Relatórios → Financeiro → Estoque Financeiro (F-241, esteira
          // 97-Esteiras/013, TASK-013-241-FE-04) — filho NOVO do grupo
          // `rel-fin`, mirror EXATO de `rel-fin-cashflow-por-categoria`
          // acima. `anyOf` do pai INALTERADO — já contém
          // `cashflow_product_report` desde antes desta esteira.
          {
            id: 'rel-fin-estoque-financeiro',
            label: 'Estoque Financeiro',
            path: '/relatorios/financeiro/estoque-financeiro',
            icon: 'document',
          },
          // Adiantamento (F-219, esteira 97-Esteiras/055) — mirror EXATO do
          // padrão dos irmãos acima (`FileText` é o ícone-padrão de todo o
          // grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-adiantamento` →
          // `advance-titles_report`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá).
          {
            id: 'rel-fin-adiantamento',
            label: 'Adiantamento',
            path: '/relatorios/financeiro/adiantamento',
            icon: 'document',
          },
          // Agenda/Recebimentos (F-304, esteira 97-Esteiras/055) — mirror
          // EXATO do padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-fin-agenda-recebimentos` →
          // `receipt-schedule_view`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá).
          {
            id: 'rel-fin-agenda-recebimentos',
            label: 'Agenda/Recebimentos',
            path: '/relatorios/financeiro/agenda-recebimentos',
            icon: 'document',
          },
          // Custo de Produção Acumulado (F-217, esteira 97-Esteiras/058) —
          // mirror EXATO do padrão dos irmãos acima (`FileText` é o
          // ícone-padrão de todo o grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-custo-producao-acumulado` →
          // `accumulatedincomestatement_view`, JÁ no `anyOf` do pai
          // `rel-fin` — nenhuma edição adicional lá).
          {
            id: 'rel-fin-custo-producao-acumulado',
            label: 'Custo de Produção Acumulado',
            path: '/relatorios/financeiro/custo-de-producao-acumulado',
            icon: 'document',
          },
          // Movimento Bancário (F-264, esteira 97-Esteiras/058,
          // TASK-058-F264-FE-02) — mirror EXATO do padrão dos irmãos acima
          // (`FileText` é o ícone-padrão de todo o grupo `rel-fin`). Gate de
          // permissão em navigationPermissions.ts
          // (`rel-fin-movimento-bancario` → `financial-movement-report_view`,
          // permissão NOVA — D-058-07 — incluída no `anyOf` do pai
          // `rel-fin`).
          {
            id: 'rel-fin-movimento-bancario',
            label: 'Movimento Bancário',
            path: '/relatorios/financeiro/movimento-bancario',
            icon: 'document',
          },
          // Fiscal/Não Fiscal (F-266, lote 076,
          // `FiscalDifferenceReport-contrato.md`) — filho NOVO do grupo
          // `rel-fin`, mirror EXATO do padrão dos irmãos acima (`FileText` é
          // o ícone-padrão de todo o grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-fiscal-nao-fiscal` →
          // `fiscal-difference-report_view`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá).
          {
            id: 'rel-fin-fiscal-nao-fiscal',
            label: 'Fiscal/Não Fiscal',
            path: '/relatorios/financeiro/fiscal-nao-fiscal',
            icon: 'document',
          },
          // Razão Categoria (F-273, execução 059,
          // CONTRATO-F273-razao-categoria.md) — mirror EXATO do padrão dos
          // irmãos acima (`FileText` é o ícone-padrão de todo o grupo
          // `rel-fin`). Gate de permissão em navigationPermissions.ts
          // (`rel-fin-razao-categoria` → `ledger_caregory_report`, JÁ no
          // `anyOf` do pai `rel-fin` — nenhuma edição adicional lá).
          {
            id: 'rel-fin-razao-categoria',
            label: 'Razão Categoria',
            path: '/relatorios/financeiro/razao-categoria',
            icon: 'document',
          },
          // Agenda/Pagamentos (F-294, CONTRATO-F294-agenda-pagamentos.md,
          // esteira 97-Esteiras/059) — mirror EXATO do padrão dos irmãos
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-fin-agenda-pagamentos` → `payment-schedule_view`, JÁ no
          // `anyOf` do pai `rel-fin` — nenhuma edição adicional lá).
          {
            id: 'rel-fin-agenda-pagamentos',
            label: 'Agenda/Pagamentos',
            path: '/relatorios/financeiro/agenda-pagamentos',
            icon: 'document',
          },
          // Fluxo Mensal de Recebimento (F-303, esteira 97-Esteiras/059,
          // CONTRATO-F303-fluxo-mensal-recebimento.md) — mirror EXATO do
          // padrão dos irmãos acima. Gate de permissão em
          // navigationPermissions.ts (`rel-fin-fluxo-mensal-recebimento` →
          // `monthly-receipt-flow_view`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá).
          {
            id: 'rel-fin-fluxo-mensal-recebimento',
            label: 'Fluxo Mensal de Recebimento',
            path: '/relatorios/financeiro/fluxo-mensal-recebimento',
            icon: 'document',
          },
          // Contas Tributárias (F-327, esteira 97-Esteiras/060) — item de
          // menu FALTANTE: a rota (`/relatorios/financeiro/contas-tributarias`,
          // `router/index.tsx`) e o gate `tax_accounts_report` (JÁ no `anyOf`
          // do pai `rel-fin`, `navigationPermissions.ts`) já existiam, mas
          // sem entrada de navegação — mirror EXATO do padrão dos irmãos
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-fin-contas-tributarias` → `tax_accounts_report`, nenhuma
          // edição adicional no `anyOf` do pai).
          {
            id: 'rel-fin-contas-tributarias',
            label: 'Contas Tributárias',
            path: '/relatorios/financeiro/contas-tributarias',
            icon: 'document',
          },
          // Financiamentos (F-265, execução 97-Esteiras/078,
          // F-265-plano-frontend.md) — filho NOVO do grupo `rel-fin`, mirror
          // EXATO do padrão dos irmãos acima (`FileText` é o ícone-padrão de
          // todo o grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-financiamentos` →
          // `financings_report`, JÁ no `anyOf` do pai `rel-fin` — nenhuma
          // edição adicional lá).
          {
            id: 'rel-fin-financiamentos',
            label: 'Financiamentos',
            path: '/relatorios/financeiro/financiamentos',
            icon: 'document',
          },
          // Fluxo Mensal de Pagamento (F-293, execução 97-Esteiras/078,
          // F-293-plano-frontend.md) — filho NOVO do grupo `rel-fin`, mirror
          // EXATO do padrão dos irmãos acima (`FileText` é o ícone-padrão de
          // todo o grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-fluxo-mensal-pagamento` →
          // `monthly-payment-flow_view`, JÁ no `anyOf` do pai `rel-fin` —
          // nenhuma edição adicional lá). Sem colisão com
          // `rel-fin-cashflow-por-categoria` (Fluxo de Caixa Mensal) nem com
          // o CRUD operacional `fin-flu` (Fluxo Bancário).
          {
            id: 'rel-fin-fluxo-mensal-pagamento',
            label: 'Fluxo Mensal de Pagamento',
            path: '/relatorios/financeiro/fluxo-mensal-pagamento',
            icon: 'document',
          },
          // Extrato Financeiro (F-233, execução 97-Esteiras/079,
          // F-233-plano-frontend.md) — filho NOVO do grupo `rel-fin`, mirror
          // EXATO do padrão dos irmãos acima (`FileText` é o ícone-padrão de
          // todo o grupo `rel-fin`). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-extrato-financeiro` →
          // `movements_report`, JÁ no `anyOf` do pai `rel-fin` — nenhuma
          // edição adicional lá). Sem colisão com
          // `rel-fin-movimento-bancario` (F-264, `financial-movement-report_view`).
          {
            id: 'rel-fin-extrato-financeiro',
            label: 'Extrato Financeiro',
            path: '/relatorios/financeiro/extrato-financeiro',
            icon: 'document',
          },
          // Conciliação de Contas (F-213, lote 079, rework FE — 3 ajustes do
          // dono, F-213-plano-frontend-rework.md) — item NOVO, sobrepõe
          // DEC-177 ("sem item de menu", decisão original de SURF-033/034).
          // Rota ALINHADA para o padrão dos irmãos `rel-fin` (antes
          // `/financeiro/conciliacao-consolidada`, feature nunca
          // commitada/entregue). Gate de permissão em
          // navigationPermissions.ts (`rel-fin-conciliacao-contas` →
          // `account-reconciliation_report`, JÁ no `anyOf` do pai — nenhuma
          // edição adicional lá).
          {
            id: 'rel-fin-conciliacao-contas',
            label: 'Conciliação de Contas',
            path: '/relatorios/financeiro/conciliacao-de-contas',
            icon: 'document',
          },
        ],
      },
      // "Estoque" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (F-267, esteira 97-Esteiras/073,
      // TASK-267-FE-01) — mirror EXATO do mesmo padrão já aprovado para
      // "Gestão Fiscal" acima (`rel-gfi`/`rel-gfi-partida-dobrada`):
      // `path`/`icon` do próprio "Estoque" PRESERVADOS (cai no
      // RoutePlaceholder de `/relatorios/*` se nenhum filho responder, mesmo
      // comportamento de hoje); único filho adicionado é "Custo Produção
      // Batida", apontando para a rota NOVA
      // `/relatorios/estoque/custo-producao-batida` (antes a própria rota do
      // pai). `anyOf` do pai INALTERADO (navigationPermissions.ts) — já
      // continha `food-beat_report` desde antes desta esteira; a
      // visibilidade do grupo continua resolvida pela regra do PRÓPRIO item
      // pai (`useMenuModules.ts::pruneItems`), não por agregação dos
      // filhos — mesmo mecanismo já em uso por `rel-gfi`/`rel-fin`.
      {
        id: 'rel-est',
        label: 'Estoque',
        path: '/relatorios/estoque',
        icon: 'warehouse',
        children: [
          {
            id: 'rel-est-custo-batida',
            label: 'Custo Produção Batida',
            path: '/relatorios/estoque/custo-producao-batida',
            icon: 'document',
          },
          // Relatórios → Estoque → Recebimentos (F-305, esteira
          // 97-Esteiras/074, TASK-RCB-FE-02) — 2º filho do grupo `rel-est`,
          // mirror EXATO de `rel-est-custo-batida` acima. Ícone `ReceiptText`
          // (NÃO `Receipt`, já em uso 3× noutro módulo — item 21 do
          // checklist, contrato front §1/§6). `anyOf` do pai INALTERADO — já
          // contém `receipts_report` desde antes desta esteira.
          {
            id: 'rel-est-recebimentos',
            label: 'Recebimentos',
            path: '/relatorios/estoque/recebimentos',
            icon: 'receipt-detail',
          },
          // Relatórios → Estoque → Movimentação de Estoque (F-1f1d23e3,
          // esteira 97-Esteiras/074, TASK-MOV-FE-02) — novo filho do grupo
          // `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos` acima. `anyOf` do pai INALTERADO — já
          // contém `stock_movement_report` desde antes desta esteira.
          {
            id: 'rel-est-mov-estoque',
            label: 'Movimentação de Estoque',
            path: '/relatorios/estoque/movimentacao-estoque',
            icon: 'document',
          },
          // Relatórios → Estoque → Lote/Fornecedor (F-324, esteira
          // 97-Esteiras/052, TASK-052-324-FE-02) — 4º filho do grupo
          // `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos`/`rel-est-mov-estoque` acima. Ícone
          // `Truck` (fornecedor/entrega — NÃO duplicado dentro do grupo:
          // `Warehouse`/`FileText`/`ReceiptText`/`FileText` já em uso).
          // `anyOf` do pai INALTERADO — já contém `stocks-lot-provider_report`
          // desde antes desta esteira.
          {
            id: 'rel-est-lote-fornecedor',
            label: 'Lote/Fornecedor',
            path: '/relatorios/estoque/lote-fornecedor',
            icon: 'truck',
          },
          // Relatórios → Estoque → Baixa de Estoque (F-321, execução 013,
          // correção de conformidade — gap encontrado pelo dono ao testar
          // manualmente) — 5º filho do grupo `rel-est`, mirror EXATO de
          // `rel-est-custo-batida`/`rel-est-recebimentos`/
          // `rel-est-mov-estoque`/`rel-est-lote-fornecedor` acima. Rota real
          // continua sob `/administrativo/...` (mesmo padrão de
          // `rel-fin-prev-real`) — a listagem irmã `adm-est-bai` já existe em
          // Administrativo > Estoque; este é só o item de RELATÓRIO. Ícone
          // `PackageMinus` reaproveitado de `adm-est-bai` (mesma feature,
          // variante relatório — não precisa de import novo). `anyOf` do pai
          // INALTERADO — já contém `stock_writeoffs_report` desde antes
          // desta execução.
          {
            id: 'rel-est-baixa-estoque',
            label: 'Baixa de Estoque',
            path: '/administrativo/baixa-estoque/relatorio',
            icon: 'package-minus',
          },
          // Relatórios → Estoque → Curva ABC/Estoque (F-322, esteira
          // 97-Esteiras/077, CONTRATOS/front/F-322-plano-front.md) — 6º
          // filho do grupo `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos`/`rel-est-mov-estoque`/
          // `rel-est-lote-fornecedor`/`rel-est-baixa-estoque` acima. Ícone
          // `BarChart3` (classificação/curva — NÃO duplicado dentro do
          // grupo: `Warehouse`/`FileText`/`ReceiptText`/`FileText`/`Truck`/
          // `PackageMinus` já em uso; `BarChart3` já importado no topo do
          // arquivo, usado noutro módulo). `anyOf` do pai INALTERADO — já
          // contém `stocks-abc_report` desde antes desta esteira
          // (`navigationPermissions.ts:1314`).
          {
            id: 'rel-est-curva-abc',
            label: 'Curva ABC/Estoque',
            path: '/relatorios/estoque/curva-abc',
            icon: 'chart-bar',
          },
          // Pesagem/Armazém/Cliente (F-337, execução 059,
          // CONTRATO-F337-pesagem-armazem-cliente.md) — domínio correto é
          // Estoque (decisão desta Tarefa): a permissão
          // `weighing-stock-client_report` estava só no `anyOf` de
          // `rel-agr` (resíduo de mapeamento anterior, preservado AS-IS, não
          // removido sem decisão do dono); o item de MENU deste relatório é
          // criado aqui em `rel-est`, mirror EXATO do padrão dos irmãos
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-est-pesagem-armazem-cliente` →
          // `weighing-stock-client_report`, ADICIONADA ao `anyOf` de
          // `rel-est` nesta Tarefa). Ícone `Scale` (semântica de pesagem,
          // já importado neste arquivo) — LIVRE dentro do grupo `rel-est`.
          {
            id: 'rel-est-pesagem-armazem-cliente',
            label: 'Pesagem/Armazém/Cliente',
            path: '/relatorios/estoque/pesagem-armazem-cliente',
            icon: 'scale',
          },
          // DFe/Lançadas (F-255, execução 044, entregue órfão de item de
          // menu — reprovação confirmada pelo dono em runtime, execução 061,
          // ROTEIRO-061). 10º filho do grupo `rel-est`, mirror EXATO de
          // `rel-est-custo-batida`/`rel-est-recebimentos`/
          // `rel-est-mov-estoque`/`rel-est-lote-fornecedor`/
          // `rel-est-baixa-estoque`/`rel-est-curva-abc`/
          // `rel-est-saidas-centro-custo`/`rel-est-requisicao-saida`/
          // `rel-est-consolidado`/`rel-est-pesagem-armazem-cliente` acima.
          // CORREÇÃO (execução 061, defeito confirmado pelo Tester runtime):
          // `path` agora aponta para a rota PRÓPRIA
          // `/relatorios/estoque/dfe-lancadas` (router/index.tsx, mesmo
          // componente `DfeReport`, mesmo gate `dfe_report`) — a rota antiga
          // `/fiscal/dfes/relatorio` colidia com o prefixo `/fiscal/dfes` de
          // "DFe Recebidas" e fazia a sidebar destacar
          // Administrativo›DFe Recebidas em vez de Relatórios›Estoque. Ícone
          // `Inbox` reaproveitado — já é o ícone estabelecido para o domínio
          // DFe neste arquivo (`fav-dfe`/`fis-nfe-dfe`), sem colisão dentro
          // do grupo `rel-est`. `anyOf` do pai INALTERADO — `dfe_report` já
          // está no `anyOf` de `rel-est` desde a execução 044 (linha acima).
          {
            id: 'rel-est-dfe-lancadas',
            label: 'DFe/Lançadas',
            path: '/relatorios/estoque/dfe-lancadas',
            icon: 'inbox',
          },
          // Relatórios → Estoque → Saídas x Centro Custo (F-301, esteira
          // 97-Esteiras/078, F-301-plano-frontend.md) — 7º filho do grupo
          // `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos`/`rel-est-mov-estoque`/
          // `rel-est-lote-fornecedor`/`rel-est-baixa-estoque`/
          // `rel-est-curva-abc` acima. Ícone `FileText` reaproveitado (já em
          // uso no grupo, sem colisão de significado). `anyOf` do pai
          // INALTERADO — já contém `products-exit-cost-center_report`
          // (navigationPermissions.ts:1365).
          {
            id: 'rel-est-saidas-centro-custo',
            label: 'Saídas x Centro Custo',
            path: '/relatorios/estoque/saidas-centro-custo',
            icon: 'document',
          },
          // Relatórios → Estoque → Requisição/Saída (F-312, esteira
          // 97-Esteiras/078, F-312-plano-frontend.md) — 8º filho do grupo
          // `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos`/`rel-est-mov-estoque`/
          // `rel-est-lote-fornecedor`/`rel-est-baixa-estoque`/
          // `rel-est-curva-abc`/`rel-est-saidas-centro-custo` acima. Ícone
          // `FileText` reaproveitado (já em uso no grupo, sem colisão de
          // significado). `anyOf` do pai INALTERADO — já contém
          // `requisitions_report` (navigationPermissions.ts:1372).
          {
            id: 'rel-est-requisicao-saida',
            label: 'Requisição/Saída',
            path: '/relatorios/estoque/requisicao-saida',
            icon: 'document',
          },
          // Relatórios → Estoque → Estoque Consolidado (F-323, feature_id
          // e70b8cad, esteira 97-Esteiras/079, F-323-plano-frontend.md) — 9º
          // filho do grupo `rel-est`, mirror EXATO de `rel-est-custo-batida`/
          // `rel-est-recebimentos`/`rel-est-mov-estoque`/
          // `rel-est-lote-fornecedor`/`rel-est-baixa-estoque`/
          // `rel-est-curva-abc`/`rel-est-saidas-centro-custo`/
          // `rel-est-requisicao-saida` acima. Ícone `Boxes` (já importado,
          // já usado noutros módulos — NÃO duplicado dentro do grupo:
          // `Warehouse`/`FileText`/`ReceiptText`/`Truck`/`PackageMinus`/
          // `BarChart3` já em uso aqui). `anyOf` do pai INALTERADO — já
          // contém `stocks-consolidated_report` desde antes desta esteira
          // (`navigationPermissions.ts:1527`).
          {
            id: 'rel-est-consolidado',
            label: 'Estoque Consolidado',
            path: '/relatorios/estoque/estoque-consolidado',
            icon: 'stock',
          },
        ],
      },
      // "Suprimentos" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (F-310, esteira 97-Esteiras/053,
      // TASK-053-F310-FE-02) — mirror EXATO do mesmo padrão já aprovado para
      // "Financeiro"/"Estoque"/"Gestão Fiscal" acima (`rel-fin`/`rel-est`/
      // `rel-gfi`), COM a ressalva do risco #1 do roteiro-front-F310: o
      // filho 1 (`rel-sup-sla`) recebe o MESMO `path` que o pai tinha antes
      // desta reestruturação (`/relatorios/suprimentos`), preservando 100%
      // a reachability do "Relatório SLA" (F-326) — `SecondaryNav` trata
      // item COM filhos só como expand/collapse, nunca navega para o `path`
      // do próprio pai, então o SLA PRECISA virar filho para continuar
      // clicável. Rota/componente/permissão do SLA NÃO MUDAM (ver
      // `router/index.tsx`) — só a POSIÇÃO no menu. `anyOf` do pai
      // INALTERADO (navigationPermissions.ts) — já contém
      // `status-sla_report_view`/`request-purchase-management_report_view`
      // desde antes desta esteira; a visibilidade do grupo continua
      // resolvida pela regra do PRÓPRIO item pai
      // (`useMenuModules.ts::pruneItems`), não por agregação dos filhos —
      // mesmo mecanismo já em uso por `rel-fin`/`rel-est`/`rel-gfi`.
      {
        id: 'rel-sup',
        label: 'Suprimentos',
        path: '/relatorios/suprimentos',
        icon: 'cart',
        children: [
          {
            id: 'rel-sup-sla',
            label: 'Relatório SLA',
            path: '/relatorios/suprimentos',
            icon: 'document',
          },
          {
            id: 'rel-sup-gerencial-solicitacoes',
            label: 'Gerencial de Solicitações',
            path: '/relatorios/suprimentos/gerencial-de-solicitacoes',
            icon: 'document',
          },
          // 3º filho — "Produtos x Prev. Entrega" (F-309, esteira
          // 97-Esteiras/058, TASK-058-F309-FE-02). Mirror do label de menu
          // legado (`Permission.php:3785`). `anyOf` do pai `rel-sup`
          // INALTERADO — já contém `request-purchase-forecast-report_report_view`
          // (navigationPermissions.ts).
          {
            id: 'rel-sup-produtos-prev-entrega',
            label: 'Produtos x Prev. Entrega',
            path: '/relatorios/suprimentos/produtos-prev-entrega',
            icon: 'document-search',
          },
          // ANS (F-229, lote 076, `F-229-ans-report-contrato-api.md`) — 3º
          // filho de `rel-sup`, mirror EXATO do padrão `rel-sup-sla`/
          // `rel-sup-gerencial-solicitacoes` acima. `ans_report_view` JÁ
          // estava no `anyOf` do pai `rel-sup` (navigationPermissions.ts,
          // linha 1326) — nenhuma edição no bucket do pai. Gate de permissão
          // do FILHO em navigationPermissions.ts (`rel-sup-ans` →
          // `ans_report_view`).
          {
            id: 'rel-sup-ans',
            label: 'ANS',
            path: '/relatorios/suprimentos/ans',
            icon: 'document',
          },
          // Relatórios → Suprimentos → Savings (F-319, execução 013,
          // TASK-013-F319-FE-01) — 3º filho NOVO do grupo `rel-sup`, mirror
          // EXATO de `rel-sup-sla`/`rel-sup-gerencial-solicitacoes` acima.
          // `anyOf` do pai INALTERADO — já contém `savings_view` desde antes
          // desta execução. Ícone `FileText` (mesmo dos 2 irmãos — o tipo é
          // "relatório", não um domínio próprio).
          {
            id: 'rel-sup-savings',
            label: 'Savings',
            path: '/relatorios/suprimentos/savings',
            icon: 'document',
          },
          // Relatórios → Suprimentos → Suprimentos (F-325, `supplies-report`,
          // execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52) — 5º filho
          // NOVO do grupo `rel-sup`, mirror EXATO dos 4 irmãos acima. Label
          // "Suprimentos" LITERALMENTE igual ao label do grupo pai —
          // fidelidade EXATA ao legado (`trad.suprimentos`, item-folha
          // original antes de F-310 promover `rel-sup` a grupo), NÃO é bug,
          // NÃO inventar label alternativo para desambiguar. `anyOf` do pai
          // INALTERADO — já contém `supplies_view` desde antes desta Tarefa
          // (1ª posição do array).
          {
            id: 'rel-sup-supplies-report',
            label: 'Suprimentos',
            path: '/relatorios/suprimentos/supplies-report',
            icon: 'document',
          },
          // Relatórios → Suprimentos → Orçamentos (`request-quotation.report`,
          // F-311, execução 97-Esteiras/078, TASK-F311-F04) — novo filho do
          // grupo `rel-sup`, mirror EXATO de `rel-sup-savings`/`rel-sup-ans`
          // acima. `anyOf` do pai INALTERADO — já contém
          // `request-quotation_report_view` desde antes desta execução.
          // Label fiel ao item legado (`sidebar.blade.php:985`
          // "Orçamentos/Fornecedor"); o `pageTitle` da tela permanece
          // "Orçamentos".
          {
            id: 'rel-sup-orcamentos',
            label: 'Orçamentos/Fornecedor',
            path: '/relatorios/suprimentos/orcamentos',
            icon: 'document',
          },
        ],
      },
      // "Vendas" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (F-313, esteira 97-Esteiras/054,
      // TASK-054-313-T1) — mirror EXATO do mesmo padrão já aprovado para
      // "Suprimentos"/"Gestão Fiscal"/"Pecuária" acima: `path`/`icon` do
      // próprio "Vendas" PRESERVADOS; filho 1 (`rel-ven-produto`) recebe o
      // MESMO `path` que o pai tinha antes desta reestruturação
      // (`/relatorios/vendas`, F-315, mirror `rel-sup-sla`), preservando
      // 100% a reachability do relatório já em produção; filho 2
      // (`rel-ven-cliente-produto`) é a rota NOVA
      // `/relatorios/vendas/cliente-produto`. `anyOf` do pai INALTERADO
      // (navigationPermissions.ts) — já contém `sales-products_report`/
      // `sale-clients_report` desde antes desta feature.
      {
        id: 'rel-ven',
        label: 'Vendas',
        path: '/relatorios/vendas',
        icon: 'shopping-bag',
        children: [
          {
            id: 'rel-ven-produto',
            label: 'Produto',
            path: '/relatorios/vendas',
            icon: 'shopping-bag',
          },
          {
            id: 'rel-ven-cliente-produto',
            label: 'Cliente/Produto',
            path: '/relatorios/vendas/cliente-produto',
            icon: 'document',
          },
          // "Vendas/Cliente" (F-317, esteira 97-Esteiras/077,
          // F-317-plano-front.md) — 3º filho de `rel-ven`, mirror EXATO dos
          // 2 irmãos acima. `anyOf` do pai `rel-ven`
          // (navigationPermissions.ts) JÁ CONTÉM `sales_report` desde antes
          // desta feature — só o gate do FILHO foi adicionado. Ícone `Users`
          // (não repetido neste bloco — `ShoppingBag`/`FileText` já
          // ocupados pelos irmãos).
          {
            id: 'rel-ven-cliente',
            label: 'Cliente',
            path: '/relatorios/vendas/cliente',
            icon: 'users',
          },
          // "Vendas/Funcionário" (F-314, esteira 97-Esteiras/079,
          // F-314-plano-frontend.md) — 4º filho de `rel-ven`, mirror EXATO
          // dos 3 irmãos acima. `anyOf` do pai `rel-ven`
          // (navigationPermissions.ts) JÁ CONTÉM `sale-employees_report`
          // desde antes desta feature — só o gate do FILHO foi adicionado.
          // Ícone `UserRound` (não repetido neste bloco — `ShoppingBag`/
          // `FileText`/`Users` já ocupados pelos irmãos).
          {
            id: 'rel-ven-funcionario',
            label: 'Funcionário',
            path: '/relatorios/vendas/funcionario',
            icon: 'user-check',
          },
        ],
      },
      // "Gestão Pessoal" (Relatórios) reestruturado de item-folha único para
      // item-pai com filho (F-275, esteira 97-Esteiras/012, Tarefa 47) —
      // mirror EXATO do mesmo padrão já aprovado para "Gestão Fiscal"/
      // "Pecuária" acima (`rel-gfi`/`rel-gfi-partida-dobrada`,
      // `rel-pec`/`rel-pec-vac`): `path`/`icon`/`label` do próprio "Gestão
      // Pessoal" PRESERVADOS (cai no RoutePlaceholder de `/relatorios/*` se
      // nenhum filho responder, mesmo comportamento de hoje); único filho
      // adicionado é "Horas Logadas", apontando para a rota NOVA
      // `/relatorios/gestao-pessoal/horas-logadas` (SEM `RequirePermission`
      // — só o item de MENU é gateado, ver router/index.tsx e
      // navigationPermissions.ts). `anyOf` do pai INALTERADO — já contém
      // `logged-hours_view` desde antes desta Tarefa; a visibilidade do
      // grupo continua resolvida pela regra do PRÓPRIO item pai
      // (`useMenuModules.ts::pruneItems`), não por agregação dos filhos —
      // mesmo mecanismo já em uso por `rel-gfi`/`rel-pec`. Ícone `Clock`
      // (não `Users`, já o do pai; não `TrendingUp`/`HeartPulse`/
      // `GitCompare`, já em uso na árvore).
      // Filho "Apuração Mensal" (TASK-07-57, feature F-285, `97-Esteiras/007`)
      // ADICIONADO ao mesmo grupo (mesclado com "Horas Logadas" acima,
      // reestruturado independentemente na mesma esteira de tempo) — mirror
      // EXATO do padrão dos filhos irmãos. Gate em navigationPermissions.ts
      // (`rel-gpe-apu` → `earnings_view`, já no `anyOf` do pai `rel-gpe`).
      {
        id: 'rel-gpe',
        label: 'Gestão Pessoal',
        path: '/relatorios/gestao-pessoal',
        icon: 'users',
        children: [
          {
            id: 'rel-gpe-horas-logadas',
            label: 'Horas Logadas',
            path: '/relatorios/gestao-pessoal/horas-logadas',
            icon: 'clock',
          },
          {
            id: 'rel-gpe-apu',
            label: 'Apuração Mensal',
            path: '/relatorios/gestao-pessoal/apuracao-mensal',
            icon: 'document',
          },
        ],
      },
      // "Gestão Fiscal" (Relatórios) reestruturado de item-folha único para
      // item-pai com filhos (ajuste de navegação pedido pelo dono,
      // 2026-09-01) — mirror EXATO do mesmo padrão já aprovado para
      // "Pecuária" acima (`rel-pec`/`rel-pec-evo`): `path`/`icon` do próprio
      // "Gestão Fiscal" PRESERVADOS (cai no RoutePlaceholder de
      // `/relatorios/*`, mesmo comportamento de `rel-pec` hoje — nenhuma tela
      // própria no nível do grupo); único filho adicionado é "Partida
      // Dobrada", apontando para a rota NOVA
      // `/relatorios/gestao-fiscal/partida-dobrada` (antes a própria rota do
      // pai). Ícone `GitCompare` — mesmo já usado para "Partida Dobrada" em
      // `fis-outros` (Gestão Fiscal > Outros, cadastro), fidelidade visual.
      // `anyOf` do pai INALTERADO (navigationPermissions.ts) — já reserva
      // espaço para os futuros relatórios de NF-e (`nfe_report`,
      // `nfe_product_report`); a visibilidade do grupo continua resolvida
      // pela regra do PRÓPRIO item pai (`useMenuModules.ts::pruneItems`), não
      // por agregação dos filhos — mesmo mecanismo já em uso por `rel-pec`.
      {
        id: 'rel-gfi',
        label: 'Gestão Fiscal',
        path: '/relatorios/gestao-fiscal',
        icon: 'scale',
        children: [
          {
            id: 'rel-gfi-partida-dobrada',
            label: 'Partida Dobrada',
            path: '/relatorios/gestao-fiscal/partida-dobrada',
            icon: 'git-compare',
          },
          // Faturamento (F-286, esteira 97-Esteiras/054, TASK-054-286-FE-02)
          // — mirror EXATO do padrão `rel-gfi-partida-dobrada` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-gfi-faturamento` →
          // `nfe_product_report`, JÁ no `anyOf` do pai `rel-gfi` — nenhuma
          // edição adicional lá). Ícone `FileText` — padrão de item-folha de
          // relatório em outros grupos, sem colisão neste (Scale/GitCompare).
          {
            id: 'rel-gfi-faturamento',
            label: 'Faturamento',
            path: '/relatorios/gestao-fiscal/faturamento',
            icon: 'document',
          },
          // NFe/Emitidas (F-287, esteira 97-Esteiras/079, TASK-F287-FE-02) —
          // mirror EXATO do padrão `rel-gfi-faturamento` acima. Gate de
          // permissão em navigationPermissions.ts (`rel-gfi-nfe-report` →
          // `nfe_report`, JÁ no `anyOf` do pai `rel-gfi` — nenhuma edição
          // adicional lá). Label "NFe/Emitidas" (COM a barra, DF-01 do plano
          // frontend) — diferencia visualmente do CRUD "NFe Emitidas" (SEM
          // barra, `fis-nfe-emi`, F-036, outro grupo/rota). Ícone
          // `FileSpreadsheet` — distinto de `FileText` (irmão Faturamento).
          {
            id: 'rel-gfi-nfe-report',
            label: 'NFe/Emitidas',
            path: '/relatorios/gestao-fiscal/nfe-report',
            icon: 'spreadsheet',
          },
        ],
      },
      // "Gestão de Frotas" (Relatórios) reestruturado de item-folha único
      // para item-pai com filho (F-278, esteira 97-Esteiras/052,
      // TASK-052-278-FE-02) — mirror EXATO do mesmo padrão já aprovado para
      // "Estoque"/"Agricultura" acima: `path`/`icon` do próprio `rel-gfr`
      // PRESERVADOS (cai no RoutePlaceholder se nenhum filho responder);
      // único filho adicionado é "Máquinas", apontando para a rota NOVA
      // `/relatorios/frotas/maquinas`. Gate de permissão do filho em
      // navigationPermissions.ts (`rel-gfr-maquinas` → `machinesreport_view`,
      // já no `anyOf` do pai). Bucket reserva os 2 relatórios futuros
      // (`machines-supply_view`/`machines-maintenance_view`, já no `anyOf`)
      // — só o filho desta feature é adicionado aqui.
      {
        id: 'rel-gfr',
        label: 'Gestão de Frotas',
        path: '/relatorios/frotas',
        icon: 'truck',
        children: [
          {
            id: 'rel-gfr-maquinas',
            label: 'Máquinas',
            path: '/relatorios/frotas/maquinas',
            icon: 'warehouse',
          },
          // Abastecimentos (F-277, esteira 97-Esteiras/054,
          // TASK-054-277-FE-02) — mirror EXATO do padrão `rel-gfr-maquinas`
          // acima. Gate de permissão em navigationPermissions.ts
          // (`rel-gfr-abastecimentos` → `machines-supply_view`, JÁ no
          // `anyOf` do pai `rel-gfr` — nenhuma edição adicional lá). Ícone
          // `Fuel` já importado, sem colisão neste grupo (Truck/Forklift).
          {
            id: 'rel-gfr-abastecimentos',
            label: 'Abastecimentos',
            path: '/relatorios/frotas/abastecimentos',
            icon: 'fuel',
          },
          // Manutenções (F-276, execução 97-Esteiras/078,
          // F-276-plano-frontend.md) — mirror EXATO do padrão
          // `rel-gfr-abastecimentos` acima. Gate de permissão em
          // navigationPermissions.ts (`rel-gfr-manutencoes` →
          // `machines-maintenance_view`, JÁ no `anyOf` do pai `rel-gfr` —
          // nenhuma edição adicional lá). `Wrench` já importado (usado
          // também pelo CRUD operacional `fro-man`, sem colisão — grupos de
          // menu distintos).
          {
            id: 'rel-gfr-manutencoes',
            label: 'Manutenções',
            path: '/relatorios/frotas/manutencoes',
            icon: 'wrench',
          },
        ],
      },
    ],
  },
  {
    id: 'integracoes',
    label: 'Integrações',
    emoji: '🔗',
    icon: 'network',
    groups: [
      {
        id: 'int-dominio',
        label: 'Software Domínio',
        icon: 'globe',
        items: [
          {
            id: 'int-dom-soft',
            label: 'Software Domínio',
            path: '/integracoes/dominio',
            icon: 'globe',
          },
        ],
      },
      {
        id: 'int-exp-dom',
        label: 'Exportação / Domínio',
        icon: 'upload',
        items: [
          {
            id: 'int-exp-bco',
            label: 'Mov. Bancário',
            path: '/integracoes/exp-bancario',
            icon: 'bank',
          },
          {
            id: 'int-exp-fol',
            label: 'Folha Salarial',
            path: '/integracoes/exp-folha',
            icon: 'banknote',
          },
          {
            id: 'int-exp-cp',
            label: 'Contas Pagar / Receber',
            path: '/integracoes/exp-cp',
            icon: 'credit-card',
          },
          { id: 'int-exp-nfse', label: 'NFSe', path: '/integracoes/exp-nfse', icon: 'document' },
        ],
      },
      {
        id: 'int-exp-csv',
        label: 'Exportações / CSV',
        icon: 'table',
        items: [{ id: 'int-csv', label: 'Exportação CSV', path: '/integracoes/csv', icon: 'table' }],
      },
      {
        // Compartilhamento (Sharing, F-122, 97-Esteiras/070, TASK-CP-FE-01):
        // grupo NOVO — não se encaixa em "Software Domínio"/"Exportação /
        // Domínio"/"Exportações / CSV" (feature própria, sem relação com
        // Domínio/CSV). 1 item-folha, mesmo padrão dos grupos irmãos.
        id: 'int-compartilhamento-group',
        label: 'Compartilhamento',
        icon: 'network',
        items: [
          {
            id: 'int-compartilhamento',
            label: 'Compartilhamento',
            path: '/integracoes/compartilhamento',
            icon: 'share',
          },
        ],
      },
    ],
  },
];

// Ordena APENAS o módulo "Relatórios" em ordem alfabética: seus submenus
// (`flatItems`) e, dentro de cada submenu, os relatórios-folha (`children`).
// Ordenação por `label` com `localeCompare('pt-BR')` (respeita acentuação e
// caixa do português). Nenhum outro módulo é reordenado e nenhuma outra
// propriedade é alterada — mudança puramente de exibição do menu Relatórios.
(() => {
  const relatorios = menuModules.find((module) => module.id === 'relatorios');
  if (!relatorios?.flatItems) return;

  const byLabel = (a: { label: string }, b: { label: string }): number =>
    a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });

  relatorios.flatItems.sort(byLabel);
  relatorios.flatItems.forEach((item) => item.children?.sort(byLabel));
})();

/**
 * Junta flatItems + itens de todos os groups de um módulo, num array só.
 * @param {NavModule} module Módulo cujos itens (flat + de groups) serão unidos.
 * @return {NavSubItem[]} Array único com todos os itens do módulo.
 */
export function getAllModuleItems(module: NavModule): NavSubItem[] {
  return [...(module.flatItems ?? []), ...(module.groups?.flatMap((g) => g.items) ?? [])];
}

/**
 * Achata recursivamente item + filhos (children), útil para bater contra o pathname.
 * @param {NavSubItem[]} items Itens de navegação a achatar junto de seus filhos.
 * @return {NavSubItem[]} Itens originais seguidos de seus filhos, num array só.
 */
function flattenWithChildren(items: NavSubItem[]): NavSubItem[] {
  return items.flatMap((item) => [item, ...(item.children ?? [])]);
}

/**
 * Busca um módulo pelo `id` — usado pelo SecondaryNav quando ele é aberto por
 * clique na sidebar (sem navegação), já que nesse caso não há rota nova pra
 * derivar o módulo a partir do pathname.
 * @param {string} id Identificador do módulo (`NavModule.id`) a buscar.
 * @return {NavModule | undefined} O módulo encontrado, ou `undefined` se nenhum casar.
 */
export function getModuleById(id: string): NavModule | undefined {
  return menuModules.find((m) => m.id === id);
}

/**
 * Dado um pathname, encontra o módulo dono (o módulo cujo `path` bate
 * exatamente, ou que tem um item/filho cujo `path` é prefixo do pathname).
 * Usado para: destacar módulo ativo na sidebar, decidir se o SecondaryNav
 * deve vir aberto e montar o breadcrumb.
 * @param {string} pathname Pathname atual da rota (ex.: `location.pathname`).
 * @return {NavModule | undefined} O módulo dono do pathname, ou `undefined` se nenhum casar.
 */
export function findModuleByPath(pathname: string): NavModule | undefined {
  // Módulo sem filhos (ex.: Home) — match exato ou prefixo do path próprio.
  const directMatch = menuModules.find(
    (m) => m.path && (pathname === m.path || pathname.startsWith(m.path + '/'))
  );
  if (directMatch) return directMatch;

  // Módulo com filhos — o pathname cai dentro de algum item (ou filho de item).
  return menuModules.find((m) => {
    const allItems = flattenWithChildren(getAllModuleItems(m));
    return allItems.some((i) => pathname === i.path || pathname.startsWith(i.path + '/'));
  });
}

/**
 * Variante frouxa de `findModuleByPath` para paths que NÃO casam com nenhum
 * item da árvore (ex.: `/fiscal/rota-que-nao-existe`): resolve o módulo dono
 * pelo SEGMENTO-BASE da URL (`/fiscal/...` pertence ao módulo cujos itens
 * vivem sob `/fiscal/`). Usado pelo guard do RoutePlaceholder para negar
 * acesso a qualquer subrota de um módulo que o usuário não pode ver.
 * @param {string} pathname Pathname atual da rota (ex.: `location.pathname`).
 * @return {NavModule | undefined} O módulo dono do segmento-base, ou `undefined` se nenhum casar.
 */
export function findModuleByBaseSegment(pathname: string): NavModule | undefined {
  const base = '/' + (pathname.split('/')[1] ?? '');
  if (base === '/') return undefined;

  return menuModules.find((m) => {
    if (m.path === base) return true;
    const allItems = flattenWithChildren(getAllModuleItems(m));
    return allItems.some((i) => i.path.startsWith(base + '/'));
  });
}

/**
 * Dado um pathname e (opcionalmente) o módulo já resolvido, encontra o item
 * de navegação (folha) cujo `path` bate com o pathname atual — usado pelo
 * placeholder "Em construção" para saber que label/ícone exibir.
 * @param {string} pathname Pathname atual da rota (ex.: `location.pathname`).
 * @param {NavModule} [module] Módulo já resolvido (opcional); se omitido, é
 *   derivado internamente via `findModuleByPath`.
 * @return {NavSubItem | undefined} O item de navegação cujo `path` bate com o pathname, ou `undefined` se nenhum casar.
 */
export function findItemByPath(pathname: string, module?: NavModule): NavSubItem | undefined {
  const owningModule = module ?? findModuleByPath(pathname);
  if (!owningModule) return undefined;
  const allItems = flattenWithChildren(getAllModuleItems(owningModule));
  return (
    allItems.find((i) => pathname === i.path) ??
    allItems.find((i) => pathname.startsWith(i.path + '/'))
  );
}
