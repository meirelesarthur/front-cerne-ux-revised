// src/pages/CadastrosBase/Produtos/Catalogo/ProductDescriptionField.tsx
// -----------------------------------------------------------------------------
// UT-000781 — Descrição do Produto como campo multilinha que CRESCE sozinho
// (`autoresize` do Chakra v3), em vez de `<input>` de linha única que cortava
// o texto numa coluna de 1/4 da grade (até 181 caracteres).
//
// Local à pasta do Produto: NÃO reutiliza `components/Form/Textarea` (84
// consumidores; `minHeight`/padding ficam depois do `{...rest}` e não são
// sobrescrevíveis). A descrição é de linha única na API/legado: Enter é
// bloqueado e quebras coladas viram espaço. Compatível com `register()`.
// -----------------------------------------------------------------------------

import { ChangeEvent, KeyboardEvent, forwardRef } from 'react';

import { Skeleton, Textarea as ChakraTextarea, type TextareaProps } from '@chakra-ui/react';

import { Field } from '@/components/Form/Field';

interface ProductDescriptionFieldProps extends Omit<TextareaProps, 'onChange'> {
  name: string;
  label?: string;
  placeholder?: string;
  error?: string;
  isRequired?: boolean;
  loading?: boolean;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

// `autoresize` existe em runtime (Ark `Field.Textarea` -> Chakra `Textarea`),
// mas o tipo publicado pelo Chakra 3.36 não o expõe em `TextareaProps`.
const AUTORESIZE_PROPS = { autoresize: true } as Record<string, unknown>;

export const ProductDescriptionField = forwardRef<
  HTMLTextAreaElement,
  ProductDescriptionFieldProps
>(({ name, label, error, isRequired, loading, onChange, onKeyDown, ...rest }, ref) => {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    onKeyDown?.(event);
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    // Normaliza quebras de linha coladas (Ctrl+V) para espaço.
    if (/[\r\n]/.test(event.target.value)) {
      event.target.value = event.target.value.replace(/\s*[\r\n]+\s*/g, ' ');
    }
    onChange?.(event);
  }

  return (
    <Field label={label} isRequired={isRequired} invalid={!!error} errorText={error}>
      <Skeleton loading={loading} borderRadius="md" width="full">
        <ChakraTextarea
          id={name}
          name={name}
          ref={ref}
          rows={1}
          {...AUTORESIZE_PROPS}
          resize="none"
          minHeight="38px"
          {...rest}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
      </Skeleton>
    </Field>
  );
});

ProductDescriptionField.displayName = 'ProductDescriptionField';
