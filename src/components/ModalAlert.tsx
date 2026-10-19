import { ReactNode } from 'react';

import { CloseButton, Dialog, Flex, Heading, Icon, Portal, Text } from '@chakra-ui/react';
import { CopySuccess } from 'iconsax-react';
import { IconType } from 'react-icons';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

export type ModalAlertTone = 'success' | 'warning' | 'info';

const toneConfig: Record<ModalAlertTone, { icon: IconType; bg: string }> = {
  success: { icon: CopySuccess, bg: 'green.500' },
  warning: { icon: FiAlertTriangle, bg: 'feedBack.warnMain' },
  info: { icon: FiInfo, bg: 'feedBack.infoMain' },
};

export interface ModalAlertProps {
  isOpen: boolean;
  onClose: () => void;
  description: string | ReactNode;
  icon?: IconType;
  /**
   * Tom do círculo/ícone do cabeçalho. ADITIVO e OPCIONAL — default
   * `"success"` preserva 100% o rendering atual (círculo verde + CopySuccess).
   */
  tone?: ModalAlertTone;
}

export function ModalAlert({ isOpen, onClose, tone = 'success' }: ModalAlertProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { icon: ToneIcon, bg: toneBg } = toneConfig[tone];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => {
        if (!e.open) onClose();
      }}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header marginTop="4">
              <Flex flexDirection="column" alignItems={'center'} gap="4">
                <Flex
                  background={toneBg}
                  borderRadius="full"
                  boxSize="14"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={ToneIcon} color="white" fontSize="28" />
                </Flex>
                <Heading as="h1" fontSize="xl" fontWeight="semibold" textAlign="center">
                  {languageGB.defaltStrings.actionSuccess}
                </Heading>
              </Flex>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" textAlign="center" whiteSpace="nowrap">
                {languageGB.defaltStrings.actionSuccessBody}
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                flex="1"
                title={languageGB.defaltStrings.continue}
                variant="solid"
                onClick={() => navigate(-1)}
              />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

<Dialog.Backdrop />;
