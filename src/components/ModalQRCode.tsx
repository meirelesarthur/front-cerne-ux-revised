import { Box, Dialog, Flex, Portal, useToken } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/Button";
import { CardPublic } from "@/components/CardPublic";

import { ThemeTypes } from "@/contexts/ThemeContext";

import { LanguageDate } from "@/@types/language";

import LOGO_SRC_DARK from "@/assets/logo-gb-armazem-dark.png";
import LOGO_SRC from "@/assets/logo-gb-armazem.png";

interface ModalQRCodeProps {
  isQrModalOpen: boolean;
  setIsQrModalOpen: (value: boolean) => void;
  children: React.ReactNode;
  link: string;
  themeGB: ThemeTypes;
  languageGB: LanguageDate;
}

export function ModalQRCode(props: ModalQRCodeProps) {
  const {
    isQrModalOpen,
    setIsQrModalOpen,
    children,
    link,
    themeGB,
    languageGB,
  } = props;

  const [textColor, bgColor] = useToken("colors", [
    "primitiveTexteColor",
    "primitiveBG",
  ]);

  const logo = themeGB === "dark" ? LOGO_SRC_DARK : LOGO_SRC;

  return (
    // @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis
    <Dialog.Root
      open={isQrModalOpen}
      onOpenChange={(e: { open: boolean }) => setIsQrModalOpen(e.open)}
      size="sm"
    >
      <Portal>
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.Body padding="6">
              <Flex justifyContent="center">
                <CardPublic themeGB={themeGB} header="QR Code" width="full">
                  <Flex
                    justifyContent="space-between"
                    flexDirection={"column"}
                    alignItems="center"
                    gap="4"
                  >
                    <Box
                      padding="2"
                      background="primitiveBG"
                      marginEnd="2"
                      borderRadius="md"
                      height="fit-content"
                      width="fit-content"
                    >
                      <QRCodeSVG
                        value={link}
                        size={200}
                        fgColor={textColor}
                        bgColor={bgColor}
                        level="H"
                        imageSettings={{
                          src: logo,
                          excavate: true,
                          width: 40,
                          height: 30,
                        }}
                      />
                    </Box>
                    <Box>{children}</Box>
                  </Flex>
                </CardPublic>
              </Flex>
            </Dialog.Body>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.Footer paddingX="6" paddingBottom="6">
              <Button
                onClick={() => setIsQrModalOpen(false)}
                title={languageGB.defaltStrings.close}
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
