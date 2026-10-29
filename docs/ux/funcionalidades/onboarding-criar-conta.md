# Onboarding · Criar conta

Rota pública `/criar-conta` (dentro do `AuthLayout`, guardada por `PublicRoute`). Entrada: link **Criar conta** abaixo do título do Login (antes era o placeholder "Solicitar acesso").

> **Front de design.** Nenhuma conta é criada e nada é cobrado. O pagamento é uma simulação no estilo do Stripe; a integração real (Stripe Elements/Checkout + webhook) substitui só o passo 3.

## Fluxo

| # | Passo | O que acontece | Arquivo |
|---|---|---|---|
| 1 | Plano | Reusa o configurador de contratação (`ContratacaoPlano` com a prop `onboarding`): sem a aba Resumo/Simulador, botão final "Continuar para a conta →" entrega um `OnboardingOrder` | `pages/Planos/Contratacao/index.tsx`, `order.ts` |
| 2 | Conta | Nome, e-mail, senha + confirmação (mín. 8, letra e número), aceite dos termos | `steps/StepAccount.tsx` |
| 3 | Pagamento | Cartão / Pix / Boleto simulados, resumo do pedido à direita (`SummaryPanel`), processamento falso de 1,4 s | `steps/StepPayment.tsx` |
| 4 | Contratante | PF/PJ, CPF/CNPJ, razão social, telefones, responsável (pré-preenchido com a conta), endereço | `steps/StepContractor.tsx` |
| 5 | Pronto | Resumo do contrato e próximos passos; "Entrar no sistema" limpa o rascunho e vai ao `/login` | `steps/StepDone.tsx` |

## Decisões
- **Pagamento antes dos dados do contratante** (o pedido sugeriu "antes ou depois"): o cliente confirma o valor logo após criar o acesso; os dados fiscais vêm em seguida. Trocar a ordem é mudar `ONBOARDING_STEPS` em `types.ts`.
- **Navegação linear**: `StepIndicator` ganhou `isStepDisabled`; só dá para voltar a passos já alcançados e, depois de concluído, nenhum passo é clicável.
- **Rascunho em `sessionStorage`** (`cerne-onboarding-draft`): pedido, conta (sem senha), pagamento e contratante. Senha e dados de cartão nunca são persistidos.
- Faixa 5 do plano é "sob proposta": o resumo avisa que a cobrança de hoje é o ponto de partida.
- Textos em PT-BR/EN/ES em `languageSubscription.onboarding`; o rótulo do link vem de `common.login.createAccount`.

## Para a integração real
- Passo 2 → `POST` de cadastro (e-mail único, política de senha do backend, confirmação por e-mail).
- Passo 3 → Stripe (PaymentIntent/Checkout); Pix e boleto via métodos do Stripe Brasil. A conta só é liberada após o webhook de pagamento confirmado.
- Passo 4 → `POST` do contratante (mesmo contrato de `BaseRegistrations/Contratantes`); CEP pode preencher endereço/cidade/UF.

## Registro de edições
### UX-onboarding-001 · Criação de conta com contratação — 2026-10-29
- Rota `/criar-conta`, 5 passos, modo `onboarding` no configurador, `StepIndicator` com `spread` e `isStepDisabled`.
