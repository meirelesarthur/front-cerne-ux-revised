# Solicitação e Ordem de compra, Tipos de serviço e Operações

Atualizado em 26/11/2026 · Status: feito + protótipo (não portar) + proposta

Relacionados: [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md) (fim da OS, Apontamento, Web × App),
[central-de-agrupador.md](central-de-agrupador.md) (centrais do menu)

> O nome do arquivo (`ordem-de-compra-unica-...`) ficou do começo da frente; desde 26/11 a tela única é a de
> **Solicitações de compra** e a **Ordem de compra** é outra coisa (ver "Regras vigentes").

## Regras vigentes

**Cadastros (Tipos de serviço, Serviços e Operações)**

- **24/11 — Renomeação:** o cadastro atual de **Operações** passa a se chamar **"Tipos de serviço"** e o de
  **Atividades** passa a se chamar **"Serviços"**.
- **Recomendação (24/11):** muda só o que a pessoa vê (rótulos, menu, títulos, mensagens, web e app). Tabelas, colunas,
  rotas da API e chaves de permissão (`operations_*`, `activities_*`) continuam com o nome antigo. Relatórios não
  mudam (regra do repositório). Detalhe no anexo "Mapa de impacto no backend".
- **26/11 — Tipo de serviço guarda todos os parâmetros:** é ele que diz o que o Apontamento pede (uso, exige safra,
  cultura, lote e área utilizada, lançamentos obrigatórios, gera produção, ocorrência, fotos, texto, assinatura,
  avisar ao concluir) e tem o parâmetro **"Gera execução"**:
  - **Sim:** o serviço comprado por ordem do tipo Serviço gera a execução (Apontamento) ao ser recebido;
  - **Não:** a ordem só registra a compra e o custo.
- **26/11 — Serviço é só uma descrição simples com situação** (ativo ou inativo), sem parâmetros.
- ~~**24/11 — Os parâmetros ficam no Serviço.**~~ **Substituída em 26/11** pelas duas regras acima. Como um Serviço
  pode estar em vários Tipos de serviço (ligação muitos-para-muitos), vale a regra do Tipo de serviço escolhido no par
  "Tipo de serviço · Serviço".
- **Apontamento (24/11):** um campo só, chamado **"Serviço"**, que mostra "Tipo de serviço · Serviço" (ex.:
  "Pulverização · Aplicação de herbicida") e continua enviando `operation_uuid` e `activity_uuid`.
- **24/11 — Nasce um cadastro novo, "Operações"**, usado na **Ordem de compra**: campo obrigatório no cabeçalho, sem
  Atividade, levado à despesa gerada. Não é o cadastro antigo (esse virou "Tipos de serviço").
- **26/11 — A Operação é da Ordem de compra** (a entidade nova, de fornecedor único), não da Solicitação: a regra de
  24/11 foi escrita quando "Ordem de compra" era o nome da Solicitação; a decisão do dono confirma que o campo fica na
  Ordem (gerada ou avulsa) e segue dela para a despesa.
- **24/11 — A Operação classifica o custo:** cada Operação tem categoria financeira e centro de custo padrão; na
  autorização, o rateio vem preenchido com eles (100%) e quem organiza a despesa pode ajustar ou dividir, como hoje.
- **26/11 — Ordem de compra do tipo Serviço passa a usar Tipo de serviço e Serviço** (campo "Serviço" no item), em vez
  de texto livre. Ainda não está no protótipo nem na API (ver "A fazer").

**Solicitação de compra × Ordem de compra (conceito de 26/11, depois da conversa do dono com o CEO)**

- **26/11 — A Solicitação de compra continua como era:** mantém os ajustes visuais e a tela única com o combo de status.
  O nome "Ordem de compra" dado a ela em 24/11 (`521ead7`) foi desfeito (`2920f89`).
- **26/11 — A Ordem de compra é nova e é de um único fornecedor.** Começa sozinha (**avulsa**) ou nasce de uma
  Solicitação.
- **26/11 — Uma Solicitação gera N Ordens:** se um fornecedor não tem todos os itens, nascem várias ordens, uma por
  fornecedor. A Solicitação continua viva e ligada às suas Ordens, e mostra quanto de cada item já está em ordem.
- **26/11 — A tela única com o combo de status é a lista de Solicitações** (menu "Solicitações de compra"); as Ordens
  têm lista e detalhe próprios (menu "Ordens de compra").
- **26/11 — O que é da Ordem (fornecedor único) sai da Solicitação:** fornecedor, previsão de entrega, entrega,
  pagamento, notas fiscais, recebimento e cancelar saldo. Na Solicitação ficam cotação (onde se escolhem os
  fornecedores), autorização, rateio, vínculos, "Gerar ordens", duplicar e reabrir.
- **26/11 — A previsão de entrega é uma só, da ordem** (o fornecedor é um só), não de cada item.
- **25/11 (Pietro, decisão 4 do plano) — 4 categorias + 2 marcações no lugar dos 11 tipos:** Produto (Produto);
  Serviço (Serviço, Diária, Empreitada, Frete, Manutenção); Reembolso e adiantamento (só financeiro); Despesa fixa.
  Emergencial vira a marcação **Urgência** (perfil Simples) e Compra efetuada vira **Regularização** (pula a
  cotação). Manutenção dentro de Serviço é ponto a conferir na F0. **26/11: categoria e marcação aparecem na
  Solicitação e na Ordem.**
- ~~**Protótipo com 6 categorias** (Insumos, Manutenção, Serviços, Adiantamento e reembolso, Despesas fixas, Frete),
  mantendo Emergencial e Compra efetuada como tipos~~ — **substituída em 26/11** pela regra acima (`9df55f8`).
- **26/11 — A nova OS entra em Serviço**, pelo "Gera execução" do Tipo de serviço, sem categoria nova.
- ~~**24/11 — Todas as telas de solicitação convergem numa única "Ordens de compra"**, filtrável por status
  (solicitação, cotação, aprovação, compra, recebimento, encerradas).~~ **Substituída em 26/11:** convergem numa única
  **"Solicitações de compra"**, com o mesmo filtro por status.

**Visual e protótipo**

- **25/11 — Pedido do dono para o visual:** a ordem de compra é complexa e a aba de cotações estava ruim; visual
  minimalista e funcional, no padrão do sistema.
- **25/11 — Protótipo da Ordem de compra (não portar):** serve para apresentar o fluxo antes de a API existir. Só liga
  com dados fictícios; no front oficial fica sempre desligado. O `StepTrack` do kit é portável.
- **27/11 — Etapas da Solicitação por perfil, terminando na Ordem de compra:** **Simples** Pedido → Ordem de compra;
  **Padrão** Pedido → Cotação → Aprovação → Ordem de compra; **Completo** Pedido → **Ciência** → Cotação → Aprovação →
  Ordem de compra. A **ciência do gestor vem logo depois do pedido** (perfil Completo). Recebimento e encerramento são
  de cada Ordem, na tela dela. ~~Padrão e Completo com as mesmas etapas, a "ciência da diretoria" depois da aprovação e
  a linha indo até Recebimento e Encerrada~~ — substituída em 27/11.
- **27/11 — A previsão de entrega da Ordem é só leitura** (sem "Alterar previsão"). ~~"Definir/Alterar previsão" no
  detalhe da Ordem (26/11)~~ — substituída em 27/11.
- **27/11 — Mapa de cotações abre em pop-up, no lugar do Excel:** compara os fornecedores item a item, com o **mais
  barato no geral primeiro** (quem cotou todos os itens, do menor para o maior total; depois quem cotou parte; por
  último quem não respondeu), o **menor preço de cada item** em destaque e o "**melhor de cada item**" (total, quantos
  fornecedores e economia sobre o melhor total).
- **26/11 — Aprovação automática por Valor, Prazo e Contagem** (tela "Fluxo da ordem de compra", protótipo): a soma
  das ordens aprovadas sem aprovador dentro do **prazo** (diário, semanal, mensal ou anual) não passa do **valor**;
  acima dele, a ordem vai para o aprovador. A **contagem** decide a janela: **dias corridos** conta para trás a partir
  de hoje (1, 7, 30 ou 365 dias, incluindo hoje); **período fechado** corta no início do período (hoje, segunda-feira
  da semana, dia 1 do mês, 1º de janeiro).
