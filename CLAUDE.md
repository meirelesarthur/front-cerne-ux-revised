# CLAUDE.md — GB Cerne Front (cópia revisada de UX)

> **Leia primeiro.** Este arquivo é o ponto de entrada para uma IA (ou pessoa) que vá **entender e
> aplicar** as mudanças de UX feitas neste repositório ao front de produção.
> `HANDOFF.md` é **legado** (descreve o shell vazio anterior ao baseline) — não use como referência.

## O que é este repositório

- **Front do GB Cerne** (React 18 + Vite 5 + Chakra UI v3 + TanStack Query + Yarn), recebido do time
  de Dev e **revisado visual e funcionalmente** para ficar fiel ao design system oficial **CERNE**
  (repositório `cerne`: tokens em `src/design/tokens.ts`, regras em `CLAUDE.md` dele).
- **Baseline:** a tag git **`ux-baseline`** é o front exatamente como foi recebido. **Tudo que mudou** está em
  `git diff ux-baseline HEAD` (≈ 850 arquivos). Por isso este repo é um *diff aplicável*, não um projeto novo.
- **Escopo das mudanças:** apresentação (tema, componentes, telas, textos i18n), a página de contratação de
  planos (regras comerciais novas), o menu, o login e a conciliação OFX. **Não** houve mudança de rotas de
  negócio, de contratos de API nem de serviços (`src/services/v2`) — exceto onde `docs/ux/funcionalidades/*.md` disser.
- **Fora de escopo (nunca alterar):** Dashboards e Relatórios.

## Ordem de leitura

1. **Este arquivo** (regras e mapa).
2. [`docs/ux/PORTING.md`](docs/ux/PORTING.md) — *como aplicar*, camada por camada, com assinaturas de busca e armadilhas.
3. [`docs/ux/MAPA-DE-MUDANCAS.md`](docs/ux/MAPA-DE-MUDANCAS.md) — **gerado**: diff por área, kit de componentes (para quê / quem usa), tokens novos,
   telas por padrão, commits. Regenere com `node scripts/ux-docs/gen-change-map.mjs`.
4. [`docs/ux/funcionalidades/<slug>.md`](docs/ux/funcionalidades/) — 1 arquivo por funcionalidade (o que mudou, por quê, como validar).
5. [`docs/ux/alinhamento-ds.md`](docs/ux/alinhamento-ds.md) (divergências DS × front), [`componentes-ds.md`](docs/ux/componentes-ds.md) (kit portado),
   [`auditoria-leis-ds.md`](docs/ux/auditoria-leis-ds.md), [`revisao-ondas-3-5.md`](docs/ux/revisao-ondas-3-5.md), [`README.md`](docs/ux/README.md) (ambiente local e mocks).

## As 5 Leis do DS (resumo operacional)

1. **Component-first** — tela só **compõe**. Todo visual reutilizável vive em `src/components/ui/` (ou no componente central já existente). Nunca estilize por cima na tela.
2. **Fonte única / propagação** — mude no tema, recipe ou kit **uma vez**; as telas herdam. Se você está repetindo estilo em 2 telas, falta um componente.
3. **Tokenização** — sem hex/rgba/px soltos. Cores = tokens semânticos em `src/styles/theme/semantic/{light,dark}.ts` (**declare nos dois** + `src/@types/theme.d.ts`). Fontes pela escala de `chakra.config.ts`.
4. **Commits atômicos** por funcionalidade, mensagem `tipo(escopo): descrição` em português sem acento (`feat(ui):`, `fix(ui):`, `docs(ux):`, `feat(dev-api):`). Co-autoria de IA no rodapé.
5. **Tokens W3C DTCG** — não atendida neste front (tokens vivem no tema Chakra); registrada em `auditoria-leis-ds.md`.

## Regras de arquitetura que você deve seguir

