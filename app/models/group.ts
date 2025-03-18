import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'

export default class Group extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare groupJid: string

  @column()
  declare groupName: string

  @column()
  declare ownerJid: string | null

  @column()
  declare participants: string | null // JSON untuk menyimpan anggota grup

  @column()
  declare profilePicture: string | null

  @column()
  declare isGroup: boolean

  @column()
  declare subjectUpdatedBy: string | null

  @column.dateTime()
  declare subjectUpdatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(group: Group) {
    group.id = uuidv4() // Generate UUID untuk ID unik
  }
}