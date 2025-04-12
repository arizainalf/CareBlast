import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'web', // bisa default ke 'web' atau 'pasien', sesuai kebutuhanmu
  guards: {
    web: sessionGuard({
      useRememberMeTokens: true,
      rememberMeTokensAge: '30d',
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),

    pasien: sessionGuard({
      useRememberMeTokens: true,
      provider: sessionUserProvider({
        model: () => import('#models/pasien'),
      }),
    }),
  },
})
export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
