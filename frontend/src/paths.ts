export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  agent: {
     overview: '/agent',
     settings: '/agent/settings',
     templates: '/agent/templates',
     clients: '/agent/clients',
     attributes: '/agent/attributes',
     users: '/agent/users',
     chat: '/agent/chat',
     account: '/agent/account',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
