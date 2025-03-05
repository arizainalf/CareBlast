import { HttpContext } from '@adonisjs/core/http'
import Kunjungan from '#models/kunjungan'
import ObatPasien from '#models/obat_pasien'
import Pasien from '#models/pasien'
import { v4 as uuidv4 } from 'uuid'

export default class KunjungansController {
  async store(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      const pasienUuid = params.uuid
      const temaKunjungan = request.input('temaKunjungan', 'Tanpa Tema') // Default jika tidak diisi
      const keterangan = request.input('keterangan', 'Tidak ada keterangan')
      const tanggalKunjungan = request.input(
        'tanggalKunjungan',
        new Date().toISOString().split('T')[0]
      )
      const obatList = request.input('obatList', [])

      console.log('Data Diterima:', { temaKunjungan, keterangan, tanggalKunjungan, obatList })

      const pasien = await Pasien.findByOrFail('uuid', pasienUuid)

      // Simpan kunjungan baru
      const kunjungan = await Kunjungan.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        tema: temaKunjungan,
        keterangan: keterangan,
        tanggalKunjungan: tanggalKunjungan,
      })

      console.log('Kunjungan Disimpan:', kunjungan)

      // Jika `obatList` dikirim dan merupakan array, tambahkan obat pasien
      if (Array.isArray(obatList) && obatList.length > 0) {
        for (const obatId of obatList) {
          await ObatPasien.create({
            uuid: uuidv4(),
            pasienId: pasien.id,
            kunjunganId: kunjungan.id,
            obatId: obatId,
            frekuensi: 1, // Default 1 kali sehari
            waktuKonsumsi: JSON.stringify(['08:00']), // Default jam 08:00
            keteranganWaktu: 'Sesudah makan', // Default "Sesudah makan"
          })
        }
      } else {
        // Tambahkan data dummy jika tidak ada obat yang dipilih
        await ObatPasien.create({
          uuid: uuidv4(),
          pasienId: pasien.id,
          kunjunganId: kunjungan.id,
          obatId: null, // Jika tidak ada obat, bisa dibiarkan null
          frekuensi: 1,
          waktuKonsumsi: JSON.stringify(['08:00']),
          keteranganWaktu: 'Sesudah makan',
        })
      }

      // Redirect ke halaman detail pasien setelah berhasil menambahkan kunjungan
      return response.redirect().toPath(`/pasien/${pasienUuid}`)
    } catch (error) {
      console.error('Error menambahkan kunjungan:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error menambahkan kunjungan', error: error.message })
    }
  }
}
