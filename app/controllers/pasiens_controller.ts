import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'

export default class PasiensController {
  /**
   * Display a list of resource
   */
  async index({ view }: HttpContext) {
    const pasien = await Pasien.all()
    return view.render('pages/pasien/data-pasien', { pasien })
  }

  /**
   * Handle form submission for the create action
   */
  // async store({ request }: HttpContext) {}

  /**
   * Show individual record
   */
  // async show({ params }: HttpContext) {}

  /**
   * Edit individual record
   */
  // async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  // async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  // async destroy({ params }: HttpContext) {}
}
