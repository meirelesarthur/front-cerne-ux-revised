// src/pages/Administrativo/Autorizacao/RequestAuthorizationAttachments.tsx
// -----------------------------------------------------------------------------
// Bloco "Anexos" da Autorização e da Ciência (execução 081, T-081-FE-06; legado
// `_forms.blade.php:116-146`, link para o arquivo). Somente leitura: `attachments[]`
// do detalhe (`{ uuid, name, file_url }`). Sem anexo = estado vazio honesto.
// -----------------------------------------------------------------------------

import { Box, Link, Text, VStack } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type { RequestAttachmentRow } from '@/@types/v2/RequestPurchases';

export interface RequestAuthorizationAttachmentsProps {
  attachments: RequestAttachmentRow[];
}

export function RequestAuthorizationAttachments({
  attachments,
}: RequestAuthorizationAttachmentsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.attachments;

  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.default"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {text.title}
      </Text>

      {attachments.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty}
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {attachments.map((attachment) =>
            attachment.file_url ? (
              <Link
                key={attachment.uuid}
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                color="brandColorText"
              >
                {attachment.name}
              </Link>
            ) : (
              <Text key={attachment.uuid} fontSize="sm" color="fg.default">
                {attachment.name}
              </Text>
            )
          )}
        </VStack>
      )}
    </Box>
  );
}
