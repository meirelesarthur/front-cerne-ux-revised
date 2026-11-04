# Varredura de UX — telas fora do CRUD simples e cadastros grandes (2026-11-04)

> **O que é:** levantamento de **onde** e **o que** melhorar, feito no papel de UX sobre todas as áreas do menu
> (exceto Dashboards e Relatórios, fora de escopo). Não altera código — é o backlog para as próximas ondas.
> **Já tratado e fora desta lista:** Fazendas, Safras, Produtos, Centro de Custo, Plano de Contas, Usuários,
> Pessoas, Conciliação OFX, Contratação de plano, Login, Onboarding (ver `docs/ux/funcionalidades/`).

**Como foi feito:** leitura do código de ~400 mil linhas de telas em 6 frentes (Pecuária, Confinamento/Agrícola/OS,
Comercial, Administrativo, Cadastros Base, Financeiro/Fiscal/Frota/Integrações) + captura no navegador
(`yarn dev` com mocks) de 15 formulários grandes. Contagens de campos são por código (ordem de grandeza).
Itens marcados ⚠ dependem de backend.

---

## 1. Resumo executivo

**O problema central não é visual — é de fluxo.** O kit novo chegou nas cascas (`FormContainer`, títulos, tema),
mas as telas grandes continuam espelhando o sistema legado: cabeçalho longo num grid único, abas soltas, total
escondido, processo sem etapa visível e operação de campo feita um item por vez.

### Top 10 (maior ganho para o usuário)

| # | Onde | O que fazer | Esforço |
|---|---|---|---|
| 1 | **Contas a pagar / a receber / Notas de entrada** | Quebrar o cabeçalho (~35 campos) em seções; **painel de totais fixo** com "falta ratear/parcelar"; aviso ao sair sem salvar | G |
| 2 | **NF-e / CT-e / MDF-e** | **Painel único de emissão**: estado → próxima ação → prévia (DANFE/DACTE/DAMDFE) → **rejeição SEFAZ traduzida** com link para o campo | G |
| 3 | **Cadeia de compras** (Solicitação → Cotação → Autorização → Recebimento) | **Barra de etapa + "próxima ação"** em todas as telas da cadeia; **comparação de cotações lado a lado** na tela (hoje só baixa xlsx); aprovação em lote | G |
| 4 | **Pesagem de animais** | Trocar 1 cartão de 9 campos por animal por **tabela editável** + "carregar animais do lote" + resumo (nº, peso total, média) | G |
| 5 | **Venda / Compra de Animais** | **Wizard** (Dados → Animais → Financeiro → Revisão) com total ao vivo; "Gerar financeiro" como interruptor | G |
| 6 | **Apontamentos (apropriação de custos)** | 6 abas + 5 botões no rodapé → seções com contador de pendência, **1 ação primária por status**, prévia antes de Finalizar/Apropriar | G |
| 7 | **Processamento (finalizar)** | Wizard "animal 1 de N" → **lista com status por animal** + "aplicar a todos" | G |
| 8 | **Importações por planilha** (≥ 9 modais iguais) | **Um único assistente de importação**: modelo → envio → **prévia com erros por linha** → confirmar | G |
| 9 | **Natureza de Operação / Regras Fiscais** | ~47 campos fiscais numa página → etapas condicionais + **glossário de siglas** (CST, CSOSN, CFOP…) | G |
| 10 | **Notas de entrada — itens do XML** | Etapa de **conferência do XML**: itens casados × pendentes, "criar todos os produtos pendentes" | G |

---

## 2. Padrões transversais (corrigir uma vez, propaga — Lei 2)

