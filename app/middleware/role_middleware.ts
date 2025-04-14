import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: string[]) {
    const authWeb = ctx.auth.use('web')

    // Pastikan user sudah login
    await authWeb.check()
    const user = authWeb.user
    // console.log('User:', user?.role)

    if (!user) {
      return ctx.response.unauthorized({ message: 'Belum login' })
    }

    // Jika login sebagai user biasa, pastikan punya role
    if (!user.role) {
      return ctx.response.unauthorized({ message: 'Role tidak ditemukan' })
    }

    // Cek apakah role user termasuk yang diizinkan
    if (!allowedRoles.includes(user.role)) {
      return ctx.response.redirect().withQs().back()
    }

    return await next()
  }
}
