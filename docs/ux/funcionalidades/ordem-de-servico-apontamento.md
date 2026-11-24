# Fim da Ordem de Serviço: Apontamento e Ordem de compra — Melhorias de UX

> **Decisão do dono (24/11/2026):** a Ordem de Serviço acabou. Trabalho da equipe entra pelo
> **Apontamento**; produto ou serviço de fora entra pela **Ordem de compra** (antiga Solicitação de
> compra). Na ordem de compra de serviço, o **Recebimento** confirma que o serviço foi feito. As edições
> 001 e 002 abaixo são o histórico da proposta anterior (OS como contratação de serviço).

- **Rota(s):** `/operacional/central` (Central, nova), `/operacional/apontamentos`, `/administrativo/solicitacao` (Ordens de compra). Desligadas: `/operacional/lista-os`, `/operacional/minhas-os`, `/operacional/monitoramento`, `/operacional/avaliacoes`
- **Código:** `src/config/v2/serviceOrdersFeature.ts` (chave `SERVICE_ORDERS_ENABLED = false`), `src/pages/Operacional/ServiceOrdersHub/` (Central), `src/components/ui/ModuleLinkCard.tsx`, menu em `src/config/v2/navigationTree.ts`, textos de Suprimentos em `src/constants/languages/*/languageRequest*.ts`
- **Permissões envolvidas:** `appropriations_view`, `request-purchases_view`, `request-receipts_view`
- **Última atualização:** 2026-11-24
- **Referência:** prints do ERP de revendas (Ordem de compra COMP0020), usados na proposta de refinamento

## Resumo por ação

| Ação | Situação hoje (problemas) | Melhorias aplicadas | Status |
|------|---------------------------|---------------------|--------|
| Ordem de Serviço | Quase sem uso; duplicava Apontamento e Compra | Telas de OS fora do menu e das rotas (código mantido, chave `SERVICE_ORDERS_ENABLED`) | implementada |
| Entrada | Não havia onde escolher entre trabalho da equipe e compra | Central "Trabalho e compras" com dois cards (Apontamento e Ordem de compra); a explicação fica no modal "Como funciona" | implementada |
| Nome | "Solicitação de compra" para produto e serviço | **Ordem de compra** no menu, títulos, botões, mensagens e avisos (pt-BR, en-US, es-ES) | implementada |
| Jornada | Ninguém via o caminho da compra até o pagamento | Pedir → Cotar → Aprovar → Comprar → Receber → Pagar no modal, na ordem dos status do sistema | implementada |
| Menu | "Apontamentos" escondido em Agricultura | Grupo "Trabalho e compras" (Central e Apontamentos); Suprimentos › "Ordens de compra" | implementada |
| Listar (vazio) | "Comece adicionando seu primeiro apontamento." | Estado vazio explica Apontamento × Ordem de compra | implementada |
| Finalizar apontamento | "Deseja continuar?" | Confirmação diz o efeito (estoque) e o próximo passo | implementada |
| Ordem de compra | Formulário sem fornecedor, prazo nem previsão de entrega | Proposta de refinamento com base no ERP de revendas (ver abaixo) | proposta |

## Proposta de refinamento da Ordem de compra (referência: ERP de revendas)

O que o ERP tem e a ordem de compra do Cerne ainda não mostra. Itens com **back-end** dependem de API.

| Ponto | No ERP | No Cerne hoje | Proposta |
|-------|--------|---------------|----------|
| Fornecedor e comprador no cabeçalho | Fornecedor, comprador e contato do vendedor na própria ordem | Fornecedor só aparece na cotação | Mostrar fornecedor escolhido e comprador no cabeçalho depois da cotação (front, leitura) |
| Previsão de entrega | Previsão de faturamento e de recebimento | Só data do pedido e SLA | Campo "Previsão de entrega" (back-end) |
| Itens com saldo | Qtde pedida, recebida e saldo por item | Quantidade e status do item | Colunas "Recebido" e "Saldo" na aba Itens e no Recebimento (front, se a API já devolve; senão back-end) |
| Totais | Total de produtos, frete, seguro e outras despesas | Total dos itens | Resumo de totais com frete (back-end para frete e despesas) |
| Autorizadores | Lista de autorizadores, alçada, data, situação e observação | Aprovação na tela de Autorização | Mostrar quem aprovou ou recusou e o motivo dentro da ordem (front, leitura do histórico) |
| Reabrir e cancelar | Ações "Reabrir" e "Cancelar" na própria ordem | Voltar etapa e mudar status | Manter as ações atuais com nomes claros: "Reabrir", "Cancelar" |
| Justificativa por item | Justificativa por produto | Justificativa geral | Manter geral; avaliar por item depois |
| Serviço | — | Recebimento com termos de produto (NF-e, receber) | No tipo Serviço, falar "Confirmar serviço" e "Serviço feito" no Recebimento (front) |
| Fiscal (ICMS, IPI, CBS/IBS) | Detalhe tributário por item | Fora do escopo | Fica fora: o Cerne não emite a NF da compra |

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

