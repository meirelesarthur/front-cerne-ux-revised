# Ordem de compra única, Tipos de serviço e Operações — mapa de impacto

- **Data:** 24/11/2026
- **Fontes:** backend `GB.Cerne.Api` (cópia do branch develop, commit `27fcb49cc`: modelos, migrações, rotas, repositórios e requests) e este front. O dump do banco **não foi lido**, por regra do projeto; as contagens de uso estão em `CORE_WORKSPACE/07-Extracoes_Produto/contagens-impacto.sql`, para quem tem acesso ao banco rodar.
- **Relacionado:** [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md) (fim da OS).

## Decisões do dono (24/11)

1. **Operações → "Tipos de serviço"** e **Atividades → "Serviços"** (renomeação do cadastro atual).
2. **Nasce um cadastro novo, "Operações"**, usado na **Ordem de compra** (campo obrigatório no cabeçalho, sem Atividade, levado à despesa gerada).
3. ~~**Todas as telas de solicitação convergem numa única "Ordens de compra"**~~ — substituída em 26/11 (item 4): as telas convergem numa única **"Solicitações de compra"**, filtrável por status (solicitação, cotação, aprovação, compra, recebimento, encerradas).
4. **Solicitação × Ordem de compra (26/11, depois da conversa com o CEO):** a **Solicitação de compra** continua como era (com os ajustes visuais e a tela única com o combo de status); o nome "Ordem de compra" dado a ela em `521ead7` foi desfeito. A **Ordem de compra** é nova: começa sozinha ou nasce de uma Solicitação. **Uma Solicitação gera N Ordens**, porque cada Ordem é de **um único fornecedor**; a Solicitação continua viva e ligada às suas Ordens. Categoria e marcação aparecem nas duas.

## 1. Tipos de serviço e Serviços (o cadastro atual)

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

Fora do escopo: `activity_cost_centers`, apesar do nome, liga centro de custo a talhão (`Marker`), não ao cadastro de Atividades. `NatureOperation` (natureza da operação fiscal em NF-e/CT-e) é outro cadastro e **não muda**.

### Recomendação: renomear só o que a pessoa vê

| Camada | Muda? | Por quê |
|--------|-------|---------|
| Rótulos, menu, títulos, mensagens (web e app) | **Sim** | "Operações" → "Tipos de serviço"; "Atividades" → "Serviços" |
| Tabelas, colunas e rotas da API (`operations`, `activities`, `operation_id`) | **Não** | São usadas em 20+ tabelas, no app, na sincronização, nos relatórios e na auditoria. Renomear no banco tem alto risco e nenhum ganho para o usuário |
| Permissões (`operations_*`, `activities_*`) | **Não** (só o rótulo na tela de perfis) | Trocar a chave quebra perfis já configurados |
| Relatórios | **Não** (regra do repo) | Relatórios e Dashboards não são tocados; registrar a divergência de nome |

**Apontamento:** um campo só, **"Serviço"**, mostrando "Tipo de serviço · Serviço" (ex.: "Pulverização · Aplicação de herbicida"), que continua enviando `operation_uuid` e `activity_uuid`. Isso resolve o caso de um serviço que está em mais de um tipo de serviço (a ligação é muitos-para-muitos).

### Referência do ERP: o Serviço decide o que o formulário pede

O ERP de revendas (tela "Tipos de Serviços da Agenda") organiza assim:
- **Pai:** subtipos de serviço, com uma característica (Evento, Agenda, Tarefa). Exemplos: Participação em eventos, Visita técnica, Visita comercial, Tarefas.
- **Filhos:** os tipos de serviço do pai. Exemplos de "Participação em eventos": Feiras, Reunião na empresa, Workshop, Palestra técnica, Dia de campo.
- **Parâmetros de cada filho:** decidem que entradas extras o registro exige. São perguntas Sim/Não (requer safra, requer cultura, ação corretiva, justificativa, requer assinatura, vários clientes, digita cliente, enviar e-mail, exibe no relatório, atividade gerencial) e limites (mínimo de imagens, mínimo e máximo de caracteres do texto e da legenda da imagem).

