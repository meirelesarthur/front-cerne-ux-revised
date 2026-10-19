// src/components/ModelSelectionModal.tsx
// Modal reutilizável para seleção de modelo de IA
// Usado antes de processar vulnerabilidades — o usuário escolhe qual modelo usar

import { useState, useEffect } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text, VStack, HStack } from '@chakra-ui/react';
import { FiX, FiCpu, FiCheck } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modelAlias: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function ModelSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Selecionar Modelo',
  description = 'Escolha o modelo de IA para processar as vulnerabilidades:',
}: ModelSelectionModalProps) {
  const { profile } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const models = profile?.assigned_models || [];

  // Reset ao abrir — auto-seleciona se só tem um modelo
  useEffect(() => {
    if (isOpen) {
      setSelectedModel(models.length === 1 ? models[0].model_alias : null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSelectedModel(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedModel) return;
    onConfirm(selectedModel);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e: { open: boolean }) => !e.open && handleClose()}>
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore - Chakra UI v3 type issue */}
        <Dialog.Positioner>
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <Dialog.Content maxW="480px">
            <Dialog.Header>
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <Dialog.Title>
                <HStack gap={2}>
                  <Icon as={FiCpu} />
                  <Text>{title}</Text>
                </HStack>
              </Dialog.Title>
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <Dialog.CloseTrigger asChild>
                <Flex
                  as="button"
                  position="absolute"
                  right={4}
                  top={4}
                  w={8}
                  h={8}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  cursor="pointer"
                  _hover={{ bg: 'sidebarItemHoverBG' }}
                  onClick={handleClose}
                >
                  <Icon as={FiX} color="sidebarSubtitleColor" boxSize={5} />
                </Flex>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="sidebarSubtitleColor">
                  {description}
                </Text>

                {models.length === 0 ? (
                  <Box
                    p={4}
                    borderRadius="lg"
                    bg="red.500/10"
                    borderWidth="1px"
                    borderColor="red.500/30"
                  >
                    <Text fontSize="sm" color="red.300" textAlign="center">
                      Nenhum modelo disponível. Solicite ao administrador a atribuição de modelos à sua conta.
                    </Text>
                  </Box>
                ) : (
                  <VStack gap={2} align="stretch">
                    {models.map((model) => (
                      <Box
                        key={model.model_alias}
                        as="button"
                        p={3}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={selectedModel === model.model_alias ? 'blue.500' : 'whiteAlpha.200'}
                        bg={selectedModel === model.model_alias ? 'blue.500/15' : 'transparent'}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          bg: selectedModel === model.model_alias ? 'blue.500/20' : 'whiteAlpha.50',
                          borderColor: selectedModel === model.model_alias ? 'blue.400' : 'whiteAlpha.300',
                        }}
                        onClick={() => setSelectedModel(model.model_alias)}
                        textAlign="left"
                      >
                        <HStack justify="space-between">
                          <HStack gap={2}>
                            <Icon
                              as={FiCpu}
                              color={selectedModel === model.model_alias ? 'blue.400' : 'sidebarSubtitleColor'}
                              boxSize={4}
                            />
                            <Text
                              fontSize="sm"
                              fontWeight={selectedModel === model.model_alias ? 'semibold' : 'normal'}
                              color={selectedModel === model.model_alias ? 'blue.300' : 'sidebarTitleColor'}
                            >
                              {model.model_name}
                            </Text>
                          </HStack>
                          {selectedModel === model.model_alias && (
                            <Icon as={FiCheck} color="blue.400" boxSize={4} />
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button title="Cancelar" variant="outline" onClick={handleClose} mr={2} />
              <Button
                title="Confirmar"
                colorPalette="purple"
                onClick={handleConfirm}
                loading={isLoading}
                disabled={!selectedModel || models.length === 0}
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default ModelSelectionModal;
