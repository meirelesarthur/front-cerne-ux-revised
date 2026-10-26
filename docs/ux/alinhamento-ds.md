# Alinhamento do front ao Design System oficial (CERNE)

- **DS oficial:** `C:\Users\Arthur\Downloads\GB-CERNE\04.Code\cerne` (React + tokens em `src/design/tokens.ts`, regras em `CLAUDE.md`, matriz em `docs/COBERTURA_DESIGN_SYSTEM.md`).
- **Front de produção:** este repositório (Chakra UI v3).
- **Levantamento:** 2026-10-19. Leitura de código por grep/glob + comparação visual da tela Fazendas (DS em `:5190`, front em `:5180`). Contagens são ordem de grandeza.
- **Princípio:** o código do DS define; o front consome. Não se muda token no front sem passar por `tokens.ts` do DS (Lei 5).

## 1. Diagnóstico em uma página

1. **Shell (sidebar, submenu, topbar) já está próximo** do desenho. Ajustes pequenos (seção 4).
2. **O tema Chakra diverge nos fundamentos** (cor primária, escala de fontes, botão, input, foco, dark). Corrigir no tema/recipe atinge todas as telas de uma vez: maior alavancagem.
3. **Listagens e formulários usam um padrão próprio** (`Container` + `HeaderGrid` + `FilterSide` + `Table`) em ~200–420 telas, diferente do `CrudPattern` do DS (`PageCard` + `PageHeader` + `ListToolbar` + `FilterDrawer` + `DataTable` + `ConfirmDialog`). Migrar o padrão central alinha centenas de telas.
4. **Só ~15% das telas do front têm referência no DS** (~230 de ~1.680 arquivos). Fiscal, Frota, Administrativo (quase todo), Configurações, Incomes e Invoices precisam ser desenhados.
5. **Sem backend, nenhuma lista ou formulário renderiza** (erro de rede). Para alinhar tela a tela é preciso de dados simulados (seção 6).

## 2. Divergências de tema (tokens) — resolvem no tema/recipe

| # | Divergência | DS | Front | Esforço |
|---|-------------|----|-------|---------|
| T1 | **Cor primária** | brand 600 `#059669`, hover 700 `#047857` | `primaryMain` e `buttonSolidBG` = `blue.500` = `#22c55e`; hover `#064e3b` (verificado em `src/styles/theme/semantic/light.ts:12,71`) | P |
| T2 | **Escala de fontes** (base) | 14px = base; 10–38 | `base` 13, `md` 14 (nomes iguais, valores deslocados um degrau) | M (exige varrer usos hardcoded) |
| T3 | **Botão** | radius 8; alturas 34/38/42; variantes primary/secondary/destructive/ghost | radius 4; 32/36/38; variantes `solid`, `outline`, `ghost_*`, `solid_danger` | M |
| T4 | **Input** | radius 8; foco com `glow.brand`; disabled ≠ readonly | radius 6; foco só com borda; disabled = readonly | P |
| T5 | **Neutros** | neutral 700 `#404040`, 800 `#1a1a1a` | escala deslocada (`gray.600`=`#404040`) + degraus extras; texto desabilitado branco no dark | M (risco de regressão ampla) |
| T6 | **Feedback (texto AA)** | success/error/warning text = 700 | `successMain` green.500, `warnMain` yellow.800, `errorMain` red.800 | P |
| T7 | **Dark (GBMode)** | accent `#10b981`, `gb.surface`, `cardDark*`, `row.hoverGb`, `chart.gridGb` | só superfícies/bordas; faltam esses tokens; botão sólido `blue.800` | M |
| T8 | **Sombras de card** | `card`/`cardHover`/`cardDark*` | PageCard usa `md`; sem variantes dark | P |
| T9 | **Transições, glow, `layout.contentOffset`, drawer 330, overlays (.45/.18)** | tokens | sem tokens; valores soltos (`0.2s`, `calc(100vh - 185px)`) | M |
| T10 | **Espaçamento** | base 4px fixa | `html` com 87,5% / 93,75% / 100% por viewport (1 unidade vale 3,5–4px) | decisão de design |
| T11 | **Scrollbar** | 4px visível | oculta globalmente | P |
| T12 | **Arquitetura do tema** | — | troca de tema recria o `system` (`ThemeContext`); `chakra.config.ts`/`theme.ts` só valem para o claro | M |

