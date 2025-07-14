import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Pengaturan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare namaAplikasi: string

  @column()
  declare deskripsi: string | null

  @column()
  declare logo: string | null

  @column()
  declare puskesmas: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}