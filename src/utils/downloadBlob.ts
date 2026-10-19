// src/utils/downloadBlob.ts
// -----------------------------------------------------------------------------
// Utilitário compartilhado para disparar o download de um Blob já resolvido
// (resposta `responseType: 'blob'` do axios) sem navegação de página — cria um
// `<a download>` temporário, dispara o clique programaticamente e revoga a
// Object URL logo em seguida. O nome de arquivo passado aqui SEMPRE prevalece
// sobre qualquer `Content-Disposition` do servidor (não há navegação real de
// URL, só o atributo `download`).
//
// Primeiro uso: PlanAccount (TASK-PA-07, download de modelo Excel + export).
// Reaproveitável por qualquer módulo futuro com export/download de arquivo.
// -----------------------------------------------------------------------------

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
