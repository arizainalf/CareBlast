import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare from: string

  @column()
  declare messageId: string

  @column()
  declare messageType: string

  @column()
  declare content: any

  @column()
  declare isSent: boolean
  
  @column.dateTime()
  declare timestamp: DateTime

  @column()
  declare groupJid: string

  @column()
  declare groupName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static async generateUuid(message: Message) {
    message.id = uuidv4()
  }
}