Atenção: alguns recipes podem estar **inertes** (menu, checkbox, radio, switch, alert, table, breadcrumb registrados como `recipes` em vez de `slotRecipes` no Chakra v3; `modal` com nome da v2). Confirmar em runtime antes de investir neles.

## 3. Kit de componentes — DS → front

| Situação | Componentes |
|----------|-------------|
| **Equivalente** | FormField, DatePicker, SortHeader, EmptyState, CollapsibleSection, Toast, SecondaryNav, NavRail, Topbar, DashboardGrid (duplicado), gráficos |
| **Parcial** | IconButton, Badge/Tag, FormSelect/SearchSelect, Checkbox, ConfirmDialog (`DeleteConfirmDialog`), DropdownMenu (`MenuSelect`), Tooltip, Tabs, Stepper (`ui/steps.tsx`, sem StepFooter), PageCard (`ui/PageCard.tsx`), PageHeader/FormPageHeader, DataTable (`Table.tsx`), ListToolbar (`HeaderGrid`), FilterDrawer (`FilterSide`), Skeleton, BulkActionBar (duplicado em páginas), FileUpload/ImportDialog |
| **Divergente** | Button, ToggleSwitch (fundo fixo `#E2F8F3`), Modal (radius 12 vs 20), Pagination (botões 24px vs 34px), Breadcrumb (`opacity .6`, separador `/`), KpiStatCard (`MetricCard`/`StatCard`) |
| **Ausente como kit** | TypedConfirmDialog, TreeView (existe só em páginas), Avatar, Tag |

Duplicidades a unificar: `ui/DashboardGrid.tsx` × `Dashboard/DashboardGrid.tsx`; `ChartCard/index.tsx` (placeholder) × `cards/ChartCard.tsx`; `ContainerV2.tsx` (existe, 0 usos).

## 4. Shell — diferenças visíveis (comparação Fazendas)

- Logo: DS mostra "C" + wordmark **CERNE**; front mostra só "C".
- Topbar: DS tem seletor de fazenda + busca + notificações + avatar; front tem busca + notificações + avatar (verificar `FarmSwitcher` na topbar).
- Submenu: front tem cabeçalho "Cadastros Base" e chevrons em itens (ex.: Produtos) que o DS não tem; DS tem rodapé de recolher igual.
- Página: DS usa `PageCard` com título + contagem + busca + alternância Lista/Cards + **Filtros** + botão primário; front mostra título, subtítulo e "Filtros" em texto (sem ação primária visível, provavelmente por falta de dados/permissão de contexto — a confirmar com mocks).

## 5. Padrões repetidos no front (alavancagem)

| Padrão do front | Arquivos | Equivalente DS |
|-----------------|---------:|----------------|
| `index.tsx` de listagem | ~345 | `CrudPattern` |
| `FilterSide*` | ~174 próprios (~419 refs) | `FilterDrawer` |
| `CreateOrUpdate*` | ~165 (~449 refs) | `FormPageHeader` + `FormSection`/`Stepper` |
| `HeaderTable` | ~152 | `PageHeader` (+ ação primária) |
| `HeaderGrid` | ~209 | `ListToolbar` |
| `Container` | ~200 | `PageContainer` + `PageCard` |
| `DeleteConfirmDialog` | ~270 | `ConfirmDialog` / `TypedConfirmDialog` |
| `Table` + `IconButtonTable` | amplo | `DataTable` + `DropdownMenu` |
| `PageCard` já adotado | 17 | (Pessoas, Safra, Autorização, Centro de Custo, OFX, MeuPerfil…) |
| `PageHeader` já adotado | 4 | |
| Deep-link de filtros (`useSearchParams`) | 6 telas | regra do DS: "deep-link tudo" |

## 6. Cobertura de telas por módulo

