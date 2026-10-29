# Melhorias de UX — GB Cerne Front

Fluxo de trabalho para aplicar melhorias de UX neste front e devolver ao time de Dev
com rastreabilidade (o que mudou, por quê, onde, como validar).

## Como rodar localmente (sem backend)

1. `cp .env.example .env` e deixe `VITE_DEV_AUTH_BYPASS=true` (somente no seu `.env`).
2. `npx --yes yarn@1.22.22 install --frozen-lockfile --ignore-scripts` (o projeto usa Yarn).
3. `npx vite --host --port 5180 --strictPort` → http://localhost:5180
4. Na tela de login, qualquer e-mail/senha entra (usuário fictício, todas as permissões).

### Dados simulados (mocks de dev)

Com `VITE_DEV_MOCKS=true` (só `.env` local, só em modo dev), um adapter do axios
(`src/mocks/dev-api/`) responde no lugar do backend:

- **Rotas registradas** (`handlers/*.ts`) devolvem dados realistas: hoje Fazendas
  (sintético), Bancos, Estados e Cidades (reais, do dump `init_db.sql`).
- **Mock sintético (padrão, cobre TODAS as telas):** qualquer rota de `src/services/v2/**` responde com dados
  fictícios no formato certo (15 linhas por lista, busca e paginação, detalhe = mesma linha da lista,
  criar/editar/excluir em memória — some ao recarregar). Veja a seção "Mock sintético" abaixo.
- **Rotas sem tipo conhecido** devolvem lista vazia (GET) ou sucesso genérico (escrita). Para deixar essas
  rotas irem à rede real: `VITE_DEV_MOCKS_FALLBACK=false`.
- Para simular uma tela nova: crie `handlers/<recurso>.ts` (lista `MockRoute[]`) e some
  em `src/mocks/dev-api/index.ts`. Copie o contrato do `*-service.ts` da tela.

### Mock sintético (todas as telas, sem banco)

`src/mocks/dev-api/synthetic.ts` + `src/mocks/dev-api/generated/schemas.json`.

1. **Schemas:** `node scripts/dev-mocks/extract-schemas.mjs` lê com o compilador do TypeScript cada chamada `api.V2.<verbo><Tipo>('/rota')` dos
   serviços e grava o **formato** da resposta (campos, enums, aninhamento; ~1.400 rotas, ~220 KB). Rode de novo quando mudar tipos ou serviços.
2. **Dados:** o gerador preenche cada campo por **nome e tipo** (e-mail `.test`, telefone, CPF/CNPJ fictícios, datas, valores, enums, rótulos coerentes
   `x` → `x_label`). Determinístico: a mesma rota devolve sempre as mesmas linhas. Nenhum dado real.
3. **Coleções:** `/recurso` (15 linhas, `per_page`/`page`/`search`/filtros simples), `/recurso/:id` (mesma linha, em formato de detalhe), `/recurso/options`
   (mesmos ids). `POST` cria no topo, `PUT/PATCH` altera, `DELETE` remove — tudo em memória.
4. **Flags (`.env`):** `VITE_DEV_MOCKS=true` liga; `VITE_DEV_MOCKS_SYNTHETIC=false` desliga só o sintético; `VITE_DEV_MOCKS_API_FIRST=true` tenta antes a API
   local de dev (`scripts/dev-db`) e usa o sintético só onde ela não atende (resposta com cabeçalho `x-dev-fallback`) ou está fora do ar.
5. **Limites:** não há validação (salvar sempre dá certo); relações entre recursos são só visuais (ids estáveis por nome de campo); telas que montam dados por
   regra própria (dashboards, relatórios) mostram o que o tipo permite.

### Dados REAIS locais (API de dev + PostgreSQL do dump)

Para telas com volume e dados de verdade, o dump é restaurado num PostgreSQL local e uma
API de dev (somente leitura) serve o contrato do front. **Nada disso vai para o git.**

| Peça | Onde | Como |
|------|------|------|
| PostgreSQL 17 portátil | pasta local `devdb\pg` fora do repositório (dados em `devdb\data`, porta **54329**, banco `gbcerne`; usuário e senha só no ambiente local) | `devdb\pg\pgsql\bin\pg_ctl.exe -D devdb\data -l devdb\pg.log start` |
| API local de dev | `scripts/dev-db/server.mjs` (Node + `pg`) | `cd scripts/dev-db && npm install` (1ª vez) → `node scripts/dev-db/server.mjs` → http://localhost:8080/api/v1 |
| Front | `.env`: `VITE_API_PHP_BACK_URL=http://localhost:8080/api/v1`, `VITE_DEV_AUTH_BYPASS=true`, `VITE_DEV_MOCKS=false` | login de dev continua local (qualquer e-mail/senha) |

