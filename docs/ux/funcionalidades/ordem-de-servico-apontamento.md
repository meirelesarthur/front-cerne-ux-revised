# Ordem de Serviço e Apontamento — Melhorias de UX

- **Rota(s):** `/operacional/ordens-de-servico` (nova, menu "Central"), `/operacional/lista-os`, `/operacional/minhas-os`, `/operacional/monitoramento`, `/operacional/avaliacoes`, `/operacional/apontamentos`, `/administrativo/solicitacao/novo?tipo=S`
- **Código:** `src/pages/Operacional/ServiceOrdersHub/` (novo), `src/pages/Administrativo/Solicitacao/initialRequestType.ts` (novo), menu em `src/config/v2/navigationTree.ts`
- **Permissões envolvidas:** `service-orders_view`, `my-service-orders_view`, `monitoring-service-orders_view`, `rating-service-orders_view`, `appropriations_view`
- **Última atualização:** 2026-11-24
- **Documento de produto:** "Cerne — Nova Ordem de Serviço e Apontamento" (Claude Doc)

## Resumo por ação

| Ação | Situação hoje (problemas) | Melhorias aplicadas | Status |
|------|---------------------------|---------------------|--------|
| Entrada | OS, Apontamento e Compra parecem a mesma coisa; não há onde escolher | Central com três cards (ícone, uma linha e tag de destino); a explicação fica no modal "Como funciona" | implementada |
| Jornada da OS | OS solta, sem ligação com compra, pagamento ou custo | Jornada Pedir → Aprovar → Contratar → Executar → Atestar → Pagar no modal "Como funciona"; cada etapa abre a tela atual | implementada (só front) |
| Menu | "Apontamentos" escondido em Agricultura; 4 itens de OS com nomes técnicos | Grupo "Apontamento" próprio; OS com "Central", "Todas as OS", "Em execução", "A avaliar" | implementada |
| Listar (vazio) | "Comece emitindo sua primeira OS" não explica nada | Estado vazio explica OS × Apontamento e aponta o caminho certo | implementada |
| Finalizar apontamento | "Deseja continuar?" | Confirmação diz o efeito (estoque) e o próximo passo | implementada |
| Solicitação | Tipo sempre começa vazio | `?tipo=S` pré-seleciona Serviço na criação | implementada |

## Registro de edições

### UX-ordem-de-servico-apontamento-001 · Entrada · Nova OS como contratação de serviço — 2026-11-23
- **Status:** implementada (aguardando revisão do dono; sem commit)
- **Tipo:** usabilidade · copy · feedback/estado
- **Problema:** a OS não se liga a nada e duplica o Apontamento; o produtor não sabe qual usar.
- **Proposta:** OS = contratar serviço de fora (espelha a compra de serviço); trabalho da equipe = Apontamento; produto = Compra. Onda 1 só de front; estado "Atestado" e vínculo OS ↔ Apontamento dependem do back-end.
- **Mudanças técnicas:**

  | Arquivo | O que mudou |
  |---------|-------------|
  | `src/pages/Operacional/ServiceOrdersHub/index.tsx` | Tela nova composta com `PageCard`, `PageHeader`, `FormSection`, `ChoiceCardGroup`, `StepIndicator`, `Button`, `Icon` |
  | `src/pages/Operacional/ServiceOrdersHub/serviceOrdersHubRoutes.ts` | Destinos (todas as rotas já existiam) |
  | `src/router/index.tsx` | Rota `/operacional/ordens-de-servico` com `anyOf` das 4 permissões de OS |
  | `src/config/v2/navigationTree.ts`, `navigationPermissions.ts` | Grupo `ope-apontamento`; item `ope-os-hub` |
  | `src/pages/Administrativo/Solicitacao/CreateOrUpdateSolicitacao.tsx`, `initialRequestType.ts` | Pré-seleção do tipo pela URL, só na criação |