**Proposta para o Cerne:** "Tipo de serviço" (ex-Operação) é o pai; "Serviço" (ex-Atividade) é o filho e ganha **parâmetros** que montam o Apontamento, no web e no app:

| Parâmetro do Serviço | Efeito no Apontamento | Equivalente no ERP |
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

**Por que isso importa:** hoje as regras do formulário estão fixas no código (ex.: área utilizada obrigatória; no app, armazém de produção obrigatório). Com os parâmetros no Serviço, a fazenda configura e o Apontamento se ajusta. Isso também resolve o Apontamento pecuário sem um formulário separado.

**O que precisa:**
- **Backend:** colunas de parâmetro em `activities` (ou tabela `activity_settings`); devolver na lista de opções e na sincronização do app (`AppropriationsPullResource` e recursos de cadastro); validar no `AppropriationRules` e no `AppropriationSyncHandler`, para o app offline não gravar o que a API vai recusar.
- **Front:** tela de cadastro de Serviços com a seção "O que o apontamento pede"; formulário do Apontamento lê os parâmetros do Serviço escolhido.
- **App:** baixar os parâmetros na sincronização e aplicar a mesma regra offline.
- **Decidido (24/11): os parâmetros ficam no Serviço.** Hoje um Serviço pode estar em vários Tipos de serviço (muitos-para-muitos); os parâmetros valem igual em qualquer tipo. Se um caso pedir regra diferente, cria-se outro Serviço. Backend: colunas em `activities` (ou `activity_settings` 1:1), sem mexer em `operation_activities`.

### Conflitos de nome a resolver

- **"Serviço" já é um tipo de Ordem de compra** (P Produto, S Serviço, A Adiantamento). "Serviços" no cadastro e "Ordem de compra do tipo Serviço" vão conviver. Sugestão: no cadastro, "Serviços (da fazenda)"; na ordem, "Serviço de terceiro".
- **"Operações" muda de significado.** O nome passa a ser do cadastro novo da compra. Durante a transição, telas, relatórios e o app antigo ainda dizem "Operação" querendo dizer "Tipo de serviço". Os relatórios não mudam (regra do repo), então a divergência fica registrada.
- **Tabela `operations` x cadastro "Operações" novo:** a tabela antiga guarda os Tipos de serviço. O cadastro novo precisa de **outra tabela** (sugestão: `purchase_operations`) para não colidir.

## 2. Operações (cadastro novo, para a Ordem de compra)

| Item | Proposta |
|------|----------|
| Tabela | `purchase_operations` (nome provisório): nome, descrição, uso (Ambos, Agricultura, Pecuária), **categoria financeira e centro de custo padrão**, ativo, tenant, uuid; exclusão lógica e auditoria como os demais cadastros |
| Ordem de compra | `request_purchases.purchase_operation_id` **obrigatório** em ordens novas; validado na API (`RequestPurchaseRequest`). Ordens antigas ficam sem e só exigem ao editar |
| Despesa gerada | A operação da ordem vai para a despesa no `GenerateRequestReceiptFinancialAction`, junto com o rateio. É uma classificação de **custo** (financeiro), separada da apropriação agronômica que a despesa já faz por Tipo de serviço + Serviço (cria Apontamento ou Pastagem) |
| Permissões | Novas: `purchase-operations_view`, `_create`, `_edit`, `_delete` |
| Menu | Administrativo › Suprimentos › **Operações** (ou Cadastros › Suprimentos) |
| Front | Cadastro novo (lista + formulário, como o de Tipos de serviço); campo no formulário da ordem; coluna e filtro na lista; exibição no detalhe |

### Decisão: a Operação classifica o custo (24/11)

**Como a ordem classifica o custo hoje:** na autorização, quem organiza a despesa (`expense_organizer`) define o **rateio** da ordem: categoria financeira × centro de custo × percentual (`RecategorizeRequestPurchaseRatioAction`, tabela pivô `categories` com `center_id` e `percent`), além de `classification` e safra. A despesa gerada no recebimento segue esse rateio.

**Recomendação: a Operação alimenta o rateio, não o substitui.**

