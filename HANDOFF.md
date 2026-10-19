# HANDOFF — GB-CERNE-FRONT (shell preparado para o time de front)

> Este documento é o ponto de partida para quem for construir as telas reais do GB Cerne
> em cima deste shell. Leia antes de tocar em qualquer coisa.

## O que é este projeto hoje

Era uma cópia integral de outro produto (SaaS de pentest, "Rank"). Foi reduzido a um
**shell mínimo**: infraestrutura (auth, roteamento, tema, layout) mantida e adaptada,
todas as telas de domínio removidas, visual portado do design system
[`GB CERNE`](../cerne) (Storybook + tokens em `cerne/src/design/tokens.ts`).

Não há telas de produto ainda — só Login, uma **Home estruturada** (cards de módulo +
painéis de exemplo, dado ilustrativo) e as páginas de módulo "em construção" que
espelham a árvore de navegação completa do design system (11 módulos, 26 grupos, 150
itens-folha). **Isso é esperado.**

## Chrome do layout (canvas + cards flutuantes)

O shell replica a composição visual do cerne: um canvas de fundo (`bodyBackground`)
com dois "cards" flutuando com margem de ~8px — a Sidebar (raio de canto grande) e o
card de conteúdo (`contentOuterBG`, envolve Topbar+SecondaryNav+página). Sem bordas
duras entre header/sidebar/body — a Topbar é transparente, herda o fundo do card.

- **Clique em área vazia da sidebar** alterna colapsar/expandir (não precisa de botão
  dedicado). O botão de recolher (ícone) só existe na logo quando ela está ABERTA;
  quando colapsada, não há ícone de abrir — é só clicar em qualquer espaço vazio.
- Botões de módulo, itens do rodapé (notificações/tema/planos/config/idioma/logout)
  usam `stopPropagation()` pra não disparar esse toggle sem querer — **inclusive os
  módulos com submenu**, diferente do cerne (lá clicar num módulo TAMBÉM colapsa a
  sidebar, porque é tudo state local; aqui os módulos navegam de verdade via Router,
  então deixamos a sidebar aberta ao abrir o SecondaryNav — decisão deliberada,
  documentada no código de `NavRail.tsx`).
- Token novo: `contentOuterBG` (bg.outer do cerne) em `semantic/{light,dark}.ts` —
  distinto de `cardBG`/bg.surface (usado por cards internos menores).

## Login — animação de sucesso (timing)

O checkmark verde "Acesso autorizado" só é visível porque a sequência foi invertida:
`Login/index.tsx` mostra o sucesso e segura ~700ms **ANTES** de chamar `signIn()` — não
depois. Motivo: `signIn()` já dispara `navigate('/home', {replace:true})` de forma
síncrona ao resolver (ver `AuthContext`), então mostrar o sucesso DEPOIS do `signIn()`
nunca chegava a renderizar (a página já tinha sido desmontada). Se for mexer nesse
fluxo, preserve essa ordem (validar → mostrar sucesso → segurar → só então autenticar).

## Mocks de rede residuais (padrão "MOCK TEMPORÁRIO")

Além do `auth-service.ts` (login/profile/refresh/logout), dois mecanismos PERIFÉRICOS
bypassavam o mock batendo em rede real e foram neutralizados com o mesmo padrão de flag
(`// MOCK TEMPORÁRIO`, fácil de reverter quando a auth real voltar):
- `src/hooks/useSessionValidator.tsx` — polling de `/auth/me` a cada 30s.
- `src/services/v2/Auth/token-manager.ts` (`executeRefresh`) — renovação proativa de
  token via `axios.post('/auth/refresh')` cru (fora do `auth-service.ts`).

Se aparecer "Network Error" novo no console rodando o mock, é sinal de mais algum
mecanismo parecido que ainda não foi pego — procure chamadas `axios`/`api.V2` fora de
`auth-service.ts` na trilha de autenticação.

## Stack

- React 18.2 + Vite 5 + TypeScript + **Chakra UI v3.36.0** (atualizado de 3.33.0)
- TanStack Query, Zustand, React Router 6, Axios, React Hook Form + Yup
- Yarn como gerenciador de pacotes

```bash
yarn install
yarn dev      # sobe em http://localhost:5175 (ver vite.config.ts)
yarn build
npx tsc --noEmit
```

Repo é um **git local sem remoto** (foi inicializado nesta rodada de preparação, não
existia antes). Histórico relevante, em ordem:

