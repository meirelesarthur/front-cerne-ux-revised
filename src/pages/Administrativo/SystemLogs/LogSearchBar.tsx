// src/pages/Administrativo/SystemLogs/LogSearchBar.tsx
// Campo de busca do visualizador. A busca roda no ARQUIVO INTEIRO (feita pela
// API, parâmetro `q`) e só é disparada no Enter / botão "Buscar": cada nova
// busca é auditada e limitada por taxa na API, então não há busca "ao digitar".
// Atalho: `/` foca o campo (fora de inputs).

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { Box, Flex, Icon, IconButton, Input, Text } from '@chakra-ui/react';
import { FiSearch, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';

interface LogSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  hasActiveSearch: boolean;
  hint?: string;
  labels: {
    placeholder: string;
    ariaLabel: string;
    submit: string;
    clear: string;
    scopeNote: string;
  };
}

export interface LogSearchBarHandle {
  focus: () => void;
}

export const LogSearchBar = forwardRef<LogSearchBarHandle, LogSearchBarProps>(
  ({ value, onChange, onSubmit, onClear, hasActiveSearch, hint, labels }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

    useEffect(() => {
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
        event.preventDefault();
        inputRef.current?.focus();
      }
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <Box>
        <Flex gap="2" alignItems="center" flexWrap="wrap">
          <Box position="relative" flex="1" minW={{ base: 'full', md: '320px' }} maxW="560px">
            <Box
              position="absolute"
              left="3"
              top="50%"
              transform="translateY(-50%)"
              color="fg.muted"
              pointerEvents="none"
              aria-hidden
            >
              <Icon as={FiSearch} />
            </Box>
            <Input
              ref={inputRef}
              size="sm"
              paddingLeft="9"
              paddingRight={hasActiveSearch || value ? '9' : '3'}
              value={value}
              placeholder={labels.placeholder}
              aria-label={labels.ariaLabel}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              data-testid="system-logs-search-input"
            />
            {(hasActiveSearch || value) && (
              <IconButton
                aria-label={labels.clear}
                title={labels.clear}
                size="2xs"
                variant="ghost"
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                onClick={onClear}
                data-testid="system-logs-search-clear"
              >
                <Icon as={FiX} />
              </IconButton>
            )}
          </Box>
          <Button
            title={labels.submit}
            size="sm"
            variant="outline"
            onClick={onSubmit}
            data-testid="system-logs-search-submit"
          />
        </Flex>
        <Text
          fontSize="xs"
          color={hint ? 'fg.error' : 'fg.muted'}
          mt={1}
          role={hint ? 'alert' : undefined}
        >
          {hint ?? labels.scopeNote}
        </Text>
      </Box>
    );
  }
);

LogSearchBar.displayName = 'LogSearchBar';
