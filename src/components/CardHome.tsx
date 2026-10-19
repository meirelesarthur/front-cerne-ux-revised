import { Flex, Image, Text, useMediaQuery } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import { getThemeGB } from "@/utils/auth-token";

import { SvgImage } from "./SvgImage";

export function CardHome({ title, id, imgSvg, img }: any) {
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);

  const themeGB = getThemeGB();

  return (
    <Link to={""}>
      <Flex
        alignItems="center"
        key={id}
        justifyContent="space-between"
        flexDirection="column"
        width={isMobile ? "150px" : "190px"}
        height={isMobile ? "170px" : "200px"}
        backgroundColor="secondaryBG"
        borderRadius="lg"
        boxShadow="sm"
        // textColor="semanticNeutral.700"
        paddingX="6"
        paddingY="6"
        marginRight="8"
        marginBottom="8"
        transition=".8s border-color"
        _hover={{
          borderColor: themeGB === "light" ? "primaryMain" : "primaryMain",
        }}
      >
        {imgSvg ? (
          <>
            <Flex
              width={isMobile ? "70px" : "80px"}
              height={isMobile ? "70px" : "80px"}
              alignItems="center"
              justifyContent="center"
            >
              <SvgImage
                color={"cardColor"}
                svgString={imgSvg}
                width="full"
                height="full"
              />
            </Flex>
            {title && (
              <Text
                fontSize="lg"
                fontWeight="medium"
                textAlign="center"
                // textColor="semanticNeutral.800"
                textTransform="uppercase"
              >
                {`${title}`}
              </Text>
            )}
          </>
        ) : (
          <>
            <Flex alignItems="center" justifyContent="center" height="full">
              <Image src={img} />
            </Flex>
            <Text fontSize="lg" fontWeight="medium" textAlign="center">
              {title}
            </Text>
          </>
        )}
      </Flex>
    </Link>
  );
}
