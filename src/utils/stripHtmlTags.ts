// src/utils/stripHtmlTags.ts
// -----------------------------------------------------------------------------
// Decapa tags HTML de uma string — usado pela coluna "Descrição" da Listagem
// de Atualizações do Sistema (execução 031, TASK-FE-1101) para replicar a
// regra de negócio 5 da Doc Bruta do legado: a listagem mostra a descrição
// RESUMIDA em texto plano (`strip_tags` + `Str::limit(100)` no Blade), nunca
// o HTML cru — a persistência continua HTML íntegro (só a exibição na grid é
// truncada). NÃO é sanitização de segurança (isso é `sanitizeHtml.ts`,
// usado na Visualização/popup) — aqui o resultado NUNCA vai a
// `dangerouslySetInnerHTML`, só a `<Text>` comum.
// -----------------------------------------------------------------------------

/**
 * Remove tags HTML e normaliza espaços, truncando ao comprimento informado.
 *
 * @param {string | null | undefined} html - HTML cru (ex.: `description`).
 * @param {number} maxLength - Comprimento máximo do texto resultante (default 100, mesmo limite do legado).
 * @return {string} Texto plano truncado, com reticências quando cortado.
 */
export function stripHtmlAndTruncate(html: string | null | undefined, maxLength = 100): string {
  if (!html) return '';

  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) return plainText;

  return `${plainText.slice(0, maxLength).trimEnd()}…`;
}

export default stripHtmlAndTruncate;
