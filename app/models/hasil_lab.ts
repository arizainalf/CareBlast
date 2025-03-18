import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class HasilLab extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare waId: string

  @column()
  declare name: string

  @column()
  declare fileName: string

  @column()
  declare filePath: string

  @column()
  declare caption: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}