```
fe55f39 baseline antes da limpeza
78861ce upgrade Chakra 3.33.0 -> 3.36.0
14232c5 shell mínimo (remove domínio pentest/SaaS, mantém módulo de exemplo)
47a1bc8 paleta e tokens do cerne no tema Chakra
48fa09c Sidebar e Topbar fiéis ao cerne
21396d3 Login fiel ao cerne + auth mockada
7b41611 rebranding Rank -> GB Cerne + remove código morto
f7b8b84 correções pós browser-check
```

## Login — auth está MOCKADA (temporário)

**Qualquer email/senha não vazios entram.** Não há backend real por trás ainda.

- O mock vive só em `src/services/v2/Auth/auth-service.ts` (funções `login`,
  `getUserProfile`, `refreshToken`, `logout`). Latência simulada de 300-600ms.
- `src/contexts/AuthContext/index.tsx` teve **uma única mudança aditiva** (o resto da
  lógica de auth não foi tocado): `setSuppressLoadingOverlay(bool)` no contexto —
  quando `true`, suprime o overlay genérico `<Loading/>` mesmo com `loading===true`.
  Existe porque `signIn()` mantém `loading=true` do início ao fim (só reseta no
  `finally`, depois do `navigate`), e sem essa válvula de escape o `<Loading/>`
  genérico substituía a splash oficial do pós-login no meio da transição (ver
  `Login/index.tsx` → `handleSplashDone`). A troca por auth real é, fora isso, só
  na camada de service (`auth-service.ts`), reimplementando as mesmas funções com
  chamadas reais via `services/api.ts` (que já tem os interceptors prontos, só não
  está sendo chamado enquanto o mock estiver ativo).
- 2FA **não é acionado** pelo mock (login sempre retorna sucesso direto), mas as
  telas de 2FA/Forgot/Reset password continuam existindo em `src/pages/Login/` caso
  a auth real volte a precisar delas.
- **`src/hooks/useSessionValidator.tsx` está DESATIVADO** (flag
  `SESSION_VALIDATION_DISABLED_MOCK_AUTH` no topo do arquivo) — esse hook faz
  polling de `/auth/me` a cada 30s contra a API real; sem backend ele só gera erro
  de rede no console. **Remover o early-return quando a auth real voltar.**
- **Splash screen oficial pós-login** (`src/components/SplashScreen.tsx`, porte fiel
  do protótipo — gomos do "C" animando + nome + tagline, ~4.8s de coreografia com
  fade-out embutido nos últimos 400ms). **É GLOBAL, não vive dentro do Login**:
  `src/stores/splashStore.ts` (Zustand, `show()`/`hide()`) + `src/components/
  GlobalSplash.tsx`, renderizado em `App.tsx` como IRMÃO do `AuthProvider` (fora
  dele, de propósito). Fluxo: `Login` chama `showSplash()` e `signIn()` **em
  paralelo** (não espera a splash terminar pra autenticar) — o mock resolve em
  ~300-600ms e já navega pra `/home` bem antes dos 4.8s; a splash (global, com seu
  próprio timer fixo) continua cobrindo a tela até terminar sozinha, revelando a
  Home já pronta por baixo. Isso evita duas armadilhas já corrigidas:
  1. **Onde ela mora importa.** Se a splash for filha do `Login` (ou de qualquer
     coisa dentro do `AuthProvider`), ela é engolida pelo early-return `if (loading)
     return <Loading/>` do `AuthContext` (troca a árvore INTEIRA) ou desmontada
     junto quando a rota troca — revelando o login/`Loading` genérico por baixo
     antes da Home estar pronta. Por isso ela é irmã do `AuthProvider`, não filha.
  2. **`onDone` precisa de referência estável.** O `useEffect` interno da
     `SplashScreen` depende de `onDone` pra agendar o `setTimeout` de 4.8s — se essa
     função for recriada a cada render do componente que a chama, o timer reinicia
     toda vez e ela nunca termina. Como agora `onDone` é a action `hide` do Zustand
     (estável por natureza), esse problema não se repete — mas se essa lógica for
     movida de novo pra dentro de um componente com estado local, use
     `useCallback` com deps estáveis.
  `setSuppressLoadingOverlay` (no `AuthContext`) é mantido como segurança extra,
  ligado durante o `signIn()`, mas hoje é redundante pra esse fluxo específico (a
  splash global já cobre tudo por cima, inclusive o `<Loading/>` genérico).

## Tema e paleta

