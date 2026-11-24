# Ordem de compra única, Tipos de serviço e Operações — mapa de impacto

- **Data:** 24/11/2026
- **Fontes:** backend `GB.Cerne.Api` (cópia do branch develop, commit `27fcb49cc`: modelos, migrações, rotas, repositórios e requests) e este front. O dump do banco **não foi lido**, por regra do projeto; as contagens de uso estão em `CORE_WORKSPACE/07-Extracoes_Produto/contagens-impacto.sql`, para quem tem acesso ao banco rodar.
- **Relacionado:** [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md) (fim da OS).

## Decisões do dono (24/11)

1. **Operações → "Tipos de serviço"** e **Atividades → "Serviços"** (renomeação do cadastro atual).
2. **Nasce um cadastro novo, "Operações"**, usado na **Ordem de compra** (campo obrigatório no cabeçalho, sem Atividade, levado à despesa gerada).
3. **Todas as telas de solicitação convergem numa única "Ordens de compra"**, filtrável por status (solicitação, cotação, aprovação, compra, recebimento, encerradas).

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
2. **Front:** lista única de Ordens de compra com as visões sobre os endpoints atuais e filtro de 1 status.
3. **Backend:** `status[]`, `scope`, `allowed_actions` e contagens; o front passa a usar o endpoint único.
4. **Backend e front:** cadastro novo de Operações e campo obrigatório na ordem; ligação com a despesa.
5. **App:** rótulos e campo único no apontamento; depois a ordem de compra.

## Pendências de decisão

- ~~O que a Operação da compra representa~~ — decidido: **classifica o custo**, preenchendo o rateio da autorização (ver seção 2). Falta: mais de um par categoria/centro por operação e centro de custo ausente na fazenda.
- Nome final para evitar o conflito "Serviços" (cadastro) × "Serviço" (tipo da ordem).
- Se Pastagem, Planejamentos, Rateios e Contas a pagar também passam a usar o campo único "Serviço".
- Rodar `contagens-impacto.sql` para saber quantas OS existem por status, quantas atividades estão em mais de um tipo de serviço e o volume de ordens de compra por status.
