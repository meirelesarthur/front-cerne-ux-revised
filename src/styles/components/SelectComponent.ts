export const customStyles = (
  error?: boolean,
  position?: string,
  isInactive?: boolean,
  isReadOnly?: boolean,
  // Opt-in (UT-000766): cor do texto do valor selecionado via token semântico
  // (o token legado `primitive-texte-color` não resolve no tema dark). Sem uso,
  // nenhum Select existente muda.
  valueColor?: string
) => ({
  control: (styles: any, { isDisabled, isFocused }: any) => ({
    ...styles,
    textDecoration: isInactive ? 'line-through' : '',
    minHeight: '38px',
    boxSizing: 'border-box',
    // Sem `height` fixo: o `control` do react-select é flex e precisa
    // crescer junto com o `valueContainer` quando múltiplas tags (multi-select)
    // quebram para mais de uma linha. Fixar a altura aqui forçava as tags
    // extras a vazar visualmente para fora da borda do input em vez do
    // container crescer (bug reportado na tela de edição de Apartação).
    // `minHeight: 38px` sozinho já preserva a altura mínima de sempre para
    // single-select e multi-select com poucas tags.
    // DS `FormField`: raio 8, contorno 1.5px, foco verde com glow.
    borderRadius: '8px',
    borderWidth: '1.5px',
    color: 'var(--chakra-colors-primitive-texte-color)',
    backgroundColor:
      isReadOnly || isDisabled
        ? 'var(--chakra-colors-semantic-neutral-200)'
        : 'var(--chakra-colors-input-b-g)',
    ':hover': {
      borderColor: 'var(--chakra-colors-border-2)',
    },
    cursor: isReadOnly || isDisabled ? 'not-allowed' : 'pointer',
    borderColor: error
      ? '#E53E3E'
      : isFocused
        ? 'var(--chakra-colors-green-600)'
        : 'var(--chakra-colors-border1)',
    boxShadow: error
      ? '0 0 0 1px #e53e3e'
      : isFocused
        ? '0 0 0 3px var(--chakra-colors-focus-glow)'
        : 'none',
    opacity: 1,
  }),
  option: (styles: any, { isSelected }: any) => ({
    ...styles,
    fontSize: 'var(--chakra-font-sizes-md)',
    padding: '9px 14px',
    cursor: 'pointer',
    // DS `DropdownRow`: selecionada = verde suave com texto verde; hover = neutro claro.
    color: isSelected ? 'var(--chakra-colors-selected-text)' : 'var(--chakra-colors-semantic-neutral-700)',
    fontWeight: isSelected ? 600 : 400,
    backgroundColor: isSelected
      ? 'var(--chakra-colors-selected-b-g)'
      : 'var(--chakra-colors-card-b-g)',
    ':active': {
      ...styles[':active'],
      backgroundColor: 'var(--chakra-colors-semantic-neutral-100)',
    },
    ':hover': {
      ...styles[':hover'],
      backgroundColor: isSelected
        ? 'var(--chakra-colors-selected-b-g)'
        : 'var(--chakra-colors-semantic-neutral-100)',
      color: isSelected ? 'var(--chakra-colors-selected-text)' : 'var(--chakra-colors-semantic-neutral-800)',
    },
    zIndex: 9997,
  }),
  menu: (styles: any) => ({
    ...styles,
    backgroundColor: 'var(--chakra-colors-card-b-g)',
    border: '1px solid var(--chakra-colors-border1)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    zIndex: 9998,
    position: position,
  }),
  // INERTE para Selects sem `menuPortalTarget` — react-select só aplica este
  // style quando o menu é portalizado (`menuPortalTarget`/`menuPosition`).
  // Sem portal, o container `.menu-portal` nunca é criado, então esta função
  // nunca roda. Não afeta nenhum Select existente do `develop`.
  menuPortal: (styles: any) => ({
    ...styles,
    zIndex: 9999,
  }),
  singleValue: (styles: any) => ({
    ...styles,
    color: valueColor ?? 'var(--chakra-colors-primitive-texte-color)',
    fontSize: '16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }),
  // Sem este bloco o placeholder do react-select cai no default do lib
  // (permite quebra de linha), o que estica a altura do `control` quando o
  // texto é longo numa coluna estreita. Mantém o texto em uma linha só,
  // truncado com reticências — não afeta as tags do multi-select
  // (`multiValue`), que continuam quebrando via `valueContainer.flexWrap`.
  placeholder: (styles: any) => ({
    ...styles,
    fontSize: '16px',
    color: 'var(--chakra-colors-placeholder-color)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }),
  input: (styles: any) => ({
    ...styles,
    fontSize: '16px',
    ...(valueColor && { color: valueColor }),
    paddingBottom: 0,
    paddingTop: 0,
  }),
  indicatorsContainer: (styles: any) => ({
    ...styles,
    // Sem `height` fixo (mesmo motivo do `control` acima): quando o
    // `valueContainer` cresce por múltiplas linhas de tags, um `height`
    // fixo aqui deixava os indicadores (clear/dropdown) com altura
    // desproporcional ao container. `alignSelf: flex-start` mantém os
    // indicadores alinhados ao topo (na mesma linha do primeiro item),
    // em vez de esticar ou centralizar ao longo de todo o container
    // expandido.
    alignSelf: 'flex-start',
    // 38px do campo menos os 2 × 1.5px de contorno do control
    minHeight: '35px',
    padding: 0,
  }),
  indicatorSeparator: (styles: any) => ({
    ...styles,
    padding: 0,
  }),
  dropdownIndicator: (styles: any) => ({
    ...styles,
    padding: 4,
  }),
  clearIndicator: (styles: any) => ({
    ...styles,
    padding: 4,
  }),
  valueContainer: (styles: any) => ({
    ...styles,
    // `flex-start` (em vez de `baseline`) ancora as tags quebradas em
    // múltiplas linhas no topo/esquerda do container, condizente com o
    // `control` agora sem `height` fixo — evita que o texto/tags fiquem
    // deslocados verticalmente quando há mais de uma linha.
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  }),
  container: (styles: any) => ({
    ...styles,
    width: '100%',
  }),
});
