# Tutorial guiado (Driver.js) · "Primeiros passos"

Tutorial que ensina o cliente novo a usar o Cerne **fazendo**: balões que apontam para a tela real, atravessam rotas e ficam salvos. **Só existe para quem chegou pelo fluxo "Criar conta"** (ver [onboarding-criar-conta.md](onboarding-criar-conta.md)); contas antigas não veem o ícone nem os balões.

Código: `src/components/GuidedTour/`. Biblioteca: [driver.js](https://driverjs.com) (`driver.js` ^1.10, só o destaque e o balão; o resto é nosso).

## Como o cliente vive isso
1. Termina o checkout → animação de pagamento → entra no sistema "como se tivesse clicado no link do e-mail".
2. O tutorial **"Cadastre sua primeira fazenda"** começa sozinho (balão de boas-vindas).
3. Pode pular a qualquer momento (**Pular tutorial**, X, Esc ou clique fora): o fluxo fica **Pausado** e dá para **Continuar** de onde parou.
4. O ícone de ajuda (⊙?) ao lado do sino abre **Primeiros passos**: nível, pontos, anel de progresso e a lista de fluxos com **Começar / Continuar / Refazer**. "Zerar progresso" recomeça tudo.

## Gamificação
Cada fluxo concluído dá pontos (`points` no fluxo). Os pontos definem o **nível** (`LEVEL_THRESHOLDS` em `flows.ts`: 0 · 100 · 250 · 400 → Iniciante, Explorador, Operador, Mestre do campo; nomes em `languageGB.subscription.tour.levels`). O ícone de ajuda mostra um ponto verde enquanto houver fluxo pendente.

## Fluxos atuais (`flows.ts`)
Conteúdo vindo dos fluxos do GB Manager, família **AGF-049** (`FLX-038` Variante B, `FLX-075`/`FLX-077`). O contratante já foi criado no checkout, então o roteiro começa na fazenda.

| id | Título | Pts | Origem |
|---|---|---|---|
| `first-farm` | Cadastre sua primeira fazenda | 100 | FLX-038 passo 1: assistente de fazenda (identificação, endereço, demarcação opcional, financeiro, configurações; contratante automático) |
| `first-profile` | Crie um perfil de acesso | 100 | FLX-038 passo 2: nome ≥ 2 letras, descrição, árvore de permissões |
| `first-user` | Convide sua equipe | 100 | FLX-038 passo 3: pessoa, conta (senha ≥ 6), ≥ 1 perfil e ≥ 1 fazenda |
| `cost-center` | Adicione um centro de custo | 50 | FLX-075 passo 2: "Cadastrar descendente" a partir de um Sintético |

## Arquitetura
```
GuidedTour/
  types.ts               contrato: TourStep, TourFlow, FlowProgress, TourState
  flows.ts               OS FLUXOS (só dados) + LEVEL_THRESHOLDS  ← edite aqui
  storage.ts             persistência (localStorage hoje; trocar por API) + marca de início automático
  GuidedTourContext.tsx  motor: Provider + useGuidedTour() (driver.js, navegação, progresso)
  TourHelper.tsx         ícone + painel "Primeiros passos" (vai no Header, ao lado do sino)
  guided-tour.css        tema do balão (classe `cerne-tour`)
```
- `GuidedTourProvider` envolve o layout autenticado (`layouts/DashboardLayout.tsx`). `useGuidedTour()` **fora** do provider devolve um objeto desligado (não quebra telas públicas nem testes).
- **Um passo por vez**: cada passo é um `driver().highlight(...)`. É isso que permite atravessar rotas (o Driver.js nativo assume uma página). O motor navega até `step.route`, espera o elemento aparecer (`waitMs`, padrão 4 s) e só então mostra o balão.
- Passo com `advanceOn: 'click'` avança quando o usuário clica **no próprio elemento destacado** (o botão Próximo some). Passo `optional: true` é pulado se o elemento não existir (permissão, menu recolhido).
- Passo sem `element` vira aviso centralizado.
- **Passos atrelados a um estado da tela** (assistente de várias etapas): `showWhen` (seletor que precisa existir para o balão aparecer) e `advanceWhen` (seletor que, ao aparecer, avança o tutorial sozinho). Assim o balão acompanha o usuário etapa por etapa. No cadastro de fazenda, o formulário expõe `data-tour="wizard"` + `data-tour-step="<etapa>"` e `data-tour="wizard-footer"`. Nesses passos o fundo fica leve e **não bloqueia cliques** (classe `cerne-tour-passthrough`), para o usuário preencher os campos com o balão aberto. Nesses passos o botão **Pausar** (no lugar de "Pular tutorial") esconde o balão e mostra a barrinha "Tutorial pausado"; o tutorial volta sozinho na próxima etapa ou pelo botão **Continuar** da barrinha. Se o tutorial for retomado com o usuário em outra etapa do assistente, o motor salta para o passo correspondente à tela.

## Como criar um fluxo novo
1. Em `flows.ts`, acrescente um objeto em `TOUR_FLOWS` (`id` único e estável, `title`, `description`, `icon` do kit, `points`, `minutes`, `steps`).
2. Para destacar um elemento, use **`[data-tour="nome"]`**. Se o elemento ainda não tem marca, adicione o atributo no componente (nunca dependa de classe CSS/Chakra, que muda). Marcas já existentes: `nav-<id do módulo>` (NavRail), `nav-<id do item>` (SecondaryNav, ex.: `nav-cad-est-faz`), `btn-add` (botão "Novo" de `ButtonAdd`), `helper`. O wizard de formulários é achado por `[data-scope="steps"][data-part="list"]`.
3. Textos dos passos ficam em PT no `flows.ts` (conteúdo de produto, como o catálogo de planos). Textos do painel/botões ficam no i18n: `languageGB.subscription.tour` (3 idiomas + tipo em `@types/language/module-subscription`).
4. Valide no navegador: Primeiros passos → Começar.

## Persistência (para o dev ligar a API)
`TourState` por usuário:
```ts
{ enabled?: boolean,                       // só contas vindas do "Criar conta"
  flows: { [flowId]: { status: 'idle'|'in_progress'|'skipped'|'completed',
                       stepIndex: number, updatedAt: string, completedAt?: string } } }
```
Hoje: `localStorage` chave `cerne-tour:v1:<uuid do usuário>`. Para a API, troque a implementação de `tourStorage` em `storage.ts` (`load`/`save`, mesma interface): sugestão `GET/PUT /me/onboarding-tour`. Pontos e nível são **derivados** dos fluxos concluídos (não persistir).

**Início automático:** o checkout chama `queueTourAutoStart('first-farm')` (grava `cerne-tour:pending-autostart`); o Provider lê e apaga essa marca ao montar, liga `enabled` e inicia o fluxo. No produto real, o backend pode devolver `enabled`/`autoStart` já no perfil do usuário recém-criado.

## Pendências conhecidas
- Concluir o fluxo hoje acontece ao chegar no último passo ("Salvar e pronto!"). Quando houver eventos reais (ex.: `farm_created`), o ideal é concluir o fluxo pelo evento de negócio, não pelo clique em "Próximo".
- O tutorial não é exibido para contas existentes (por decisão de produto). Para liberar, defina `enabled: true` no estado do usuário.

## Registro de edições
### UX-tour-001 · Tutorial guiado e "Primeiros passos" — 2026-10-29
- `driver.js` adicionado; motor, helper no Header, 4 fluxos (AGF-049), gamificação e persistência por usuário.