- Escopo: um contratante (`DEV_TENANT_ID`, default 5 — o de mais fazendas). Trocar: `DEV_TENANT_ID=519 node scripts/dev-db/server.mjs`.
- Recursos servidos hoje: fazendas, pessoas, bancos, estados, cidades, centros de custo, plano de contas, produtos, armazéns, embalagens — **somente leitura** (cidades, estados, centros de custo, produtos, armazéns, fazendas, pessoas) — e, **com escrita em memória** (salvar/editar/excluir funcionam até reiniciar a API): importação OFX/conciliação, **safras (com semanas)**, **usuários**, **perfis**, **bancos**, **plano de contas**, **embalagens** e **centros de custo**. O restante cai no fallback (lista vazia).
- O dump é o schema **legado** (sem UUID): a API gera UUIDs determinísticos e reversíveis (`scripts/dev-db/lib/http.mjs`). Escritas não vão ao banco (fica intacto); os recursos com estado em memória voltam ao inicial ao reiniciar a API (`node scripts/dev-db/server.mjs`).
- Novo recurso: crie `scripts/dev-db/resources/<recurso>.mjs` (lista de rotas) e registre em `server.mjs`; o contrato sai do `*-service.ts` e dos tipos em `src/@types/v2/`.
- Mocks axios (`VITE_DEV_MOCKS=true`) continuam existindo para trabalhar **sem** Postgres.

**Dump do banco (`init_db.sql`, PostgreSQL, schema legado `gbcerne`)** — é uma base real
(pessoas, fornecedores, financeiro). Regras: (1) não commitar dado pessoal; (2) só
catálogos de referência são extraídos, via
`node scripts/dev-mocks/extract-reference.mjs <init_db.sql>` (lista fechada em
`REFERENCE_TABLES`); (3) dados de pessoas/fazendas/financeiro nos mocks são **sintéticos**,
inspirados no formato do dump. O schema do dump é o legado: o front usa a API nova
(UUID, contrato Laravel), então o dump serve de base de volume/forma, não de fonte direta.

Limites: telas que dependem de dados sem handler aparecem vazias. Para melhorias nelas,
crie o handler primeiro e documente o estado usado.

> O bypass vive em `src/services/v2/Auth/dev-auth-bypass.ts`, só existe em `yarn dev`
> (`import.meta.env.DEV`) e a flag vem **desligada** no `.env.example`. Não commitar `.env`.

## Organização: 1 arquivo por funcionalidade

Cada funcionalidade (Fazendas, Clientes, Produtos…) tem **um único arquivo** em
`funcionalidades/<slug>.md`, com todas as ações dela (listar, filtrar, adicionar,
editar, excluir…) e o **registro cronológico de todas as edições** feitas ali.

- Modelo: [`_TEMPLATE-funcionalidade.md`](_TEMPLATE-funcionalidade.md)
- Exemplo iniciado: [`funcionalidades/fazendas.md`](funcionalidades/fazendas.md)
- Imagens: `assets/<slug>/NNN-antes.png` e `assets/<slug>/NNN-depois.png`

## Fluxo

1. Funcionalidade nova: copie o modelo para `funcionalidades/<slug>.md`, preencha o
   cabeçalho (rota, pasta em `src/pages`, permissões) e a tabela *Resumo por ação*.
2. Antes de codar: abra um bloco no *Registro de edições* (problema + proposta + print antes).
3. `git checkout -b ux/<slug>-NNN`; implemente pequeno e isolado, com tokens/recipes do
   tema e textos via `languageGB` (caminho completo — ver README raiz).
4. Complete o bloco (mudanças técnicas, como validar, print depois), atualize a tabela
   *Resumo por ação* e o índice abaixo. Commit: `ux(<slug>): resumo`.
5. Entrega ao Dev: o arquivo da funcionalidade + `git diff <baseline>..HEAD`.

## Índice de funcionalidades

| Funcionalidade | Arquivo | Ações cobertas | Edições | Status geral |
|----------------|---------|----------------|---------|--------------|
| Fazendas | [fazendas.md](funcionalidades/fazendas.md) | listar, filtrar, adicionar, editar, excluir, áreas | 0 | a levantar |

Status: `proposta` · `implementada` · `validada` · `entregue ao Dev`.

## Mudanças de ambiente (não são melhorias de UX)

