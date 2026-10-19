import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

import { Icon } from '../Icon';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const TrendIcon: IconType = trend === 'up' ? FiTrendingUp : FiTrendingDown;
  const trendColor = trend === 'up' ? 'feedBack.successMain' : 'feedBack.errorMain';

  return (
    <Box bg="formBG" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="border1">
      <Flex justify="space-between" align="start" mb={2}>
        <Text fontSize="sm" color="primitiveTexteColor" fontWeight="medium">
          {title}
        </Text>
        {trend && <Icon as={TrendIcon} boxSize={4} color={trendColor} />}
      </Flex>
      <Heading size="2xl" mb={1} color="cardColor">
        {value}
      </Heading>
      {subtitle && (
        <Text fontSize="sm" color="primitiveDisableTextColor">
          {subtitle}
        </Text>
      )}
    </Box>
  );
}