Fonte de verdade visual: `/Users/vladimirsantos/Projeto-empresa/MCPs/cerne` (Storybook).

- `chakra.config.ts`, `src/styles/theme/color-tokens.ts`,
  `src/styles/theme/semantic/{light,dark}.ts` — valores portados do cerne (verde
  `#059669`/`#047857`/`#064e3b`, neutros, feedback success/error/warning/info).
- **Detalhe importante:** a cor primária do app já era `blue.*` internamente (não
  `green.*` como uma auditoria inicial supôs). Para não reescrever ~120 referências
  em recipes/tokens semânticos, **as duas rampas (`green` e `blue`) foram repontadas
  para o mesmo verde do cerne** — é assim que a UI toda virou verde sem trocar nomes
  de token. Se for fazer uma limpeza de nomenclatura futura, saiba disso antes.
- Fonte trocada de Inter para **Outfit** (Google Fonts, carregada via `<link>` no
  `index.html`, mesmo mecanismo do cerne).
- **Pendente:** recipes de `Alert`/`Badge` ainda não apontam para os novos tokens
  `colors.feedback.*` (existem, prontos pra uso, só não foram religados nos
  recipes). `button.ts` tem 1-2 valores hex/px literais que resolvem certo mas
  merecem virar token quando alguém mexer nesse recipe de novo.

## Login — fidelidade 100% ao protótipo cerne

O Login (`src/pages/Login/index.tsx`) replica o protótipo real do cerne
(`localhost:2020` no ambiente de design), incluindo:

- **Vídeo de fundo real** (não é gradiente/placeholder): 5 vídeos hospedados num
  **CDN público Cloudflare R2** (`https://pub-0f1e695318f140f895ccdb13696c1c62.r2.dev/
  {agricultura,apicultura,avicultura,ovicultura,Psicultura}.mp4`), trocando a cada ~5s
  em sincronia com o carrossel de texto. **Dependência externa** — se esse CDN sair do
  ar ou mudar de dono, os vídeos quebram; considerar auto-hospedar antes de produção.
  Respeita `prefers-reduced-motion` (não autoplay se o usuário pedir menos movimento).
- Badge "Todos os sistemas operacionais", copy exata ("Entrar na sua conta",
  "Acessar plataforma", placeholder `voce@suafazenda.com.br`), SSO só Google (sem
  Microsoft), selo de confiança (SSL 256-bit / LGPD Conforme / 99,7% uptime).
- **Decisão de marca (documentada, pode ser revista):** o protótipo original usa só
  "CERNE" no logo/textos da tela de login; mantivemos **"GB Cerne"** por consistência
  com o resto do app (Sidebar/Topbar já usam "GB Cerne"). O ícone do logo foi trocado
  pelo desenho de escudo/diamante do protótipo.

## Navegação — arquitetura de 3 painéis (fiel ao cerne)

A navegação NÃO é mais uma sidebar flat de 10 itens — é a árvore completa do cerne
(11 módulos, 26 grupos, 150 itens-folha), com 3 painéis:

1. **Sidebar primária** (`src/components/Layout/NavRail.tsx`, 240px expandida / 56px
   colapsada) — só ícone+label do módulo. "Home" navega direto (não tem filhos); os
   outros 10 módulos abrem/fecham o painel do meio ao clicar (não navegam sozinhos).
   Rodapé: Notificações, **toggle de tema** (mora aqui, não no Topbar — fiel ao
   protótipo), "Planos" (ícone Gem → `/planos`, placeholder), Configurações
   (decorativo, sem ação — assim mesmo no protótipo original).
2. **SecondaryNav** (`src/components/Layout/SecondaryNav.tsx`, 224px, novo) — só
   existe quando um módulo-com-filhos está expandido. Mostra `flatItems` (lista
   simples) ou `groups` (seções colapsáveis, abre sozinho o grupo que contém o item
   ativo). Clicar num item-folha navega de verdade (`useNavigate`).
3. **Conteúdo** — cada item-folha tem uma rota real e deep-linkable (catch-all por
   módulo em `src/router/index.tsx`, ex. `/cadastros-base/*`), renderizando um
   placeholder genérico "Em construção" que descobre seu próprio label/ícone
   batendo o pathname contra a árvore.

- **Dados da árvore:** `src/config/v2/navigationTree.ts` (novo arquivo — substituiu
  o antigo `mainMenu.ts`, que ficou ÓRFÃO no disco, preservado mas não usado; pode
  deletar). Helpers: `findModuleByPath`, `getModuleById`, `findItemByPath`,
  `getAllModuleItems`. **É aqui que se adiciona/edita módulo, grupo ou item.**