| Módulo (front) | .tsx | Referência no DS | Observação |
|----------------|-----:|------------------|------------|
| CadastrosBase | 257 | Parcial (~110) | Fazendas, Safras, Pessoas, Produtos, Plano de Contas, Centros de Custo, Cidades, Rebanho, Usuários, Embalagens, Contas Bancárias, Emissores, Estoque Inicial, Perfil de acesso |
| BaseRegistrations | 184 | Parcial (~23) | Bancos, Armazéns, Endereçamento, Agrupadores, Permissões; ~40 auxiliares sem referência |
| Administrativo | 181 | Só Autorização | resto sem desenho |
| Operacional | 545 | Parcial (~53) | Mapa de Confinamento, Planejamento Pecuário, Currais |
| Financeiro | 52 | Parcial (~12) | OFX; **Baixa de Títulos** é seção embutida no front, mas tela própria no DS |
| Fiscal / Frota / Configurações | 69 / 46 / 11 | **Nenhuma** | precisam ser desenhadas |
| Incomes / Invoices | 9 / 13 | **Nenhuma** | só existem no front |
| Integrações | 15 | Domínio (5) | outras 5 sem referência |
| Login / MeuPerfil / Planos | 4 / 4 / 6 | Tem | quase prontos; Forgot/Reset/2FA sem referência |
| Home | 2 | Shell + Favoritos | confirmar |
| Dashboards / Relatórios | 80 / 110 | DS: 14 dashboards, 5 relatórios, "fora de escopo, tratados um a um" | **decisão de escopo pendente** |

## 7. Plano em ondas

| Onda | Alvo | Resultado esperado |
|------|------|--------------------|
| **0** | Preparação: dados simulados (mocks) para as telas de lista/form; captura de "antes" por tela; checklist de paridade por tela | Dá para comparar DS × front tela a tela sem backend |
| **1** | **Tema:** T1, T4, T6, T8, T11 (baratos) → T3, T2, T7, T9 → T5, T12 (maior risco) | Todas as telas herdam cor, botão, input, foco e dark corretos |
| **2** | **Kit:** Pagination 34px, Modal, Breadcrumb, Toggle; criar TypedConfirmDialog, TreeView, Avatar, Tag; unificar duplicados | Peças alinhadas ao catálogo do DS |
| **3** | **Padrões centrais:** `Container`/`HeaderGrid`/`HeaderTable` → `PageCard`+`PageHeader`+`ListToolbar`; `FilterSide` → `FilterDrawer`; `Table` → `DataTable`+`DropdownMenu`; `DeleteConfirmDialog` → `ConfirmDialog`; estados loading/vazio/erro e deep-link de filtros centralizados | ~200–420 telas de uma vez |
| **4** | Cadastros simples com referência (Bancos, Cidades, Embalagens, Armazéns, Contas Bancárias, Emissores, Estoque Inicial, Endereços) | ~8 telas, baixo risco |
| **5** | CRUDs complexos (Pessoas, Produtos, Fazendas, Safras, Plano de Contas/Centros/Agrupadores, Usuários, Rebanho) | ~7 telas, wizard + `FormSection` |
| **6** | Transacionais/workflow (Autorização, OFX, Baixa de Títulos como tela própria, Mapa, Planejamento, Integração Domínio) | ~6 telas |
| **7** | Login (+Forgot/Reset/2FA), Home, Perfil, Planos | acabamento |
| **8** | Telas **sem referência** (Fiscal, Frota, Administrativo, Configurações, Incomes, Invoices, ~40 auxiliares): desenhar no DS primeiro, depois aplicar | depende de desenho |
| **9** | Dashboards e Relatórios | depende de decisão de escopo |

Depois da onda 3, começam os **ajustes manuais** por funcionalidade (`docs/ux/funcionalidades/<slug>.md`).

## 7.1 Progresso (atualizado em 2026-10-19)

Decisões do Arthur: cor `#059669` · estratégia (a) tema/recipes do Chakra · mocks de dev autorizados · **Dashboards e Relatórios fora do escopo (não tocar)**.

