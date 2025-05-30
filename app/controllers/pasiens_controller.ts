import { type HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import Obat from '#models/obat'
import Kunjungan from '#models/kunjungan'
import Dokter from '#models/dokter'
import Contact from '#models/contact'
import ObatPasien from '#models/obat_pasien'
import NumberHelper from '#services/number_service'
import { getProfilePicture } from '#services/whatsapp_service'

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
          'alamat',
          'golongan_darah'
        )
        .preload('jenisPenyakit', (query) => {
          query.select('id', 'nama', 'deskripsi')
        }).preload('contact', (query) => {
          query.select('id', 'pasien_id', 'wa_id', 'name', 'profile_picture')
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit),

      JenisPenyakit.query().select('id', 'nama').orderBy('nama', 'asc'),
    ])

    console.log('data pasien:', pasienData)

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

    console.log('data pasien:', pasienData)

    return view.render('pasien/data-pasien', {
      pasien: pasienData,
      jenisPenyakits,
      ...helpers,
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'nik',
        'jenisPenyakitId',
        'tempat',
        'tanggal_lahir',
        'alamat',
        'jenis_kelamin',
        'golongan_darah',
      ]) as Record<string, any>

      const existingPatient = await Pasien.query().where('nik', data.nik).first()
      if (existingPatient) {
        return response.json({
          success: false,
          message: 'NIK sudah terdaftar dalam sistem. Silakan gunakan NIK yang lain.',
        })
      }

      await Pasien.transaction(async (trx) => {
        const firstName = request.input('first_name', '')
        const lastName = request.input('last_name', '')
        data.name = `${firstName} ${lastName}`.trim()
        data.uuid = uuidv4()

        const jenisPenyakit = await JenisPenyakit.find(data.jenisPenyakitId)
        if (!jenisPenyakit) throw new Error('Invalid jenis penyakit selected')

        const validGolonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
        if (data.golongan_darah && !validGolonganDarah.includes(data.golongan_darah)) {
          throw new Error('Golongan darah tidak valid')
        }

        const pasien = await Pasien.create(data, { client: trx })

        // Buat contact baru jika no_hp disediakan
        const noHp = request.input('no_hp')
        if (noHp) {
          let profilePicture;
          const waId = NumberHelper(noHp) + '@s.whatsapp.net'
          try {
            profilePicture = await getProfilePicture(waId)
          } catch (error) {
            profilePicture = 'images/users/user.png'
          }

          await Contact.create({
            pasienId: pasien.uuid,
            waId,
            name: data.name,
            username: data.name,
            profilePicture
          }, { client: trx })
        }
      })

      const path = request.url()

      return response.json({
        success: true,
        message: 'Data pasien berhasil ditambahkan',
        redirectUrl: path,
      })
    } catch (error) {
      console.error('Error storing patient:', error)
      return response.json({
        success: false,
        message: 'Gagal menambahkan data pasien. Silakan coba lagi.',
      })
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
        .preload('contact')
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
      const dokters = await Dokter.query().preload('spesialist').where('status', true)
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
        dokters,
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

  async update({ params, request, response }: HttpContext) {
    try {
      const pasien = await Pasien.findByOrFail('uuid', params.uuid)

      const data = request.only([
        'nik',
        'jenisPenyakitId',
        'tempat',
        'tanggal_lahir',
        'alamat',
        'jenis_kelamin',
        'golongan_darah',
      ]) as Record<string, any>

      const no_hp = request.input('no_hp')

      const contact = await Contact.findBy('pasien_id', pasien.uuid)

      const newNoHp = no_hp || ''
      const newWaId = NumberHelper(newNoHp) + '@s.whatsapp.net'

      const firstName = request.input('first_name', '')
      const lastName = request.input('last_name', '')
      data.name = `${firstName} ${lastName}`.trim()

      if (!contact && newNoHp) {
        let profilePicture
        try {
          profilePicture = await getProfilePicture(newWaId)
        } catch (error) {
          console.error('Gagal mengambil foto profil:', error.message)
          profilePicture = 'images/users/user.png'
        }

        await Contact.create({
          pasienId: pasien.uuid,
          waId: newWaId,
          name: data.name,
          username: data.name,
          profilePicture,
        })
      } else if (contact) {
        const contactNeedsUpdate = contact.waId !== newWaId || contact.name !== data.name
        if (contactNeedsUpdate) {
          contact.merge({
            waId: newWaId,
            name: data.name,
            username: data.name, // kalau mau update username juga
          })
          await contact.save()
        }
      }

      if (data.nik !== pasien.nik) {
        const existingPatient = await Pasien.query()
          .where('nik', data.nik)
          .whereNot('id', pasien.id)
          .first()
        if (existingPatient) {
          return response.json({
            success: false,
            message: 'NIK sudah terdaftar dalam sistem.',
          })
        }
      }

      const jenisPenyakit = await JenisPenyakit.find(data.jenisPenyakitId)
      if (!jenisPenyakit) {
        return response.json({
          success: false,
          message: 'Jenis penyakit tidak valid',
        })
      }

      const validGolonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
      if (data.golongan_darah && !validGolonganDarah.includes(data.golongan_darah)) {
        return response.json({
          success: false,
          message: 'Golongan darah tidak valid',
        })
      }

      await pasien.merge(data).save()

      return response.json({
        success: true,
        message: 'Data pasien berhasil diperbarui',
        redirectUrl: `/pasien/${pasien.uuid}`,
      })
    } catch (error) {
      console.error('Error saat update data pasien:', error.message)
      return response.json({
        success: false,
        message: 'Gagal memperbarui data pasien. Silakan coba lagi.',
      })
    }
  }

  async destroy({ params, response }: HttpContext) {
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

        // session.flash({ success: 'Data pasien berhasil dihapus' })
        return response.json({
          success: true,
          message: 'Data pasien berhasil dihapus',
          redirectUrl: '/data-pasien',
        })
      } catch (error) {
        console.error('Error deleting patient:', error)
        // session.flash({ error: 'Gagal menghapus data pasien. Silakan coba lagi.' })
        return response.json({
          success: false,
          message: 'Gagal menghapus data pasien. Silakan coba lagi.',
          redirectUrl: '/data-pasien',
        })

      }
    })

  }
}