- **Kit primeiro:** antes de criar componente, procure em `docs/ux/MAPA-DE-MUDANCAS.md` (seção 2). Ex.: título de listagem = `PageHeader`; busca+filtros = `ListToolbar`; seção de formulário = `FormSection`; interruptor em linha = `ToggleRow`; etapa de wizard = `StepBody`/`StepHeader`/`StepFooter`; ícone = `<Icon name="…" />` (papéis em `src/design/icons.ts`, **nunca** importar biblioteca de ícone na tela do menu/kit).
- **i18n:** todo texto visível vem de `languageGB` (módulos em `src/constants/languages/language{PtBr,EnUs,EsEs}/` + tipo em `src/@types/language/module-*/`). Adicione a chave **nos 3 idiomas e no tipo**. Conteúdo de catálogo de produto (ex.: planos) pode ficar em PT no arquivo do catálogo.
- **Escala tipográfica (DS):** raiz **16px fixa** (`styles/theme/semantic/*.ts`, `html.fontSize: "100%"`); `base` = 13px (itens de menu/breadcrumb/botão filtro), `md` = 14px, `xl` = 16px (texto de campo), título de página 24px/700. Campo: altura 38px, contorno 1.5px, raio 8, foco verde (`focusGlow`). Controles de listagem (busca e Filtros): **34px** (`ui/listControl.ts`).
- **Menu:** itens do 2º nível 13px, linha de 36px **sem folga**; rótulo de grupo 11px/500 maiúsculo. Sem submenu "Produtos" (itens diretos em Estrutura).
- **Chakra v3 — armadilhas já vividas:** `<Text>` não herda `fontSize`/`fontWeight` do pai (use `fontSize="inherit"`); `as="button"` não aceita `type` nos tipos (passe por spread `{...({type:'button'} as Record<string,string>)}`); variante de recipe **vence** o `_focus` da base (declare o foco na variante); `Select.HiddenSelect` é um `<select>` oculto (ignore em auditorias de contraste).
- **Módulos fora do padrão antigo:** não crie `Container`+`HeaderGrid` novos; use `FormContainer` (com `headerActions`/`footer`) e `PageHeader`.

## Infraestrutura só de desenvolvimento (NÃO portar para produção)

`src/mocks/dev-api/**`, `src/services/v2/Auth/dev-auth-bypass.ts`, `scripts/dev-db/**`, `scripts/dev-mocks/**`, `scripts/ux-docs/**`.
Só existem em `yarn dev` (`import.meta.env.DEV`) e saem do bundle no `vite build`. Flags (`.env`, nunca versionado): `VITE_DEV_AUTH_BYPASS`, `VITE_DEV_MOCKS`, `VITE_DEV_MOCKS_API_FIRST`, `VITE_DEV_MOCKS_SYNTHETIC`. Detalhes em `docs/ux/README.md`.

## Comandos

```bash
npx tsc --noEmit -p .                                  # tipos (deve sair vazio)
npx vitest run <pasta-ou-arquivo>                      # testes (a suíte inteira é lenta e tem testes instáveis sob carga)
node scripts/ux-docs/gen-change-map.mjs                # regenera o mapa de mudanças
node scripts/dev-mocks/extract-schemas.mjs             # regenera os schemas do mock sintético (após mudar tipos/serviços)
git diff ux-baseline HEAD -- <caminho>                 # ver o que mudou num arquivo/pasta
```

Falhas **pré-existentes** (também no baseline): 3 testes em `CreateOrUpdateEntradaInsumos-crash-repro`; specs Playwright em `e2e/` aparecem como "arquivos falhos" no vitest; alguns testes de NF-e/Emissor estouram timeout só sob carga (passam isolados).

## Regras de segurança do repositório

- Nunca versionar `.env`, dump de banco ou dado pessoal real. Dados em mocks são **fictícios** (e-mails `.test`, documentos inventados).
- Dashboards e Relatórios: não tocar.
- Não force-push nem reescreva a tag `ux-baseline`.
