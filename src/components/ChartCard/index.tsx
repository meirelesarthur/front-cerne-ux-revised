import { Box, Flex, Heading, IconButton } from '@chakra-ui/react';
import { FiMoreVertical } from 'react-icons/fi';

import { Icon } from '../Icon';

interface ChartCardProps {
  title: string;
  type: 'line' | 'bar' | 'area';
}

export function ChartCard({ title }: ChartCardProps) {
  return (
    <Box bg="formBG" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="border1">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" color="primitiveTexteColor">
          {title}
        </Heading>
        <IconButton variant="ghost" size="sm" aria-label="More options">
          <Icon as={FiMoreVertical} />
        </IconButton>
      </Flex>

      {/* Placeholder para o gráfico */}
      <Box
        h="300px"
        bg="primitiveBG"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box textAlign="center" color="primitiveDisableTextColor">
          Chart Placeholder
          <br />
          <small>Will be implemented with ApexCharts</small>
        </Box>
      </Box>
    </Box>
  );
}