**Onda 0 — concluída.** `VITE_DEV_MOCKS` (adapter axios em `src/mocks/dev-api/`): Fazendas (sintético), Bancos/Estados/Cidades (reais, do dump), fallback que devolve lista vazia nas rotas sem handler. Teste de navegação: **223 rotas de menu** (exceto Dashboards/Relatórios) abrem sem tela de erro; as que ainda não têm handler mostram estado vazio.

**Onda 1 (tema) — aplicada, validada visualmente em Fazendas (claro):**

| Item | Situação | O que mudou |
|------|----------|-------------|
| T1 cor primária | feito | rampa `blue`: 500 → `#059669`, 600/700/900 → `#047857` (`color-tokens.ts`) |
| T2 escala de fontes | **revertido (diagnóstico errado)** | A escala do front tem os mesmos VALORES do DS em 12/13/14px (xs 11, sm 12, base 13, md 14 ≈ DS 2xs/xs/sm/base), só com nomes deslocados. Os componentes padrão do Chakra dependem desses nomes (`textStyle: md` etc.): renomear pelo DS levou botões e inputs a 16px. Mantida a escala original; componentes novos do kit usam os nomes do front ou px explícito. Lg/xl/2xl+ divergem do DS (15/16/22/26/32 vs 18/20/24/30/38): tratar caso a caso |
| T3 botão | parcial | radius 4 → 8; `sm` 32 → 34. Mantido: `lg` 38 (default, = `md` do DS). Pendente: reconciliar variantes (`solid/outline/ghost_*`) com primary/secondary/destructive/ghost |
| T4 input | feito | radius 6 → 8; foco com glow `rgba(5,150,105,.12)`; readonly com cursor `default` |
| T6 feedback | feito | `successMain` green.700, `warnMain` yellow.700, `errorMain` red.700 (AA), `infoMain` azul `#2563eb` (era verde) |
| T7 dark | parcial | sombra do card = `cardDark`; scrollbar GBMode. Pendente: `gb.surface`, `row.hoverGb`, `chart.gridGb`, botão sólido |
| T8 sombra de card | feito | `PageCard` usa `cardShadow` (theme-aware) |
| T11 scrollbar | feito | scrollbar fina 4px visível (claro e GBMode); antes estava oculta por "decisão do dev" |
| T5, T9, T10, T12 | pendente | neutros (risco amplo), tokens de transição/layout, `html` com rem variável, arquitetura de troca de tema |

Pendências de validação: tema escuro, formulários (input), modais, telas densas após o T2.

## 8. Decisões que preciso de você

1. **Cor da marca:** o DS tem `#059669` em `tokens.ts`, mas o próprio DS registra uma pendência (discovery cita `#178048`/`#38b76c`, "reconstruídas, não oficiais"). Para a onda 1 vou usar `#059669` (o que está em `tokens.ts`). Confirme.
2. **Dashboards (80) e Relatórios (110):** entram nesta rodada ou ficam para depois?
3. **Estratégia de aplicação:** (a) reimplementar o visual do DS via tema/recipes do Chakra e manter os componentes do front (recomendado, menor risco para o Dev); ou (b) portar os componentes `ui/` do DS (Tailwind/inline) para dentro do front. A (a) evita duas bibliotecas de UI convivendo.
4. **Mocks:** posso criar uma camada de dados simulados só para dev (MSW ou similar, desligada por padrão, no mesmo espírito do bypass de login) para renderizar as listas. Autoriza?
5. **Espaçamento (T10):** o `html` com tamanho de fonte variável por viewport é decisão intencional? O DS usa base fixa de 4px.

## 7.2 Progresso — onda 3 (iniciada em 2026-10-26)

| Item | Situação | O que mudou |
|---|---|---|
| Cabeçalho de tabela (`Table.tsx`) | feito | 12px · 600 · caixa-alta · espaçamento 0.06em (como o `DataTable` do DS); vale para todas as listagens |
| Título de página (`PageHeader`) | feito | novo `ui/PageHeader` (24px, `gray.900`, descrição, contador opcional). Codemod trocou o bloco repetido em **169 telas** (168 arquivos) |
| `ListToolbar` (busca + chips de filtro) | pendente | depende de decidir busca no servidor × cliente por tela |
| `FilterSide` → `FilterDrawer` | pendente | |
| `Table` → `DataTable` + `DropdownMenu` de ações | pendente | |
| `DeleteConfirmDialog` → `ConfirmDialog` | parcial | já alinhado visualmente (UX-dialog) |
| Estados loading/vazio/erro | pendente | já existem em `Table` (isLoading/isEmpty/isError); falta padronizar visual |