| Data | Mudança | Arquivos |
|------|---------|----------|
| 2026-10-19 | Imports `@/constants/{relatorios,fiscal,financial}` normalizados para o nome real das pastas (`Relatorios`, `Fiscal`, `Financial`). Quebrava no Windows e quebraria em Linux/Docker (case-sensitive). **Dev deve aplicar.** | ~60 arquivos em `src/` (ver commit baseline) |
| 2026-10-19 | `.claude/launch.json`: porta 5180 (5173 ocupada por outro projeto local). | `.claude/launch.json` |
| 2026-10-19 | Bypass de login só-dev. **Não deve ir ao repositório oficial** (ou ir desligado). | `src/services/v2/Auth/dev-auth-bypass.ts`, `auth-service.ts`, `.env.example` |
| 2026-10-19 | `.gitignore` tinha a regra `Docs`, que no Windows ignora `docs/`; adicionada exceção `!/docs/`. | `.gitignore` |

## Alinhamento ao Design System

Mapa de divergências e plano em ondas: [alinhamento-ds.md](alinhamento-ds.md).

### Safras e Usuários na API local (2026-10-28)
`scripts/dev-db/resources/harvests-users.mjs` — dados **fictícios** (nomes, e-mails `.test`, CPFs de teste), sem relação com o dump:
- **Safras:** 3 safras com semanas (`GET/POST/PUT/DELETE /harvests`, `/harvests/active`), busca `search`, filtro `is_enabled`, validação 422 (descrição, datas, duplicidade) e upsert de semanas por `number_week`.
- **Usuários e perfis:** 4 usuários e 4 perfis (`GET/POST/DELETE /users`, atualização por `POST /users/:uuid` com `_method=PUT`, `PATCH /users/:uuid/status`, `/users/boss-options`, `/roles`); aceita `multipart/form-data` (o servidor ganhou um leitor simples de multipart; arquivos viram só o nome). Regras: e-mail único e obrigatório, perfil obrigatório, senha obrigatória na criação. Os usuários de exemplo já vêm com fazendas (a tela exige ao menos uma).
- Respostas de erro (404/422) usam o envelope do backend (`success:false`, `errors` por campo).

### Bancos, Plano de Contas e Embalagens com escrita simulada (2026-10-28)
`scripts/dev-db/resources/writes.mjs` — **camada em memória sobre o dump** (o dump segue intacto; criações, edições e exclusões valem até reiniciar a API; ids novos partem de 900001). As rotas são registradas antes das originais e envolvem as leituras (lista/detalhe/opções refletem a camada):
- **Bancos:** `POST/PUT/DELETE /banks`; 422 para código/nome obrigatórios e código duplicado (a tela mostra o erro no campo).
- **Plano de Contas:** `POST/PUT/DELETE /plan-accounts`; código gerado como na prévia (`/plan-accounts/code-preview` já considera as contas criadas); edição não muda conta-pai/código; 422 para descrição/condição e conta-pai não sintética; exclusão bloqueada se houver contas filhas.
- **Embalagens:** o front usa `/product-packages` (a API só tinha `/packages`, então a lista vinha vazia): agora lista/detalhe/opções + `POST/PUT/DELETE` e `/measurements/options` para o seletor de unidade; 422 por campo.
- **Centros de custo:** `POST/PUT/DELETE /cost-centers` (código gerado, rateio, 422, exclusão bloqueada com filhos) — ver [funcionalidades/centro-de-custo.md](funcionalidades/centro-de-custo.md).
- **Cidades:** sem escrita — o módulo é só consulta no front (não há serviço de escrita nem tela de formulário).
- Validado pela UI: criar, editar e erro 422 em Bancos; criar e editar em Plano de Contas; criar em Embalagens (editar/excluir validados na API).

### Fechamento das pendências (2026-10-28)
- **Dev bypass:** o usuário de dev é `Administrador`; para testar como `Gestor_Plataf` (libera "criar centro de custo de topo", mas esconde "Nova fazenda"): `localStorage.setItem("dev-auth-roles","Administrador,Gestor_Plataf")` e recarregar (`src/services/v2/Auth/dev-auth-bypass.ts`).
- **Perfil:** não existe tela equivalente no DS; o interruptor "Visível ao usuário" passou a usar `ToggleRow` (com a dica em tooltip). **Embalagens:** já iguala o DS (Descrição, Quantidade, Unidade) — sem divergência.
- **Safras (422):** as chaves do 422 da API de dev (`description`, `start_date`, `end_date`) batem com os campos do form e o mapeamento por `setError` é o mesmo validado ao vivo em Bancos.
- **Tema escuro (auditoria programática de contraste em listas e formulários de Cadastros Base):** corrigidas as reticências da paginação (`semanticNeutral.500`) e o foco dos campos — novo token `focusGlow` (claro 12%, escuro 35%) e contorno verde no foco nas variantes `outline`/`outline2` do input (antes a variante sobrescrevia o `_focus`). Selects usam o mesmo token.
- **Testes:** `tsc` limpo; vitest sem regressões (3 falhas conhecidas em `CreateOrUpdateEntradaInsumos-crash-repro`, NF-e instável sob carga, e specs Playwright de `e2e/` contados como "arquivos falhos" pelo vitest — configuração pré-existente).

