/* eslint-disable import/no-unresolved */
// src/components/Form/Select.tsx

import { useMemo } from 'react';

import { Select as ChakraSelect, Portal, Skeleton, createListCollection } from '@chakra-ui/react';

import { Option } from '@/@types/option';

import { Field } from './Field';

export type CSSPosition = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

interface SelectProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  name: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  error?: string;
  options: Array<Option<any>>;
  position?: CSSPosition;
  tooltip?: string;
  noClearable?: boolean;
  value?: Option<any> | Option<any>[] | null;
  onChange?: (value: any) => void;
  defaultValue?: Option<any> | null;
  multiple?: boolean;
  borderRadius?: string;
  /** Desabilita o Portal - use quando o Select está dentro de modais/dialogs */
  disablePortal?: boolean;
  loading?: boolean;
  /**
   * Opcional/aditivo: desabilita opções individuais (a opção segue visível,
   * mas não selecionável). Ausente = comportamento anterior.
   */
  isOptionDisabled?: (option: Option<any>) => boolean;
}

export function Select({
  label,
  name,
  options: optionsProp = [],
  isRequired,
  isReadOnly,
  isDisabled,
  error,
  helperText,
  placeholder = 'Selecione uma opção',
  tooltip,
  noClearable,
  value,
  onChange,
  defaultValue,
  multiple = false,
  borderRadius = 'md',
  disablePortal = false,
  loading = false,
  isOptionDisabled,
}: SelectProps) {
  const options = useMemo(
    () =>
      isOptionDisabled
        ? optionsProp.map((opt) => (isOptionDisabled(opt) ? { ...opt, disabled: true } : opt))
        : optionsProp,
    [optionsProp, isOptionDisabled]
  );

  // Cria a coleção de itens para o Chakra UI Select
  const collection = useMemo(
    () =>
      createListCollection({
        items: options,
        itemToString: (item: Option<any>) => item.label,
        itemToValue: (item: Option<any>) => item.value,
        isItemDisabled: (item: Option<any>) => !!item.disabled,
      }),
    [options]
  );

  // Converte o valor para o formato esperado pelo Chakra UI Select
  const chakraValue = useMemo(() => {
    if (!value || value === null) return [];
    if (Array.isArray(value)) {
      return value.map((v) => v.value);
    }
    return [value.value];
  }, [value]);

  // Converte o defaultValue para o formato esperado
  const chakraDefaultValue = useMemo(() => {
    if (!defaultValue || defaultValue === null) return undefined;
    return [defaultValue.value];
  }, [defaultValue]);

  // Handler para mudanças de valor
  const handleValueChange = (details: any) => {
    if (!onChange) return;

    const selectedValues = details.value;
    if (multiple) {
      const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
      onChange(selectedOptions);
    } else {
      const selectedOption = options.find((opt) => opt.value === selectedValues[0]);
      onChange(selectedOption || null);
    }
  };

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
    >
      <Skeleton loading={loading} borderRadius="md" width="full">
        <ChakraSelect.Root
          collection={collection}
          name={name}
          value={chakraValue}
          defaultValue={chakraDefaultValue}
          onValueChange={handleValueChange}
          disabled={isDisabled || isReadOnly}
          invalid={!!error}
          multiple={multiple}
          positioning={{ sameWidth: true }}
        >
          <ChakraSelect.HiddenSelect />
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <ChakraSelect.Control
            position="relative"
            display="flex"
            alignItems="center"
            borderRadius={borderRadius}
            _hover={{
              '& [data-part="indicator"]': {
                color: 'semantic.neutral.900',
              },
            }}
          >
            {/* @ts-ignore - Chakra UI v3 type issue */}
            <ChakraSelect.Trigger
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              width="full"
              minHeight="38px"
              height="38px"
              paddingX="3"
              paddingY="0"
              fontSize="sm"
              color="semantic.neutral.900"
              background="inputBG"
              border="1px solid"
              borderColor={error ? 'danger.default' : 'border2'}
              borderRadius={borderRadius}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: error ? 'danger.default' : 'border.muted',
              }}
              _focus={{
                borderColor: error ? 'danger.default' : 'primary.500',
                boxShadow: error
                  ? '0 0 0 1px var(--chakra-colors-danger-default)'
                  : '0 0 0 1px var(--chakra-colors-primary-500)',
                outline: 'none',
              }}
              _disabled={{
                opacity: 0.4,
                cursor: 'not-allowed',
                backgroundColor: 'semantic.neutral.200',
              }}
            >
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <ChakraSelect.ValueText placeholder={placeholder} />
            </ChakraSelect.Trigger>
            <ChakraSelect.IndicatorGroup
              position="absolute"
              right="0"
              top="0"
              bottom="0"
              display="flex"
              alignItems="center"
              gap="0"
              paddingRight="3"
              pointerEvents="none"
            >
              {!noClearable && !isDisabled && !isReadOnly && (
                <>
                  {/* @ts-ignore - Chakra UI v3 type issue */}
                  <ChakraSelect.ClearTrigger
                    pointerEvents="auto"
                    color="semantic.neutral.700"
                    cursor="pointer"
                    padding="1"
                    borderRadius="sm"
                    _hover={{
                      color: 'semantic.neutral.900',
                      backgroundColor: 'semantic.neutral.100',
                    }}
                  />
                  <span
                    style={{
                      height: '16px',
                      width: '1px',
                      backgroundColor: 'var(--chakra-colors-border-default)',
                      margin: '0 4px',
                    }}
                  />
                </>
              )}
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <ChakraSelect.Indicator color="semantic.neutral.700" fontSize="sm" />
            </ChakraSelect.IndicatorGroup>
          </ChakraSelect.Control>
          {disablePortal ? (
            // Sem Portal - para uso dentro de modais/dialogs
            // @ts-ignore - Chakra UI v3 type issue
            <ChakraSelect.Positioner zIndex={9999}>
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <ChakraSelect.Content
                background="semantic.neutral.200"
                borderRadius="md"
                boxShadow="lg"
                border="1px solid"
                borderColor="border2"
                padding="1"
                maxHeight="300px"
                overflowY="auto"
                marginTop="1"
              >
                {options.length === 0 ? (
                  // @ts-ignore - Chakra UI v3 type issue
                  <ChakraSelect.Item
                    item={{ label: 'Sem opções', value: '' }}
                    disabled
                    display="flex"
                    alignItems="center"
                    paddingX="2"
                    paddingY="1.5"
                    fontSize="sm"
                    color="semantic.neutral.700"
                    background="inputBG"
                    borderRadius="sm"
                    opacity={0.5}
                  >
                    Sem opções
                  </ChakraSelect.Item>
                ) : (
                  options.map((option) => (
                    // @ts-ignore - Chakra UI v3 type issue
                    <ChakraSelect.Item
                      key={option.value}
                      item={option}
                      disabled={option.disabled}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      paddingX="2"
                      paddingY="1.5"
                      fontSize="sm"
                      color="semantic.neutral.700"
                      background="inputBG"
                      borderRadius="sm"
                      cursor="pointer"
                      marginBottom="0.5"
                      transition="all 0.2s"
                      _last={{
                        marginBottom: 0,
                      }}
                      _hover={{
                        backgroundColor: 'blue.700',
                        color: 'white',
                      }}
                      _highlighted={{
                        backgroundColor: 'blue.700',
                        color: 'white',
                      }}
                      _selected={{
                        backgroundColor: 'blue.900',
                        color: 'white',
                        fontWeight: 'medium',
                      }}
                      _disabled={{
                        opacity: 0.4,
                        cursor: 'not-allowed',
                        _hover: {
                          backgroundColor: 'inputBG',
                          color: 'semantic.neutral.700',
                        },
                      }}
                    >
                      {option.label}
                    </ChakraSelect.Item>
                  ))
                )}
              </ChakraSelect.Content>
            </ChakraSelect.Positioner>
          ) : (
            // Com Portal - comportamento padrão
            <Portal>
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <ChakraSelect.Positioner zIndex={9999}>
                {/* @ts-ignore - Chakra UI v3 type issue */}
                <ChakraSelect.Content
                  background="semantic.neutral.200"
                  borderRadius="md"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="border2"
                  padding="1"
                  maxHeight="300px"
                  overflowY="auto"
                  marginTop="1"
                >
                  {options.length === 0 ? (
                    // @ts-ignore - Chakra UI v3 type issue
                    <ChakraSelect.Item
                      item={{ label: 'Sem opções', value: '' }}
                      disabled
                      display="flex"
                      alignItems="center"
                      paddingX="2"
                      paddingY="1.5"
                      fontSize="sm"
                      color="semantic.neutral.700"
                      background="inputBG"
                      borderRadius="sm"
                      opacity={0.5}
                    >
                      Sem opções
                    </ChakraSelect.Item>
                  ) : (
                    options.map((option) => (
                      // @ts-ignore - Chakra UI v3 type issue
                      <ChakraSelect.Item
                        key={option.value}
                        item={option}
                        disabled={option.disabled}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        paddingX="2"
                        paddingY="1.5"
                        fontSize="sm"
                        color="semantic.neutral.700"
                        background="inputBG"
                        borderRadius="sm"
                        cursor="pointer"
                        marginBottom="0.5"
                        transition="all 0.2s"
                        _last={{
                          marginBottom: 0,
                        }}
                        _hover={{
                          backgroundColor: 'blue.700',
                          color: 'white',
                        }}
                        _highlighted={{
                          backgroundColor: 'blue.700',
                          color: 'white',
                        }}
                        _selected={{
                          backgroundColor: 'blue.900',
                          color: 'white',
                          fontWeight: 'medium',
                        }}
                        _disabled={{
                          opacity: 0.4,
                          cursor: 'not-allowed',
                          _hover: {
                            backgroundColor: 'inputBG',
                            color: 'semantic.neutral.700',
                          },
                        }}
                      >
                        {option.label}
                      </ChakraSelect.Item>
                    ))
                  )}
                </ChakraSelect.Content>
              </ChakraSelect.Positioner>
            </Portal>
          )}
        </ChakraSelect.Root>
      </Skeleton>
    </Field>
  );
}
