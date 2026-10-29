# Guia de aplicação (para IA) — como levar estas mudanças ao front de produção

Público: uma IA (Claude etc.) que recebeu este repositório e a tarefa "aplique o redesign de UX no front".
Leia antes: [`/CLAUDE.md`](../../CLAUDE.md). Fatos exatos e listas de arquivos estão em
[`MAPA-DE-MUDANCAS.md`](MAPA-DE-MUDANCAS.md) (gerado — confie nele, não em memória).

## 0. Premissas

- Este repo = **baseline** (tag `ux-baseline`) **+ commits de UX**. O jeito mais seguro de aplicar é por **camadas**, na ordem abaixo,
  porque as camadas de baixo (tema, kit) são usadas pelas de cima (telas). Aplicar tela antes do kit quebra o build.
- Se o front de produção **evoluiu** depois do baseline, **não** sobrescreva arquivos: use `git diff ux-baseline HEAD -- <caminho>` e reaplique
  a intenção (cada camada abaixo diz qual é a intenção).
- Depois de cada camada: `npx tsc --noEmit -p .` deve sair vazio. Commits atômicos por camada/funcionalidade.
- Dashboards e Relatórios **não** entram.

## 1. Camada 1 — Tema e tokens (maior alavancagem; mexe em todas as telas)

Arquivos: `chakra.config.ts`, `src/styles/theme/semantic/{light,dark}.ts`, `src/@types/theme.d.ts`, `src/styles/recipes/*.ts` (button, input, …),
`src/styles/components/SelectComponent.ts`.

Intenção:
- Cor primária = verde brand **600 `#059669`** (hover 700), escala de fontes do DS (`xs 11 · sm 12 · base 13 · md 14 · lg 15 · xl 16 · title 24`),
  botões/inputs do DS (campo 38px, contorno 1.5px, raio 8, foco verde com `focusGlow`), raiz do documento **16px fixa**.
- **Tokens semânticos novos** (25, ver seção 3 do mapa): `strongText`, `selectedBG/Text/ChipBG`, `planPro/Deluxe/Enterprise`, `onPlan`, `summary*`, `addonSoftBG/addonText`, `focusGlow`.
  Declare **sempre** nos dois modos e no `theme.d.ts`.
- O foco do input é definido **na variante** (`outline`/`outline2`) porque a variante vence o `_focus` da base.

Como verificar: abrir uma listagem e um formulário em claro e escuro; foco de um campo mostra contorno verde + brilho; `html` tem `font-size: 16px`.

## 2. Camada 2 — Kit de componentes e componentes centrais

**Copiar os componentes novos** de `src/components/ui/` (lista em `MAPA-DE-MUDANCAS.md`, seção "Arquivos novos em `src/`") e `src/hooks/useListSearch.ts`.
Cada arquivo tem um comentário de cabeçalho dizendo para que serve; o mapa lista **quantas telas usam cada um**.

Componentes **centrais alterados** (reaplicar a intenção, não copiar cegamente se houver divergência):

| Arquivo | Intenção |
|---|---|
| `components/Pagination.tsx` | botões 34px, página atual brand600, reticências `semanticNeutral.500` |
| `components/Form/Select.tsx`, `styles/components/SelectComponent.ts` | seletores no estilo de campo do DS (38px, 1.5px, glow `focusGlow`) |
| `components/Form/ImageUpload.tsx` | dropzone tracejado (vazio) + cartão de visualização; prop opcional `editor` abre `ui/ImageEditorDialog` |
| `components/ButtonFilter.tsx` | botão "Filtros" do DS; altura de `ui/listControl.ts` |
| `components/Button.tsx`, `CustomDialog.tsx`, `DeleteConfirmDialog.tsx` | variantes/raios/sombras do DS (modal raio 20, `destructive` = fundo claro) |
| `components/Layout/FormContainer.tsx` | `headerActions` e `footer` (rodapé de largura total) |
| `components/Layout/{NavRail,SecondaryNav}.tsx`, `components/Header/*` | menu 13px, linhas de 36px sem folga, rótulo de grupo 11px/500; "Fazer upgrade" → `/planos/contratar` |
| `components/Table.tsx`, `FilterSide.tsx`, `Form/FormFooterFilter.tsx` | cabeçalho de tabela em caixa-alta; rodapé do drawer de filtros com botões dividindo a largura |

## 3. Camada 3 — i18n

Para cada chave nova: módulo em `src/constants/languages/language{PtBr,EnUs,EsEs}/` **e** o tipo em `src/@types/language/module-*/`.
`git diff ux-baseline HEAD --stat -- src/constants/languages src/@types/language` lista os módulos tocados (Fazendas, Plano de Contas, Centro de Custo,
Safras, Usuários, Assinatura/contratação, Sidebar…). Textos de **catálogo** (planos, módulos, GIA) ficam em PT no `catalog.ts` por decisão.

## 4. Camada 4 — Menu

`src/config/v2/navigationTree.ts`: ícones passam a ser **papéis do DS** (`design/icons.ts`, via `<Icon name="…">`), não componentes Lucide; o submenu "Produtos"
foi **achatado** (Produtos, Embalagens, Endereçamentos, Armazéns, Saldo Inicial, Grupos, Categorias, Classes, Un. de Medida viram itens diretos de "Estrutura").
Ids e permissões (`navigationPermissions.ts`) **não mudaram**.

## 5. Camada 5 — Telas por padrão (a maior parte do diff)

