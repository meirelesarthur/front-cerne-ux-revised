import { Flex, FlexProps, Image, Separator } from "@chakra-ui/react";

import { ThemeTypes } from "@/contexts/ThemeContext";

import { Text } from "./Text";

import logoGBArmazemDark from "@/assets/logo-gb-armazem-dark.png";
import logoGBArmazem from "@/assets/logo-gb-armazem.png";

interface CardPublicProps extends FlexProps {
  children: React.ReactNode;
  header: string;
  themeGB: ThemeTypes;
  loading?: boolean;
  print?: boolean;
}

export function CardPublic({
  children,
  header,
  themeGB,
  loading,
  print,
  ...rest
}: CardPublicProps) {
  return (
    <Flex
      height="fit-content"
      width="620px"
      border={print ? "2px solid" : "1px solid"}
      borderColor="green.800"
      borderRadius="md"
      flexDirection="column"
      paddingX="2"
      paddingY="2"
      justifyContent="space-between"
      boxShadow="md"
      color="semanticNeutral.800"
      {...rest}
    >
      <Flex
        flexDirection="column"
        justifyContent="space-between"
        height={"full"}
        border={print ? "2px solid" : "1px solid"}
        borderColor="green.800"
        paddingTop="2"
      >
        <Flex flexDirection="column" gap="2">
          <Text
            fontSize="medium"
            fontWeight="bold"
            color="green.700"
            paddingLeft="2"
            loading={loading}
          >
            {header}
          </Text>
          <Separator
            borderColor="green.800"
            marginBottom="2"
            borderTopWidth={print ? "2px" : ""}
          />
        </Flex>
        {children}
        <Flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          paddingBottom="2"
        >
          <Separator
            borderColor="green.800"
            marginTop="2"
            borderTopWidth={print ? "2px" : ""}
          />
          <Image
            src={themeGB === "light" ? logoGBArmazem : logoGBArmazemDark}
            height={print ? "24" : "12"}
            width={print ? "28" : "16"}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
