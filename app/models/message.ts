import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Contact from '#models/contact'
import Group from '#models/group'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare contactId: string

  @column()
  declare fromMe: boolean

  @column()
  declare messageId: string

  @column()
  declare messageType: string

  @column()
  declare content: any

  @column.dateTime()
  declare timestamp: DateTime

  @column()
  declare groupId: string | null

  @column()
  declare isNotif: boolean | null

  @column()
  declare isHasilLab: boolean

  @column()
  declare fileName: string | null

  @column()
  declare filePath: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contact)
  declare contact: BelongsTo<typeof Contact>

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @beforeCreate()
  public static async generateUuid(message: Message) {
    message.id = uuidv4()
  }

}
