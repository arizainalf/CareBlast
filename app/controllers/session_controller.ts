import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Pasien from '#models/pasien'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { email, password, remember_me, user_type, nik } = request.all()

    if (!email || !password) {
      return response.json({
        success: false,
        message: 'Email dan password wajib diisi.',
      })
    }

    if (user_type === 'admin') {
      // Login sebagai admin
      const user = await User.findBy('email', email)
      if (user) {
        try {
          const authenticatedUser = await User.verifyCredentials(email, password)
          await auth.use('web').login(authenticatedUser, !!remember_me)

          return response.json({
            success: true,
            message: 'Login Admin Berhasil! Anda akan dialihkan ke halaman admin',
            redirectUrl: '/',
          })
        } catch {
          return response.json({
            success: false,
            message: 'Password salah untuk akun admin!',
          })
        }
      } else {
        return response.json({
          success: false,
          message: 'Email tidak ditemukan.',
        })
      }
    } else if (user_type === 'pasien') {
      // Login sebagai pasien (gunakan NIK)
      const pasien = await Pasien.findBy('nik', nik)

      if (!pasien) {
        return response.json({
          success: false,
          message: 'NIK Pasien tidak ditemukan.',
        })
      }

      const tanggalLahir = pasien.tanggal_lahir?.toFormat?.('yyyy-MM-dd')

      if (tanggalLahir !== password) {
        return response.json({
          success: false,
          message: 'Tanggal lahir salah.',
        })
      }

      await auth.use('pasien').login(pasien)

      return response.json({
        success: true,
        message: 'Login Pasien Berhasil! Anda akan dialihkan ke halaman pengguna',
        redirectUrl: '/pengguna',
      })
    } else {
      return response.json({
        success: false,
        message: 'Pengguna tidak valid.',
      })
    }

  }


  async destroy({ auth, response }: HttpContext) {
    if (auth.use('web').isAuthenticated) {
      await auth.use('web').logout()
    }

    if (auth.use('pasien').isAuthenticated) {
      await auth.use('pasien').logout()
    }

    return response.json({
      success: true,
      message: 'Logout Berhasil! Anda akan dialihkan ke halaman login',
    })
  }
}
