// src/pages/Operacional/ContratosVenda/SaleContractCalculationFields.tsx
// -----------------------------------------------------------------------------
// Bloco de cálculo do formulário de Contratos de Venda (Operacional /
// Agricultura, esteira 036, TASK-FE-036-204) — reproduz `CL-008`/`EV-FORM-JS`
// (calculadora bidirecional em JS do legado) em React, com os MESMOS guardas
// do Model legado (`bag_weight == 0`). SEM precedente 1:1 no projeto — é o
// único bloco desta feature sem mirror mecânico direto (contrato de tela
// §5.1, "Riscos + solução" da própria Tarefa).
//
//   sacas        = bag_weight > 0 ? quantity / bag_weight : 0   // display-only
//   valor_kg     = bag_weight > 0 ? price / bag_weight : 0      // display-only
//   total        = sacas * price                                 // display-only
//   vl_funrural  = (funrural / 100) * total                      // editável, NÃO no payload
//
// `sacas`/`valor_kg`/`total` são SEMPRE somente leitura (nunca `register`/
// `Controller` — `useMemo`/`watch` derivado), nunca entram no `useForm`/
// `SaleContractPayload` (risco documentado na Tarefa: "duplicar regra de
// negócio" se alguém "otimizar" adicionando esses campos ao RHF por engano).
//
// `vl_funrural` é campo LOCAL (`useState` interno, decisão do Executor
// documentada aqui conforme a Tarefa permite) — nunca um campo do
// `SaleContractForm`/RHF principal, nunca entra no `SaleContractPayload`.
// Existe só para a entrada inversa (usuário digita R$ e a tela recalcula o
// percentual). Sincronizado com `funrural`/`total` via `useEffect`, exceto
// durante a digitação direta do próprio campo (`isEditingRef`, evita loop
// entre o efeito de sincronização e o `onChange` do próprio input — mesmo
// princípio de "campo derivado com edição reversa", sem precedente idêntico
// no projeto, implementação documentada linha a linha aqui).
//
// Guarda (`validacoes_mensagens`, Doc Bruta): se `vl_funrural > total`,
// dispara `toaster.error` (mirror SweetAlert legado) e reverte `vl_funrural`
// para o valor recalculado a partir do `funrural` atual — o legado "limpa o
// campo"; aqui a UI reverte para o último valor coerente em vez de deixar
// vazio (pequena melhoria de UX documentada no contrato §5.1, sem mudar a
// regra).
//
// `entregue`/`saldo` NÃO entram neste bloco — são somente leitura, vêm
// prontos do `GetSaleContractAction` (contrato §6), não recalculados no
// browser.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { SaleContractForm } from '@/@types/v2/SaleContracts';

import type { UseFormWatch } from 'react-hook-form';

export interface SaleContractCalculationFieldsProps {
  /**
   * `watch` do formulário PAI (`CreateOrUpdateContratoVenda.tsx`) — os 3
   * campos somente leitura são derivados dele, nunca de estado próprio.
   */
  watch: UseFormWatch<SaleContractForm>;
  /**
   * Repassa o `funrural` recalculado (a partir da edição direta de
   * `vl_funrural`) para o formulário pai via `setValue('funrural', ...)`.
   * `vl_funrural` em si NUNCA é exposto ao formulário pai — é local deste
   * componente (ver cabeçalho do arquivo).
   */
  onFunruralChange: (value: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function formatCurrencyBRL(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// `value_kg` exige 4 casas decimais no legado (mesma precisão de `price`,
// `decimalPlaces={4}` em `CreateOrUpdateContratoVenda.tsx`) — `formatCurrencyBRL`
// acima usa o formatador `Intl` padrão de moeda, que arredonda BRL para 2 casas
// fixas e por isso NÃO serve para este campo. Função dedicada para não afetar
// os 2 call-sites existentes de `formatCurrencyBRL` (`total`/`vl_funrural`),
// que devem PERMANECER em 2 casas (FID-G3F FD-21/CV-02).
function formatCurrencyBRL4(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function formatDecimal(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SaleContractCalculationFields({
  watch,
  onFunruralChange,
  isLoading = false,
  disabled = false,
}: SaleContractCalculationFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.saleContracts.saleContract.form;

  const quantity = watch('quantity') ?? 0;
  const bagWeight = watch('bag_weight') ?? 0;
  const price = watch('price') ?? 0;
  const funrural = watch('funrural') ?? 0;

  const sacas = bagWeight > 0 ? quantity / bagWeight : 0;
  const valorKg = bagWeight > 0 ? price / bagWeight : 0;
  const total = sacas * price;
  const vlFunruralFromPercent = (funrural / 100) * total;

  const [vlFunrural, setVlFunrural] = useState<number | null>(vlFunruralFromPercent);
  // `true` enquanto o próprio `onChange` de `vl_funrural` está processando —
  // impede que o efeito de sincronização abaixo sobrescreva o valor que o
  // usuário acabou de digitar (ver cabeçalho do arquivo).
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isEditingRef.current) return;
    setVlFunrural(vlFunruralFromPercent);
  }, [vlFunruralFromPercent]);

  function handleVlFunruralChange(value: number | null) {
    isEditingRef.current = true;
    const novoValor = value ?? 0;

    if (novoValor > total) {
      toaster.error({
        title: text.fields.vlFunrural,
        description: text.calculation.funruralExceedsTotal,
        duration: 6000,
      });
      setVlFunrural(vlFunruralFromPercent);
      isEditingRef.current = false;
      return;
    }

    setVlFunrural(novoValor);
    const novoFunrural = total > 0 ? (100 / total) * novoValor : 0;
    onFunruralChange(novoFunrural);
    isEditingRef.current = false;
  }

  return (
    <SimpleGrid columns={columnsForm.default} gap={6}>
      <InputReadOnly
        name="sacas"
        label={text.calculation.sacasLabel}
        value={formatDecimal(sacas)}
        loading={isLoading}
      />
      <InputReadOnly
        name="valor_kg"
        label={text.calculation.valorKgLabel}
        value={formatCurrencyBRL4(valorKg)}
        loading={isLoading}
      />
      <InputReadOnly
        name="total"
        label={text.calculation.totalLabel}
        value={formatCurrencyBRL(total)}
        loading={isLoading}
      />
      <NumberInput
        name="vl_funrural"
        label={text.fields.vlFunrural}
        value={vlFunrural}
        onValueChange={handleVlFunruralChange}
        allowDot
        decimalPlaces={2}
        min={0}
        // `SC2-C02` (2ª auditoria): o widget legado (`_forms.blade.php:92`)
        // é `required` — marcação visual apenas (o campo é local/derivado,
        // nunca entra no `SaleContractPayload`, ver cabeçalho do arquivo).
        isRequired
        disabled={disabled || isLoading}
      />
    </SimpleGrid>
  );
}
