# Mapa de mudanças desde o baseline (gerado)

> **Gerado por `scripts/ux-docs/gen-change-map.mjs`** — não edite à mão; rode o script.
> Baseline: tag `ux-baseline` (`a61fdffc20`) · HEAD: `29e44c5` · 882 arquivos alterados.
> Para ver qualquer mudança: `git diff ux-baseline HEAD -- <arquivo>`. Guia de aplicação: [PORTING.md](PORTING.md).

## 1. Diff por área
| Área | Novos | Alterados | Removidos |
|---|---:|---:|---:|
| `src/pages/Operacional` | 0 | 197 | 1 |
| `src/pages/CadastrosBase` | 0 | 171 | 1 |
| `src/pages/BaseRegistrations` | 0 | 137 | 0 |
| `src/pages/Administrativo` | 0 | 87 | 1 |
| `src/components/ui` | 38 | 3 | 0 |
| `src/constants` | 3 | 33 | 0 |
| `src/pages/Fiscal` | 0 | 34 | 0 |
| `src/pages/Financeiro` | 0 | 27 | 0 |
| `docs/ux` | 20 | 0 | 0 |
| `src/@types` | 1 | 13 | 0 |
| `scripts/dev-db` | 13 | 0 | 0 |
| `src/pages/Frota` | 0 | 12 | 0 |
| `src/mocks` | 11 | 0 | 0 |
| `src/components/(raiz)` | 0 | 8 | 0 |
| `src/pages/Planos` | 5 | 3 | 0 |
| `src/pages/Configuracoes` | 0 | 6 | 0 |
| `src/pages/Onboarding` | 6 | 0 | 0 |
| `src/styles` | 0 | 6 | 0 |
| `src/pages/Integracoes` | 0 | 5 | 0 |
| `src/pages/Invoices` | 0 | 5 | 0 |
| `src/components/Form` | 0 | 4 | 0 |
| `src/services` | 1 | 3 | 0 |
| `src/components/Layout` | 0 | 3 | 0 |
| `src/pages/Incomes` | 0 | 3 | 0 |
| `scripts/dev-mocks` | 2 | 0 | 0 |
| `src/components/Header` | 0 | 2 | 0 |
| `src/pages/Login` | 1 | 1 | 0 |
| `.env.example` | 0 | 1 | 0 |
| `.gitignore` | 0 | 1 | 0 |
| `CLAUDE.md` | 1 | 0 | 0 |
| `chakra.config.ts` | 0 | 1 | 0 |
| `package.json` | 0 | 1 | 0 |
| `scripts/ux-docs` | 1 | 0 | 0 |
| `src/components/MovementAllocationEditor` | 0 | 1 | 0 |
| `src/config` | 0 | 1 | 0 |
| `src/design` | 1 | 0 | 0 |
| `src/hooks` | 1 | 0 | 0 |
| `src/pages/Dashboards` | 0 | 1 | 0 |
| `src/pages/Home` | 0 | 1 | 0 |
| `src/router` | 0 | 1 | 0 |
| `wrangler.jsonc` | 1 | 0 | 0 |
| `yarn.lock` | 0 | 1 | 0 |

### Arquivos novos em `src/`
- `src/@types/language/module-subscription/index.ts`
- `src/components/ui/Badge.tsx`
- `src/components/ui/BandSlider.tsx`
- `src/components/ui/BreadcrumbTrail.tsx`
- `src/components/ui/BulkActionBar.tsx`
- `src/components/ui/CheckOptionRow.tsx`
- `src/components/ui/ChoiceCardGroup.tsx`
- `src/components/ui/ConfidenceMeter.tsx`
- `src/components/ui/DashedActionButton.tsx`
- `src/components/ui/FormSurface.tsx`
- `src/components/ui/GiaTierCard.tsx`
- `src/components/ui/Icon.tsx`
- `src/components/ui/ImageEditorDialog.tsx`
- `src/components/ui/ListToolbar.tsx`
- `src/components/ui/MatchCandidateCard.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/PlanCompareStrip.tsx`
- `src/components/ui/PlanOptionCard.tsx`
- `src/components/ui/PlanTierCard.tsx`
- `src/components/ui/ProgressRing.tsx`
- `src/components/ui/QuantityStepper.tsx`
- `src/components/ui/QueueTabs.tsx`
- `src/components/ui/ReconciliationDetailPanel.tsx`
- `src/components/ui/ReconciliationRow.tsx`
- `src/components/ui/ReconciliationSummary.tsx`
- `src/components/ui/ReconciliationWorkspace.tsx`
- `src/components/ui/RemainingBalance.tsx`
- `src/components/ui/RepeaterList.tsx`
- `src/components/ui/SegmentedControl.tsx`
- `src/components/ui/SimpleTable.tsx`
- `src/components/ui/StatusTag.tsx`
- `src/components/ui/StepBody.tsx`
- `src/components/ui/StepFooter.tsx`
- `src/components/ui/StepHeader.tsx`
- `src/components/ui/StepIndicator.tsx`
- `src/components/ui/SummaryPanel.tsx`
- `src/components/ui/ToggleCard.tsx`
- `src/components/ui/ToggleRow.tsx`
- `src/components/ui/listControl.ts`
- `src/constants/languages/languageEnUs/languageSubscription.ts`
- `src/constants/languages/languageEsEs/languageSubscription.ts`
- `src/constants/languages/languagePtBr/languageSubscription.ts`
- `src/design/icons.ts`
- `src/hooks/useListSearch.ts`
- `src/mocks/dev-api/data/reference/banks.json`
- `src/mocks/dev-api/data/reference/breeds.json`
- `src/mocks/dev-api/data/reference/cities.json`
- `src/mocks/dev-api/data/reference/countries.json`
- `src/mocks/dev-api/data/reference/states.json`
- `src/mocks/dev-api/generated/schemas.json`
- `src/mocks/dev-api/handlers/farms.ts`
- `src/mocks/dev-api/handlers/reference.ts`
- `src/mocks/dev-api/index.ts`
- `src/mocks/dev-api/synthetic.test.ts`
- `src/mocks/dev-api/synthetic.ts`
- `src/pages/Login/slides.ts`
- `src/pages/Onboarding/index.tsx`
- `src/pages/Onboarding/steps/StepAccount.tsx`
- `src/pages/Onboarding/steps/StepContractor.tsx`
- `src/pages/Onboarding/steps/StepDone.tsx`
- `src/pages/Onboarding/steps/StepPayment.tsx`
- `src/pages/Onboarding/types.ts`
- `src/pages/Planos/Contratacao/catalog.ts`
- `src/pages/Planos/Contratacao/index.tsx`
- `src/pages/Planos/Contratacao/order.ts`
- `src/pages/Planos/Contratacao/pricing.test.ts`
- `src/pages/Planos/Contratacao/pricing.ts`
- `src/services/v2/Auth/dev-auth-bypass.ts`

