// import type { HttpContext } from '@adonisjs/core/http'

import { getQrCode, logoutWhatsapp, getStatus, sendMsg } from '#services/whatsapp_service'
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
  public async createMsg({ view }: HttpContext) {
    return view.render('messages/create')
  }
  public async sendMsg({ request, response }: HttpContext) {
    const number = request.input('number')
    const message = request.input('message')
    const responseMsg = await sendMsg(number, message)
    return response.json(responseMsg)
  }
}
