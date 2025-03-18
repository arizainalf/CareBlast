// import type { HttpContext } from '@adonisjs/core/http'

import { getQrCode, getAllMessagesByNumber, contacts , logoutWhatsapp, getStatus, sendMsg, sendFile } from '#services/whatsapp_service'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

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

  public async getChat({response, params}: HttpContext){
    const messages = await getAllMessagesByNumber(params.number);
    return response.json({
      status: 'success',
      messages
    })
  }

  public async createMsg({ view }: HttpContext) {
    return view.render('messages/create')
  }

  public async getContacts({response}: HttpContext){
    const contact = await contacts()
    return response.json({
      status: 'success',
      contact
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
