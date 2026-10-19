# GB Cerne — Frontend (shell)

## 1. O que é este projeto

Shell (casca) do frontend do **GB Cerne**: aplicação React + Vite com Chakra UI
v3, TanStack Query, React Hook Form + Yup e um sistema de i18n próprio (PT-BR /
EN-US / ES-ES). Traz a estrutura de layout (sidebar, header, rotas privadas/
públicas), autenticação e os módulos "em construção" prontos para receber as
telas reais. Para o contexto de preparação (auth mockada, chrome do layout,
etc.), ver [`HANDOFF.md`](./HANDOFF.md).

## 2. Padrão de tradução (i18n) — OBRIGATÓRIO seguir

### Como funciona

O hook `useLanguage()` (em `@/hooks/useLanguage`) devolve `languageGB`, que é o
**objeto de tradução completo do idioma ativo**. Você navega esse objeto direto
no ponto de uso.

```tsx
import { useLanguage } from "@/hooks/useLanguage";

function MinhaTela() {
  const { languageGB } = useLanguage();
  return <Text>{languageGB.examples.resource.list.pageTitle}</Text>;
}
```

### Uso CORRETO

Navegue o **caminho completo** no ponto de uso, sempre:

```tsx
// CERTO ✅ — caminho completo, rastreável
<Text>{languageGB.admin.pessoas.nome}</Text>
<Text>{languageGB.examples.resource.list.pageTitle}</Text>
```

### ANTI-PADRÃO — NÃO FAZER

Não crie uma constante intermediária para "encurtar" a navegação:

```tsx
// ERRADO ❌ — quebra a rastreabilidade de onde cada string vem
const t = languageGB.examples.resource.list;
<Text>{t.pageTitle}</Text>

// ERRADO ❌ — idem
const { resource } = languageGB.examples;
<Text>{resource.list.pageTitle}</Text>
```

O atalho parece conveniente, mas some com a origem da string (um `grep` por
`languageGB.examples.resource.list.pageTitle` deixa de encontrar o uso). Sempre
o caminho completo.

### Onde adicionar tradução nova

Para um domínio novo, crie um **módulo de idioma** seguindo esta convenção (o
módulo `examples` é a **referência viva** — copie a estrutura dele):

1. **Interface** — `src/@types/language/module-<nome>/index.ts` exportando
   `Module<Nome>`.
2. **Registro na interface global** — em `src/@types/language/index.d.ts`,
   importe e adicione o campo em `LanguageDate` (ex.: `examples: ModuleExamples`).
3. **Conteúdo por idioma** — um arquivo por idioma:
   `src/constants/languages/languagePtBr/language<Nome>.ts`,
   `.../languageEnUs/language<Nome>.ts`,
   `.../languageEsEs/language<Nome>.ts`.
4. **Registro no agregado de cada idioma** — em cada
   `src/constants/languages/{languagePtBr,languageEnUs,languageEsEs}/index.ts`,
   importe e espalhe (`examples: { ...languageExamples }`).

Referência viva: módulo `examples` (arquivos `module-examples`,
`languageExamples.ts` nos 3 idiomas, registros em `index.d.ts` e nos 3 `index.ts`).

## 3. Checklist — como construir uma tela nova

1. **Types** — `src/@types/...` (ou `types/` do módulo): DTOs distintos por
   feature — `Data` (leitura da API), `Form` (estado do RHF, com `Option<T>` nos
   selects), `CreateRequest`, `UpdateRequest`, `FilterForm` + `FilterRequest`.
2. **Tradução** — módulo de idioma novo se o domínio for novo (ver seção 2);
   nunca use strings hardcoded.
3. **Service** — chamadas HTTP via `api.V2` (`@/services/api`), tipando com
   `Response` / `ResponsePagination`.
4. **Validação** — schema Yup como **função que recebe `languageGB`**,
   **compondo o helper real** `@/validations/field-validation-schema` para os
   campos genéricos e sobrescrevendo só o específico da feature.