| Item | Proposta |
|------|----------|
| Cadastro de Operações | Cada operação tem **categoria financeira** e **centro de custo** padrão |
| Ao criar a ordem | Quem pede escolhe a Operação (obrigatória); não precisa saber de plano de contas |
| Na autorização | O rateio vem **preenchido** com a categoria e o centro da Operação, 100%. O organizador da despesa pode ajustar ou dividir, como hoje |
| Despesa gerada | Leva a Operação e o rateio final |
| Relatórios | Custo por Operação passa a existir; os relatórios atuais não mudam (regra do repo) e um relatório novo fica para depois |

**Por que assim:** quem pede a compra (campo, fazenda) entende "Manutenção de máquinas", não "categoria 3.1.02 × centro Oficina". O financeiro continua dono do rateio. E nada do que já funciona na autorização e no financeiro precisa mudar.

**Pendências:**
- Confirmar se a Operação pode ter **mais de um** par categoria/centro padrão, já com percentuais.
- Definir o que acontece quando a fazenda da ordem não tem o centro de custo da Operação (hoje a API recusa centro de custo inválido para a fazenda).
- O campo `classification` da ordem: entender o uso atual antes de decidir se a Operação o substitui.

## 3. Ordem de compra única, filtrável por status

### Hoje: 7 telas, 7 listas, escopos diferentes

| Tela (menu) | Rota no front | Endpoint | Quem vê | Status |
|-------------|---------------|----------|---------|--------|
| Ordens de compra | `/administrativo/solicitacao` | `GET /request-purchases` | **Só as que eu criei** | Filtro de 1 status |
| Meus Processos | `/administrativo/meus-processos` | `GET /request-purchases/my-processes` | **Sob minha responsabilidade** | Todos menos finalizado e cancelado |
| Rejeitados / Cancelados | `/administrativo/rejeitados` | `GET /request-purchases/rejected` | Das fazendas a que estou vinculado | 5 e 10 |
| Cotações | `/administrativo/cotacoes` | `GET /request-purchases/in-quotation` | Toda a empresa | 1 e 2 |
| Autorização | `/administrativo/autorizacao` | `GET /request-authorizations` | **Para eu aprovar** | 3, 4 e 11 |
| Compras | `/administrativo/compras` | `GET /request-purchases/in-purchase` | Toda a empresa | **Todos**, com filtro de 1 status |
| Recebimentos | `/administrativo/recebimentos` | `GET /request-receipts` | Toda a empresa | Fila de recebimento |

As telas não diferem só pelo status: diferem pelo **escopo** (minhas, sob minha responsabilidade, para eu aprovar, toda a empresa) e pela **permissão** (`request-purchases_*`, `request-quotation_*`, `request-authorization_*`, `request-buy_*`, `request-receipts_*`).

### Proposta: uma lista, dois filtros e ações por linha

- **Filtro "Visão" (escopo):** Criadas por mim · Sob minha responsabilidade · Para eu aprovar · Das minhas fazendas · Todas. Cada visão só aparece para quem tem a permissão correspondente ("Todas" exige `request-buy_view` ou `request-quotation_view`).
- **Filtro "Status" (vários ao mesmo tempo), em grupos:**

  | Grupo na tela | Status do sistema |
  |---------------|-------------------|
  | Solicitação | 1 Solicitação |
  | Em cotação | 2 Cotação em andamento |
  | Em aprovação | 3 Aguardando aprovação · 4 Aguardando ciência · 11 Analisar processo |
  | Em compra | 6 Aguardando compra · 7 Compra efetuada |
  | Recebida | 8 Compra recebida |
  | Encerradas | 9 Finalizado · 5 Não aprovado · 10 Cancelado |

- **Ações por linha, conforme status e permissão:** Cotar (`request-quotation_edit`), Enviar para aprovação, Aprovar ou recusar (`request-authorization_edit`), Comprar (`request-buy_edit`), Receber ou confirmar serviço (`request-receipts_edit`), Financeiro (`request-purchases_financial`), Transferir, Reabrir e Cancelar. As telas de trabalho de cada etapa continuam existindo, abertas a partir da linha.
- **Menu de Suprimentos depois:** Ordens de compra · Operações (novo) · Parâmetros SLA (Autorizadores continua em Cadastros base). Meus processos, Rejeitados, Cotações, Autorização, Compras e Recebimentos viram visões ou filtros salvos da lista.

