import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import { saveContact } from '#services/contact_service'
import { saveGroup } from '#services/group_service'
import { groupMetadata } from '#services/whatsapp_service'

const MESSAGES_FILE = './messages.json'

export async function saveMessages(message: any) {
  const { key, messageTimestamp, pushName, message: msgContent } = message
  let contactId: string | undefined = undefined
  let groupId: string | null = null

  if (key.remoteJid === 'status@broadcast') {
    console.log('skipping status@broadcast')
    return
  }

  if (key.remoteJid.endsWith('@g.us')) {
    console.log('if')
    const metadata = await groupMetadata(key.remoteJid)
    contactId = (await saveContact(key.participant, pushName)) ?? undefined
    groupId = await saveGroup(key.remoteJid, metadata)
  } else {
    if (key.fromMe === true) {
      contactId = await saveContact(key.remoteJid, null) ?? undefined
    } else {
      contactId = await saveContact(key.remoteJid, pushName) ?? undefined
    }
    groupId = null
  }

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
  console.log('existingMessage', DateTime.fromSeconds(Number(messageTimestamp)))

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
      console.log(`Message saved: ${key.id}`)
    } catch (error) {
      console.error('Error saving message:', error)
      console.log('message sudah ada')
    }
  }

  await saveFile(MESSAGES_FILE, data, 'messages')
}
