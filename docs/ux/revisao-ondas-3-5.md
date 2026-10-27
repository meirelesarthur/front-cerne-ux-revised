# Revisão geral — ondas 3 a 5 e página de planos (2026-10-26)

Escopo: tudo alterado desde o login (listagens, filtros, tabela, formulários, seletores, wizards de Fazendas e Pessoas, página de planos).

## Resultado das verificações
| Verificação | Resultado |
|---|---|
| `tsc --noEmit` (projeto inteiro) | **0 erros** (depois de restaurar a instalação — ver "Incidente") |
| Testes unitários (`vitest run src`) | **2.146 passam · 3 falham** (todos em `CreateOrUpdateEntradaInsumos-crash-repro`, que **já falham na versão original** do Dev — não é regressão) |
| Regra de preço da contratação | 17 testes passam |
| E2E Playwright (`e2e/*.spec.ts`) | não executados: o `vitest` sem filtro os coleta como arquivo de teste e eles falham por não serem testes de unidade; precisam de `npx playwright test` e de um backend |
| Varredura de 20 rotas (listagens, formulários, planos) | nenhuma tela em branco ou com tela de erro; `/home` não tem `h1` (usa outro cabeçalho) |
| Consistência das listagens | título 24px em todas; cabeçalho de tabela em caixa-alta 12px em todas |

## Defeitos encontrados e corrigidos nesta revisão
1. **Tema escuro — títulos invisíveis.** Os títulos e rótulos que defini com `gray.900` (PageHeader, FormContainer, Field, cartões) ficavam com contraste **1,09** no tema escuro. Criados os tokens `strongText`, `selectedBG` e `selectedText` (claro/escuro) e aplicados nos componentes novos; contraste do título no escuro agora **13:1**.
2. **Testes quebrados por mim.** `NavRail.footer.test` e `CreateOrUpdateNfe.agroDefensivos.test` falhavam com `currentIcon is not iterable`: o `ui/Icon` recebia um componente no lugar do papel de ícone. `Icon` agora ignora papel desconhecido em vez de derrubar a tela (também protege dados legados em produção).

## Incidente (meu)
Ao remover um worktree temporário usado para comparar com a linha de base, o `git worktree remove --force` seguiu uma junção e **apagou `node_modules/.bin`** do projeto. Os pacotes ficaram, mas `npx tsc`/`vitest`/`vite` pararam de funcionar. Restaurado com `yarn install --frozen-lockfile` (sem alterar `package.json` nem `yarn.lock`). Efeito colateral positivo: a instalação regenerou os tipos do Chakra, e os **11 erros de tipo antigos** (`ghost_danger`, `destructive`, `outline_danger`, `buttonMenu`, `ActionsProps`) **deixaram de aparecer**. Lição: não usar junção para `node_modules` em worktree.

## Desvios que continuam abertos
| # | Desvio | Impacto | Sugestão |
|---|---|---|---|
| 1 | **Busca inline (`ListToolbar`) só em 7 de ~199 listagens.** O resto ainda tem Filtros no cabeçalho e a busca de texto dentro do drawer | UX inconsistente entre telas | migrar em lotes por módulo (regra mecânica; checar se o filtro tem `search`); remover o `ButtonFilter` de cada `HeaderTable` (189 arquivos) |
| 2 | **`variant="outline"` em 619 botões** (só os "Cancelar" foram para `secondary`) | botões de ação em contorno verde convivem com o padrão do DS | auditar por tipo de ação antes de trocar |
| 3 | **Seletores:** linhas de opção do react-select não verificadas (a API local não tem catálogo); `SelectPagination` ("Linhas por página") e `SelectCultivation` com estilo próprio | pequenas diferenças visuais | validar com dados; alinhar os dois |
| 4 | **Etapas de papel de Pessoas** Cliente/Funcionário/Usuário checadas só por tipos; Proprietário/Fornecedor parcialmente | risco visual baixo | checagem visual com dados de Pessoas |
| 5 | **Lei 3 (tokens):** restam `rgba()` em `SummaryPanel`, `PlanCompareStrip`, `PlanTierCard`, `Contratacao/index.tsx`; 4 tamanhos de fonte em px nos componentes novos | violação leve da lei | trocar por tokens translúcidos |
| 6 | **i18n:** rótulos "Remover inscrição/filial/vendedor/fazenda" nas etapas de Pessoas e "Limpar busca" no `ListToolbar` estão fixos em PT | EN/ES mostram PT nesses pontos | mover para `languageGB` |
| 7 | **Lei 5 (tokens W3C):** o front não gera `tokens/tokens.json` | já listado na auditoria | decidir se o front exporta DTCG |
| 8 | **Planos:** assinatura atual, envio da solicitação e permissão da rota ainda são placeholders | sem efeito real | depende de backend |
| 9 | **Tema escuro** validado só em Pessoas (contraste de título/rótulos); demais telas e a página de planos não | pode haver outros fixos em claro | varredura do escuro por módulo |
| 10 | **Transições com o painel do navegador oculto** não avançam: medições de estado selecionado (borda/fundo) feitas por JS nessas condições dão valores intermediários | só afeta a verificação | conferir com o painel visível |