### 5.1 Listagens (≈ 170 telas) — receita

Assinatura para achar o que falta: arquivos `index.tsx` de listagem que ainda tenham `<Text fontSize="2xl" …>{text.list.pageTitle}` ou `ButtonFilter` dentro de `HeaderTable.tsx`.

Antes → depois (exemplo real: `src/pages/CadastrosBase/Racas`):
```tsx
// ANTES: título artesanal e botão de filtro no HeaderTable
<HeaderGrid header={<HeaderTable onOpenFilter={…} filtersApplied={…} languageGB={…} />}>
  <VStack><Text fontSize="2xl" fontWeight="bold" color="brandColorText">{text.list.pageTitle}</Text><Text>{text.list.pageSubtitle}</Text></VStack>
</HeaderGrid>
<Box mt={6}><Table … /></Box>

// DEPOIS
const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);
<HeaderGrid header={<HeaderTable … />}>           {/* HeaderTable só tem ButtonAdd; ButtonFilter saiu */}
  <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
</HeaderGrid>
<ListToolbar search={listSearch.value} onSearch={listSearch.onChange}
  searchPlaceholder={languageGB.defaltStrings.searchList}
  onOpenFilter={onOpenFilter}
  filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)} />
<Box><Table … /></Box>
```
- `useListSearch` espera que o **tipo do filtro** tenha `search?: string`; adicione ao tipo (`*Filter`) da tela. A busca vai ao backend como `?search=`.
  **Backend:** ~60 listagens ainda não aceitam `search` — lista em [`backend-busca-listagens.md`](backend-busca-listagens.md).
- Contagem de filtros ativos **desconta** a busca (ela não é filtro do drawer).
- Quantas telas já usam cada coisa: seção 4 do mapa.

### 5.2 Formulários de cadastro

- Agrupe campos com `FormSection` (título + grade 1/2/3 colunas); interruptores com `ToggleRow` (rótulo + dica em tooltip); descrição ocupa 2 colunas (`GridItem colSpan`).
- Rodapé: **Cancelar** secundário + salvar primário. Título do `FormContainer` no padrão do DS.
- Referências prontas: Plano de Contas, Centro de Custo, Safras (2 etapas), Usuários, Perfil, Produtos (abas com seções), Embalagens.

### 5.3 Wizards (Fazendas, Pessoas, Produtos)

`StepHeader` (título 24px centralizado) + `StepBody` (conteúdo ≤ 760px) + `StepFooter` ("Etapa X de N", Voltar secundário, Próximo 190px). Cartões de papel em Pessoas com `ToggleCard`;
listas repetíveis com `RepeaterList`. Fazendas: logo com `ImageUpload editor={text.image.editor}`.

### 5.4 Páginas com regras próprias (reescritas — ler a doc da funcionalidade)

| Funcionalidade | Doc | Observação |
|---|---|---|
| Contratação de planos | `funcionalidades/contratacao-plano.md` | catálogo/preço em `pages/Planos/Contratacao/{catalog,pricing}.ts` (+ testes), GIA por janela de mensagens, módulos com ícone |
| Conciliação OFX | `funcionalidades/conciliacao-ofx.md` | workspace mestre-detalhe, candidatos com score |
| Login | `funcionalidades/login.md` | carrossel/vídeos, SSO desabilitado até existir integração |
| Safras, Usuários, Plano de Contas, Centro de Custo, Produtos, Fazendas | `funcionalidades/*.md` | formulários por seção |

## 6. Armadilhas conhecidas (já custaram retrabalho)

1. `<Text>` do Chakra **não herda** tamanho/peso → `fontSize="inherit" fontWeight="inherit"` quando o pai define.
2. Variante de recipe sobrescreve `_focus` da base.
3. Raiz era 87,5/93,75/100% por viewport; agora **100% fixa** — telas que dependiam de `rem` menor em larguras médias ficam mais largas (tabelas rolam por dentro).
4. `Gestor_Plataf` esconde "Nova fazenda" (regra existente) e exige papel para criar centro de custo de topo.
5. Módulo que só existe em plano acima puxa o plano (`toggleModule`), e agora o clique é **reversível** (`planUndo`).
6. Dados/valores do catálogo comercial são **ilustrativos** vindos de um documento da gestão (outubro/2026); trocar quando o backend expuser `GET /subscription/catalog`.
7. Tema escuro: não deixe cor fixa — use token; rode a verificação de contraste (texto ≥ 3,5, ícone ≥ 3) em listagens e formulários.

## 7. Verificação (por camada e no fim)

1. `npx tsc --noEmit -p .` → vazio.
2. `npx vitest run <pastas tocadas>` (ver falhas pré-existentes em `/CLAUDE.md`).
3. Visual: listagem (título 24px, busca e Filtros com 34px, paginação), formulário (campo 38px, foco verde, seções), wizard, menu (13px/36px), claro **e** escuro, 1440 e 1024px sem rolagem horizontal da página.
4. i18n: troque o idioma e confirme que nenhuma chave aparece crua.
5. Atualize `docs/ux/funcionalidades/<slug>.md` e rode `node scripts/ux-docs/gen-change-map.mjs`.

## 8. O que NÃO levar

`src/mocks/dev-api/**`, `dev-auth-bypass.ts`, `scripts/dev-db`, `scripts/dev-mocks`, `scripts/ux-docs`, `.claude/launch.json`, flags `VITE_DEV_*` — são ferramentas de revisão de UX.
