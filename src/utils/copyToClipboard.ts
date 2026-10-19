// src/utils/copyToClipboard.ts
// -----------------------------------------------------------------------------
// Copia texto para a área de transferência com fallback para contexto
// INSEGURO (HTTP).
//
// `navigator.clipboard` só existe em *secure context* (HTTPS ou `localhost`).
// Em homologação servida por HTTP puro ele é `undefined` e `writeText` lança —
// era exatamente o que quebrava "Copiar link público" de Orçamento (F-018):
// funcionava no ambiente de dev (`localhost`, secure context) e falhava em
// homologação com "Não foi possível copiar o link público." (o `getBudget`
// respondia 200 com o `hash`; a falha estava só na cópia).
//
// O fallback usa o `document.execCommand('copy')` legado via <textarea>
// temporário — suportado nos navegadores em contexto inseguro onde a Clipboard
// API não está disponível. Lança se nenhum caminho copiar, para o chamador
// decidir o toast de erro (mantém o contrato atual dos handlers).
// -----------------------------------------------------------------------------

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback (contexto inseguro / Clipboard API ausente) — <textarea> fora da
  // viewport, sem afetar layout nem scroll da página.
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }

  if (!copied) {
    throw new Error('Falha ao copiar para a área de transferência (execCommand).');
  }
}

export default copyToClipboard;
