// src/pages/Administrativo/SystemLogs/LogContent.tsx
// Um bloco de log = UM `<pre>` (texto puro, não um nó por linha) memoizado:
// carregar blocos mais antigos não re-renderiza os já exibidos. Linhas acima
// de MAX_LINE_CHARS são cortadas na tela (o download continua íntegro).

import { memo, useMemo } from 'react';

import { Box } from '@chakra-ui/react';

import { buildPageText } from './utils';

interface LogContentProps {
  content: string;
  lineTruncatedLabel: string;
  wrap: boolean;
}

function LogContentBase({ content, lineTruncatedLabel, wrap }: LogContentProps) {
  const { text } = useMemo(
    () => buildPageText(content, lineTruncatedLabel),
    [content, lineTruncatedLabel]
  );

  if (text === '') return null;

  return (
    <Box
      as="pre"
      margin="0"
      fontFamily="mono"
      fontSize="xs"
      lineHeight="1.5"
      color="fg"
      whiteSpace={wrap ? 'pre-wrap' : 'pre'}
      wordBreak={wrap ? 'break-word' : 'normal'}
      data-testid="system-logs-page"
    >
      {text}
    </Box>
  );
}

export const LogContent = memo(LogContentBase);
