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
| Button (secondary) | `styles/recipes/button.ts` | parcial | todo o app | borda neutra 1.5px com props separadas (o shorthand `border` descartava a cor); raio 8; `sm` 34px |
| FormPageHeader (subtítulo) | `Layout/FormContainer.tsx` | parcial | wizards passam `subtitle` | |
| Input | `styles/recipes/input.ts` | parcial | todo o app | raio 8, glow de foco |
| PageCard | `ui/PageCard.tsx` | parcial | 17 telas | sombra `cardShadow` |

## Próximos (ordem sugerida)
Pagination (botões 34px) · Modal/ConfirmDialog · Breadcrumb · ToggleSwitch · Badge/Tag · IconButton · DropdownMenu · Tabs · Tooltip · Avatar · FilterDrawer · DataTable/ListToolbar/PageHeader · EmptyState/Skeleton · TypedConfirmDialog · TreeView.