| # | Padrão | Evidência | Correção |
|---|---|---|---|
| T1 | **Total/resumo escondido** — o usuário não vê o impacto enquanto preenche nem revisa antes de salvar | `SummaryPanel` e `RemainingBalance` existem no kit e **não são usados** em Venda/Compra de Animais, Romaneio, Contas a pagar/receber, Notas, Autorização, Transferências, Apuração, Orçamento | Regra de composição: todo form com valores tem `SummaryPanel` fixo + `RemainingBalance` em parcelas/rateio |
| T2 | **Abas como substituto de seção** — sem contador e sem indicar qual aba tem erro | Apontamentos (6), OS (6), Pastagem (6), Inventário (5), Solicitação (5), Contas a pagar (4), Romaneio (3), Carregamento (3), NF-e (3), MDF-e (3) | Seções (`FormSection`) com selo de pendência; abas só quando o conteúdo é realmente independente |
| T3 | **Abas usadas como wizard** | Inventário (abas + Voltar/Próximo, Voltar já na 1ª aba), Curral (`Tabs.Trigger` como etapas), Pesagem Rodoviária (`Steps` antigo) | Migrar para `StepIndicator` + `StepBody` + `StepFooter` |
| T4 | **Processo sem etapa visível** — status em bolinha/legenda, ações espalhadas em menus (até 16 em "Meus Processos") e telas separadas | Cadeia de compras, Apontamentos, Carregamento, Marcação, OS, Recebimento | Novo componente **barra de processo** (etapa atual, responsável, tempo, botão "próxima ação") |
| T5 | **Operação de campo item a item** — cartões altos (8–22 campos) por animal/linha, sem "aplicar a todos", sem carregar lote | Pesagem, Sanitário, Acasalamento, Diagnóstico de Gestação, Processamento, Nutrição, Carregamento, Mortes/Perdas (1 animal por cadastro) | Tabela editável compacta + "carregar do lote" + "aplicar a todos/selecionados" + "salvar e cadastrar outro" |
| T6 | **Importação/execução sem prévia** | ≥ 9 modais de importação de ~300 linhas cada (Pesagem, Marcação, Nascimentos, Inventariado, Transf. de lote, Inventário, Rebanho, Estoque inicial, Mov. bancários), mais Geração de Depreciação e Fechamento de semana | Componente único de importação com prévia; "prévia + confirmar" para gerações em massa |
| T7 | **Booleano como `Select` Sim/Não** | "Gerar financeiro?" (NF-e, Venda de Animais), "Venda em lote", `is_active`, Parâmetros, Natureza de Operação | `ToggleRow` — revela o bloco dependente |
| T8 | **Subcadastro completo em modal aninhado** | `InlineProductModal` (1.011 linhas) dentro do Pedido; `EquipmentDialog` (710) e mais 5 diálogos na Pesagem Rodoviária; `BatchModal` no Curral | Criação rápida com 3–5 campos essenciais e "completar depois" |
| T9 | **Perda de dados ao sair** | Aviso de alterações não salvas (`useUnsavedChangesGuard`) só em 10 módulos (Frota/Transferências, Budget, Pedidos, Pesagem, Planejamentos, Processamentos, Rastreabilidade, Reprodução, Sanitário, Vendas). Ausente em Contas a pagar/receber, Notas, NF-e, Manutenções, Meu perfil | Aplicar o guard no `FormContainer` por padrão (opt-out) |
| T10 | **Listagens no padrão antigo** (desvio nº 1 já aberto) | `ListToolbar` em 80 listagens; Operacional praticamente inteiro, Administrativo (16 de 28), Financeiro, Fiscal e Frota com busca dentro do drawer. Status misto: `Badge` cru × `StatusTag` | Migração em lote por módulo; `StatusTag` com rótulo/cor da API |
| T11 | **Dois estilos de seletor lado a lado** | Visto na NF-e e no Inventário: seletor com busca (texto claro, divisória "\|") ao lado do seletor simples (texto maior e mais escuro) | Unificar altura, fonte e cor do placeholder (relacionado ao desvio nº 3) |
| T12 | **Duplicação entre módulos irmãos** | Financeiro das transferências de Animal/Lote (~1,5 mil linhas cada), Cobranças despesa/receita, 4 editores de rateio, variantes de lote da Marcação | Extrair blocos compartilhados (financeiro de movimentação, editor de rateio) |
| T13 | **Termos fiscais sem ajuda** | Natureza de Operação (5 dicas para dezenas de siglas), Regras Fiscais (3), MDF-e (CIOT, RNTRC), itens da NF-e | Glossário reutilizável (tooltip + link de ajuda) |
| T14 | **~35 cadastros auxiliares de ≤ 3 campos abrem página inteira** | Raças (272 linhas para nome/espécie/ativo), Espécies, Embalagens, Vacinas, Marcadores, Bancos, Condições de pagamento… | Drawer de edição rápida dirigido por configuração |

### Componentes novos que a varredura pede (criar em `src/components/ui/` antes de usar)

| Componente | Resolve | Já existe parecido |
|---|---|---|
| **Barra de processo** (etapa + próxima ação + histórico) | T4 — compras, apontamentos, carregamento, OS, marcação | `StepIndicator`, `StatusTag` |
| **Assistente de importação** (modelo → envio → prévia → confirmar) | T6 — ≥ 9 modais | `StepIndicator`, `StepBody` |
| **Painel de emissão fiscal** (estado, prévia, rejeição traduzida, eventos) | NF-e, CT-e, MDF-e | `NfeEmissionPanel` (base) |
| **Tabela editável compacta** com "aplicar a todos" | T5 — manejo e itens | `RepeaterList`, `BatchFillSection` (Diag. Gestação) |
| **Drawer de edição rápida** | T14 — cadastros auxiliares | `FilterDrawer` |
| **Layout de detalhe** (cabeçalho com status e ações + seções de leitura) | telas de Detalhe repetidas (300–400 linhas cada) | `SummaryPanel` |

