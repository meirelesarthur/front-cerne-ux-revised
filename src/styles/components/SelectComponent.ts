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
  control: (styles: any, { isDisabled }: any) => ({
    ...styles,
    textDecoration: isInactive ? 'line-through' : '',
    minHeight: '38px',
    // Sem `height` fixo: o `control` do react-select é flex e precisa
    // crescer junto com o `valueContainer` quando múltiplas tags (multi-select)
    // quebram para mais de uma linha. Fixar a altura aqui forçava as tags
    // extras a vazar visualmente para fora da borda do input em vez do
    // container crescer (bug reportado na tela de edição de Apartação).
    // `minHeight: 38px` sozinho já preserva a altura mínima de sempre para
    // single-select e multi-select com poucas tags.
    borderRadius: 'var(--chakra-radii-md)',
    color: 'var(--chakra-colors-primitive-texte-color)',
    backgroundColor:
      isReadOnly || isDisabled
        ? 'var(--chakra-colors-semantic-neutral-200)'
        : 'var(--chakra-colors-input-b-g)',
    ':hover': {
      borderColor: 'var(--chakra-colors-border-2)',
    },
    cursor: isReadOnly || isDisabled ? 'not-allowed' : 'pointer',
    borderColor: error ? '#E53E3E' : 'var(--chakra-colors-border2)',
    ...(error && { boxShadow: '0 0 0 1px #e53e3e' }),
    opacity: 1,
  }),
  option: (styles: any, { isSelected }: any) => ({
    ...styles,
    fontSize: 'var(--chakra-font-sizes-md)',
    padding: 5,
    cursor: 'pointer',
    color: isSelected ? 'var(--chakra-colors-white)' : 'var(--chakra-colors-semantic-neutral-700)',
    backgroundColor: isSelected
      ? 'var(--chakra-colors-green-900)'
      : 'var(--chakra-colors-input-b-g)',
    ':active': {
      ...styles[':active'],
      backgroundColor: 'var(--chakra-colors-secondary-ligh)',
      color: 'var(--chakra-colors-white)',
    },
    ':hover': {
      ...styles[':hover'],
      backgroundColor: 'var(--chakra-colors-green-700)',
      color: 'var(--chakra-colors-white)',
    },
    zIndex: 9997,
  }),
  menu: (styles: any) => ({
    ...styles,
    backgroundColor: 'var(--chakra-colors-semantic-neutral-200)',
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
    fontSize: 'var(--chakra-font-sizes-md)',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }),
  input: (styles: any) => ({
    ...styles,
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
    minHeight: '38px',
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
