import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import Contact from '#models/contact'

const MESSAGES_FILE = './messages.json'

export async function saveMessages(message: any, isFrom: boolean = false) {
  const { key, messageTimestamp, pushName, message: msgContent } = message
  let contactId: string | undefined = undefined
  let groupId: string | null = null

  if (key.remoteJid === 'status@broadcast') {
    console.log('Message service: skipping status@broadcast')
    return
  }

  const contact = await Contact.query().where('wa_id', key.remoteJid).first()

  contactId = contact?.id

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || ''

  const messageType = msgContent ? Object.keys(msgContent)[0] : 'unknown'

  let data = {
    key, contactId, groupId, pushName: key.fromMe ? 'Saya (Owner)' : (pushName || 'Unknown'),
    messageId: key.id ?? '', messageType, content: msgContent, timestamp: messageTimestamp,
    text, isHasilLab: false
  }

  const existingMessage = await Message.findBy('message_id', key.id)


  if (!existingMessage) {
    try {
      await Message.create({
        contactId: contactId,
        groupId: groupId || null,
        fromMe: key.fromMe,
        messageId: key.id ?? '',
        messageType, content: text,
        timestamp: DateTime.fromSeconds(Number(messageTimestamp)),
      })
      console.log(`Message service: Message saved: ${key.id}`)
      return 
    } catch (error) {
      console.error('Message service: Error saving message:', error)
      console.log('Message service: message sudah ada')
    }
  }

  await saveFile(MESSAGES_FILE, data, 'messages')
  return
}