---

## 3. Lista por área

Prioridade: **A** alta · **M** média · **B** baixa. Esforço: P/M/G.

### 3.1 Financeiro, Fiscal e Frota

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Contas a pagar — cadastro | `Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx` (2.688 l.) | ~35 campos num grid; Rateio e Parcelamento em abas longe do total; apropriação (~2 mil l.) | `FormSection` (Documento, Valores, Apropriação); `SummaryPanel` + `RemainingBalance`; guard de saída | G |
| A | NF-e — rejeição SEFAZ | `Fiscal/NfeEmitidas/NfeEmissionPanel.tsx` | Mensagem crua da SEFAZ + `cStat`; não diz o que fazer | Dicionário cStat → causa/ação com link ao campo; "Corrigir e reenviar" | M |
| A | NF-e — emitir | `Fiscal/NfeEmitidas/NfeEmitModal.tsx` | Confirmação só pede emissor/IE, sem total nem destinatário; prévia do DANFE fora do fluxo | Resumo (cliente, itens, total, impostos) + "Ver prévia do DANFE" no modal | M |
| A | NF-e — cadastro | `Fiscal/NfeEmitidas/CreateOrUpdateNfe.tsx` (2.331 l.) + `NfeItemsTab.tsx` (1.401) | ~37 campos no cabeçalho (inclui Transportadora/Frete/Volume abertos); ~112 campos fiscais por item | Seções colapsáveis (só obrigatórias abertas); defaults pela natureza; totais fixos; dicas de CFOP/CST | G |
| A | Notas de entrada — itens do XML | `Invoices/InvoiceItemsTab.tsx` (1.271) + `CreateProductFromXmlModal.tsx` (1.074) | Produto não casado → modal de ~9 campos, um por vez | Etapa "Conferência do XML" com casar/criar em lote | G |
| A | Notas de entrada — cadastro | `Invoices/CreateOrUpdateInvoice.tsx` (1.170) | 4 abas com soma cruzada; total só no cabeçalho | `SummaryPanel` com Itens × Parcelas × Rateio; aba com selo de erro; guard | M |
| A | CT-e / MDF-e — emissão | `Fiscal/Cte/CteEmissao/`, `Fiscal/Mdfe/MdfeEmissionPanel.tsx` | Prévia inconsistente (DACTE só após criado; MDF-e sem prévia); ⚠ campo `issue_id` do CT-e depende de endpoint inexistente (GAP-CTE-FE-04) | Painel único de emissão (ver §2) | G |
| A | MDF-e / CT-e — cadastro | `Fiscal/Mdfe/MdfeTab*.tsx`, `Fiscal/Cte/CreateOrUpdateCte.tsx` (1.234) | MDF-e: ~26 + 23 campos em abas; CT-e ~33 campos + 3 listas | Wizard Geral → Transporte → Descarga → Resumo; ajuda em CIOT/RNTRC | G |
| M | NF-e — listagem | `Fiscal/NfeEmitidas/index.tsx` | Sem seleção múltipla; ações uma a uma; rejeitadas só vistas no detalhe | `BulkActionBar` (consultar, baixar XMLs); fila "Rejeitadas" em `QueueTabs` | M |
| M | Contas a receber — cadastro | `Incomes/CreateOrUpdateIncome.tsx` (1.519) | ~17 campos + Parcelas + Rateio; aviso de adiantamento é texto solto | `FormSection`, `SummaryPanel`, `Alert`, guard | M |
| M | Contas a pagar/receber — listas | `Financeiro/ContasAPagar/index.tsx`, `Incomes/index.tsx` | Busca no drawer; `Badge` cru | `ListToolbar`; `StatusTag`; `BulkActionBar` com soma dos selecionados na baixa em lote | M |
| M | Manutenções de frota | `Frota/Manutencoes/MaintenanceItemRow.tsx` (502) + `GerarFinanceiroManutencao.tsx` | ~13 campos por item; gerar financeiro em rota separada; sem guard | Linha resumida expansível; total; "Gerar financeiro" do detalhe com valor por fornecedor | M |
| M | Exportações Domínio/CSV | `Integracoes/Export*/index.tsx` (5 telas) | Baixa direto, sem saber quantos registros; arquivo vazio possível | Pré-contagem "N lançamentos, R$ X"; vazio explicado; agrupar as 5 telas | M |
| M | Manifestação de DF-e | `Fiscal/Dfe/DfeManifestModal.tsx` | Lote não bloqueia evento fora do prazo; sem resumo | Resumo (N notas, total, prazo mais curto); descrição de cada evento | P |
| M | Importação XML (entrada) | `Invoices/InvoiceXmlUploadModal.tsx` | "Documento já lançado" sem caminho | Link para a nota existente; contagem de itens casados | P |
| M | Previsão orçamentária | `Financeiro/BudgetPlanning/BudgetPlanningGrid.tsx` | Matriz 12 meses sem coluna/linha fixa | Fixar categoria e totais; "copiar do ano anterior"; "aplicar % de reajuste" | M |
| M | Congelamento de período | `Financeiro/Congelamentos/CreateOrUpdateFinancialFreeze.tsx` | Bloqueia lançamentos do mês sem confirmação de impacto | Confirmação explícita com nº de lançamentos afetados | P |
| M | Listas de Frota | `Frota/{Manutencoes,Abastecimentos,ManutencoesPreventivas,Transferencias}/index.tsx` | Título montado à mão; sem `PageHeader`/`ListToolbar` (Revisões já usa) | `PageHeader` + `ListToolbar`; `QueueTabs` "Pendentes de recebimento" | P |
| M | Mercado Pago | `Financeiro/MercadoPago/index.tsx` | Vazio é o caso normal e diz só "Nenhuma informação encontrada" | `EmptyState` explicativo + `PageHeader` | P |
| B | Importação de mov. bancários | `Financeiro/ImportacaoMovBancarios/MovementSheetImportModal.tsx` | Sem modelo nem prévia; 1 linha inválida rejeita tudo | Assistente de importação (§2) | M |
| B | Meu perfil | `MeuPerfil/index.tsx` | Título à mão; aviso de saída só no fechar aba | `PageHeader`; guard de navegação | P |
| B | Configurações / Apps / Ajuda | `Configuracoes/*/index.tsx` | Form único de ~15 campos; busca no drawer | `FormSection` com status; `ListToolbar` | P |
| B | Cores fixas | ~70 usos de escala fixa (`orange.50/700`…) em Fiscal/Financeiro/Incomes/Invoices/Frota | Fora da auditoria de tema escuro | Tokens semânticos / `Alert`; rodar o script de contraste | P |

