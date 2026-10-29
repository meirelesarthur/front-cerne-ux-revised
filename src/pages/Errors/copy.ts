// src/pages/Errors/copy.ts
// Texto das telas de erro por status HTTP (faixas 4xx e 5xx), em PT/EN/ES. É a fonte única da
// `ErrorStatusPage`: para cobrir um status novo, acrescente uma linha em `ERROR_STATUSES`.
// O "chrome" (botões e rótulos) fica em `CHROME`.

export type ErrorLang = 'BR' | 'US' | 'ES';

interface Copy {
  /** Nome curto do status (o `error` do JSON de retorno). */
  name: string;
  /** Mensagem do corpo da tela, uma frase por idioma. */
  message: Record<ErrorLang, string>;
}

export const ERROR_STATUSES: Record<number, Copy> = {
  // ---- 4xx: o pedido tem algo errado ----
  400: { name: 'Bad Request', message: { BR: 'Não entendemos o pedido. Confira os dados enviados e tente de novo.', US: 'We could not understand the request. Check the data sent and try again.', ES: 'No entendimos la solicitud. Revise los datos enviados e intente de nuevo.' } },
  401: { name: 'Unauthorized', message: { BR: 'Sua sessão expirou ou você ainda não entrou. Faça login para continuar.', US: 'Your session expired or you are not signed in. Sign in to continue.', ES: 'Su sesión expiró o aún no inició sesión. Inicie sesión para continuar.' } },
  403: { name: 'Forbidden', message: { BR: 'Você não tem permissão para acessar esta área. Fale com o administrador da sua conta.', US: 'You do not have permission to access this area. Talk to your account administrator.', ES: 'No tiene permiso para acceder a esta área. Hable con el administrador de su cuenta.' } },
  404: { name: 'Not Found', message: { BR: 'Não encontramos o que buscava aqui. Por favor, tente novamente em alguns instantes.', US: 'We could not find what you were looking for. Please try again in a few moments.', ES: 'No encontramos lo que buscaba aquí. Por favor, intente de nuevo en unos instantes.' } },
  405: { name: 'Method Not Allowed', message: { BR: 'Esta ação não é permitida neste endereço.', US: 'This action is not allowed at this address.', ES: 'Esta acción no está permitida en esta dirección.' } },
  408: { name: 'Request Timeout', message: { BR: 'O pedido demorou demais para chegar. Verifique sua conexão e tente de novo.', US: 'The request took too long to arrive. Check your connection and try again.', ES: 'La solicitud tardó demasiado en llegar. Revise su conexión e intente de nuevo.' } },
  409: { name: 'Conflict', message: { BR: 'Outra pessoa alterou este registro ao mesmo tempo. Recarregue e refaça a alteração.', US: 'Someone else changed this record at the same time. Reload and redo your change.', ES: 'Otra persona modificó este registro al mismo tiempo. Recargue y rehaga el cambio.' } },
  410: { name: 'Gone', message: { BR: 'Este conteúdo foi removido e não está mais disponível.', US: 'This content was removed and is no longer available.', ES: 'Este contenido fue eliminado y ya no está disponible.' } },
  413: { name: 'Payload Too Large', message: { BR: 'O arquivo enviado é maior do que o permitido. Envie um menor.', US: 'The uploaded file is larger than allowed. Upload a smaller one.', ES: 'El archivo enviado es mayor de lo permitido. Envíe uno más pequeño.' } },
  415: { name: 'Unsupported Media Type', message: { BR: 'Este tipo de arquivo não é aceito. Use um formato compatível.', US: 'This file type is not accepted. Use a compatible format.', ES: 'Este tipo de archivo no es aceptado. Use un formato compatible.' } },
  422: { name: 'Unprocessable Entity', message: { BR: 'Alguns dados não passaram na validação. Revise os campos e envie de novo.', US: 'Some data failed validation. Review the fields and submit again.', ES: 'Algunos datos no pasaron la validación. Revise los campos y envíe de nuevo.' } },
  429: { name: 'Too Many Requests', message: { BR: 'Muitos pedidos em pouco tempo. Aguarde um instante e tente novamente.', US: 'Too many requests in a short time. Wait a moment and try again.', ES: 'Demasiadas solicitudes en poco tiempo. Espere un momento e intente de nuevo.' } },
  // ---- 5xx: o erro é do nosso lado ----
  500: { name: 'Internal Server Error', message: { BR: 'Algo falhou do nosso lado. Já fomos avisados; tente novamente em alguns instantes.', US: 'Something failed on our side. We were notified; try again in a few moments.', ES: 'Algo falló de nuestro lado. Ya fuimos avisados; intente de nuevo en unos instantes.' } },
  501: { name: 'Not Implemented', message: { BR: 'Este recurso ainda não está disponível.', US: 'This feature is not available yet.', ES: 'Este recurso aún no está disponible.' } },
  502: { name: 'Bad Gateway', message: { BR: 'Um dos nossos serviços respondeu de forma inesperada. Tente de novo em instantes.', US: 'One of our services answered unexpectedly. Try again shortly.', ES: 'Uno de nuestros servicios respondió de forma inesperada. Intente de nuevo en instantes.' } },
  503: { name: 'Service Unavailable', message: { BR: 'O Cerne está em manutenção ou com muito acesso. Volte em alguns minutos.', US: 'Cerne is under maintenance or very busy. Come back in a few minutes.', ES: 'Cerne está en mantenimiento o con mucho acceso. Vuelva en unos minutos.' } },
  504: { name: 'Gateway Timeout', message: { BR: 'O serviço demorou demais para responder. Tente novamente.', US: 'The service took too long to respond. Try again.', ES: 'El servicio tardó demasiado en responder. Intente de nuevo.' } },
};

export const ERROR_CODES = Object.keys(ERROR_STATUSES).map(Number);

/** Título grande por faixa: 4xx = pedido/acesso; 5xx = falha nossa. */
export const HEADLINE: Record<'client' | 'server', Record<ErrorLang, string>> = {
  client: { BR: 'Algo não saiu como o esperado...', US: 'Something did not go as expected...', ES: 'Algo no salió como se esperaba...' },
  server: { BR: 'Tivemos um problema por aqui...', US: 'We had a problem on our side...', ES: 'Tuvimos un problema por aquí...' },
};

export const CHROME: Record<ErrorLang, { back: string; returned: string; copy: string; copied: string; home: string; retry: string; all: string }> = {
  BR: { back: 'Voltar', returned: 'Retorno', copy: 'Copiar retorno', copied: 'Copiado', home: 'Voltar ao início', retry: 'Tentar novamente', all: 'Ver todos os erros' },
  US: { back: 'Back', returned: 'Response', copy: 'Copy response', copied: 'Copied', home: 'Back to home', retry: 'Try again', all: 'See all errors' },
  ES: { back: 'Volver', returned: 'Respuesta', copy: 'Copiar respuesta', copied: 'Copiado', home: 'Volver al inicio', retry: 'Intentar de nuevo', all: 'Ver todos los errores' },
};

export const isServerError = (status: number) => status >= 500;
