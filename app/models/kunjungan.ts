import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Pasien from '#models/pasien'
import { v4 as uuidv4 } from 'uuid'

export default class Kunjungan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare pasienId: number

  @hasMany(() => Pasien)
  declare pasiens: HasMany<typeof Pasien>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  public static async generateUuid(kunjungan: Kunjungan) {
    kunjungan.uuid = uuidv4()
  }
}