## 2. Kit de componentes (onde cada um é usado)
Ordenado por nº de consumidores. Antes de criar componente novo, procure aqui (Lei: kit primeiro).

| Componente | Arquivo | Para quê | Consumidores |
|---|---|---|---:|
| `toaster` | `src/components/ui/toaster.tsx` |  | 450 |
| `PageHeader` | `src/components/ui/PageHeader.tsx` | Título de página (DS `PageHeader`): título 24px em negrito, contador opcional em pílula e | 168 |
| `ButtonFilter` | `src/components/ButtonFilter.tsx` | Botão "Filtros" das listagens (DS `FilterButton`): borda 1.5px; com filtros ativos vira verde | 96 |
| `ListToolbar` | `src/components/ui/ListToolbar.tsx` | Barra das listagens (DS `ListToolbar`): busca inline + botão "Filtros" na mesma linha. | 80 |
| `switch` | `src/components/ui/switch.tsx` |  | 38 |
| `StatusTag` | `src/components/ui/StatusTag.tsx` | Tag de SITUAÇÃO para a própria linha da tabela: pílula com o fundo na cor da situação e o texto | 28 |
| `checkbox` | `src/components/ui/checkbox.tsx` |  | 23 |
| `tooltip` | `src/components/ui/tooltip.tsx` |  | 14 |
| `FormSection` | `src/components/FormSection/index.tsx` | Adaptação Chakra v3 (não cópia) do `FormSection` do design system `cerne` | 10 |
| `Icon` | `src/components/ui/Icon.tsx` | Ícone do sistema — porte fiel de `Icon.tsx` do design system `cerne`. Única forma de | 9 |
| `StepBody` | `src/components/ui/StepBody.tsx` | Corpo de uma etapa de wizard (DS): conteúdo centralizado, largura máxima 760px. | 6 |
| `ToggleRow` | `src/components/ui/ToggleRow.tsx` | Campo booleano em linha (DS `ToggleRow`): interruptor + rótulo e, opcional, ícone de ajuda com | 5 |
| `steps` | `src/components/ui/steps.tsx` | Wrapper sobre o `Steps` nativo do Chakra UI v3. RESKIN (execução 024, | 5 |
| `DashboardGrid` | `src/components/ui/DashboardGrid.tsx` | Casca canônica de Dashboards (Regra G do design system `cerne`, `GB.Cerne.UX` | 4 |
| `StepFooter` | `src/components/ui/StepFooter.tsx` | Rodapé padrão de formulário multi-etapas — porte fiel de `StepFooter.tsx` do | 4 |
| `StepHeader` | `src/components/ui/StepHeader.tsx` | Cabeçalho de etapa de wizard — porte fiel de `StepHeader.tsx` do design system | 4 |
| `FormSurface` | `src/components/ui/FormSurface.tsx` | Superfície de formulário que pode ser MODAL (`dialog`, o `CustomDialog` de sempre) ou PAINEL | 3 |
| `PageCard` | `src/components/ui/PageCard.tsx` | Casca visual compartilhada (bg/shadow/radius + overflow hidden), fonte única | 3 |
| `RepeaterList` | `src/components/ui/RepeaterList.tsx` | Lista dinâmica (adicionar/remover linhas) — DS `RepeaterList`. A moldura (vazio tracejado, | 3 |
| `SegmentedControl` | `src/components/ui/SegmentedControl.tsx` | Controle segmentado (2–4 opções mutuamente exclusivas, uma sempre ativa). Ex.: Vincular a | 3 |
| `dialog` | `src/components/ui/dialog.tsx` |  | 3 |
| `radio` | `src/components/ui/radio.tsx` | Wrapper Chakra UI v3 para Radio/RadioGroup — mirror ESTRUTURAL de | 3 |
| `Badge` | `src/components/ui/Badge.tsx` | Selo de status/classificação — porte fiel de `Badge.tsx` do design system `cerne`: | 2 |
| `ImageEditorDialog` | `src/components/ui/ImageEditorDialog.tsx` | Modal "Editar imagem" (referência de UX do pedido): prévia quadrada do recorte, régua de escala, | 2 |
| `StepIndicator` | `src/components/ui/StepIndicator.tsx` | Indicador de etapas de configurador (estilo "simulador"): quadradinho numerado + rótulo, | 2 |
| `SummaryPanel` | `src/components/ui/SummaryPanel.tsx` | Painel de RESUMO escuro, fixo à direita de um configurador (modelo "simulador"): título com | 2 |
| `password-input` | `src/components/ui/password-input.tsx` |  | 2 |
| `BandSlider` | `src/components/ui/BandSlider.tsx` | Régua deslizante dividida em faixas iguais (ex.: faixas de tamanho da fazenda): valores dos | 1 |
| `BreadcrumbTrail` | `src/components/ui/BreadcrumbTrail.tsx` | Trilha de navegação — porte fiel de `Breadcrumb.tsx` do design system `cerne`: | 1 |
| `BulkActionBar` | `src/components/ui/BulkActionBar.tsx` | Barra de ações em lote (DS `BulkActionBar`): aparece quando há itens selecionados, mostra a | 1 |
| `CheckOptionRow` | `src/components/ui/CheckOptionRow.tsx` | Linha de opção com caixa de marcar: ícone, nome + descrição e valor em selo à direita. | 1 |
| `ChoiceCardGroup` | `src/components/ui/ChoiceCardGroup.tsx` | Grupo de cartões de escolha única (rádio): título, valor e descrição curta por opção. | 1 |
| `ConfidenceMeter` | `src/components/ui/ConfidenceMeter.tsx` | Medidor de confiança (0–100) por FAIXA: alta ≥90 (verde), média 60–89 (âmbar), baixa <60 | 1 |
| `DashedActionButton` | `src/components/ui/DashedActionButton.tsx` | Ação secundária em contorno tracejado, com seta à direita (ex.: "Copiar resumo da proposta →"), | 1 |
| `GiaTierCard` | `src/components/ui/GiaTierCard.tsx` | Cartão de um nível da GIA (assistente de IA): nome do nível e plano onde vem, métricas (janela de | 1 |
| `MatchCandidateCard` | `src/components/ui/MatchCandidateCard.tsx` | Cartão de candidato de conciliação: título + subtítulo, MOTIVOS do casamento (✓ atendido, | 1 |
| `PlanCompareStrip` | `src/components/ui/PlanCompareStrip.tsx` | Faixa de comparação rápida entre planos para a MESMA configuração: um botão por plano com o | 1 |
| `PlanOptionCard` | `src/components/ui/PlanOptionCard.tsx` | Cartão selecionável de plano (Pro / Deluxe / Enterprise): nome na cor do plano, | 1 |
| `PlanTierCard` | `src/components/ui/PlanTierCard.tsx` | Cartão de um plano na "escada" de planos (visão de resumo): faixa de cor no topo, nome e | 1 |
| `QuantityStepper` | `src/components/ui/QuantityStepper.tsx` | Seletor de quantidade: régua (opcional) e − [número] + (campo editável) na mesma linha. | 1 |
| `QueueTabs` | `src/components/ui/QueueTabs.tsx` | Abas de "fila de trabalho" com contador por aba (ex.: Para revisar 8 · Sugestões 3). | 1 |
| `ReconciliationDetailPanel` | `src/components/ui/ReconciliationDetailPanel.tsx` | Painel de detalhe da transação selecionada (lado direito do workspace): cabeçalho com | 1 |
| `ReconciliationRow` | `src/components/ui/ReconciliationRow.tsx` | Linha de transação bancária na fila de conciliação: ícone de direção (entrada/saída), | 1 |
| `ReconciliationSummary` | `src/components/ui/ReconciliationSummary.tsx` | Faixa de resumo da conciliação: indicadores em R$ (com dica) + anel de progresso. | 1 |
| `ReconciliationWorkspace` | `src/components/ui/ReconciliationWorkspace.tsx` | Casca mestre–detalhe da conciliação (evolução do `ReconciliationWorkspace` do DS, que | 1 |
| `RemainingBalance` | `src/components/ui/RemainingBalance.tsx` | Indicador "ao vivo" de saldo de uma divisão (rateio): mostra quanto já foi distribuído do | 1 |
| `SimpleTable` | `src/components/ui/SimpleTable.tsx` | Tabela de leitura (sem paginação/ordenação): cabeçalho em caixa-alta no padrão do DS, linhas com | 1 |
| `ToggleCard` | `src/components/ui/ToggleCard.tsx` | Cartão de seleção (DS `ToggleSection variant="card"`): ícone + caixa de marcar no topo, título e | 1 |
| `ProgressRing` | `src/components/ui/ProgressRing.tsx` | Anel de progresso (0–100) com o percentual no centro. Puro CSS (conic-gradient): | 0 |
| `provider` | `src/components/ui/provider.tsx` |  | 0 |
| `toaster-original-chakra` | `src/components/ui/toaster-original-chakra.tsx` |  | 0 |
| `Pagination` | `src/components/Pagination.tsx` | Paginação ligada à tabela (`useTable`). Visual fiel ao `Pagination.tsx` do design | 0 |
| `SelectPagination` | `src/components/SelectPagination.tsx` |  | 0 |

## 3. Tokens de tema novos (semânticos)
- `src/styles/theme/semantic/light.ts` — 25 tokens novos: `focusGlow`, `strongText`, `selectedBG`, `selectedText`, `selectedChipBG`, `planPro`, `planDeluxe`, `planEnterprise`, `onPlan`, `summaryLine`, `summaryLineStrong`, `summaryFill`, `summaryFillMid`, `summaryFillActive`, `summaryNoteBG`, `addonSoftBG`, `summaryBg`, `summaryAccent`, `summaryText`, `summaryMuted`, `summaryFaint`, `summaryIcon`, `summaryPositive`, `summaryAdded`, `addonText`
- `src/styles/theme/semantic/dark.ts` — 25 tokens novos: `focusGlow`, `strongText`, `selectedBG`, `selectedText`, `selectedChipBG`, `planPro`, `planDeluxe`, `planEnterprise`, `onPlan`, `summaryLine`, `summaryLineStrong`, `summaryFill`, `summaryFillMid`, `summaryFillActive`, `summaryNoteBG`, `addonSoftBG`, `summaryBg`, `summaryAccent`, `summaryText`, `summaryMuted`, `summaryFaint`, `summaryIcon`, `summaryPositive`, `summaryAdded`, `addonText`

## 4. Telas migradas por padrão
### PageHeader (título/descrição de listagem do DS)
168 telas.
  - `src/pages/Administrativo/Adiantamento/index.tsx`
  - `src/pages/Administrativo/AtividadesRecentes/index.tsx`
  - `src/pages/Administrativo/Autorizacao/index.tsx`
  - `src/pages/Administrativo/BaixaEstoque/index.tsx`
  - `src/pages/Administrativo/Compras/index.tsx`
  - `src/pages/Administrativo/CorrecaoEstoque/index.tsx`
  - `src/pages/Administrativo/Cotacoes/index.tsx`
  - `src/pages/Administrativo/Documentos/index.tsx`
  - `src/pages/Administrativo/EntradaInsumos/index.tsx`
  - `src/pages/Administrativo/Equipes/index.tsx`
  - `src/pages/Administrativo/Eventos/index.tsx`
  - `src/pages/Administrativo/Fabrica/index.tsx`
  - `src/pages/Administrativo/Faltas/index.tsx`
  - `src/pages/Administrativo/FuncionarioXEventos/index.tsx`
  - `src/pages/Administrativo/Funcoes/index.tsx`
  - `src/pages/Administrativo/MeusProcessos/index.tsx`
  - `src/pages/Administrativo/Recebimentos/index.tsx`
  - `src/pages/Administrativo/RegistroEventos/index.tsx`
  - `src/pages/Administrativo/Rejeitados/index.tsx`
  - `src/pages/Administrativo/SaldoEstoque/index.tsx`
  - `src/pages/Administrativo/Sla/index.tsx`
  - `src/pages/Administrativo/Solicitacao/index.tsx`
  - `src/pages/BaseRegistrations/AccountingGroupers/index.tsx`
  - `src/pages/BaseRegistrations/AdditionalInfo/index.tsx`
  - `src/pages/BaseRegistrations/Addressing/index.tsx`
  - `src/pages/BaseRegistrations/Apportionments/index.tsx`
  - `src/pages/BaseRegistrations/Banks/index.tsx`
  - `src/pages/BaseRegistrations/BatchAreas/index.tsx`
  - `src/pages/BaseRegistrations/BatchGrazings/index.tsx`
  - `src/pages/BaseRegistrations/BirthNotes/index.tsx`
  - `src/pages/BaseRegistrations/BodyScores/index.tsx`
  - `src/pages/BaseRegistrations/CategoryTypes/index.tsx`
  - `src/pages/BaseRegistrations/Contratantes/index.tsx`
  - `src/pages/BaseRegistrations/Cultivation/index.tsx`
  - `src/pages/BaseRegistrations/DiagnosisPregnancy/index.tsx`
  - `src/pages/BaseRegistrations/DiagnosticTechniques/index.tsx`
  - `src/pages/BaseRegistrations/DocumentTypes/index.tsx`
  - `src/pages/BaseRegistrations/DrinkingFountains/index.tsx`
  - `src/pages/BaseRegistrations/FamilyEquipments/index.tsx`
  - `src/pages/BaseRegistrations/Fodders/index.tsx`
  - `src/pages/BaseRegistrations/Grazings/index.tsx`
  - `src/pages/BaseRegistrations/Groupers/index.tsx`
  - `src/pages/BaseRegistrations/Headbands/index.tsx`
  - `src/pages/BaseRegistrations/Ibpts/index.tsx`
  - `src/pages/BaseRegistrations/IdentificationTypes/index.tsx`
  - `src/pages/BaseRegistrations/Indexers/index.tsx`
  - `src/pages/BaseRegistrations/IssueDfeSyncTimes/index.tsx`
  - `src/pages/BaseRegistrations/LowReasons/index.tsx`
  - `src/pages/BaseRegistrations/Markers/index.tsx`
  - `src/pages/BaseRegistrations/Measurements/index.tsx`
  - `src/pages/BaseRegistrations/NfseRecebidas/index.tsx`
  - `src/pages/BaseRegistrations/ParameterWeights/index.tsx`
  - `src/pages/BaseRegistrations/Parameters/index.tsx`
  - `src/pages/BaseRegistrations/PaymentTerms/index.tsx`
  - `src/pages/BaseRegistrations/Permissions/index.tsx`
  - `src/pages/BaseRegistrations/ProductGroups/index.tsx`
  - `src/pages/BaseRegistrations/ReversalExpenses/index.tsx`
  - `src/pages/BaseRegistrations/ServiceExpenses/index.tsx`
  - `src/pages/BaseRegistrations/SystemUpdates/index.tsx`
  - `src/pages/BaseRegistrations/TaxRules/index.tsx`
  - … (+108; use `git grep -l "from '@/components/ui/PageHeader'" src/pages`)

### ListToolbar (busca inline + Filtros)
80 telas.
  - `src/pages/Administrativo/Autorizacao/index.tsx`
  - `src/pages/Administrativo/Compras/index.tsx`
  - `src/pages/Administrativo/Cotacoes/index.tsx`
  - `src/pages/Administrativo/Equipes/index.tsx`
  - `src/pages/Administrativo/Eventos/index.tsx`
  - `src/pages/Administrativo/Fabrica/index.tsx`
  - `src/pages/Administrativo/FuncionarioXEventos/index.tsx`
  - `src/pages/Administrativo/Funcoes/index.tsx`
  - `src/pages/Administrativo/Recebimentos/index.tsx`
  - `src/pages/Administrativo/Rejeitados/index.tsx`
  - `src/pages/Administrativo/SaldoEstoque/index.tsx`
  - `src/pages/Administrativo/Solicitacao/index.tsx`
  - `src/pages/BaseRegistrations/AdditionalInfo/index.tsx`
  - `src/pages/BaseRegistrations/Apportionments/index.tsx`
  - `src/pages/BaseRegistrations/Banks/index.tsx`
  - `src/pages/BaseRegistrations/BirthNotes/index.tsx`
  - `src/pages/BaseRegistrations/BodyScores/index.tsx`
  - `src/pages/BaseRegistrations/CategoryTypes/index.tsx`
  - `src/pages/BaseRegistrations/Contratantes/index.tsx`
  - `src/pages/BaseRegistrations/DiagnosisPregnancy/index.tsx`
  - `src/pages/BaseRegistrations/DiagnosticTechniques/index.tsx`
  - `src/pages/BaseRegistrations/DrinkingFountains/index.tsx`
  - `src/pages/BaseRegistrations/FamilyEquipments/index.tsx`
  - `src/pages/BaseRegistrations/Groupers/index.tsx`
  - `src/pages/BaseRegistrations/Indexers/index.tsx`
  - `src/pages/BaseRegistrations/LowReasons/index.tsx`
  - `src/pages/BaseRegistrations/Markers/index.tsx`
  - `src/pages/BaseRegistrations/Measurements/index.tsx`
  - `src/pages/BaseRegistrations/NfseRecebidas/index.tsx`
  - `src/pages/BaseRegistrations/ParameterWeights/index.tsx`
  - `src/pages/BaseRegistrations/PaymentTerms/index.tsx`
  - `src/pages/BaseRegistrations/ProductGroups/index.tsx`
  - `src/pages/BaseRegistrations/ReversalExpenses/index.tsx`
  - `src/pages/BaseRegistrations/ServiceExpenses/index.tsx`
  - `src/pages/BaseRegistrations/TaxRules/index.tsx`
  - `src/pages/BaseRegistrations/Troughs/index.tsx`
  - `src/pages/BaseRegistrations/TypeTitles/index.tsx`
  - `src/pages/BaseRegistrations/Warehouses/index.tsx`
  - `src/pages/CadastrosBase/Afiliados/index.tsx`
  - `src/pages/CadastrosBase/Atividades/index.tsx`
  - `src/pages/CadastrosBase/Autorizadores/index.tsx`
  - `src/pages/CadastrosBase/Batches/index.tsx`
  - `src/pages/CadastrosBase/Categorias/index.tsx`
  - `src/pages/CadastrosBase/CategoriasAnimais/index.tsx`
  - `src/pages/CadastrosBase/CategoriasProduto/index.tsx`
  - `src/pages/CadastrosBase/CentroCusto/index.tsx`
  - `src/pages/CadastrosBase/Cidades/index.tsx`
  - `src/pages/CadastrosBase/Clientes/index.tsx`
  - `src/pages/CadastrosBase/Contador/index.tsx`
  - `src/pages/CadastrosBase/ContasBancarias/index.tsx`
  - `src/pages/CadastrosBase/Embalagens/index.tsx`
  - `src/pages/CadastrosBase/Emissores/index.tsx`
  - `src/pages/CadastrosBase/Especies/index.tsx`
  - `src/pages/CadastrosBase/EstagioReprodutivo/index.tsx`
  - `src/pages/CadastrosBase/EstoqueInicial/index.tsx`
  - `src/pages/CadastrosBase/Fazendas/index.tsx`
  - `src/pages/CadastrosBase/Fornecedores/index.tsx`
  - `src/pages/CadastrosBase/Funcionarios/index.tsx`
  - `src/pages/CadastrosBase/Inventario/index.tsx`
  - `src/pages/CadastrosBase/NaturezaOperacao/index.tsx`
  - … (+20; use `git grep -l "from '@/components/ui/ListToolbar'" src/pages`)

### ButtonFilter (botão Filtros do DS)
92 telas.
  - `src/pages/Administrativo/Adiantamento/index.tsx`
  - `src/pages/Administrativo/AtividadesRecentes/HeaderTable.tsx`
  - `src/pages/Administrativo/BaixaEstoque/HeaderTable.tsx`
  - `src/pages/Administrativo/CorrecaoEstoque/HeaderTable.tsx`
  - `src/pages/Administrativo/Devolucao/index.tsx`
  - `src/pages/Administrativo/Documentos/HeaderTable.tsx`
  - `src/pages/Administrativo/Earning/index.tsx`
  - `src/pages/Administrativo/EntradaInsumos/index.tsx`
  - `src/pages/Administrativo/Fabrica/FoodBeat/index.tsx`
  - `src/pages/Administrativo/Faltas/HeaderTable.tsx`
  - `src/pages/Administrativo/FarmTransfer/index.tsx`
  - `src/pages/Administrativo/Requisition/index.tsx`
  - `src/pages/Administrativo/WarehouseTransfer/index.tsx`
  - `src/pages/BaseRegistrations/AccountingGroupers/HeaderTable.tsx`
  - `src/pages/BaseRegistrations/BatchAreas/HeaderTable.tsx`
  - `src/pages/BaseRegistrations/DocumentTypes/HeaderTable.tsx`
  - `src/pages/BaseRegistrations/Headbands/HeaderTable.tsx`
  - `src/pages/BaseRegistrations/Parameters/HeaderTable.tsx`
  - `src/pages/CadastrosBase/Depreciacao/HeaderTable.tsx`
  - `src/pages/CadastrosBase/Produtos/Catalogo/HeaderTable.tsx`
  - `src/pages/CadastrosBase/Produtos/Classes/HeaderTable.tsx`
  - `src/pages/CadastrosBase/Rebanho/HeaderTable.tsx`
  - `src/pages/CadastrosBase/SaldoInicial/HeaderTable.tsx`
  - `src/pages/Configuracoes/Apps/HeaderTable.tsx`
  - `src/pages/Configuracoes/Help/HeaderTable.tsx`
  - `src/pages/Dashboards/AbcIndicators/HeaderDashboard.tsx`
  - `src/pages/Dashboards/AssetsDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/CashbookDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/DepreciationDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/FeedlotDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/FinancialDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/LivestockDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/RainfallDashboard/HeaderDashboard.tsx`
  - `src/pages/Dashboards/Suprimentos/index.tsx`
  - `src/pages/Dashboards/UserAnalysis/HeaderDashboard.tsx`
  - `src/pages/Financeiro/BudgetPlanning/HeaderBudgetPlanningTable.tsx`
  - `src/pages/Financeiro/Congelamentos/HeaderTable.tsx`
  - `src/pages/Financeiro/ContasAPagar/index.tsx`
  - `src/pages/Financeiro/ImportacaoMovBancarios/HeaderTable.tsx`
  - `src/pages/Financeiro/MercadoPago/HeaderTable.tsx`
  - `src/pages/Financeiro/MovCaixaBancario/HeaderTable.tsx`
  - `src/pages/Financeiro/OfxImport/HeaderTable.tsx`
  - `src/pages/Fiscal/AccountingEntry/HeaderTable.tsx`
  - `src/pages/Fiscal/CashBook/HeaderTable.tsx`
  - `src/pages/Fiscal/Cte/HeaderTable.tsx`
  - `src/pages/Fiscal/Mdfe/HeaderTable.tsx`
  - `src/pages/Fiscal/NfeEmitidas/index.tsx`
  - `src/pages/Frota/Abastecimentos/HeaderTable.tsx`
  - `src/pages/Frota/Manutencoes/HeaderTable.tsx`
  - `src/pages/Frota/ManutencoesPreventivas/HeaderTable.tsx`
  - `src/pages/Frota/Transferencias/HeaderTable.tsx`
  - `src/pages/Incomes/index.tsx`
  - `src/pages/Invoices/index.tsx`
  - `src/pages/Operacional/Appropriations/HeaderTable.tsx`
  - `src/pages/Operacional/BatchTransfers/HeaderTable.tsx`
  - `src/pages/Operacional/Carregamento/HeaderTable.tsx`
  - `src/pages/Operacional/DeathAnimals/HeaderTable.tsx`
  - `src/pages/Operacional/Diet/DietBeat/HeaderDietBeatTable.tsx`
  - `src/pages/Operacional/Diet/HeaderDietTable.tsx`
  - `src/pages/Operacional/DiscountTable/HeaderDiscountTableTable.tsx`
  - … (+32; use `git grep -l "from '@/components/ButtonFilter'" src/pages`)

### FormSection (seção de formulário)
10 telas.
  - `src/pages/CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx`
  - `src/pages/CadastrosBase/PlanAccount/CreateOrUpdatePlanAccount.tsx`
  - `src/pages/CadastrosBase/Produtos/Catalogo/ProductFormFields.tsx`
  - `src/pages/CadastrosBase/Produtos/Catalogo/ProdutoEstoqueFinanceiroTab.tsx`
  - `src/pages/CadastrosBase/Produtos/Catalogo/ProdutoFiscalTab.tsx`
  - `src/pages/CadastrosBase/Usuarios/CreateOrUpdateUsuario.tsx`
  - `src/pages/Financeiro/Congelamentos/CreateOrUpdateFinancialFreeze.tsx`
  - `src/pages/Integracoes/SoftwareDominio/CreateOrUpdateIntegrationDominio.tsx`
  - `src/pages/Operacional/Rastreabilidade/Traceability/CreateOrUpdateTraceability.tsx`
  - `src/pages/Operacional/Rastreabilidade/TraceabilityConfig/CreateOrUpdateTraceabilityConfig.tsx`

### ToggleRow (interruptor em linha)
4 telas.
  - `src/pages/CadastrosBase/Pessoas/steps/StepCliente.tsx`
  - `src/pages/CadastrosBase/PlanAccount/CreateOrUpdatePlanAccount.tsx`
  - `src/pages/CadastrosBase/Safra/CreateOrUpdateSafra.tsx`
  - `src/pages/CadastrosBase/Usuarios/CreateOrUpdateUsuario.tsx`

### ToggleCard (cartão liga/desliga)
1 telas.
  - `src/pages/CadastrosBase/Pessoas/steps/StepDadosBasicos.tsx`

### RepeaterList (lista repetível)
3 telas.
  - `src/pages/CadastrosBase/Pessoas/steps/StepCliente.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepFornecedor.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepProprietario.tsx`

### StepBody/StepHeader/StepFooter (wizard)
6 telas.
  - `src/pages/CadastrosBase/Pessoas/steps/StepCliente.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepEndereco.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepFornecedor.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepFuncionario.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepProprietario.tsx`
  - `src/pages/CadastrosBase/Pessoas/steps/StepUsuario.tsx`

### ImageUpload com editor de imagem
1 telas.
  - `src/pages/CadastrosBase/Fazendas/steps/StepIdentificacao.tsx`

### SimpleTable (tabela simples do kit)
1 telas.
  - `src/pages/Planos/Contratacao/index.tsx`

## 5. Commits (ordem cronológica)
- b283ab7 chore(ux): bypass de login so-dev (flag VITE_DEV_AUTH_BYPASS) e docs/ux
- d6eae93 docs(ux): documentacao por funcionalidade (1 arquivo por funcionalidade) e correcao do .gitignore
- 8f05e4b docs(ux): mapa de alinhamento do front ao design system oficial
- 1172e24 feat(dev): mocks de dev (axios adapter), dados de referencia do dump e fallback navegavel
- 6ade4df style(theme): onda 1 do alinhamento ao DS (cor primaria, escala de fontes, botao, input, feedback, scrollbar, sombra de card)
- 7335903 feat(ui): porta Steps, StepHeader e StepFooter ao visual do DS e remove copias locais; corrige borda do botao secundario; reverte escala de fontes
- b355369 feat(ui): porta Pagination, Modal/ConfirmDialog, Breadcrumb, Switch e Badge ao visual do DS; botao destructive conforme DS
- a290042 feat(ui): HugeIcons (registry e Icon do DS) nos dois niveis de menu, Header e Home; converte arvore de navegacao de Lucide para papeis do DS
- 8d8d545 feat(ui): menu fiel ao DS - logo CERNE horizontal na sidebar aberta, sem titulo do modulo no 2o nivel e rotulos de grupo em 11px
- e501b22 feat(dev): API local de dev (somente leitura) sobre PostgreSQL restaurado do dump, com recursos de fazendas, pessoas, catalogos, financeiro e produtos
- 391f52e docs(ux): proposta de UX da conciliacao OFX com prototipo interativo
- 1becc2c feat(ofx): conciliacao fase 1 - workspace mestre-detalhe, abas, resumo em R$ e confirmar sugestoes, com componentes do kit
- 504c9a5 feat(ofx): conciliacao fase 2 - painel inline Vincular/Criar/Transferencia, rateio com saldo ao vivo e Desfazer
- e07f293 docs(ofx): corrige comentario de cabecalho da tela de conciliacao
- 0dd5a78 feat(ofx): conciliacao fase 3 - candidatos com score e motivos, confirmacao por linha e em lote com Desfazer (backend simulado na API de dev)
- faf8078 fix(ui): corrige tipos de Button (variantes do recipe), Pagination e botoes as=button do kit
- b9d77e3 feat(ofx): conciliacao com 2 abas (Pendentes/Conciliadas) e filtro Todas/Prontas/A revisar
- e33ad23 feat(planos): pagina Contratar ou alterar plano no modelo do simulador da Eveo, com dados reais do catalogo e regra de preco testada
- c882b7e feat(login): carrossel, videos e marca do design system; SSO desabilitado ate existir integracao
- 358d0e6 refactor(ui): tokeniza cores do painel de resumo e do valor adicional; registra auditoria das leis do DS
- 2a1a04e feat(ui): onda 3 parcial - PageHeader do DS em 169 telas e cabecalho de tabela em caixa-alta
- 35a4178 feat(ui): onda 3 - FilterButton, cabecalho do FilterSide e menu de acoes no padrao do DS; corrige rodape do drawer de filtros
- c75bdbf feat(ui): onda 4 - ListToolbar com busca inline nas listagens de cadastros simples
- 16646b1 feat(ui): onda 4 - Cancelar secundario nos formularios e titulo do FormContainer no padrao do DS
- 379c639 feat(ui): onda 5 - wizard de Fazendas com titulos do DS e campos de formulario no padrao do DS (16px, 1.5px, fundo neutro)
- ff9f131 feat(ui): seletores (Select e react-select) no estilo de campo do DS
- 0ccb139 feat(ui): onda 5 - wizard de Pessoas com grade de Dados Basicos e cartoes de papel (ToggleCard) do DS
- eea5f22 feat(planos): simulador por faixa de tamanho, IA, GB Consult e visao Resumo dos planos conforme o documento de precificacao
- 6463d33 feat(ui): onda 5 - etapas de papel de Pessoas com StepBody, ToggleRow e RepeaterList do DS
- bf92ba1 fix(ui): tokens de tema para titulo forte e selecionado suave (escuro), Icon tolerante a papel desconhecido; registra revisao das ondas 3 a 5
- 210ed7f feat(ui): ListToolbar com busca inline em 26 listagens de Cadastros Base
- 6bf7e25 feat(ui): ListToolbar com busca inline em mais 45 listagens (BaseRegistrations, Administrativo, Operacional, Financeiro, Fiscal)
- 86d69c8 docs(ux): pedido ao backend - parametro search em 60 listagens, com endpoint e tela
- 2a1054f feat(ui): busca inline em Usuarios e Equipes; corrige classificacao no pedido ao backend
- cd40283 feat(ui): onda 5 - formulario de Produtos em etapas (Steps, StepHeader, FormSection e StepFooter) como no DS
- 0f48ea1 feat(ui): Produtos - secoes FormSection nas etapas Estoque/Financeiro e Fiscal
- 792981f fix(ui): tokens para rgba/px soltos, textos fixos em i18n e contraste do tema escuro auditado em 20+ telas
- 9545f74 feat(ui): onda 5 - formulario de Safras em 2 etapas (Dados Gerais e Semanas) como no DS
- 43b2f21 feat(ui): onda 5 - formulario de Usuarios com secoes FormSection e ToggleRow como no DS
- a7cfb14 feat(dev-api): safras (com semanas), usuarios e perfis com escrita em memoria e multipart na API local de dev; validado salvar/editar/excluir
- df0d254 feat(ui): onda 5 - formulario de Plano de Contas com FormSection, ToggleRow e descricao em 2 colunas; previa de codigo na API de dev
- 35e5d9e feat(dev-api): escrita simulada em memoria para bancos, plano de contas e embalagens (/product-packages, /measurements/options); validado salvar e editar
- ffe55ee feat(ui): onda 5 - formulario de Centro de Custo com FormSection na ordem do DS; escrita simulada de centros de custo na API de dev
- 6bf7196 fix(ui): foco dos campos (token focusGlow, contorno verde) e reticencias da paginacao no tema escuro; ToggleRow no Perfil; papel Gestor_Plataf no bypass de dev
- 1d55972 feat(ui): modal Editar imagem (escala, girar, procurar) para o logo da fazenda; papel de dev configuravel (Administrador por padrao) para o botao Novo de Fazendas
- c07bbb4 feat(ui): menu Cadastros Base sem o submenu Produtos; itens internos passam a ser diretos em Estrutura
- 90c0f48 fix(ui): tipografia e espacamento do menu iguais ao DS (13px, passo 36px), breadcrumb 13px, altura unica busca/filtros e novo visual do ImageUpload (dropzone tracejado e cartao de visualizacao)
- 5f86cf0 fix(ui): fonte raiz fixa em 16px como no DS (antes 14/15/16px por largura)
- e64515e feat(ui): contratacao de planos conforme documento da gestao - GIA por janela de mensagens, grupo GIA no pior caso, modulos novos, layout do print; Fazer upgrade do perfil leva a contratacao
- 2ed5b7e fix(ui): contratacao sem entalhe nos cartoes, abas no cabecalho, aviso no rodape, regua com valores acima e modulos com icones e selos de valor
- a6d189f fix(ui): modulo que puxa o plano para cima pode ser desmarcado e volta ao plano anterior
- b7fffd7 feat(dev): mock sintetico global (schemas extraidos dos tipos dos servicos) e guia para IA (CLAUDE.md, PORTING.md, mapa de mudancas gerado, tag ux-baseline)
- 0d76171 feat(ui): situacao em tag (StatusTag) no lugar de bolinha e legenda em todas as listagens; mock sintetico com delete/status; packageManager yarn 1 para o build
- ed8079d fix(build): aumenta heap do Node no tsc e no vite build (OOM no deploy)
- 6422993 fix(dev): mock sintetico reconhece datas dt_*, evita arrays com null em tipos recursivos e registra rotas sem cobertura
- 791b822 fix(ui): cabecalhos do configurador com a mesma altura e faixa dos passos em largura total; acessos com regua e quantidade na horizontal; wrangler.jsonc para o deploy
- 61c349b feat(onboarding): fluxo Criar conta (plano, conta, pagamento simulado, contratante, pronto); passos do configurador nas extremidades
- 29e44c5 fix(onboarding): PF/PJ deduzido do documento (sem seletor); celular obrigatorio e antes do telefone
