# Central de agrupador — Melhorias de UX

- **Área:** navegação (menu de 2º nível)
- **Rota nova:** `/central/:groupId` (genérica); grupos com central própria usam `hubPath`
- **Permissões:** nenhuma nova; a tela usa a árvore já podada por permissão (`useMenuModules`)

## Resumo por ação

| Ação | Antes | Depois | Status |
|------|-------|--------|--------|
| Clicar no nome do agrupador (ex.: Agricultura, Estoque, Suprimentos) | Só abria ou fechava a lista | Abre a central do grupo, com um card por funcionalidade, e expande a lista | implementada |
| Clicar na seta do agrupador | Abria ou fechava | Continua só abrindo ou fechando | igual |
| Trabalho e compras | — | Abre a Central própria (`/operacional/central`) | implementada |

## Registro de edições

### UX-central-de-agrupador-001 · Navegação · Central por agrupador — 2026-11-24
- **Status:** implementada (aguardando revisão do dono; sem commit)
- **Tipo:** navegação · layout
- **Problema:** o agrupador do menu é só um rótulo; quem não sabe o nome exato da tela precisa abrir grupo por grupo.
- **Proposta:** o rótulo do agrupador vira um link para uma central com cards (ícone e nome) de cada funcionalidade do grupo, na mesma linha visual da Central de Trabalho e compras. Item com 3º nível vira uma seção com os cards dos filhos. Breadcrumb: Início › Módulo › Grupo.
- **Mudanças técnicas:**

  | Arquivo | O que mudou |
  |---------|-------------|
  | `src/config/v2/navigationTree.ts` | `NavGroup.hubPath?`, `GROUP_HUB_BASE`, `getGroupHubPath`, `findGroupByHubPath`; `ope-apontamento` com `hubPath: '/operacional/central'` |
  | `src/pages/GroupHub/index.tsx` | Tela nova: `PageCard` + `PageHeader` + grade de `ModuleLinkCard`; seções para itens com filhos; "Grupo não encontrado" |
  | `src/components/Layout/SecondaryNav.tsx` | Cabeçalho do grupo em dois botões: rótulo (abre a central e expande) e seta (só expande); rótulo destacado quando a central está aberta |
  | `src/hooks/useMenuModules.ts` | `useMenuModuleByPath` reconhece `/central/<grupo>` (abre o menu do módulo certo) |
  | `src/components/Header/index.tsx` | Breadcrumb mostra o grupo na central |
  | `src/router/index.tsx` | Rota `/central/:groupId` |
  | `languageSidebar.ts` (3 idiomas) e `sidebar.d.ts` | `sidebar.groupHub.*` |

- **Compartilhado afetado:** `SecondaryNav` (todas as telas com menu de 2º nível). Nenhum componente do kit mudou.
- **Como validar:** Operacional › clicar em "Agricultura" abre `/central/ope-agricultura` com os cards; Carregamento e Rastreabilidade aparecem como seções; a seta de "Pecuária" só abre a lista; "Trabalho e compras" abre `/operacional/central`; Administrativo › "Estoque" mostra 12 funcionalidades; usuário sem permissão não vê o card.
- **Testes:** `src/pages/GroupHub/index.test.tsx`, `src/config/v2/groupHub.test.ts`.

### UX-central-de-agrupador-002 · Copy · Descrição nos cards — 2026-11-24
- **Status:** implementada (aguardando revisão do dono; sem commit)
- **Decisão do dono:** os cards da central trazem uma descrição curta de cada funcionalidade.
- **Mudanças técnicas:** `sidebar.descriptions` (id do item → texto) em `languageSidebarDescriptions.ts` nos 3 idiomas, ligado em `languageSidebar.ts`; tipo em `sidebar.d.ts`; `GroupHub` passa a descrição ao `ModuleLinkCard`.
- **Cobertura:** todas as 193 telas dos módulos com agrupadores (Cadastros Base, Administrativo, Operacional, Financeiro, Gestão Fiscal, Integrações). Módulos sem agrupador (Dashboards, Relatórios, Frota, Configurações) não têm central.
- **Teste de guarda:** `groupHub.test.ts` falha se uma tela nova de módulo com agrupador entrar sem descrição em algum idioma, ou se as chaves divergirem entre idiomas.
- **Revisar com o negócio:** os textos foram escritos a partir do nome e da rota de cada tela. Os de Afiliados, Contratantes, Serviços (Gerais), Parâmetros Animais, Processamentos e Gerenciamento Avançado merecem conferência de quem conhece a tela.
