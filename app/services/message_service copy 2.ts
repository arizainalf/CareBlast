import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import { saveContact } from '#services/contact_service'
import { saveGroup } from '#services/group_service'
import { groupMetadata } from '#services/whatsapp_service'
import { MessageType } from '../enum/message_type.js'

const MESSAGES_FILE = './messages.json'

export async function saveMessages(socket: any, message: any) {
  const { key, messageTimestamp, pushName, message: msgContent } = message
  const myNumber = await socket.user?.id
  let contactId
  let groupId
  let from
  let fromType
  let to
  let toType

  if (key.remoteJid.endsWith('@g.us') && key.fromMe) {
    console.log('if pertama')
    const metadata = await groupMetadata(key.remoteJid)
    to = await saveGroup(key.remoteJid, metadata)
    from = await saveContact(myNumber, pushName)
    fromType = MessageType.CONTACT
    toType = MessageType.GROUP
  } else if (key.remoteJid.endsWith('@g.us')) {
    console.log('if kedua')
    const metadata = await groupMetadata(key.remoteJid)
    to = await saveGroup(key.remoteJid, metadata)
    from = await saveContact(key.participant, pushName)
    fromType = MessageType.CONTACT
    toType = MessageType.GROUP
  } else if (key.fromMe === true) {
    console.log('if ketiga')
    from = await saveContact(myNumber, pushName)
    to = await saveContact(key.remoteJid, pushName)
    fromType = MessageType.CONTACT
    toType = MessageType.CONTACT
  } else {
    console.log('if keempat')
    from = await saveContact(key.remoteJid, pushName)
    to = await saveContact(myNumber, pushName)
    fromType = MessageType.CONTACT
    toType = MessageType.CONTACT
  }

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || ''

  const messageType = msgContent ? Object.keys(msgContent)[0] : 'unknown'

  let data = {
    key, from, to, pushName: key.fromMe ? 'Saya (Owner)' : (pushName || 'Unknown'),
    messageId: key.id ?? '', messageType, content: msgContent, timestamp: messageTimestamp,
    text, isHasilLab: false
  }

  const existingMessage = await Message.findBy('message_id', key.id)

  if (!existingMessage) {
    try {
      await Message.create({
        from,
        fromType,
        to,
        toType,
        messageId: key.id ?? '',
        messageType, content: text,
        timestamp: DateTime.fromSeconds(Number(messageTimestamp)),
      })
      console.log(`Message saved: ${key.id}`)
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  await saveFile(MESSAGES_FILE, data, 'messages')
}
