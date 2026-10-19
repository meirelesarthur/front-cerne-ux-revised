import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  rememberMe: yup.boolean(),
});

export const profileSchema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  phone: yup.string(),
  position: yup.string(),
  department: yup.string(),
});

export const pentestSchema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  target: yup.string().url('URL inválida').required('Target é obrigatório'),
  type: yup.string().oneOf(['web', 'api', 'mobile', 'network']).required('Tipo é obrigatório'),
  userRoles: yup.number().min(0).required('Número de roles é obrigatório'),
});