### UX-ordem-de-servico-apontamento-003 · Fim da OS · Ordem de compra no lugar — 2026-11-24
- **Status:** implementada (aguardando revisão do dono; sem commit)
- **Tipo:** fluxo · copy · menu
- **Decisão:** a OS acabou; trabalho da equipe = Apontamento; produto ou serviço de fora = Ordem de compra; o Recebimento confirma o serviço.
- **Mudanças técnicas:**

  | Arquivo | O que mudou |
  |---------|-------------|
  | `src/config/v2/serviceOrdersFeature.ts` | Novo: `SERVICE_ORDERS_ENABLED = false` |
  | `src/router/index.tsx` | Rotas de OS só com a chave ligada; Central em `/operacional/central`, guarda `appropriations_view` ou `request-purchases_view` |
  | `src/config/v2/navigationTree.ts`, `navigationPermissions.ts` | Grupo de OS só com a chave ligada; grupo "Trabalho e compras" com `ope-central` e `ope-agr-apo`; `adm-sup-sol` = "Ordens de compra" |
  | `src/pages/Operacional/ServiceOrdersHub/*` | Central com dois cards (por permissão), jornada da ordem de compra e atalhos (Apontamentos, Ordens de compra, Meus processos, Recebimentos) |
  | `src/constants/languages/*/languageRequest*.ts`, `languageSupplyStatusSlas.ts`, `languageSidebar.ts` | "Solicitação de compra" → "Ordem de compra" (3 idiomas). Relatórios não foram tocados. Script: `scripts/ux-docs/rename-ordem-compra.py` |
  | `src/components/Suprimentos/StepBackDialog.test.tsx` | Textos esperados com o nome novo |

- **Fica igual:** o status 1 do fluxo continua "Solicitação" (é a etapa, não o documento); rotas `/administrativo/solicitacao*` mantidas; API e permissões sem mudança.
- **Como validar:** o menu não mostra mais Ordens de Serviço; `/operacional/lista-os` não abre; Operacional › Trabalho e compras › Central mostra dois cards; Suprimentos › Ordens de compra › Novo abre "Nova Ordem de Compra".
- **App mobile:** ainda usa a OS e o mesmo banco; o ajuste equivalente está na seção "Web × App" abaixo.

## Web × App: comparação com o catálogo de fluxos do GB CERNE APP (24/11)

Fonte: catálogo de fluxos do projeto GB CERNE APP no GB Manager (126 fluxos aprovados, versão v1). O app tem dois aplicativos: **Administração (ADM)**, para o escritório, e **Operação (OPER)**, para o campo, que funciona sem internet e envia tudo pela Sincronização. Os dois usam o mesmo banco do web.

### Como cada tema aparece hoje

| Tema | Web (depois desta mudança) | App ADM | App OPER |
|------|----------------------------|---------|----------|
| Ordem de Serviço | Fora do menu e das rotas (chave `SERVICE_ORDERS_ENABLED`) | 1º ladrilho de Consultas: listar, criar em 7 etapas, cancelar, avaliar; indicadores na Visão geral | Seção "Ordens de serviço" no Início, "Minhas OS", iniciar, checklist, problemas e ações corretivas, anexos, concluir, histórico |
| Apontamento | Central › "Registrar trabalho da equipe" | Só consulta ("Apontamentos agrícolas") | Registro completo em 3 etapas e adição rápida; **só agrícola** |
| Ordem de compra | Central › "Fazer ordem de compra" e Suprimentos | Não existe | Não existe |
| Recebimento | Confirma produto e serviço | Não existe | Não existe |

### O que o catálogo mostra e pesa na decisão

- **No app a OS é despacho de trabalho interno**, não contratação: o escritório cria a OS no ADM, escolhe o "Responsável pela execução" (um usuário) e o executor a recebe no Início do OPER. Com o fim da OS, esse despacho deixa de existir; o Apontamento só registra o que já foi feito.
- **Concluir a OS não gera apontamento nem mexe em estoque.** Os insumos da Etapa 7 da OS são planejamento; a baixa de estoque só acontece pelo Apontamento. Isso reforça a decisão: a OS duplicava o trabalho sem efeito no custo.
- **O Apontamento do app é só agrícola** (talhão, cultura, safra). A OS aceitava o uso "Pecuária" e "Ambos" (lote e categoria). Trabalho pecuário genérico (cerca, manutenção) fica sem caminho no app; os manejos (sanitário, pesagem, transferência) continuam com telas próprias.
- **A Ordem de compra não existe no app.** Quem está no campo e precisa de um produto ou serviço de fora não tem como pedir pelo celular.

### Fluxos do catálogo afetados

