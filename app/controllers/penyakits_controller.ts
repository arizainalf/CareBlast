/* eslint-disable no-unsafe-finally */
import { HttpContext } from '@adonisjs/core/http'
import JenisPenyakit from '#models/jenis_penyakit'
import { inject } from '@adonisjs/core'

@inject()
export default class PenyakitController {
  private perPage = 5

  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const penyakits = await JenisPenyakit.query()
      .orderBy('created_at', 'desc')
      .paginate(page, this.perPage)

    return view.render('obat/index', {
      title: 'Data Obat & Penyakit',
      penyakits,
      activeTab: 'penyakit',
    })
  }

  async store({ request, response, session }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await JenisPenyakit.create({
          nama: request.input('nama'),
          deskripsi: request.input('deskripsi'),
        })
        session.flash('success', 'Data penyakit berhasil ditambahkan')
      },
      session,
      response
    )
  }

  async update({ request, response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        const penyakit = await JenisPenyakit.findByOrFail('uuid', params.uuid)
        penyakit.merge({
          nama: request.input('nama'),
          deskripsi: request.input('deskripsi'),
        })
        await penyakit.save()
        session.flash('success', 'Data penyakit berhasil diperbarui')
      },
      session,
      response
    )
  }

  async destroy({ response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        const penyakit = await JenisPenyakit.findByOrFail('uuid', params.uuid)
        await penyakit.delete()
        session.flash('success', 'Data penyakit berhasil dihapus')
      },
      session,
      response
    )
  }

  async search({ request, response }: HttpContext) {
    const searchQuery = request.input('search', '')
    const page = request.input('page', 1)

    const penyakits = await JenisPenyakit.query()
      .if(searchQuery, (query) => query.where('nama', 'LIKE', `%${searchQuery}%`))
      .orderBy('created_at', 'desc')
      .paginate(page, this.perPage)

    return response.json({ penyakits })
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
