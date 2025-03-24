import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Messages from '#models/message'


export default class Contact extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare waId: string

  @column()
  declare username: string

  @column()
  declare name: string

  @column()
  declare profilePicture: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Messages)
  declare messagess: HasMany<typeof Messages>

  @beforeCreate()
  public static assignUuid(contact: Contact) {
    contact.id = uuidv4() // Generate UUID untuk ID unik
  }
}