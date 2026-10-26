# Contratar ou alterar plano — simulador de assinatura

- **Rota:** `/planos/contratar` (item de menu **Configurações → Contratar plano**)
- **Código:** `src/pages/Planos/Contratacao/` (`index.tsx`, `catalog.ts`, `pricing.ts`, `pricing.test.ts`)
- **Estilo de referência:** simulador/configurador da Eveo — etapas à esquerda, **resumo escuro fixo à direita** com o total. (O artifact de precificação já tinha esse formato; a página do front o porta com os componentes do kit.)
- **Dados reais:** artifact "Cerne Planos e Precificação" (planos Pro/Deluxe/Enterprise, acessos, 16 módulos avulsos, anual = 10/12) → `catalog.ts`.
- **Status:** implementada e validada no navegador · **Última atualização:** 2026-10-26 (UX-contratacao-002: modelo por faixa de tamanho)

## Regras de preço (porte fiel do documento "Precificação do GB Cerne", testadas)
| Regra | Valor |
|---|---|
| Preço do plano | **por faixa de tamanho** da fazenda, em cabeças ou hectares (5 faixas, limites do legado: 500/1.500/3.000/10.000 cab · 200/800/1.500/3.000 ha). Pro 189·349·590·990·1.590 · Deluxe 290·490·790·1.290·1.990 · Enterprise 590·890·1.290·1.890·2.790+ |
| Fazenda mista | conta pela maior faixa; faixa 5 = ponto de partida para proposta (preço com "+") |
| Acessos incluídos | Pro 5 · Deluxe 10 · Enterprise ilimitados |
| Acesso extra (qualquer perfil) | R$ 25 no Pro e no Deluxe; Enterprise não cobra |
| Atividades | 1 · 2 · todas |
| Módulo avulso | 15 módulos de R$ 79 a 290; mesmo preço em qualquer plano abaixo do que o inclui; `price: null` (DRE) = só existe a partir do plano que o inclui |
| Módulo exclusivo marcado no plano abaixo | **sobe o plano** e avisa; rebaixar remove o que deixa de existir |
| Assistente de IA | em todos os planos, com limite: 30/80/200 msg por janela de 5 h; 1/3/10 mi tokens/mês; pacote extra R$ 29 por 1 mi |
| GB Consult (opcional, à parte do software) | Fiscal R$ 489 · Fazenda R$ 1.290 · Corporativo R$ 3.490 por mês |
| Anual | paga 10 meses de 12 ("2 meses grátis") |

`pricing.test.ts` (17 testes) cobre faixas (cab/ha), régua do controle, preço por faixa, acessos, módulos, subida automática, comparação, anual e consultoria.

## Fluxo da tela
Duas visões (controle no topo): **Simulador** e **Resumo dos planos**.
1. **Simulador · Fazenda e plano:** tamanho (cabeças/hectares + número + régua com as 5 faixas), plano (3 cartões com o preço da faixa), acessos e cobrança Mensal/Anual.
2. **Simulador · Módulos e serviços:** módulos agrupados (Do Deluxe · Do Enterprise · Qualquer plano; os incluídos aparecem travados) e **GB Consult** opcional (4 cartões).
3. **Resumo (direita):** Plano (tamanho, faixa, valor base, IA), Acessos, Módulos, GB Consult, **total** (mensal ou equivalente anual, com e sem serviço), diferença para o plano atual, aviso/sugestão, comparação dos 3 planos e ações.
4. **Resumo dos planos:** porta de entrada gratuita (Cerne Fiscal), escada de 3 planos (faixa de preço, atividades/acessos, o que inclui, avulsos disponíveis), preço de referência por faixa, limites de IA e matriz de módulos por plano.

## Componentes do kit criados
`StepIndicator`, `QuantityStepper`, `PlanOptionCard`, `CheckOptionRow`, `SummaryPanel` (+`SummaryGroup/Row/Note/Total`), `PlanCompareStrip`, e na UX-contratacao-002: `BandSlider` (régua por faixas), `ChoiceCardGroup` (escolha única em cartões), `PlanTierCard` (escada de planos), `SimpleTable` (tabela de referência); reuso de `SegmentedControl`, `Button`, `DeleteConfirmDialog`, `FormContainer(fullBleed)`.
i18n: módulo novo `subscription` (PT-BR/EN-US/ES-ES).

## Pendências de backend / produto
| Item | Situação |
|---|---|
| Assinatura atual do contratante (`CURRENT_SUBSCRIPTION`) | **placeholder** (Pro, 3 acessos, sem módulos) — virá de `GET /subscription` |
| Catálogo (planos, preços, módulos) | `catalog.ts` é o seed; contrato sugerido `GET /subscription/catalog` com o mesmo shape (`Catalog`) |
| Envio da solicitação ao comercial | **não ligado** — hoje mostra confirmação e um aviso de que fica só na simulação |
| Permissão da rota/menu | sem guarda (qualquer autenticado); definir slug (ex.: `subscription_manage`) |
| Comparativo de 27 pacotes e demais seções do documento (mercado, jornada, decisões do conselho) | fora desta tela — é material de decisão, não de contratação; o resumo dos planos traz a matriz por módulo |

## Registro de edições
### UX-contratacao-001 · Criação da página — 2026-10-26
Página nova (sem versão anterior no front; `/planos` continua sendo o cadastro administrativo de planos). Validada: subida automática de plano ao marcar DRE, módulo travado como incluído no Deluxe, comparação entre planos, anual (R$ 8.900 em vez de R$ 10.680 no Enterprise).

### UX-contratacao-002 · Modelo por faixa de tamanho e resumo dos planos — 2026-10-26
Atualizada pela versão nova do artifact (`?sk=…`): o preço deixou de ser fixo e passou a seguir o tamanho da fazenda; entraram IA com limite por plano, GB Consult e a visão "Resumo dos planos". Acessos mudaram para 5/10/ilimitados com extra de R$ 25; o catálogo passou de 16 para 15 módulos (saiu "Programa ABC Corte"). Validado no navegador: 1.200 cab = faixa 2 (349/490/890), 12.000 cab = faixa 5 com "+", troca cab↔ha preservando a faixa, GB Consult Fazenda somando R$ 1.290 ao total.