### O que o backend precisa

| Mudança | Onde | Observação |
|---------|------|------------|
| Status múltiplo (`status[]`) | `RequestPurchaseFilterData`, `listWithFilters` | Hoje todos os endpoints aceitam só 1 status |
| Parâmetro de escopo (`scope=mine,responsible,to_approve,farms,all`) no `GET /request-purchases` | `RequestPurchaseController@index`, repositório | Hoje o `index` é **só do criador** (`user_id`). As regras de escopo já existem em `listMyProcesses`, `listPendingAuthorizations` e `listInPurchaseQueue`; é reaproveitar |
| Ações permitidas por linha (`allowed_actions`) | `RequestPurchaseResource` | Evita o front recalcular regra de status × permissão |
| Contagem por grupo de status | Novo endpoint ou `meta` do `index` | Para os números nas abas ou chips |
| Manter os endpoints antigos | Rotas atuais | O app e os relatórios continuam funcionando durante a transição |

**Dá para começar só no front?** Sim, em parte. A visão "Todas" com filtro de status já existe (`/request-purchases/in-purchase` traz todos os status da empresa). As outras visões chamam os endpoints atuais (`index`, `my-processes`, `request-authorizations`). Fica faltando o filtro de **vários status** de uma vez e as contagens, que dependem do backend.

## 4. App (GB CERNE APP)

- **Tipos de serviço e Serviços:** a Etapa 1 do apontamento no app Operação (FLX-064, 065 e 141) troca os seletores "Operação" e "Atividade" pelo campo único "Serviço". Os dados sincronizados continuam os mesmos (`operation_id`, `activity_id`).
- **Ordem de compra:** o app não tem ordem de compra hoje. Na fase 2 (pedir no campo e aprovar pelo celular), a ordem já nasce com Operação.
- **OS:** segue o plano de [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md).

## 5. Ordem sugerida

1. **Front, só rótulos:** "Tipos de serviço" e "Serviços" no menu, nas telas de cadastro e no Apontamento (campo único). Sem mudar API.
2. **Front:** lista única de Ordens de compra com as visões sobre os endpoints atuais e filtro de 1 status. **Feito em 25/11** (ver abaixo).
3. **Backend:** `status[]`, `scope`, `allowed_actions` e contagens; o front passa a usar o endpoint único.
4. **Backend e front:** cadastro novo de Operações e campo obrigatório na ordem; ligação com a despesa.
5. **App:** rótulos e campo único no apontamento; depois a ordem de compra.

## Feito no front: tela única de Ordens de compra (estado em 25/11)

