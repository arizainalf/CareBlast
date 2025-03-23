import { makeWASocket, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys'
import fs from 'fs'
import qrImage from 'qr-image'
import { Boom } from '@hapi/boom'
import { NumberHelper } from '#services/number_service'
import Contact from '#models/contact'
import path from 'path'
import HasilLab from '#models/hasil_lab'
import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import { saveMessages } from '#services/message_service'

let socket: any
let sendingFile = false;
let sentFileMessages = new Set<string>();

export async function connectToWhatsApp() {
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
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== 401
      if (shouldReconnect) connectToWhatsApp()
    }
  })

  socket.ev.on('messages.upsert', async (message: { messages: any[] }) => {
    const m = message.messages[0]
    await saveMessages(m)
    saveFile('./messages.json', m, 'messages')
  })

  if (!sentFileMessages) {
    sentFileMessages = new Set();
  }
  sendingFile = false;

  // Event untuk menangkap pesan yang kita kirim
  socket.ev.on('messages.update', async (message: any[]) => {
    const m = message[0];

    // Skip processing if this is a file message we just sent
    if (sentFileMessages && m.key.id && sentFileMessages.has(m.key.id)) {
      console.log('Skipping messages.update for file message:', m.key.id);
      // Remove from set after processing
      sentFileMessages.delete(m.key.id);
      return;
    }

    saveMessages(m)
    saveFile('./messages.json', m, 'messages')
  });

  return socket
}

export async function getQrCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject('Socket not connected')

    socket.ev.on('connection.update', (update: any) => {
      const { qr } = update
      if (qr) {
        const imageBuffer = qrImage.imageSync(qr, { type: 'png' })
        return resolve(imageBuffer.toString('base64'))
      }
    })
  })
}

export async function getProfilePicture(jid: string) {
  try {
    return await socket.profilePictureUrl(jid, 'image') || 'https://placehold.co/150/orange/white'
  } catch {
    return 'https://placehold.co/150/orange/white'
  }
}

export async function isRegisteredWhatsapp(number: string): Promise<{ isRegistered: boolean, username: string | null }> {
  const jid = `${number}@s.whatsapp.net`
  const result = await socket.onWhatsApp(jid)
  return { isRegistered: result?.length > 0, username: result?.[0]?.verifiedName || null }
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

export async function sendFile(jid: string, file: any, caption: string, name: string) {
  const NumberFormatted = NumberHelper(jid)
  const no = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const isRegistered = await isRegisteredWhatsapp(jid)
  if (!isRegistered.isRegistered) {
    throw new Error('Nomor tidak terdaftar di WhatsApp')
  }
  if (!file) {
    throw new Error('No file uploaded')
  }

  // Check if contact exists and create if needed
  const existingContact = await Contact.findBy('wa_id', no)

  if (!existingContact) {
    const pp = await getProfilePicture(no)

    await Contact.create({
      waId: no,
      username: isRegistered.username ?? '',
      name,
      profilePicture: pp
    })
  }

  // Sanitize filename: replace spaces with underscores
  const sanitizedFileName = file.clientName.replace(/\s+/g, '_')

  // Path untuk menyimpan file
  const uploadDir = path.join(__dirname, '../../uploads') // Folder uploads/
  const uploadPath = path.join(uploadDir, sanitizedFileName) // Path lengkap file dengan nama yang telah disanitasi

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  await file.move(uploadDir, {
    name: sanitizedFileName,
    overwrite: true // Optional: overwrite if file already exists
  })

  if (!fs.existsSync(uploadPath)) {
    throw new Error('File upload failed')
  }

  const fileBuffer = fs.readFileSync(uploadPath)

  try {
    // Set a flag to indicate this is a file being sent
    // We'll use this flag in the messages.update event handler
    sendingFile = true;

    const sentMsg = await socket.sendMessage(no, {
      document: fileBuffer,
      fileName: sanitizedFileName, // Use sanitized filename here as well
      mimetype: file.headers['content-type'],
      caption: caption,
    })

    // Store the message ID to be skipped in messages.update
    if (!sentFileMessages) {
      sentFileMessages = new Set();
    }
    sentFileMessages.add(sentMsg.key.id);

    // After sending, clear the flag
    sendingFile = false;

    // Store the result in HasilLab with sanitized filename
    await HasilLab.create({
      waId: no,
      name: name,
      messageId: sentMsg.key.id,
      fileName: sanitizedFileName, // Store sanitized filename
      filePath: uploadPath,
      caption: caption
    })

    const contact = await Contact.findBy('wa_id', no)
    const contactId = contact?.id
    const groupId = null
    // Manually create the message record since we're skipping messages.update
    await Message.create({
      contactId: contactId,
      groupId: groupId,
      messageId: sentMsg.key.id,
      messageType: 'documentMessage',
      content: caption,
      timestamp: DateTime.now(),
      isHasilLab: true,
      fileName: sanitizedFileName, // Store sanitized filename
      filePath: uploadPath,
    })

    return sentMsg;
  } catch (error) {
    // Clear the flag in case of error
    sendingFile = false;
    console.log('Error di service:', error)
    throw error;  // Re-throw to propagate error to the caller
  }
}

export async function groupMetadata(jid: any) {
  const metadata = await socket.groupMetadata(jid)
  return metadata
}