const strings = {
  userIncorrect: 'E-mail e/ou senha incorretos',
  isRequired: 'Campo obrigatório',
  maxAmountAllowed: 'Valor máximo permitido é: R$ 999.999.999,99',
  maxPercentageAllowed: 'Valor máximo permitido é: 100%',
  invalidCnpj: 'CNPJ inválido',
  invalidCpf: 'CPF inválido',
  invalidCep: 'CEP inválido',
  invalidCnh: 'CNH inválida',
  invalidUrl: 'Insira um site válido.',
  status: {
    error: 'Infelizmente, não é possível executar esta ação.',
    forbidden:
      'Sem permissão, Entre em contato com o administrador para obter ajuda.',
    emptyData: 'Nenhum dado foi encontrado.',
    loadingError: 'Não foi possível carregar as informações.',
  },
  mask: {
    fipe: '999999-9',
    cnpj: '99.999.999/9999-99',
    cpf: '999.999.999-99',
    cnh: '99999999999',
    rg: '99999999-9',
    bankCard: '9999 9999 9999 9999',
    cep: '99.999-999',
    mobileNumber: '(99) 99999-9999',
    // `phoneNumber` (TASK-FE-329/ERRO-FE-013) removida — órfã após a migração
    // dos 5 campos de telefone do wizard de Pessoas para `PhoneInput`
    // (máscara dinâmica celular/fixo, sem `react-input-mask`). `mobileNumber`/
    // `fixedNumber` preservadas (sem uso confirmado por grep nesta rodada,
    // mas fora do escopo desta Tarefa — só `phoneNumber` tinha uso real
    // confirmado nos 5 campos).
    fixedNumber: '(99) 9999-9999',
    phoneWithCountryCode: '+99 (99) 99999-9999',
    cnae: '****-*/**',
    plate: '***-****',
    chassi: '*** ****** ** ******',
    password: '********',
    senhaUsuario: '*********',
  },
};

export default strings;