### Tipografia/espaçamento do menu e campo de imagem (2026-10-28)
- **Medido no DS (5190) × aqui (5180):** itens do submenu 13px/400 (aqui 14px — o `<Text>` interno não herdava o tamanho do pai), breadcrumb 13px (aqui 14px), rótulo de grupo 11px/**500** (aqui 400), linha de 36px **sem folga** entre itens (aqui havia `gap` de 8px → passo de 44px). Agora: 13px, linhas de 36px, passo de 36px, breadcrumb 13px, rótulo 11px/500. A raiz do documento agora é **fixa em 16px** como no DS (antes escalonava 14/15/16px por largura em `styles/theme/semantic/{light,dark}.ts`); conferido em 1440 e 1024px sem rolagem horizontal da página.
- **Busca × Filtros:** altura única em `components/ui/listControl.ts` (`LIST_CONTROL_HEIGHT`, 34px) usada pelo campo de busca (`ListToolbar`) e pelo `ButtonFilter`, com `box-sizing` explícito e a linha esticada.
- **`ImageUpload` redesenhado:** ocupa metade da largura (≥ lg); vazio = área tracejada com ícone em tile, título e dica de formato/tamanho; preenchido (cadastro existente ou arquivo escolhido) = cartão com miniatura 96px, nome/tamanho e ações Trocar/Remover.

### Situação em tag (sem bolinha e sem legenda) (2026-10-29)
- Novo kit `components/ui/StatusTag.tsx`: pílula com o fundo na cor da situação e o texto **branco** (preto só em fundos realmente claros, ex.: amarelo/verde-claro), calculado pela cor resolvida — acompanha claro/escuro. Aceita token do tema (`supplyStatus3`, `green.500`) ou cor CSS.
- Todas as listagens que tinham **bolinha colorida + linha "Legenda:"** agora têm uma coluna **Situação** (`defaltStrings.statusColumn`) com a tag escrita na própria linha e a legenda foi removida: Compras/Suprimentos (Solicitação, Cotações, Autorização, Compras, Meus Processos, Recebimentos, Rejeitados, SLA), Operacional (Apropriações, Orçamentos, Contratos de Venda, Pedidos, Vendas, Planejamentos, Monitoramento, Minhas OS, Lista de OS, Avaliações, Pesagem Rodoviária, Acasalamento, Pastagem, Transferências de animais/lotes, Currais) e Frota (Transferências). Fiscal (CT-e, DF-e, MDF-e): coluna de integração com tag Pendente/Integrado.
- Componentes de legenda sem uso foram removidos (`RequestPurchaseStatusLegend`, `ModuleWeighingStatusLegend`). Telas de detalhe/formulário mantêm o `Status` (bolinha + texto) por ora.

### Build/deploy (Yarn)
`package.json` fixa `"packageManager": "yarn@1.22.22"`: o `yarn.lock` é do Yarn 1 e plataformas que detectam o Yarn 4 falhavam com "The lockfile would have been modified by this install" (YN0028).

### Cobertura do mock sintético (2026-10-29)
- Varredura das 359 rotas do menu em `yarn dev` com `VITE_DEV_MOCKS=true`: **nenhuma** queda de tela e **nenhuma** rota caindo no "vazio genérico" (`window.__mockMisses` no console lista as que cairem — hoje vazio).
- Ajustes que a varredura trouxe: campos de data com nomes `dt_*`/`*_emission`/`deadline`/`validity` agora saem em ISO; listas de tipo recursivo/desconhecido (ex.: `children` de árvores) saem vazias em vez de `[null]`; `DELETE` sem tipo no serviço remove o registro em memória.
- Telas que seguem sem linhas por desenho: filtros obrigatórios antes de listar (fluxo bancário, XML, DF-e recebidas), exportações e telas "em construção".
- Build de produção: `npm run build` aumenta o heap do Node (`--max-old-space-size=6144`) para `tsc` e `vite build` (a plataforma de deploy estourava os 2 GB padrão).
