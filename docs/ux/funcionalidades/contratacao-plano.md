# Contratar ou alterar plano — simulador de assinatura

- **Rota:** `/planos/contratar` (item de menu **Configurações → Contratar plano**)
- **Código:** `src/pages/Planos/Contratacao/` (`index.tsx`, `catalog.ts`, `pricing.ts`, `pricing.test.ts`)
- **Estilo de referência:** simulador/configurador da Eveo — etapas à esquerda, **resumo escuro fixo à direita** com o total. (O artifact de precificação já tinha esse formato; a página do front o porta com os componentes do kit.)
- **Dados reais:** artifact "Cerne Planos e Precificação" (planos Pro/Deluxe/Enterprise, acessos, 16 módulos avulsos, anual = 10/12) → `catalog.ts`.
- **Status:** implementada e validada no navegador · **Última atualização:** 2026-10-26

## Regras de preço (porte fiel do artifact, testadas)
| Regra | Valor |
|---|---|
| Valor base (flat, sem porte) | Pro **R$ 349** · Deluxe **R$ 490** · Enterprise **R$ 890** |
| Acessos incluídos | 3 · 5 · 10 |
| Acesso extra (qualquer perfil) | R$ 39 · R$ 35 · R$ 29 |
| Módulo avulso | mesmo preço em qualquer plano abaixo do que o inclui; `price: null` = só existe a partir do plano que o inclui |
| Módulo exclusivo (ex.: DRE) marcado no plano abaixo | **sobe o plano** e avisa |
| Rebaixar o plano | remove módulos exclusivos que deixam de existir e avisa |
| Plano mais barato para a mesma configuração | destacado na comparação; sugere upgrade/ajuste |
| Anual | paga 10 meses de 12 ("2 meses grátis"); mostra mensalidade equivalente e total/ano |

`pricing.test.ts` (11 testes) cobre cotação, acessos extras, módulos incluídos/avulsos, subida automática, remoção, comparação entre planos e anual.

## Fluxo da tela
1. **Plano e acessos:** 3 cartões de plano (selo *Plano atual*), cobrança Mensal/Anual, acessos (− / + e slider).
2. **Módulos adicionais:** lista agrupada (Do Deluxe · Do Enterprise · Qualquer plano); o que o plano já tem aparece marcado, travado e "incluído".
3. **Resumo (direita):** grupos Plano · Acessos · Módulos, **total** (mensal ou equivalente anual), diferença para o plano atual, aviso/sugestão, **comparação dos 3 planos** com a mesma configuração e ações (*Solicitar contratação/upgrade/alteração*, *Copiar resumo*).

## Componentes do kit criados
`StepIndicator`, `QuantityStepper`, `PlanOptionCard`, `CheckOptionRow`, `SummaryPanel` (+`SummaryGroup/Row/Note/Total`), `PlanCompareStrip`; reuso de `SegmentedControl`, `Button`, `DeleteConfirmDialog`, `FormContainer(fullBleed)`.
i18n: módulo novo `subscription` (PT-BR/EN-US/ES-ES).

## Pendências de backend / produto
| Item | Situação |
|---|---|
| Assinatura atual do contratante (`CURRENT_SUBSCRIPTION`) | **placeholder** (Pro, 3 acessos, sem módulos) — virá de `GET /subscription` |
| Catálogo (planos, preços, módulos) | `catalog.ts` é o seed; contrato sugerido `GET /subscription/catalog` com o mesmo shape (`Catalog`) |
| Envio da solicitação ao comercial | **não ligado** — hoje mostra confirmação e um aviso de que fica só na simulação |
| Permissão da rota/menu | sem guarda (qualquer autenticado); definir slug (ex.: `subscription_manage`) |
| Porte (XS–GG) | o artifact removeu o porte do simulador (valor flat); a tabela por porte do artifact **não** foi portada |
| Comparativo de 27 pacotes (anexo do artifact) | fora desta tela; pode virar a aba "Comparar planos" |

## Registro de edições
### UX-contratacao-001 · Criação da página — 2026-10-26
Página nova (sem versão anterior no front; `/planos` continua sendo o cadastro administrativo de planos). Validada: subida automática de plano ao marcar DRE, módulo travado como incluído no Deluxe, comparação entre planos, anual (R$ 8.900 em vez de R$ 10.680 no Enterprise).
