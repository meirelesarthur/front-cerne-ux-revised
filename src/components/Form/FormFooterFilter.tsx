import React, {
  Children,
  cloneElement,
  forwardRef,
  Fragment,
  ReactElement,
} from "react";

import { Box, Flex, FlexProps, HStack, StackProps } from "@chakra-ui/react";

interface FormFooterProps extends FlexProps {}

export const FormFooterFilter = forwardRef<
  HTMLDivElement,
  FormFooterProps & { hStackProps?: StackProps }
>(({ children, hStackProps, ...rest }, ref) => {
  const childrenArray = Children.toArray(children);

  return (
    <Flex
      ref={ref}
      width="full"
      paddingBottom="4"
      flexDirection="column"
      alignItems="flex-start"
      background="formBG"
      gap="4"
      zIndex="1"
      {...rest}
    >
      {childrenArray.length >= 3 ? (
        <Fragment>
          <Box key="form-footer-first-child-wrapper">{childrenArray[0]}</Box>
          <HStack
            key="form-footer-grouped-items-hstack"
            gap="4"
            width="full"
            {...hStackProps}
          >
            {Children.map(childrenArray.slice(1), (child, index) => {
              if (React.isValidElement(child)) {
                return cloneElement(child as ReactElement, {
                  key: child.key || `form-footer-hstack-child-${index}`,
                });
              }
              return child;
            })}
          </HStack>
        </Fragment>
      ) : (
        Children.map(childrenArray, (child, index) => {
          if (React.isValidElement(child)) {
            return cloneElement(child as ReactElement, {
              key: child.key || `form-footer-direct-child-${index}`,
            });
          }
          return child;
        })
      )}
    </Flex>
  );
});

FormFooterFilter.displayName = "FormFooter";
