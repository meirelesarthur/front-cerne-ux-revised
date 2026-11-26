# Fim da Ordem de Serviço: Apontamento, Solicitação e Ordem de compra

Atualizado em 26/11/2026 · Status: feito + proposta

Relacionados: [ordem-de-compra-unica-e-tipos-de-servico.md](ordem-de-compra-unica-e-tipos-de-servico.md)
(Solicitação × Ordem de compra, Tipos de serviço, Serviços e Operações),
[central-de-agrupador.md](central-de-agrupador.md) (centrais do menu)

## Regras vigentes

**Fim da OS e o que entra no lugar**

- **24/11 — A Ordem de Serviço acabou.** As telas saíram do menu e das rotas (código mantido, chave
  `SERVICE_ORDERS_ENABLED = false`).
- **24/11 — Trabalho da equipe entra pelo Apontamento.** O Apontamento vale para **Agricultura e Pecuária** e é ele que
  vai para o campo no lugar da OS: o escritório cria e escolhe o responsável; a equipe recebe no app Operação, faz o
  trabalho e registra o que usou (seção "Web × App").
- ~~**24/11 — Produto ou serviço de fora entra pela "Ordem de compra" (antiga Solicitação de compra, renomeada).**~~
  **Substituída em 26/11** (conversa do dono com o CEO): produto ou serviço de fora entra pela **Solicitação de
  compra**, que continua com esse nome; dela nascem as **Ordens de compra**, uma por fornecedor. A Ordem também pode
  começar sozinha (avulsa). Detalhe no doc relacionado.
- **24/11 — No serviço comprado, o Recebimento confirma que o serviço foi feito.** Desde 26/11 o recebimento é ação da
  **Ordem de compra**.
- **26/11 — A nova OS é a Ordem do tipo Serviço:** entra na categoria **Serviço**, sem categoria nova; se o **Tipo de
  serviço** tiver **"Gera execução = Sim"**, o serviço recebido gera a execução (Apontamento); com "Não", a ordem só
  registra a compra e o custo.

**Tipo de serviço, Serviço e Apontamento**

- **24/11 — Renomeação:** o cadastro de Operações passa a se chamar **"Tipos de serviço"** e o de Atividades,
  **"Serviços"**; muda só o que a pessoa vê (API, tabelas e permissões com o nome antigo).