- **`expandedModuleId`** (estado em `DashboardLayout.tsx`) decide qual módulo tem o
  SecondaryNav aberto — é inicializado a partir da ROTA atual (deep-link funciona)
  e alternado por cima ao clicar num módulo na sidebar primária. Resolvido via
  `getModuleById`, não pelo módulo da rota — **cuidado se for mexer aqui**: um bug
  já apareceu nessa área (painel não abria ao clicar num módulo fora da rota atual)
  e foi corrigido no commit `636e509`.
- **Ícones:** biblioteca `lucide-react` (nova dependência, adicionada só pra bater
  1:1 com os ícones do protótipo) — os ícones do resto do app (`react-icons`)
  continuam onde já estavam, as duas libs convivem.
- `src/components/Header/index.tsx` = Topbar (breadcrumb 3 níveis "Início › Módulo
  › Item" + busca decorativa "⌘K" + notificações decorativas). **Sem** toggle de
  tema (está na sidebar).
- Trocar um placeholder pela tela real: aponte a rota específica daquele item em
  `src/router/index.tsx` para o componente novo (a rota catch-all do módulo
  continua cobrindo os demais itens ainda não implementados).

## Módulo de exemplo — padrão de referência (NÃO é produto)

Ao limpar o domínio antigo, foi preservado **um módulo vertical completo
sanitizado** (extraído do antigo "MCPServers", renomeado para "Recurso"/"Resource")
só para servir de referência de convenção — como estruturar uma tela de listagem +
formulário seguindo o padrão já usado no projeto:

| Camada | Arquivo |
|---|---|
| Página lista + form | `src/pages/_example/` |
| Service (GET/POST/PATCH/DELETE via `api.V2`) | `src/services/v2/_example/resource-service.ts` |
| DTOs | `src/@types/v2/_example/index.d.ts` |
| Hooks de query | `src/hooks/v2/_example/useResources.tsx` |
| queryKey | entrada `_example.*` em `src/constants/query-key.ts` |

Rota real registrada em `/exemplo` (funciona de ponta a ponta, autenticado), **fora
do menu visual** — só acessível por URL direta. Use como referência de "como o
projeto espera que um CRUD seja estruturado", depois pode apagar quando não precisar
mais.

## Pendências conhecidas (declaradas, não escondidas)

1. **Favicon/ícones PWA** (`public/icons/**`, ~90 PNGs) ainda têm a arte antiga
   (losango azul). Não havia ferramenta de rasterização SVG→PNG disponível nesta
   rodada — regenerar a partir de `src/assets/{Logo.svg,logo-min.svg}` com alguma
   ferramenta própria (Figma, ImageMagick, etc.) e sobrescrever os PNGs.
2. **`src/assets/logo-small.svg`** ficou órfão em disco (sem uso) — seguro deletar.
3. **`src/assets/logo-gb-armazem*.png`** e os componentes que os usam
   (`CardPublic.tsx`, `CardImprintInfo.tsx`, `ModalQRCode.tsx`) são código morto de
   OUTRO produto GB, não tocados por estarem fora do escopo desta limpeza — nenhuma
   rota viva os importa hoje.
4. **Recipes de Alert/Badge** não repontados pros tokens `feedback.*` (ver seção
   Tema acima).
5. **Idioma:** o projeto suporta pt/en/es (`src/constants/languages/`), default
   agora é **BR** (era US, causava mistura de idioma na tela de login). Os textos
   institucionais do carrossel de login foram escritos direto em PT-BR (não
   passaram pelo sistema de i18n) — se o produto realmente for multi-idioma, vale
   integrá-los ao dicionário central depois.
6. **Mobile/responsivo** do Sidebar/Topbar foi preservado do comportamento anterior,
   mas não foi validado pixel-a-pixel contra o cerne (o design de referência não
   documenta breakpoint mobile de sidebar).
7. Busca (⌘K) e notificações no Topbar são **decorativas** — sem lógica real ainda.

## Onde NÃO mexer sem necessidade

- `src/contexts/AuthContext/index.tsx` — só muda quando a auth real substituir o mock.
- `services/api.ts`, `token-manager.ts` — interceptors prontos, só não estão em uso.
- Estrutura de rotas/guards (`PrivateRoute`/`PublicRoute`) — simplificada, funcional.
