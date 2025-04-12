import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Pasien from '#models/pasien'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.all()

    // Coba cari user sebagai admin (dari tabel users)
    const user = await User.findBy('email', email)

    if (user) {
      try {
        const authenticatedUser = await User.verifyCredentials(email, password)
        
        await auth.use('web').login(authenticatedUser, !!request.input('remember_me'))

        return response.ok({
          title: 'Berhasil!',
          status: 'success',
          message: 'Login Admin Berhasil!',
          redirectUrl: '/',
        })
      } catch (error) {
        return response.badRequest({ title: 'Error!', status: 'error', message: 'Password salah' })
      }
    }

    // Kalau bukan user admin, cek apakah email itu NIK pasien
    const pasien = await Pasien.findBy('nik', email)

    if (!pasien) {
      return response.badRequest({
        title: 'Gagal!',
        status: 'error',
        message: 'Email atau NIK tidak ditemukan',
      })
    }

    // Validasi tanggal lahir sebagai "password"
    const tanggalLahirString = pasien.tanggal_lahir.toFormat('yyyy-MM-dd')

    if (tanggalLahirString !== password) {
      console.log('Tanggal lahir salah', password, tanggalLahirString)
      return response.badRequest({
        title: 'Error!',
        status: 'error',
        message: 'Tanggal lahir salah',
      })
    }

    // Login pasien
    await auth.use('pasien').login(pasien)

    return response.ok({
      title: 'Berhasil!',
      status: 'success',
      message: 'Login Pasien Berhasil!',
      redirectUrl: '/pengguna',
    })
  }

  async destroy({ auth, response }: HttpContext) {
    // Logout dari kedua guard jika login
    if (auth.use('web').isAuthenticated) {
      await auth.use('web').logout()
    }
    if (auth.use('pasien').isAuthenticated) {
      await auth.use('pasien').logout()
    }

    return response.ok({
      title: 'Berhasil!',
      status: 'success',
      message: 'Logout Berhasil!',
      redirectUrl: '/login',
    })
  }
}