- **24/11 — Apontamento com um campo só, "Serviço",** que mostra "Tipo de serviço · Serviço" (ex.: "Pulverização ·
  Aplicação de herbicida") e continua enviando `operation_uuid` e `activity_uuid`.
- ~~**24/11 — O campo único se chamaria "Tipo de serviço".**~~ **Substituída em 24/11** pela regra acima (campo
  "Serviço"; "Tipo de serviço" é o cadastro).
- **26/11 — O Tipo de serviço guarda todos os parâmetros** do que o Apontamento pede (uso, safra, cultura, lote,
  área, lançamentos obrigatórios, produção, ocorrência, fotos, texto, assinatura, aviso) e o **"Gera execução"**;
  **o Serviço é só descrição e situação**. ~~Parâmetros no Serviço (24/11)~~ — substituída em 26/11.
- **24/11 — O "Serviço" do Apontamento filtra pelo uso** (Agricultura ou Pecuária), como a operação faz hoje.

**Operação na compra**

- **24/11 — Nasce o cadastro novo "Operações"** (não é o antigo, que virou "Tipos de serviço"): obrigatório, só
  Operação (sem Atividade), classifica o custo (categoria financeira e centro de custo padrão) e vai para a despesa
  gerada. Ordens antigas sem operação abrem normalmente e só exigem o campo ao serem editadas.
- **26/11 — A Operação é da Ordem de compra** (a entidade nova, de fornecedor único, gerada ou avulsa), não da
  Solicitação; segue da Ordem para a despesa. A regra de 24/11 foi escrita quando "Ordem de compra" era o nome da
  Solicitação.

## O que mudou

### Central "Trabalho e compras" e fim da OS (feito, 24/11)

- **Central** em `/operacional/central` (guarda `appropriations_view` ou `request-purchases_view`): dois cards do kit
  (`components/ui/ModuleLinkCard.tsx`) — Apontamento e compra — e o botão **"Como funciona"**, que abre um modal com a
  jornada Pedir → Cotar → Aprovar → Comprar → Receber → Pagar (na ordem dos status) e atalhos (Apontamentos,
  Solicitações, Meus processos, Recebimentos). Arquivos: `pages/Operacional/ServiceOrdersHub/*`.
- **Menu:** grupo **"Trabalho e compras"** (Central e Apontamentos); o grupo de OS só aparece com a chave ligada
  (`config/v2/serviceOrdersFeature.ts`, `navigationTree.ts`, `navigationPermissions.ts`).
- **Rotas desligadas:** `/operacional/lista-os`, `/minhas-os`, `/monitoramento`, `/avaliacoes`.
- **Apontamento:** estado vazio explica Apontamento × compra; a confirmação de "Finalizar" diz o efeito (estoque) e o
  próximo passo.
- ~~**Nome:** "Solicitação de compra" → "Ordem de compra" nos 3 idiomas (`scripts/ux-docs/rename-ordem-compra.py`,
  `521ead7`).~~ **Desfeito em 26/11** (`2920f89`): os textos voltaram a "Solicitação"; o menu de Suprimentos mostra
  "Solicitações de compra" e, com o protótipo ligado, "Ordens de compra" (a entidade nova).
- Ainda **sem ajuste** ao conceito de 26/11: o card e a jornada da Central falam em "Ordem de compra" e abrem o
  formulário de Solicitação (ver "A fazer").

### Proposta anterior (histórico, 23 e 24/11)

- **001 (23/11):** OS como contratação de serviço, com tela "Começar aqui" (`ChoiceCardGroup`, `StepIndicator`) e
  pré-seleção do tipo Serviço na Solicitação pela URL (`initialRequestType.ts`, só na criação).
- **002 (24/11):** "Começar aqui" virou **Central**, com três cards e a ajuda num modal; nasceu o `ModuleLinkCard`.
- Substituídas pela decisão de 24/11 (fim da OS); o que ficou foi a Central, o `ModuleLinkCard` e a pré-seleção do
  tipo.

### Refinamento da compra com referência no ERP de revendas (proposta de 24/11; protótipo em 25 e 26/11)

O que o ERP tem e a compra do Cerne não mostrava. O protótipo (não portar) já cobre a maior parte, **na Ordem de
compra** desde 26/11.

| Ponto | No ERP | Situação |
|-------|--------|----------|
| Fornecedor e comprador | Na própria ordem | Fornecedor no detalhe da **Ordem**; comprador na faixa da **Solicitação** (protótipo) |
| Previsão de entrega | Faturamento e recebimento | **Uma por Ordem**, com "Definir/Alterar previsão" (protótipo); API a fazer |
| Itens com saldo | Pedido, recebido e saldo | Recebido e Saldo na **Ordem**; "Em ordem / Sem ordem" na Solicitação (protótipo) |
| Totais | Produtos, frete, seguro, outras | Aba Pagamento da **Ordem**, com conferência parcelas × (itens + despesas) (protótipo) |
| Autorizadores | Alçada, data, situação, observação | Aprovações na aba Histórico da Solicitação (protótipo) |
| Reabrir e cancelar | Na própria ordem | Reabrir na Solicitação; Cancelar saldo na Ordem (protótipo) |
| Operação | — | Na **Ordem de compra** (decidido em 26/11); campo e API a fazer |
| Justificativa por item | Por produto | Mantida geral; avaliar depois |
| Serviço | — | No tipo Serviço, falar "Confirmar serviço" e "Serviço feito" no recebimento (a fazer) |
| Fiscal (ICMS, IPI, CBS/IBS) | Por item | Fora do escopo: o Cerne não emite a NF da compra |

## Como validar

1. O menu não mostra Ordens de Serviço; `/operacional/lista-os` não abre.
2. Operacional › Trabalho e compras › **Central**: dois cards (só os da sua permissão); "Como funciona" abre o modal
   com a jornada e os atalhos.
3. Suprimentos mostra **"Solicitações de compra"**; Novo abre "Nova Solicitação de Compra".
4. Apontamentos sem registros: o estado vazio explica Apontamento × compra.
5. Testes: `npx vitest run src/pages/Operacional/ServiceOrdersHub src/config/v2/groupHub.test.ts
   src/components/Suprimentos/StepBackDialog.test.tsx`.

## A fazer

**Front (web)**

- [ ] Central: ajustar o card "Ordem de compra" e a jornada do modal ao conceito de 26/11 (o card abre a
  **Solicitação**; a Ordem nasce dela ou avulsa) — renomear ou separar em dois caminhos.
- [ ] Apontamento com o campo único "Serviço" (Tipo de serviço · Serviço), lendo os parâmetros do Tipo de serviço.
- [ ] Recebimento da Ordem do tipo Serviço com os termos "Confirmar serviço" e "Serviço feito".
- [ ] Apontamento pecuário: campo Uso e responsável no formulário, filtro pelo uso e campos agrícolas escondidos na
  Pecuária (depois da API).

**Backend**

- [ ] "Gera execução" no Tipo de serviço e geração da execução (Apontamento) ao receber o serviço — sem gerar em dobro
  com o que a despesa já cria hoje.
- [ ] Apontamento com `batch_uuid` e categoria, responsável diferente de quem criou e lista "atribuídos a mim".
- [ ] Sincronização: baixar apontamentos Abertos atribuídos e aceitar atualização (hoje `POST /sync/appropriations` só
  cria).
- [ ] Desligar a criação de OS na API só depois que web e app estiverem sem OS.

**App (GB CERNE APP)**

- [ ] ADM: tirar o ladrilho "Ordem de Serviço" (12 → 11) e os indicadores de OS; "Apontamentos agrícolas" vira
  "Apontamentos" com "Novo apontamento".
- [ ] OPER: "Ordens de serviço" do Início vira "Para fazer" (apontamentos atribuídos); sai "Minhas OS" da
  Sincronização.
- [ ] Marcar como obsoletos os 18 fluxos de OS (ADM: FLX-042..046, 057, 142, 143, 176, 177; OPER: FLX-122, 124,
  150..155) **quando o app mudar e o dono autorizar**; revisar FLX-141 e os de Início e Sincronização.
- [ ] Fase 2: no OPER, "Pedir produto ou serviço" (Solicitação); no ADM, consultar e aprovar.

**Menu Operacional (trabalho futuro)**

- [ ] Rever o menu de ponta a ponta: o grupo de item único do Apontamento, as telas ligadas a ele dentro de
  Agricultura e a opção de um grupo "Trabalho e serviços"; sair junto do ajuste do app.

### Pendências de decisão

- Se **Pastagem, Planejamentos, Rateios, Áreas, Contas a pagar e NF de entrada** também passam a usar o campo único
  "Serviço" (Tipo de serviço · Serviço), ou só o Apontamento.
- Destino das OS já cadastradas: arquivar ou converter (uma OS Aberta pode virar apontamento Aberto).

## Registro de edições

| Data | Commit | O que mudou |
|---|---|---|
| 23/11/2026 | — | 001: OS como contratação de serviço (proposta substituída) |
| 24/11/2026 | `0e32c3b` | 002: Central com cards e ajuda em modal; `ModuleLinkCard` |
| 24/11/2026 | `521ead7` | 003: fim da OS; "Solicitação de compra" renomeada para "Ordem de compra" (desfeito em 26/11) |
| 24/11/2026 | `f9e02ae` | Tipo de serviço e operação obrigatória na compra |
| 26/11/2026 | `2920f89` | Textos voltam a "Solicitação de compra" (conceito Solicitação × Ordem) |
| 26/11/2026 | `91bd88c` | Doc reescrito pela lei 6; regras de 26/11 (Solicitação × Ordem, "Gera execução", Serviço só descrição); proposta do ERP atualizada com o que o protótipo já cobre |
| 26/11/2026 | (este commit) | Operação é da Ordem de compra (decisão do dono) |

## Anexo: Web × App — catálogo de fluxos do GB CERNE APP (24/11)

Fonte: catálogo de fluxos do projeto GB CERNE APP no GB Manager (126 fluxos aprovados, versão v1). O app tem dois
aplicativos: **Administração (ADM)**, para o escritório, e **Operação (OPER)**, para o campo, que funciona sem internet
e envia tudo pela Sincronização. Os dois usam o mesmo banco do web.

| Tema | Web | App ADM | App OPER |
|------|-----|---------|----------|
| Ordem de Serviço | Fora do menu e das rotas | 1º ladrilho de Consultas: listar, criar em 7 etapas, cancelar, avaliar; indicadores na Visão geral | "Ordens de serviço" no Início, "Minhas OS", iniciar, checklist, problemas, anexos, concluir, histórico |
| Apontamento | Central › trabalho da equipe | Só consulta ("Apontamentos agrícolas") | Registro em 3 etapas e adição rápida; **só agrícola** |
| Solicitação e Ordem de compra | Central e Suprimentos | Não existe | Não existe |
| Recebimento | Confirma produto e serviço (na Ordem, protótipo) | Não existe | Não existe |

- **No app a OS é despacho de trabalho interno**, não contratação; com o fim da OS, o despacho passa ao Apontamento
  atribuído.
- **Concluir a OS não gera apontamento nem mexe em estoque**: os insumos da OS são planejamento; a baixa só acontece
  pelo Apontamento.
- **O Apontamento do app é só agrícola**; a OS aceitava Pecuária e Ambos (lote e categoria).
- **Não há compra no app**: quem está no campo não pede produto ou serviço de fora pelo celular.

**O Apontamento vai para o campo (decisão de 24/11), em 5 etapas:**

| Etapa | Quem | Onde | O que acontece |
|-------|------|------|----------------|
| 1. Planejar | Escritório | Web ou app Administração | Uso, local, serviço, data, **responsável** e o previsto. Fica **Aberto** |
| 2. Receber | Equipe | App Operação › Início | Aparece em "Para fazer" para o responsável |
| 3. Executar | Equipe | App Operação | Confirma ou corrige o realizado (quantidades, horímetro, insumos, produção, ocorrências, fotos); sem internet |
| 4. Enviar | Equipe | Sincronização | Volta ao escritório |
| 5. Fechar | Escritório | Web | **Finalizar** (estoque e produção) e **Apropriar** (custo na área ou no lote) |

**Uso Pecuária:** local = pasto, módulo ou curral; **lote** e **categoria**; sem cultura, safra e área utilizada;
serviços filtrados pelo uso; armazém de produção opcional. **Aproveita-se** a seção do Início, os botões "Iniciar" e
"Concluir" e a fila de envio da OS; o registro direto no campo (FLX-064, 065) continua.

**Onde o Apontamento usa operação e atividade hoje (web):** `AppropriationHeaderFields.tsx` (cascata
`operation_uuid` → `activity_uuid`), `CreateOrUpdateAppropriation.tsx`, `FinishAppropriation.tsx`,
`appropriation-form-mapper.ts`, `appropriation-schema.ts` e `appropriation-service.ts`. No app Operação, a Etapa 1 do
apontamento tem os mesmos dois seletores (FLX-064, 065, 141).
