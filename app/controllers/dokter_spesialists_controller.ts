import Dokter from '#models/dokter'
import Spesialist from '#models/spesialist'
import { type HttpContext } from '@adonisjs/core/http'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import fs from 'node:fs'

export default class DokterSpesialistsController {
  /**
   * Display a list of resource
   */
  async index({ view }: HttpContext) {
    const spesialists = await Spesialist.query()
    const dokters = await Dokter.query().preload('spesialist')
    return view.render('puskesmas/data-dokter', {
      spesialists,
      dokters,
      allDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    })
  }

  async list({ response }: HttpContext) {
    const spesialist = await Spesialist.all()
    return response.json({ spesialist })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    if (request.input('jenis') === 'dokter') {
      const { nip, nama, spesialist_id, jam_mulai, jam_selesai, status, no_whatsapp, jadwalHari } = request.all()
      const foto = request.file('foto')

      let fotoName = null

      if (foto) {
        fotoName = `${createId()}.${foto.extname}`

        // Path absolut dari root project ke public/images/dokters
        const targetPath = join('public', 'images', 'dokters')

        await foto.move(targetPath, {
          name: fotoName,
          overwrite: true,
        })

        fotoName = `images/dokters/${fotoName}`

      }

      const dokter = await Dokter.create({
        nip,
        nama,
        noWhatsapp: no_whatsapp,
        spesialistId: spesialist_id,
        jamMulai: jam_mulai,
        jamSelesai: jam_selesai,
        status,
        jadwalHari: JSON.stringify(jadwalHari),
        foto: fotoName,
      })

      return response.json({ success: true, message: 'Dokter berhasil disimpan!', dokter, redirectUrl: '/dokter' })
    }

    // untuk spesialist
    if (request.input('jenis') === 'spesialist') {
      const { nama, gelar } = request.all()
      const spesialist = await Spesialist.create({ nama, gelar })
      return response.json({ success: true, message: 'Spesialis berhasil disimpan!', spesialist, redirectUrl: '/dokter' })
    }
  }


  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    if (params.id_spesialist) {
      const spesialist = await Spesialist.findOrFail(params.id_spesialist)
      return spesialist
    } else if (params.id_dokter) {
      const dokter = await Dokter.findOrFail(params.id_dokter)
      return dokter
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    if (params.id_spesialist) {
      // Update spesialist tanpa foto
      const spesialist = await Spesialist.findOrFail(params.id_spesialist)
      const data = request.only(['nama', 'gelar'])
      spesialist.merge(data)
      await spesialist.save()
      return response.json({ success: true, message: 'Spesialis berhasil diperbarui!', spesialist, redirectUrl: '/dokter' })

    } else if (params.id_dokter) {
      // Update dokter dengan pengecekan foto baru
      const dokter = await Dokter.findOrFail(params.id_dokter)
      const data = request.only(['nama', 'nip', 'spesialist_id', 'jam_mulai', 'jam_selesai', 'status', 'no_whatsapp'])
      const jadwalHari = request.input('jadwalHari')
      dokter.jadwalHari = JSON.stringify(jadwalHari)

      // Cek apakah ada foto baru
      const foto = request.file('foto')
      if (foto) {
        // Hapus foto lama jika ada
        const oldFotoPath = dokter.foto

        if (oldFotoPath && !oldFotoPath?.includes('user.png')) {
          const oldFotoFullPath = join('public', oldFotoPath) // Mendapatkan path lengkap dari foto lama
          try {
            fs.unlinkSync(oldFotoFullPath) // Menghapus file lama
          } catch (err) {
            console.log('Error saat menghapus foto lama:', err)
          }
        }

        // Menyimpan foto baru
        const fotoName = `${createId()}.${foto.extname}`
        const targetPath = join('public', 'images', 'dokters')

        await foto.move(targetPath, {
          name: fotoName,
          overwrite: true,
        })

        // Memperbarui foto path
        dokter.foto = `images/dokters/${fotoName}`
      }

      // Update data dokter tanpa mengubah foto jika tidak ada foto baru
      dokter.merge(data)
      await dokter.save()

      return response.json({ success: true, message: 'Dokter berhasil diperbarui!', dokter, redirectUrl: '/dokter' })
    }
  }


  async updateStatus({ params, request, response }: HttpContext) {
    const dokter = await Dokter.findOrFail(params.id)
    dokter.status = request.input('status')
    console.log(dokter.status)
    await dokter.save()
    return response.json({ success: true, message: 'Status berhasil diperbarui!', dokter });
  }

  async updateHari({ params, request, response }: HttpContext) {
    const dokter = await Dokter.findOrFail(params.id)
    const jadwalHari = request.input('jadwalHari')
    if (!Array.isArray(jadwalHari)) {
      return response.badRequest({ success: false, message: 'Jadwal hari harus berupa array' })
    }
    dokter.jadwalHari = JSON.stringify(jadwalHari)
    await dokter.save()
    return response.json({ success: true, message: 'Jadwal berhasil diperbarui!', dokter });
  }
  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    if (params.id_spesialist) {
      const spesialist = await Spesialist.findOrFail(params.id_spesialist)
      await spesialist.delete()
      return response.json({ success: true, message: 'Pengguna berhasil dihapus!', spesialist, redirectUrl: '/dokter' });
    } else if (params.id_dokter) {
      const dokter = await Dokter.findOrFail(params.id_dokter)
      await dokter.delete()
      return response.json({ success: true, message: 'Pengguna berhasil dihapus!', dokter, redirectUrl: '/dokter' });
    }
  }
}