### 3.2 Administrativo (compras, estoque, fábrica, folha)

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Cotações (na solicitação) | `Administrativo/Solicitacao/RequestQuotationTab.tsx` | Comparação só por download de xlsx; 6 diálogos na aba | **Matriz itens × fornecedores** na tela, menor preço destacado, escolha na célula | G |
| A | Cadeia de compras | `Solicitacao/CreateOrUpdateSolicitacao.tsx` e telas ligadas | Nenhum indicador de etapa; 11 status em bolinha; histórico só na aba 4 | Barra de processo (§2) com tempo (`elapsed_label` já vem da API); histórico em linha do tempo | M |
| A | Autorização | `Autorizacao/AutorizarSolicitacao.tsx` (671) | 7 blocos empilhados, 4 diálogos; sem resumo de valor/economia; sem lote | `SummaryPanel` fixo junto da decisão; `BulkActionBar` na lista para casos simples | G |
| A | Itens da solicitação | `Solicitacao/RequestItemRow.tsx` (538) | Até 14 campos por item, mudam por tipo | Só campos do tipo; "mais detalhes"; `RepeaterList`; total no rodapé | M |
| A | Entrada de insumos | `EntradaInsumos/EntradaInsumosItemsTab.tsx` (758) | ~13 campos por item; sem link para a origem | Linha compacta + painel expansível; defaults do cabeçalho; link para solicitação/recebimento | G |
| A | Recebimentos | `Recebimentos/ConfirmarRecebimentoPage.tsx` | Sem conferência pedido × recebido; fluxo em 3 telas | Tabela Pedido \| Recebido \| Diferença; "receber tudo"; sugerir próxima etapa | M |
| A | Fábrica — batida | `Fabrica/FoodBeat/CreateOrUpdateFoodBeat.tsx` (850) | 13 campos num grid com condicionais; edição só da data mostra tudo travado | Seções; campos por tipo; na edição, resumo de leitura + data em destaque | M |
| A | Meus processos | `MeusProcessos/index.tsx` | Até 16 ações no menu; sem busca nem filtro | Filas por etapa (`QueueTabs`); 1 ação primária por linha; `ListToolbar` | M |
| M | Apuração (proventos) | `Earning/CreateOrUpdateEarning.tsx` (777) | ~15 campos + eventos; total calculado sem resumo | `SummaryPanel` (proventos, descontos, adiantamento, a pagar) | M |
| M | Adiantamento | `Adiantamento/FinancialBlock.tsx` (392) | Bloco financeiro com 3 listas abre tudo junto | `ToggleRow` + seção colapsável; `RemainingBalance` | M |
| M | Transferência entre fazendas | `FarmTransfer/CreateFarmTransfer.tsx` | 9 campos (4 só leitura) + itens + financeiro | Wizard Origem/Destino → Itens → Financeiro; resumo final | G |
| M | Devolução | `Devolucao/` | 2 modais de importação; sem link para origem; lista antiga | Assistente de importação; link de origem; `PageHeader`/`ListToolbar` | M |
| M | Funcionário × eventos | `FuncionarioXEventos/MatrizVinculosFuncionario.tsx` (849) | Salva a matriz inteira sem mostrar o que mudou | Resumo "adicionados/alterados/removidos" antes de salvar | M |
| M | Transferência entre armazéns | `WarehouseTransfer/UpdateWarehouseTransfer.tsx` | Mesma tela para ver e editar | Detalhe separado; resumo origem → destino | M |
| M | Baixa / Correção de estoque | `BaixaEstoque/CreateBaixaEstoque.tsx` | **Trocar o armazém apaga os itens digitados sem aviso** | Confirmar a troca; resumo do impacto no saldo | P |
| M | Listas antigas | `Devolucao`, `Earning`, `FarmTransfer`, `WarehouseTransfer`, `Requisition`, `SystemLogs` | Sem `PageHeader`; 16 de 28 sem `ListToolbar` | Migração em lote | M |
| B | SLA | `Sla/index.tsx` | 11 linhas soltas, sem relação com a cadeia | Mostrar como sequência; salvar tudo de uma vez | P |
| B | Rejeitados | `Rejeitados/index.tsx` | Sem "corrigir e reenviar" | Ação com motivo da rejeição em destaque | P |
| B | Textos com fallback em PT | 16 ocorrências `|| 'Cancelar'` etc. | i18n incompleto | Remover fallback; chave nos 3 idiomas | P |

