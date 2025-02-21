/* eslint-disable no-unsafe-finally */
import { HttpContext } from '@adonisjs/core/http'
import Obat from '#models/obat'
import { inject } from '@adonisjs/core'

@inject()
export default class ObatsController {
  private perPage = 5

  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const obats = await Obat.query().orderBy('created_at', 'desc').paginate(page, this.perPage)

    return view.render('obat/index', {
      title: 'Data Obat & Penyakit',
      obats,
      activeTab: 'obat',
    })
  }

  async store({ request, response, session }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await Obat.create({
          nama: request.input('nama'),
          dosis: request.input('dosis'),
        })
        session.flash('success', 'Data obat berhasil ditambahkan')
      },
      session,
      response
    )
  }

  async update({ request, response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        const obat = await Obat.findByOrFail('uuid', params.uuid)
        obat.merge({
          nama: request.input('nama'),
          dosis: request.input('dosis'),
        })
        await obat.save()
        session.flash('success', 'Data obat berhasil diperbarui')
      },
      session,
      response
    )
  }

  async destroy({ response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        const obat = await Obat.findByOrFail('uuid', params.uuid)
        await obat.delete()
        session.flash('success', 'Data obat berhasil dihapus')
      },
      session,
      response
    )
  }

  async search({ request, response }: HttpContext) {
    const searchQuery = request.input('search', '')
    const page = request.input('page', 1)

    const obats = await Obat.query()
      .if(searchQuery, (query) => query.where('nama', 'LIKE', `%${searchQuery}%`))
      .orderBy('created_at', 'desc')
      .paginate(page, this.perPage)

    return response.json({ obats })
  }

  private async handleDatabaseOperation(operation: Function, session: any, response: any) {
    try {
      await operation()
    } catch (error) {
      console.error(error)
      session.flash('error', 'Terjadi kesalahan saat memproses data')
    } finally {
      return response.redirect().back()
    }
  }
}
