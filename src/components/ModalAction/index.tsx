import { useEffect, useState } from "react";

import { Box, Dialog, Heading, Text } from "@chakra-ui/react";

import { Button } from "@/components/Button";

import { LanguageDate } from "@/@types/language";

interface ModalActionProps {
  isOpen: boolean;
  onClose: () => void;
  asyncFunction: () => void;
  clearData: (value: string) => void;
  languageGB: LanguageDate;
  header: string;
  body: string;
  isTimeout?: boolean;
}

export function ModalAction({
  isOpen,
  onClose,
  asyncFunction,
  clearData,
  languageGB,
  header,
  body,
  isTimeout,
}: ModalActionProps) {
  const [timeoutModal, setTimeoutModal] = useState(0);

  function handleCloseModal() {
    if (timeoutModal > 0) {
      return;
    }
    onClose();
    clearData("");
  }

  async function handleAction() {
    if (timeoutModal > 0) {
      return;
    }
    asyncFunction();
    onClose();
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimeout && isOpen) {
      setTimeoutModal(5);
      interval = setInterval(() => {
        setTimeoutModal((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, isTimeout]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e: any) => {
        if (!e.open && timeoutModal === 0) {
          handleCloseModal();
        }
      }}
      size="lg"
      placement="center"
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="500px">
          {/* Espaçamento superior */}
          <Box width="full" height="10" />

          {/* Close button - só mostra se timeout acabou */}
          {timeoutModal <= 0 && <Dialog.CloseTrigger />}

          <Dialog.Header textAlign="center">
            <Heading
              as="h1"
              fontSize="16px"
              fontWeight="semibold"
              textAlign="center"
              width="full"
            >
              {header}
            </Heading>
          </Dialog.Header>

          <Dialog.Body>
            <Text fontSize="sm" textAlign="center">
              {body}
            </Text>
          </Dialog.Body>

          <Dialog.Footer display="flex" gap={3} width="full">
            <Button
              flex="1"
              title={
                timeoutModal > 0
                  ? `${timeoutModal}`
                  : languageGB.defaltStrings.cancel
              }
              variant="outline_danger"
              onClick={handleCloseModal}
            />
            <Button
              flex="1"
              title={
                timeoutModal > 0
                  ? `${timeoutModal}`
                  : languageGB.defaltStrings.confirm
              }
              variant="destructive"
              onClick={handleAction}
            />
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
