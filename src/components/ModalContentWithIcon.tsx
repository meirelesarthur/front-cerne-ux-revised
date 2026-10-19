import { Box, Dialog } from "@chakra-ui/react";

import { getThemeGB } from "@/utils/auth-token";

interface ModalContentWithIconProps
  extends React.ComponentProps<typeof Dialog.Content> {
  children: React.ReactNode;
  colorIcon?: string;
  colorCicle?: string;
}

export function ModalContentWithIcon({
  children,
  colorIcon = "colorIcon.success",
  colorCicle = "colorCicle.success",
  ...props
}: ModalContentWithIconProps) {
  const themeGB = getThemeGB();
  return (
    // @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis
    <Dialog.Content
      position="relative"
      _after={{
        position: "absolute",
        top: "0",
        left: "0",
        content: '""',
        width: "100%",
        height: "8px",
        backgroundColor: themeGB !== "light" ? colorCicle : colorIcon,
        borderRadius: "0.375rem 0.375rem 0 0",
      }}
      {...props}
    >
      <Box width="full" height="10" />
      {children}
    </Dialog.Content>
  );
}