### 3.3 Operacional — Pecuária (manejo e reprodução)

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Pesagem | `Operacional/Pesagem/WeighingAnimalRow.tsx` (484) | 1 cartão de 9 controles por animal; sem "carregar lote"; sem resumo | Tabela editável (animal, peso anterior, atual, GMD); carregar lote; Enter avança; resumo | G |
| A | Marcação | `Marcacao/` (5 telas, 4 variantes) | Ciclo prever → realizar espalhado; usuário precisa saber qual tela abrir | Fluxo único com etapas; Individual/Lote em `SegmentedControl`; ação principal fora do menu | G |
| A | Transferência ABC | `TransferAbcBatch/CreateTransferAbcBatch.tsx` (741) | 24 campos + 3 listas + financeiro numa tela | Wizard (tipo → animais → financeiro opcional → revisão) | G |
| A | Transf. animal/lote entre fazendas | `AnimalFazenda/TransferAnimalFarm/`, `LoteFazenda/TransferBatchFarms/` | ~3 mil linhas de bloco financeiro duplicado; modais sobre o form | Bloco financeiro único; mesmo wizard da ABC; prévia de elegíveis nos dois | G |
| A | Rastreabilidade | `Rastreabilidade/Traceability/CreateOrUpdateTraceability.tsx` (1.067) | 41 campos; 16 nutricionais obrigatórios sem agrupamento | Etapas; tabela nutricional compacta; copiar de cadastro existente | M |
| A | Acasalamento / IATF | `Reproducao/Acasalamento/` | 17 campos + 3 modos condicionais; linha de ~9 controles por animal | Escolher o tipo antes (`ChoiceCardGroup`); tabela com "aplicar a todos" | G |
| M | Diagnóstico de gestação | `Reproducao/Acasalamento/DiagnosticoGestacao/` | Bom "preenchimento em lote", mas gera cartão de 16 campos por animal; sem desfazer | Resumo compacto por animal; barra de lote fixa; desfazer aplicação | M |
| M | Sanitário | `Sanitario/CreateSanitariesMultipleDialog.tsx` | Criar em lote não deixa ver/remover animais; sem consumo total | Página com tabela de animais + `SummaryPanel` (animais × dose); estoque na linha | M |
| M | Nascimentos | `Nascimentos/CreateOrUpdateBirthAnimal.tsx` (812) | 19 campos sem seções; gêmeos = recomeçar | Seções; "salvar e cadastrar outro" mantendo mãe/data; defaults da mãe | M |
| M | Protocolo / estação | `Reproducao/ProtocoloEstacao/` | Linha do tempo (boa) só no fim | Prévia lateral fixa; duplicar item/protocolo | M |
| M | Mortes e Perdas | `DeathAnimals/`, `Perdas/` | 1 animal por cadastro | Multi-animal com motivo comum ou "salvar e cadastrar outro" | M |
| M | Localizar animal | `FindAnimal/index.tsx` | Busca separada do dossiê | Campo grande com autofoco; atalhos Pesar/Vacinar/Registrar morte | M |
| M | Gestão de animais | `GestaoAnimais` → `CadastrosBase/Rebanho/AnimalListScreen.tsx` | Ponto natural para ações em massa | `BulkActionBar`: Pesar, Sanitário, Transferir lote, Morte (pré-preenchendo) | M |
| B | Telas de detalhe | `Pesagem/WeighingDetalhe.tsx`, `Nascimentos/BirthAnimalDetalhe.tsx`… | 300–400 linhas cada, sem padrão | Layout de detalhe (§2) | M |

