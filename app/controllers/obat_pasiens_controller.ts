import { HttpContext } from '@adonisjs/core/http'
import ObatPasien from '#models/obat_pasien'
import Obat from '#models/obat'
import { v4 as uuidv4 } from 'uuid'
import Pasien from '#models/pasien'
import Kunjungan from '#models/kunjungan'

export default class ObatPasiensController {
  async store(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      const pasienUuid = params.uuid
      const {
        obatNama,
        customObat,
        keteranganWaktu,
        kunjunganId,
        tanggalKunjungan,
        temaKunjungan,
        keterangan,
      } = request.body()

      const pasien = await Pasien.findByOrFail('uuid', pasienUuid)
      const actualObatName = obatNama === 'other' ? customObat : obatNama

      if (!actualObatName) {
        return response
          .status(400)
          .json({ success: false, message: 'Nama obat tidak boleh kosong' })
      }

      // Handle obat
      let obat = await Obat.findBy('nama', actualObatName)
      if (!obat) {
        obat = await Obat.create({ nama: actualObatName, uuid: uuidv4() })
      }

      // Handle kunjungan
      let selectedKunjunganId = null

      if (kunjunganId === 'new') {
        // Buat kunjungan baru
        const newKunjungan = await Kunjungan.create({
          uuid: uuidv4(),
          pasienId: pasien.id,
          tema: temaKunjungan || 'Tanpa Tema',
          keterangan: keterangan || 'Tidak ada keterangan',
          tanggalKunjungan: tanggalKunjungan || new Date().toISOString().split('T')[0],
        })
        selectedKunjunganId = newKunjungan.id
      } else if (kunjunganId) {
        // Gunakan kunjungan yang sudah ada
        selectedKunjunganId = kunjunganId
      }

      // Buat obat pasien
      const obatPasien = await ObatPasien.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        obatId: obat.id,
        kunjunganId: selectedKunjunganId, // Bisa null jika tidak terkait dengan kunjungan
        frekuensi: 1,
        waktuKonsumsi: JSON.stringify(['08:00']),
        keteranganWaktu,
      })

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({ success: true, message: 'Obat berhasil ditambahkan', data: obatPasien })
        : response.redirect().toPath(`/pasien/${pasienUuid}`)
    } catch (error) {
      console.error('Error adding medication:', error)
      return request.accepts(['html', 'json']) === 'json'
        ? response
            .status(500)
            .json({ success: false, message: 'Error menambahkan obat', error: error.message })
        : response.redirect().back()
    }
  }

  async update(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      console.log('Update obat request:', request.body())

      const obatPasienUuid = params.uuid
      const { frekuensi, waktu, keteranganWaktu } = request.body()

      // Log data for debugging
      console.log('Updating obat with UUID:', obatPasienUuid)
      console.log('Data:', { frekuensi, waktu, keteranganWaktu })

      // Ensure waktu is always an array
      const waktuArray = Array.isArray(waktu) ? waktu : [waktu]

      // Find the medication record
      const obatPasien = await ObatPasien.findByOrFail('uuid', obatPasienUuid)

      // Update the record
      await obatPasien
        .merge({
          frekuensi: Number.parseInt(frekuensi, 10),
          waktuKonsumsi: JSON.stringify(waktuArray),
          keteranganWaktu: keteranganWaktu,
        })
        .save()

      // Find the related patient
      const pasien = await Pasien.findOrFail(obatPasien.pasienId)

      console.log('Obat updated successfully')

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({
            success: true,
            message: 'Jadwal obat berhasil diperbarui',
            data: {
              uuid: obatPasien.uuid,
              frekuensi: obatPasien.frekuensi,
              waktuKonsumsi: JSON.parse(obatPasien.waktuKonsumsi),
              keteranganWaktu: obatPasien.keteranganWaktu,
            },
          })
        : response.redirect().toPath(`/pasiens/${pasien.uuid}`)
    } catch (error) {
      console.error('Error updating medication:', error)
      return request.accepts(['html', 'json']) === 'json'
        ? response.status(500).json({
            success: false,
            message: 'Error memperbarui jadwal obat',
            error: error.message,
          })
        : response.redirect().back()
    }
  }

  async destroy(ctx: HttpContext) {
    const { params, response, request } = ctx

    try {
      const obatPasienUuid = params.uuid
      const obatPasien = await ObatPasien.findByOrFail('uuid', obatPasienUuid)

      const pasien = await Pasien.findOrFail(obatPasien.pasienId)
      await obatPasien.delete()

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({ success: true, message: 'Obat berhasil dihapus' })
        : response.redirect().toPath(`/pasiens/${pasien.uuid}`)
    } catch (error) {
      console.error('Error deleting medication:', error)
      return request.accepts(['html', 'json']) === 'json'
        ? response
            .status(500)
            .json({ success: false, message: 'Error menghapus obat', error: error.message })
        : response.redirect().back()
    }
  }
  async destroyByKunjungan({ request, response, params }: HttpContext) {
    try {
      const pasienUuid = params.uuid
      const kunjunganId = request.input('kunjunganId')

      // Validasi data input
      if (!pasienUuid) {
        return response.status(400).json({
          success: false,
          message: 'UUID pasien diperlukan',
        })
      }

      // Cari pasien berdasarkan UUID
      const pasien = await Pasien.findByOrFail('uuid', pasienUuid)

      let targetKunjunganId = kunjunganId

      // Jika kunjunganId tidak disediakan, gunakan kunjungan terbaru
      if (!targetKunjunganId) {
        const latestKunjungan = await Kunjungan.query()
          .where('pasienId', pasien.id)
          .orderBy('tanggalKunjungan', 'desc')
          .first()

        if (!latestKunjungan) {
          return response.status(404).json({
            success: false,
            message: 'Tidak ditemukan kunjungan untuk pasien ini',
          })
        }

        targetKunjunganId = latestKunjungan.id
      }

      // Cek bahwa kunjungan tersebut milik pasien yang bersangkutan
      const kunjungan = await Kunjungan.query()
        .where('id', targetKunjunganId)
        .where('pasienId', pasien.id)
        .first()

      if (!kunjungan) {
        return response.status(403).json({
          success: false,
          message: 'Kunjungan tidak ditemukan atau bukan milik pasien ini',
        })
      }

      // Hitung jumlah obat yang akan dihapus
      const obatCount = await ObatPasien.query()
        .where('kunjunganId', targetKunjunganId)
        .where('pasienId', pasien.id)
        .count('* as total')

      const totalObat = obatCount[0].$extras.total

      if (totalObat === 0) {
        return response.status(404).json({
          success: false,
          message: 'Tidak ada data obat untuk kunjungan ini',
        })
      }

      // Hapus obat dari kunjungan yang dipilih
      await ObatPasien.query()
        .where('kunjunganId', targetKunjunganId)
        .where('pasienId', pasien.id)
        .delete()

      return response.json({
        success: true,
        message: `Berhasil menghapus ${totalObat} data obat dari kunjungan "${kunjungan.tema}"`,
        deletedCount: totalObat,
        kunjunganId: targetKunjunganId,
      })
    } catch (error) {
      console.error('Error menghapus data obat:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data obat',
        error: error.message,
      })
    }
  }
}
