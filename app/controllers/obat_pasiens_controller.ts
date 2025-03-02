import { HttpContext } from '@adonisjs/core/http'
import ObatPasien from '#models/obat_pasien'
import Obat from '#models/obat'
import { v4 as uuidv4 } from 'uuid'
import Pasien from '#models/pasien'

export default class ObatPasiensController {
  async store(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      const pasienUuid = params.uuid
      const { obatNama, customObat, keteranganWaktu } = request.body()

      const pasien = await Pasien.findByOrFail('uuid', pasienUuid)
      const actualObatName = obatNama === 'other' ? customObat : obatNama

      if (!actualObatName) {
        return response
          .status(400)
          .json({ success: false, message: 'Nama obat tidak boleh kosong' })
      }

      let obat = await Obat.findBy('nama', actualObatName)
      if (!obat) {
        obat = await Obat.create({ nama: actualObatName, uuid: uuidv4() })
      }

      const obatPasien = await ObatPasien.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        obatId: obat.id,
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
}
