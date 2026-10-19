import { createListCollection, Portal, Select } from '@chakra-ui/react';

interface SelectPaginationProps {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /**
   * Opções de tamanho de página. Default `[5, 10, 25, 50, 100]` (o array
   * hardcoded original), preserva 100% o comportamento dos consumidores
   * existentes que não passam a prop (ex.: `Table.tsx` / `Estados/index.tsx`).
   * Uso: telas com paginação sob outro teto de `per_page` (ex.: Produtos,
   * `TASK-FE-502`) passam `options` explicitamente.
   */
  options?: number[];
}

export function SelectPagination({
  value,
  onChange,
  options = [5, 10, 25, 50, 100],
}: SelectPaginationProps) {
  const pageSizeOptions = createListCollection({
    items: options.map((option) => ({ label: String(option), value: String(option) })),
  });

  return (
    <Select.Root
      collection={pageSizeOptions}
      size="xs"
      width="3.5rem"
      value={[String(value)]}
      onValueChange={(details: { value: string[] }) => {
        const syntheticEvent = {
          target: { value: details.value[0] },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }}
      positioning={{ sameWidth: true }}
    >
      <Select.HiddenSelect />
      {/* @ts-ignore - Chakra UI v3 type issue */}
      <Select.Control
        _hover={{
          '& [data-part="indicator"]': {
            color: 'paginationSelectedColor',
          },
        }}
      >
        {/* @ts-ignore - Chakra UI v3 type issue */}
        <Select.Trigger
          paddingX="2"
          paddingY="1"
          height="auto"
          minHeight="unset"
          color="gray.400"
          background="transparent"
          border="0"
          fontSize="14px"
          cursor="pointer"
          _hover={{
            backgroundColor: 'paginationSelectedBG',
            color: 'paginationSelectedColor',
          }}
        >
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        {/* @ts-ignore - Chakra UI v3 type issue */}
        <Select.Positioner>
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <Select.Content
            background="white"
            borderRadius="md"
            boxShadow="lg"
            border="1px solid"
            borderColor="borderGrid"
            padding="1"
            zIndex={1500}
            backgroundColor="gridBG"
          >
            {pageSizeOptions.items.map((option: { label: string; value: string }) => (
              // @ts-ignore - Chakra UI v3 type issue
              <Select.Item
                item={option}
                key={option.value}
                padding="2"
                cursor="pointer"
                fontSize="14px"
                color="textGridColor"
                background="gridBG"
                _hover={{
                  backgroundColor: 'paginationSelectedBG',
                  color: 'paginationSelectedColor',
                }}
                _selected={{
                  backgroundColor: 'paginationSelectedBG',
                  color: 'paginationSelectedColor',
                }}
              >
                {/* @ts-ignore - Chakra UI v3 type issue */}
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
