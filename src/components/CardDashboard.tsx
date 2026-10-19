import { Flex, Heading, Icon, Text } from "@chakra-ui/react";
import { MdOutlineInfo } from "react-icons/md";

interface CardDashboardProps {
  title: string;
  color: string;
  valueInfo: string;
  totalVelue?: string;
  percentageInfo?: string;
}

export function CardDashboard({
  color,
  percentageInfo,
  title,
  valueInfo,
  totalVelue,
}: CardDashboardProps) {
  return (
    <Flex
      width="full"
      height="110px"
      // marginY="4"
      padding="2"
      flexDirection="column"
      background="formBG"
      boxShadow="md"
      borderRadius="4"
      justifyContent="end"
    >
      <Flex justifyContent="space-between" width="full" alignItems="center">
        <Flex alignItems="center" gap="2px">
          <Text fontSize="14px">{title}</Text>
          <Icon as={MdOutlineInfo} color="gray.400" />
        </Flex>
        <Flex
          height={percentageInfo ? "20px" : "2px"}
          width={percentageInfo ? "14" : "2"}
          background={color}
          borderRadius="4"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          {percentageInfo && (
            <Text fontSize="14px">{`${percentageInfo}%`}</Text>
          )}
        </Flex>
      </Flex>
      <Flex alignItems="end" paddingX="4" paddingTop="3" width="full">
        <Heading fontSize="30px" height="32px">
          {valueInfo}
        </Heading>
        <Text fontSize="12px">Tn</Text>
      </Flex>
      <Text textAlign="end" height="24px" fontSize="14px" color="gray.400">
        {totalVelue && `${totalVelue} Tn`}
      </Text>
    </Flex>
  );
}
