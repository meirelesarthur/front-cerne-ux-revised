// src/pages/Administrativo/SystemLogs/HeaderTable.tsx
// Ações do cabeçalho do explorador: filtro por nome (com "limpar") e Atualizar.

import type { ElementType } from 'react';

import { Box, Flex, Icon, IconButton, Input } from '@chakra-ui/react';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';

interface HeaderTableProps {
  filterValue: string;
  onFilterChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  labels: {
    filterPlaceholder: string;
    filterAriaLabel: string;
    clearFilter: string;
    refresh: string;
  };
}

export function HeaderTable({
  filterValue,
  onFilterChange,
  onRefresh,
  isRefreshing,
  labels,
}: HeaderTableProps) {
  return (
    <Flex gap="3" alignItems="center" flexWrap="wrap" justifyContent="flex-end">
      <Box position="relative" minW={{ base: 'full', md: '260px' }}>
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
          size="sm"
          paddingLeft="9"
          paddingRight={filterValue ? '9' : '3'}
          value={filterValue}
          placeholder={labels.filterPlaceholder}
          aria-label={labels.filterAriaLabel}
          onChange={(event) => onFilterChange(event.target.value)}
          data-testid="system-logs-filter"
        />
        {filterValue && (
          <IconButton
            aria-label={labels.clearFilter}
            title={labels.clearFilter}
            size="2xs"
            variant="ghost"
            position="absolute"
            right="2"
            top="50%"
            transform="translateY(-50%)"
            onClick={() => onFilterChange('')}
            data-testid="system-logs-filter-clear"
          >
            <Icon as={FiX} />
          </IconButton>
        )}
      </Box>
      <Button
        title={labels.refresh}
        icon={FiRefreshCw as ElementType}
        size="sm"
        variant="outline"
        loading={isRefreshing}
        onClick={onRefresh}
        data-testid="system-logs-refresh"
      />
    </Flex>
  );
}
