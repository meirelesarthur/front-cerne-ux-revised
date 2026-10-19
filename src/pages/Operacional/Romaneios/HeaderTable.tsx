// src/pages/Operacional/Romaneios/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Romaneios (mesmo padrão de
// Administrativo/Equipes/HeaderTable.tsx):
//   - Busca "Nº do romaneio" — SEPARADA do drawer de filtro (GAP-TRF-FE-06,
//     contrato de tela §4.3): igualdade exata em `transfers.code`, validado
//     como `integer` no servidor. Texto não-inteiro NUNCA dispara request —
//     só exibe um hint inline. Debounce de 400ms para não disparar 1
//     request por tecla.
//   - "Adicionar" (`ButtonAdd`, gate `transfers_create`) — navega para
//     `/operacional/romaneios/novo` (TASK-TRF-FE-02).
//   - `ButtonFilter` (badge de contagem dos 9 filtros do drawer).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { Input } from '@/components/Form/Input';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  /** Valor numérico atualmente aplicado ao filtro `search` (armadilha #2 da
   *  Tarefa — sempre `integer`, nunca string). */
  searchValue?: number;
  onSearchChange: (value: number | undefined) => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  searchValue,
  onSearchChange,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.transfers.transfer.search;

  const [searchText, setSearchText] = useState(
    searchValue !== undefined ? String(searchValue) : ''
  );
  const [isInvalid, setIsInvalid] = useState(false);

  // Sincroniza o campo local quando o valor aplicado mudar por fora (ex.:
  // "Limpar filtros" do drawer, ou troca de fazenda que reseta o filtro).
  useEffect(() => {
    setSearchText(searchValue !== undefined ? String(searchValue) : '');
  }, [searchValue]);

  // Debounce (400ms) — só propaga para o filtro real quando o conteúdo é um
  // inteiro válido. Conteúdo vazio limpa o filtro; conteúdo não-numérico
  // NUNCA dispara request (GAP-TRF-FE-06) — só acende o hint inline.
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchText.trim();

      if (trimmed === '') {
        setIsInvalid(false);
        if (searchValue !== undefined) onSearchChange(undefined);
        return;
      }

      if (/^\d+$/.test(trimmed)) {
        setIsInvalid(false);
        const parsed = Number(trimmed);
        if (parsed !== searchValue) onSearchChange(parsed);
      } else {
        setIsInvalid(true);
      }
    }, 400);

    return () => clearTimeout(timer);
    // Deps SOMENTE [searchText] — `searchValue`/`onSearchChange` só servem
    // para comparar/propagar dentro do timer, reagir a eles reiniciaria o
    // debounce a cada resposta da própria digitação. (Sem `eslint-disable`:
    // este projeto não carrega a regra `react-hooks/exhaustive-deps` no
    // ESLint config atual.)
  }, [searchText]);

  return (
    <>
      <Box minW="200px">
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={text.placeholder}
          aria-label={text.label}
          inputMode="numeric"
          helperText={isInvalid ? text.invalidHint : undefined}
        />
      </Box>
      {can('transfers_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/romaneios/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
