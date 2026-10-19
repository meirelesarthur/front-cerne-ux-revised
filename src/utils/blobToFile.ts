// src/utils/blobToFile.ts
// -----------------------------------------------------------------------------
// Utilitário compartilhado — converte um `Blob` (binário já em mãos, ex.:
// `GET /dfes/{uuid}/xml`, `responseType: 'blob'`) num `File` nativo, para
// reencaminhar como upload normal de arquivo aos endpoints de import de XML
// já existentes (`parseInvoiceXml`/`importMovementPurchaseXml`, ambos
// recebem `File` e montam o próprio `FormData` internamente — mirror
// `InvoiceXmlUploadModal.tsx`/`MovementPurchaseXmlImport.tsx`).
//
// Criado por TASK-DFE-FE-08 (lançamentos cross-módulo, Produto/Animal) —
// nenhum utilitário equivalente existia no repositório (confirmado por
// busca em `src/utils/**` antes de criar este arquivo).
// -----------------------------------------------------------------------------

// Converte um `Blob` em `File` — usa o `type` do próprio Blob quando
// presente (resposta real do backend, `Content-Type: application/xml`),
// com fallback para o `fallbackType` informado só quando o Blob não carrega
// um MIME type (nunca sobrescreve um `type` real).
export function blobToFile(blob: Blob, fileName: string, fallbackType = 'application/xml'): File {
  return new File([blob], fileName, { type: blob.type || fallbackType });
}
