import { forwardRef } from "react";

import { Box, Flex, useToken } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

import { ThemeTypes } from "@/contexts/ThemeContext";

import { LanguageDate } from "@/@types/language";

import { CardPublic } from "./CardPublic";

import LOGO_SRC_DARK from "@/assets/logo-gb-armazem-dark.png";
import LOGO_SRC from "@/assets/logo-gb-armazem.png";
interface CardImprintInfoProps {
  children: React.ReactNode;
  link: string;
  themeGB: ThemeTypes;
  languageGB: LanguageDate;
}

const CardImprintInfo = forwardRef<HTMLDivElement, CardImprintInfoProps>(
  ({ children, link, themeGB }, ref) => {
    const [textColor, bgColor] = useToken("colors", [
      "primitiveTexteColor",
      "primitiveBG",
    ]);

    const logo = themeGB === "dark" ? LOGO_SRC_DARK : LOGO_SRC;
    return (
      <Flex justifyContent="center" ref={ref} background={ref ? "#fff" : ""}>
        <CardPublic
          themeGB={themeGB}
          header="QR Code"
          width="full"
          background={ref ? "#fff" : ""}
          margin={ref ? "8" : "0"}
          print={ref ? true : false}
        >
          <Flex
            justifyContent="space-between"
            flexDirection={"column"}
            alignItems="center"
            gap={ref ? "8" : "4"}
            width="full"
          >
            <Box
              padding="2"
              background={ref ? "#fff" : "primitiveBG"}
              marginEnd="2"
              borderRadius="md"
              height="fit-content"
              width="fit-content"
              marginTop={ref ? "4" : "2"}
            >
              <QRCodeSVG
                value={link}
                size={ref ? 420 : 200}
                fgColor={ref ? "#000" : textColor}
                bgColor={ref ? "#fff" : bgColor}
                level="H"
                imageSettings={{
                  src: logo,
                  excavate: true,
                  width: ref ? 80 : 40,
                  height: ref ? 70 : 30,
                }}
              />
            </Box>
            <Box width="full" flexDirection={"column"} alignItems="center">
              {children}
            </Box>
          </Flex>
        </CardPublic>
      </Flex>
    );
  },
);

CardImprintInfo.displayName = "CardImprintInfo";

export { CardImprintInfo };
