import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
// import { dd } from '@adonisjs/core/services/dumper'

export default class SessionController {
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.all()

    const user = await User.findBy('email', email)

    if (!user) {
      if (request.ajax()) {
        return response.badRequest({ status: 'error', message: 'Email tidak ditemukan' })
      }
      session.flash('errors', { email: 'Email tidak ditemukan' })
      return response.redirect().back()
    }

    try {
      const authenticatedUser = await User.verifyCredentials(email, password)
      await auth.use('web').login(authenticatedUser, !!request.input('remember_me'))

      if (request.ajax()) {
        return response.ok({ status: 'success', message: 'Login Berhasil!', redirectUrl: '/' })
      }

      session.flash('success', 'Login Berhasil')
      return response.redirect('/')
    } catch (error) {
      if (request.ajax()) {
        return response.badRequest({ status: 'error', message: 'Password salah' })
      }

      session.flash('errors', { password: 'Password salah' })
      return response.redirect().back()
    }


  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({
      status: 'success',
      message: 'Logout Berhasil!',
      redirectUrl: '/login', // Ganti dengan halaman login atau landing page
    })
  }
}
