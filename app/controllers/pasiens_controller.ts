import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import Obat from '#models/obat'
import Kunjungan from '#models/kunjungan'
import ObatPasien from '#models/obat_pasien'
import { saveContact } from '#services/contact_service'

export default class PasiensController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 12

    const [pasienData, jenisPenyakits] = await Promise.all([
      Pasien.query()
        .select(
          'id',
          'uuid',
          'name',
          'nik',
          'tempat',
          'tanggal_lahir',
          'jenis_kelamin',
          'jenisPenyakitId',
          'no_hp',
          'alamat',
          'golongan_darah'
        )
        .preload('jenisPenyakit', (query) => {
          query.select('id', 'nama', 'deskripsi')
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit),

      JenisPenyakit.query().select('id', 'nama').orderBy('nama', 'asc'),
    ])

    const helpers = {
      calculateAge: (birthDate: string | null): number => {
        if (!birthDate) return 0
        try {
          const birth = DateTime.fromISO(birthDate)
          const now = DateTime.now()
          return Math.floor(now.diff(birth, 'years').years)
        } catch (error) {
          console.error('Error calculating age:', error)
          return 0
        }
      },

      formatDate: (date: string | null): string => {
        if (!date) return ''
        try {
          const dateTime = DateTime.fromISO(date)
          return dateTime.toFormat('dd - MM - yyyy')
        } catch (error) {
          console.error('Error formatting date:', error)
          return ''
        }
      },
    }

    return view.render('pasien/data-pasien', {
      pasien: pasienData,
      jenisPenyakits,
      ...helpers,
    })
  }

  async store({ request, response, session }: HttpContext) {
    try {
      const data = request.only([
        'nik',
        'jenisPenyakitId',
        'tempat',
        'tanggal_lahir',
        'no_hp',
        'alamat',
        'jenis_kelamin',
        'golongan_darah',
      ]) as Record<string, any>

      const existingPatient = await Pasien.query().where('nik', data.nik).first()
      if (existingPatient) {
        session.flash({ error: 'NIK sudah terdaftar dalam sistem. Silakan gunakan NIK yang lain.' })
        return response.redirect().back()
      }

      await Pasien.transaction(async (trx) => {
        const firstName = request.input('first_name', '')
        const lastName = request.input('last_name', '')
        data.name = `${firstName} ${lastName}`.trim()
        data.uuid = uuidv4()

        const jenisPenyakit = await JenisPenyakit.find(data.jenisPenyakitId)
        if (!jenisPenyakit) {
          throw new Error('Invalid jenis penyakit selected')
        }

        const validGolonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
        if (data.golongan_darah && !validGolonganDarah.includes(data.golongan_darah)) {
          throw new Error('Golongan darah tidak valid')
        }

        saveContact(data.no_hp, data.name)

        await Pasien.create(data, { client: trx })
      })

      session.flash({ success: 'Data pasien berhasil ditambahkan' })
      return response.redirect().toRoute('pasien.index')
    } catch (error) {
      console.error('Error storing patient:', error)
      session.flash({ error: 'Gagal menambahkan data pasien. Silakan coba lagi.' })
      return response.redirect().back()
    }
  }

  async search({ request, response }: HttpContext) {
    const searchQuery = request.input('q', '').trim()

    if (!searchQuery) {
      return response.json([])
    }

    const pasienData = await Pasien.query()
      .select([
        'id',
        'uuid',
        'name',
        'nik',
        'jenis_kelamin',
        'tanggal_lahir',
        'tempat',
        'jenisPenyakitId',
      ])
      .preload('jenisPenyakit', (query) => {
        query.select('id', 'nama')
      })
      .where((query) => {
        query
          .whereILike('name', `%${searchQuery}%`)
          .orWhereILike('nik', `%${searchQuery}%`)
          .orWhereILike('tempat', `%${searchQuery}%`)
      })
      .orderBy('created_at', 'desc')
      .limit(12)

    const transformedData = pasienData.map((pasien) => {
      const rawDate = pasien.tanggal_lahir
      let formattedDate = null

      if (rawDate) {
        const date = rawDate.toJSDate()
        formattedDate = date.toISOString().split('T')[0]
      }

      return {
        ...pasien.toJSON(),
        tanggal_lahir: formattedDate,
        jenis_kelamin: pasien.jenis_kelamin || '-',
      }
    })

    return response.json(transformedData)
  }

  async show({ view, params }: HttpContext) {
    try {
      const uuid = params.uuid

      const pasien = await Pasien.query()
        .where('uuid', uuid)
        .preload('jenisPenyakit', (query) => {
          query.select('id', 'nama', 'deskripsi')
        })
        .preload('kunjungans', (query) => {
          query.preload('obatPasiens', (obatQuery) => {
            obatQuery.preload('obat')
          })
          query.orderBy('tanggalKunjungan', 'desc')
        })
        .firstOrFail()
      const jenisPenyakits = await JenisPenyakit.query().select('id', 'nama').orderBy('nama', 'asc')
      const kunjunganTerbaru = pasien.kunjungans.length > 0 ? pasien.kunjungans[0] : null
      const obatPasiens = kunjunganTerbaru ? kunjunganTerbaru.obatPasiens : []
      const obatSebelumMakan = obatPasiens.filter(
        (op: { keteranganWaktu: string }) => op.keteranganWaktu === 'Sebelum makan'
      )
      const obatSesudahMakan = obatPasiens.filter(
        (op: { keteranganWaktu: string }) => op.keteranganWaktu === 'Sesudah makan'
      )

      const helpers = {
        calculateAge: (birthDate: string | null): number => {
          if (!birthDate) return 0
          try {
            const birth = DateTime.fromISO(birthDate)
            const now = DateTime.now()
            return Math.floor(now.diff(birth, 'years').years)
          } catch (error) {
            console.error('Error calculating age:', error)
            return 0
          }
        },

        formatDate: (date: string | null): string => {
          if (!date) return ''
          try {
            const dateTime = DateTime.fromISO(date)
            return dateTime.toFormat('dd MMMM yyyy')
          } catch (error) {
            console.error('Error formatting date:', error)
            return ''
          }
        },
      }
      const obats = await Obat.all()
      const keluhan = kunjunganTerbaru ? kunjunganTerbaru.keterangan : 'Tidak ada keluhan'

      const kunjungans = pasien.kunjungans.map((kunjungan) => ({
        id: kunjungan.id,
        uuid: kunjungan.uuid,
        tema: kunjungan.tema,
        tanggalKunjungan: kunjungan.tanggalKunjungan,
        formattedDate: helpers.formatDate(kunjungan.tanggalKunjungan.toISO()),
      }))

      return view.render('pasien/profile-pasien', {
        pasien,
        obatSebelumMakan,
        obatSesudahMakan,
        obats,
        kunjunganTerbaru,
        kunjungans,
        jenisPenyakits,
        keluhan,
        ...helpers,
      })
    } catch (error) {
      console.error('Error fetching patient details:', error)
      return view.render('pages/errors/404')
    }
  }

  async update({ params, request, response, session }: HttpContext) {
    try {
      const pasien = await Pasien.findByOrFail('uuid', params.uuid)
      console.log('Found patient:', pasien.uuid)

      const data = request.only([
        'nik',
        'jenisPenyakitId',
        'tempat',
        'tanggal_lahir',
        'no_hp',
        'alamat',
        'jenis_kelamin',
        'golongan_darah',
      ]) as Record<string, any>

      console.log('Update data received:', data)

      if (data.nik !== pasien.nik) {
        const existingPatient = await Pasien.query()
          .where('nik', data.nik)
          .whereNot('id', pasien.id)
          .first()
        if (existingPatient) {
          session.flash({
            error: 'NIK sudah terdaftar dalam sistem. Silakan gunakan NIK yang lain.',
          })
          return response.redirect().back()
        }
      }

      const firstName = request.input('first_name', '')
      const lastName = request.input('last_name', '')
      data.name = `${firstName} ${lastName}`.trim()
      console.log('Name constructed:', data.name)

      const jenisPenyakit = await JenisPenyakit.find(data.jenisPenyakitId)
      if (!jenisPenyakit) {
        console.error('Invalid jenis penyakit selected:', data.jenisPenyakitId)
        session.flash({ error: 'Jenis penyakit tidak valid' })
        return response.redirect().back()
      }

      const validGolonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
      if (data.golongan_darah && !validGolonganDarah.includes(data.golongan_darah)) {
        console.error('Invalid golongan darah:', data.golongan_darah)
        session.flash({ error: 'Golongan darah tidak valid' })
        return response.redirect().back()
      }

      try {
        await pasien.merge(data).save()
        console.log('Patient updated successfully')
        session.flash({ success: 'Data pasien berhasil diperbarui' })
        return response.redirect().toRoute('profile.pasien', { uuid: pasien.uuid })
      } catch (saveError) {
        console.error('Error saving patient:', saveError)
        if (saveError instanceof Error) {
          console.error('Error message:', saveError.message)
          console.error('Error stack:', saveError.stack)
        }
        session.flash({
          error:
            'Gagal menyimpan data pasien. Detail: ' +
            (saveError instanceof Error ? saveError.message : 'Unknown error'),
        })
        return response.redirect().back()
      }
    } catch (error) {
      console.error('Error in update function:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      session.flash({ error: 'Gagal memperbarui data pasien. Silakan coba lagi.' })
      return response.redirect().back()
    }
  }

  async destroy({ params, response, session }: HttpContext) {
    const pasien = await Pasien.findByOrFail('uuid', params.uuid)
    await Pasien.transaction(async (trx) => {
      try {
        await Kunjungan.query().where('pasien_id', pasien.id).delete()
        await ObatPasien.query()
          .whereHas('kunjungan', (query) => {
            query.where('pasien_id', pasien.id)
          })
          .delete()
        await pasien.useTransaction(trx).delete()

        session.flash({ success: 'Data pasien berhasil dihapus' })
      } catch (error) {
        console.error('Error deleting patient:', error)
        session.flash({ error: 'Gagal menghapus data pasien. Silakan coba lagi.' })
      }
    })

    return response.redirect().toRoute('pasien.index')
  }
}
