import Pasien from '#models/pasien'
import type { HttpContext } from '@adonisjs/core/http'

export default class PasiensController {
  /**
   * Display a list of resource
   */
  async index({ view, auth }: HttpContext) {
    const pasien = await Pasien.query()
      .where('id', auth.user?.id || 0)
      .preload('jenisPenyakit')
      .firstOrFail()

    return view.render('pengguna/index', { pasien })
  }

  /**
   * Display form to create a new record
   */
  async create({ }: HttpContext) { }

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) { }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) { }

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) { }

  /**
   * Handle form submission for the edit action
   */
  async update({ params }: HttpContext) { }

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) { }
}