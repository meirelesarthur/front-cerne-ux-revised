import { Icon as ChakraIcon, IconProps as ChakraIconProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface IconProps extends Omit<ChakraIconProps, 'as'> {
  as: IconType;
}

export function Icon({ as: IconComponent, ...props }: IconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ChakraIcon as={IconComponent as any} {...props} />;
}