### 3.4 Operacional — Confinamento, Agrícola e Ordens de Serviço

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Apontamentos | `Operacional/Appropriations/CreateOrUpdateAppropriation.tsx` (821 + ~3 mil em abas) | 6 abas (~80 controles); 5 botões no rodapé; Finalizar sai do form e pode perder dados | Seções com pendência; `SummaryPanel`; barra de processo; 1 ação primária; prévia | G |
| A | Planejamento | `Planejamentos/CreateOrUpdatePlanning.tsx` + `PlanningTree.tsx` | Árvore de 4 níveis com 8 diálogos; sem custo por nó; sem duplicar | Custo no cabeçalho de cada nó; duplicar cultivo/operação/atividade; painel lateral em vez de diálogos | G |
| A | Ordem de serviço | `ServiceOrders/ServiceOrderHeaderFields.tsx` (664) | 25 campos num bloco + 5 abas de itens | 4 seções (Identificação, Onde, Condições, Instruções); itens pré-carregados da atividade | M |
| A | Minhas OS (execução) | `MyServiceOrders/MyServiceOrderExecutionForm.tsx` (777) | Executor rola 6 seções de leitura até achar o que preencher; sem Iniciar/Concluir | Faixa de status + "Iniciar"/"Concluir" no topo; contexto recolhido | M |
| A | Avaliação de OS | `RatingServiceOrders/RatingServiceOrderForm.tsx` (534) | ~30 campos de leitura antes de 4 campos de avaliação | Avaliação no topo; nota por estrelas/`SegmentedControl`; detalhe recolhido | P |
| A | Pastagem | `Pastagem/CreateOrUpdatePastagem.tsx` | 6 abas, 5 listas num único envio; erro só ao salvar | Seções com contador; sub-cadastros recolhidos; custo por categoria | M |
| A | Carregamento | `Carregamento/CreateOrUpdateCharge.tsx` + `ChargeItemRow.tsx` (523) | ~22 campos por item; Finalizar e Gerar romaneio fora do form; finalizado segue editável | Barra de processo; linha compacta; aviso ao editar finalizado | G |
| A | Processamento | `Processamentos/FinishProcessing.tsx` (687) | Wizard animal a animal (~12 campos cada) | Lista com status; aplicar a todos; validar por animal; progresso fixo | G |
| A | Curral | `FeedlotCorrals/CreateOrUpdateFeedlotCorral.tsx` | Wizard feito com abas; **salvamento parcial** só avisa por toast | `StepIndicator`/`StepBody`; revisão final; painel "o que foi salvo / tentar de novo" | M |
| M | Nutrição (trato) | `Nutrition/NutritionItemsEditor.tsx` (703) | Trato digitado linha a linha, 3 cascatas | "Lançar trato por curral" com dieta e quantidade padrão; duplicar linha; total | G |
| M | Dieta | `Diet/CreateOrUpdateDiet.tsx` | Soma ≠ 100% só trava o Salvar, sem dizer quanto falta | `RemainingBalance` ("faltam X%"); custo por kg ao vivo | M |
| M | Orçamento | `Budget/CreateOrUpdateBudget.tsx` | Itens × pagamentos sem conferência visível | `RemainingBalance`; etapas Itens → Pagamentos → Revisão | M |
| M | Fechamento de semana | `FechamentoSemana/CreateClosingWeek.tsx` | Salva sem confirmação de impacto nem aviso de sobreposição | Confirmação com período, grupos, preço médio; erro com "tentar de novo" | P |
| M | Colheita de frutas | `HarvestProduct/CreateOrUpdateHarvestProduct.tsx` | 12–14 campos sem seção | Seções; total de caixas/peso; data de hoje como padrão | P |
| M | Chuvas | `Rainfalls/` | Uso diário, uma leitura por vez | Lançamento rápido de várias leituras; última área como padrão | P |
| M | Erro de carga nos forms de edição | Apontamentos, Carregamento, Pastagem, OS, Nutrição, Dieta | Sem estado de erro ao carregar | Padrão "Tentar novamente / Voltar" (copiar da árvore do Planejamento) | P |