Login (onda 7) feito antes: ver `funcionalidades/login.md`.

### Onda 3 — continuação (2026-10-26)
| Item | Situação | O que mudou |
|---|---|---|
| `ButtonFilter` (195 telas) | feito | passa a ser o `FilterButton` do DS: 34px, borda 1.5px, verde suave + pílula de contagem quando há filtro; ícone `filter-advanced` do kit |
| `FilterSide` (350 telas) | feito | cabeçalho do DS: ícone de filtro, título semibold, pílula verde de contagem |
| `Form.FooterFilter` | corrigido | o 2º botão do rodapé estourava a borda do drawer; os botões agora dividem a largura |
| `Actions` (menu de ações de linha) | feito | gatilho 28/32/36px com borda no hover e ícone `more-vertical` do kit; itens 13px, padding 9×14, painel mínimo 150px |
| `ListToolbar` (busca + chips) | **não feito** | o front não tem busca inline: o filtro por texto vive dentro do drawer, por tela. Mudar isso é decisão de produto (busca no servidor), não só visual |
| `DataTable` completo | **não feito** | só o cabeçalho foi alinhado; ordenação, seleção e linha expansível seguem no `Table` atual |
| `ConfirmDialog` / estados vazio-erro | fora desta rodada | |

## 7.3 Progresso — onda 4 (cadastros simples, listagens) · 2026-10-26
Novo `ui/ListToolbar` (busca inline + botão Filtros na mesma linha, como o DS) + hook `useListSearch` (liga a busca ao param `search` que o drawer já enviava; debounce 300 ms, preserva os outros filtros). Aplicado em: **Embalagens, Cidades, Contas Bancárias, Emissores, Estoque Inicial, Bancos (só busca, não tem drawer), Armazéns**. O botão Filtros saiu do `HeaderTable` dessas telas.
- **Endereçamentos** não recebeu: é lista em árvore sem `userPaginatedQuery`; fica para um ajuste próprio.
- Dev API: Contas Bancárias, Emissores e Estoques Iniciais seguem sem dados locais (lista vazia) — a busca foi verificada na requisição (`search=`), não no resultado.
- Chave de texto nova `defaltStrings.searchList` (PT/EN/ES).
- Falta (próximo passo da onda 4): formulários desses cadastros × DS, e aplicar o mesmo padrão às ~190 listagens restantes (a regra é mecânica, mas cada tela precisa conferir se o filtro tem `search`).

### Onda 4 — formulários (2026-10-26)
| Item | Situação | O que mudou |
|---|---|---|
| Botão "Cancelar" dos formulários | feito | `variant="outline"` (verde, preenche no hover) → `secondary` (contorno neutro, como o DS) em **423 botões / 416 telas** (codemod; tsc sem erros novos) |
| Título do `FormContainer` | feito | 24px · negrito · `gray.900` (era 15px/600), igual ao `FormPageHeader` do DS |
| Rodapé dos formulários | já alinhado | Cancelar à esquerda e Salvar à direita (mesmo `space-between` do `PageCard` do DS) |
| Ícone no botão Salvar, aviso de "alterações não salvas" | **não feito** | o DS mostra ícone `save` e abre diálogo ao sair com campos sujos; no front depende do `ButtonSaveAndNext` e de um guard de navegação (decisão de produto) |

### Onda 5 — CRUDs complexos
Não iniciada além do que já herdam das ondas 2–4 (título, tabela, filtros, menu de ações, Cancelar). Próximo passo proposto: comparar Fazendas (wizard) com o DS tela a tela — `FormSection`, steps, resumo — antes de mexer, porque cada um tem fluxo próprio.
