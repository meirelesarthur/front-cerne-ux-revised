import { useEffect } from "react";

import { Breadcrumb as ChakraBreadcrumb, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface BreadcrumbProps {
  items: string[];
  path?: string[];
  noGrid?: boolean;
  color?: string;
}

export function Breadcrumb({ items, path, noGrid, color }: BreadcrumbProps) {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = `GB Armazem - ${items[items.length - 1]}`;
  }, [items]);

  return (
    <ChakraBreadcrumb.Root
      fontSize={noGrid ? "12px" : "14px"}
      fontWeight="normal"
      color={color || "semanticNeutral.700"}
      opacity={noGrid ? "1" : "0.6"}
      display="flex"
      flexWrap="wrap"
      gap={2}
      py={1}
    >
      <ChakraBreadcrumb.List>
        {items.map((item: string, index: number) => {
          const isLast = index === items.length - 1;
          return (
            <>
              <ChakraBreadcrumb.Item key={item} style={{ flexWrap: "wrap" }}>
                {path && path[index] ? (
                  <ChakraBreadcrumb.Link
                    as="button"
                    onClick={() =>
                      navigate(path[index], {
                        replace: true,
                      })
                    }
                  >
                    <Text>{item}</Text>
                  </ChakraBreadcrumb.Link>
                ) : isLast ? (
                  <ChakraBreadcrumb.CurrentLink>
                    <Text>{item}</Text>
                  </ChakraBreadcrumb.CurrentLink>
                ) : (
                  <Text>{item}</Text>
                )}
              </ChakraBreadcrumb.Item>
              {!isLast && (
                <ChakraBreadcrumb.Separator>
                  <Text as="span">/</Text>
                </ChakraBreadcrumb.Separator>
              )}
            </>
          );
        })}
      </ChakraBreadcrumb.List>
    </ChakraBreadcrumb.Root>
  );
}