### 3.5 Operacional — Comercial e Logística

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Venda de animais | `Operacional/VendaAnimais/CreateOrUpdateMovementSale.tsx` (1.139) | Página única: XML + 8 campos + itens + totais + parcelas + alocação; total no meio | Wizard Dados → Animais → Financeiro → Revisão; `ToggleRow` "Gerar financeiro"; `SummaryPanel` | G |
| A | Pesagem rodoviária — cadastro | `PesagemRodoviaria/CreateOrUpdateModuleWeighing.tsx` (992) | 17 campos condicionais; 6 modais de subcadastro | Tipo primeiro (`ChoiceCardGroup`) e só os campos dele; criação rápida no select | M |
| A | Pesagem rodoviária — balança | `PesagemRodoviaria/wizard/` | Sem revisão (bruto, tara, descontos, líquido) antes de finalizar; 2 telas de finalizar duplicadas | `StepIndicator`; `SummaryPanel` ao vivo; etapa "Revisão"; unificar finalização | M |
| A | Compra de animais | `CompraAnimais/CreateOrUpdateMovementPurchase.tsx` (1.102) | Impacto no caixa só no fim | Mesmo wizard da venda; `RemainingBalance` nas parcelas | G |
| A | Pedido → Venda | `Pedidos/GerarVendaFromOrder.tsx` (859) | Não deixa claro o que será gerado | 3 passos (conferir → ajustar → resumo do que será gerado); link para a venda criada | M |
| A | Pedido | `Pedidos/dialogs/InlineProductModal.tsx` (1.011) | Cadastro completo de produto em modal dentro do pedido | Criação rápida de 4–5 campos + "completar depois" | M |
| M | Romaneio | `Romaneios/CreateOrUpdateRomaneio.tsx` (1.026) | 16 campos no cabeçalho; itens (11) e despesas (9) em abas; 9 `@ts-ignore` | Etapas ou seções; total fixo | G |
| M | Contrato de venda | `ContratosVenda/CreateOrUpdateContratoVenda.tsx` (916) | Cálculo ao vivo existe, mas misturado aos campos | Seções; cálculo vira `SummaryPanel` lateral | M |
| M | Venda (nota) + adiantamentos | `Vendas/` (~2 mil l. em peças) | Sem resumo antes de emitir a NF-e | Resumo pré-emissão com adiantamentos abatidos e saldo | M |
| M | Status nas listas | `VendaAnimais/index.tsx`, `Romaneios/index.tsx` | `Badge` cru com 2 cores × `StatusTag` nas vizinhas | `StatusTag` + próxima ação no menu da linha | P |
| M | Listas antigas | `Romaneios`, `PesagemRodoviaria`, `DiscountTable`, `ChargeBill*` | Sem `ListToolbar`; Romaneios só busca por número | `PageHeader` + `ListToolbar` com busca textual | P |
| M | Editores de rateio/parcelas | 4 editores (~450–560 l. cada) | Cada um com layout e cálculo próprios | `RepeaterList` + `RemainingBalance` padrão; "ratear igualmente" | M |
| B | Tabela de descontos | `DiscountTable/CreateOrUpdateDiscountTable.tsx` | Sem simular o efeito da regra | Mini-simulador ("16% de umidade = –X kg/t") | P |
| B | Cobranças despesa/receita | `ChargeBillExpenses/`, `ChargeBillIncomes/` | Dois forms quase idênticos | Form base compartilhado | P |

### 3.6 Cadastros Base

