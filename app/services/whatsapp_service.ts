/* eslint-disable @typescript-eslint/naming-convention */
import { makeWASocket, useMultiFileAuthState, Browsers } from 'baileys'
import fs from 'node:fs'
import qrImage from 'qr-image'
import { Boom } from '@hapi/boom'
import { formatWhatsappNumber, NumberHelper } from '#services/number_service'
import Contact from '#models/contact'
import path from 'node:path'
import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import { saveMessages } from '#services/message_service'
import { fileURLToPath } from 'node:url'
import { cuid } from '@adonisjs/core/helpers'
import { checkContact } from './contact_service.js'

let socket: any
let sendingFile = false
let sentFileMessages = new Set<string>()
let processedMessages = new Set<string>() // Track processed messages
let isReconnecting = false

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cleanup sets periodically to prevent memory leaks
setInterval(() => {
  if (processedMessages.size > 500) {
    processedMessages.clear()
    console.log('Processed messages cache cleared')
  }
  if (sentFileMessages.size > 100) {
    sentFileMessages.clear()
    console.log('Sent file messages cache cleared')  
  }
}, 5 * 60 * 1000) // Every 5 minutes

// Generate unique identifier for message
function getMessageId(message: any): string {
  const remoteJid = message.key?.remoteJid || ''
  const messageId = message.key?.id || ''
  const fromMe = message.key?.fromMe || false
  const timestamp = message.messageTimestamp || Date.now()
  
  return `${remoteJid}_${messageId}_${fromMe}_${timestamp}`
}

// Check if message already processed
function isMessageAlreadyProcessed(message: any, eventType: string): boolean {
  const identifier = `${eventType}_${getMessageId(message)}`
  
  if (processedMessages.has(identifier)) {
    console.log(`[SKIP] ${eventType} already processed:`, message.key?.id)
    return true
  }
  
  processedMessages.add(identifier)
  return false
}

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

  socket.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== 401

      if (shouldReconnect && !isReconnecting) {
        isReconnecting = true
        console.log('Connection closed, reconnecting...')
        
        // Clear caches on reconnect
        processedMessages.clear()
        sentFileMessages.clear()
        
        await connectToWhatsApp()
        isReconnecting = false
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened')
      isReconnecting = false
    }
  })

  // Handle new messages (incoming)
  socket.ev.on('messages.upsert', async (message: { messages: any[] }) => {
    try {
      // Process all messages in the batch
      for (const m of message.messages) {
        // Skip if already processed
        if (isMessageAlreadyProcessed(m, 'upsert')) {
          continue
        }

        // Skip sent file messages
        if (sentFileMessages.has(m.key?.id)) {
          console.log('[SKIP] Sent file message upsert:', m.key?.id)
          sentFileMessages.delete(m.key?.id)
          continue
        }

        console.log('[UPSERT] Processing message:', m.key?.id)

        const contactExists = checkContact(m.key?.remoteJid)
        if (!contactExists) {
          console.log('[UPSERT] No contact found for:', m.key?.remoteJid)
          continue
        }

        await saveMessages(m)
        saveFile('./messages.json', m, 'messages')
        
        console.log('[UPSERT] Message saved:', m.key?.id)
      }
    } catch (error) {
      console.error('[ERROR] messages.upsert:', error)
    }
  })

  // Handle message updates (status changes, delivery receipts, etc.)
  socket.ev.on('messages.update', async (messages: any[]) => {
    try {
      for (const m of messages) {
        if (!m.update) {
          console.log('[UPDATE] No update field, skipping:', m.key?.id)
          continue
        }

        const messageId = m.key?.id
        if (!messageId) {
          console.log('[UPDATE] No message ID, skipping')
          continue
        }

        // Skip if already processed THIS UPDATE
        if (isMessageAlreadyProcessed(m, 'update')) {
          continue
        }

        // Skip sent file messages
        if (sentFileMessages.has(messageId)) {
          console.log('[SKIP] Sent file message update:', messageId)
          sentFileMessages.delete(messageId)
          continue
        }

        const contactExists = checkContact(m.key?.remoteJid)
        if (!contactExists) {
          console.log('[UPDATE] No contact found for:', m.key?.remoteJid)
          continue
        }

        console.log('[UPDATE] Processing update for:', messageId, m.update)

        // Check if this is a status update or content update
        if (m.update.status || m.update.readStatus) {
          // Handle status updates (delivered, read, etc.)
          await updateMessageStatus(m)
          console.log('[UPDATE] Status updated for:', messageId)
        } else {
          // Handle content updates (message edits, reactions, etc.)
          const saved = await saveMessages(m)
          console.log('[UPDATE] Content updated:', saved)
        }

        saveFile('./messages-updates.json', m, 'message-updates')
      }
    } catch (error) {
      console.error('[ERROR] messages.update:', error)
    }
  })

  // Initialize sets
  if (!sentFileMessages) {
    sentFileMessages = new Set()
  }

  sendingFile = false

  socket.ev.on('messaging-history.set', (history: any) => {
    console.log('[HISTORY] Messages loaded:', history.messages?.length || 0)
    saveFile('./history.json', history, 'messages')
  })

  return socket
}

