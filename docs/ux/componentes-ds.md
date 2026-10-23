# Componentes do kit alinhados ao DS (porte fiel)

Fonte de verdade visual: `C:\Users\Arthur\Downloads\GB-CERNE\04.Code\cerne\src\components\ui\`.
Regra do projeto: **tudo é componente** — a tela só importa e compõe; nunca copia, nunca estiliza por cima.
Quando o DS muda, o componente do front muda **uma vez** e todas as telas herdam.

Convenções do porte:
- O componente vive em `src/components/ui/` (ou o equivalente central já existente) e expõe por props o que o DS expõe.
- Texto vem por props (i18n via `languageGB`, caminho completo) — componente não tem string própria.
- Substituir cópias locais por import do kit (ex.: `StepHeading` local → `StepHeader`).
- Escala de fontes do front ≠ nomes do DS (ver `alinhamento-ds.md`, T2): usar tokens do front ou px explícito.

| Componente DS | Front | Status | Consumidores | Observações |
|---|---|---|---|---|
| Stepper | `ui/steps.tsx` | **portado** | Fazendas, Pessoas, Pesagem Rodoviária | pontos 12/16px sem número (número só com `indicatorSize`), concluída preenchida, linha 2px alinhada ao centro do ponto |
| StepHeader | `ui/StepHeader.tsx` | **portado (novo)** | Fazendas, Pessoas (`StepHeading` agora re-exporta) | título 24px bold centralizado + subtítulo |
| StepFooter | `ui/StepFooter.tsx` | **portado (novo)** | Fazendas, Pessoas | "Etapa X de N" à esquerda; Voltar (secundário) + Próximo (primário) com 190px; `FarmFormShell` removido |
| Pagination | `components/Pagination.tsx` | **portado** | todas as grids (via `Table`) | botões 34px com raio md, contorno neutro, página atual brand600; lógica 1-based mantida; `PageButton` único |
| Modal | `components/CustomDialog.tsx` | **portado** | 43 modais | raio 20, sombra `modal`, contorno 1px, overlay rgba(0,0,0,.45), header/footer 16×20, título 16px semibold, larguras sm 400 / md 520 / lg 640 |
| ConfirmDialog | `components/DeleteConfirmDialog.tsx` | **portado** | ~270 telas | ícone 40px à esquerda + título/mensagem; Cancelar `ghost`, Excluir `destructive`; sempre com ícone de tom; `colorPalette` deprecada |
| Button destructive | `styles/recipes/button.ts` | **portado** | 5 usos diretos + diálogos | DS: fundo branco, texto red700, contorno red100 (antes: vermelho sólido) |
| Breadcrumb | `ui/BreadcrumbTrail.tsx` (novo) | **portado** | Topbar (`Header`) | separador "/", ancestrais secundários, atual primário; `components/Breadcrumb.tsx` (legado, `string[]`) permanece para as telas antigas |
| ToggleSwitch | `ui/switch.tsx` | **portado** | 43 arquivos | trilho 42×22, bolinha 18, off neutro200 / on green600, rótulo 13px medium |
| Badge | `ui/Badge.tsx` (novo) | **portado** | Fazendas (referência) | pílula 4×10, 12px medium, variantes success/danger/warning/neutral/info/purple/cyan por token. **~328 `<Badge colorPalette>` do Chakra em 221 arquivos ainda não migrados** |
| Icon (HugeIcons) | `ui/Icon.tsx` + `design/icons.ts` (registry do DS) | **portado (novo)** | NavRail, SecondaryNav, Header, Home | papéis (`dashboard`, `cattle`, `wallet`…) em vez de import de biblioteca; traço 1.5; tamanhos xs13/sm15/md17/lg20/xl26. Papel `menu` acrescentado ao registry |
| Sidebar/NavRail (nível 1) | `Layout/NavRail.tsx` | **portado** | todas as telas | ícones HugeIcons (15px, 16px colapsado), chevrons 13px |
| SecondaryNav (nível 2) | `Layout/SecondaryNav.tsx` | **portado** | todas as telas | ícones por item/grupo/filho (14/13px), favorito preenchido, chevrons 10-11px |
| Árvore de navegação | `config/v2/navigationTree.ts` | **convertida** | menu, Home, busca | 407 ícones Lucide → papéis do DS (por `id` do `menuData` do DS; 28 por tabela de fallback) |
| ReconciliationWorkspace / Summary / Row / DetailPanel | `ui/Reconciliation*.tsx` (novos) | **evolução do DS** | Conciliação OFX | mestre–detalhe com resumo em R$, linha com ação rápida e painel de situação; o `ReconciliationWorkspace` do DS era só 2 colunas |
| QueueTabs | `ui/QueueTabs.tsx` (novo) | novo | Conciliação OFX | abas de fila com contador |
| ProgressRing | `ui/ProgressRing.tsx` (novo) | novo | Conciliação OFX | anel 0–100 em CSS |
| FormSurface | `ui/FormSurface.tsx` (novo) | novo | 3 formulários da Conciliação | mesmo formulário como modal (`dialog`) ou painel inline (`panel`) |
| SegmentedControl | `ui/SegmentedControl.tsx` (novo) | novo | Conciliação OFX | 2–4 opções exclusivas |
| RemainingBalance | `ui/RemainingBalance.tsx` (novo) | novo | `MovementAllocationEditor` (todas as telas com rateio) | saldo ao vivo: faltam/passou/fechou |
| Button (secondary) | `styles/recipes/button.ts` | parcial | todo o app | borda neutra 1.5px com props separadas (o shorthand `border` descartava a cor); raio 8; `sm` 34px |
| FormPageHeader (subtítulo) | `Layout/FormContainer.tsx` | parcial | wizards passam `subtitle` | |
| Input | `styles/recipes/input.ts` | parcial | todo o app | raio 8, glow de foco |
| PageCard | `ui/PageCard.tsx` | parcial | 17 telas | sombra `cardShadow` |

## Próximos (ordem sugerida)
Tag · IconButton · DropdownMenu · Tabs · Tooltip · Avatar · FilterDrawer · DataTable/ListToolbar/PageHeader · EmptyState/Skeleton · TypedConfirmDialog · TreeView · migração em massa dos `<Badge colorPalette>`.

## Ícones — o que ainda usa outras bibliotecas
`lucide-react` e `react-icons` seguem em ~100 telas fora do shell (EmptyState, QueryErrorState, AccountMenu, Compras/Cotações…). Migrar por tela junto com o lote de padrões de listagem; regra do DS: nenhuma tela importa biblioteca de ícone.
