import fs from 'node:fs'
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrImage from 'qr-image'
import NumberHelper from '#services/number_service'
import Message from '#models/message'

let socket: any

export async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('whatsappAuth')
    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      qrTimeout: 15000,
      browser: Browsers.windows('Desktop'),
      syncFullHistory: true,
    })

    socket.ev.on('creds.update', saveCreds)
    socket.ev.on('connection.update', (update: any) => {
      console.log('Connection update:', update)
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        console.log(
          'Connection closed due to ',
          lastDisconnect.error,
          ', reconnecting ',
          shouldReconnect
        )
        if (shouldReconnect) {
          connectToWhatsApp()
        }
      } else if (connection === 'open') {
        console.log('Opened connection')
      }
    })
  } catch (error) {
    console.error('Failed to connect to WhatsApp:', error)
    throw new Error('WhatsApp connection failed')
  }

  return socket
}

export async function getQrCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const cacheDir = './whatsappAuth'
    const sessionExists = fs.existsSync(cacheDir) && fs.readdirSync(cacheDir).length > 0

    if (sessionExists) {
      return resolve('You are already logged in')
    }

    if (!socket) {
      return reject('Socket not connected')
    }

    socket.ev.on('connection.update', (update: any) => {
      console.log('Connection update:', update)
      const { qr } = update
      if (qr) {
        console.log('QR Code updated')
        const imageBuffer = qrImage.imageSync(qr, { type: 'png' })
        const base64Image = imageBuffer.toString('base64')

        return resolve(base64Image)
      }
    })
  })
}

export async function getStatus() {
  socket.ev.on('connection.update', (update: any) => {
    console.log('Connection update:', update)
    const { connection } = update
    if (connection === 'open') {
      return 'Connected'
    } else if (connection === 'close') {
      return 'Closed'
    }
  })
}

async function saveMessage(sender: string, text: string) {
  try {
    await Message.create({
      sender,
      message: text,
    })
    console.log('Pesan berhasil disimpan')
  } catch (error) {
    console.error('Gagal menyimpan pesan:', error)
  }
}

export async function upsert() {
  socket.ev.on('messages.upsert', async ({ messages }: { messages: any[] }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe) {
        const sender = msg.key.remoteJid
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

        console.log(`Pesan dari ${sender}: ${text}`)

        // Simpan ke database jika perlu
        await saveMessage(sender, text)
      }
    }
  })
}


export async function sendMsg(number: string, message: string) {
  const NumberFormatted = NumberHelper(number)
  const jid = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }
  // send a simple text!
  const sentMsg = await socket.sendMessage(jid, { text: message })

  if (!sentMsg) {
    console.log('Failed to send message')
  }
  console.log('Sent message:', sentMsg)

  return sentMsg
}

export async function logoutWhatsapp() {
  try {
    const cacheDir = 'whatsappAuth'

    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir)

      files.forEach((file) => {
        const filePath = `${cacheDir}/${file}`
        fs.unlinkSync(filePath) // Delete each file
      })

      console.log('Session files cleared')
    } else {
      console.log('Cache directory does not exist')
    }
    connectToWhatsApp()
    return true
  } catch (error) {
    console.log('Error during logout:', error)
    return false
  }
}
