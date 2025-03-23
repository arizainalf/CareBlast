// import type { HttpContext } from '@adonisjs/core/http'

import { getQrCode, logoutWhatsapp, getStatus, sendMsg, sendFile } from '#services/whatsapp_service'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Message from '#models/message'
import Contact from '#models/contact'

@inject()
export default class WhatsappsController {
  async showqr({ view }: HttpContext) {
    return view.render('dashboard/index')
  }

  async getQrCode({ response }: HttpContext) {
    console.log('requesting qr code from service')
    const qrCode = await getQrCode()
    return response.json({
      status: 'success',
      qrCode,
    })
  }

  async status({ response }: HttpContext) {
    const connected = await getStatus()
    return response.json({
      status: 'success',
      connected,
    })
  }

  async logout({ response }: HttpContext) {
    await logoutWhatsapp()
    return response.json({
      status: 'success',
    })
  }

  public async createMsg({ view }: HttpContext) {
    return view.render('messages/create')
  }

  public async getAllHasilLab({response}: HttpContext){
    const hasil = await Message.findManyBy('is_hasil_lab', true)
    const contact = await Contact.all()
    console.log('cek', hasil)
    return response.json({
      status: 'success',
      hasil,
    })
  }

  public async getHasilLab({response, params}:HttpContext){

    console.log(params)

    const message = await Message.findBy('id', params.uuid)
    return response.json({
      status: 'success',
      message
    })
  }

  public async sendFile({ request, response, view }: HttpContext) {
    if (request.method() === 'GET') {
      return view.render('hasil-lab/index')
    }

    const jid = request.input('nomor')
    const file = request.file('file')
    const caption = request.input('caption', '')
    const name = request.input('nama')

    if (!jid || !file) {
      return response.badRequest({ message: 'Nomor WA dan file wajib diisi' })
    }

    try {

      const responseMsg = await sendFile(jid, file, caption, name)

      return response.json({ success: true, message: 'Hasil Lab Telah Terkirim!' , data: responseMsg })
    } catch (error) {
      console.log('error di controller')
      return response.badRequest({ success: false, message: 'Error controller Gagal mengirim file ' + error })
    }
  }


  public async sendMsg({ request, response }: HttpContext) {
    const number = request.input('number')
    const message = request.input('message')
    const responseMsg = await sendMsg(number, message)
    return response.json(responseMsg)
  }
}
