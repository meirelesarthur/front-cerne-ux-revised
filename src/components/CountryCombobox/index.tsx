// CountryCombobox - Componente de seleção de país usando Chakra UI v3 Combobox
// Integração nativa com o design system, busca e bandeiras via emoji
// Estilizado para seguir o mesmo padrão visual do Select component

import {
  Combobox,
  HStack,
  Portal,
  Skeleton,
  Text,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { countries, getCountryByCode, type CountryItem } from './countries';
import { Field } from '@/components/Form/Field';

interface CountryComboboxProps {
  /** Label do campo */
  label?: string;
  /** Código do país selecionado (ISO 3166-1 alpha-2, ex: "BR", "US") */
  value: string;
  /** Callback quando um país é selecionado */
  onChange: (countryCode: string) => void;
  /** Placeholder quando nenhum país está selecionado */
  placeholder?: string;
  /** Placeholder do campo de busca */
  searchPlaceholder?: string;
  /** Desabilitar o componente */
  disabled?: boolean;
  /** Tamanho do componente */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Largura do componente */
  width?: string | number;
  /** ID para testes */
  id?: string;
  /** Border radius customizado (padrão: "md", use "12px" para telas de registro) */
  borderRadius?: string;
  /** Campo obrigatório */
  isRequired?: boolean;
  /** Mensagem de erro */
  error?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Tooltip */
  tooltip?: string;
  /** Não mostrar botão de limpar */
  noClearable?: boolean;
  loading?: boolean;
  isRegistration?: boolean; // Se true, aplica estilos específicos para telas de registro (ex: borderRadius 12px)
}

export function CountryCombobox({
  label,
  value,
  onChange,
  placeholder = 'Selecione o país',
  disabled = false,
  size = 'sm',
  width = '100%',
  id,
  borderRadius = 'md',
  isRequired,
  error,
  helperText,
  tooltip,
  noClearable,
  loading = false,
  isRegistration = false,
}: CountryComboboxProps) {
  const { contains } = useFilter({ sensitivity: 'base' });

  // Estado local para controlar o valor do input de busca
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { collection, filter } = useListCollection<CountryItem>({
    initialItems: countries,
    filter: contains,
    itemToString: (item: CountryItem) => item.label,
    itemToValue: (item: CountryItem) => item.value,
  });

  // Quando o valor externo muda, atualiza o inputValue
  useEffect(() => {
    if (!isOpen && value) {
      const country = getCountryByCode(value);
      if (country) {
        setInputValue(`${country.emoji} ${country.label}`);
      }
    } else if (!isOpen && !value) {
      setInputValue('');
    }
  }, [value, isOpen]);

  const handleInputValueChange = (details: { inputValue: string }) => {
    setInputValue(details.inputValue);
    filter(details.inputValue);
  };

  const handleValueChange = (details: { value: string[]; items: CountryItem[] }) => {
    if (details.value[0]) {
      onChange(details.value[0]);
      // Atualiza o input com a bandeira + nome
      const country = getCountryByCode(details.value[0]);
      if (country) {
        setInputValue(`${country.emoji} ${country.label}`);
      }
    } else {
      onChange('');
      setInputValue('');
    }
  };

  const handleOpenChange = (details: { open: boolean }) => {
    setIsOpen(details.open);
    if (details.open) {
      // Quando abre, apenas reseta o filtro para mostrar todas as opções
      // Mantém o valor selecionado visível no input
      filter('');
    } else if (value) {
      // Quando fecha, mostra o valor selecionado com bandeira
      const country = getCountryByCode(value);
      if (country) {
        setInputValue(`${country.emoji} ${country.label}`);
      }
    }
  };

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
      invalid={!!error}
    >
      <Skeleton loading={loading} borderRadius="md" width="full">
        {/* @ts-ignore - Chakra UI v3 types issue */}
        <Combobox.Root
          id={id}
          collection={collection}
          value={value ? [value] : []}
          onValueChange={handleValueChange}
          onInputValueChange={handleInputValueChange}
          onOpenChange={handleOpenChange}
          open={isOpen}
          disabled={disabled}
          size={size}
          width={width}
          openOnClick
          inputValue={inputValue}
        >
          {/* @ts-ignore - Chakra UI v3 types issue */}
          <Combobox.Control
            position="relative"
            display="flex"
            alignItems="center"
            borderRadius={isRegistration ? '12px' : borderRadius}
            _hover={{
              '& [data-part="indicator"]': {
                color: 'semantic.neutral.900',
              },
            }}
          >
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.Input
              {...({ autoComplete: 'off', placeholder } as any)}
              display="flex"
              alignItems="center"
              width="full"
              minHeight="32px"
              height={isRegistration ? '36px' : '32px'}
              paddingX="3"
              paddingY="0"
              fontSize="sm"
              color="semantic.neutral.900"
              background={isRegistration ? 'white' : 'transparent'}
              border="1px solid"
              borderColor={error ? 'danger.default' : 'border2'}
              borderRadius={isRegistration ? '12px' : borderRadius}
              cursor="text"
              transition="all 0.2s"
              _placeholder={{ color: 'semantic.neutral.500' }}
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
            />
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.IndicatorGroup
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
              {!noClearable && !disabled && (
                <>
                  {/* @ts-ignore - Chakra UI v3 types issue */}
                  <Combobox.ClearTrigger
                    {...({ pointerEvents: 'auto' } as any)}
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
              {/* @ts-ignore - Chakra UI v3 types issue */}
              <Combobox.Trigger
                {...({ pointerEvents: 'auto' } as any)}
                color="semantic.neutral.700"
                cursor="pointer"
                fontSize="sm"
              />
            </Combobox.IndicatorGroup>
          </Combobox.Control>

          <Portal>
            {/* @ts-ignore - Chakra UI v3 types issue */}
            <Combobox.Positioner zIndex={9999}>
              {/* @ts-ignore - Chakra UI v3 types issue */}
              <Combobox.Content
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
                <Combobox.Empty
                  display="flex"
                  alignItems="center"
                  paddingX="2"
                  paddingY="1.5"
                  fontSize="sm"
                  color="semantic.neutral.700"
                >
                  Nenhum país encontrado
                </Combobox.Empty>
                {collection.items.map((item: CountryItem) => {
                  const isSelected = item.value === value;
                  return (
                    // @ts-ignore - Chakra UI v3 types issue
                    <Combobox.Item
                      key={item.value}
                      item={item}
                      display="flex"
                      alignItems="center"
                      paddingX="2"
                      paddingY="1.5"
                      fontSize="sm"
                      color={isSelected ? 'white' : 'semantic.neutral.700'}
                      background={isSelected ? 'blue.900' : 'input.bG'}
                      fontWeight={isSelected ? 'medium' : 'normal'}
                      borderRadius="sm"
                      cursor="pointer"
                      marginBottom="0.5"
                      transition="all 0.2s"
                      _last={{
                        marginBottom: 0,
                      }}
                      _hover={{
                        backgroundColor: isSelected ? 'blue.900' : 'blue.700',
                        color: 'white',
                      }}
                      _highlighted={{
                        backgroundColor: isSelected ? 'blue.900' : 'blue.700',
                        color: 'white',
                      }}
                    >
                      <HStack gap="2">
                        <Text fontSize="md">{item.emoji}</Text>
                        {/* @ts-ignore - Chakra UI v3 types issue */}
                        <Combobox.ItemText>{item.label}</Combobox.ItemText>
                      </HStack>
                    </Combobox.Item>
                  );
                })}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </Skeleton>
    </Field>
  );
}

export { countries, getCountryByCode, getCountryEmoji, getCountryName } from './countries';
export type { CountryItem } from './countries';