- **Rota:** `/administrativo/ordens-de-compra?visao=<visão>`; abre com qualquer uma das 6 permissões de leitura das listas. Sem `?visao`, abre em **Todas**.
- **Visões**, num **seletor único** (`components/ui/ViewSelect.tsx`: ícone + nome + contador; menu com todas e check na atual): Todas (`/request-purchases?scope=all`), Criadas por mim (`/request-purchases`), Comigo (`my-processes`), Para eu aprovar (`/request-authorizations`), Em cotação (`in-quotation`), Em compra (`in-purchase`), Recebimento (`/request-receipts`), Rejeitadas (`rejected?status=5`) e Canceladas (`rejected?status=10`). Cada visão só aparece para quem tem a permissão da lista de origem; `?visao=encerradas` (link antigo) abre Rejeitadas.
- **Linha única de controles:** busca e, à direita dela, o seletor; no outro extremo, configurar colunas, Filtros e **Novo** (fixo em toda visão, para quem pode criar). Toda visão tem busca e Filtros ("Comigo" ganhou os dois).
- **Contador** de cada visão: o `pagination.total` da própria lista, pedido com 1 item (`OrdensCompra/usePurchaseOrderViewCounts.ts`); atualiza junto com a lista.
- **Clique na linha** abre a ordem: em "Para eu aprovar", a tela de autorização; nas demais, a **visualização**. Na rota antiga de "Criadas por mim" o clique também passou a abrir a visualização (antes abria a edição).
- **Aviso de ordens negadas** (`DeniedRequestsModal`) não abre na tela única; continua nas rotas antigas.
- **Como:** cada visão é a lista atual embutida (`components/EmbeddedList.tsx`), com mesmas colunas, filtros, ações por linha e diálogos. O contexto agora leva: `toolbarStart`/`toolbarEnd` (seletor e Novo na linha da busca), `fixedFilter` (situação ou escopo imposto pela visão), `onRowOpen` (clique na linha) e o ponto `actionsTarget`, para onde o `HeaderGrid` manda os botões da lista. Leem o contexto: `ContainerGrid`, `PageHeader`, `HeaderGrid`, `ListToolbar`, `Table` e `DeniedRequestsModal`; fora da tela única nada muda.
- **Menu:** Suprimentos mostra só "Ordens de compra" e "Parâmetros SLA". Chave `UNIFIED_PURCHASE_ORDERS_ENABLED` (`config/v2/purchaseOrdersFeature.ts`); com `false` volta o menu antigo. As rotas antigas seguem vivas (sino, favoritos, links).
- **Depende da API** (confirmado no código do backend, develop 27fcb49cc):
  - **Todas:** `ListRequestPurchasesAction` restringe ao `user_id`; falta aceitar `scope=all`. Até lá, Todas = Criadas por mim.
  - **Rejeitadas × Canceladas:** `listRejected` não aplica `status`; até lá, as duas mostram as situações 5 e 10.
  - **Comigo:** `listMyProcesses` não chama `applyListFilters`; até lá, busca e Filtros não têm efeito.
  - Contagem por visão num pedido só (hoje são 9 pedidos).

## Visual da Ordem de compra (estado em 25/11)

Pedido do dono: a ordem de compra é complexa e a aba de cotações estava ruim; visual minimalista e funcional, no padrão do sistema.

- **Topo:** situação (tag com a cor da lista), código e responsável atual na linha do título, sem faixa própria.
- **Ações de trâmite** (Receber, Transferir, Voltar etapa, Justificativa da cotação, Finalizar) no **rodapé**, à direita, antes de Salvar; só aparecem para quem pode executá-las.
- **Dados Gerais fixos acima das abas**, sem títulos de seção: Código, Tipo, Prioridade, Data do pedido, Solicitante, Encarregado (e NF-e na visualização), depois Descrição/Chamado, Justificativa e Observação. Edição em 3 colunas e áreas de texto com 3 linhas; visualização em 4 colunas e 2 linhas, para as abas aparecerem na primeira tela (1366×768).
- **Abas** abaixo: Itens, Anexos, Histórico, Cotações e, só na visualização e quando há dado, Autorização, Recebimento, Rateio e Sub Solicitações (`RequestPurchaseViewSections.tsx`, uma seção por aba; Responsável, Prioridade, Tipo e Mapa de cotações não se repetem). `?tab=0` antigo abre Itens; erro de validação em Dados Gerais rola até eles.
- **Itens, Anexos e Rateio/Sub Solicitações em tabela** (`SimpleTable`), com cabeçalho "título + contador + ação" e vazio tracejado (`Solicitacao/RequestTabParts.tsx`). Itens editáveis na própria linha; **todo item tem Valor (R$) e Descrição** (obrigatórios só onde o schema exige; o envio já manda os dois). Anexos com upload compacto (`FileUpload compact`).
- **Histórico em linha do tempo** (`components/ui/EventTimeline.tsx`): do mais recente para o mais antigo, ponto na cor da situação, data, responsável, tempo gasto e justificativa.
- **Cotações:** os cartões altos viraram um **comparativo**:
  - resumo no topo: fornecedores, respondidas ("3 de 15") e menor valor com o fornecedor;
  - tabela (`SimpleTable`) com Fornecedor (data e quem cotou), Situação, Valor, Desconto, **Valor final** e Saving; recebidas primeiro, do menor para o maior valor final, com a marca "Menor valor"; cotação ainda não recebida mostra "—" no lugar de R$ 0,00 (regra em `quotationRanking.ts`, com teste);
  - marcar todas no cabeçalho; "Enviar e-mail (n)" só aparece com cotação marcada;
  - "Enviar para autorização" saiu do menu de cada cotação (ele age sobre a ordem, não sobre a cotação) e foi para o cabeçalho da aba; com ao menos uma cotação recebida ele vira a ação principal e "Adicionar fornecedor" fica secundário.