5. **Hook de dados** — query de grid / form. **GUID por padrão** (ver seção 4).
6. **Página em pasta MODULAR** — `pages/<Módulo>/<Feature>/`, com os arquivos
   padrão de uma tela de cadastro:
   - `index.tsx` — a **listagem** (grid + `HeaderTable` + `FilterSide`).
   - `CreateOrUpdate<Feature>.tsx` — **criação e edição no mesmo arquivo**
     (`isEditing` decide o comportamento); nunca dois arquivos separados.
   - `HeaderTable.tsx` — **só os botões de ação** (Add / Filter).
   - `FilterSide<Feature>.tsx` — drawer de filtro (usa `<FilterSide>` real).
   - (opcional) abas: a principal fica **inline** no `CreateOrUpdate`; abas
     extras são **arquivos separados** dentro de `<Tabs.Content>`.
7. **Reutilize o que é GLOBAL** — contexto, providers, botões genéricos
   (`ButtonAdd`, `ButtonFilter`), `useTable`, `FilterSide`, grid/inputs/dialogs
   vêm da estrutura real do projeto por **import**. **Não recrie** essas peças;
   a tela só contém o que é **específico da feature**. i18n via `useLanguage()`
   (caminho completo).
8. **Integração com o contexto da app** — Auth, Theme e Language já vêm prontos
   pelos providers globais; **não crie contexto novo** para uma tela normal.
9. **Rota** — registre em `src/router/index.tsx`.

## 4. GUID vs Numeric ID — leia com atenção

- Este projeto foi **herdado do "Rank"** e traz hooks de query baseados em
  **Numeric ID** — `useCustomFormQueryByNumericId`,
  `useCustomGridQueryByNumericId` (em `src/hooks/`). Isso é uma
  **particularidade deste projeto especificamente**, **não** o padrão da empresa.
- O **padrão da empresa para projetos NOVOS é GUID**. Use
  `useCustomFormQueryByGuid` / `useCustomGridQueryByGuid` (também em
  `src/hooks/`), que validam o ID via **regex de UUID** (`isValidGuid`, em
  `src/utils/guid.ts`) em vez de `> 0`.
- A camada de exemplos (`src/_examples/`) demonstra o padrão **GUID** (o novo),
  não o Numeric ID.

## 5. Camada de exemplos (`src/_examples/`)

`src/_examples/` é uma **referência de implementação** do padrão CRUD — **não é
produto**. Fica isolada para **não poluir** as pastas reais (`src/pages/`,
`src/services/`, `src/hooks/`, `src/@types/`).

O ponto central é a **organização MODULAR**: a tela vive em
`pages/<Módulo>/<Feature>/` (aqui `pages/cadastros/recursos/`), com os arquivos
padrão de uma tela de cadastro — `index.tsx` (listagem),
`CreateOrUpdateRecurso.tsx` (criar **e** editar num só arquivo, com abas),
`HeaderTable.tsx` (só botões Add/Filter), `FilterSideRecursos.tsx` (drawer) e
`RecursoConfiguracoesTab.tsx` (aba extra em arquivo separado). As demais
subpastas (`types/`, `services/`, `validations/`, `hooks/`, `translations/`)
guardam só o que é **específico da feature**.

Peças **globais** — contexto, providers, `ButtonAdd`, `ButtonFilter`,
`FilterSide`, `useTable`, `field-validation-schema` — **não são recriadas** na
camada de exemplos: são **importadas** da estrutura real do projeto.

A rota `/exemplo` existe só por URL direta (não entra no menu) e a camada pode
ser **removida** quando o time estiver alinhado ao padrão. Detalhe completo em
[`src/_examples/README.md`](./src/_examples/README.md).

## 6. Ver também

- [`HANDOFF.md`](./HANDOFF.md) — contexto de preparação: autenticação mockada,
  chrome do layout e demais decisões de setup.
- [`src/_examples/README.md`](./src/_examples/README.md) — detalhe da camada de
  exemplos.
