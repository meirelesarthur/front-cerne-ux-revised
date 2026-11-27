# Central de agrupador

Atualizado em 26/11/2026 · Status: feito

Relacionados: [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md) (Central "Trabalho e compras"),
[ordem-de-compra-unica-e-tipos-de-servico.md](ordem-de-compra-unica-e-tipos-de-servico.md) (itens de Suprimentos)

## Regras vigentes

- **24/11 — O nome do agrupador do menu abre uma central** do grupo, com um card (ícone, nome e descrição) por
  funcionalidade, e expande a lista; a **seta** só abre ou fecha a lista.
- **24/11 — Os cards trazem uma descrição curta** de cada funcionalidade, nos 3 idiomas, para todas as telas dos
  módulos com agrupador. Tela nova nesses módulos entra com descrição (o teste de guarda falha sem ela).
- **24/11 — "Trabalho e compras" tem central própria** (`/operacional/central`), em vez da central genérica.
- **26/11 — Suprimentos:** "Solicitações de compra" (tela única com o combo de status) e, com o protótipo ligado,
  **"Ordens de compra"** (entidade nova, uma por fornecedor) e "Fluxo da ordem de compra", cada um com sua descrição.
- **26/11 — A trilha do topo usa o item de menu mais específico** quando a rota não é exata (ex.: o detalhe de uma
  Ordem mostra "Ordens de compra", não "Solicitações de compra").

## O que mudou

### Central por agrupador (feito, 24/11)

- **Rota nova** `/central/:groupId` (genérica); grupos com central própria usam `hubPath`. Sem permissão nova: a tela
  usa a árvore já podada por permissão (`useMenuModules`).
- **Tela** `pages/GroupHub/index.tsx`: `PageCard` + `PageHeader` + grade de `ModuleLinkCard`; item com 3º nível vira
  seção com os cards dos filhos; "Grupo não encontrado".
- **Menu** `components/Layout/SecondaryNav.tsx`: cabeçalho do grupo em dois botões — rótulo (abre a central e expande)
  e seta (só expande); rótulo destacado com a central aberta. Afeta todas as telas com menu de 2º nível.
- **Trilha** `components/Header/index.tsx`: Início › Módulo › Grupo na central.
- **Configuração** `config/v2/navigationTree.ts`: `NavGroup.hubPath?`, `GROUP_HUB_BASE`, `getGroupHubPath`,
  `findGroupByHubPath`; `ope-apontamento` com `hubPath: '/operacional/central'`. `hooks/useMenuModules.ts` reconhece
  `/central/<grupo>`. Rota em `router/index.tsx`.
- **Textos** `sidebar.groupHub.*` e `sidebar.descriptions` (id do item → texto) em `languageSidebar.ts` e
  `languageSidebarDescriptions.ts` nos 3 idiomas; tipo em `sidebar.d.ts`.
- **Cobertura:** as 193 telas de Cadastros Base, Administrativo, Operacional, Financeiro, Gestão Fiscal e Integrações.
  Dashboards, Relatórios, Frota e Configurações não têm agrupador nem central.

### Suprimentos e trilha do topo (feito, 26/11)

- Itens `adm-sup-sol` ("Solicitações de compra"), `adm-sup-oc` ("Ordens de compra", só com `PURCHASE_ORDER_PROTOTYPE`)
  e `adm-sup-flx` ("Fluxo da ordem de compra", idem), com descrição nos 3 idiomas e permissão em
  `navigationPermissions.ts`.
- `findItemByPath` (`config/v2/navigationTree.ts`): sem caminho exato, vale o **prefixo mais longo**; antes valia o
  primeiro da lista.

## Como validar

1. Operacional › clicar em "Agricultura": abre `/central/ope-agricultura` com os cards; Carregamento e Rastreabilidade
   aparecem como seções; a seta de "Pecuária" só abre a lista.
2. "Trabalho e compras" abre `/operacional/central`.
3. Administrativo › "Estoque" mostra 12 funcionalidades; Administrativo › "Suprimentos" mostra "Solicitações de compra"
   (e, no protótipo, "Ordens de compra" e "Fluxo da ordem de compra"), cada uma com descrição.
4. Abrir uma Ordem de compra (protótipo): a trilha diz Início › Administrativo › Ordens de compra.
5. Usuário sem permissão não vê o card.
6. Testes: `npx vitest run src/pages/GroupHub src/config` (inclui `groupHub.test.ts`, que falha se faltar descrição em
   algum idioma ou se as chaves divergirem).

## A fazer

- [ ] **Produto:** revisar as descrições de Afiliados, Contratantes, Serviços (Gerais), Parâmetros Animais,
  Processamentos e Gerenciamento Avançado (escritas a partir do nome e da rota; pedem quem conhece a tela).
- [ ] **Front:** quando "Tipos de serviço" e "Serviços" forem renomeados no menu, ajustar as descrições dos dois.

### Pendências de decisão

—

## Registro de edições

| Data | Commit | O que mudou |
|---|---|---|
| 24/11/2026 | `3f2b0db` | Central por agrupador com cards e descrição das 193 telas |
| 26/11/2026 | `2920f89`, `c77ee03` | "Solicitações de compra" e o item novo "Ordens de compra" em Suprimentos |
| 26/11/2026 | `446d425` | Trilha do topo pelo caminho mais específico |
| 26/11/2026 | `91bd88c` | Doc reescrito pela lei 6 |
