// src/utils/fileToDataUri.ts
// -----------------------------------------------------------------------------
// TASK-PAST-FIX-FE-02 — converte um `File` em uma data URI base64
// (`FileReader.readAsDataURL`), usado no submit de Pastagem para enviar
// imagem NOVA de Ocorrência no mesmo campo `string` já existente no
// contrato (`PastureOccurrenceImagePayload.image`) — SEM multipart, porque
// o payload de Pastagem é JSON único (5 subcadastros aninhados no mesmo
// POST/PUT). Mirror do padrão já usado em `RichTextEditor/index.tsx`,
// promisificado para uso dentro de um `Promise.all` no submit.
// -----------------------------------------------------------------------------

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export default fileToDataUri;