## Atualização — 2026-10-27 · desvios 5, 6 e 9 tratados
| # | Desvio | Resultado |
|---|---|---|
| 5 | `rgba()`/px soltos nos componentes novos (Lei 3) | **Corrigido.** Tokens semânticos `summaryLine/LineStrong/Fill/FillMid/FillActive/NoteBG`, `addonSoftBG` (claro/escuro) e tamanhos de fonte `title` (24), `figure` (18) e `stat` (38) em `chakra.config.ts`. Sem `rgba()` nem `fontSize` em px nos 17 componentes/página de planos auditados |
| 6 | Textos fixos em PT | **Corrigido.** `ListToolbar` ("Buscar", "Limpar busca"), `RepeaterList` ("Remover linha"), `BreadcrumbTrail` ("Trilha de navegação") e `ReconciliationWorkspace` ("Transações") passam a ler `languageGB.defaltStrings.*`; as 5 etiquetas de remover das etapas de Pessoas viraram `people.person.form.basico.remove*`. PT/EN/ES |
| 9 | Tema escuro só validado em Pessoas | **Auditado em 20+ telas** (script de contraste WCAG: texto 4,5:1, grande 3:1) — resultado final: **0 achados** |

### Achados do tema escuro e correção
| Achado | Causa | Correção |
|---|---|---|
| Rótulos de grupo do menu 3,7:1 | `sidebarSubtitleColor` a 45% | 65% |
| Etiqueta de status "Ativo" (Badge de sucesso) 2,4:1 | par verde-500 sobre verde-700 | sucesso = fundo translúcido + `#4ade80`; informação = fundo translúcido + `#93c5fd` (antes 2,8:1) |
| Rótulo da etapa atual do stepper 4,1:1 | `green.600` fixo | token `selectedText` |
| Cores dos planos (Enterprise 1,95:1) | hex de marca fixo | tokens `planPro/planDeluxe/planEnterprise` (claro = marca; escuro = versões claras do documento) + `onPlan` para o texto do selo |
| Valores "+ R$ …" e quadro de avulsos 1,6–2,1:1 | `addonText` igual nos dois temas | escuro `#e9a3cb` |
| Abas inativas, faixa ativa da régua, aviso do simulador | cinza/verde fixos | `fg.muted`, `selectedText`, `strongText` |
| Selo "Porta de entrada" e ícone dos cartões de papel | `green.100` fixo | token `selectedChipBG` |
- Falsos positivos descartados: avatar do cabeçalho (gradiente não entra no cálculo de fundo) e `color(srgb …)` do placeholder do `Select`.
- Telas auditadas em escuro: Fazendas, Embalagens, Pessoas (lista e formulário com papéis ativos), Produtos (lista e formulário), Centros de Custo, Safras, Bancos, OFX, Autorização, Pedidos, Home, Planos (simulador, etapa 2 com GB Consult e resumo dos planos) e o drawer de filtros.
- **Não coberto:** contraste de bordas/ícones e estados de foco; Dashboards e Relatórios (fora de escopo); telas com dados que a API local não tem. Verificação é de cor calculada, não visual (o painel do navegador ficou oculto).
- Unitários: `tsc` 0 erros; 2.143 passam; falham só os 3 já conhecidos do EntradaInsumos e 2–3 testes de NF-e por timeout de 5 s sob carga (passam isolados).