## Protótipo visual para apresentação (não portar)

Plano: documento "Ordem de compra — protótipo visual para apresentação" (roteiro de 9 passos, 16 peças, 5 lotes), feito sobre o plano "Ordem de compra — validação e plano" (fases F0–F6). Mostra o fluxo antes de construir a API.

- **Chave:** `PURCHASE_ORDER_PROTOTYPE` (`config/v2/purchaseOrderPrototype.ts`). Só liga com os dados fictícios (`yarn dev` com mocks ou build de demonstração); `VITE_PURCHASE_ORDER_PROTOTYPE=false` desliga. No front oficial é sempre `false`.
- **Dados de demonstração** (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`): 10 ordens de fazenda, uma em cada situação, com itens, movimentações, aprovador, rateio e cotações coerentes; respondem às 9 visões da lista, ao detalhe e às cotações. A ordem do roteiro é a **0012** (adubação de plantio, compra efetuada, AgroNutri). Nomes todos fictícios.
- **Campos de protótipo** (ainda não existem na API; tipos em `Solicitacao/prototype/prototypeFields.ts`): na ordem, `flow_profile` (Simples, Padrão, Completo), `winning_provider`, `buyer`, `cancelled_at_step`, `delivery_forecast` (a mais tarde entre os itens), `delivery` (`freight_type` CIF/FOB, `place`, `carrier`, `needs_unloading`, `note`) `approvals[]` (`level`, `level_label`, `user`, `status` approved/rejected/pending, `decided_at`, `note`), `payment` (`condition`, `installments[]` com `seq`/`due_date`/`value`/`status`, `expenses` frete/seguro/outras), `invoices[]` (`issuer`, `number`, `series`, `issued_at`, `entered_at`, `value`) e `receipt_partial`; no item, `unit_price`, `received_quantity` e `cancelled`. A origem usa os campos que a API já tem (`parent`, `children`), só que hoje não vêm no detalhe.

| Lote | Peça | Onde | Situação |
|---|---|---|---|
| 1 | Dados de demonstração | `mocks/dev-api/handlers/purchaseOrdersDemo.ts` | feito |
| 1 | Etapas da OC no topo (Pedido → Cotação → Aprovação → Compra → Recebimento → Encerrada; a etapa que o perfil não tem não aparece e a numeração conta só as que existem; parada em vermelho) | `components/ui/StepTrack.tsx` (kit, portável) + `Solicitacao/prototype/purchaseOrderSteps.ts` (regra, com teste) | feito |
| 1 | Fornecedor e comprador no topo | `Solicitacao/prototype/PurchaseOrderProcessBar.tsx` | feito |
| 2 | Itens com saldo na visualização: Qtde, Vlr. unitário, Vlr. total, Recebido, Saldo, Previsão e total da ordem (edição continua no `RequestItemRow`) | `Solicitacao/prototype/PrototypeItemsTable.tsx`; conta em `itemTotals` (com teste) | feito |
| 2 | Previsão de entrega no topo, selo "Atrasada" e "Alterar" com nova data e justificativa (só na edição; muda só a tela) | `PurchaseOrderProcessBar.tsx`; regra `isDeliveryLate` (com teste) | feito |
| 2 | Selo "Atrasada" na lista (Todas e Criadas por mim) | `Solicitacao/index.tsx`, coluna Descrição | feito |
| 2 | Aba Entrega na visualização: frete CIF/FOB, transportadora, descarga, destino e observação | `RequestPurchaseViewSections.tsx`, seção `delivery` | feito |
| 3 | Aprovações na aba Histórico (nível de alçada, aprovador, situação, data, parecer), acima da linha do tempo | `Solicitacao/prototype/PrototypeApprovalsTable.tsx`; campo `approvals[]` | feito |
| 3 | Aba Vínculos na visualização: ordem de origem e derivadas, com link (no lugar de Sub Solicitações); dado de demonstração: 0022 separada da 0013 | `RequestPurchaseViewSections.tsx`, seção `links` | feito |
| 3 | Duplicar: botão no rodapé (quem pode criar), diálogo com os itens marcáveis e "Nova ordem" preenchida (data de hoje; sem código, anexos, cotações e histórico) | `DuplicateOrderDialog.tsx`; regra `buildDuplicateState` (com teste); leitura do estado em `CreateOrUpdateSolicitacao.tsx` (por `location.key`, porque /visualizar e /novo reaproveitam a instância) | feito |
| 4 | Aba Pagamento: condição, despesas (frete, seguro, outras), parcelas e conferência parcelas × (itens + despesas) | `Solicitacao/prototype/PrototypeFinancePanels.tsx`; regra `paymentCheck` (com teste) | feito |
| 4 | Aba Notas fiscais: NFs da ordem com a soma ao lado do total | `PrototypeFinancePanels.tsx` | feito |
| 4 | Registrar recebimento (compra efetuada): NF + quantidade por item (padrão = saldo); saldo cai, rótulo "Recebimento parcial", sem saldo vira recebida; NF entra na aba | `PrototypeOrderActions.tsx` (rodapé); rota simulada `/prototype/receipt` | feito |
| 4 | Cancelar saldo (encerra se algo foi recebido, senão cancela), cancelar item (na linha) e reabrir, todos com justificativa na linha do tempo | `PrototypeOrderActions.tsx`, `PrototypeItemsTable.tsx`; rotas `/prototype/cancel-balance`, `/cancel-item`, `/reopen` | feito |
| 5 | Tela "Fluxo da ordem de compra" (`/administrativo/ordens-de-compra/parametros`, item de menu `adm-sup-flx` em Suprimentos): perfil Simples/Padrão/Completo, categorias com os tipos atuais, cotação por faixa de valor (editável), aprovação automática (valor por ordem, limite diário e transações por dia, que se redistribuem: limite diário = valor por ordem × transações; regra em `Solicitacao/prototype/autoApprovalLimits.ts`, com teste) e níveis de alçada; "Salvar" só avisa (protótipo) | `OrdensCompra/PurchaseOrderFlowSettings.tsx`; rota e menu só com `PURCHASE_ORDER_PROTOTYPE` | feito |
| 5 | Diagrama do fluxo (F0): uma linha de etapas por perfil, só com as etapas que o perfil tem (linhas de tamanhos diferentes), legenda do que muda e as exceções (recusa, recebimento parcial, cancelamento, reabrir) | topo da mesma tela, `StepTrack` | feito |
| 5 | Categoria no lugar do Tipo: campo somente leitura ao lado de Tipo, derivado dele. ~~6 categorias para os 11 tipos~~ (substituída em 26/11): **4 categorias + 2 marcações**, decisão 4 do plano (Pietro, 25/11) — Produto (Produto); Serviço (Serviço, Diária, Empreitada, Frete, Manutenção); Reembolso e adiantamento (só financeiro); Despesa fixa. Emergencial vira marcação **Urgência** (perfil Simples) e Compra efetuada vira **Regularização** (pula a cotação); os pedidos antigos desses dois tipos caem em Produto e o campo mostra "Produto · Urgência". Manutenção dentro de Serviço é ponto a conferir na F0. A nova OS entra em Serviço, pelo Gera execução do Tipo de serviço (26/11), sem categoria nova | `Solicitacao/prototype/purchaseOrderCategories.ts` (`categoryOfType`, `markOfType`, com teste); `CreateOrUpdateSolicitacao.tsx`; tabela "Marcações" em `PurchaseOrderFlowSettings.tsx` | feito |
| 6 | **Solicitação gera N Ordens de compra (26/11):** botão "Gerar ordens de compra" no rodapé da Solicitação (enquanto houver item sem ordem e ela não estiver encerrada ou cancelada); no diálogo, cada linha diz quanto do item vai para qual fornecedor e "Dividir" cria outra linha do mesmo item para outro fornecedor; nasce **uma Ordem por fornecedor** e a Solicitação continua aberta. Na aba Vínculos: "Ordens de compra geradas" (código, fornecedor, itens, situação) e "Itens em ordem" (pedido, em ordem, sem ordem). Os textos de Vínculos voltaram a falar de "solicitação" | `Solicitacao/prototype/generateOrders.ts` (`itemCoverage`, `validateGenerateOrders`, `buildGenerateOrdersPayload`, com teste); `GenerateOrdersDialog.tsx`; `PrototypeGeneratedOrders.tsx`; `PrototypeOrderActions.tsx`; `RequestPurchaseViewSections.tsx`; rota simulada `/prototype/generate-orders` e campos `generated_orders`/`provider_options` em `purchaseOrdersDemo.ts` | feito (não conferido no navegador) |

**A fazer (Solicitação × Ordem, 26/11):**
- [ ] front: tela própria da Ordem de compra (lista e detalhe por fornecedor), com o vínculo de volta para a Solicitação de origem; hoje as ordens geradas só aparecem na Solicitação.
- [ ] front: Ordem que começa sozinha (sem Solicitação).
- [ ] produto: em que etapa a Solicitação gera as ordens (depois da cotação? da aprovação?) e o que acontece com o status dela quando tudo está em ordem.
- [ ] backend: entidade Ordem de compra (fornecedor único, itens com `request_item_uuid`) e a rota de gerar ordens.

**Roteiro completo (os 9 passos do plano) navegável:** 1–2 em "Fluxo da ordem de compra"; 3 na lista (Todas, contadores, selo Atrasada); 4 na 0012 ou em Duplicar; 5 na aba Cotações; 6 em Histórico → Aprovações; 7 em Pagamento e Entrega; 8 em "Registrar recebimento"; 9 em "Cancelar saldo" e na linha do tempo.

**Ações simuladas (lote 4):** chamam `/request-purchases/{uuid}/prototype/*` (`prototype/prototypeActions.ts`), rotas que só existem nos dados de demonstração. Mudam a ordem na memória do navegador e cada uma vira um evento na linha do tempo; **recarregar a página volta tudo ao estado inicial** (útil para repetir a apresentação). Com o protótipo ligado, o "Receber" original (API real) fica escondido.

### Mudanças globais que nasceram aqui

- **Ícone de configurar colunas** em todas as listas: papel `columns-settings` (`Columns3CogIcon`, HugeIcons) em `design/icons.ts`; o botão do `GridSettingsFloatingPanel` ganhou a moldura e a altura do "Filtros".
- **`FormContainer`:** a área de rolagem não alarga mais com conteúdo largo (`min-width: 0`); tabelas largas rolam dentro delas.
- **`Table`:** aceita "abrir linha" vindo do `EmbeddedList` (`onRowOpen`), sem mudar as outras telas.

### Histórico de entregas (25/11)

| Commit | O que mudou |
|---|---|
| `ea4dc50` | Tela única de Ordens de compra com as listas embutidas |
| `fb9b2f0` | Comparativo de cotações; Dados Gerais em seções |
| `c07d122` | Itens, Anexos e Histórico em tabela; Valor (R$) e Descrição em todo item |
| `8b172b4` | `FormContainer` sem alargar; `FileUpload compact` |
| `0ab63c3` | Histórico em linha do tempo (`EventTimeline`) |
| `efa2b97` | Dados Gerais fixos acima das abas; ações no rodapé |
| `0b54da2` | Ícone de colunas global |
| `6de6146` | Visualização compacta; seções extras viram abas |
| `8e0985a` | Seletor de visão, Todas, Rejeitadas × Canceladas, Novo fixo, busca em Comigo |
| `fee7831` | Clique na linha abre a visualização |
| `f284445` | Documentação desta funcionalidade e mapa de mudanças atualizados |

## Pendências de decisão

- ~~O que a Operação da compra representa~~ — decidido: **classifica o custo**, preenchendo o rateio da autorização (ver seção 2). Falta: mais de um par categoria/centro por operação e centro de custo ausente na fazenda.
- Nome final para evitar o conflito "Serviços" (cadastro) × "Serviço" (tipo da ordem).
- Se Pastagem, Planejamentos, Rateios e Contas a pagar também passam a usar o campo único "Serviço".
- Rodar `contagens-impacto.sql` para saber quantas OS existem por status, quantas atividades estão em mais de um tipo de serviço e o volume de ordens de compra por status.
