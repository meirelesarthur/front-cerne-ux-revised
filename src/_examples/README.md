# `src/_examples/` — Camada de exemplos de referência

Esta pasta é uma **referência de implementação** do padrão de tela CRUD do
projeto. **Não é produto** — nenhum arquivo aqui representa uma entidade real do
GB Cerne, e a rota `/exemplo` não aparece no menu (só é acessível por URL
direta). Ela existe isolada em `src/_examples/` justamente para **não poluir**
as pastas reais (`src/pages/`, `src/services/`, `src/hooks/`, `src/@types/`).

Pode ser **removida com segurança** quando o time estiver alinhado ao padrão.

## Padrão de ID: GUID (não Numeric ID)

Esta camada demonstra o padrão **GUID** (UUID), que é o **padrão da empresa para
projetos novos**: os hooks `useCustomFormQueryByGuid` / `useCustomGridQueryByGuid`
(em `src/hooks/`) validam o ID via regex de UUID.

Este projeto especificamente foi herdado do "Rank" e traz também hooks baseados
em **Numeric ID** (`useCustomFormQueryByNumericId`, `useCustomGridQueryByNumericId`,
em `src/hooks/`) — isso é uma **particularidade legada deste projeto**, não o
padrão. Use os `*ByNumericId` apenas se precisar interagir com uma API que exija
IDs numéricos.

## Organização MODULAR (o ponto principal desta camada)

Telas reais do projeto vivem em **`pages/<Módulo>/<Feature>/`** — não como
arquivos soltos. No projeto de referência (Rank), a feature de agentes fica em
`pages/Admin/Agents/`. Aqui o exemplo espelha isso com um módulo real do
domínio GB Cerne (**Cadastros**) e uma feature (**Recursos**):

```
src/_examples/
  README.md                                 <- este arquivo
  types/
    resource.d.ts                           <- DTOs específicos da feature (ver abaixo)
  services/
    resource-service.ts                     <- chamadas HTTP (api.V2), CRUD completo
  validations/
    resource-schema.ts                      <- schema Yup da feature (compõe a infra real)
  hooks/
    useResources.tsx                        <- query de listagem + query de detalhe (GUID)
  pages/
    cadastros/                              <- MÓDULO (domínio)
      recursos/                             <- FEATURE
        index.tsx                          <- LISTAGEM (grid + HeaderTable + FilterSide)
        CreateOrUpdateRecurso.tsx           <- CRIAR **e** EDITAR num só arquivo (com abas)
        HeaderTable.tsx                     <- SÓ botões de ação (Add / Filter)
        FilterSideRecursos.tsx              <- drawer de filtro (usa <FilterSide> real)
        RecursoConfiguracoesTab.tsx         <- 2ª aba (arquivo separado, só ao editar)
  translations/
    README.md                               <- onde mora a tradução REAL deste exemplo
```

### Os 5 arquivos padrão de uma tela de cadastro

1. **`index.tsx`** — a **listagem**. Grid paginado (TableProvider + Table),
   colunas via `createColumnHelper`, mutations (delete), e renderiza o
   `HeaderTable` + o `FilterSideRecursos`. É `index.tsx`, **não** `RecursoList.tsx`.
2. **`CreateOrUpdate<Feature>.tsx`** — criação **e** edição no **mesmo arquivo**
   (nunca dois separados). `const isEditing = isValidGuid(resourceId)` decide
   título, request (create vs update por delta de `dirtyFields`) e quais abas
   aparecem.
3. **`HeaderTable.tsx`** — **só os botões de ação** (Add / Filter). Não renderiza
   colunas da tabela.
4. **`FilterSide<Feature>.tsx`** — o drawer de filtro específico da feature.
5. **`<Feature>...Tab.tsx`** — aba extra em arquivo separado (opcional).

### Padrão de abas

Espelha o `CreateOrUpdateAgent.tsx` real:

- A **aba principal** ("Dados Gerais") fica **inline** no `CreateOrUpdateRecurso.tsx`.
- **Abas extras** (aqui "Configurações") são **componentes separados**
  (`RecursoConfiguracoesTab.tsx`) renderizados dentro de `<Tabs.Content>`, e só
  aparecem quando `isEditing` (ao criar, existe só a aba "Dados Gerais").

## O que a camada de exemplos NÃO recria (reutiliza do projeto real)

Peças **globais** do projeto **não** são duplicadas aqui — são **importadas**
direto da estrutura real. Isto é intencional: o exemplo só contém o que é
**específico da feature**. Reutilizados por `import`:

| Peça (real, do projeto)      | Import                          | Onde é usada             |
| ---------------------------- | ------------------------------- | ------------------------ |
| Botão "Novo"                 | `@/components/ButtonAdd`         | `HeaderTable.tsx`        |
| Botão "Filtros ( n )"        | `@/components/ButtonFilter`      | `HeaderTable.tsx`        |
| Casca do drawer de filtro    | `@/components/FilterSide`        | `FilterSideRecursos.tsx` |
| Contexto da tabela           | `@/hooks/useTable`               | `HeaderTable.tsx`        |
| Helper de validação          | `@/validations/field-validation-schema` | `resource-schema.ts` |
| Grid, form, inputs, dialogs  | `@/components/*`                 | `index.tsx` / form       |
| Auth / Theme / Language      | `@/hooks/*` (providers globais)  | todas as telas           |

O exemplo **não cria** Context/Provider próprio — usa `useLanguage()` etc. como
qualquer tela real.

O que cada subpasta ESPECÍFICA da feature demonstra:

- **types/** — 6 DTOs distintos: `ResourceData` (leitura da API),
  `ResourceForm` (estado do RHF), `CreateResourceRequest`, `UpdateResourceRequest`,
  `ResourceFilterForm` (drawer, com `Option<T>`) e `ResourceFilterRequest` (query
  achatada para a API).
- **services/** — CRUD via `api.V2`, tipando com `Response` / `ResponsePagination`.
- **validations/** — schema Yup da feature que **compõe a infra real**
  (`fieldValidationSchema`) e só sobrescreve o que é específico.
- **hooks/** — hooks de dados (query de grid + query de form por GUID).
- **pages/cadastros/recursos/** — a tela em si (os 5 arquivos acima).
- **translations/** — ver o README de lá: a tradução real **não** mora aqui.

## i18n

Os textos **não** são hardcoded. Toda string vem de
`languageGB.examples.resource.*`, navegando o caminho completo no ponto de uso
(sem atalho / constante intermediária). Ver `src/_examples/translations/README.md`
para onde a tradução real está registrada.
