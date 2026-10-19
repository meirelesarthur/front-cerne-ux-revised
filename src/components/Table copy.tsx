import { cloneElement, Fragment, ReactElement, ReactNode } from "react";

import {
    Box,
    Center,
    Table as CkTable,
    Flex,
    HStack,
    Icon,
    Select,
    Text,
    useMediaQuery,
} from "@chakra-ui/react";
import { flexRender, Row } from "@tanstack/react-table";
import { IoTimeOutline } from "react-icons/io5";

import { useLanguage } from "@/hooks/useLanguage";
import { useTable } from "@/hooks/useTable";

import { HeadingTextGrid } from "./HeadingTextGrid";
import { IconButtonTable } from "./IconButtonTable";
import { Pagination } from "./Pagination";

interface TableProps {
  header?: ReactNode;
  rowSubComponent?: (props: { row: Row<any> }) => ReactElement;
  form?: boolean;
  title?: string;
  marginTop?: string;
  isLoading?: boolean;
}

export function Table({
  header,
  rowSubComponent,
  form,
  title,
  marginTop,
}: TableProps) {
  const { table, pagination, onSelectPage, hasFooter } = useTable();
  const { languageGB } = useLanguage();
  const [isMobile, isMobileSx] = useMediaQuery([
    "(max-width: 680px)",
    "(max-width: 360px)",
  ]);

  return (
    <Box>
      {form && (header || title) && (
        <Flex
          flex="1"
          height="50px"
          flexDirection={isMobile ? "column" : "row"}
          alignItems={isMobile ? "center" : "center"}
          paddingX="4"
          borderTopRadius="md"
          justifyContent={isMobile ? "center" : "space-between"}
          gap={isMobile ? 4 : 0}
          marginTop={isMobile ? "4" : marginTop || "0"}
          background="gridHeadEndFooter"
          // borderX="1px"
          // borderTop="1px"
          style={
            form
              ? {
                  borderTop: "1px solid",
                  borderLeft: "1px solid",
                  borderRight: "1px solid",
                  borderColor: "var(--chakra-colors-borderGrid)",
                }
              : {}
          }
        >
          <Flex
            justifyContent={isMobileSx ? "center" : "space-between"}
            wrap="wrap"
            alignItems="center"
            // gap={isMobile ? 4 : 0}
            width="full"
            color="white"
          >
            {form && title ? (
              <HeadingTextGrid>{title}</HeadingTextGrid>
            ) : (
              header
            )}
          </Flex>
        </Flex>
      )}
      <Box
        width="full"
        overflowX="auto"
        borderTop="1px"
        marginTop={!form ? (isMobile ? "4" : marginTop || "6") : ""}
        borderTopRadius={form ? "" : "md"}
        borderColor="borderGrid"
        css={{
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#F0F0F0",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#C4C4C4",
            borderRadius: "1.5rem",
          },
        }}
        style={
          form
            ? {
                borderLeft: "1px solid",
                borderRight: "1px solid",
                borderColor: "var(--chakra-colors-borderGrid)",
              }
            : {}
        }
      >
        <CkTable.Root variant="outline">
          <CkTable.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <CkTable.Row
                key={headerGroup.id}
                borderBottom="1px solid"
                borderColor="borderGrid"
              >
                {headerGroup.headers.map((header) => (
                  <CkTable.ColumnHeader
                    key={header.id}
                    style={header.column.columnDef.meta?.style || undefined}
                    paddingTop={
                      header.column.columnDef.id === "acoes" ? 0 : "10px"
                    }
                    width={
                      header.column.columnDef.id === "acoes" ? "112px" : "300px"
                    }
                  >
                    <Flex
                      justifyContent={
                        header.column.columnDef.id === "edit" ||
                        header.column.columnDef.id === "acoes"
                          ? "end"
                          : "left"
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Flex>
                  </CkTable.ColumnHeader>
                ))}
              </CkTable.Row>
            ))}
          </CkTable.Header>
          <CkTable.Body>
            {table.getRowModel().rows.length === 0 ? (
              <CkTable.Row>
                <CkTable.Cell colSpan={100}>
                  <Center padding="2" color="textGridColor">
                    <Text fontSize="lg">
                      {languageGB.defaltStrings.emptyData}
                    </Text>
                  </Center>
                </CkTable.Cell>
              </CkTable.Row>
            ) : (
              <>
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <CkTable.Row key={row.id}>
                      {row.getVisibleCells().map((cell, index) => (
                        <CkTable.Cell
                          key={cell.id}
                          onClick={
                            cell.column.id === "acoes" ||
                            cell.column.id === "pdf" ||
                            cell.column.id === "select"
                              ? null!
                              : row.getToggleSelectedHandler()
                          }
                          opacity={row.original.enabled === false ? "0.5" : "1"}
                          textDecoration={
                            row.original.enabled === false ? "line-through" : ""
                          }
                          backgroundColor={
                            row.original.idTemp ? "registerTemperaryBG" : ""
                          }
                          borderBottom="1px solid"
                          borderColor="borderGrid"
                          paddingBottom={
                            cell.column.id === "acoes" || "edit" ? 0 : "10px"
                          }
                          paddingTop={
                            cell.column.id === "acoes" || "edit" ? 0 : "10px"
                          }
                          background={
                            row.getIsSelected() ? "selectedTextGridColor" : ""
                          }
                          cursor="pointer"
                          style={cell.column.columnDef.meta?.style || undefined}
                        >
                          <Flex
                            justifyContent={
                              cell.column.columnDef.id === "edit" ||
                              cell.column.columnDef.id === "acoes"
                                ? "end"
                                : "left"
                            }
                            flexDirection="row"
                            paddingRight={
                              cell.column.columnDef.id === "edit" ? 2 : 0
                            }
                          >
                            {row.original.idTemp &&
                              row.getVisibleCells().length - 1 === index && (
                                <IconButtonTable
                                  aria-label=""
                                  mensegerTooltip={
                                    languageGB.defaltStrings.registerNoSeve
                                  }
                                  size="xs"
                                  color="yellow.900"
                                  // @ts-ignore - custom variant
                                  variant="ghost_warning"
                                >
                                  <Icon as={IoTimeOutline} />
                                </IconButtonTable>
                              )}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Flex>
                        </CkTable.Cell>
                      ))}
                    </CkTable.Row>
                    {row.getIsSelected() && row.getCanExpand() && (
                      <CkTable.Row
                        borderBottom="1px solid"
                        borderColor="borderGrid"
                      >
                        <CkTable.Cell
                          colSpan={row.getVisibleCells().length}
                          data-fefe={row.getIsExpanded()}
                          padding="10 !important"
                        >
                          {rowSubComponent
                            ? cloneElement(
                                rowSubComponent({ row }) as ReactElement,
                                {
                                  row,
                                },
                              )
                            : null}
                        </CkTable.Cell>
                      </CkTable.Row>
                    )}
                  </Fragment>
                ))}
              </>
            )}
          </CkTable.Body>
          {hasFooter && (
            <CkTable.Footer>
              {table.getFooterGroups().map((footerGroup) => (
                <CkTable.Row key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <CkTable.ColumnHeader key={header.id}>
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                    </CkTable.ColumnHeader>
                  ))}
                </CkTable.Row>
              ))}
            </CkTable.Footer>
          )}
        </CkTable.Root>
      </Box>
      {!!pagination ? (
        <>
          {/* <Flex height="50px" background="gridHeadEndFooter"></Flex> */}
          <Flex
            width="full"
            height="40px"
            background="gridHeadEndFooter"
            color="white"
            alignItems="center"
            wrap="wrap"
            paddingX="4"
            borderBottomRadius="md"
            justifyContent="space-between"
            // marginBottom={form && !title ? "0" : isMobile ? "10" : "14"}
            style={
              form
                ? {
                    borderLeft: "1px solid var(--chakra-colors-borderGrid)",
                    borderRight: "1px solid var(--chakra-colors-borderGrid)",
                    borderBottom: "1px solid var(--chakra-colors-borderGrid)",
                  }
                : {}
            }
          >
            {pagination.totalRecords >= 1 && (
              <>
                <Text fontSize="sm" color="gray.400">
                  {`${languageGB.defaltStrings.showing} ${
                    table.getRowModel().rows.length
                  } ${languageGB.defaltStrings.of} ${
                    pagination?.totalRecords || 0
                  }`}
                </Text>
                <Flex>
                  <HStack
                    gap="2"
                    flexDirection="row"
                    marginLeft="4"
                    paddingTop={"1"}
                    display={isMobile ? "none" : "flex"}
                  >
                    <Text fontSize="sm" color="gray.400">
                      {languageGB.defaltStrings.linePerPage}
                    </Text>
                    <Select.Root
                      data-cy="selectShowLines"
                      size="sm"
                      width="3.2rem"
                      variant="subtle"
                      border="0"
                      color="gray.400"
                      value={table.getState().pagination.pageSize}
                      onChange={onSelectPage}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Select.Root>
                  </HStack>
                  <Pagination />
                </Flex>
              </>
            )}
          </Flex>
        </>
      ) : (
        <Flex
          width="full"
          height="40px"
          background="gridHeadEndFooter"
          color="white"
          paddingX="4"
          borderBottomRadius="md"
          style={
            form
              ? {
                  borderLeft: "1px solid var(--chakra-colors-borderGrid)",
                  borderRight: "1px solid var(--chakra-colors-borderGrid)",
                  borderBottom: "1px solid var(--chakra-colors-borderGrid)",
                }
              : {}
          }
        />
      )}
    </Box>
  );
}
