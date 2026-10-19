import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Outlet />
    </Box>
  );
}
