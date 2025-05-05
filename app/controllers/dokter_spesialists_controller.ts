import Dokter from '#models/dokter'
import Spesialist from '#models/spesialist'
import type { HttpContext } from '@adonisjs/core/http'

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
      const { nip, nama, spesialist_id, jam_mulai, jam_selesai, status, no_whatsapp } = request.all()
      console.log(no_whatsapp)
      const dokter = await Dokter.create({
        nip,
        nama,
        noWhatsapp: no_whatsapp,
        spesialistId: spesialist_id,
        jamMulai: jam_mulai,
        jamSelesai: jam_selesai,
        status,
      })
      return response.json({ success: true, message: 'Dokter berhasil disimpan!', dokter });

    } else if (request.input('jenis') === 'spesialist') {
      const { nama, gelar } = request.all()
      const spesialist = await Spesialist.create({
        nama,
        gelar,
      })
      return response.json({ success: true, message: 'Spesialis berhasil disimpan!', spesialist });

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
      console.log('be update spesialist')
      const spesialist = await Spesialist.findOrFail(params.id_spesialist)
      const data = request.only(['nama', 'gelar'])
      spesialist.merge(data)
      await spesialist.save()
      return response.json({ success: true, message: 'Pengguna berhasil diperbarui!', spesialist });
    } else if (params.id_dokter) {
      console.log('be update spesialist')
      const dokter = await Dokter.findOrFail(params.id_dokter)
      const data = request.only(['nama', 'nip', 'spesialist_id', 'jam_mulai', 'jam_selesai', 'status', 'no_whatsapp'])
      dokter.merge(data)
      await dokter.save()
      return response.json({ success: true, message: 'Pengguna berhasil diperbarui!', dokter });
    }

  }

  async updateStatus({ params, request, response }: HttpContext) {
    const dokter = await Dokter.findOrFail(params.id)
    dokter.status = request.input('status')
    console.log(dokter.status)
    await dokter.save()
    return response.json({ success: true, message: 'Status berhasil diperbarui!', dokter });
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    if (params.id_spesialist) {
      const spesialist = await Spesialist.findOrFail(params.id_spesialist)
      await spesialist.delete()
      return response.json({ success: true, message: 'Pengguna berhasil dihapus!', spesialist });
    } else if (params.id_dokter) {
      const dokter = await Dokter.findOrFail(params.id_dokter)
      await dokter.delete()
      return response.json({ success: true, message: 'Pengguna berhasil dihapus!', dokter });
    }
  }
}
