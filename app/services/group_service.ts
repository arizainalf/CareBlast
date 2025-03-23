import Group from '#models/group'
import { DateTime } from 'luxon'
import { getProfilePicture } from '#services/whatsapp_service'

export async function saveGroup(jid: string, metadata: any) {
  const groupData = {
    groupJid: metadata.id,
    groupName: metadata.subject,
    ownerJid: metadata.owner || '',
    participants: JSON.stringify(metadata.participants || ''),
    profilePicture: await getProfilePicture(jid) || null,
    subjectUpdatedBy: metadata.subjectOwner || '',
    subjectUpdatedAt: metadata.subjectTime ? DateTime.fromMillis(Number(metadata.subjectTime)) : DateTime.now(),
  }

  const existingGroup = await Group.findBy('group_jid', metadata.id)

  if (!existingGroup) {
    const group = await Group.create(groupData)
    console.log(`[+] Grup Baru Disimpan: ${metadata.subject}`)
    return group?.id
  } else {
    console.log(`[!] Grup Sudah Ada: ${metadata.subject}`)
    return existingGroup?.id
  }
}
