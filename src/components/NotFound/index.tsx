import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4}>
        <Heading size="4xl">404</Heading>
        <Heading size="lg">Page Not Found</Heading>
        <Text color="gray.600">The page you're looking for doesn't exist.</Text>
        <Button colorScheme="blue" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </VStack>
    </Box>
  );
}
