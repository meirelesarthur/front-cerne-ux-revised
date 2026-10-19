import { Avatar, Box, Flex, Menu, Text } from '@chakra-ui/react';
import { FiBell, FiChevronDown } from 'react-icons/fi';

import { Icon } from '../Icon';

export function TopBar() {
  return (
    <Box
      as="header"
      h="48px"
      bg="headerPanelBG"
      borderBottom="1px"
      borderColor="border1"
      px={6}
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
    >
      <Flex align="center" gap={4}>
        {/* Notifications */}
        <Box position="relative" cursor="pointer">
          <Icon as={FiBell} boxSize={5} />
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            w="8px"
            h="8px"
            bg="feedBack.errorMain"
            borderRadius="full"
          />
        </Box>

        {/* User Menu */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <Flex align="center" gap={2} cursor="pointer">
              <Avatar.Root size="sm">
                <Avatar.Fallback>UN</Avatar.Fallback>
              </Avatar.Root>
              <Text fontSize="sm" fontWeight="medium">
                User Name
              </Text>
              <Icon as={FiChevronDown} boxSize={4} />
            </Flex>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item value="profile">Profile</Menu.Item>
            <Menu.Item value="settings">Settings</Menu.Item>
            <Menu.Item value="logout" color="feedBack.errorMain">
              Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </Flex>
    </Box>
  );
}
