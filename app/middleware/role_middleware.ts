import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: string[]) {
    const { auth, response } = ctx

    // Pastikan user sudah login
    await auth.check()
    const user = auth.user

    // Cek apakah user memiliki role yang diizinkan
    if (!user || !('role' in user) || !allowedRoles.includes(user.role)) {
      return response.unauthorized({ message: 'Akses ditolak' })
    }

    // Lanjut ke proses berikutnya jika role sesuai
    return await next()
  }
}
