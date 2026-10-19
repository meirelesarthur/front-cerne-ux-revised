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
- **Rotas não registradas** devolvem lista vazia (GET) ou sucesso genérico (escrita),
  então toda tela abre e mostra o estado vazio em vez de erro de rede. Para deixar essas
  rotas irem à rede real: `VITE_DEV_MOCKS_FALLBACK=false`.
- Para simular uma tela nova: crie `handlers/<recurso>.ts` (lista `MockRoute[]`) e some
  em `src/mocks/dev-api/index.ts`. Copie o contrato do `*-service.ts` da tela.

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
