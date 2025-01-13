import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Obat from '#models/obat'

export default class Jadwal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare obatId: number

  @column()
  declare waktu: JSON

  @column()
  declare tanggalSelesai: Date

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Obat)
  declare obats: HasMany<typeof Obat>

  @beforeCreate()
  public static async generateUuid(jadwal: Jadwal) {
    jadwal.uuid = uuidv4()
  }
}