| Situação | Fluxos | O que fazer |
|----------|--------|-------------|
| Saem com a OS (ADM, 10) | FLX-042, 043, 044, 045, 046, 057, 142, 143, 176, 177 | Marcar como obsoletos quando o app mudar |
| Saem com a OS (OPER, 8) | FLX-122, 124, 150, 151, 152, 153, 154, 155 | Marcar como obsoletos quando o app mudar |
| Texto cita OS | FLX-141 (Sincronização: "envio de OS e apontamentos"); Início e Sincronização (FLX-104, 136, 171, 173) a conferir | Revisar o roteiro |
| Ficam iguais | Apontamento: FLX-017, 064, 065, 066, 141 | Sem mudança |
| Novos (se aprovados) | Pedir ordem de compra no OPER; acompanhar e aprovar no ADM | Criar fluxos e telas |

### Recomendação ao conselho: o Apontamento é o que vai para o campo (24/11)

**Decisão do dono:** o Apontamento ocupa o lugar que a OS tinha no app. O escritório cria o apontamento e escolhe o responsável; a equipe recebe no app Operação, faz o trabalho e registra o que realmente usou. Vale para **Agricultura e Pecuária**.

| Etapa | Quem | Onde | O que acontece |
|-------|------|------|----------------|
| 1. Planejar | Escritório | Web (Apontamentos › Novo) ou app Administração | Uso (Agricultura ou Pecuária), local, operação, atividade, data, **responsável** e o previsto (pessoas, máquinas, insumos). Fica **Aberto** |
| 2. Receber | Equipe | App Operação › Início | Aparece em "Para fazer" para o responsável (o lugar das OS no Início) |
| 3. Executar | Equipe | App Operação | Confirma ou corrige o realizado: quantidades, horímetro, insumos, produção, ocorrências e fotos. Funciona sem internet |
| 4. Enviar | Equipe | Sincronização | O apontamento volta ao escritório |
| 5. Fechar | Escritório | Web | **Finalizar** (baixa do estoque e entrada da produção) e **Apropriar** (custo na área ou no lote) |

**Uso Pecuária** (o que a OS tinha e o Apontamento não tem): local = pasto, módulo ou curral; **lote** e **categoria**; sem cultura, safra e área utilizada; operações filtradas pelo uso; armazém de produção opcional.

**O que se aproveita:** a seção do Início, os botões "Iniciar" e "Concluir" e a fila de envio que hoje servem à OS passam a servir ao apontamento atribuído. O registro direto no campo (FLX-064, 065) continua para o trabalho que ninguém planejou.

**Depende do back-end:**
- Apontamento com `batch_uuid` e categoria (hoje a API só tem área, cultura e safra) e custo apropriado ao lote.
- Responsável do apontamento distinto de quem criou e lista "atribuídos a mim".
- Baixar para o app os apontamentos Abertos atribuídos e aceitar a atualização pela Sincronização (hoje `POST /sync/appropriations` só cria).

**Só front (web):** campo Uso e responsável no formulário, filtro de operações pelo uso e esconder os campos agrícolas na Pecuária, depois que a API aceitar.

### Proposta para o app

1. **ADM:** tirar o ladrilho "Ordem de Serviço" de Consultas (12 → 11) e os indicadores de OS da Visão geral; "Apontamentos agrícolas" vira "Apontamentos" e ganha "Novo apontamento" para o escritório planejar.
2. **OPER:** a seção "Ordens de serviço" do Início vira "Para fazer" (apontamentos atribuídos); o grupo "Minhas OS" sai da Sincronização (7 recursos e `POST /sync/my-service-orders`) e entra o de apontamentos atribuídos.
3. **Apontamento pecuário** no OPER e no web, como acima.
4. **Ordem de compra no app (fase 2):** no OPER, "Pedir produto ou serviço" simples; no ADM, consultar e **aprovar**.
5. **Back-end:** desligar a criação de OS na API só depois que web e app estiverem sem OS; as OS já cadastradas seguem a decisão de arquivar ou converter (uma OS Aberta pode virar apontamento Aberto).

## Pendência: revisar o menu Operacional (trabalho futuro)

A ordem atual parte de uma premissa antiga e não foi revista de ponta a ponta. Pontos observados em 24/11:

- **Apontamento** virou um grupo com um único item, no topo de Operacional. Grupo de item único é sinal de que o lugar ainda não está certo.
- O Apontamento vale para agricultura e pecuária, mas ainda há telas ligadas a ele dentro de **Agricultura** (planejamentos, romaneios). Falta decidir o que é do trabalho da equipe e o que é da cultura.
- **Ordens de Serviço** fica no fim de Operacional, mas, pela decisão de produto, a OS é contratação e segue a cadeia de compras (Administrativo › Suprimentos). Pode fazer mais sentido ficar perto de Suprimentos ou num grupo único com o Apontamento.
- Opção a avaliar: um grupo **"Trabalho e serviços"** com Central, Apontamentos, Minhas OS, Todas as OS, Em execução e A avaliar.
- O aplicativo também chama esse trabalho de OS e usa o mesmo banco; a revisão do menu deve sair junto do ajuste do app.
