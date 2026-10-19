// src/utils/sanitizeHtml.ts
// -----------------------------------------------------------------------------
// Sanitização client-side de HTML rico — GAP-BE-512-systemupdate (decisão do
// dono, execução 031: Opção B no backend = mantém `description` como HTML
// CRU em `/api/v1/system-updates`, sem `Purifier` no servidor; hardening
// OBRIGATÓRIO no client via DOMPurify, contrato-front-atualizacoes-sistema.md
// §7.2). Requisito NÃO-NEGOCIÁVEL: TODA renderização de `description` (tela
// de Visualização e popup do dashboard) passa por `sanitizeHtml()` antes de
// qualquer `dangerouslySetInnerHTML` — nunca HTML cru direto (o único
// precedente do projeto, `src/components/Alert.tsx:130`, NÃO sanitiza e não
// é seguro copiar, ver "Leitura do dev" do contrato de tela).
//
// Allowlist compatível com a toolbar do `RichTextEditor` (Tiptap StarterKit +
// Table + Image + Link + Underline, `src/components/RichTextEditor/`) — as
// mesmas tags/atributos que o editor é capaz de produzir, nada além disso.
// -----------------------------------------------------------------------------

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'blockquote',
  'code',
  'pre',
  'hr',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'colspan', 'rowspan'];

/**
 * Sanitiza HTML cru vindo da API antes de qualquer `dangerouslySetInnerHTML`.
 * Retorna string vazia para valores ausentes (nunca `null`/`undefined` chega
 * ao DOM). Allowlist restrita (sem `<script>`, `<iframe>`, atributos `on*`,
 * `style`, `data-*`) — defesa em profundidade independente da decisão do
 * backend (§7.2).
 *
 * @param {string | null | undefined} html - HTML cru (ex.: `description` do SystemUpdate).
 * @return {string} HTML sanitizado, seguro para `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export default sanitizeHtml;
