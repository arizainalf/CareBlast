import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// import { title } from 'node:process'
// import { dd } from '@adonisjs/core/services/dumper'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.all()

    const user = await User.findBy('email', email)

    if (!user) {
      return response.badRequest({ title: 'Gagal!', status: 'error', message: 'Email tidak ditemukan' })
    }

    try {
      const authenticatedUser = await User.verifyCredentials(email, password)
      await auth.use('web').login(authenticatedUser, !!request.input('remember_me'))

      return response.ok({ title: 'Berhasil!', status: 'success', message: 'Login Berhasil!', redirectUrl: '/' })

    } catch (error) {

      return response.badRequest({ title: 'Error!' ,status: 'error', message: 'Password salah' })

    }
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({
      title: 'Berhasil!',
      status: 'success',
      message: 'Logout Berhasil!',
      redirectUrl: '/login',
    })
  }

}