| Pri. | Tela | Arquivo | Problema | Melhoria | Esf. |
|---|---|---|---|---|---|
| A | Natureza de operação | `CadastrosBase/NaturezaOperacao/CreateOrUpdateNaturezaOperacao.tsx` (1.562) | ~47 campos (13 gerais + 16 fiscais + 18 Reforma Tributária); 5 dicas para dezenas de siglas | Etapas Geral → CFOPs → Fiscal → Reforma (só se "sobrescrever produto"); glossário | G |
| A | Regras fiscais | `BaseRegistrations/TaxRules/CreateOrUpdateTaxRules.tsx` (1.181) | ~33 campos; vínculo com Natureza invisível | Seção por tributo; campos pelo regime (CST × CSOSN); mostrar "regra aplicada" na Natureza | M |
| A | Rebanho — animal | `Rebanho/CreateOrUpdateAnimal.tsx` (1.972, o maior form) | ~22 campos + identificações, sem seções | `FormSection`; reprodução e depreciação em "mais opções"; defaults do lote | M |
| A | Rebanho — lista | `Rebanho/AnimalListScreen.tsx` | Busca no drawer; sem estado vazio | `ListToolbar`; vazio com "Importar / Novo animal" | M |
| A | Importações (Inventário, Rebanho, Estoque inicial) | `*ImportModal.tsx` | 3 comportamentos diferentes (422 tudo-ou-nada × erros no 200) | Assistente de importação (§2) | G |
| A | Perfis e permissões | `Perfil/PermissionTreeSelector.tsx` | Árvore boa; falta clonar e resumir | "Copiar de outro perfil"; resumo fixo ("42 permissões em 6 módulos"); filtro "só marcadas" | M |
| M | Emissores / certificado A1 | `Emissores/CreateOrUpdateEmissor.tsx` (976), `CertificadoEmissor.tsx` | Vencimento do certificado só dentro da tela de certificado | Seções; ⚠ `StatusTag` "vence em N dias" na lista; alerta de vencimento | M |
| M | Funcionários | `Funcionarios/CreateOrUpdateFuncionario.tsx` (1.346) | 18 campos; coexiste com o papel Funcionário do wizard de Pessoas | Seções + `ToggleRow`; decidir se vira atalho do wizard de Pessoas | M |
| M | Fornecedores / Clientes | `Fornecedores/ProviderFormFields.tsx`, `Clientes/ClientFormFields.tsx` | Filiais e Vendedores em abas | Seções opcionais (`RepeaterList`); reaproveitar fluxo de Pessoas | M |
| M | Inventário (bens) | `Inventario/CreateOrUpdateEquipamento.tsx` (1.061) | 5 abas + Voltar/Próximo; aba Fiscal/Veículo (20 campos) aparece mesmo sem uso fiscal | Wizard real ou seções; esconder a aba fiscal; depreciação/rateio em "avançado" | M |
| M | Áreas (mapa) | `Areas/CreateOrUpdateArea.tsx` + `AreaMapEditor.tsx` | Editor de mapa copiado de Fazendas | Componente de mapa compartilhado; mapa em destaque + seções | M |
| M | Depreciação | `Depreciacao/GerarDepreciacaoModal.tsx` | Gera sem prévia; erro em toast cru | Prévia ("N bens, R$ X"); validação no campo | M |
| M | Estoque / Saldo inicial | `EstoqueInicial/`, `SaldoInicial/` | Saldo inicial sem importação; rateio sem conferência | Importação nos dois; `RemainingBalance`; guia "Primeiros passos" | M |
| M | Contas bancárias | `ContasBancarias/CreateOrUpdateContaBancaria.tsx` (856) | 11 campos, sem seções | Seções; `ToggleRow` para boleto | P |
| M | Parâmetros do tenant | `BaseRegistrations/TenantParameters/index.tsx` | Sem `PageHeader`; Sim/Não em select | `PageHeader` + `FormSection` + `ToggleRow` | P |
| B | ~35 cadastros auxiliares | `Racas`, `Especies`, `Embalagens`, `Vacinas`, `Bancos`… | Página inteira para ≤ 3 campos | Drawer de edição rápida (§2) | G (volume) |

---

## 4. Sugestão de ondas

| Onda | Conteúdo | Por quê primeiro |
|---|---|---|
| **6 — Fundação** | Componentes novos do §2 (barra de processo, assistente de importação, tabela editável compacta) + regras T1, T7 e T9 no kit (`SummaryPanel` obrigatório em form com valor; `ToggleRow` no lugar de Sim/Não; guard por padrão no `FormContainer`) | Destrava todas as outras ondas e propaga sozinho (Lei 2) |
| **7 — Financeiro e Fiscal** | Contas a pagar/receber, Notas de entrada, painel de emissão NF-e/CT-e/MDF-e | Maior volume diário e risco de erro com dinheiro/SEFAZ |
| **8 — Campo (pecuária)** | Pesagem, Sanitário, Processamento, Mortes/Perdas, ações em massa na Gestão de Animais | Ganho de tempo por lote é o maior do sistema |
| **9 — Compras** | Cadeia completa com barra de processo, matriz de cotação, autorização em lote, conferência no recebimento | Fluxo multiusuário; hoje ninguém vê a etapa |
| **10 — Comercial e Agrícola** | Venda/Compra de animais, Pedido → Venda, Pesagem rodoviária, Apontamentos, Carregamento, OS | Fluxos de status com ações espalhadas |
| **Contínua** | Migração de listagens (`ListToolbar`, `StatusTag`), cadastros auxiliares em drawer, glossário fiscal, cores fixas | Mecânico; pode andar em paralelo |

## 5. Limites desta varredura

- Análise principalmente por **código**; captura visual só de 15 formulários (vazios, sem dados). Comportamento com dados reais e no celular não foi testado.
- "Não encontrado" significa não encontrado nos arquivos lidos — itens assim foram omitidos, não listados.
- Descartado após verificação: o botão flutuante no canto inferior direito que cobre o "Salvar" é o **painel de desenvolvimento do TanStack Query** (só existe em `yarn dev`), não um problema do produto.