- **Compartilhado afetado:** nenhum componente do kit foi alterado.
- **i18n:** `serviceOrders.hub.*` (novo), `serviceOrders.serviceOrder.list.emptyState`, `appropriations.appropriation.list.{pageSubtitle,emptyState}`, `finishConfirmDescription`, `recentActivities` (appropriation), `sidebar.navigation` (`ope-apontamento`, `ope-os-*`) nos 3 idiomas.
- **Como validar:** abrir Operacional › Ordens de Serviço › Começar aqui; trocar a opção e conferir o efeito; Continuar em "Contratar um serviço de fora" abre a Solicitação já com tipo Serviço; tocar cada etapa e abrir a tela; usuário sem permissão de OS não vê os atalhos.
- **Impacto para o Dev:** `muda i18n` · `exige backend/API` nas ondas 2 e 3 (estado Atestado, vínculo OS ↔ Apontamento, safra/centro na solicitação). Observação: o validador `validate-permissions` não lê regras `anyOf` em várias linhas (limitação já existente, também em `dash-overview`).
- **Commit:** não feito (branch `feat/nova-ordem-servico-apontamento`, revisão do dono).

### UX-ordem-de-servico-apontamento-002 · Entrada · Central com três cards e ajuda em modal — 2026-11-24
- **Status:** implementada (aguardando revisão do dono; sem commit)
- **Tipo:** usabilidade · copy · layout
- **Problema (revisão do dono):** "Começar aqui" soava pouco sério; a tela estava verbosa, com espaçamento estourado; o botão "Continuar" sobrava; a jornada em etapas na própria tela ficou explicativa demais.
- **Proposta aplicada:**
  - Item de menu renomeado para **Central** (Ordens de Serviço › Central). O título da tela continua "Ordens de Serviço".
  - Três **cards centrais** com o ícone de cada módulo (serviço, equipe, compra), uma linha de apoio e a tag verde de destino. O card inteiro navega; não há "Continuar".
  - A explicação saiu da tela: o botão **Como funciona**, à direita do título, abre um modal com "O que é a OS", "Como a OS anda" (etapas) e "Onde acompanhar".
- **Mudanças técnicas:**

  | Arquivo | O que mudou |
  |---------|-------------|
  | `src/components/ui/ModuleLinkCard.tsx` | Componente novo do kit: card que leva a um módulo (`size` `lg` central ou `sm` atalho), tag de destino com `Badge success` |
  | `src/pages/Operacional/ServiceOrdersHub/index.tsx` | Tela refeita: `PageHeader` + botão "Como funciona", grade de 3 `ModuleLinkCard`, modal (`Dialog` do kit) com `StepIndicator` e atalhos |
  | `src/@types/language/module-service-orders/index.ts` e os 3 idiomas | `hub.chooser`/`hub.journey`/`hub.shortcuts` viraram `hub.options` + `hub.help.{about,journey,shortcuts}`; `example`/`effect` saíram, entrou `destination` |
  | `languageSidebar.ts` (3 idiomas), `navigationTree.ts` | `ope-os-hub`: "Começar aqui" → "Central" ("Hub" em inglês) |

- **Como validar:** abrir Operacional › Ordens de Serviço › Central; cada card abre direto o destino da tag; "Como funciona" abre o modal; usuário sem permissão de OS não vê "Onde acompanhar".

## Pendência: revisar o menu Operacional (trabalho futuro)

A ordem atual parte de uma premissa antiga e não foi revista de ponta a ponta. Pontos observados em 24/11:

- **Apontamento** virou um grupo com um único item, no topo de Operacional. Grupo de item único é sinal de que o lugar ainda não está certo.
- O Apontamento vale para agricultura e pecuária, mas ainda há telas ligadas a ele dentro de **Agricultura** (planejamentos, romaneios). Falta decidir o que é do trabalho da equipe e o que é da cultura.
- **Ordens de Serviço** fica no fim de Operacional, mas, pela decisão de produto, a OS é contratação e segue a cadeia de compras (Administrativo › Suprimentos). Pode fazer mais sentido ficar perto de Suprimentos ou num grupo único com o Apontamento.
- Opção a avaliar: um grupo **"Trabalho e serviços"** com Central, Apontamentos, Minhas OS, Todas as OS, Em execução e A avaliar.
- O aplicativo também chama esse trabalho de OS e usa o mesmo banco; a revisão do menu deve sair junto do ajuste do app.
