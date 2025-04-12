import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
// import { title } from 'node:process'
// import { dd } from '@adonisjs/core/services/dumper'

export default class SessionController {
  async store({ request, auth, response }: HttpContext) {
    const { nik, tanggalLahir } = request.all()

    const pasien = await Pasien.query().where('nik', nik).first()

    if (!pasien) {
      return response.unauthorized({ message: 'NIK tidak ditemukan' })
    }

    if (pasien.tanggal_lahir !== tanggalLahir) {
      return response.unauthorized({ message: 'Tanggal lahir tidak cocok' })
    }

    // Login manual tanpa password hashing
    await auth.use('pasien').login(pasien)

    return response.ok({ message: 'Login berhasil', pasien })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('pasien').logout()
    return response.ok({ message: 'Logout berhasil' })
  }
}