// Function to update message status only
async function updateMessageStatus(messageUpdate: any) {
  try {
    const messageId = messageUpdate.key?.id
    
    // Find existing message in database
    const existingMessage = await Message.query()
      .where('message_id', messageId)
      .first()

    if (existingMessage) {
      let hasChanges = false

      // Update delivery status
      if (messageUpdate.update.status && messageUpdate.update.status !== existingMessage.status) {
        existingMessage.status = messageUpdate.update.status
        hasChanges = true
      }

           if (hasChanges) {
        await existingMessage.save()
        console.log('[STATUS] Updated message status:', messageId)
      }

      return existingMessage
    } else {
      console.log('[STATUS] Message not found for status update:', messageId)
      return null
    }
  } catch (error) {
    console.error('[ERROR] updateMessageStatus:', error)
    throw error
  }
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

export async function getProfilePicture(jid: string) {
  try {
    return (await socket.profilePictureUrl(jid, 'image')) || 'https://placehold.co/150/orange/white'
  } catch {
    return 'https://placehold.co/150/orange/white'
  }
}

export async function isRegisteredWhatsapp(
  number: string
): Promise<{ isRegistered: boolean; username: string | null }> {
  const NumberFormatted = NumberHelper(number)
  const jid = `${NumberFormatted}@s.whatsapp.net`
  console.log('Nomor:', jid)
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
        fs.unlinkSync(filePath)
      })

      console.log('Session files cleared')
    } else {
      console.log('Cache directory does not exist')
    }
    
    // Clear caches
    processedMessages.clear()
    sentFileMessages.clear()
    
    connectToWhatsApp()
    return true
  } catch (error) {
    console.log('Error during logout:', error)
    return false
  }
}

export async function getStatus() {
  return socket?.isConnected || false
}

export async function sendMsg(number: string, message: string, isNotif: boolean = false) {
  if (!socket) {
    throw new Error('Socket not connected')
  }
  
  let waId
  console.log('[SEND] Number:', number)
  
  if (number.endsWith('@s.whatsapp.net')) {
    waId = number.split('@')[0]
  }
  
  const NumberFormatted = NumberHelper(waId ? waId : number)
  const jid = formatWhatsappNumber(NumberFormatted)

  try {
    sendingFile = true
    const sentMsg = await socket.sendMessage(jid, { text: message })
    
    // Track sent message to avoid processing in updates
    if (sentMsg.key?.id) {
      sentFileMessages.add(sentMsg.key.id)
      
      // Auto cleanup after 30 seconds
      setTimeout(() => {
        sentFileMessages.delete(sentMsg.key.id)
      }, 30000)
    }

    console.log('[SEND] Message sent:', sentMsg.key?.id)

    const contact = await Contact.findBy('wa_id', jid)
    const contactId = contact?.id

    const messageType = Object.keys(sentMsg.message || {})[0]
    const timestampUnix = sentMsg.messageTimestamp?.toNumber() || Math.floor(Date.now() / 1000)
    const timestamp = DateTime.fromSeconds(timestampUnix)
    
    // Create message record
    const msgCreate = await Message.create({
      contactId: contactId,
      fromMe: true,
      messageId: sentMsg.key.id,
      messageType: messageType,
      content: message,
      timestamp,
      isNotif,
      isHasilLab: false,
    })

    sendingFile = false
    return msgCreate
  } catch (error) {
    console.log('[ERROR] sendMsg:', error)
    sendingFile = false
    throw error
  }
}

function delay(minMs: number = 3000, maxMs: number = 5000): Promise<void> {
  const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, randomMs));
}


export async function sendBulkMessage(numbers: string[], message: string) {
  const results = []

  for (const number of numbers) {
    try {
      const result = await sendMsg(number, message)
      results.push({ number, success: true, data: result })
    } catch (error) {
      console.error(`[ERROR] Bulk send to ${number}:`, error)
      results.push({ number, success: false, error: error.message })
    }

    // Wait before sending to next number
    await delay()
  }

  return results
}

export async function sendFile(jid: string, file: any, caption: string) {
  let waId
  console.log('[FILE] JID:', jid)
  
  if (jid.endsWith('@s.whatsapp.net')) {
    waId = jid.split('@')[0]
  }
  
  const NumberFormatted = NumberHelper(waId ? waId : jid)
  const no = formatWhatsappNumber(NumberFormatted)

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const isRegistered = await isRegisteredWhatsapp(jid)
  if (!isRegistered.isRegistered) {
    throw new Error('Nomor tidak terdaftar di WhatsApp')
  }
  
  if (!file) {
    throw new Error('Tidak ada file yang di upload')
  }

  const sanitizedFileName = cuid() + path.extname(file.clientName || 'file')
  const uploadDir = path.join(__dirname, '../../storage/uploads')
  const uploadPath = path.join(uploadDir, sanitizedFileName)

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  await file.move(uploadDir, {
    name: sanitizedFileName,
    overwrite: true,
  })

  if (!fs.existsSync(uploadPath)) {
    throw new Error('File upload failed')
  }

  const fileBuffer = fs.readFileSync(uploadPath)

  try {
    sendingFile = true

    const sentMsg = await socket.sendMessage(no, {
      document: fileBuffer,
      fileName: sanitizedFileName,
      mimetype: file.headers['content-type'],
      caption: caption,
    })

    // Track sent file message
    if (sentMsg.key?.id) {
      sentFileMessages.add(sentMsg.key.id)
      
      // Auto cleanup after 30 seconds
      setTimeout(() => {
        sentFileMessages.delete(sentMsg.key.id)
      }, 30000)
    }

    const contact = await Contact.findBy('wa_id', no)
    const contactId = contact?.id
    
    // Create message record
    await Message.create({
      contactId: contactId,
      fromMe: true,
      messageId: sentMsg.key.id,
      messageType: 'documentMessage',
      content: caption,
      timestamp: DateTime.now(),
      isHasilLab: true,
      fileName: sanitizedFileName,
      filePath: `storage/uploads/${sanitizedFileName}`,
    })

    sendingFile = false
    console.log('[FILE] File sent:', sentMsg.key?.id)
    
    return sentMsg
  } catch (error) {
    sendingFile = false
    console.log('[ERROR] sendFile:', error)
    throw error
  }
}

export async function groupMetadata(jid: any) {
  const metadata = await socket.groupMetadata(jid)
  return metadata
}