- ~~**26/11 — "Aprovação automática até" (valor por ordem) com o interruptor "Limite diário"**~~ (outra sessão, sem
  commit). **Substituída em 26/11** pela regra acima.
- ~~**26/11 — Aprovação automática com valor por ordem, limite diário e transações por dia, que se redistribuíam
  (limite diário = valor por ordem × transações por dia)**~~ (commit `9b70d01`). **Substituída em 26/11** pela regra
  acima.
- **26/11 — Cores:** o status **"Pedido Não Aprovado"** passou de rosa para **laranja sóbrio** (token `supplyStatus5`),
  distinto do vermelho de Cancelado; a linha do tipo **Emergencial** ficou em **rosado pastel** (token
  `supplyEmergencyRowBg`).

## O que mudou

### Tela única de Solicitações de compra (feito, 25/11; nome corrigido em 26/11)

> Nasceu como "Ordens de compra" em 25/11; desde 26/11 é a lista de **Solicitações** (menu "Solicitações de compra").
> A rota ficou a mesma.

- **Rota:** `/administrativo/ordens-de-compra?visao=<visão>`; abre com qualquer uma das 6 permissões de leitura das
  listas. Sem `?visao`, abre em **Todas**.
- **Visões**, num **seletor único** (`components/ui/ViewSelect.tsx`: ícone + nome + contador; menu com todas e check
  na atual): Todas (`/request-purchases?scope=all`), Criadas por mim (`/request-purchases`), Comigo (`my-processes`),
  Para eu aprovar (`/request-authorizations`), Em cotação (`in-quotation`), Em compra (`in-purchase`), Recebimento
  (`/request-receipts`), Rejeitadas (`rejected?status=5`) e Canceladas (`rejected?status=10`). Cada visão só aparece
  para quem tem a permissão da lista de origem; `?visao=encerradas` (link antigo) abre Rejeitadas.
- **Linha única de controles:** busca e, à direita dela, o seletor; no outro extremo, configurar colunas, Filtros e
  **Novo** (fixo em toda visão, para quem pode criar). Toda visão tem busca e Filtros ("Comigo" ganhou os dois).
- **Contador** de cada visão: o `pagination.total` da própria lista, pedido com 1 item
  (`OrdensCompra/usePurchaseOrderViewCounts.ts`); atualiza junto com a lista.
- **Clique na linha** abre a ordem: em "Para eu aprovar", a tela de autorização; nas demais, a **visualização**. Na rota
  antiga de "Criadas por mim" o clique também passou a abrir a visualização (antes abria a edição).
- **Aviso de ordens negadas** (`DeniedRequestsModal`) não abre na tela única; continua nas rotas antigas.
- **Como:** cada visão é a lista atual embutida (`components/EmbeddedList.tsx`), com mesmas colunas, filtros, ações por
  linha e diálogos. O contexto agora leva: `toolbarStart`/`toolbarEnd` (seletor e Novo na linha da busca),
  `fixedFilter` (situação ou escopo imposto pela visão), `onRowOpen` (clique na linha) e o ponto `actionsTarget`, para
  onde o `HeaderGrid` manda os botões da lista. Leem o contexto: `ContainerGrid`, `PageHeader`, `HeaderGrid`,
  `ListToolbar`, `Table` e `DeniedRequestsModal`; fora da tela única nada muda.
