// src/utils/planAccountReport.ts
// -----------------------------------------------------------------------------
// Geração do documento HTML de impressão do relatório de Plano de Contas
// (TASK-PA-12 — Opção B aprovada em ROTEIRO-03/Achado 2: impressão client-side,
// sem endpoint PDF novo).
//
// Mirror ADAPTADO de `GB.Cerne.UX/src/pages/cadastros/plano-contas/planoContas.io.ts`
// (linhas 10-79, referência oficial do UX) — estrutura/estilo fiéis, não copiados
// literalmente: a fonte de dados aqui é `PlanAccountListItem[]` real (paginado,
// agregado pelo laço de `listAllPlanAccountsForReport` em `plan-account-service.ts`),
// não o array `Conta[]` já carregado inteiro em memória do mock.
//
// EXCEÇÃO DELIBERADA E DOCUMENTADA ao "zero hardcoded" (ver ficha TASK-PA-12,
// "Leitura do dev", item 4): as cores abaixo são hex literal porque o documento
// impresso é uma string HTML isolada, escrita via `document.write` numa janela
// nova — fora da árvore React/Chakra desta SPA, sem acesso a `theme.ts`/tokens
// em runtime. O próprio `ux_root` (`planoContas.io.ts:27-67`) usa a mesma
// técnica. Não é violação do DoD "zero hardcoded" — esse critério se aplica a
// texto/UI dentro da árvore Chakra, não ao conteúdo estático do documento de
// impressão gerado à parte.
// -----------------------------------------------------------------------------

import type { PlanAccountListItem } from '@/@types/v2/PlanAccounts';

// Comparação hierárquica de `code` por segmento numérico (ex.: "1.1.10" depois
// de "1.1.2") — NÃO lexicográfica (que ordenaria "1.1.10" antes de "1.1.2").
export function compareAccountCode(a: string, b: string): number {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PlanAccountReportText {
  documentTitle: string;
  columnCode: string;
  columnClass: string;
  columnCondition: string;
  columnDescription: string;
  metaCountSingular: string;
  metaCountPlural: string;
}

// Monta o documento HTML completo do relatório, ordenado hierarquicamente por `code`.
export function buildPlanAccountReportHtml(
  items: PlanAccountListItem[],
  text: PlanAccountReportText
): string {
  const sorted = [...items].sort((a, b) => compareAccountCode(a.code, b.code));

  const rows = sorted
    .map((item) => {
      // class 1 = SYNTHETIC (DA-PA-01) — mesmo destaque visual do UX oficial.
      const isSynthetic = item.class === 1;
      const rowStyle = isSynthetic
        ? 'color:#b91c1c;font-weight:700;'
        : 'color:#111827;font-weight:400;';

      return `<tr style="${rowStyle}">
        <td>${escapeHtml(item.code)}</td>
        <td>${escapeHtml(item.class_label)}</td>
        <td>${escapeHtml(item.condition_label)}</td>
        <td>${escapeHtml(item.description)}</td>
      </tr>`;
    })
    .join('');

  const countLabel = sorted.length === 1 ? text.metaCountSingular : text.metaCountPlural;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(text.documentTitle)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111827; margin: 0; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p.meta { font-size: 10px; color: #6b7280; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1.5px solid #111827; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  th:nth-child(1), td:nth-child(1) { width: 90px; }
  th:nth-child(2), td:nth-child(2) { width: 90px; }
  th:nth-child(3), td:nth-child(3) { width: 90px; }
</style>
</head>
<body>
  <h1>${escapeHtml(text.documentTitle)}</h1>
  <p class="meta">${sorted.length} ${escapeHtml(countLabel)}</p>
  <table>
    <thead><tr>
      <th>${escapeHtml(text.columnCode)}</th>
      <th>${escapeHtml(text.columnClass)}</th>
      <th>${escapeHtml(text.columnCondition)}</th>
      <th>${escapeHtml(text.columnDescription)}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

// Abre o relatório numa aba nova e dispara a impressão nativa do navegador.
// Retorna `false` se o pop-up foi bloqueado (`window.open` devolveu `null`) —
// o chamador deve tratar isso com um toast de erro específico, nunca falha
// silenciosa.
export function openPlanAccountReport(
  items: PlanAccountListItem[],
  text: PlanAccountReportText
): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;

  win.document.open();
  win.document.write(buildPlanAccountReportHtml(items, text));
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 300);
  return true;
}
