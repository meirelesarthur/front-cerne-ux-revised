// src/components/RichTextEditor/RichTextContent.tsx
// -----------------------------------------------------------------------------
// Renderizador SOMENTE LEITURA do HTML produzido pelo `RichTextEditor`
// (mesma família de tokens/CSS do editor, para a leitura ficar visualmente
// idêntica ao que foi digitado — títulos, listas, negrito, tabelas).
//
// Requisito NÃO-NEGOCIÁVEL (GAP-BE-512-systemupdate, §7.2 do contrato de tela
// de Atualizações do Sistema, execução 031 — mas o componente é genérico,
// reutilizável por qualquer módulo futuro com o mesmo editor): TODA
// renderização de HTML vindo da API passa por `sanitizeHtml()`
// (`@/utils/sanitizeHtml`, DOMPurify) ANTES do `dangerouslySetInnerHTML` —
// nunca HTML cru direto. Este componente é o ÚNICO ponto do projeto
// autorizado a chamar `dangerouslySetInnerHTML` com conteúdo vindo de
// `RichTextEditor` — não replicar o padrão em outro lugar sem sanitização.
// -----------------------------------------------------------------------------

import { Box } from '@chakra-ui/react';

import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface RichTextContentProps {
  html: string | null | undefined;
}

export function RichTextContent({ html }: RichTextContentProps) {
  return (
    <Box
      fontSize="sm"
      color="fg.default"
      css={{
        '& p': { marginBottom: '0.5em' },
        '& ul, & ol': { paddingInlineStart: '1.5em', marginBottom: '0.5em' },
        '& a': { color: 'brandColorText', textDecoration: 'underline' },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          marginBottom: '0.75em',
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'border.subtle',
          padding: '6px 8px',
        },
        '& th': { bg: 'bg.muted', fontWeight: 'semibold' },
        '& img': { maxWidth: '100%', borderRadius: 'sm' },
      }}
      // eslint-disable-next-line react/no-danger -- sanitizado por DOMPurify (sanitizeHtml), ver cabeçalho.
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

export default RichTextContent;