- **Menu:** Suprimentos mostra "Solicitações de compra" e "Parâmetros SLA" (com o protótipo ligado, também "Ordens de
  compra" e "Fluxo da ordem de compra"). Chave `UNIFIED_PURCHASE_ORDERS_ENABLED`
  (`config/v2/purchaseOrdersFeature.ts`); com `false` volta o menu antigo. As rotas antigas seguem vivas (sino,
  favoritos, links).
- O que ainda depende da API está em "A fazer".

### Visual da Ordem de compra (feito, 25/11)

- **Topo:** situação (tag com a cor da lista), código e responsável atual na linha do título, sem faixa própria.
- **Ações de trâmite** (Receber, Transferir, Voltar etapa, Justificativa da cotação, Finalizar) no **rodapé**, à
  direita, antes de Salvar; só aparecem para quem pode executá-las.
- **Dados Gerais fixos acima das abas**, sem títulos de seção: Código, Tipo, Prioridade, Data do pedido, Solicitante,
  Encarregado (e NF-e na visualização), depois Descrição/Chamado, Justificativa e Observação. Edição em 3 colunas e
  áreas de texto com 3 linhas; visualização em 4 colunas e 2 linhas, para as abas aparecerem na primeira tela
  (1366×768).
- **Abas** abaixo: Itens, Anexos, Histórico, Cotações e, só na visualização e quando há dado, Autorização,
  Recebimento, Rateio e Sub Solicitações (`RequestPurchaseViewSections.tsx`, uma seção por aba; Responsável,
  Prioridade, Tipo e Mapa de cotações não se repetem). `?tab=0` antigo abre Itens; erro de validação em Dados Gerais
  rola até eles.
- **Itens, Anexos e Rateio/Sub Solicitações em tabela** (`SimpleTable`), com cabeçalho "título + contador + ação" e
  vazio tracejado (`Solicitacao/RequestTabParts.tsx`). Itens editáveis na própria linha; **todo item tem Valor (R$) e
  Descrição** (obrigatórios só onde o schema exige; o envio já manda os dois). Anexos com upload compacto
  (`FileUpload compact`).
- **Histórico em linha do tempo** (`components/ui/EventTimeline.tsx`): do mais recente para o mais antigo, ponto na
  cor da situação, data, responsável, tempo gasto e justificativa.
- **Cotações:** os cartões altos viraram um **comparativo**:
  - resumo no topo: fornecedores, respondidas ("3 de 15") e menor valor com o fornecedor;
  - tabela (`SimpleTable`) com Fornecedor (data e quem cotou), Situação, Valor, Desconto, **Valor final** e Saving;
    recebidas primeiro, do menor para o maior valor final, com a marca "Menor valor"; cotação ainda não recebida
    mostra "—" no lugar de R$ 0,00 (regra em `quotationRanking.ts`, com teste);
  - marcar todas no cabeçalho; "Enviar e-mail (n)" só aparece com cotação marcada;
  - "Enviar para autorização" saiu do menu de cada cotação (ele age sobre a ordem, não sobre a cotação) e foi para o
    cabeçalho da aba; com ao menos uma cotação recebida ele vira a ação principal e "Adicionar fornecedor" fica
    secundário.

### Mudanças globais que nasceram aqui (feito, 25/11)

- **Ícone de configurar colunas** em todas as listas: papel `columns-settings` (`Columns3CogIcon`, HugeIcons) em
  `design/icons.ts`; o botão do `GridSettingsFloatingPanel` ganhou a moldura e a altura do "Filtros".
- **`FormContainer`:** a área de rolagem não alarga mais com conteúdo largo (`min-width: 0`); tabelas largas rolam
  dentro delas.
- **`Table`:** aceita "abrir linha" vindo do `EmbeddedList` (`onRowOpen`), sem mudar as outras telas.

### Cores de status e linha Emergencial (feito, 26/11)

- **Pedido Não Aprovado (status 5):** laranja sóbrio no lugar do rosa do legado. Token `supplyStatus5` em
  `styles/theme/semantic/light.ts` e `dark.ts` (tipo em `@types/theme.d.ts`); usado por
  `constants/RequestPurchases/request-purchase-status.ts`.
- **Linha do tipo U (Emergencial):** rosado pastel, token `supplyEmergencyRowBg` (claro e escuro), aplicado pela
  `Table` (`getRowHighlight`) com a regra `components/Suprimentos/emergencyRow.ts` nas listas de Suprimentos.

### Protótipo visual para apresentação (protótipo, não portar)

Plano: documento "Ordem de compra — protótipo visual para apresentação" (roteiro de 9 passos, 16 peças, 5 lotes),
feito sobre o plano "Ordem de compra — validação e plano" (fases F0–F6). Mostra o fluxo antes de construir a API.

- **Chave:** `PURCHASE_ORDER_PROTOTYPE` (`config/v2/purchaseOrderPrototype.ts`). Só liga com os dados fictícios
  (`yarn dev` com mocks ou build de demonstração); `VITE_PURCHASE_ORDER_PROTOTYPE=false` desliga. No front oficial é
  sempre `false`.
- **Dados de demonstração** (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`): 10 ordens de fazenda, uma em cada
  situação, com itens, movimentações, aprovador, rateio e cotações coerentes; respondem às 9 visões da lista, ao
  detalhe e às cotações. A ordem do roteiro é a **0012** (adubação de plantio, compra efetuada, AgroNutri). Nomes
  todos fictícios.
- **Campos de protótipo** (ainda não existem na API; tipos em `Solicitacao/prototype/prototypeFields.ts`): na ordem,
  `flow_profile` (Simples, Padrão, Completo), `winning_provider`, `buyer`, `cancelled_at_step`, `delivery_forecast` (~~a
  mais tarde entre os itens~~; 26/11: uma data da ordem), `delivery` (`freight_type` CIF/FOB, `place`, `carrier`, `needs_unloading`, `note`)
  `approvals[]` (`level`, `level_label`, `user`, `status` approved/rejected/pending, `decided_at`, `note`), `payment`
  (`condition`, `installments[]` com `seq`/`due_date`/`value`/`status`, `expenses` frete/seguro/outras), `invoices[]`
  (`issuer`, `number`, `series`, `issued_at`, `entered_at`, `value`) e `receipt_partial`; no item, `unit_price`,
  `received_quantity` e `cancelled`. A origem usa os campos que a API já tem (`parent`, `children`), só que hoje não
  vêm no detalhe.

| Lote | Peça | Onde | Situação |
|---|---|---|---|
| 1 | Dados de demonstração | `mocks/dev-api/handlers/purchaseOrdersDemo.ts` | feito |
| 1 | Etapas da OC no topo (Pedido → Cotação → Aprovação → Compra → Recebimento → Encerrada; a etapa que o perfil não tem não aparece e a numeração conta só as que existem; parada em vermelho) | `components/ui/StepTrack.tsx` (kit, portável) + `Solicitacao/prototype/purchaseOrderSteps.ts` (regra, com teste) | feito |
| 1 | Fornecedor e comprador no topo. **26/11:** na Solicitação ficaram Comprador e "Ordens de compra geradas"; o fornecedor é da Ordem | `Solicitacao/prototype/PurchaseOrderProcessBar.tsx` | feito; mudou em 26/11 |
| 2 | Itens com saldo na visualização: Qtde, Vlr. unitário, Vlr. total, Recebido, Saldo, Previsão e total (edição continua no `RequestItemRow`). **26/11:** na Solicitação, Recebido/Saldo viraram **Em ordem / Sem ordem**, a Previsão por item saiu e o rodapé diz "Total da solicitação"; Recebido e Saldo estão na Ordem | `Solicitacao/prototype/PrototypeItemsTable.tsx`; conta em `itemTotals` (com teste) | feito |
| 2 | ~~Previsão de entrega no topo da Solicitação, selo "Atrasada" e "Alterar"~~ — **26/11:** a previsão é da Ordem (uma por ordem, "Definir/Alterar previsão" no detalhe dela) | `PurchaseOrderProcessBar.tsx`; regra `isDeliveryLate` (com teste) | feito |
| 2 | Selo "Atrasada" na lista (Todas e Criadas por mim) | `Solicitacao/index.tsx`, coluna Descrição | feito |
| 2 | Aba Entrega: frete CIF/FOB, transportadora, descarga, destino e observação. **26/11:** saiu da Solicitação e está na Ordem (`PrototypeDeliveryPanel`) | `RequestPurchaseViewSections.tsx`, seção `delivery` | feito |
| 3 | Aprovações na aba Histórico (nível de alçada, aprovador, situação, data, parecer), acima da linha do tempo | `Solicitacao/prototype/PrototypeApprovalsTable.tsx`; campo `approvals[]` | feito |
| 3 | Aba Vínculos na visualização: ordem de origem e derivadas, com link (no lugar de Sub Solicitações); dado de demonstração: 0022 separada da 0013 | `RequestPurchaseViewSections.tsx`, seção `links` | feito |
| 3 | Duplicar: botão no rodapé (quem pode criar), diálogo com os itens marcáveis e "Nova ordem" preenchida (data de hoje; sem código, anexos, cotações e histórico) | `DuplicateOrderDialog.tsx`; regra `buildDuplicateState` (com teste); leitura do estado em `CreateOrUpdateSolicitacao.tsx` (por `location.key`, porque /visualizar e /novo reaproveitam a instância) | feito |
| 4 | Aba Pagamento: condição, despesas (frete, seguro, outras), parcelas e conferência parcelas × (itens + despesas). **26/11:** saiu da Solicitação e está na Ordem | `Solicitacao/prototype/PrototypeFinancePanels.tsx`; regra `paymentCheck` (com teste) | feito |
| 4 | Aba Notas fiscais: NFs com a soma ao lado do total. **26/11:** saiu da Solicitação e está na Ordem | `PrototypeFinancePanels.tsx` | feito |
| 4 | Registrar recebimento: NF + quantidade (inteira) por item (padrão = saldo); saldo cai e, sem saldo, vira recebida; NF entra na aba. **26/11:** ação da Ordem (`PrototypeReceiptDialog`), não mais da Solicitação | `PrototypeOrderActions.tsx` (rodapé); rota simulada `/prototype/receipt` | feito |
| 4 | Cancelar saldo, cancelar item e reabrir, com justificativa. **26/11:** Cancelar saldo é da Ordem; "Cancelar item" saiu da Solicitação; Reabrir ficou na Solicitação | `PrototypeOrderActions.tsx`, `PrototypeItemsTable.tsx`; rotas `/prototype/cancel-balance`, `/cancel-item`, `/reopen` | feito |
| 5 | Tela "Fluxo da ordem de compra" (`/administrativo/ordens-de-compra/parametros`, item de menu `adm-sup-flx` em Suprimentos): perfil Simples/Padrão/Completo, categorias com os tipos atuais, cotação por faixa de valor (editável), aprovação automática por **Valor, Prazo (diário, semanal, mensal, anual) e Contagem (dias corridos ou período fechado)**, com a frase "Hoje entram na soma as ordens de <início> até <hoje>" e níveis de alçada; "Salvar" só avisa (protótipo) | `OrdensCompra/PurchaseOrderFlowSettings.tsx`; regra `Solicitacao/prototype/autoApprovalWindow.ts` (com teste); rota e menu só com `PURCHASE_ORDER_PROTOTYPE`. A regra de redistribuição `autoApprovalLimits.ts` (e seu teste) saiu | feito |
| 5 | Diagrama do fluxo (F0): uma linha de etapas por perfil, só com as etapas que o perfil tem (linhas de tamanhos diferentes), legenda do que muda e as exceções (recusa, recebimento parcial, cancelamento, reabrir) | topo da mesma tela, `StepTrack` | feito |
| 5 | Categoria no lugar do Tipo: campo somente leitura ao lado de Tipo, derivado dele. ~~6 categorias~~ — **26/11: 4 categorias + 2 marcações** (o campo mostra, por exemplo, "Produto · Urgência"); tabela "Marcações" no "Fluxo da ordem de compra" | `Solicitacao/prototype/purchaseOrderCategories.ts` (`categoryOfType`, `markOfType`, com teste); `CreateOrUpdateSolicitacao.tsx`; `PurchaseOrderFlowSettings.tsx` | feito |

**Ações simuladas (lote 4):** chamam `/request-purchases/{uuid}/prototype/*` (`prototype/prototypeActions.ts`), rotas
que só existem nos dados de demonstração. Mudam a ordem na memória do navegador e cada uma vira um evento na linha do
tempo; **recarregar a página volta tudo ao estado inicial** (útil para repetir a apresentação). Com o protótipo ligado,
o "Receber" original (API real) fica escondido.

### Solicitação gera N Ordens de compra (protótipo, não portar, 26/11)

- **Solicitação, rodapé:** "Gerar ordens de compra" (enquanto houver item sem ordem e a Solicitação não estiver
  encerrada ou cancelada). No diálogo, cada linha diz quanto do item vai para qual fornecedor; "Dividir" cria outra
  linha do mesmo item para outro fornecedor; quantidade inteira. Nasce **uma Ordem por fornecedor** e a Solicitação
  continua aberta.
- **Solicitação, aba Vínculos:** "Solicitação de origem", "Solicitações derivadas", **"Ordens de compra geradas"**
  (código que abre a Ordem, fornecedor, itens, previsão e situação) e **"Itens em ordem"** (pedido, em ordem, sem
  ordem). **Faixa do topo:** Comprador e "Ordens de compra geradas".
- Arquivos: `Solicitacao/prototype/generateOrders.ts` (`itemCoverage`, `validateGenerateOrders`,
  `buildGenerateOrdersPayload`, com teste), `GenerateOrdersDialog.tsx`, `PrototypeGeneratedOrders.tsx`,
  `PrototypeOrderActions.tsx`, `RequestPurchaseViewSections.tsx`; rota simulada
  `/request-purchases/{uuid}/prototype/generate-orders`. Kit: `CustomDialog`, `NumberInput`, `Select`, `SimpleTable`.

### Tela própria da Ordem de compra (protótipo, não portar, 26/11)

- **Lista** `/administrativo/ordens-de-compra/ordens` (menu Suprimentos → "Ordens de compra", `adm-sup-oc`): visões
  Abertas / Recebidas / Todas (com contagem), origem (qualquer, da solicitação, avulsas), busca por código,
  fornecedor, solicitação ou fazenda; colunas situação, código (abre o detalhe), fornecedor, solicitação de origem
  (abre a Solicitação) ou "Avulsa", fazenda, previsão de entrega e total. Botão **"Nova ordem avulsa"**.
- **Detalhe** `/administrativo/ordens-de-compra/ordens/:uuid`: situação no topo; dados da ordem (fornecedor e
  telefone, fazenda, data, **previsão de entrega da ordem** com "Definir/Alterar previsão", total, **Categoria ·
  marcação**); **Origem** com link para a Solicitação (abre na aba Vínculos) ou "começou sozinha"; abas **Itens**
  (qtde, unitário, total, **Recebido**, **Saldo**), **Entrega**, **Pagamento** e **Notas fiscais**; rodapé
  **Registrar recebimento** (parcial fica "Compra Efetuada", sem saldo vira "Compra Recebida") e **Cancelar saldo**.
- **Nova ordem avulsa** `/administrativo/ordens-de-compra/ordens/nova`: fornecedor, fazenda, previsão, categoria
  (obrigatória) e marcação, itens (descrição, quantidade inteira e valor unitário, com total na hora), **Entrega**
  (só grava com o local) e **Pagamento** (só grava com a condição; parcelas iguais sobre itens + despesas, em
  centavos, a última absorve o arredondamento, com prévia "N parcela(s) de R$ X — total R$ Y").
- Arquivos: `OrdensCompra/prototype/purchaseOrderEntity.ts` (tipos, chamadas e regras de lista e saldo, com teste),
  `standaloneOrder.ts` (validação, parcelas e envio, com teste), `PurchaseOrderEntityList.tsx`,
  `PurchaseOrderEntityDetail.tsx`, `PurchaseOrderStandaloneForm.tsx`; painéis reaproveitados de
  `Solicitacao/prototype/PrototypeFinancePanels.tsx` (`PrototypeDeliveryPanel`, `PrototypePaymentPanel`,
  `PrototypeInvoicesPanel`); rotas só com `PURCHASE_ORDER_PROTOTYPE`; dados em `purchaseOrdersDemo.ts` (rotas
  `/prototype/purchase-orders*`: ordens geradas pelas Solicitações — a 0012 já com a OC-0012-1 — e avulsas OC-0031 e
  OC-0029). Kit: `PageHeader`, `ViewSelect`, `ListToolbar`, `SimpleTable`, `StatusTag`, `FormContainer`,
  `InputReadOnly`, `CustomDialog`, `RepeaterList`, `ToggleRow`, `MaskedInput`.

### Etapas por perfil e mapa de cotações (protótipo, não portar, 27/11)

- **Etapas:** regra `Solicitacao/prototype/purchaseOrderSteps.ts` (com teste) ganhou a etapa **Ciência** (só no
  Completo, logo após o pedido; a situação 4 "Aguardando Ciência" fica nela, e no perfil sem Ciência conta como
  Aprovação) e `profilePath` (o caminho de cada perfil); a linha **termina em "Ordem de compra"** (situação 6 em
  andamento; 7, 8 e 9 concluída). Recebimento e Encerrada saíram da linha da Solicitação.
- **Tela "Fluxo da ordem de compra":** cada perfil num cartão, nome e resumo em cima e a linha de etapas **numerada**
  na largura toda (antes, todas apareciam como concluídas e Padrão e Completo ficavam iguais); a dica explica que a
  Solicitação termina ao gerar as Ordens.
- **Kit `StepTrack`:** o nome da etapa quebra em até 2 linhas; ganhou a prop opcional `group` (faixa com o nome do
  grupo acima das etapas), que hoje não é usada. Sem `group`, nada muda.
- **Detalhe da Ordem:** "Alterar previsão" e o diálogo saíram; a previsão fica só para leitura.
- **Dados de demonstração:** a **0021** (Completo) para na Ciência logo depois do pedido; a **0022** virou "Plantio do
  milho — talhão 12" com **5 itens** (semente, inoculante, tratamento de sementes, NPK e herbicida) e **4 cotações**
  com preço por item, frete, desconto, prazo e condição (duas cotaram só parte dos itens).
- **Mapa de cotações:** na aba Cotações, "Mapa de Cotações" abre `QuotationMapDialog` (com o protótipo ligado; sem ele,
  continua o Excel). Resumo (melhor total, melhor de cada item, cotações recebidas), tabela item × fornecedor (preço
  unitário e total da linha; menor preço em verde com "Menor"; "—" quando não cotou; marcas "Melhor total" e "N de 5
  itens") e, embaixo, subtotal, frete, desconto, total, prazo e condição. Regra `Solicitacao/prototype/quotationMap.ts`
  (com teste); rota simulada `/request-purchases/{uuid}/prototype/quotation-map`. Kit: `CustomDialog`, `SimpleTable`,
  `StatusTag`.

### Ajustes globais de 26/11

- **Trilha do topo:** `findItemByPath` (`config/v2/navigationTree.ts`) escolhe o item de menu **mais específico**
  quando não há caminho exato (antes as telas da Ordem mostravam "Solicitações de compra"). Vale para todas as telas.
- **Quantidade inteira** nos diálogos "Gerar ordens" e "Registrar recebimento" (digitar "200" dá 200).

### Tipos de serviço, Serviços e cadastro novo de Operações

- **27/11 (protótipo, não portar):** telas de cadastro de **Tipos de serviço** (com todos os parâmetros e o "Gera
  execução") e de **Serviços** (só descrição, situação e os tipos em que aparece), com dados de demonstração, em
  [tipos-de-servico-e-servicos.md](tipos-de-servico-e-servicos.md).
- Ainda por fazer: o cadastro de verdade (API), o Apontamento lendo os parâmetros e o campo "Serviço" na ordem (ver
  "A fazer" abaixo e o doc acima).

## Como validar

**Tela única de Ordens de compra**

1. Abrir `/administrativo/ordens-de-compra` (sem `?visao`): abre em Todas.
2. Trocar a visão no seletor ao lado da busca; conferir o contador de cada uma e que só aparecem as visões da sua
   permissão.
3. `?visao=encerradas` abre Rejeitadas.
4. Clicar numa linha: em "Para eu aprovar" abre a autorização; nas demais, a visualização.
5. Com `UNIFIED_PURCHASE_ORDERS_ENABLED = false`, o menu antigo de Suprimentos volta.

**Visual da Ordem de compra**

1. Abrir uma ordem na visualização em 1366×768: Dados Gerais em 4 colunas e as abas visíveis na primeira tela.
2. Aba Cotações: resumo no topo, comparativo ordenado do menor para o maior valor final, "—" em cotação não recebida.
3. Aba Histórico: linha do tempo do mais recente para o mais antigo.

**Protótipo (só com dados fictícios: `yarn dev` com mocks ou build de demonstração)**

1. Roteiro dos 9 passos: 1–2 em "Fluxo da ordem de compra"; 3 na lista (Todas, contadores, selo Atrasada); 4 na
   0012 ou em Duplicar; 5 na aba Cotações; 6 em Histórico → Aprovações; 7 em Pagamento e Entrega; 8 em "Registrar
   recebimento"; 9 em "Cancelar saldo" e na linha do tempo.
2. `/administrativo/ordens-de-compra/parametros`, seção Aprovação: Valor, Prazo e Contagem numa linha; com Mensal +
   Período fechado a frase diz "de 01/<mês> até hoje"; com Semanal + Dias corridos, "dos últimos 7 dias até hoje".
   Regra `Solicitacao/prototype/autoApprovalWindow.ts` (com teste); a regra antiga `autoApprovalLimits.ts` saiu.
3. Recarregar a página: as ações simuladas voltam ao estado inicial.

**Solicitação × Ordem de compra (protótipo, dados fictícios)**

1. Menu Suprimentos: "Solicitações de compra" abre a tela única; "Ordens de compra" abre a lista das Ordens.
2. Solicitação **0013** → "Gerar ordens de compra" → "Dividir": 200 para AgroNutri e 120 para Campo Forte →
   "Gerar 2 ordem(ns)". Na aba Vínculos aparecem OC-0013-1 e OC-0013-2 e o item com 0 sem ordem; o botão some.
3. Clicar no código da ordem: abre o detalhe da Ordem, com "Gerada a partir da solicitação 0013".
4. **OC-0031** (avulsa): "Registrar recebimento" de 3.000 → saldo 2.000, NF na aba Notas fiscais; "Cancelar saldo"
   → "Compra Recebida" e os botões somem.
5. **OC-0012-1**: a previsão de entrega aparece só para leitura (sem "Alterar previsão").
6. "Nova ordem avulsa": salvar vazio acusa o fornecedor; preencher fornecedor, fazenda, categoria, um item, local de
   entrega e condição com 3 parcelas → a Ordem abre com Entrega e Pagamento ("parcelas conferem com o total").
7. Na Solicitação 0012 não aparecem mais as abas Entrega, Pagamento e Notas fiscais.
8. Recarregar a página volta tudo ao estado inicial.

**Etapas e mapa de cotações (27/11)**

1. "Fluxo da ordem de compra": três cartões com caminhos diferentes (2, 4 e 5 etapas), todos terminando em "Ordem de
   compra", e o Completo com Ciência logo depois do Pedido.
2. Solicitação **0021**: a faixa do topo para em "Ciência".
3. Solicitação **0022** → aba Cotações → "Mapa de Cotações": abre o pop-up; AgroNutri vem primeiro ("Melhor total",
   R$ 85.135,50); "melhor de cada item" R$ 82.270,50 com 3 fornecedores; Campo Forte "2 de 5 itens" e Sementes Brasil
   "3 de 5 itens".

**Cores**

1. Na lista, uma ordem em "Pedido Não Aprovado" aparece com a tag laranja (não rosa), nos temas claro e escuro.
2. Uma ordem do tipo Emergencial (U) aparece com a linha em rosado pastel.

**Testes automáticos**

- `npx vitest run src/pages/Administrativo/Solicitacao src/pages/Administrativo/OrdensCompra`
  (inclui `quotationRanking.test.ts`, `OrdensCompra/purchaseOrderViews.test.ts` e os testes do protótipo em
  `Solicitacao/prototype/`: `purchaseOrderSteps`, `duplicateOrder`, `prototypeFields`, `purchaseOrderCategories`,
  `generateOrders`; e da Ordem em `OrdensCompra/prototype/`: `purchaseOrderEntity`, `standaloneOrder`).
- `npx vitest run src/config` (menu, permissões e trilha do topo).
- `npx vitest run src/components/Suprimentos/emergencyRow.test.ts src/components/Table.getRowHighlight.test.tsx`
- `npx tsc --noEmit -p .`

## A fazer

**Ordem de compra do tipo Serviço usa Tipos de serviço e Serviços (decisão de 26/11)**

- [ ] **Ajustar o cadastro de Tipo de serviço e de Serviço.** Tipo de serviço com os parâmetros (anexo "Mapa de
  impacto no backend"); Serviço só com descrição e situação (decisão de 26/11). Telas e API ainda por fazer.
- [ ] **Tipo de serviço define se gera execução.** Parâmetro Sim/Não "Gera execução", junto dos demais parâmetros do
  Tipo de serviço: com Sim, o serviço comprado por ordem desse tipo gera a execução no campo (Apontamento) ao ser
  recebido; com Não, a ordem só registra a compra e o custo.
- [ ] **Ordem do tipo Serviço escolhe Tipo de serviço · Serviço.** O item da ordem usa o campo único "Serviço" (mostra
  "Tipo de serviço · Serviço"), no lugar do produto ou da descrição livre; o resto da ordem não muda.
- [ ] **Backend:** guardar Tipo de serviço e Serviço no item da ordem de serviço e o "Gera execução" em `operations`
  (hoje a tabela dos Tipos de serviço); no recebimento, gerar a execução só quando o tipo pedir. Hoje a despesa já cria
  Apontamento ou Pastagem pelo par Tipo de serviço + Serviço (anexos "Mapa de impacto no backend" e "Cadastro novo de
  Operações"): rever junto, para não gerar em dobro.
- [ ] **Protótipo:** depois do ajuste do cadastro, mostrar na ordem 0016 (tipo Serviço) o campo "Serviço" e, na tela
  de Tipos de serviço, o "Gera execução".

**Tipos de serviço e Serviços (renomeação e parâmetros)**

- [ ] **Front, só rótulos:** "Tipos de serviço" e "Serviços" no menu, nas telas de cadastro e no Apontamento (campo
  único "Serviço"). Sem mudar API.
- [ ] **Backend:** colunas de parâmetro em `operations` (ou `operation_settings` 1:1), com o "Gera execução";
  `activities` só com descrição e situação; devolver os parâmetros na lista de opções e na sincronização do app;
  validar no `AppropriationRules` e no `AppropriationSyncHandler`.
- [ ] **Front:** cadastro de Tipos de serviço com a seção "O que o apontamento pede" e o "Gera execução"; cadastro de
  Serviços só com descrição e situação; o Apontamento lê os parâmetros do Tipo de serviço escolhido.
- [ ] **App:** baixar os parâmetros na sincronização e aplicar a mesma regra offline; campo único "Serviço" na Etapa 1
  do apontamento (FLX-064, 065 e 141).

**Operações (cadastro novo) na Ordem de compra**

- [ ] **Backend e front:** cadastro novo de Operações (`purchase_operations`, nome provisório), campo obrigatório na
  ordem e ligação com a despesa gerada e com o rateio da autorização (anexo "Cadastro novo de Operações").

**Ordem de compra única — o que depende da API** (confirmado no código do backend, develop `27fcb49cc`)

- [ ] **Todas:** `ListRequestPurchasesAction` restringe ao `user_id`; falta aceitar `scope=all`. Até lá, Todas =
  Criadas por mim.
- [ ] **Rejeitadas × Canceladas:** `listRejected` não aplica `status`; até lá, as duas mostram as situações 5 e 10.
- [ ] **Comigo:** `listMyProcesses` não chama `applyListFilters`; até lá, busca e Filtros não têm efeito.
- [ ] Contagem por visão num pedido só (hoje são 9 pedidos).
- [ ] Status múltiplo (`status[]`), `scope`, `allowed_actions` e contagem por grupo de status; depois o front passa a
  usar o endpoint único (anexo "Ordem de compra única — análise e proposta").

**Solicitação × Ordem de compra (26/11)**

- [ ] **Backend:** entidade Ordem de compra (fornecedor único; itens com `request_item_uuid`; previsão, entrega,
  pagamento, NFs e recebimento na Ordem), ordem avulsa e a rota de gerar ordens a partir da Solicitação.
- [ ] **Front oficial:** portar a lista, o detalhe, a ordem avulsa e o "Gerar ordens" quando a API existir (hoje tudo é
  protótipo).
- [ ] **Front:** a Central "Trabalho e compras" ainda tem o card "Ordem de compra" abrindo o formulário de
  Solicitação; renomear para "Solicitação de compra" ou levar à Ordem (ver doc do Apontamento).
- [ ] **Front:** editar entrega e pagamento depois de criada a Ordem (hoje só na criação da avulsa).

**App**

- [ ] Ordem de compra no app (fase 2: pedir no campo e aprovar pelo celular), já nascendo com Operação.

**Levantamento**

- [ ] Rodar `contagens-impacto.sql` para saber quantas OS existem por status, quantas atividades estão em mais de um
  tipo de serviço e o volume de ordens de compra por status.

### Pendências de decisão

- **Solicitação × Ordem (26/11):** em que etapa a Solicitação gera as ordens (depois da cotação? da aprovação?); o
  que acontece com a situação da Solicitação quando tudo está em ordem; de onde vêm entrega e pagamento da Ordem
  gerada (na demonstração, a 1ª ordem herda os da Solicitação) e se podem ser editados depois.
- **Categorias (25/11):** Manutenção dentro de Serviço — conferir com o uso real na F0.
- ~~O que a Operação da compra representa~~ — decidido: **classifica o custo**, preenchendo o rateio da autorização
  (anexo "Cadastro novo de Operações"). Falta decidir:
  - se a Operação pode ter **mais de um** par categoria/centro padrão, já com percentuais;
  - o que acontece quando a fazenda da ordem não tem o centro de custo da Operação (hoje a API recusa centro de custo
    inválido para a fazenda);
  - o campo `classification` da ordem: entender o uso atual antes de decidir se a Operação o substitui.
- Nome final para evitar o conflito "Serviços" (cadastro) × "Serviço" (tipo da ordem). Sugestão: no cadastro,
  "Serviços (da fazenda)"; na ordem, "Serviço de terceiro".
- Se Pastagem, Planejamentos, Rateios e Contas a pagar também passam a usar o campo único "Serviço".

## Registro de edições

| Data | Commit | O que mudou |
|---|---|---|
| 24/11/2026 | `ce57040` | Mapa de impacto da ordem de compra única e dos tipos de serviço (este doc) |
| 25/11/2026 | `ea4dc50` | Tela única de Ordens de compra com as listas embutidas |
| 25/11/2026 | `fb9b2f0` | Comparativo de cotações; Dados Gerais em seções |
| 25/11/2026 | `c07d122` | Itens, Anexos e Histórico em tabela; Valor (R$) e Descrição em todo item |
| 25/11/2026 | `8b172b4` | `FormContainer` sem alargar; `FileUpload compact` |
| 25/11/2026 | `0ab63c3` | Histórico em linha do tempo (`EventTimeline`) |
| 25/11/2026 | `efa2b97` | Dados Gerais fixos acima das abas; ações no rodapé |
| 25/11/2026 | `0b54da2` | Ícone de colunas global |
| 25/11/2026 | `6de6146` | Visualização compacta; seções extras viram abas |
| 25/11/2026 | `8e0985a` | Seletor de visão, Todas, Rejeitadas × Canceladas, Novo fixo, busca em Comigo |
| 25/11/2026 | `fee7831` | Clique na linha abre a visualização |
| 25/11/2026 | `f284445` | Documentação desta funcionalidade e mapa de mudanças atualizados |
| 25/11/2026 | `304a251` | Hash dos commits no histórico da ordem de compra |
| 25/11/2026 | `03a6adf` | `StepTrack` no kit para etapas de um processo |
| 25/11/2026 | `0128201` | Dados de demonstração da ordem de compra para o protótipo |
| 25/11/2026 | `e7448fe` | Protótipo visual da ordem de compra para apresentação |
| 25/11/2026 | `160069c` | Protótipo da ordem de compra documentado e mapa regenerado |
| 25/11/2026 | `a3905cc` | Etapas que o perfil do fluxo não tem ficam ocultas |
| 26/11/2026 | `52c98da` | Linha Emergencial de Suprimentos em tom pastel |
| 26/11/2026 | `9b70d01` | Aprovação automática com limite diário e transações por dia (substituído no mesmo dia) |
| 26/11/2026 | — (outra sessão, código ainda sem commit) | Decisão: parâmetros e "Gera execução" no Tipo de serviço, Serviço só descrição e situação; "A fazer" da ordem do tipo Serviço; aprovação automática com interruptor "Limite diário" e valor na mesma linha; "Pedido Não Aprovado" em laranja; doc reestruturado pela lei 6 |
| 26/11/2026 | `9df55f8` | 4 categorias + 2 marcações no lugar dos 11 tipos |
| 26/11/2026 | `2920f89` | Solicitação de compra volta a se chamar Solicitação (desfaz os textos de `521ead7`) |
| 26/11/2026 | `d62b262`, `9c216de` | Solicitação gera N Ordens por fornecedor (regra, diálogo e aba Vínculos) |
| 26/11/2026 | `4aabe89`, `618ec24` | Previsão por ordem, quantidade inteira, "Total da solicitação" |
| 26/11/2026 | `c77ee03`, `5ead0e6` | Tela própria da Ordem de compra (lista e detalhe) |
| 26/11/2026 | `1ed4512` | Entrega, pagamento, notas e recebimento vão para a Ordem |
| 26/11/2026 | `e3aa804`, `446d425` | Ordem avulsa pela tela, com entrega e pagamento; trilha do topo pelo caminho mais específico (PR #2, integrado na `main` em `d6d4285`) |
| 26/11/2026 | `91bd88c` | Doc consolidado: conceito Solicitação × Ordem nas regras vigentes, seções novas, validação, "A fazer" e pendências |
| 26/11/2026 | `38f101a` | Aprovação automática por Valor, Prazo e Contagem (no lugar de valor por ordem, limite diário e transações); Operação é da Ordem de compra |
| 27/11/2026 | (este commit) | Etapas da Solicitação por perfil terminando na Ordem de compra, com Ciência no Completo; previsão da Ordem só leitura; mapa de cotações em pop-up; 0022 com 5 itens e 4 cotações |

## Anexo: Mapa de impacto no backend (Tipos de serviço e Serviços)

- **Data:** 24/11/2026 (parâmetros revistos em 26/11).
- **Fontes:** backend `GB.Cerne.Api` (cópia do branch develop, commit `27fcb49cc`: modelos, migrações, rotas,
  repositórios e requests) e este front. O dump do banco **não foi lido**, por regra do projeto; as contagens de uso
  estão em `CORE_WORKSPACE/07-Extracoes_Produto/contagens-impacto.sql`, para quem tem acesso ao banco rodar.

### Como é no backend

| Item | Hoje |
|------|------|
| Tabelas | `operations` (nome, descrição, agrupador, uso, ordem, ativo) e `activities` (nome, descrição, tipo custeio/investimento/indefinido, uso, valor por hectare, ativo) |
| Ligação | Muitos-para-muitos pela tabela `operation_activities`: uma atividade pode estar em várias operações |
| Uso | `OperationUse` e `ActivityUse`: Ambos, Agricultura, Pecuária |
| Permissões | `operations_*` (view, create, edit, delete, count, planned) e `activities_*` |

### Onde operação e atividade são usadas (backend)

| Área | Tabelas | Tela no front |
|------|---------|---------------|
| Apontamento | `appropriations`, `appropriation_production` | Operacional › Apontamentos |
| Pastagem | `pastures`, `pasture_services`, `pasture_equipments`, `pasture_inputs`, `pasture_productions` | Operacional › Pastagem |
| Planejamento agrícola | `planning_operations`, `planning_activities`, `planning_other_activities` | Operacional › Planejamentos |
| Planejamento pecuário | `planning_livestock_operations`, `planning_livestock_activities`, `planning_livestock_other_activities` | (pecuária) |
| Rateios | `apportionment_items` (atividade) | Cadastros › Rateios |
| Ordem de Serviço | `service_orders` | Desligada no web; ativa no app |
| Despesa (Contas a pagar) | Não guarda: `aprop_agri_operation_uuid` cria um **Apontamento** e `aprop_pec_operation_uuid` cria uma **Pastagem** | Financeiro › Contas a pagar |
| NF de entrada | Não guarda: `items.*.aprop_operation_uuid` cria um **Apontamento** | NF de entrada |
| App (sincronização) | `AppropriationsPullResource`, `AppropriationSyncHandler`, `MyServiceOrdersPullResource` | App Operação |

Fora do escopo: `activity_cost_centers`, apesar do nome, liga centro de custo a talhão (`Marker`), não ao cadastro de
Atividades. `NatureOperation` (natureza da operação fiscal em NF-e/CT-e) é outro cadastro e **não muda**.

### Recomendação: renomear só o que a pessoa vê

| Camada | Muda? | Por quê |
|--------|-------|---------|
| Rótulos, menu, títulos, mensagens (web e app) | **Sim** | "Operações" → "Tipos de serviço"; "Atividades" → "Serviços" |
| Tabelas, colunas e rotas da API (`operations`, `activities`, `operation_id`) | **Não** | São usadas em 20+ tabelas, no app, na sincronização, nos relatórios e na auditoria. Renomear no banco tem alto risco e nenhum ganho para o usuário |
| Permissões (`operations_*`, `activities_*`) | **Não** (só o rótulo na tela de perfis) | Trocar a chave quebra perfis já configurados |
| Relatórios | **Não** (regra do repo) | Relatórios e Dashboards não são tocados; registrar a divergência de nome |

**Apontamento:** um campo só, **"Serviço"**, mostrando "Tipo de serviço · Serviço" (ex.: "Pulverização · Aplicação de
herbicida"), que continua enviando `operation_uuid` e `activity_uuid`. Isso resolve o caso de um serviço que está em
mais de um tipo de serviço (a ligação é muitos-para-muitos).

### Referência do ERP: o que o formulário pede

O ERP de revendas (tela "Tipos de Serviços da Agenda") organiza assim:
- **Pai:** subtipos de serviço, com uma característica (Evento, Agenda, Tarefa). Exemplos: Participação em eventos,
  Visita técnica, Visita comercial, Tarefas.
- **Filhos:** os tipos de serviço do pai. Exemplos de "Participação em eventos": Feiras, Reunião na empresa, Workshop,
  Palestra técnica, Dia de campo.
- **Parâmetros de cada filho:** decidem que entradas extras o registro exige. São perguntas Sim/Não (requer safra,
  requer cultura, ação corretiva, justificativa, requer assinatura, vários clientes, digita cliente, enviar e-mail,
  exibe no relatório, atividade gerencial) e limites (mínimo de imagens, mínimo e máximo de caracteres do texto e da
  legenda da imagem).

**Decidido (26/11, substitui a decisão de 24/11):** "Tipo de serviço" (ex-Operação) é o pai e **guarda todos os
parâmetros**, inclusive se gera ou não execução. "Serviço" (ex-Atividade) é o filho e é **só uma descrição simples
com situação** (ativo ou inativo), sem parâmetros. Os parâmetros do Tipo de serviço montam o Apontamento, no web e no
app:

| Parâmetro do Tipo de serviço | Efeito no Apontamento | Equivalente no ERP |
|----------------------|-----------------------|--------------------|
| Uso (Agricultura, Pecuária, Ambos) | Mostra talhão, cultura e safra ou lote e categoria | Característica |
| Exige safra | Safra obrigatória | Requer safra |
| Exige cultura | Cultura obrigatória | Requer cultura |
| Exige lote | Lote obrigatório (pecuária) | — |
| Exige área utilizada | Área utilizada obrigatória; senão o campo some | — |
| Lançamentos obrigatórios | Quais grupos precisam de ao menos um item: mão de obra, máquinas, insumos | — |
| Gera produção | Mostra o grupo Produção | — |
| Exige ocorrência ou ação corretiva | Ocorrência com diagnóstico obrigatória | Ação corretiva, Justifica |
| Mínimo de fotos | Quantas fotos no mínimo | Qtde mín. img |
| Texto mínimo e máximo | Tamanho da descrição | Qtde mín./máx. caracter |
| Exige assinatura | Assinatura do responsável no app | Requer assinatura |
| Avisar ao concluir | E-mail ou notificação para alguém | Enviar e-mail |
| **Gera execução** | Sim: o serviço comprado por ordem do tipo Serviço gera a execução (Apontamento) ao ser recebido. Não: a ordem só registra compra e custo | — |

**Serviço (filho):** só **descrição** e **situação** (ativo ou inativo). Nenhum parâmetro.

**Por que isso importa:** hoje as regras do formulário estão fixas no código (ex.: área utilizada obrigatória; no app,
armazém de produção obrigatório). Com os parâmetros no Tipo de serviço, a fazenda configura e o Apontamento se ajusta.
Isso também resolve o Apontamento pecuário sem um formulário separado.

**O que precisa:**
- **Backend:** colunas de parâmetro em `operations` (a tabela dos Tipos de serviço) ou tabela `operation_settings`
  1:1, com o "Gera execução"; `activities` fica só com descrição e situação; devolver os parâmetros na lista de opções
  e na sincronização do app (`AppropriationsPullResource` e recursos de cadastro); validar no `AppropriationRules` e
  no `AppropriationSyncHandler`, para o app offline não gravar o que a API vai recusar.
- **Front:** tela de cadastro de Tipos de serviço com a seção "O que o apontamento pede" e o "Gera execução"; cadastro
  de Serviços com só descrição e situação; o formulário do Apontamento lê os parâmetros do Tipo de serviço escolhido.
- **App:** baixar os parâmetros na sincronização e aplicar a mesma regra offline.
- ~~**Decidido (24/11): os parâmetros ficam no Serviço.**~~ **Substituído em 26/11:** os parâmetros ficam no **Tipo de
  serviço**. Como um Serviço pode estar em vários Tipos de serviço (muitos-para-muitos em `operation_activities`), a
  regra que vale é a do Tipo de serviço escolhido no par "Tipo de serviço · Serviço".

### Conflitos de nome a resolver

- **"Serviço" já é um tipo de Ordem de compra** (P Produto, S Serviço, A Adiantamento). "Serviços" no cadastro e
  "Ordem de compra do tipo Serviço" vão conviver. Sugestão: no cadastro, "Serviços (da fazenda)"; na ordem, "Serviço de
  terceiro".
- **"Operações" muda de significado.** O nome passa a ser do cadastro novo da compra. Durante a transição, telas,
  relatórios e o app antigo ainda dizem "Operação" querendo dizer "Tipo de serviço". Os relatórios não mudam (regra do
  repo), então a divergência fica registrada.
- **Tabela `operations` x cadastro "Operações" novo:** a tabela antiga guarda os Tipos de serviço. O cadastro novo
  precisa de **outra tabela** (sugestão: `purchase_operations`) para não colidir.

## Anexo: Cadastro novo de Operações (proposta para a Ordem de compra)

| Item | Proposta |
|------|----------|
| Tabela | `purchase_operations` (nome provisório): nome, descrição, uso (Ambos, Agricultura, Pecuária), **categoria financeira e centro de custo padrão**, ativo, tenant, uuid; exclusão lógica e auditoria como os demais cadastros |
| Ordem de compra | `request_purchases.purchase_operation_id` **obrigatório** em ordens novas; validado na API (`RequestPurchaseRequest`). Ordens antigas ficam sem e só exigem ao editar |
| Despesa gerada | A operação da ordem vai para a despesa no `GenerateRequestReceiptFinancialAction`, junto com o rateio. É uma classificação de **custo** (financeiro), separada da apropriação agronômica que a despesa já faz por Tipo de serviço + Serviço (cria Apontamento ou Pastagem) |
| Permissões | Novas: `purchase-operations_view`, `_create`, `_edit`, `_delete` |
| Menu | Administrativo › Suprimentos › **Operações** (ou Cadastros › Suprimentos) |
| Front | Cadastro novo (lista + formulário, como o de Tipos de serviço); campo no formulário da ordem; coluna e filtro na lista; exibição no detalhe |

### Decisão: a Operação classifica o custo (24/11)

**Como a ordem classifica o custo hoje:** na autorização, quem organiza a despesa (`expense_organizer`) define o
**rateio** da ordem: categoria financeira × centro de custo × percentual (`RecategorizeRequestPurchaseRatioAction`,
tabela pivô `categories` com `center_id` e `percent`), além de `classification` e safra. A despesa gerada no
recebimento segue esse rateio.

**Recomendação: a Operação alimenta o rateio, não o substitui.**

| Item | Proposta |
|------|----------|
| Cadastro de Operações | Cada operação tem **categoria financeira** e **centro de custo** padrão |
| Ao criar a ordem | Quem pede escolhe a Operação (obrigatória); não precisa saber de plano de contas |
| Na autorização | O rateio vem **preenchido** com a categoria e o centro da Operação, 100%. O organizador da despesa pode ajustar ou dividir, como hoje |
| Despesa gerada | Leva a Operação e o rateio final |
| Relatórios | Custo por Operação passa a existir; os relatórios atuais não mudam (regra do repo) e um relatório novo fica para depois |

**Por que assim:** quem pede a compra (campo, fazenda) entende "Manutenção de máquinas", não "categoria 3.1.02 × centro
Oficina". O financeiro continua dono do rateio. E nada do que já funciona na autorização e no financeiro precisa mudar.

As pendências desta decisão estão em "Pendências de decisão".

## Anexo: Ordem de compra única — análise e proposta

> Escrito em 24/11, quando a tela única se chamava "Ordens de compra". Desde 26/11 ela é a lista de **Solicitações**;
> a análise das listas e do backend continua valendo para ela.

### Antes: 7 telas, 7 listas, escopos diferentes

| Tela (menu) | Rota no front | Endpoint | Quem vê | Status |
|-------------|---------------|----------|---------|--------|
| Ordens de compra | `/administrativo/solicitacao` | `GET /request-purchases` | **Só as que eu criei** | Filtro de 1 status |
| Meus Processos | `/administrativo/meus-processos` | `GET /request-purchases/my-processes` | **Sob minha responsabilidade** | Todos menos finalizado e cancelado |
| Rejeitados / Cancelados | `/administrativo/rejeitados` | `GET /request-purchases/rejected` | Das fazendas a que estou vinculado | 5 e 10 |
| Cotações | `/administrativo/cotacoes` | `GET /request-purchases/in-quotation` | Toda a empresa | 1 e 2 |
| Autorização | `/administrativo/autorizacao` | `GET /request-authorizations` | **Para eu aprovar** | 3, 4 e 11 |
| Compras | `/administrativo/compras` | `GET /request-purchases/in-purchase` | Toda a empresa | **Todos**, com filtro de 1 status |
| Recebimentos | `/administrativo/recebimentos` | `GET /request-receipts` | Toda a empresa | Fila de recebimento |

As telas não diferem só pelo status: diferem pelo **escopo** (minhas, sob minha responsabilidade, para eu aprovar,
toda a empresa) e pela **permissão** (`request-purchases_*`, `request-quotation_*`, `request-authorization_*`,
`request-buy_*`, `request-receipts_*`).

### Proposta: uma lista, dois filtros e ações por linha

- **Filtro "Visão" (escopo):** Criadas por mim · Sob minha responsabilidade · Para eu aprovar · Das minhas fazendas ·
  Todas. Cada visão só aparece para quem tem a permissão correspondente ("Todas" exige `request-buy_view` ou
  `request-quotation_view`).
- **Filtro "Status" (vários ao mesmo tempo), em grupos:**

  | Grupo na tela | Status do sistema |
  |---------------|-------------------|
  | Solicitação | 1 Solicitação |
  | Em cotação | 2 Cotação em andamento |
  | Em aprovação | 3 Aguardando aprovação · 4 Aguardando ciência · 11 Analisar processo |
  | Em compra | 6 Aguardando compra · 7 Compra efetuada |
  | Recebida | 8 Compra recebida |
  | Encerradas | 9 Finalizado · 5 Não aprovado · 10 Cancelado |

- **Ações por linha, conforme status e permissão:** Cotar (`request-quotation_edit`), Enviar para aprovação, Aprovar
  ou recusar (`request-authorization_edit`), Comprar (`request-buy_edit`), Receber ou confirmar serviço
  (`request-receipts_edit`), Financeiro (`request-purchases_financial`), Transferir, Reabrir e Cancelar. As telas de
  trabalho de cada etapa continuam existindo, abertas a partir da linha.
- **Menu de Suprimentos depois:** Ordens de compra · Operações (novo) · Parâmetros SLA (Autorizadores continua em
  Cadastros base). Meus processos, Rejeitados, Cotações, Autorização, Compras e Recebimentos viram visões ou filtros
  salvos da lista.

### O que o backend precisa

| Mudança | Onde | Observação |
|---------|------|------------|
| Status múltiplo (`status[]`) | `RequestPurchaseFilterData`, `listWithFilters` | Hoje todos os endpoints aceitam só 1 status |
| Parâmetro de escopo (`scope=mine,responsible,to_approve,farms,all`) no `GET /request-purchases` | `RequestPurchaseController@index`, repositório | Hoje o `index` é **só do criador** (`user_id`). As regras de escopo já existem em `listMyProcesses`, `listPendingAuthorizations` e `listInPurchaseQueue`; é reaproveitar |
| Ações permitidas por linha (`allowed_actions`) | `RequestPurchaseResource` | Evita o front recalcular regra de status × permissão |
| Contagem por grupo de status | Novo endpoint ou `meta` do `index` | Para os números nas abas ou chips |
| Manter os endpoints antigos | Rotas atuais | O app e os relatórios continuam funcionando durante a transição |

**Dá para começar só no front?** Sim, em parte. A visão "Todas" com filtro de status já existe
(`/request-purchases/in-purchase` traz todos os status da empresa). As outras visões chamam os endpoints atuais
(`index`, `my-processes`, `request-authorizations`). Fica faltando o filtro de **vários status** de uma vez e as
contagens, que dependem do backend.

## Anexo: App (GB CERNE APP)

- **Tipos de serviço e Serviços:** a Etapa 1 do apontamento no app Operação (FLX-064, 065 e 141) troca os seletores
  "Operação" e "Atividade" pelo campo único "Serviço". Os dados sincronizados continuam os mesmos (`operation_id`,
  `activity_id`).
- **Ordem de compra:** o app não tem ordem de compra hoje. Na fase 2 (pedir no campo e aprovar pelo celular), a ordem
  já nasce com Operação.
- **OS:** segue o plano de [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md).

## Anexo: Ordem sugerida de entrega

1. **Front, só rótulos:** "Tipos de serviço" e "Serviços" no menu, nas telas de cadastro e no Apontamento (campo
   único). Sem mudar API.
2. **Front:** lista única de Ordens de compra com as visões sobre os endpoints atuais e filtro de 1 status. **Feito em
   25/11** (ver "O que mudou").
3. **Backend:** `status[]`, `scope`, `allowed_actions` e contagens; o front passa a usar o endpoint único.
4. **Backend e front:** cadastro novo de Operações e campo obrigatório na ordem; ligação com a despesa.
5. **App:** rótulos e campo único no apontamento; depois a ordem de compra.
